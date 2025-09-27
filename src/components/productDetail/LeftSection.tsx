// src/components/productDetail/LeftSection.tsx
import React, { useMemo, useState } from "react";
import { CheckCircle } from "lucide-react";
import { authService } from "@/service/authService";
import { useCartStore } from "@/store/cart";
import { useNavigate } from "react-router-dom";
import ConfirmAddToCartModal, {type Color as ModalColor } from "../ConfirmAddToCartModal";

interface Color {
  id: string;
  colorName: string;
  hexCode: string;
  images?: { image: string }[];
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
  materialName: string;
  color: Color[];
}
interface LeftSectionProps {
  product: Product;
  selectedColorId: string | null;
  onColorChange: (id: string) => void;
}

const forest = "#095544";
const fmtVND = (n: number) => new Intl.NumberFormat("vi-VN").format(n) + " ₫";

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

  // Chuẩn hoá danh sách màu + ảnh string[] để modal dùng trực tiếp
  const modalColors: ModalColor[] = useMemo(
    () =>
      product.color.map((c) => ({
        id: c.id,
        colorName: c.colorName,
        hexCode: c.hexCode,
        images: c.images?.map((img) => img.image).filter(Boolean) ?? [],
      })),
    [product.color]
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
      if (!finalColorId && product.color.length === 1) {
        finalColorId = product.color[0].id;
      }
      if (!finalColorId) {
        alert("Vui lòng chọn màu!");
        return;
      }

      await add(product.id, confirmQty, finalColorId);

      // đồng bộ UI
      setQuantity(confirmQty);
      if (selectedColorId !== finalColorId) onColorChange(finalColorId);

      setOpenConfirm(false);
      setAdded(true);
      setTimeout(() => setAdded(false), 1800);
    } catch (err) {
      console.error("Add to cart error:", err);
      alert("Có lỗi xảy ra khi thêm vào giỏ hàng!");
    }
  };

  return (
    <div className="relative p-4">
      {/* Tên + giá */}
      <div className="mb-4">
        <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
        <p className="mt-2 text-2xl font-semibold text-amber-600">
          {fmtVND(product.price)}
        </p>
      </div>

      {/* Màu sắc (chọn nhanh ngoài trang) */}
      <div className="mb-6">
        <div className="mb-3 text-2xl font-bold text-gray-900">Màu sắc</div>
        <div className="flex flex-wrap gap-3">
          {product.color.map((c) => (
            <button
              key={c.id}
              onClick={() => onColorChange(c.id)}
              aria-label={`Chọn màu ${c.colorName}`}
              title={c.colorName}
              className={`h-10 w-10 rounded-full border-2 ring-0 transition hover:scale-[1.03] focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                selectedColorId === c.id ? "border-emerald-600" : "border-gray-300"
              }`}
              style={{ backgroundColor: c.hexCode }}
            />
          ))}
        </div>
      </div>

      {/* AR / 3D (giữ nguyên nếu bạn xử lý riêng) */}
      <div className="mt-4 flex w-4/5 items-center justify-between space-x-1">
        <button
          type="button"
          className="flex-1 rounded-md px-5 py-2 text-base font-semibold text-white transition-colors hover:opacity-95"
          style={{ backgroundColor: forest }}
        >
          Xem 3D
        </button>
        <button
          type="button"
          className="flex-1 rounded-md px-5 py-2 text-base font-semibold text-white transition-colors hover:opacity-95"
          style={{ backgroundColor: forest }}
        >
          Xem AR
        </button>
      </div>

      {/* Số lượng + Thêm giỏ */}
      <div className="mt-6 flex w-4/5 items-center justify-between space-x-1">
        <div
          className="flex items-center rounded-md border border-emerald-200"
          style={{ backgroundColor: forest, color: "white" }}
          role="group"
        >
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="rounded-l-md px-4 py-2 text-base font-semibold hover:bg-emerald-700/80"
          >
            −
          </button>
          <span className="px-5 text-base font-semibold">{quantity}</span>
          <button
            type="button"
            onClick={() => setQuantity((q) => q + 1)}
            className="rounded-r-md px-4 py-2 text-base font-semibold hover:bg-emerald-700/80"
          >
            +
          </button>
        </div>

        <button
          type="button"
          onClick={handleOpenConfirm}
          className="flex-1 rounded-md px-5 py-2 text-base font-semibold text-white transition-colors hover:opacity-95"
          style={{ backgroundColor: forest, minWidth: 160 }}
        >
          Thêm vào giỏ hàng
        </button>
      </div>

      {/* Modal nhỏ gọn + có thể đổi màu trong modal */}
      <ConfirmAddToCartModal
        open={openConfirm}
        onClose={() => setOpenConfirm(false)}
        onConfirm={handleConfirmAdd}
        productName={product.name}
        price={product.price}
        colors={modalColors}
        initialColorId={selectedColorId || (product.color.length === 1 ? product.color[0].id : null)}
        initialQty={quantity}
      />

      {/* Toast */}
      {added && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-md bg-emerald-600 px-5 py-3 text-white shadow-lg">
          <CheckCircle className="h-5 w-5 text-white" />
          <span>Thêm sản phẩm vào giỏ hàng thành công</span>
        </div>
      )}
    </div>
  );
};

export default LeftSection;
