import React from "react";
import ProductCard from "../ProductCard";

interface Product {
  id: string;
  slug: string;
  name: string;
  description?: string;
  price: number;
  thumbnailImage: string;
  height?: number;
  width?: number;
  length?: number;
  weight?: number;
  categoryName?: string;
  materialName?: string;
  materials?: {
    id: number;
    image: string;
    materialName: string;
    description: string;
    status: string;
  }[];
}

interface BottomSectionProps {
  related: Product[];
  product: Product;
}

const BottomSection: React.FC<BottomSectionProps> = ({
  related,
  product,
}) => {
  return (
    <>
      {/* Khung mô tả + chi tiết */}
      <div className="border border-gray-300 bg-white p-6 shadow-sm">
        <div className="mb-8">
            <h2 className="mb-4 text-xl font-bold text-gray-900">Mô tả</h2>
          <p className="text-lg leading-relaxed text-gray-700">
            {product.description || "Không có mô tả cho sản phẩm này."}
          </p>
        </div>

          <div className="grid gap-10 md:grid-cols-2">
          {/* Vật liệu & Danh mục */}
          <div>
              <h2 className="mb-4 text-xl font-bold text-gray-900">
                Vật liệu & Danh mục
              </h2>

            {/* Vật liệu */}
            <div className="mb-4">
              <div className="mb-2 text-lg font-medium text-gray-700">
                Vật liệu
              </div>
              {product.materials && product.materials.length > 0 ? (
                <div className="flex flex-wrap gap-4">
                  {product.materials.map((m) => (
                    <div
                      key={m.id}
                      className="flex items-center gap-2 border border-gray-200 bg-gray-50 p-2"
                      title={m.materialName}
                    >
                      <img
                        src={m.image}
                        alt={m.materialName}
                        className="h-10 w-10 object-cover"
                      />
                      <span className="text-base font-medium text-gray-800">
                        {m.materialName}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <span className="text-lg font-medium text-gray-700">
                  -
                </span>
              )}
            </div>

            {/* Danh mục */}
            <div className="flex items-start gap-2">
              <span className="w-32 shrink-0 text-lg font-medium text-gray-700">
                Danh mục
              </span>
              <span className="text-lg font-semibold text-gray-800">
                {product.categoryName || "-"}
              </span>
            </div>
          </div>

          {/* Kích thước */}
          <div>
              <h2 className="mb-4 text-xl font-bold text-gray-900">
                Kích thước
              </h2>
            <ul className="space-y-3">
              <li className="flex items-start gap-2">
                <span className="w-32 shrink-0 text-lg font-medium text-gray-700">
                  Chiều cao
                </span>
                <span className="text-lg font-semibold text-gray-800">
                  {product.height ?? "-"} cm
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-32 shrink-0 text-lg font-medium text-gray-700">
                  Chiều rộng
                </span>
                <span className="text-lg font-semibold text-gray-800">
                  {product.width ?? "-"} cm
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-32 shrink-0 text-lg font-medium text-gray-700">
                  Chiều dài/sâu
                </span>
                <span className="text-lg font-semibold text-gray-800">
                  {product.length ?? "-"} cm
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-32 shrink-0 text-lg font-medium text-gray-700">
                  Trọng lượng
                </span>
                <span className="text-lg font-semibold text-gray-800">
                  {product.weight ?? "-"} kg
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bạn có thể thích */}
      <div className="mt-12">
        <h2 className="mb-6 text-left text-xl font-bold text-gray-900">
          Bạn có thể thích
        </h2>
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
          {related.map((item) => (
            <ProductCard
              key={item.id}
              data={{
                id: item.id,
                slug: item.slug,
                description: item.name,
                price: item.price,
                thumbnailImage: item.thumbnailImage,
              }}
            />
          ))}
        </div>
      </div>
    </>
  );
};

export default BottomSection;
