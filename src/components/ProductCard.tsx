// src/components/ProductCard.tsx
import React from "react";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

export type Product = {
  id: string;
  title: string;
  price: number;
  image: string;
  badge?: string;
};

type Props = {
  data: Product;
  className?: string;
  onAdd?: (id?: string) => void;
};

const ProductCard: React.FC<Props> = ({ data, onAdd, className }) => {
  const navigate = useNavigate();

  const goDetail = () => navigate(`/product/${data.id}`);

  return (
    <motion.div
      whileHover={{ y: -4 }}
      className={`group relative rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition hover:shadow-soft ${className || ""}`}
      // Cho phép Enter/Space mở chi tiết khi card đang focus
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          goDetail();
        }
      }}
    >
      {/* Badge */}
      {data.badge && (
        <span className="absolute left-3 top-3 rounded-full bg-emerald-600 px-2 py-0.5 text-xs font-semibold text-white">
          {data.badge}
        </span>
      )}

      {/* Ảnh → Link tới chi tiết */}
      <Link to={`/product/${data.id}`} className="block aspect-[4/3] w-full overflow-hidden rounded-xl bg-gray-50">
        <img
          src={data.image}
          alt={data.title}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
      </Link>

      {/* Thông tin + nút thêm */}
      <div className="mt-3 flex items-start justify-between gap-3">
        {/* Tiêu đề → Link tới chi tiết */}
        <div>
          <Link
            to={`/product/${data.id}`}
            className="text-base font-semibold text-gray-900 hover:underline"
          >
            {data.title}
          </Link>
          <p className="mt-1 text-sm font-semibold text-emerald-600">
            {new Intl.NumberFormat("vi-VN").format(data.price) + " đ"}
          </p>
        </div>

        {/* Nút thêm giỏ: chặn nổi bọt để không kích hoạt Link */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            onAdd?.(data.id);
          }}
          className="relative rounded-full border border-gray-200 bg-white p-2 text-gray-700
             transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 
             active:scale-95 focus:outline-none focus:ring-2 focus:ring-emerald-300"
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
