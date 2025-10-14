// src/components/productDetail/LeftSection.tsx
import React, { useMemo, useState } from "react";
import { CheckCircle, ShoppingCart } from "lucide-react";
import { authService } from "@/service/authService";
import { useCartStore } from "@/store/cart";
import { useNavigate } from "react-router-dom";
import ConfirmAddToCartModal, { type Color as ModalColor } from "../ConfirmAddToCartModal";

interface ProductColor {
  id: string;
  color: {
    id: string;
    colorName: string;
    hexCode: string;
  };
  images?: { id: string; image: string }[];
  models3D?: {
    image3d: string;
    status: string;
    modelUrl: string;
    format: string;
    sizeInMb: number;
    previewImage: string;
  }[];
  status: string;
}

interface Material {
  id: number;
  image: string;
  materialName: string;
  description: string;
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
  productColors: ProductColor[];
  materials: Material[];
}

interface LeftSectionProps {
  product: Product;
  selectedColorId: string | null;
  onColorChange: (id: string) => void;
}

const fmtVND = (n: number) =>
  new Intl.NumberFormat("vi-VN").format(n) + " ₫";

const LeftSection: React.FC<LeftSectionProps> = ({
  product,
  selectedColorId,
  onColorChange,
}) => {
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [openConfirm, setOpenConfirm] = useState(false);

  const add = useCartStore((s) => s.add);
  const navigate = useNavigate();

  // Chuyển dữ liệu productColors sang định dạng của modal
  const modalColors: ModalColor[] = useMemo(
    () =>
      product.productColors.map((pc) => ({
        id: pc.id,
        colorName: pc.color.colorName,
        hexCode: pc.color.hexCode,
        images:
          pc.images?.map((img) => img.image).filter(Boolean) ?? [],
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
    colorId,
  }: {
    quantity: number;
    colorId: string | null;
  }) => {
    try {
      let finalColorId = colorId;
      if (!finalColorId && product.productColors.length === 1) {
        finalColorId = product.productColors[0].id;
      }
      if (!finalColorId) {
        alert("Vui lòng chọn màu!");
        return;
      }

      await add(product.id, confirmQty, finalColorId);

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
    <div className="relative p-4">
      {/* Tên + giá */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
        <p className="mt-3 text-3xl font-extrabold bg-gradient-to-r from-emerald-500 to-green-600 bg-clip-text text-transparent">
          {fmtVND(product.price)}
        </p>
      </div>

      {/* Màu sắc */}
      <div className="mb-8">
        <div className="mb-3 text-xl font-semibold text-gray-900">Màu sắc</div>
        <div className="flex flex-wrap gap-3">
          {product.productColors.map((pc) => (
            <button
              key={pc.id}
              onClick={() => onColorChange(pc.id)}
              aria-label={`Chọn màu ${pc.color.colorName}`}
              title={pc.color.colorName}
              className={`h-12 w-12 rounded-full border-2 shadow-sm transition hover:scale-110 ${
                selectedColorId === pc.id
                  ? "border-emerald-600 ring-2 ring-emerald-400"
                  : "border-gray-300 hover:border-emerald-300"
              }`}
              style={{ backgroundColor: pc.color.hexCode }}
            />
          ))}
        </div>
      </div>

      {/* Số lượng + Giỏ hàng */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Bộ chọn số lượng */}
        <div className="flex items-center border border-gray-300 rounded-md h-12 w-[140px] sm:w-auto">
          <button
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="w-10 h-full flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-base font-bold"
          >
            −
          </button>
          <span className="min-w-[60px] text-center text-base font-semibold">
            {quantity}
          </span>
          <button
            onClick={() => setQuantity((q) => q + 1)}
            className="w-10 h-full flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-base font-bold"
          >
            +
          </button>
        </div>

        {/* Nút Thêm giỏ hàng */}
        <button
          onClick={handleOpenConfirm}
          className="rounded-md py-3 px-5 text-lg font-bold text-white shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98] bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 w-full sm:w-auto flex items-center justify-center gap-2"
        >
          <ShoppingCart className="h-5 w-5" />
          <span>Thêm vào giỏ hàng</span>
        </button>
      </div>

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
          (product.productColors.length === 1
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
