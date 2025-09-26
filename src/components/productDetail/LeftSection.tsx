import React, { useState } from "react";

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
  materials?: {
    id: number;
    image: string;
    materialName: string;
    description: string;
    status: string;
  }[];
}

const forest = "#095544";
const pistachio = "oklch(85.2% 0.199 91.936)";

const LeftSection: React.FC<{ product: Product }> = ({ product }) => {
  const [quantity, setQuantity] = useState(1);
  const [activeBtn, setActiveBtn] = useState<string | null>(null);
  const [hoverBtn, setHoverBtn] = useState<string | null>(null);

  // Thêm vào giỏ hàng
  const handleAddToCart = async () => {
    setActiveBtn("cart");
    try {
      const { cartService } = await import("@/service/cartService");
      await cartService.add(product.id, quantity);
      // Có thể thêm thông báo thành công ở đây nếu muốn
    } catch (e) {
      // Có thể thêm thông báo lỗi ở đây nếu muốn
      console.error(e);
    }
    setTimeout(() => setActiveBtn(null), 180);
  };

  return (
    <div className="bg-white">
      {/* Tên sản phẩm */}
      <h1 className="text-3xl font-bold mb-2">{product.name}</h1>

      {/* Giá */}
      <p className="text-2xl font-semibold mb-4 text-amber-500">{product.price.toLocaleString()} ₫</p>

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
          style={{ backgroundColor: activeBtn === "3d" || hoverBtn === "3d" ? pistachio : forest }}
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
          style={{ backgroundColor: activeBtn === "ar" || hoverBtn === "ar" ? pistachio : forest }}
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
        <div className="flex items-center px-3 py-2 text-white rounded" style={{ backgroundColor: forest }}>
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
          style={{ minWidth: 120, backgroundColor: activeBtn === "cart" || hoverBtn === "cart" ? pistachio : forest }}
          onClick={handleAddToCart}
          onMouseEnter={() => setHoverBtn("cart")}
          onMouseLeave={() => setHoverBtn(null)}
        >
          Thêm vào giỏ hàng
        </button>
      </div>
    </div>
  );
};

export default LeftSection;
