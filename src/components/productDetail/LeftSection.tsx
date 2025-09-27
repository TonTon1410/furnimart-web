import React, { useState } from "react";
import { CheckCircle } from "lucide-react";
import { authService } from "@/service/authService";
import { useCartStore } from "@/store/cart";
import { useNavigate } from "react-router-dom";

interface Color {
  id: string;
  colorName: string;
  hexCode: string;
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
const pistachio = "oklch(85.2% 0.199 91.936)";
const fmtVND = (n: number) =>
  new Intl.NumberFormat("vi-VN").format(n) + " ₫";

const LeftSection: React.FC<LeftSectionProps> = ({
  product,
  selectedColorId,
  onColorChange,
}) => {
  const [quantity, setQuantity] = useState(1);
  const [activeBtn, setActiveBtn] = useState<string | null>(null);
  const [hoverBtn, setHoverBtn] = useState<string | null>(null);
  const [added, setAdded] = useState(false);

  const add = useCartStore((s) => s.add);
  const navigate = useNavigate();

  const handleAddToCart = async () => {
    setActiveBtn("cart");

    if (!authService.isAuthenticated()) {
      alert("Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng!");
      navigate("/login");
      return;
    }

    try {
      const colorId =
        selectedColorId ||
        (product.color.length === 1 ? product.color[0].id : null);
      if (!colorId) {
        alert("Vui lòng chọn màu trước khi thêm vào giỏ hàng!");
        return;
      }
      await add(product.id, quantity, colorId);
      setAdded(true);
      setTimeout(() => setAdded(false), 1800);
    } catch (err) {
      console.error("Add to cart error:", err);
      alert("Có lỗi xảy ra khi thêm vào giỏ hàng!");
    } finally {
      setTimeout(() => setActiveBtn(null), 180);
    }
  };

  return (
    <div className="relative p-4">
      {/* Tên + giá */}
      <div className="mb-4">
        <h1 className="text-3xl font-bold text-gray-900">
          {product.name}
        </h1>
        <p className="mt-2 text-2xl font-semibold text-amber-600">
          {fmtVND(product.price)}
        </p>
      </div>

      {/* Màu sắc */}
      <div className="mb-6">
        <div className="mb-3 text-2xl font-bold text-gray-900">
          Màu sắc
        </div>
        <div className="flex flex-wrap gap-3">
          {product.color.map((c) => (
            <button
              key={c.id}
              onClick={() => onColorChange(c.id)}
              aria-label={`Chọn màu ${c.colorName}`}
              title={c.colorName}
              className={`h-10 w-10 rounded-full border-2 ring-0 transition hover:scale-[1.03] focus:outline-none focus:ring-2 focus:ring-emerald-500 ${selectedColorId === c.id
                  ? "border-emerald-600"
                  : "border-gray-300"
                }`}
              style={{ backgroundColor: c.hexCode }}
            />
          ))}
        </div>
      </div>

      {/* Nút AR / 3D */}
      <div className="mt-4 flex w-4/5 items-center justify-between space-x-1">
        <button
          type="button"
          className={`flex-1 px-5 py-2 text-base font-semibold text-white transition-colors rounded-md ${activeBtn === '3d' ? 'ring-4 ring-amber-400' : ''}`}
          style={{ backgroundColor: activeBtn === '3d' ? '#FFC107' : forest }}
          onClick={() => {
            setActiveBtn("3d");
            setTimeout(() => setActiveBtn(null), 180);
          }}
        >
          Xem 3D
        </button>
        <button
          type="button"
          className={`flex-1 px-5 py-2 text-base font-semibold text-white transition-colors rounded-md ${activeBtn === 'ar' ? 'ring-4 ring-amber-400' : ''}`}
          style={{ backgroundColor: activeBtn === 'ar' ? '#FFC107' : forest }}
          onClick={() => {
            setActiveBtn("ar");
            setTimeout(() => setActiveBtn(null), 180);
          }}
        >
          Xem AR
        </button>
      </div>

      {/* Số lượng + Thêm giỏ */}
      <div className="mt-6 flex w-4/5 items-center justify-between space-x-1">
        <div
          className="flex items-center border border-emerald-200 rounded-md"
          style={{ backgroundColor: forest, color: 'white' }}
          role="group"
        >
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="px-4 py-2 text-base font-semibold hover:bg-emerald-700/80 rounded-l-md"
            style={{ backgroundColor: forest, color: 'white' }}
          >
            −
          </button>
          <span className="px-5 text-base font-semibold" style={{ backgroundColor: forest, color: 'white' }}>{quantity}</span>
          <button
            type="button"
            onClick={() => setQuantity((q) => q + 1)}
            className="px-4 py-2 text-base font-semibold hover:bg-emerald-700/80 rounded-r-md"
            style={{ backgroundColor: forest, color: 'white' }}
          >
            +
          </button>
        </div>

        <button
          type="button"
          onClick={handleAddToCart}
          className={`flex-1 px-5 py-2 text-base font-semibold text-white transition-colors rounded-md ${activeBtn === 'cart' ? 'ring-4 ring-amber-400' : ''}`}
          style={{
            backgroundColor: activeBtn === 'cart' ? '#FFC107' : forest,
            minWidth: 160,
          }}
        >
          Thêm vào giỏ hàng
        </button>
      </div>


      {/* Toast */}
      {added && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-emerald-600 px-5 py-3 text-white shadow-lg">
          <CheckCircle className="h-5 w-5 text-white" />
          <span>Thêm sản phẩm vào giỏ hàng thành công</span>
        </div>
      )}
    </div>
  );
};

export default LeftSection;
