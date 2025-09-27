// src/service/addressService.ts
import axiosClient from "./axiosClient";
import { authService } from "./authService";

export interface Address {
  id: string;
  name: string;
  phone: string;
  city: string;
  district: string;
  ward: string;
  addressLine: string;
  isDefault: boolean;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAddressRequest {
  name: string;
  phone: string;
  city: string;
  district: string;
  ward: string;
  addressLine: string;
  isDefault?: boolean;
}

export interface UpdateAddressRequest {
  name?: string;
  phone?: string;
  city?: string;
  district?: string;
  ward?: string;
  addressLine?: string;
  isDefault?: boolean;
}

export interface ApiResponse<T> {
  status: number;
  message: string;
  data: T;
  timestamp?: string;
}

export const addressService = {
  // Lấy tất cả địa chỉ của user hiện tại
  async getAddresses(): Promise<ApiResponse<Address[]>> {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error("Token không tồn tại");
      }

      const response = await axiosClient.get("/addresses", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      // Xử lý response data
      let addressData = response.data;
      if (typeof addressData === 'object' && addressData !== null) {
        // Nếu response có structure { data: [...] }
        if (addressData.data && Array.isArray(addressData.data)) {
          addressData = addressData.data;
        }
        // Nếu response trực tiếp là array
        else if (Array.isArray(addressData)) {
          addressData = addressData;
        }
        // Nếu response là object khác
        else {
          addressData = [];
        }
      } else {
        addressData = [];
      }

      return {
        status: response.status,
        message: "Lấy danh sách địa chỉ thành công",
        data: addressData,
      };
    } catch (error: any) {
      console.error("Get addresses error:", error);
      
      // Xử lý các loại lỗi khác nhau
      if (error.response) {
        throw {
          status: error.response.status,
          message: error.response.data?.message || `API Error: ${error.response.status}`,
          data: [],
        };
      } else if (error.request) {
        throw {
          status: 500,
          message: "Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.",
          data: [],
        };
      } else {
        throw {
          status: 500,
          message: error.message || "Lỗi khi lấy danh sách địa chỉ",
          data: [],
        };
      }
    }
  },

  // Lấy địa chỉ theo ID
  async getAddressById(id: string): Promise<ApiResponse<Address>> {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error("Token không tồn tại");
      }

      if (!id || id.trim() === '') {
        throw new Error("ID địa chỉ không hợp lệ");
      }

