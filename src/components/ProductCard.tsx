import React from "react";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";

export type Product = {
  id: string;
  title: string;
  price: number;
  image: string;
  badge?: string;
};

type Props = {
  data: Product;
  /** Cho phép truyền thêm class bên ngoài (fix lỗi TS). */
  className?: string;
  /** Cho phép onAdd() KHÔNG truyền tham số hoặc truyền id. */
  onAdd?: (id?: string) => void;
};

const ProductCard: React.FC<Props> = ({ data, onAdd, className }) => {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      className={`group relative rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition hover:shadow-soft ${className || ""}`}
    >
      {/* Badge */}
      {data.badge && (
        <span className="absolute left-3 top-3 rounded-full bg-emerald-600 px-2 py-0.5 text-xs font-semibold text-white">
          {data.badge}
        </span>
      )}

      {/* Ảnh sản phẩm */}
      <div className="aspect-[4/3] w-full overflow-hidden rounded-xl bg-gray-50">
        <img
          src={data.image}
          alt={data.title}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
      </div>

      {/* Thông tin + nút thêm */}
      <div className="mt-3 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-gray-900">{data.title}</h3>
          <p className="mt-1 text-sm font-semibold text-emerald-600">
            {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(data.price)}
          </p>
        </div>

        <button
          onClick={() => onAdd?.(data.id)}
          className="relative rounded-full border border-gray-200 bg-white p-2 text-gray-700
             transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 
             active:scale-95 focus:outline-none focus:ring-2 focus:ring-emerald-300
             before:absolute before:inset-0 before:rounded-full before:opacity-0 
             before:transition before:duration-300
             before:[background:radial-gradient(circle,rgba(16,185,129,0.25)_40%,transparent_70%)]
             hover:before:opacity-100"
          aria-label="Thêm vào giỏ hàng"
          title="Thêm vào giỏ hàng"
        >
          <Plus className="relative z-10 h-4 w-4" />
        </button>
      </div>

      {/* glow khi hover */}
      <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition group-hover:opacity-100">
        <div className="absolute inset-0 -z-10 blur-2xl 
          [background:radial-gradient(40%_40%_at_50%_0%,rgba(16,185,129,.15),transparent)]" />
      </div>
    </motion.div>
  );
};

export default ProductCard;
