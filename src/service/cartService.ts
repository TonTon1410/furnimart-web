// src/service/cartService.ts
import axiosClient from "@/service/axiosClient"

export interface CartItemDTO {
  productId: string
  productName: string
  thumbnail: string
  price: number
  quantity: number
  totalItemPrice: number
}
export interface CartDTO {
  cartId: number
  userId: string
  items: CartItemDTO[]
  totalPrice: number
}
export interface ApiResponse<T = any> {
  status: number
  message: string
  data: T
  timestamp: string
  redirectUrl?: string
}

// ✅ Cart chạy cổng 8085
const CART_BASE = "http://152.53.169.79:8085/api"

export const cartService = {
  // GET /api/carts  →  http://152.53.169.79:8085/api/carts
  async getMyCart() {
    const res = await axiosClient.get<ApiResponse<CartDTO>>(`${CART_BASE}/carts`)
    return res.data.data
  },

  // POST /api/carts/add?productId=&quantity=
  async add(productId: string, quantity: number) {
    const res = await axiosClient.post<ApiResponse>(`${CART_BASE}/carts/add`, null, {
      params: { productId, quantity },
    })
    return res.data
  },

  // PATCH /api/carts/update?productId=&quantity=
  async update(productId: string, quantity: number) {
    const res = await axiosClient.patch<ApiResponse>(`${CART_BASE}/carts/update`, null, {
      params: { productId, quantity },
    })
    return res.data
  },

  // DELETE /api/carts/remove/{productId}
  async removeOne(productId: string) {
    const res = await axiosClient.delete<ApiResponse>(`${CART_BASE}/carts/remove/${productId}`)
    return res.data
  },

  // DELETE /api/carts/remove?productIds=aaa&productIds=bbb
  async removeMany(productIds: string[]) {
    const params = new URLSearchParams()
    productIds.forEach((id) => params.append("productIds", id))
    const res = await axiosClient.delete<ApiResponse>(`${CART_BASE}/carts/remove?${params.toString()}`)
    return res.data
  },
}
