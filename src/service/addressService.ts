/* eslint-disable @typescript-eslint/no-explicit-any */
// src/service/addressService.ts
import axiosClient from "./axiosClient";

// ============================================
// INTERFACES
// ============================================

export interface Address {
  id: number;         // ✅ Đổi từ string thành number
  name: string;
  phone: string;
  city?: string;
  district?: string;
  ward?: string;
  street?: string;
  addressLine: string;
  isDefault: boolean;
  userId: string;
  userName?: string;      // Tên user (từ backend)
  fullAddress?: string;   // Địa chỉ đầy đủ đã format (từ backend)
  createdAt: string;
  updatedAt: string;
}

export interface CreateAddressPayload {
  name: string;
  phone: string;
  city?: string;
  district?: string;
  ward?: string;
  street?: string;
  addressLine: string;
  isDefault: boolean;
  userId?: string;  // Thêm dòng này
}

export interface UpdateAddressPayload {
 name: string;
  phone: string;
  city?: string;
  district?: string;
  ward?: string;
  street?: string;
  addressLine: string;
  isDefault: boolean;
  userId?: string;  // Thêm dòng này
}

export interface ApiResponse<T> {
  status: number;
  message: string;
  data: T;
  timestamp: string;
}

export interface PaginationParams {
  page?: number;
  size?: number;
  sort?: string;
}

export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface BulkOperationResult {
  successCount: number;
  failureCount: number;
  failedIds?: string[];
  errors?: Array<{ id: string; message: string }>;
}

export interface ImportOptions {
  overwriteExisting?: boolean;
  skipInvalid?: boolean;
}

// ============================================
// ADDRESS SERVICE
// ============================================

