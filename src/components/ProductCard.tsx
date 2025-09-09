import React from "react";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";

type Product = { id: string; title: string; price: number; image: string; badge?: string; };
type Props = { data: Product; onAdd?: (id: string) => void; };

const ProductCard: React.FC<Props> = ({ data, onAdd }) => {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="group relative rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition hover:shadow-soft"
    >
      {data.badge && (
        <span className="absolute left-3 top-3 rounded-full bg-brand-600 px-2 py-0.5 text-xs font-semibold text-white">
          {data.badge}
        </span>
      )}

      <div className="aspect-[4/3] w-full overflow-hidden rounded-xl bg-gray-50">
        <img
          src={data.image}
          alt={data.title}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
      </div>

      <div className="mt-3 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-gray-900">{data.title}</h3>
          <p className="mt-1 text-sm font-semibold text-brand-600">${data.price.toFixed(2)}</p>
        </div>

        <button
          onClick={() => onAdd?.(data.id)}
          className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 active:scale-95"
          aria-label="Add to cart"
          title="Add to cart"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {/* gradient glow on hover */}
      <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition group-hover:opacity-100">
        <div className="absolute inset-0 -z-10 blur-2xl [background:radial-gradient(40%_40%_at_50%_0%,rgba(16,185,129,.15),transparent)]" />
      </div>
    </motion.div>
  );
};

export default ProductCard;