      const response = await axiosClient.get(`/addresses/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      let addressData = response.data;
      if (typeof addressData === 'object' && addressData !== null) {
        if (addressData.data) {
          addressData = addressData.data;
        }
      }

      return {
        status: response.status,
        message: "Lấy thông tin địa chỉ thành công",
        data: addressData,
      };
    } catch (error: any) {
      console.error("Get address by ID error:", error);
      
      if (error.response) {
        throw {
          status: error.response.status,
          message: error.response.data?.message || `API Error: ${error.response.status}`,
          data: null,
        };
      } else {
        throw {
          status: 500,
          message: error.message || "Lỗi khi lấy thông tin địa chỉ",
          data: null,
        };
      }
    }
  },

  // Tạo địa chỉ mới
  async createAddress(addressData: CreateAddressRequest): Promise<ApiResponse<Address>> {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error("Token không tồn tại");
      }

      // Validate dữ liệu
      const validationErrors = this.validateAddressData(addressData);
      if (validationErrors.length > 0) {
        throw new Error(validationErrors.join(", "));
      }

      // Chuẩn hóa dữ liệu trước khi gửi
      const cleanedData = {
        name: addressData.name.trim(),
        phone: addressData.phone.replace(/\s/g, ""),
        city: addressData.city?.trim() || "",
        district: addressData.district?.trim() || "",
        ward: addressData.ward?.trim() || "",
        addressLine: addressData.addressLine.trim(),
        isDefault: Boolean(addressData.isDefault),
      };

      const response = await axiosClient.post("/addresses", cleanedData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      let responseData = response.data;
      if (typeof responseData === 'object' && responseData !== null && responseData.data) {
        responseData = responseData.data;
      }

      return {
        status: response.status,
        message: "Tạo địa chỉ thành công",
        data: responseData,
      };
    } catch (error: any) {
      console.error("Create address error:", error);
      
      if (error.response) {
        throw {
          status: error.response.status,
          message: error.response.data?.message || `Tạo địa chỉ thất bại: ${error.response.status}`,
          data: null,
        };
      } else {
        throw {
          status: 500,
          message: error.message || "Lỗi khi tạo địa chỉ",
          data: null,
        };
      }
    }
  },

  // Cập nhật địa chỉ
  async updateAddress(id: string, addressData: UpdateAddressRequest): Promise<ApiResponse<Address>> {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error("Token không tồn tại");
      }

      if (!id || id.trim() === '') {
        throw new Error("ID địa chỉ không hợp lệ");
      }

      // Validate dữ liệu được cập nhật
      const validationErrors = this.validateAddressData(addressData);
      if (validationErrors.length > 0) {
        throw new Error(validationErrors.join(", "));
      }

      // Chuẩn hóa dữ liệu
      const cleanedData: UpdateAddressRequest = {};
      if (addressData.name !== undefined) cleanedData.name = addressData.name.trim();
      if (addressData.phone !== undefined) cleanedData.phone = addressData.phone.replace(/\s/g, "");
      if (addressData.city !== undefined) cleanedData.city = addressData.city.trim();
      if (addressData.district !== undefined) cleanedData.district = addressData.district.trim();
      if (addressData.ward !== undefined) cleanedData.ward = addressData.ward.trim();
      if (addressData.addressLine !== undefined) cleanedData.addressLine = addressData.addressLine.trim();
      if (addressData.isDefault !== undefined) cleanedData.isDefault = Boolean(addressData.isDefault);

      const response = await axiosClient.put(`/addresses/${id}`, cleanedData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      let responseData = response.data;
      if (typeof responseData === 'object' && responseData !== null && responseData.data) {
        responseData = responseData.data;
      }

      return {
        status: response.status,
        message: "Cập nhật địa chỉ thành công",
        data: responseData,
      };
    } catch (error: any) {
      console.error("Update address error:", error);
      
      if (error.response) {
        throw {
          status: error.response.status,
          message: error.response.data?.message || `Cập nhật địa chỉ thất bại: ${error.response.status}`,
          data: null,
        };
      } else {
        throw {
          status: 500,
          message: error.message || "Lỗi khi cập nhật địa chỉ",
          data: null,
        };
      }
    }
  },

  // Xóa địa chỉ
  async deleteAddress(id: string): Promise<ApiResponse<boolean>> {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error("Token không tồn tại");
      }

      if (!id || id.trim() === '') {
        throw new Error("ID địa chỉ không hợp lệ");
      }

      const response = await axiosClient.delete(`/addresses/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return {
        status: response.status,
        message: "Xóa địa chỉ thành công",
        data: true,
      };
    } catch (error: any) {
      console.error("Delete address error:", error);
      
      if (error.response) {
        throw {
          status: error.response.status,
          message: error.response.data?.message || `Xóa địa chỉ thất bại: ${error.response.status}`,
          data: false,
        };
      } else {
        throw {
          status: 500,
          message: error.message || "Lỗi khi xóa địa chỉ",
          data: false,
        };
      }
    }
  },

  // Đặt địa chỉ làm mặc định
  async setDefaultAddress(id: string): Promise<ApiResponse<Address>> {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error("Token không tồn tại");
      }

      if (!id || id.trim() === '') {
        throw new Error("ID địa chỉ không hợp lệ");
      }

      const response = await axiosClient.patch(`/addresses/${id}/set-default`, {}, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      let responseData = response.data;
      if (typeof responseData === 'object' && responseData !== null && responseData.data) {
        responseData = responseData.data;
      }

      return {
        status: response.status,
        message: "Đặt địa chỉ mặc định thành công",
        data: responseData,
      };
    } catch (error: any) {
      console.error("Set default address error:", error);
      
      if (error.response) {
        throw {
          status: error.response.status,
          message: error.response.data?.message || `Đặt địa chỉ mặc định thất bại: ${error.response.status}`,
          data: null,
        };
      } else {
        throw {
          status: 500,
          message: error.message || "Lỗi khi đặt địa chỉ mặc định",
          data: null,
        };
      }
    }
  },

  // Lấy địa chỉ mặc định của user
  async getDefaultAddress(): Promise<ApiResponse<Address | null>> {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error("Token không tồn tại");
      }

      const response = await axiosClient.get("/addresses/user/default", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      let responseData = response.data;
      if (typeof responseData === 'object' && responseData !== null && responseData.data) {
        responseData = responseData.data;
      }

      return {
        status: response.status,
        message: "Lấy địa chỉ mặc định thành công",
        data: responseData,
      };
    } catch (error: any) {
      console.error("Get default address error:", error);
      
      if (error.response) {
        throw {
          status: error.response.status,
          message: error.response.data?.message || `Lấy địa chỉ mặc định thất bại: ${error.response.status}`,
          data: null,
        };
      } else {
        throw {
          status: 500,
          message: error.message || "Lỗi khi lấy địa chỉ mặc định",
          data: null,
        };
      }
    }
  },

  // Tìm kiếm địa chỉ theo location
  async searchAddresses(location: string): Promise<ApiResponse<Address[]>> {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error("Token không tồn tại");
      }

      if (!location || location.trim() === '') {
        throw new Error("Từ khóa tìm kiếm không được để trống");
      }

      const response = await axiosClient.get("/addresses/search", {
        params: { location: location.trim() },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      let responseData = response.data;
      if (typeof responseData === 'object' && responseData !== null) {
        if (responseData.data && Array.isArray(responseData.data)) {
          responseData = responseData.data;
        } else if (!Array.isArray(responseData)) {
          responseData = [];
        }
      } else {
        responseData = [];
      }

      return {
        status: response.status,
        message: "Tìm kiếm địa chỉ thành công",
        data: responseData,
      };
    } catch (error: any) {
      console.error("Search addresses error:", error);
      
      if (error.response) {
        throw {
          status: error.response.status,
          message: error.response.data?.message || `Tìm kiếm địa chỉ thất bại: ${error.response.status}`,
          data: [],
        };
      } else {
        throw {
          status: 500,
          message: error.message || "Lỗi khi tìm kiếm địa chỉ",
          data: [],
        };
      }
    }
  },

  // Lấy địa chỉ với phân trang
  async getAddressesWithPagination(page: number = 1, limit: number = 10): Promise<ApiResponse<{
    addresses: Address[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }>> {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error("Token không tồn tại");
      }

      const response = await axiosClient.get("/addresses/paginated", {
        params: { 
          page: Math.max(1, page), 
          limit: Math.min(Math.max(1, limit), 100) 
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      let responseData = response.data;
      if (typeof responseData === 'object' && responseData !== null && responseData.data) {
        responseData = responseData.data;
      }

      // Đảm bảo structure đúng
      if (!responseData.addresses) {
        responseData = {
          addresses: Array.isArray(responseData) ? responseData : [],
          pagination: {
            page: page,
            limit: limit,
            total: Array.isArray(responseData) ? responseData.length : 0,
            totalPages: 1,
          },
        };
      }

      return {
        status: response.status,
        message: "Lấy danh sách địa chỉ thành công",
        data: responseData,
      };
    } catch (error: any) {
      console.error("Get addresses with pagination error:", error);
      
      if (error.response) {
        throw {
          status: error.response.status,
          message: error.response.data?.message || `Lấy danh sách địa chỉ thất bại: ${error.response.status}`,
          data: {
            addresses: [],
            pagination: {
              page: 1,
              limit: 10,
              total: 0,
              totalPages: 0,
            },
          },
        };
      } else {
        throw {
          status: 500,
          message: error.message || "Lỗi khi lấy danh sách địa chỉ",
          data: {
            addresses: [],
            pagination: {
              page: 1,
              limit: 10,
              total: 0,
              totalPages: 0,
            },
          },
        };
      }
    }
  },

  // Validate dữ liệu địa chỉ
  validateAddressData(data: CreateAddressRequest | UpdateAddressRequest): string[] {
    const errors: string[] = [];

    // Kiểm tra tên
    if ('name' in data && data.name !== undefined) {
      if (!data.name || !data.name.trim()) {
        errors.push("Họ và tên không được để trống");
      } else if (data.name.trim().length < 2) {
        errors.push("Họ và tên phải có ít nhất 2 ký tự");
      } else if (data.name.trim().length > 100) {
        errors.push("Họ và tên không được vượt quá 100 ký tự");
      }
    }

    // Kiểm tra số điện thoại
    if ('phone' in data && data.phone !== undefined) {
      const phoneRegex = /^[0-9]{10,11}$/;
      if (!data.phone || !data.phone.trim()) {
        errors.push("Số điện thoại không được để trống");
      } else if (!phoneRegex.test(data.phone.replace(/\s/g, ""))) {
        errors.push("Số điện thoại không hợp lệ (10-11 số)");
      }
    }

    // Kiểm tra địa chỉ chi tiết
    if ('addressLine' in data && data.addressLine !== undefined) {
      if (!data.addressLine || !data.addressLine.trim()) {
        errors.push("Địa chỉ chi tiết không được để trống");
      } else if (data.addressLine.trim().length < 5) {
        errors.push("Địa chỉ chi tiết phải có ít nhất 5 ký tự");
      } else if (data.addressLine.trim().length > 500) {
        errors.push("Địa chỉ chi tiết không được vượt quá 500 ký tự");
      }
    }

    // Kiểm tra thành phố
    if ('city' in data && data.city !== undefined && data.city && data.city.trim().length > 100) {
      errors.push("Tên thành phố không được vượt quá 100 ký tự");
    }

    // Kiểm tra quận/huyện
    if ('district' in data && data.district !== undefined && data.district && data.district.trim().length > 100) {
      errors.push("Tên quận/huyện không được vượt quá 100 ký tự");
    }

    // Kiểm tra phường/xã
    if ('ward' in data && data.ward !== undefined && data.ward && data.ward.trim().length > 100) {
      errors.push("Tên phường/xã không được vượt quá 100 ký tự");
    }

    return errors;
  },

  // Format địa chỉ để hiển thị
  formatAddress(address: Address): string {
    if (!address) return "";
    
    const parts = [
      address.addressLine,
      address.ward,
      address.district,
      address.city,
    ].filter(part => part && part.trim());

    return parts.join(", ");
  },

  // Kiểm tra xem có phải địa chỉ mặc định không
  isDefaultAddress(address: Address): boolean {
    return Boolean(address && address.isDefault);
  },

  // Debug thông tin service
  debugAddressService() {
    return {
      serviceAvailable: true,
      authToken: authService.getToken() ? "Available" : "Missing",
      baseURL: axiosClient.defaults.baseURL,
      timestamp: new Date().toISOString(),
    };
  },
};