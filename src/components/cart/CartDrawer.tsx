// src/components/CartDrawer.tsx
import React, { useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, LogIn } from "lucide-react"
import { useCartStore } from "@/store/cart"
import { authService } from "@/service/authService"
import { Link } from "react-router-dom"

type Props = {
  open: boolean
  onClose: () => void
}

const fmtVND = (n: number) => new Intl.NumberFormat("vi-VN").format(n) + " ₫"

const CartDrawer: React.FC<Props> = ({ open, onClose }) => {
  const { items, remove, updateQty, total, fetch, loading, error } = useCartStore()
  const isAuthed = authService.isAuthenticated()

  useEffect(() => {
    if (open && isAuthed) {
      fetch()
    }
  }, [open, isAuthed, fetch])

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* overlay */}
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
              <button onClick={onClose} className="rounded-lg p-1 hover:bg-gray-100" aria-label="Đóng">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* content */}
            <div className="flex-1 overflow-y-auto p-4">
              {!isAuthed ? (
                <div className="flex h-full flex-col items-center justify-center text-center text-gray-600">
                  <LogIn className="mb-3 h-6 w-6 text-emerald-600" />
                  <p className="mb-3 text-sm">Bạn cần đăng nhập để sử dụng giỏ hàng.</p>
                  <Link
                    to="/login"
                    className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                    onClick={onClose}
                  >
                    Đăng nhập
                  </Link>
                </div>
              ) : loading ? (
                <p className="text-sm text-gray-500">Đang tải giỏ hàng...</p>
              ) : error ? (
                <p className="text-sm text-red-500">{error}</p>
              ) : items.length === 0 ? (
                <p className="text-sm text-gray-500">Giỏ hàng trống.</p>
              ) : (
                <ul className="space-y-4">
                  {items.map((i) => (
                    <li key={i.id} className="flex items-center gap-3">
                      <img src={i.image} alt={i.title} className="h-16 w-16 rounded-lg object-cover" />
                      <div className="flex-1">
                        <p className="font-medium">{i.title}</p>
                        <p className="text-sm text-gray-500">
                          {fmtVND(i.price)} × {i.qty}
                        </p>

                        {/* qty control */}
                        <div className="mt-2 inline-flex items-center rounded-lg border">
                          <button
                            className="px-2 py-1 text-sm disabled:opacity-50"
                            onClick={() => updateQty(i.id, Math.max(1, i.qty - 1))}
                            aria-label="Giảm"
                            disabled={loading}
                          >
                            −
                          </button>
                          <span className="px-3 text-sm">{i.qty}</span>
                          <button
                            className="px-2 py-1 text-sm disabled:opacity-50"
                            onClick={() => updateQty(i.id, i.qty + 1)}
                            aria-label="Tăng"
                            disabled={loading}
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <button
                        onClick={() => remove(i.id)}
                        className="text-xs text-red-500 hover:underline disabled:opacity-50"
                        disabled={loading}
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
                <span className="text-base font-bold">{fmtVND(total)}</span>
              </div>
              <button
                className="mt-4 w-full rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 active:scale-95 disabled:opacity-50"
                disabled={!isAuthed || loading || items.length === 0}
              >
                Thanh toán
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default CartDrawer
