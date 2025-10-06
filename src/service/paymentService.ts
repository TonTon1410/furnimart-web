import axiosClient from "@/service/axiosClient";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
export enum EnumProcessOrder {
    PENDING = "PENDING",
    PAYMENT = "PAYMENT",
    ASSIGN_ORDER_STORE = "ASSIGN_ORDER_STORE",
    MANAGER_ACCEPT = "MANAGER_ACCEPT",
    MANAGER_REJECT = "MANAGER_REJECT",
    CONFIRMED = "CONFIRMED",
    DELIVERED = "DELIVERED",
    FINISHED = "FINISHED",
    CANCELLED = "CANCELLED"
}
export const paymentService = {
  // Đặt hàng (checkout)
  async checkout(
    addressId: string,
    cartId: string,
    paymentMethod: "COD" | "VNPAY",
    voucherCode?: string | null
  ) {
    const url = "/orders/checkout";
    const params = {
      addressId,
      cartId,
      paymentMethod,
      voucherCode: voucherCode ?? "",
    };

    const res = await axiosClient.post(url, null, { params });
    return res.data;
  },


  // Tạo thanh toán VNPAY
  async createVnpay(amount: number, orderId: string) {
    const url = "/v1/payment/vnpay";
    const res = await axiosClient.post(url, { amount, orderId });
    return res.data;
  },

  async vnpayReturn(queryString: string) {
  try {
    const cleanQuery = queryString.startsWith('?') ? queryString.substring(1) : queryString;

    const searchParams = new URLSearchParams(cleanQuery);
    const params = Object.fromEntries(searchParams.entries());
    console.log(params);
    const res = await axiosClient.get("/v1/payment/vnpay-return", { params });

    return res.data; 
  } catch (error) {
    console.error("VNPay return error:", error);
    throw error;
  }
},

  updateStatus(orderId: number, status: EnumProcessOrder) {
    return axiosClient.put(`${API_BASE_URL}/orders/status/${orderId}?status=${status}`);
},


  getAddressesByUserId: async (userId: string) => {
    return axiosClient.get(`${API_BASE_URL}/addresses/user/${userId}`);
  },
};