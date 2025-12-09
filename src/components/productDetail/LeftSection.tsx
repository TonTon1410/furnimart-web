// src/components/productDetail/LeftSection.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  CheckCircle,
  ShoppingCart,
  MapPin,
  Phone,
  Package,
} from "lucide-react";
import { authService } from "@/service/authService";
import { useCartStore } from "@/store/cart";
import { useNavigate } from "react-router-dom";
import ConfirmAddToCartModal, {
  type Color as ModalColor,
} from "../ConfirmAddToCartModal";
import inventoryService from "@/service/inventoryService";
import storeService from "@/service/storeService";
import { useToast } from "@/context/ToastContext";

interface ProductColor {
  id: string;
  color: {
    id: string;
    colorName: string;
    hexCode: string;
  };
  images?: { id: string; image: string }[];
  models3D?: {
    status: string;
    modelUrl: string;
    format: string;
    previewImage?: string;
  }[];
  status: string;
}

interface Material {
  id: number;
  image: string;
  materialName: string;
  description: string | null;
  status: string;
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  height: number;
  width: number;
  length: number;
  weight: number;
  categoryName: string;
  categoryId: number;
  productColors?: ProductColor[];
  materials?: Material[];
}

interface StoreAvailability {
  storeId: string;
  storeName: string;
  storeAddress: string;
  addressLine: string;
  storePhone: string;
  totalAvailable: number;
}

interface LeftSectionProps {
  product: Product;
  selectedColorId: string | null;
  onColorChange: (id: string) => void;
  availableStock: number | null;
}

const fmtVND = (n: number) => new Intl.NumberFormat("vi-VN").format(n) + " ₫";

