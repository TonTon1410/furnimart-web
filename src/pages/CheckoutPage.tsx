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

const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const [cart, setCart] = useState<any>(null);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<string>("");
  
  const [paymentMethod, setPaymentMethod] = useState<"COD" | "VNPAY">("VNPAY");
  
  // Voucher states
  const [voucherCode, setVoucherCode] = useState<string>("");
  const [appliedVoucher, setAppliedVoucher] = useState<Voucher | null>(null);
  const [discountAmount, setDiscountAmount] = useState<number>(0);

  // Error/Invalid States
  const [invalidVoucher, setInvalidVoucher] = useState<Voucher | null>(null);
  const [voucherError, setVoucherError] = useState<string>("");

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
      const responseData = res.data as any; 

      if (responseData.status === 1207) throw new Error("Mã giảm giá không tồn tại");

      const voucher = responseData && responseData.data ? responseData.data : null;
      if (!voucher) throw new Error("Mã giảm giá không tồn tại");

      const now = dayjs();
      let failReason = "";

      if (!voucher.status || (voucher.active !== undefined && !voucher.active)) failReason = "Mã giảm giá hiện không khả dụng";
      else if (now.isBefore(dayjs(voucher.startDate))) failReason = "Mã giảm giá chưa đến đợt áp dụng";
      else if (now.isAfter(dayjs(voucher.endDate)) || voucher.expired) failReason = "Mã giảm giá đã hết hạn sử dụng";
      else if (voucher.usageLimit > 0 && voucher.usedCount >= voucher.usageLimit) failReason = "Mã giảm giá đã hết lượt sử dụng";
      else if (cart.totalPrice < voucher.minimumOrderAmount) {
         failReason = `Đơn hàng phải từ ${new Intl.NumberFormat("vi-VN").format(voucher.minimumOrderAmount)}đ để dùng mã này`;
      }

      if (failReason) {
        setInvalidVoucher(voucher);
        setVoucherError(failReason);
        return; 
      }

      let discount = voucher.type === "PERCENTAGE" 
        ? Math.floor((cart.totalPrice * voucher.amount) / 100) 
        : voucher.amount;
      
      if (discount > cart.totalPrice) discount = cart.totalPrice;

      setDiscountAmount(discount);
      setAppliedVoucher(voucher);
      
      showToast({ type: "success", title: "Thành công", description: `Đã áp dụng mã: ${voucher.code}` });

    } catch (error: any) {
      console.error("Voucher error:", error);
      let errorMessage = "Mã giảm giá không hợp lệ";
      if (error.response?.data?.message) errorMessage = error.response.data.message;
      else if (error.message) errorMessage = error.message;

      showToast({ type: "error", title: "Không thể áp dụng", description: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  // === HÀM CHECKOUT ĐÃ TỐI ƯU ===
  const handleCheckout = async () => {
    if (!selectedAddress) {
      showToast({ type: "warning", title: "Nhắc nhở!", description: "Vui lòng chọn địa chỉ giao hàng" });
      return;
    }

    setLoading(true);
    try {
      const codeToSend = appliedVoucher ? voucherCode : null;
      
      // Gọi API Checkout
      // Backend của bạn hiện tại đã tự xử lý logic:
      // - Nếu VNPAY -> Trả link thanh toán Full.
      // - Nếu COD -> Trả link thanh toán Cọc 10% (đã kiểm chứng qua log vnp_Amount).
      const res = await paymentService.checkout(
        selectedAddress,
        cart.cartId,
        paymentMethod,
        codeToSend
      );

      console.log("✅ [Checkout Response]:", res);

      // Lấy link thanh toán từ bất kỳ trường nào có thể
      const paymentUrl = res.redirectUrl || res.url || res.paymentUrl;

      if (paymentUrl) {
          if (paymentMethod === "COD") {
            const depositAmount = Math.round((cart.totalPrice - discountAmount) * 0.1);
            showToast({
              type: "info",
              title: "Tiến hành đặt cọc",
              description: `Đang chuyển sang VNPAY để cọc ${new Intl.NumberFormat("vi-VN").format(depositAmount)}đ`,
            });
          }
          
          // Chuyển hướng ngay lập tức
          window.location.href = paymentUrl;
      } else {
          // Trường hợp hiếm hoi: Thành công nhưng không có link (Fallback)
          console.warn("⚠️ Không tìm thấy link thanh toán, chuyển về trang xác nhận.");
          const orderData = res.data || res;
          navigate("/order-confirmation", { state: { order: orderData } });
      }

    } catch (error: any) {
      console.error("❌ [Checkout Error]:", error);
      showToast({
        type: "error",
        title: "Có lỗi xảy ra",
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
        setPaymentMethod={setPaymentMethod}
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
    </div>
  );
};

export default CheckoutPage;