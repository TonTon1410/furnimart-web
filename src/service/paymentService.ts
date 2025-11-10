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
  CANCELLED = "CANCELLED",
}

// ==================== CARD MANAGEMENT ====================

export interface Card {
  id: number;
  cardType: string;
  lastFour: string;
  holder: string;
  expiry: string;
  isDefault: boolean;
  cardNetwork: string;
  createdAt?: string;
}

export interface AddCardPayload {
  cardNumber: string;
  expiry: string;
  cvv: string;
  holderName: string;
  cardType?: string;
}

export const cardService = {
  // GET - Lấy tất cả thẻ của user
  async getCards(): Promise<Card[]> {
    try {
      console.log("🔍 [CardService] Fetching cards...");
      const res = await axiosClient.get("/cards");
      
      // Backend có thể trả về format khác nhau
      const cards = res.data?.data || res.data?.cards || res.data || [];
      console.log("✅ [CardService] Cards fetched:", cards);
      
      return Array.isArray(cards) ? cards : [];
    } catch (error: any) {
      console.error("❌ [CardService] Error fetching cards:", error);
      
      // Nếu endpoint chưa có, trả về mock data
      if (error.response?.status === 404) {
        console.log("📝 [CardService] Using mock data (endpoint not found)");
        return [];
      }
      
      throw error;
    }
  },

  // POST - Thêm thẻ mới
  async addCard(payload: AddCardPayload): Promise<Card> {
    try {
      console.log("📝 [CardService] Adding card:", { holder: payload.holderName });
      
      const res = await axiosClient.post("/cards", payload);
      
      const card = res.data?.data?.card || res.data?.card || res.data?.data || res.data;
      console.log("✅ [CardService] Card added:", card);
      
      return card;
    } catch (error: any) {
      console.error("❌ [CardService] Error adding card:", error);
      
      // Xử lý lỗi validation từ backend
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      
      throw new Error("Không thể thêm thẻ. Vui lòng thử lại.");
    }
  },

  // DELETE - Xóa thẻ
  async deleteCard(cardId: number): Promise<void> {
    try {
      console.log("🗑️ [CardService] Deleting card:", cardId);
      
      await axiosClient.delete(`/cards/${cardId}`);
      
      console.log("✅ [CardService] Card deleted");
    } catch (error: any) {
      console.error("❌ [CardService] Error deleting card:", error);
      
      if (error.response?.status === 404) {
        throw new Error("Không tìm thấy thẻ");
      }
      
      throw new Error("Không thể xóa thẻ. Vui lòng thử lại.");
    }
  },

  // PATCH - Đặt thẻ mặc định
  async setDefaultCard(cardId: number): Promise<void> {
    try {
      console.log("⭐ [CardService] Setting default card:", cardId);
      
      await axiosClient.patch(`/cards/${cardId}/default`);
      
      console.log("✅ [CardService] Default card set");
    } catch (error: any) {
      console.error("❌ [CardService] Error setting default:", error);
      throw new Error("Không thể đặt thẻ mặc định. Vui lòng thử lại.");
    }
  },
};

// ==================== PAYMENT HISTORY ====================

export interface Payment {
  id: string;
  amount: string;
  currency: string;
  date: string;
  status: string;
  description: string;
  cardLastFour: string;
}

export const paymentHistoryService = {
  // GET - Lấy lịch sử thanh toán
  async getHistory(): Promise<Payment[]> {
    try {
      console.log("🔍 [PaymentHistory] Fetching history...");
      
      const res = await axiosClient.get("/payments/history");
      
      const payments = res.data?.data || res.data?.payments || res.data || [];
      console.log("✅ [PaymentHistory] History fetched:", payments);
      
      return Array.isArray(payments) ? payments : [];
    } catch (error: any) {
      console.error("❌ [PaymentHistory] Error fetching history:", error);
      
      // Nếu endpoint chưa có, trả về mock data
      if (error.response?.status === 404) {
        console.log("📝 [PaymentHistory] Using mock data");
        return [];
      }
      
      throw error;
    }
  },
};

// ==================== ORIGINAL PAYMENT SERVICE ====================

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
      const cleanQuery = queryString.startsWith("?")
        ? queryString.substring(1)
        : queryString;

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
    return axiosClient.put(
      `${API_BASE_URL}/orders/status/${orderId}?status=${status}`
    );
  },

  getAddressesByUserId: async (userId: string) => {
    return axiosClient.get(`${API_BASE_URL}/addresses/user/${userId}`);
  },
};