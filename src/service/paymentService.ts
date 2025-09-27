// src/service/paymentService.ts
import axiosClient from "@/service/axiosClient";

export const paymentService = {
  // Đặt hàng (checkout)
  async checkout(
  addressId: string,
  cartId: string,
  paymentMethod: "COD" | "VNPAY",
  voucherCode?: string | null
) {
  const url = "/orders/checkout";
  const payload = {
    addressId,
    cartId,
    paymentMethod,
    voucherCode: voucherCode ?? null, 
  };

  const res = await axiosClient.post(url, payload);
  return res.data;
},

  // Tạo thanh toán VNPAY
  async createVnpay(amount: number, orderId: string) {
    const url = "/v1/payment/vnpay";
    const res = await axiosClient.post(url, { amount, orderId });
    return res.data;
  },

  // Xử lý trả về từ VNPAY
  async vnpayReturn(additionalProp1: string, additionalProp2: string, additionalProp3: string) {
    const url = "/v1/payment/vnpay-return";
    const res = await axiosClient.post(url, {
      additionalProp1,
      additionalProp2,
      additionalProp3,
    });
    return res.data;
  },
};