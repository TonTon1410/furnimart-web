/* eslint-disable @typescript-eslint/no-explicit-any */
import axiosClient from "./axiosClient";

export interface Warranty {
  id: number;
  orderId: number;
  orderDetailId: number;
  productColorId: string;
  description?: string;
  warrantyDurationMonths: number;
  warrantyStartDate: string;
  warrantyEndDate: string;
  status: "ACTIVE" | "EXPIRED" | "CLAIMED";
  maxClaims: number;
  claimCount: number;
  canClaimWarranty: boolean;
  createdAt: string;
  updatedAt: string;
  // Optional - need to fetch from order details
  productColor?: {
    product?: { name: string };
    color?: { colorName: string };
    images?: Array<{ image: string }>;
  };
}

export interface WarrantyClaimItem {
  warrantyId: number;
  quantity: number;
  issueDescription: string;
  customerPhotos?: string[];
}

export interface CreateWarrantyClaimPayload {
  orderId: number;
  addressId?: number;
  items: WarrantyClaimItem[];
}

export interface WarrantyClaim {
  id: number;
  orderId: number;
  customerId: string;
  addressId: number;
  claimDate: string;
  status:
    | "PENDING"
    | "UNDER_REVIEW"
    | "APPROVED"
    | "REJECTED"
    | "RESOLVED"
    | "CANCELLED";
  adminResponse: string | null;
  resolutionNotes: string | null;
  resolutionPhotos: string[] | null;
  resolvedDate: string | null;
  adminId: string | null;
  actionType: "RETURN" | "REPAIR" | "DO_NOTHING" | null;
  repairCost: number | null;
  refundAmount: number | null;
  warrantyOrderId: number | null;
  createdAt: string;
  updatedAt: string;
  items: Array<{
    id: number;
    warrantyId: number;
    quantity: number;
    issueDescription: string;
    customerPhotos?: string[];
    productColorId: string;
  }>;
}

const warrantyService = {
  // Lấy danh sách warranties từ order
  getWarrantiesByOrder: async (orderId: number): Promise<Warranty[]> => {
    try {
      const response = await axiosClient.get(`/warranties/order/${orderId}`);
      // API returns { data: { data: [...], status: 200, message: "..." } }
      return response.data.data || response.data || [];
    } catch (error: any) {
      console.error("Error fetching warranties:", error);
      throw error;
    }
  },

  // Tạo warranty claim
  createWarrantyClaim: async (
    payload: CreateWarrantyClaimPayload
  ): Promise<WarrantyClaim> => {
    try {
      const response = await axiosClient.post("/warranties/claims", payload);
      return response.data;
    } catch (error: any) {
      console.error("Error creating warranty claim:", error);
      throw error;
    }
  },

  // Kiểm tra warranty claim của order
  getWarrantyClaimByOrder: async (
    orderId: number
  ): Promise<WarrantyClaim | null> => {
    try {
      const response = await axiosClient.get(
        `/warranties/claims/order/${orderId}`
      );
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      console.error("Error fetching warranty claim:", error);
      throw error;
    }
  },

  // Lấy danh sách warranty claims của customer
  getWarrantyClaimsByCustomer: async (
    customerId: string
  ): Promise<WarrantyClaim[]> => {
    try {
      const response = await axiosClient.get(
        `/warranties/claims/customer/${customerId}`
      );
      return response.data.data || response.data || [];
    } catch (error: any) {
      console.error("Error fetching customer warranty claims:", error);
      throw error;
    }
  },
};

export default warrantyService;