export const addressService = {
  /**
   * Lấy tất cả địa chỉ của user hiện tại (dựa vào userId từ token)
   * GET /api/addresses/user/{userId}
   */
  getAddressesByUserId: async (userId: string): Promise<ApiResponse<Address[]>> => {
    try {
      const response = await axiosClient.get<ApiResponse<Address[]>>(
        `/addresses/user/${userId}`
      );
      return response.data;
    } catch (error: any) {
      console.error("getAddressesByUserId error:", error);
      throw new Error(
        error.response?.data?.message || 
        "Không thể lấy danh sách địa chỉ"
      );
    }
  },

  /**
   * Lấy tất cả địa chỉ của user với phân trang
   * GET /api/addresses/user/{userId}/paginated
   */
  getAddressesPaginated: async (
    userId: string, 
    params?: PaginationParams
  ): Promise<ApiResponse<PaginatedResponse<Address>>> => {
    try {
      const response = await axiosClient.get<ApiResponse<PaginatedResponse<Address>>>(
        `/addresses/user/${userId}/paginated`,
        { params }
      );
      return response.data;
    } catch (error: any) {
      console.error("getAddressesPaginated error:", error);
      throw new Error(
        error.response?.data?.message || 
        "Không thể lấy danh sách địa chỉ phân trang"
      );
    }
  },

  /**
   * Lấy địa chỉ mặc định của user
   * GET /api/addresses/user/{userId}/default
   */
  getDefaultAddress: async (userId: string): Promise<ApiResponse<Address>> => {
    try {
      const response = await axiosClient.get<ApiResponse<Address>>(
        `/addresses/user/${userId}/default`
      );
      return response.data;
    } catch (error: any) {
      console.error("getDefaultAddress error:", error);
      throw new Error(
        error.response?.data?.message || 
        "Không thể lấy địa chỉ mặc định"
      );
    }
  },

  /**
   * Lấy chi tiết một địa chỉ theo ID
   * GET /api/addresses/{id}
   */
  getAddressById: async (addressId: number): Promise<ApiResponse<Address>> => {
    try {
      const response = await axiosClient.get<ApiResponse<Address>>(
        `/addresses/${addressId}`
      );
      return response.data;
    } catch (error: any) {
      console.error("getAddressById error:", error);
      throw new Error(
        error.response?.data?.message || 
        "Không thể lấy thông tin địa chỉ"
      );
    }
  },

  /**
   * Tạo địa chỉ mới (userId sẽ được tự động lấy từ token trong backend)
   * POST /api/addresses
   */
  createAddress: async (payload: CreateAddressPayload): Promise<ApiResponse<Address>> => {
    try {
      console.log("📤 Creating address with payload:", payload);
      
      const response = await axiosClient.post<ApiResponse<Address>>(
        "/addresses",
        payload
      );
      
      console.log("✅ Create address response:", response.data);
      return response.data;
    } catch (error: any) {
      console.error("❌ createAddress error:", error);
      console.error("❌ Error response data:", error.response?.data);
      console.error("❌ Error status:", error.response?.status);
      
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error ||
                          error.response?.data?.errors?.[0]?.message ||
                          "Không thể tạo địa chỉ mới";
      
      throw new Error(errorMessage);
    }
  },

  /**
   * Cập nhật địa chỉ theo ID
   * PUT /api/addresses/{id}
   */
  updateAddress: async (
    addressId: number | string,
    payload: UpdateAddressPayload
  ): Promise<ApiResponse<Address>> => {
    try {
      console.log("📤 Updating address with payload:", payload);
      
      const response = await axiosClient.put<ApiResponse<Address>>(
        `/addresses/${addressId}`,
        payload
      );
      
      console.log("✅ Update address response:", response.data);
      return response.data;
    } catch (error: any) {
      console.error("❌ updateAddress error:", error);
      console.error("❌ Error response data:", error.response?.data);
      
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error ||
                          error.response?.data?.errors?.[0]?.message ||
                          "Không thể cập nhật địa chỉ";
      
      throw new Error(errorMessage);
    }
  },

  /**
   * Xóa địa chỉ theo ID
   * DELETE /api/addresses/{id}
   */
  deleteAddress: async (addressId: number | string): Promise<ApiResponse<void>> => {
    try {
      const response = await axiosClient.delete<ApiResponse<void>>(
        `/addresses/${addressId}`
      );
      return response.data;
    } catch (error: any) {
      console.error("deleteAddress error:", error);
      throw new Error(
        error.response?.data?.message || 
        "Không thể xóa địa chỉ"
      );
    }
  },

  /**
   * Đặt địa chỉ làm mặc định
   * PATCH /api/addresses/{id}/set-default
   */
  setDefaultAddress: async (addressId: number | string): Promise<ApiResponse<Address>> => {
    try {
      const response = await axiosClient.patch<ApiResponse<Address>>(
        `/addresses/${addressId}/set-default`
      );
      return response.data;
    } catch (error: any) {
      console.error("setDefaultAddress error:", error);
      throw new Error(
        error.response?.data?.message || 
        "Không thể đặt địa chỉ mặc định"
      );
    }
  },

  /**
   * Tìm kiếm địa chỉ theo vị trí (city, district, ward...)
   * GET /api/addresses/search
   */
  searchAddresses: async (params: {
    city?: string;
    district?: string;
    ward?: string;
    street?: string;
    keyword?: string;
  }): Promise<ApiResponse<Address[]>> => {
    try {
      const response = await axiosClient.get<ApiResponse<Address[]>>(
        "/addresses/search",
        { params }
      );
      return response.data;
    } catch (error: any) {
      console.error("searchAddresses error:", error);
      throw new Error(
        error.response?.data?.message || 
        "Không thể tìm kiếm địa chỉ"
      );
    }
  },

  // ============================================
  // BULK OPERATIONS (Nếu backend hỗ trợ)
  // ============================================

  /**
   * Xóa nhiều địa chỉ cùng lúc
   * DELETE /api/addresses/bulk
   */
  deleteBulkAddresses: async (
    addressIds: number[]
  ): Promise<ApiResponse<BulkOperationResult>> => {
    try {
      const response = await axiosClient.delete<ApiResponse<BulkOperationResult>>(
        "/addresses/bulk",
        { data: { ids: addressIds } }
      );
      return response.data;
    } catch (error: any) {
      console.error("deleteBulkAddresses error:", error);
      throw new Error(
        error.response?.data?.message || 
        "Không thể xóa hàng loạt"
      );
    }
  },

  /**
   * Sao chép địa chỉ
   * POST /api/addresses/{id}/duplicate
   */
  duplicateAddress: async (
    addressId: number | string,
    newName: string
  ): Promise<ApiResponse<Address>> => {
    try {
      const response = await axiosClient.post<ApiResponse<Address>>(
        `/addresses/${addressId}/duplicate`,
        { name: newName }
      );
      return response.data;
    } catch (error: any) {
      console.error("duplicateAddress error:", error);
      throw new Error(
        error.response?.data?.message || 
        "Không thể sao chép địa chỉ"
      );
    }
  },

  // ============================================
  // IMPORT/EXPORT OPERATIONS
  // ============================================

  /**
   * Export địa chỉ ra file
   * GET /api/addresses/export
   */
  exportAddresses: async (
    format: "json" | "csv" | "xlsx" = "json"
  ): Promise<{ data: any }> => {
    try {
      if (format === "json") {
        // Với JSON, trả về data trực tiếp
        const response = await axiosClient.get<ApiResponse<Address[]>>(
          `/addresses/export`,
          { params: { format } }
        );
        return { data: response.data.data };
      } else {
        // Với CSV/XLSX, trả về blob
        const response = await axiosClient.get(`/addresses/export`, {
          params: { format },
          responseType: "blob",
        });
        return { data: response.data };
      }
    } catch (error: any) {
      console.error("exportAddresses error:", error);
      throw new Error(
        error.response?.data?.message || 
        "Không thể export dữ liệu"
      );
    }
  },

  /**
   * Import địa chỉ từ file
   * POST /api/addresses/import
   */
  importAddresses: async (
    file: File,
    options?: ImportOptions
  ): Promise<ApiResponse<BulkOperationResult>> => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      
      if (options?.overwriteExisting !== undefined) {
        formData.append("overwriteExisting", String(options.overwriteExisting));
      }
      if (options?.skipInvalid !== undefined) {
        formData.append("skipInvalid", String(options.skipInvalid));
      }

      const response = await axiosClient.post<ApiResponse<BulkOperationResult>>(
        "/addresses/import",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return response.data;
    } catch (error: any) {
      console.error("importAddresses error:", error);
      throw new Error(
        error.response?.data?.message || 
        "Không thể import dữ liệu"
      );
    }
  },

  // ============================================
  // UTILITY FUNCTIONS
  // ============================================

  /**
   * Format địa chỉ đầy đủ thành chuỗi
   */
  formatAddress: (address: Address): string => {
    const parts = [
      address.addressLine,
      address.street,
      address.ward,
      address.district,
      address.city,
    ].filter(Boolean);

    return parts.join(", ");
  },

  /**
   * Validate phone number (Vietnam format)
   */
  validatePhone: (phone: string): boolean => {
    const phoneRegex = /(84|0[3|5|7|8|9])+([0-9]{8})\b/;
    return phoneRegex.test(phone);
  },

  /**
   * Validate địa chỉ đầu vào
   */
  validateAddress: (address: Partial<CreateAddressPayload>): string[] => {
    const errors: string[] = [];

    if (!address.name?.trim()) {
      errors.push("Tên người nhận không được để trống");
    }

    if (!address.phone?.trim()) {
      errors.push("Số điện thoại không được để trống");
    } else if (!addressService.validatePhone(address.phone)) {
      errors.push("Số điện thoại không hợp lệ");
    }

    if (!address.addressLine?.trim()) {
      errors.push("Địa chỉ chi tiết không được để trống");
    }

    return errors;
  },

  /**
   * Lọc địa chỉ theo từ khóa (client-side filtering)
   */
  filterAddressesByKeyword: (
    addresses: Address[],
    keyword: string
  ): Address[] => {
    if (!keyword.trim()) return addresses;

    const lowerKeyword = keyword.toLowerCase();

    return addresses.filter((addr) => {
      const searchFields = [
        addr.name,
        addr.phone,
        addr.addressLine,
        addr.street,
        addr.ward,
        addr.district,
        addr.city,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchFields.includes(lowerKeyword);
    });
  },

  /**
   * Sắp xếp địa chỉ (default address lên đầu)
   */
  sortAddresses: (addresses: Address[]): Address[] => {
    return [...addresses].sort((a, b) => {
      if (a.isDefault && !b.isDefault) return -1;
      if (!a.isDefault && b.isDefault) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  },
};