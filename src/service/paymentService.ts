import axiosClient from "@/service/axiosClient";

const BASE_URL = import.meta.env.VITE_PAYMENT_API_BASE_URL || "http://152.53.169.79:8085";

export const paymentService = {
  // Đặt hàng (checkout)
  async checkout(addressId: string, cartId: string, paymentMethod: "COD" | "VNPAY") {
    const url = `${BASE_URL}/orders/checkout`;
    const res = await axiosClient.post(url, null, {
      params: { addressId, cartId, paymentMethod },
    });
    return res.data;
  },

  // Tạo thanh toán VNPAY
  async createVnpay(amount: number, orderId: string) {
    const url = `${BASE_URL}/api/v1/payment/vnpay`;
    const res = await axiosClient.post(url, null, {
      params: { amount, orderId },
    });
    return res.data;
  },

  // Xử lý trả về từ VNPAY
  async vnpayReturn(additionalProp1: string, additionalProp2: string, additionalProp3: string) {
    const url = `${BASE_URL}/api/v1/payment/vnpay-return`;
    const res = await axiosClient.post(url, null, {
      params: { additionalProp1, additionalProp2, additionalProp3 },
    });
    return res.data;
  },
};
