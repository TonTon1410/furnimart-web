/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { Plus, AlertCircle } from "lucide-react";

type Props = {
  addresses: any[];
  selectedAddress: string;
  setSelectedAddress: (id: string) => void;
  paymentMethod: "COD" | "VNPAY";
  setPaymentMethod: (method: "COD" | "VNPAY") => void;
  voucherCode: string;
  setVoucherCode: (code: string) => void;
  onCreateAddress: () => void;
  totalPrice: number;
};

const COD_LIMIT = 20000000; // 20 triệu VND

const CheckoutForm = React.memo<Props>(
  ({
    addresses,
    selectedAddress,
    setSelectedAddress,
    paymentMethod,
    setPaymentMethod,
    voucherCode,
    setVoucherCode,
    onCreateAddress,
    totalPrice,
  }) => {
    const isCODDisabled = totalPrice > COD_LIMIT;

    // Auto switch to VNPAY if COD is disabled and currently selected
    React.useEffect(() => {
      if (isCODDisabled && paymentMethod === "COD") {
        setPaymentMethod("VNPAY");
      }
    }, [isCODDisabled, paymentMethod, setPaymentMethod]);
    return (
      <div className="flex-1 rounded-xl border border-gray-200 bg-white p-6 shadow-md">
        {/* Địa chỉ */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-800">
              Chọn địa chỉ giao hàng
            </h3>
            <button
              onClick={onCreateAddress}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 transition"
            >
              <Plus className="h-4 w-4" />
              Tạo địa chỉ
            </button>
          </div>
          {addresses.length === 0 ? (
            <p className="text-gray-500">Chưa có địa chỉ nào, hãy thêm mới.</p>
          ) : (
            <div className="space-y-2">
              {addresses.map((a) => (
                <label
                  key={a.id}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition hover:bg-gray-50 ${
                    selectedAddress === a.id
                      ? "border-emerald-500 bg-emerald-50"
                      : "border-gray-200"
                  }`}
                >
                  <input
                    type="radio"
                    name="address"
                    value={a.id}
                    checked={selectedAddress === a.id}
                    onChange={() => setSelectedAddress(a.id)}
                    className="h-4 w-4 text-emerald-600 focus:ring-emerald-500"
                  />
                  <div className="flex flex-col">
                    <span className="font-semibold text-gray-800">
                      {a.name}
                      {a.isDefault && (
                        <span className="ml-2 rounded bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700">
                          Mặc định
                        </span>
                      )}
                    </span>
                    <span className="text-gray-700">SĐT: {a.phone}</span>
                    <span className="text-gray-700">
                      {a.fullAddress || a.addressLine}
                    </span>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Mã giảm giá */}
        <div className="mb-6">
          <h3 className="mb-2 text-lg font-semibold text-gray-800">
            Mã giảm giá
          </h3>
          <input
            type="text"
            value={voucherCode}
            onChange={(e) => setVoucherCode(e.target.value)}
            placeholder="Nhập mã giảm giá nếu có"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Phương thức thanh toán */}
        <div>
          <h3 className="mb-3 text-lg font-semibold text-gray-800">
            Phương thức thanh toán
          </h3>

          {/* Warning message when COD is disabled */}
          {isCODDisabled && (
            <div className="mb-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm">
              <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-amber-800">
                  Đơn hàng trên 20.000.000đ không hỗ trợ COD
                </p>
                <p className="mt-1 text-amber-700">
                  Vui lòng chọn phương thức thanh toán trực tuyến qua VNPAY để
                  hoàn tất đơn hàng.
                </p>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <label
              className={`flex items-center gap-3 rounded-lg border p-3 ${
                isCODDisabled
                  ? "cursor-not-allowed bg-gray-100 opacity-60"
                  : "cursor-pointer hover:bg-gray-50"
              }`}
            >
              <input
                type="radio"
                value="COD"
                checked={paymentMethod === "COD"}
                onChange={() => setPaymentMethod("COD")}
                disabled={isCODDisabled}
                className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 disabled:cursor-not-allowed"
              />
              <div className="flex-1">
                <span className={isCODDisabled ? "text-gray-500" : ""}>
                  Thanh toán khi nhận hàng (COD)
                </span>
                {isCODDisabled && (
                  <p className="mt-1 text-xs text-gray-500">
                    Chỉ áp dụng cho đơn hàng dưới 20.000.000đ
                  </p>
                )}
              </div>
            </label>
            <label className="flex cursor-pointer items-center gap-3 rounded-lg border p-3 hover:bg-gray-50">
              <input
                type="radio"
                value="VNPAY"
                checked={paymentMethod === "VNPAY"}
                onChange={() => setPaymentMethod("VNPAY")}
                className="h-4 w-4 text-emerald-600 focus:ring-emerald-500"
              />
              <span>Thanh toán qua VNPAY</span>
            </label>
          </div>
        </div>
      </div>
    );
  }
);

export default CheckoutForm;
