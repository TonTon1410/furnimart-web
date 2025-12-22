import React, { useState } from "react";
import ProductCard from "../ProductCard";
// Import component RatingSection vừa tạo
import RatingSection from "./RatingSection";

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
    description: string | null;
    status: string;
  }[];
}

interface BottomSectionProps {
  related: Product[];
  product: Product;
}

const BottomSection = React.memo<BottomSectionProps>(({ related, product }) => {
  // Thêm trạng thái "review" vào state activeTab
  const [activeTab, setActiveTab] = useState<"desc" | "detail" | "review">("desc");

  return (
    <>
      {/* Tabs */}
      <div className="bg-white rounded-lg md:rounded-xl border border-gray-200 shadow-sm">
        <div className="flex border-b overflow-x-auto">
          <button
            onClick={() => setActiveTab("desc")}
            className={`flex-1 min-w-[100px] py-2 md:py-3 text-sm md:text-base text-center font-semibold transition whitespace-nowrap ${
              activeTab === "desc"
                ? "border-b-2 border-emerald-600 text-emerald-600"
                : "text-gray-500 hover:text-emerald-600"
            }`}
          >
            Mô tả
          </button>
          <button
            onClick={() => setActiveTab("detail")}
            className={`flex-1 min-w-[120px] py-2 md:py-3 text-sm md:text-base text-center font-semibold transition whitespace-nowrap ${
              activeTab === "detail"
                ? "border-b-2 border-emerald-600 text-emerald-600"
                : "text-gray-500 hover:text-emerald-600"
            }`}
          >
            Thông tin chi tiết
          </button>
          <button
            onClick={() => setActiveTab("review")}
            className={`flex-1 min-w-[100px] py-2 md:py-3 text-sm md:text-base text-center font-semibold transition whitespace-nowrap ${
              activeTab === "review"
                ? "border-b-2 border-emerald-600 text-emerald-600"
                : "text-gray-500 hover:text-emerald-600"
            }`}
          >
            Đánh giá
          </button>
        </div>

        <div className="p-3 md:p-6">
          {/* TAB: MÔ TẢ */}
          {activeTab === "desc" && (
            <p className="text-sm md:text-base lg:text-lg leading-relaxed text-gray-700 whitespace-pre-line">
              {product.description || "Không có mô tả cho sản phẩm này."}
            </p>
          )}

          {/* TAB: CHI TIẾT */}
          {activeTab === "detail" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 text-gray-700">
              {/* Vật liệu & Danh mục */}
              <div>
                <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-3 md:mb-4">
                  Vật liệu & Danh mục
                </h3>
                {/* Vật liệu */}
                <div className="mb-3 md:mb-4">
                  <div className="text-sm md:text-base font-medium mb-2">
                    Vật liệu
                  </div>
                  {product.materials && product.materials.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {product.materials.map((m) => (
                        <div
                          key={m.id}
                          className="flex items-center gap-2 border border-gray-200 bg-gray-50 p-2 rounded-lg"
                          title={m.materialName}
                        >
                          <img
                            src={m.image}
                            alt={m.materialName}
                            className="h-8 w-8 md:h-10 md:w-10 object-cover rounded"
                          />
                          <span className="text-xs md:text-sm font-medium">
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
                <div className="text-sm md:text-base">
                  <span className="font-medium">Danh mục: </span>
                  <span>{product.categoryName || "-"}</span>
                </div>
              </div>

              {/* Kích thước */}
              <div>
                <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-3 md:mb-4">
                  Kích thước
                </h3>
                <ul className="space-y-2 text-sm md:text-base">
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

          {/* TAB: ĐÁNH GIÁ (MỚI) */}
          {activeTab === "review" && (
             <RatingSection productId={product.id} />
          )}
        </div>
      </div>

      {/* Related products */}
      <div className="mt-6 md:mt-12">
        <h2 className="mb-4 md:mb-6 text-lg md:text-xl font-bold text-gray-900">
          Bạn có thể thích
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
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
});

export default BottomSection;