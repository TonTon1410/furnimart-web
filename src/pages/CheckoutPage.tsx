/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from "react";
import { cartService } from "@/service/cartService";
import { paymentService } from "@/service/paymentService";
import { userService } from "@/service/userService";
import vouchersService, { type Voucher } from "@/service/voucherService";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/context/ToastContext";
import LoadingPage from "./LoadingPage";
import CheckoutForm from "@/components/checkout/CheckoutForm";
import OrderSummary from "@/components/checkout/OrderSummary";
import dayjs from "dayjs";
import { X, Gift, CreditCard, Wallet, ArrowRight } from "lucide-react";

// --- Component Dialog Gợi ý Thanh toán ---
interface PaymentSuggestionDialogProps {
  open: boolean;
  onSwitchToVNPAY: () => void;
  onKeepCOD: () => void;
}

const PaymentSuggestionDialog: React.FC<PaymentSuggestionDialogProps> = ({
  open,
  onSwitchToVNPAY,
  onKeepCOD,
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onKeepCOD}
      ></div>
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-gray-200 transform transition-all scale-100 animate-in zoom-in-95 duration-200">
        <div className="relative h-32 bg-linear-to-br from-emerald-500 to-teal-600 flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
          <div className="absolute -bottom-6 -right-6 h-24 w-24 rounded-full bg-white/20 blur-xl"></div>
          <div className="absolute top-4 left-4 h-16 w-16 rounded-full bg-white/10 blur-lg"></div>
          
          <div className="z-10 flex flex-col items-center text-white drop-shadow-md">
            <Gift className="h-12 w-12 mb-2 animate-bounce" strokeWidth={1.5} />
            <h3 className="text-xl font-bold tracking-wide">ƯU ĐÃI ĐẶC BIỆT</h3>
          </div>

          <button 
            onClick={onKeepCOD}
            className="absolute top-3 right-3 p-2 rounded-full bg-black/10 text-white hover:bg-black/20 transition"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 text-center">
          <h2 className="text-xl font-bold text-gray-800 mb-3">
            Thanh toán VNPAY tiện lợi hơn!
          </h2>
          <p className="text-gray-600 mb-6 leading-relaxed">
            Bạn có biết? Thanh toán qua <span className="font-bold text-emerald-600">VNPAY</span> giúp xử lý đơn hàng nhanh chóng, an toàn và thường xuyên có mã giảm giá độc quyền.
          </p>

          <div className="flex flex-col gap-3">
            <button
              onClick={onSwitchToVNPAY}
              className="group relative flex w-full items-center justify-center gap-3 rounded-xl bg-linear-to-r from-emerald-600 to-teal-600 py-3.5 px-4 text-white font-semibold shadow-lg shadow-emerald-200 hover:shadow-emerald-300 hover:-translate-y-0.5 transition-all duration-200 overflow-hidden"
            >
              <div className="absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-white/20 to-transparent group-hover:animate-shimmer"></div>
              <CreditCard className="h-5 w-5" />
              <span>Chuyển sang VNPAY ngay</span>
              <ArrowRight className="h-4 w-4 opacity-70 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={onKeepCOD}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white py-3 px-4 text-gray-600 font-medium hover:bg-gray-50 hover:text-gray-800 transition-colors"
            >
              <Wallet className="h-4 w-4" />
              <span>Tôi vẫn muốn thanh toán COD</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Main Page Component ---
const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const [cart, setCart] = useState<any>(null);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<string>("");
  
  // LOGIC: Mặc định chọn VNPAY
  const [paymentMethod, setPaymentMethod] = useState<"COD" | "VNPAY">("VNPAY");
  
  // Voucher states
  const [voucherCode, setVoucherCode] = useState<string>("");
  const [appliedVoucher, setAppliedVoucher] = useState<Voucher | null>(null);
  const [discountAmount, setDiscountAmount] = useState<number>(0);

  // Error/Invalid States for UI display
  const [invalidVoucher, setInvalidVoucher] = useState<Voucher | null>(null);
  const [voucherError, setVoucherError] = useState<string>("");

  const [showPaymentSuggestion, setShowPaymentSuggestion] = useState(false);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const c = await cartService.getMyCart();
        setCart(c);

        const userProfileRes = await userService.getProfile();
        const userId = userProfileRes.data?.id;
        if (userId) {
          const addrRes = await paymentService.getAddressesByUserId(userId);
          const list = Array.isArray(addrRes.data?.data)
            ? addrRes.data.data
            : [];
          setAddresses(list);

          const defaultAddr = list.find((a: any) => a.isDefault);
          setSelectedAddress(defaultAddr ? defaultAddr.id : list[0]?.id || "");
        }
      } catch (err) {
        console.error("Lỗi fetch data:", err);
      }
    };
    fetchData();
  }, []);

  const handlePaymentChange = (method: "COD" | "VNPAY") => {
    if (method === "COD") {
      setShowPaymentSuggestion(true);
    } else {
      setPaymentMethod("VNPAY");
    }
  };

  const handleSwitchToVNPAY = () => {
    setPaymentMethod("VNPAY");
    setShowPaymentSuggestion(false);
    showToast({ type: "success", title: "Đã chọn VNPAY", description: "Phương thức thanh toán đã được cập nhật." });
  };

  const handleKeepCOD = () => {
    setPaymentMethod("COD");
    setShowPaymentSuggestion(false);
  };

  const handleApplyVoucher = async () => {
    if (!voucherCode.trim()) {
      showToast({ type: "warning", title: "Thông báo", description: "Vui lòng nhập mã giảm giá" });
      return;
    }
    
    setAppliedVoucher(null);
    setDiscountAmount(0);
    setInvalidVoucher(null);
    setVoucherError("");

    try {
      setLoading(true);
      const res = await vouchersService.getVoucherByCode(voucherCode);
      
      // --- SỬA LỖI TS TẠI ĐÂY ---
      // Ép kiểu 'as any' để xử lý structure trả về từ API wrapper
      const responseData = res.data as any; 

      if (responseData.status === 1207) {
        throw new Error("Mã giảm giá không tồn tại");
      }

      // Lấy data an toàn
      const voucher = responseData && responseData.data ? responseData.data : null;

      if (!voucher) {
        throw new Error("Mã giảm giá không tồn tại");
      }

      // --- VALIDATE ĐIỀU KIỆN ---
      const now = dayjs();
      const start = dayjs(voucher.startDate);
      const end = dayjs(voucher.endDate);
      
      let failReason = "";

      // LOGIC: Check Active an toàn (handle undefined)
      if (!voucher.status || (voucher.active !== undefined && !voucher.active)) {
         failReason = "Mã giảm giá hiện không khả dụng";
      }
      else if (now.isBefore(start)) failReason = "Mã giảm giá chưa đến đợt áp dụng";
      else if (now.isAfter(end) || voucher.expired) failReason = "Mã giảm giá đã hết hạn sử dụng";
      else if (voucher.usageLimit > 0 && voucher.usedCount >= voucher.usageLimit) failReason = "Mã giảm giá đã hết lượt sử dụng";
      else if (cart.totalPrice < voucher.minimumOrderAmount) {
         const fmt = new Intl.NumberFormat("vi-VN").format(voucher.minimumOrderAmount);
         failReason = `Đơn hàng phải từ ${fmt}đ để dùng mã này`;
      }

      if (failReason) {
        setInvalidVoucher(voucher);
        setVoucherError(failReason);
        return; 
      }

      // --- TÍNH TOÁN GIẢM GIÁ ---
      let discount = 0;
      if (voucher.type === "PERCENTAGE") {
        discount = Math.floor((cart.totalPrice * voucher.amount) / 100);
      } else {
        discount = voucher.amount;
      }
      if (discount > cart.totalPrice) discount = cart.totalPrice;

      setDiscountAmount(discount);
      setAppliedVoucher(voucher);
      
      showToast({
        type: "success",
        title: "Thành công",
        description: `Đã áp dụng mã: ${voucher.code}`,
      });

    } catch (error: any) {
      console.error("Voucher error:", error);

      let errorMessage = "Mã giảm giá không hợp lệ";

      // Xử lý lỗi từ backend trả về (bao gồm 404 Not Found)
      if (error.response && error.response.data) {
        // Ép kiểu error response để tránh warning TS
        const errData = error.response.data as any;
        const { status, message } = errData;
        
        if (status === 1207 || message === "Voucher not found") {
          errorMessage = "Mã giảm giá không tồn tại";
        } else {
          errorMessage = message || errorMessage;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      showToast({
        type: "error",
        title: "Không thể áp dụng",
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async () => {
    if (!selectedAddress) {
      showToast({
        type: "warning",
        title: "Nhắc nhở!",
        description: "Vui lòng chọn địa chỉ giao hàng",
      });
      return;
    }
    setLoading(true);
    try {
      const codeToSend = appliedVoucher ? voucherCode : null;
      const res = await paymentService.checkout(
        selectedAddress,
        cart.cartId,
        paymentMethod,
        codeToSend
      );
      if (paymentMethod === "VNPAY") {
        window.location.href = res.redirectUrl;
      } else {
        navigate("/order-confirmation", { state: { order: res.data } });
      }
    } catch (error: any) {
      showToast({
        type: "error",
        title: "Lỗi thanh toán",
        description: error.response?.data?.message || error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAddress = () => {
    navigate("/addresses");
  };

  if (!cart) return <LoadingPage />;

  const finalPrice = cart.totalPrice - discountAmount;

  return (
    <div className="mx-auto flex w-[90%] max-w-7xl flex-col gap-8 px-4 py-10 md:flex-row relative">
      <CheckoutForm
        addresses={addresses}
        selectedAddress={selectedAddress}
        setSelectedAddress={setSelectedAddress}
        paymentMethod={paymentMethod}
        setPaymentMethod={handlePaymentChange}
        voucherCode={voucherCode}
        setVoucherCode={setVoucherCode}
        onCreateAddress={handleCreateAddress}
        totalPrice={finalPrice}
        onApplyVoucher={handleApplyVoucher}
        appliedVoucher={appliedVoucher}
        invalidVoucher={invalidVoucher}
        voucherError={voucherError}
      />
      <OrderSummary 
        cart={cart} 
        discountAmount={discountAmount} 
        onCheckout={handleCheckout} 
        loading={loading} 
      />

      <PaymentSuggestionDialog 
        open={showPaymentSuggestion}
        onSwitchToVNPAY={handleSwitchToVNPAY}
        onKeepCOD={handleKeepCOD}
      />
    </div>
  );
};

export default CheckoutPage;