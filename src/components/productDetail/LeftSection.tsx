// src/components/productDetail/LeftSection.tsx
import React, { useMemo, useState } from "react";
import { CheckCircle, ShoppingCart } from "lucide-react";
import { authService } from "@/service/authService";
import { useCartStore } from "@/store/cart";
import { useNavigate } from "react-router-dom";
import ConfirmAddToCartModal, {
  type Color as ModalColor,
} from "../ConfirmAddToCartModal";

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

  const add = useCartStore((s) => s.add);
  const navigate = useNavigate();

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
      alert("Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng!");
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
        alert("Vui lòng chọn màu!");
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
      alert("Có lỗi xảy ra khi thêm vào giỏ hàng!");
    }
  };

  return (
    <div className="relative p-3 md:p-6 space-y-4 md:space-y-6">
      {/* Tên + giá */}
      <div className="space-y-3 md:space-y-4">
        <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 leading-tight">
          {product.name}
        </h1>
        <div className="flex items-baseline gap-3">
          <p className="text-3xl md:text-4xl font-extrabold bg-linear-to-r from-emerald-500 to-green-600 bg-clip-text text-transparent">
            {fmtVND(product.price)}
          </p>
        </div>

        {/* Hiển thị tồn kho */}
        {selectedColorId && (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium bg-linear-to-r from-gray-50 to-gray-100 border border-gray-200">
            {availableStock === null ? (
              <span className="text-gray-600">Đang kiểm tra tồn kho...</span>
            ) : availableStock > 0 ? (
              <>
                <span className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></span>
                <span className="text-green-700">
                  Còn {availableStock} sản phẩm
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

      {/* Thông tin nhanh */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 md:p-4 bg-gray-50 rounded-lg md:rounded-xl border border-gray-200">
        <div className="space-y-1">
          <p className="text-xs text-gray-500 uppercase tracking-wide">
            Danh mục
          </p>
          <p className="text-sm font-semibold text-gray-900">
            {product.categoryName}
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-gray-500 uppercase tracking-wide">
            Vật liệu
          </p>
          <p className="text-sm font-semibold text-gray-900">
            {product.materials && product.materials.length > 0
              ? product.materials.map((m) => m.materialName).join(", ")
              : "Chưa cập nhật"}
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-gray-500 uppercase tracking-wide">
            Kích thước
          </p>
          <p className="text-sm font-semibold text-gray-900">
            {product.length} × {product.width} × {product.height} cm
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-gray-500 uppercase tracking-wide">
            Trọng lượng
          </p>
          <p className="text-sm font-semibold text-gray-900">
            {product.weight} kg
          </p>
        </div>
      </div>

      {/* Màu sắc */}
      <div className="space-y-3 md:space-y-4">
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
        <div className="flex flex-wrap gap-3">
          {(product.productColors || []).map((pc) => (
            <button
              key={pc.id}
              onClick={() => onColorChange(pc.id)}
              aria-label={`Chọn màu ${pc.color.colorName}`}
              title={pc.color.colorName}
              className={`relative h-14 w-14 rounded-xl border-2 shadow-sm transition-all hover:scale-110 ${
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

      {/* Nút Thêm giỏ hàng */}
      <button
        onClick={handleOpenConfirm}
        disabled={
          !selectedColorId || availableStock === null || availableStock === 0
        }
        className={`w-full rounded-lg md:rounded-xl py-3 md:py-4 px-4 md:px-6 text-base md:text-lg font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2 md:gap-3 ${
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
