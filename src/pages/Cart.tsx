// src/pages/Cart.tsx
import React, { useEffect } from "react";
import { useCartStore } from "@/store/cart";
import { useNavigate } from "react-router-dom";

const fmtVND = (n: number) => new Intl.NumberFormat("vi-VN").format(n) + " ₫";

const Cart: React.FC = () => {
  const { items, remove, clear, total, fetch, loading, error, updateQty } = useCartStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetch();
  }, [fetch]);

  const handleCheckout = () => {
    navigate("/checkout");
  };

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <h1 className="text-2xl font-bold">Giỏ hàng của bạn</h1>

      {loading ? (
        <p className="mt-4 text-sm text-gray-600">Đang tải giỏ hàng...</p>
      ) : error ? (
        <p className="mt-4 text-sm text-red-600">{error}</p>
      ) : items.length === 0 ? (
        <p className="mt-4 text-sm text-gray-600">Giỏ hàng trống.</p>
      ) : (
        <>
          <ul className="mt-6 divide-y divide-gray-100">
            {items.map((i) => (
              <li key={i.id} className="flex items-center gap-4 py-4">
                <img
                  src={i.image}
                  alt={i.title || "Cart item"}
                  className="h-16 w-16 rounded-lg object-cover"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = "/placeholder.png";
                  }}
                />
                <div className="flex-1">
                  <p className="font-medium">{i.title}</p>

                  {/* Màu đã chọn (theo API hiện trả colorId) */}
                  <div className="mt-0.5 text-xs text-gray-600">
                    Màu: <span className="font-medium">{i.colorId}</span>
                  </div>

                  <p className="text-sm text-gray-500">
                    {fmtVND(i.price)} × {i.qty}
                  </p>

                  <div className="mt-2 inline-flex items-center rounded-lg border">
                    <button
                      type="button"
                      className="px-2 py-1 text-sm"
                      onClick={() => updateQty(i.productId, i.colorId, Math.max(1, i.qty - 1))}
                    >
                      −
                    </button>
                    <span className="px-3 text-sm">{i.qty}</span>
                    <button
                      type="button"
                      className="px-2 py-1 text-sm"
                      onClick={() => updateQty(i.productId, i.colorId, i.qty + 1)}
                    >
                      +
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => remove(i.productId)}
                  className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50"
                >
                  Xóa
                </button>
              </li>
            ))}
          </ul>

          <div className="mt-6 flex items-center justify-between">
            <p className="text-lg font-semibold">Tổng: {fmtVND(total)}</p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={clear}
                className="rounded-lg border px-4 py-2 text-sm"
                title="Xóa tất cả sản phẩm theo productId"
              >
                Xóa tất cả
              </button>
              <button
                type="button"
                onClick={handleCheckout}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                Thanh toán
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Cart;