const LeftSection: React.FC<LeftSectionProps> = ({
  product,
  selectedColorId,
  onColorChange,
  availableStock,
}) => {
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [openConfirm, setOpenConfirm] = useState(false);
  const [storeAvailability, setStoreAvailability] = useState<
    StoreAvailability[]
  >([]);
  const [loadingStores, setLoadingStores] = useState(false);
  const [selectedStore, setSelectedStore] = useState<StoreAvailability | null>(
    null
  );
  const [showStoreDetail, setShowStoreDetail] = useState(false);

  const add = useCartStore((s) => s.add);
  const navigate = useNavigate();
  const { showToast } = useToast();

  // Fetch store availability when color is selected
  useEffect(() => {
    if (!selectedColorId) {
      setStoreAvailability([]);
      return;
    }

    const fetchStoreAvailability = async () => {
      try {
        setLoadingStores(true);

        // Lấy tất cả vị trí chứa sản phẩm màu này
        const locationsRes = await inventoryService.getAllStockLocations(
          selectedColorId
        );
        const locationsData = locationsRes?.data?.data;

        if (!locationsData?.locations || locationsData.locations.length === 0) {
          setStoreAvailability([]);
          setLoadingStores(false);
          return;
        }

        // Group by storeId and calculate total available
        const storeMap = new Map<
          string,
          { available: number; warehouseIds: Set<string> }
        >();

        for (const loc of locationsData.locations) {
          // Lấy storeId từ location response
          const storeId = loc.storeId;

          if (!storeId) continue; // Skip nếu không có storeId

          if (!storeMap.has(storeId)) {
            storeMap.set(storeId, { available: 0, warehouseIds: new Set() });
          }

          const storeData = storeMap.get(storeId)!;
          storeData.available += loc.available;
          storeData.warehouseIds.add(loc.warehouseId);
        }

        // Fetch store details for each unique storeId
        const storePromises = Array.from(storeMap.entries()).map(
          async ([storeId, data]) => {
            try {
              const storeRes = await storeService.getStoreById(storeId);
              const store = storeRes?.data?.data;

              if (!store) return null;

              // Tìm BRANCH_MANAGER phone
              const branchManager = store.users?.find(
                (u: { role: string; phone?: string }) =>
                  u.role === "BRANCH_MANAGER"
              );
              const phone = branchManager?.phone || "Chưa có SĐT";

              // Build address
              const addressParts = [
                store.street,
                store.ward,
                store.district,
                store.city,
              ].filter(Boolean);
              const address =
                addressParts.length > 0
                  ? addressParts.join(", ")
                  : "Chưa có địa chỉ";

              return {
                storeId: store.id,
                storeName: store.name,
                storeAddress: address,
                addressLine: store.addressLine || "",
                storePhone: phone,
                totalAvailable: data.available,
              } as StoreAvailability;
            } catch (err) {
              console.error(`Error fetching store ${storeId}:`, err);
              return null;
            }
          }
        );

        const stores = (await Promise.all(storePromises)).filter(
          Boolean
        ) as StoreAvailability[];

        // Sort by availability descending
        stores.sort((a, b) => b.totalAvailable - a.totalAvailable);

        setStoreAvailability(stores);
      } catch (err) {
        console.error("Error fetching store availability:", err);
        setStoreAvailability([]);
      } finally {
        setLoadingStores(false);
      }
    };

    fetchStoreAvailability();
  }, [selectedColorId]);

  // Chuyển dữ liệu productColors sang định dạng của modal
  const modalColors: ModalColor[] = useMemo(
    () =>
      (product.productColors || []).map((pc) => ({
        id: pc.id,
        colorName: pc.color.colorName,
        hexCode: pc.color.hexCode,
        images: pc.images?.map((img) => img.image).filter(Boolean) ?? [],
      })),
    [product.productColors]
  );

  const handleOpenConfirm = () => {
    if (!authService.isAuthenticated()) {
      showToast({
            type: "warning",
            title: "Lưu Ý",
            description: "Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng!",
          });
      navigate("/login");
      return;
    }
    setOpenConfirm(true);
  };

  const handleConfirmAdd = async ({
    quantity: confirmQty,
    productColorId,
  }: {
    quantity: number;
    productColorId: string | null;
  }) => {
    try {
      let finalColorId = productColorId;
      if (
        !finalColorId &&
        product.productColors &&
        product.productColors.length === 1
      ) {
        finalColorId = product.productColors[0].id;
      }
      if (!finalColorId) {
        showToast({
            type: "error",
            title: "Thất Bại",
            description: "Vui lòng chọn màu!",
          });
        return;
      }

      // finalColorId chính là productColorId (id của productColor)
      await add(finalColorId, confirmQty);

      setQuantity(confirmQty);
      if (selectedColorId !== finalColorId) onColorChange(finalColorId);

      setOpenConfirm(false);
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } catch (err) {
      console.error("Add to cart error:", err);
      showToast({
            type: "error",
            title: "Lỗi!",
            description: "Có lỗi xảy ra khi thêm vào giỏ hàng!",
          });
    }
  };

  const handleStoreClick = (store: StoreAvailability) => {
    setSelectedStore(store);
    setShowStoreDetail(true);
  };

  return (
    <div className="relative p-3 md:p-6 space-y-3 md:space-y-4">
      {/* Tên + giá */}
      <div className="space-y-2 md:space-y-3">
        <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 leading-tight">
          {product.name}
        </h1>
        <div className="flex items-center gap-3 flex-wrap">
          <p className="text-3xl md:text-4xl font-extrabold bg-linear-to-r from-emerald-500 to-green-600 bg-clip-text text-transparent">
            {fmtVND(product.price)}
          </p>

          {/* Hiển thị tồn kho inline với giá */}
          {selectedColorId && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium bg-linear-to-r from-gray-50 to-gray-100 border border-gray-200">
              {availableStock === null ? (
                <span className="text-gray-600">Đang kiểm tra...</span>
              ) : availableStock > 0 ? (
                <>
                  <span className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></span>
                  <span className="text-green-700">
                    Còn {availableStock} sp
                  </span>
                </>
              ) : (
                <>
                  <span className="h-2 w-2 bg-red-500 rounded-full"></span>
                  <span className="text-red-700">Hết hàng</span>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Màu sắc - Di chuyển lên trên */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-base md:text-lg font-semibold text-gray-900">
            Chọn màu sắc
          </h3>
          {selectedColorId && (
            <span className="text-sm text-gray-600">
              {
                (product.productColors || []).find(
                  (pc) => pc.id === selectedColorId
                )?.color.colorName
              }
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {(product.productColors || []).map((pc) => (
            <button
              key={pc.id}
              onClick={() => onColorChange(pc.id)}
              aria-label={`Chọn màu ${pc.color.colorName}`}
              title={pc.color.colorName}
              className={`relative h-12 w-12 md:h-14 md:w-14 rounded-xl border-2 shadow-sm transition-all hover:scale-110 ${
                selectedColorId === pc.id
                  ? "border-emerald-600 ring-4 ring-emerald-100 scale-110"
                  : "border-gray-300 hover:border-emerald-300"
              }`}
            >
              <span
                className="block h-full w-full rounded-lg"
                {...({
                  style: { backgroundColor: pc.color.hexCode },
                } as React.HTMLAttributes<HTMLSpanElement>)}
              />
              {selectedColorId === pc.id && (
                <CheckCircle className="absolute -top-1 -right-1 h-5 w-5 text-emerald-600 bg-white rounded-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Thông tin nhanh - Thu gọn */}
      <div className="grid grid-cols-2 gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
        <div className="space-y-0.5">
          <p className="text-xs text-gray-500 uppercase tracking-wide">
            Danh mục
          </p>
          <p className="text-sm font-semibold text-gray-900">
            {product.categoryName}
          </p>
        </div>
        <div className="space-y-0.5">
          <p className="text-xs text-gray-500 uppercase tracking-wide">
            Vật liệu
          </p>
          <p
            className="text-sm font-semibold text-gray-900 line-clamp-1"
            title={
              product.materials && product.materials.length > 0
                ? product.materials.map((m) => m.materialName).join(", ")
                : "Chưa cập nhật"
            }
          >
            {product.materials && product.materials.length > 0
              ? product.materials.map((m) => m.materialName).join(", ")
              : "Chưa cập nhật"}
          </p>
        </div>
        <div className="space-y-0.5">
          <p className="text-xs text-gray-500 uppercase tracking-wide">
            Kích thước
          </p>
          <p className="text-sm font-semibold text-gray-900">
            {product.length} × {product.width} × {product.height} cm
          </p>
        </div>
        <div className="space-y-0.5">
          <p className="text-xs text-gray-500 uppercase tracking-wide">
            Trọng lượng
          </p>
          <p className="text-sm font-semibold text-gray-900">
            {product.weight} kg
          </p>
        </div>
      </div>

      {/* Nút Thêm giỏ hàng */}
      <button
        onClick={handleOpenConfirm}
        disabled={
          !selectedColorId || availableStock === null || availableStock === 0
        }
        className={`w-full rounded-lg md:rounded-xl py-3 md:py-3.5 px-4 md:px-6 text-base md:text-lg font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2 md:gap-3 ${
          !selectedColorId || availableStock === null || availableStock === 0
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-linear-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
        }`}
      >
        <ShoppingCart className="h-5 w-5 md:h-6 md:w-6" />
        <span>
          {!selectedColorId
            ? "Vui lòng chọn màu"
            : availableStock === null
            ? "Đang kiểm tra..."
            : availableStock === 0
            ? "Hết hàng"
            : "Thêm vào giỏ hàng"}
        </span>
      </button>

      {/* Store Availability - Thu gọn hơn */}
      {selectedColorId && storeAvailability.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm md:text-base font-semibold text-gray-900 flex items-center gap-2">
            <MapPin className="h-4 w-4 text-emerald-600" />
            Còn hàng tại cửa hàng
          </h3>

          {loadingStores ? (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-600"></div>
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {storeAvailability.map((store) => (
                <div
                  key={store.storeId}
                  onClick={() => handleStoreClick(store)}
                  className="p-3 border border-gray-200 rounded-lg hover:border-emerald-300 hover:shadow-md transition-all bg-white cursor-pointer"
                >
                  <div className="flex items-center justify-between gap-3">
                    <h4 className="font-semibold text-gray-900 text-sm flex-1 truncate">
                      {store.storeName}
                    </h4>

                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 shrink-0">
                      <Package className="h-3.5 w-3.5 text-emerald-600" />
                      <span className="text-xs font-semibold text-emerald-700">
                        {store.totalAvailable}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal chi tiết cửa hàng */}
      {showStoreDetail && selectedStore && (
        <div
          className="fixed inset-0 z-100 flex items-center justify-center bg-black/50 px-3"
          onClick={() => setShowStoreDetail(false)}
        >
          <div
            className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between">
              <h3 className="text-xl font-bold text-gray-900">
                {selectedStore.storeName}
              </h3>
              <button
                onClick={() => setShowStoreDetail(false)}
                className="rounded-lg p-1 hover:bg-gray-100 transition-colors"
                aria-label="Đóng"
              >
                <svg
                  className="w-5 h-5 text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              {/* Số lượng còn hàng */}
              <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                <span className="text-sm font-medium text-gray-700">
                  Số lượng còn hàng
                </span>
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-emerald-600" />
                  <span className="text-lg font-bold text-emerald-700">
                    {selectedStore.totalAvailable} sản phẩm
                  </span>
                </div>
              </div>

              {/* Địa chỉ */}
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <MapPin className="h-5 w-5 mt-0.5 shrink-0 text-emerald-600" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900 mb-1">
                      Địa chỉ
                    </p>
                    {selectedStore.addressLine && (
                      <p className="text-sm text-gray-700 font-medium">
                        {selectedStore.addressLine}
                      </p>
                    )}
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {selectedStore.storeAddress}
                    </p>
                  </div>
                </div>
              </div>

              {/* Số điện thoại */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Phone className="h-5 w-5 shrink-0 text-emerald-600" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900 mb-1">
                      Số điện thoại
                    </p>
                    <a
                      href={`tel:${selectedStore.storePhone}`}
                      className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                    >
                      {selectedStore.storePhone}
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowStoreDetail(false)}
              className="mt-6 w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors"
            >
              Đóng
            </button>
          </div>
        </div>
      )}

      {/* Modal */}
      <ConfirmAddToCartModal
        open={openConfirm}
        onClose={() => setOpenConfirm(false)}
        onConfirm={handleConfirmAdd}
        productName={product.name}
        price={product.price}
        colors={modalColors}
        initialColorId={
          selectedColorId ||
          (product.productColors && product.productColors.length === 1
            ? product.productColors[0].id
            : null)
        }
        initialQty={quantity}
      />

      {/* Toast */}
      {added && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-3 text-white shadow-lg animate-bounce">
          <CheckCircle className="h-5 w-5" />
          <span>Đã thêm vào giỏ hàng</span>
        </div>
      )}
    </div>
  );
};

export default LeftSection;
