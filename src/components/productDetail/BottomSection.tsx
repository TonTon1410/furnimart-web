import React from "react";

interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  height?: number;
  width?: number;
  length?: number;
  weight?: number;
  categoryName?: string;
  materialName?: string;
  images: string[];
}

interface BottomSectionProps {
  related: Product[];
  product: Product;
}

const BottomSection: React.FC<BottomSectionProps> = ({ related, product }) => {
  return (
    <div className="bg-white mt-10">
      {/* Mô tả */}
      <div className="mb-10">
        <h2 className="text-2xl font-bold mb-4">Mô tả</h2>
        <p className="text-gray-700 text-xl leading-relaxed">
          {product.description || "Không có mô tả cho sản phẩm này."}
        </p>
      </div>

      {/* Chi tiết */}
      <div className="grid grid-cols-2 gap-16 text-lg">
        <div>
          <h2 className="text-2xl font-bold mb-4">Vật liệu & Danh mục</h2>
          <div className="mb-3 flex">
            <span className="w-40 text-gray-600 text-lg">Vật liệu</span>
            <span className="font-medium text-lg">{product.materialName || "-"}</span>
          </div>
          <div className="mb-3 flex">
            <span className="w-40 text-gray-600 text-lg">Danh mục</span>
            <span className="font-medium text-lg">{product.categoryName || "-"}</span>
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold mb-4">Kích thước</h2>
          <div className="mb-3 flex">
            <span className="w-40 text-gray-600 text-lg">Chiều cao</span>
            <span className="font-medium text-lg">{product.height ?? "-"} in</span>
          </div>
          <div className="mb-3 flex">
            <span className="w-40 text-gray-600 text-lg">Chiều rộng</span>
            <span className="font-medium text-lg">{product.width ?? "-"} in</span>
          </div>
          <div className="mb-3 flex">
            <span className="w-40 text-gray-600 text-lg">Chiều dài/sâu</span>
            <span className="font-medium text-lg">{product.length ?? "-"} in</span>
          </div>
          <div className="flex">
            <span className="w-40 text-gray-600 text-lg">Trọng lượng</span>
            <span className="font-medium text-lg">{product.weight ?? "-"} kg</span>
          </div>
        </div>
      </div>

      {/* Bạn có thể thích */}
      <div className="mt-16">
        <h2 className="text-2xl font-bold mb-4 text-center">Bạn có thể thích</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {related.map((item) => (
            <div key={item.id} className="text-center">
              <img
                src={item.images?.[0] || "/placeholder.png"}
                alt={item.name}
                className="w-40 h-40 mx-auto object-contain mb-2"
              />
              <p>{item.name}</p>
              <p className="font-semibold">${item.price}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BottomSection;
