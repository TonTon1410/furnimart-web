/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from "react";
import { cartService } from "@/service/cartService";
import { paymentService } from "@/service/paymentService";
import { userService } from "@/service/userService";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/context/ToastContext";
import LoadingPage from "./LoadingPage";
import CheckoutForm from "@/components/checkout/CheckoutForm";
import OrderSummary from "@/components/checkout/OrderSummary";

const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const [cart, setCart] = useState<any>(null);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<"COD" | "VNPAY">("COD");
  const [voucherCode, setVoucherCode] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const { showToast, ToastComponent } = useToastRadix();

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
      const res = await paymentService.checkout(
        selectedAddress,
        cart.cartId,
        paymentMethod,
        voucherCode || null
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

  return (
    <div className="mx-auto flex w-[90%] max-w-7xl flex-col gap-8 px-4 py-10 md:flex-row">
      <CheckoutForm
        addresses={addresses}
        selectedAddress={selectedAddress}
        setSelectedAddress={setSelectedAddress}
        paymentMethod={paymentMethod}
        setPaymentMethod={setPaymentMethod}
        voucherCode={voucherCode}
        setVoucherCode={setVoucherCode}
        onCreateAddress={handleCreateAddress}
      />
      <OrderSummary
        cart={cart}
        onCheckout={handleCheckout}
        loading={loading}
      />
      <ToastComponent />
    </div>
  );
};

export default CheckoutPage;
