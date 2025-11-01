/* eslint-disable @typescript-eslint/no-explicit-any */
// src/service/cartService.ts
import axiosClient from "@/service/axiosClient";
const BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://152.53.169.79:8080/api";

export interface CartItemDTO {
  cartItemId: number;
  productId: string;
  productColorId: string; // ID của productColor (biến thể sản phẩm)
  productName: string;
  image: string;
  price: number;
  colorId: string;
  colorName: string;
  quantity: number;
  totalItemPrice: number;
}
export interface CartDTO {
  cartId: number;
  userId: string;
  items: CartItemDTO[];
  totalPrice: number;
}
export interface ApiResponse<T = any> {
  status: number;
  message: string;
  data: T;
  timestamp: string;
  redirectUrl?: string;
}

export const cartService = {
  async getMyCart() {
    const res = await axiosClient.get<ApiResponse<CartDTO>>(
      `${BASE_URL}/carts`
    );
    return res.data.data;
  },

  // POST /api/carts/add?productId=&quantity=&colorId=
  // async add(productId: string, quantity: number, colorId: string) {
  //   const res = await axiosClient.post<ApiResponse>(`${BASE_URL}/carts/add`, null, {
  //     params: { productId, quantity, colorId },
  //   });
  //   return res.data;
  // },

  // async clearCart() {
  //   const res = await axiosClient.delete<ApiResponse>(`${BASE_URL}/carts`);
  //   return res.data;
  // },

  // POST /api/carts/add?productColorId=&quantity=
  async add(productColorId: string, quantity: number) {
    const res = await axiosClient.post<ApiResponse>(
      `${BASE_URL}/carts/add`,
      null,
      {
        params: { productColorId, quantity },
      }
    );
    return res.data;
  },

  // DELETE /api/carts - Dọn sạch giỏ hàng
  async clearCart() {
    const res = await axiosClient.delete<ApiResponse>(`${BASE_URL}/carts`);
    return res.data;
  },

  // PATCH /api/carts/update?productColorId=&quantity=
  async update(productColorId: string, quantity: number) {
    const res = await axiosClient.patch<ApiResponse>(
      `${BASE_URL}/carts/update`,
      null,
      {
        params: { productColorId, quantity },
      }
    );
    return res.data;
  },

  // DELETE /api/carts/remove/{productColorId} - Xoá 1 sản phẩm khỏi giỏ hàng
  async removeOne(productColorId: string) {
    const res = await axiosClient.delete<ApiResponse>(
      `${BASE_URL}/carts/remove/${productColorId}`
    );
    return res.data;
  },

  // DELETE /api/carts/remove?productIds=aaa&productIds=bbb - Xoá nhiều sản phẩm
  async removeMany(productIds: string[]) {
    const params = new URLSearchParams();
    productIds.forEach((id) => params.append("productIds", id));
    const res = await axiosClient.delete<ApiResponse>(
      `${BASE_URL}/carts/remove?${params.toString()}`
    );
    return res.data;
  },
};
