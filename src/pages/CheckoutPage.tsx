/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from "react";
import { cartService } from "@/service/cartService";
import { addressService } from "@/service/addressService";
import { paymentService } from "@/service/paymentService";
import { userService } from "@/service/userService";
import { useNavigate } from "react-router-dom";
import LoadingPage from "./LoadingPage";

const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const [cart, setCart] = useState<any>(null);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<"COD" | "VNPAY">("COD");
  const [voucherCode, setVoucherCode] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Lấy giỏ hàng
        const c = await cartService.getMyCart();
        setCart(c);

        // Lấy profile và danh sách địa chỉ
        const userProfileRes = await userService.getProfile();
        const userId = userProfileRes.data?.id;
        if (userId) {
          // 👉 đổi sang API trả về danh sách thay vì chỉ 1 địa chỉ
          const addrRes = await addressService.getAddressesByUserId(userId);
          const addressList = Array.isArray(addrRes.data?.data) ? addrRes.data.data : [];
          setAddresses(addressList);

          // Ưu tiên địa chỉ mặc định
          const defaultAddr = addressList.find((a) => a.isDefault);
          if (defaultAddr) {
            setSelectedAddress(defaultAddr.id);
          } else if (addressList.length > 0) {
            setSelectedAddress(addressList[0].id);
          }
        }
      } catch (err) {
        console.error("Lỗi fetch data:", err);
      }
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
      // paymentService.checkout expects voucherCode to be null if not provided
      const res = await paymentService.checkout(
        selectedAddress,
        cart.cartId,
        paymentMethod,
        voucherCode ? voucherCode : null
      );

      if (paymentMethod === "VNPAY") {
        window.location.href = res.redirectUrl;
      } else {
        alert("Đặt hàng thành công");
        navigate("/order-confirmation", { state: { order: res.data } });
      }
    } catch (error: any) {
      alert("Thanh toán thất bại: " + (error.response?.data?.message || error.message));
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
        {addresses.length === 0 ? (
          <div className="text-gray-500">Không có địa chỉ nào, vui lòng thêm địa chỉ giao hàng.</div>
        ) : (
          addresses.map((a) => (
            <label
              key={a.id}
              className={`mb-2 flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition hover:bg-gray-50 ${
                selectedAddress === a.id ? "border-emerald-500 bg-emerald-50" : "border-gray-200"
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
                <span className="text-gray-700">{a.fullAddress || a.addressLine}</span>
              </div>
            </label>
          ))
        )}
      </div>

      {/* Voucher code */}
      <div className="mb-6 rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-gray-700">Mã giảm giá (nếu có)</h3>
        <input
          type="text"
          value={voucherCode}
          onChange={(e) => setVoucherCode(e.target.value)}
          className="w-full rounded border px-3 py-2 text-sm"
          placeholder="Nhập mã giảm giá"
        />
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
            <li
              key={item.productId}
              className="flex justify-between border-b pb-2 last:border-0 last:pb-0"
            >
              <span>
                {item.productName} × {item.quantity}
              </span>
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
