/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from "react";
import { cartService } from "@/service/cartService";
import { addressService } from "@/service/addressService";
import { paymentService } from "@/service/paymentService";
import { useNavigate } from "react-router-dom";
import LoadingPage from "./LoadingPage";

const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const [cart, setCart] = useState<any>(null);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<"COD" | "VNPAY">("COD");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const c = await cartService.getMyCart();
      setCart(c);
      const addrRes = await addressService.getAllAddresses();
      setAddresses(addrRes.data);
      if (addrRes.data?.length > 0) setSelectedAddress(addrRes.data[0].id);
    };
    fetchData();
  }, []);

  const handleCheckout = async () => {
    if (!selectedAddress) {
      alert("Vui lòng chọn địa chỉ giao hàng");
      return;
    }
    setLoading(true);
    try {
      const res = await paymentService.checkout(selectedAddress, cart.cartId, paymentMethod);
      if (paymentMethod === "VNPAY") {
        window.location.href = res.redirectUrl; // chuyển sang trang VNPAY
      } else {
        navigate("/order-confirmation", { state: { order: res.data } });
      }
    } catch (error: any) {
      alert("Thanh toán thất bại: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!cart) return <LoadingPage />;

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <h2 className="mb-6 text-2xl font-bold text-gray-800">Thanh toán</h2>

      {/* Địa chỉ */}
      <div className="mb-6 rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-gray-700">Chọn địa chỉ giao hàng</h3>
        {addresses.map((a) => (
          <label key={a.id} className="mb-2 flex cursor-pointer items-center gap-3 rounded-lg border p-3 hover:bg-gray-50">
            <input
              type="radio"
              name="address"
              value={a.id}
              checked={selectedAddress === a.id}
              onChange={() => setSelectedAddress(a.id)}
              className="h-4 w-4 text-emerald-600 focus:ring-emerald-500"
            />
            <span className="text-gray-700">{a.name} - {a.phone}, {a.addressLine}</span>
          </label>
        ))}
      </div>

      {/* Phương thức thanh toán */}
      <div className="mb-6 rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-gray-700">Phương thức thanh toán</h3>
        <div className="space-y-2">
          <label className="flex cursor-pointer items-center gap-3 rounded-lg border p-3 hover:bg-gray-50">
            <input
              type="radio"
              value="COD"
              checked={paymentMethod === "COD"}
              onChange={() => setPaymentMethod("COD")}
              className="h-4 w-4 text-emerald-600 focus:ring-emerald-500"
            />
            <span>Thanh toán khi nhận hàng (COD)</span>
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

      {/* Tóm tắt giỏ hàng */}
      <div className="mb-6 rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-gray-700">Tóm tắt đơn hàng</h3>
        <ul className="mb-3 space-y-2 text-sm text-gray-700">
          {cart.items.map((item: any) => (
            <li key={item.productId} className="flex justify-between border-b pb-2 last:border-0 last:pb-0">
              <span>{item.productName} × {item.quantity}</span>
              <span>{item.totalItemPrice.toLocaleString()} VND</span>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex items-center justify-between border-t pt-3 text-base font-semibold">
          <span>Tổng tiền:</span>
          <span className="text-emerald-600">{cart.totalPrice.toLocaleString()} VND</span>
        </div>
      </div>

      <button
        onClick={handleCheckout}
        disabled={loading}
        className="w-full rounded-lg bg-emerald-600 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Đang xử lý..." : "Xác nhận đặt hàng"}
      </button>
    </div>
  );
};

export default CheckoutPage;
