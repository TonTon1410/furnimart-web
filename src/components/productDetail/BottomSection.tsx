import React, { useState } from "react";
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

const BottomSection: React.FC<BottomSectionProps> = ({ related, product }) => {
  const [activeTab, setActiveTab] = useState<"desc" | "detail">("desc");

  return (
    <>
      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab("desc")}
            className={`flex-1 py-3 text-center font-semibold transition ${
              activeTab === "desc"
                ? "border-b-2 border-emerald-600 text-emerald-600"
                : "text-gray-500 hover:text-emerald-600"
            }`}
          >
            Mô tả
          </button>
          <button
            onClick={() => setActiveTab("detail")}
            className={`flex-1 py-3 text-center font-semibold transition ${
              activeTab === "detail"
                ? "border-b-2 border-emerald-600 text-emerald-600"
                : "text-gray-500 hover:text-emerald-600"
            }`}
          >
            Thông tin chi tiết
          </button>
        </div>

        <div className="p-6">
          {activeTab === "desc" ? (
            <p className="text-lg leading-relaxed text-gray-700">
              {product.description || "Không có mô tả cho sản phẩm này."}
            </p>
          ) : (
            <div className="grid md:grid-cols-2 gap-6 text-gray-700">
              {/* Vật liệu & Danh mục */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Vật liệu & Danh mục
                </h3>
                {/* Vật liệu */}
                <div className="mb-4">
                  <div className="font-medium mb-2">Vật liệu</div>
                  {product.materials && product.materials.length > 0 ? (
                    <div className="flex flex-wrap gap-3">
                      {product.materials.map((m) => (
                        <div
                          key={m.id}
                          className="flex items-center gap-2 border border-gray-200 bg-gray-50 p-2 rounded-lg"
                          title={m.materialName}
                        >
                          <img
                            src={m.image}
                            alt={m.materialName}
                            className="h-10 w-10 object-cover rounded"
                          />
                          <span className="text-sm font-medium">
                            {m.materialName}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span>-</span>
                  )}
                </div>

                {/* Danh mục */}
                <div>
                  <span className="font-medium">Danh mục: </span>
                  <span>{product.categoryName || "-"}</span>
                </div>
              </div>

              {/* Kích thước */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Kích thước
                </h3>
                <ul className="space-y-2 text-sm">
                  <li>
                    <b>Chiều cao:</b> {product.height ?? "-"} cm
                  </li>
                  <li>
                    <b>Chiều rộng:</b> {product.width ?? "-"} cm
                  </li>
                  <li>
                    <b>Chiều dài/sâu:</b> {product.length ?? "-"} cm
                  </li>
                  <li>
                    <b>Trọng lượng:</b> {product.weight ?? "-"} kg
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Related products */}
      <div className="mt-12">
        <h2 className="mb-6 text-xl font-bold text-gray-900">
          Bạn có thể thích
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {related.map((item) => (
            <div
              key={item.id}
              className="transition transform hover:-translate-y-1 hover:shadow-lg rounded-lg bg-white"
            >
              <ProductCard
                data={{
                  id: item.id,
                  slug: item.slug,
                  description: item.name,
                  price: item.price,
                  thumbnailImage: item.thumbnailImage,
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default BottomSection;
