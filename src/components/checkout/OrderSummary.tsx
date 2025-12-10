/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";

const fmtVND = (n: number) => new Intl.NumberFormat("vi-VN").format(n) + " ₫";

type Props = {
  cart: any;
  onCheckout: () => void;
  loading: boolean;
  discountAmount?: number; // Thêm prop này
};

const OrderSummary = React.memo<Props>(({ cart, onCheckout, loading, discountAmount = 0 }) => {
  const finalTotal = Math.max(0, cart.totalPrice - discountAmount);

  return (
    <div className="flex-1 rounded-xl border border-gray-200 bg-white p-6 shadow-md h-fit sticky top-4">
      <h3 className="mb-4 text-lg font-semibold text-gray-800">
        Tóm tắt đơn hàng
      </h3>
      <ul className="space-y-3 mb-6 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
        {cart.items.map((item: any) => (
          <li
            key={item.productId}
            className="flex items-center gap-3 border-b border-gray-100 pb-3 last:border-0"
          >
            <img
              src={item.image}
              alt={item.productName}
              className="h-14 w-14 rounded-lg object-cover bg-gray-100 border border-gray-100"
              onError={(e) => {
                const img = e.target as HTMLImageElement;
                if (!img.src.includes("ui-avatars.com")) {
                  img.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    item.productName || "Product"
                  )}&background=e5e7eb&color=6b7280&size=128`;
                }
              }}
            />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-800 truncate" title={item.productName}>{item.productName}</p>
              <p className="text-sm text-gray-500">
                {fmtVND(item.price)} × {item.quantity}
              </p>
            </div>
            <span className="text-sm font-semibold text-gray-800 whitespace-nowrap">
              {fmtVND(item.totalItemPrice)}
            </span>
          </li>
        ))}
      </ul>

      <div className="space-y-3 border-t pt-4 text-sm text-gray-600">
        <div className="flex justify-between">
          <span>Tạm tính:</span>
          <span className="font-medium">{fmtVND(cart.totalPrice)}</span>
        </div>
        
        {discountAmount > 0 && (
          <div className="flex justify-between text-emerald-600">
            <span>Giảm giá:</span>
            <span className="font-medium">-{fmtVND(discountAmount)}</span>
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-dashed border-gray-300 pt-4 text-base font-bold">
        <span>Tổng cộng:</span>
        <span className="text-xl text-emerald-600">{fmtVND(finalTotal)}</span>
      </div>

      <button
        onClick={onCheckout}
        disabled={loading}
        className="mt-6 w-full rounded-lg bg-emerald-600 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-200 hover:bg-emerald-700 hover:shadow-emerald-300 transition-all disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
      >
        {loading ? "Đang xử lý..." : "Xác nhận đặt hàng"}
      </button>
    </div>
  );
});

export default OrderSummary;