import axiosClient from "@/service/axiosClient"
const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://152.53.169.79:8080/api";
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


export const cartService = {
  // GET /api/carts
  async getMyCart() {
  const res = await axiosClient.get<ApiResponse<CartDTO>>(`${BASE_URL}/carts`)
    return res.data.data
  },

  // POST /api/carts/add?productId=&quantity=&colorId=
  async add(productId: string, quantity: number, colorId: string) {
    const res = await axiosClient.post<ApiResponse>(`${BASE_URL}/carts/add`, null, {
      params: { productId, quantity, colorId },
    });
    return res.data;
  },

  // PATCH /api/carts/update?productId=&quantity=
  async update(productId: string, quantity: number) {
    const res = await axiosClient.patch<ApiResponse>(`${BASE_URL}/carts/update`, null, {
      params: { productId, quantity },
    })
    return res.data
  },

  // DELETE /api/carts/remove/{productId}
  async removeOne(productId: string) {
    const res = await axiosClient.delete<ApiResponse>(`${BASE_URL}/carts/remove/${productId}`)
    return res.data
  },

  // DELETE /api/carts/remove?productIds=aaa&productIds=bbb
  async removeMany(productIds: string[]) {
    const params = new URLSearchParams()
    productIds.forEach((id) => params.append("productIds", id))
    const res = await axiosClient.delete<ApiResponse>(`${BASE_URL}/carts/remove?${params.toString()}`)
    return res.data
  },
}

