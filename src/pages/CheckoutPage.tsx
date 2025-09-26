import React, { useEffect, useState } from "react";
import { cartService } from "@/service/cartService";
import { addressService } from "@/service/addressService";
import { paymentService } from "@/service/paymentService";
import { useNavigate } from "react-router-dom";

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

  if (!cart) return <p>Đang tải...</p>;

  return (
    <div className="checkout-container">
      <h2>Thanh toán</h2>

      {/* Địa chỉ */}
      <div>
        <h3>Chọn địa chỉ giao hàng</h3>
        {addresses.map((a) => (
          <div key={a.id}>
            <input
              type="radio"
              name="address"
              value={a.id}
              checked={selectedAddress === a.id}
              onChange={() => setSelectedAddress(a.id)}
            />
            {a.name} - {a.phone}, {a.addressLine}
          </div>
        ))}
      </div>

      {/* Phương thức thanh toán */}
      <div>
        <h3>Phương thức thanh toán</h3>
        <label>
          <input
            type="radio"
            value="COD"
            checked={paymentMethod === "COD"}
            onChange={() => setPaymentMethod("COD")}
          />
          Thanh toán khi nhận hàng (COD)
        </label>
        <label>
          <input
            type="radio"
            value="VNPAY"
            checked={paymentMethod === "VNPAY"}
            onChange={() => setPaymentMethod("VNPAY")}
          />
          Thanh toán qua VNPAY
        </label>
      </div>

      {/* Tóm tắt giỏ hàng */}
      <div>
        <h3>Tóm tắt đơn hàng</h3>
        {cart.items.map((item: any) => (
          <div key={item.productId}>
            {item.productName} x {item.quantity} = {item.totalItemPrice.toLocaleString()} VND
          </div>
        ))}
        <strong>Tổng tiền: {cart.totalPrice.toLocaleString()} VND</strong>
      </div>

      <button onClick={handleCheckout} disabled={loading}>
        {loading ? "Đang xử lý..." : "Xác nhận đặt hàng"}
      </button>
    </div>
  );
};

export default CheckoutPage;
