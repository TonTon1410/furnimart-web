/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";

const fmtVND = (n: number) => new Intl.NumberFormat("vi-VN").format(n) + " ₫";

type Props = {
  cart: any;
  onCheckout: () => void;
  loading: boolean;
};

const OrderSummary: React.FC<Props> = ({ cart, onCheckout, loading }) => {
  return (
    <div className="flex-1 rounded-xl border border-gray-200 bg-white p-6 shadow-md">
      <h3 className="mb-4 text-lg font-semibold text-gray-800">
        Tóm tắt đơn hàng
      </h3>
      <ul className="space-y-3">
        {cart.items.map((item: any) => (
          <li
            key={item.productId}
            className="flex items-center gap-3 border-b pb-3 last:border-0"
          >
            <img
              src={item.image}
              alt={item.productName}
              className="h-14 w-14 rounded-lg object-cover"
              onError={(e) =>
                ((e.target as HTMLImageElement).src = "/placeholder.png")
              }
            />
            <div className="flex-1">
              <p className="font-medium text-gray-800">{item.productName}</p>
              <p className="text-sm text-gray-600">
                {fmtVND(item.price)} × {item.quantity}
              </p>
            </div>
            <span className="text-sm font-semibold text-gray-800">
              {fmtVND(item.totalItemPrice)}
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-5 flex items-center justify-between border-t pt-4 text-base font-semibold">
        <span>Tổng cộng:</span>
        <span className="text-emerald-600">{fmtVND(cart.totalPrice)}</span>
      </div>

      <button
        onClick={onCheckout}
        disabled={loading}
        className="mt-6 w-full rounded-lg bg-emerald-600 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Đang xử lý..." : "Xác nhận đặt hàng"}
      </button>
    </div>
  );
};

export default OrderSummary;
