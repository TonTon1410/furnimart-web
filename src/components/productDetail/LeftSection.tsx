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

const forest = "#095544";
const pistachio = "oklch(85.2% 0.199 91.936)";

const LeftSection: React.FC<{ product: Product }> = ({ product }) => {
  const [quantity, setQuantity] = useState(1);
  const [activeBtn, setActiveBtn] = useState<string | null>(null);
  const [hoverBtn, setHoverBtn] = useState<string | null>(null);
  const [added, setAdded] = useState(false);

  const add = useCartStore((s) => s.add);
  const navigate = useNavigate();

  // Thêm vào giỏ hàng
  const handleAddToCart = async () => {
    setActiveBtn("cart");

    if (!authService.isAuthenticated()) {
      alert("Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng!");
      navigate("/login");
      return;
    }

    try {
      await add(product.id, quantity);
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } catch (err) {
      console.error("Add to cart error:", err);
      alert("Có lỗi xảy ra khi thêm vào giỏ hàng!");
    }

    setTimeout(() => setActiveBtn(null), 180);
  };

  return (
    <div className="bg-white relative">
      {/* Tên sản phẩm */}
      <h1 className="text-3xl font-bold mb-2">{product.name}</h1>

      {/* Giá */}
      <p className="text-2xl font-semibold mb-4 text-amber-500">
        {product.price.toLocaleString()} ₫
      </p>

      {/* Màu sắc */}
      <div className="flex space-x-4 mb-4">
        {product.color.map((c) => (
          <span
            key={c.id}
            className="w-10 h-10 rounded-full border-2 border-gray-300"
            title={c.colorName}
            style={{ backgroundColor: c.hexCode }}
          />
        ))}
      </div>

      {/* Nút AR / 3D */}
      <div className="flex space-x-4 mt-6">
        <button
          className="px-4 py-2 text-white rounded text-lg transition-colors"
          style={{
            backgroundColor:
              activeBtn === "3d" || hoverBtn === "3d" ? pistachio : forest,
          }}
          onClick={() => {
            setActiveBtn("3d");
            setTimeout(() => setActiveBtn(null), 180);
          }}
          onMouseEnter={() => setHoverBtn("3d")}
          onMouseLeave={() => setHoverBtn(null)}
        >
          Xem 3D
        </button>
        <button
          className="px-4 py-2 text-white rounded text-lg transition-colors"
          style={{
            backgroundColor:
              activeBtn === "ar" || hoverBtn === "ar" ? pistachio : forest,
          }}
          onClick={() => {
            setActiveBtn("ar");
            setTimeout(() => setActiveBtn(null), 180);
          }}
          onMouseEnter={() => setHoverBtn("ar")}
          onMouseLeave={() => setHoverBtn(null)}
        >
          Xem AR
        </button>
      </div>

      {/* Số lượng và nút giỏ hàng */}
      <div className="flex items-center mb-4 mt-4">
        <div
          className="flex items-center px-3 py-2 text-white rounded"
          style={{ backgroundColor: forest }}
        >
          <button
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            className="px-2 text-lg"
          >
            -
          </button>
          <span className="mx-2 text-lg font-semibold">{quantity}</span>
          <button
            onClick={() => setQuantity(quantity + 1)}
            className="px-2 text-lg"
          >
            +
          </button>
        </div>
        <div className="w-1" />
        <button
          className="px-4 py-2 text-white text-lg font-medium rounded transition-colors"
          style={{
            minWidth: 120,
            backgroundColor:
              activeBtn === "cart" || hoverBtn === "cart" ? pistachio : forest,
          }}
          onClick={handleAddToCart}
          onMouseEnter={() => setHoverBtn("cart")}
          onMouseLeave={() => setHoverBtn(null)}
        >
          Thêm vào giỏ hàng
        </button>
      </div>

      {/* Toast thông báo */}
      {added && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-white shadow-lg animate-slideUp">
          <CheckCircle className="h-5 w-5 text-white" />
          <span>Thêm sản phẩm vào giỏ hàng thành công</span>
        </div>
      )}
    </div>
  );
};

export default LeftSection;
