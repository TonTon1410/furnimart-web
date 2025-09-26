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

const fmtVND = (n: number) => new Intl.NumberFormat("vi-VN").format(n) + " ₫";

const BottomSection: React.FC<BottomSectionProps> = ({ related, product }) => {
  return (
    <div className="mt-10 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      {/* Mô tả */}
      <div className="mb-10">
        <h2 className="mb-3 text-xl font-bold text-gray-900">Mô tả</h2>
        <p className="text-gray-700 leading-relaxed">
          {product.description || "Không có mô tả cho sản phẩm này."}
        </p>
      </div>

      {/* Chi tiết */}
      <div className="grid gap-10 md:grid-cols-2">
        <div>
          <h2 className="mb-4 text-xl font-bold text-gray-900">Vật liệu & Danh mục</h2>

          {/* Vật liệu */}
          <div className="mb-4">
            <div className="mb-2 text-sm font-medium text-gray-600">Vật liệu</div>
            {product.materials && product.materials.length > 0 ? (
              <div className="flex flex-wrap gap-4">
                {product.materials.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 p-2"
                    title={m.materialName}
                  >
                    <img
                      src={m.image}
                      alt={m.materialName}
                      className="h-10 w-10 rounded object-cover"
                    />
                    <span className="text-sm font-medium text-gray-800">
                      {m.materialName}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <span className="text-base font-medium text-gray-700">-</span>
            )}
          </div>

          {/* Danh mục */}
          <div className="flex items-start gap-2">
            <span className="w-32 shrink-0 text-sm font-medium text-gray-600">Danh mục</span>
            <span className="text-base font-semibold text-gray-800">
              {product.categoryName || "-"}
            </span>
          </div>
        </div>

        {/* Kích thước */}
        <div>
          <h2 className="mb-4 text-xl font-bold text-gray-900">Kích thước</h2>
          <ul className="space-y-3">
            <li className="flex items-start gap-2">
              <span className="w-32 shrink-0 text-sm font-medium text-gray-600">Chiều cao</span>
              <span className="text-base font-semibold text-gray-800">
                {product.height ?? "-"} cm
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-32 shrink-0 text-sm font-medium text-gray-600">Chiều rộng</span>
              <span className="text-base font-semibold text-gray-800">
                {product.width ?? "-"} cm
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-32 shrink-0 text-sm font-medium text-gray-600">Chiều dài/sâu</span>
              <span className="text-base font-semibold text-gray-800">
                {product.length ?? "-"} cm
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-32 shrink-0 text-sm font-medium text-gray-600">Trọng lượng</span>
              <span className="text-base font-semibold text-gray-800">
                {product.weight ?? "-"} kg
              </span>
            </li>
          </ul>
        </div>
      </div>

      {/* Bạn có thể thích */}
      <div className="mt-12">
        <h2 className="mb-5 text-center text-xl font-bold text-gray-900">Bạn có thể thích</h2>
        <div className="grid grid-cols-2 gap-5 md:grid-cols-4">
          {related.map((item) => (
            <div
              key={item.id}
              className="rounded-xl border border-gray-200 bg-white p-3 text-center transition hover:shadow-sm"
            >
              <div className="mb-2 flex h-40 w-full items-center justify-center overflow-hidden rounded-lg bg-gray-50">
                <img
                  src={item.images?.[0] || "/placeholder.png"}
                  alt={item.name}
                  className="h-full w-full object-contain"
                  onError={(e) => ((e.currentTarget.src = "/placeholder.png"))}
                />
              </div>
              <p className="line-clamp-2 min-h-[40px] text-sm text-gray-800">{item.name}</p>
              <p className="mt-1 text-sm font-semibold text-emerald-700">
                {fmtVND(item.price)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BottomSection;
