import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useCartStore } from "@/store/cart";

type Props = {
  open: boolean;
  onClose: () => void;
};

const CartDrawer: React.FC<Props> = ({ open, onClose }) => {
  const { items, remove, total } = useCartStore();

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* nền mờ */}
          <motion.div
            className="fixed inset-0 z-40 bg-black/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* panel */}
          <motion.div
            className="fixed right-0 top-0 z-50 h-full w-80 max-w-full bg-white shadow-xl flex flex-col"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.3 }}
          >
            {/* header */}
            <div className="flex items-center justify-between border-b border-gray-200 p-4">
              <h2 className="text-lg font-bold">Giỏ hàng</h2>
              <button
                onClick={onClose}
                className="rounded-lg p-1 hover:bg-gray-100"
                aria-label="Đóng"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* nội dung */}
            <div className="flex-1 overflow-y-auto p-4">
              {items.length === 0 ? (
                <p className="text-sm text-gray-500">Giỏ hàng trống.</p>
              ) : (
                <ul className="space-y-4">
                  {items.map((i) => (
                    <li key={i.id} className="flex items-center gap-3">
                      <img
                        src={i.image}
                        alt={i.title}
                        className="h-16 w-16 rounded-lg object-cover"
                      />
                      <div className="flex-1">
                        <p className="font-medium">{i.title}</p>
                        <p className="text-sm text-gray-500">
                          {i.price.toLocaleString("vi-VN")} ₫ × {i.qty}
                        </p>
                      </div>
                      <button
                        onClick={() => remove(i.id)}
                        className="text-xs text-red-500 hover:underline"
                      >
                        Xóa
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* footer */}
            <div className="border-t border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">Tổng cộng</span>
                <span className="text-base font-bold">
                  {total.toLocaleString("vi-VN")} ₫
                </span>
              </div>
              <button
                className="mt-4 w-full rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 active:scale-95"
              >
                Thanh toán
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CartDrawer;
