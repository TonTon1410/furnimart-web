/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { Plus, AlertCircle, Tag, CheckCircle, XCircle, Calendar, Info } from "lucide-react";
import dayjs from "dayjs";

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
  onApplyVoucher: () => void;
  appliedVoucher: any | null;
  // Props cho hiển thị lỗi logic
  invalidVoucher: any | null;
  voucherError: string;
};

const COD_LIMIT = 20000000; 

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
    onApplyVoucher,
    appliedVoucher,
    invalidVoucher,
    voucherError
  }) => {
    const isCODDisabled = totalPrice > COD_LIMIT;

    React.useEffect(() => {
      if (isCODDisabled && paymentMethod === "COD") {
        setPaymentMethod("VNPAY");
      }
    }, [isCODDisabled, paymentMethod, setPaymentMethod]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setVoucherCode(e.target.value.toUpperCase());
    };

    return (
      <div className="flex-1 rounded-xl border border-gray-200 bg-white p-6 shadow-md">
        {/* --- Phần Địa chỉ (Giữ nguyên) --- */}
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

        {/* --- Phần Mã giảm giá (Giữ nguyên) --- */}
        <div className="mb-6 border-t border-gray-100 pt-6">
          <h3 className="mb-3 text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Tag className="w-5 h-5 text-emerald-600" />
            Mã giảm giá
          </h3>
          
          <div className="flex gap-2">
            <input
              type="text"
              value={voucherCode}
              onChange={handleInputChange}
              placeholder="Nhập mã giảm giá (VD: SALE10)"
              className={`flex-1 rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none uppercase ${
                appliedVoucher 
                  ? "border-emerald-500 bg-emerald-50 text-emerald-700 font-semibold" 
                  : invalidVoucher 
                    ? "border-gray-300 bg-gray-50 text-gray-500"
                    : "border-gray-300"
              }`}
            />
            <button
              onClick={onApplyVoucher}
              className="rounded-lg bg-gray-800 px-4 py-2 text-sm font-medium text-white hover:bg-gray-900 transition active:scale-95 whitespace-nowrap"
            >
              Áp dụng
            </button>
          </div>

          {appliedVoucher && (
            <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <p className="font-bold text-emerald-800 text-base">
                      {appliedVoucher.code}
                    </p>
                    <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium border border-emerald-200">
                      Đang áp dụng
                    </span>
                  </div>
                  
                  <p className="text-sm text-emerald-700 font-medium mt-1">
                    {appliedVoucher.name}
                  </p>
                  
                  <div className="mt-2 space-y-1 text-xs text-emerald-600">
                    <p className="flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5" />
                      <span>
                        Mức giảm: 
                        <span className="font-bold ml-1">
                          {appliedVoucher.type === "PERCENTAGE" 
                            ? `${appliedVoucher.amount}%` 
                            : `${new Intl.NumberFormat("vi-VN").format(appliedVoucher.amount)}đ`}
                        </span>
                      </span>
                    </p>
                    
                    {appliedVoucher.minimumOrderAmount > 0 && (
                      <p className="flex items-center gap-1.5 opacity-90">
                        <Info className="w-3.5 h-3.5" />
                        <span>
                          Đơn tối thiểu: {new Intl.NumberFormat("vi-VN").format(appliedVoucher.minimumOrderAmount)}đ
                        </span>
                      </p>
                    )}

                    {appliedVoucher.endDate && (
                      <p className="flex items-center gap-1.5 opacity-90">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>
                          HSD: {dayjs(appliedVoucher.endDate).format("HH:mm DD/MM/YYYY")}
                        </span>
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {!appliedVoucher && invalidVoucher && (
             <div className="mt-3 rounded-lg border border-gray-200 bg-gray-50 p-3 animate-in fade-in slide-in-from-top-2">
               <div className="flex items-start gap-3">
                 <XCircle className="h-5 w-5 text-gray-400 shrink-0 mt-0.5" />
                 <div className="flex-1">
                   <p className="font-semibold text-gray-600">
                     {invalidVoucher.code} - {invalidVoucher.name}
                   </p>
                   <p className="text-sm text-red-500 mt-1 font-medium">
                     {voucherError}
                   </p>
                   {invalidVoucher.endDate && (
                      <p className="flex items-center gap-1.5 mt-2 text-xs text-gray-400">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>
                           Hết hạn: {dayjs(invalidVoucher.endDate).format("DD/MM/YYYY")}
                        </span>
                      </p>
                   )}
                 </div>
               </div>
             </div>
          )}
        </div>

        {/* --- Phần Phương thức thanh toán --- */}
        <div className="border-t border-gray-100 pt-6">
          <h3 className="mb-3 text-lg font-semibold text-gray-800">
            Phương thức thanh toán
          </h3>

          {isCODDisabled && (
            <div className="mb-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm">
              <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-amber-800">
                  Đơn hàng trên 20.000.000đ không hỗ trợ COD
                </p>
                <p className="mt-1 text-amber-700">
                  Vui lòng chọn phương thức thanh toán trực tuyến qua VNPAY.
                </p>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {/* 1. VNPAY (Đã chuyển lên đầu) */}
            <label className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 hover:bg-gray-50 transition-colors ${
               paymentMethod === "VNPAY" ? "border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500" : ""
            }`}>
              <input
                type="radio"
                value="VNPAY"
                checked={paymentMethod === "VNPAY"}
                onChange={() => setPaymentMethod("VNPAY")} 
                className="h-4 w-4 text-emerald-600 focus:ring-emerald-500"
              />
              <div className="flex-1">
                <span className="text-gray-800 font-medium">Thanh toán qua VNPAY</span>
                <p className="mt-0.5 text-xs text-emerald-600 font-medium">Khuyên dùng: Nhanh chóng & An toàn</p>
              </div>
            </label>

            {/* 2. COD (Đã chuyển xuống dưới) */}
            <label
              className={`flex items-center gap-3 rounded-lg border p-3 transition-colors ${
                isCODDisabled
                  ? "cursor-not-allowed bg-gray-100 opacity-60"
                  : "cursor-pointer hover:bg-gray-50"
              } ${paymentMethod === "COD" ? "border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500" : ""}`}
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
                <span className={isCODDisabled ? "text-gray-500" : "text-gray-800 font-medium"}>
                  Thanh toán khi nhận hàng (COD)
                </span>
                {!isCODDisabled && (
                  <p className="mt-0.5 text-xs text-gray-500">Thanh toán bằng tiền mặt khi giao hàng</p>
                )}
                {isCODDisabled && (
                  <p className="mt-1 text-xs text-gray-500">
                    Chỉ áp dụng cho đơn hàng dưới 20.000.000đ
                  </p>
                )}
              </div>
            </label>
          </div>
        </div>
      </div>
    );
  }
);

export default CheckoutForm;