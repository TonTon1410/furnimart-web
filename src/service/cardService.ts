import axiosClient from "@/service/axiosClient"

export interface Card {
  id: string
  cardNumber: string
  cardholderName: string
  expiryDate: string
  cvv?: string
  cardType: string
  billingAddress?: string
  isDefault?: boolean
  createdAt?: string
}

export interface ApiResponse<T> {
  status: number
  message: string
  data: T
}

export const cardService = {
  // Lấy danh sách tất cả thẻ
  async getAllCards() {
    const res = await axiosClient.get<ApiResponse<Card[]>>("/payment/cards")
    return res.data
  },

  // Lấy thẻ theo ID
  async getCardById(cardId: string) {
    const res = await axiosClient.get<ApiResponse<Card>>(`/payment/cards/${cardId}`)
    return res.data
  },

  // Thêm thẻ mới
  async addCard(cardData: Omit<Card, "id" | "createdAt">) {
    const res = await axiosClient.post<ApiResponse<Card>>("/payment/cards", cardData)
    return res.data
  },

  // Cập nhật thẻ
  async updateCard(cardId: string, cardData: Partial<Card>) {
    const res = await axiosClient.put<ApiResponse<Card>>(`/payment/cards/${cardId}`, cardData)
    return res.data
  },

  // Xóa thẻ
  async deleteCard(cardId: string) {
    const res = await axiosClient.delete<ApiResponse<null>>(`/payment/cards/${cardId}`)
    return res.data
  },

  // Đặt thẻ mặc định
  async setDefaultCard(cardId: string) {
    const res = await axiosClient.put<ApiResponse<Card>>(`/payment/cards/${cardId}/default`)
    return res.data
  },
}
