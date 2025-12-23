/* eslint-disable @typescript-eslint/no-explicit-any */
// src/service/ratingService.ts
import axiosClient from "./axiosClient";

/** ====== Interfaces ====== */

export interface RatingPayload {
  userId: string;
  productId: string;
  score: number;
  comment: string;
}

export interface RatingResponseData {
  id: number;
  userId: string;
  score: number;
  comment: string;
  createdAt: string;
  product?: any; // Chứa thông tin chi tiết product như bạn đã cung cấp
}

export interface ApiResponse<T> {
  status: number;
  message: string;
  data: T;
  timestamp: string;
}

const ratingService = {
  /**
   * POST /api/ratings/{orderId}
   * Tạo đánh giá cho sản phẩm dựa trên đơn hàng
   */
  createRating: async (orderId: number | string, payload: RatingPayload) => {
    try {
      const res = await axiosClient.post<ApiResponse<RatingResponseData>>(
        `/ratings/${orderId}`,
        payload
      );
      return res.data;
    } catch (error: any) {
      console.error("Error creating rating:", error);
      throw error;
    }
  },

  /**
   * GET /api/ratings/product/{productId}
   * Lấy danh sách đánh giá của một sản phẩm
   */
  getRatingsByProduct: async (productId: string | number) => {
    try {
      const res = await axiosClient.get<ApiResponse<RatingResponseData[]>>(
        `/ratings/product/${productId}`
      );
      return res.data;
    } catch (error: any) {
      console.error("Error fetching product ratings:", error);
      throw error;
    }
  },

  /**
   * GET /api/ratings/product/{productId}/average
   * Lấy điểm đánh giá trung bình của sản phẩm (Trả về data là number)
   */
  getAverageRating: async (productId: string | number) => {
    try {
      const res = await axiosClient.get<ApiResponse<number>>(
        `/ratings/product/${productId}/average`
      );
      return res.data;
    } catch (error: any) {
      console.error("Error fetching average rating:", error);
      throw error;
    }
  },

  /**
   * DELETE /api/ratings/{ratingId}
   * Xóa một đánh giá
   */
  deleteRating: async (ratingId: number | string) => {
    try {
      const res = await axiosClient.delete<ApiResponse<object>>(
        `/ratings/${ratingId}`
      );
      return res.data;
    } catch (error: any) {
      console.error("Error deleting rating:", error);
      throw error;
    }
  },
};

export default ratingService;