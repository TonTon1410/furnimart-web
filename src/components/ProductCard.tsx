import React from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

export type Product = {
  id: string;                // vẫn giữ trong type, nhưng KHÔNG dùng để route
  slug: string;
  description: string;
  price: number;
  thumbnailImage: string;
  badge?: string;
};

type Props = {
  data: Product;
  className?: string;
};

const ProductCard: React.FC<Props> = ({ data, className }) => {
  const navigate = useNavigate();

  const detailHref = `/product/${data.slug}`;
  const goDetail = () => navigate(detailHref);

  const titleText = data.description || "Sản phẩm";
  const priceText = new Intl.NumberFormat("vi-VN").format(data.price) + " đ";

  return (
    <motion.div
      whileHover={{ y: -4 }}
      className={`group relative rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition hover:shadow-soft focus-within:shadow-soft ${className || ""}`}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          goDetail();
        }
      }}
    >
      {data.badge && (
        <span className="absolute left-3 top-3 z-10 rounded-full bg-emerald-600 px-2 py-0.5 text-xs font-semibold text-white shadow-sm">
          {data.badge}
        </span>
      )}

      {/* Ảnh → Link tới chi tiết (relative để đặt chip/CTA absolute) */}
      <Link
        to={detailHref}
        className="relative block aspect-[4/3] w-full overflow-hidden rounded-xl bg-gray-50 ring-1 ring-inset ring-gray-100"
        aria-label={`Xem chi tiết: ${titleText}`}
        title={titleText}
      >
        <img
          src={data.thumbnailImage}
          alt={titleText}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />

        {/* Chip giá */}
        <div className="absolute right-3 top-3 z-10 rounded-full border border-white/70 bg-white/90 px-2.5 py-1 text-[13px] font-semibold text-emerald-700 shadow-sm backdrop-blur">
          {priceText}
        </div>

        {/* CTA khi hover/focus */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex translate-y-2 items-center justify-between gap-2 rounded-b-xl px-3 py-2 text-sm opacity-0 transition
                        group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100">
          <div className="absolute inset-x-0 -bottom-0 h-20 rounded-b-xl bg-gradient-to-t from-black/35 to-transparent" />
          <span className="relative z-10 font-medium text-white">Xem chi tiết</span>
          <ArrowRight className="relative z-10 h-4 w-4 text-white" aria-hidden />
        </div>
      </Link>

      {/* Nội dung */}
      <div className="mt-3">
        <Link to={detailHref} className="line-clamp-2 text-base font-semibold text-gray-900 hover:underline">
          {titleText}
        </Link>

        <div className="mt-2 h-px w-full bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100" />

        <div className="mt-2 flex items-center justify-between">
          <span className="text-xs text-gray-500 opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100">
            Nhấn để xem chi tiết
          </span>
          <Link
            to={detailHref}
            className="inline-flex items-center gap-1 rounded-full border border-transparent px-2 py-1 text-sm text-gray-700 transition
                       hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
          >
            Xem chi tiết
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </div>

      {/* Glow hover */}
      <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition group-hover:opacity-100">
        <div className="absolute inset-0 -z-10 blur-2xl [background:radial-gradient(40%_40%_at_50%_0%,rgba(16,185,129,.14),transparent)]" />
      </div>
    </motion.div>
  );
};

export default ProductCard;
