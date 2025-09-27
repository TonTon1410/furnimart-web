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
  street?: string;
  isDefault: boolean;
  userId: string;
  userName?: string;
  fullAddress?: string;
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
  street?: string;
  isDefault?: boolean;
}

export interface UpdateAddressRequest {
  name?: string;
  phone?: string;
  city?: string;
  district?: string;
  ward?: string;
  addressLine?: string;
  street?: string;
  isDefault?: boolean;
}

export interface ApiResponse<T> {
  status: number;
  message: string;
  data: T;
  timestamp?: string;
}



export interface BulkOperationResult {
  successCount: number;
  failureCount: number;
  errors: Array<{
    index: number;
    error: string;
    address: CreateAddressRequest;
  }>;
  createdAddresses: Address[];
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

class AddressService {
  private readonly ENDPOINTS = {
    ADDRESSES: '/addresses',
    ADDRESS_BY_ID: (id: string) => `/addresses/${id}`,
    SET_DEFAULT: (id: string) => `/addresses/${id}/set-default`,
    DUPLICATE: (id: string) => `/addresses/${id}/duplicate`,
    BULK_DELETE: '/addresses/bulk',
    EXPORT: '/addresses/export',
    IMPORT: '/addresses/import',
  } as const;

  // Validation utilities
  private validateRequired(value: any, fieldName: string): string[] {
    const errors: string[] = [];
    if (!value || (typeof value === 'string' && !value.trim())) {
      errors.push(`${fieldName} không được để trống`);
    }
    return errors;
  }

  private validatePhone(phone: string): string[] {
    const errors: string[] = [];
    if (!phone) return errors;
    
    const cleaned = phone.replace(/\s/g, "");
    const phoneRegex = /^[0-9]{10,11}$/;
    
    if (!phoneRegex.test(cleaned)) {
      errors.push("Số điện thoại phải có 10-11 chữ số");
    }
    
    return errors;
  }

  private validateLength(value: string, fieldName: string, min?: number, max?: number): string[] {
    const errors: string[] = [];
    if (!value) return errors;
    
    const trimmed = value.trim();
    
    if (min && trimmed.length < min) {
      errors.push(`${fieldName} phải có ít nhất ${min} ký tự`);
    }
    
    if (max && trimmed.length > max) {
      errors.push(`${fieldName} không được vượt quá ${max} ký tự`);
    }
    
    return errors;
  }

  // Comprehensive validation for address data
  validateAddressData(data: CreateAddressRequest | UpdateAddressRequest): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required field validation for create
    if ('name' in data) {
      errors.push(...this.validateRequired(data.name, 'Họ và tên'));
      errors.push(...this.validateLength(data.name || '', 'Họ và tên', 2, 100));
    }

    if ('phone' in data) {
      errors.push(...this.validateRequired(data.phone, 'Số điện thoại'));
      errors.push(...this.validatePhone(data.phone || ''));
    }

    if ('addressLine' in data) {
      errors.push(...this.validateRequired(data.addressLine, 'Địa chỉ chi tiết'));
      errors.push(...this.validateLength(data.addressLine || '', 'Địa chỉ chi tiết', 5, 500));
    }

    // Optional field validation
    if (data.city) {
      errors.push(...this.validateLength(data.city, 'Tỉnh/Thành phố', 2, 50));
    }

    if (data.district) {
      errors.push(...this.validateLength(data.district, 'Quận/Huyện', 2, 50));
    }

    if (data.ward) {
      errors.push(...this.validateLength(data.ward, 'Phường/Xã', 2, 50));
    }

    if (data.street) {
      errors.push(...this.validateLength(data.street, 'Đường/Phố', 2, 100));
    }

    // Warnings for better data quality
    if (!data.city) {
      warnings.push('Nên điền Tỉnh/Thành phố để dễ tìm kiếm');
    }

    if (!data.district) {
      warnings.push('Nên điền Quận/Huyện để định vị chính xác hơn');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  // Clean and prepare data before sending
  private cleanAddressData<T extends CreateAddressRequest | UpdateAddressRequest>(data: T): T {
    const cleaned = { ...data };

    // Trim strings and handle undefined
    Object.keys(cleaned).forEach(key => {
      const value = (cleaned as any)[key];
      if (typeof value === 'string') {
        (cleaned as any)[key] = value.trim();
      }
    });

    // Special handling for phone
    if (cleaned.phone) {
      cleaned.phone = cleaned.phone.replace(/\s/g, "");
    }

    return cleaned;
  }

  // Extract data from various response structures
  private extractResponseData<T>(response: any): T {
    if (!response) return response;

    // Direct array or object
    if (Array.isArray(response) || (response && typeof response === 'object' && !response.data)) {
      return response;
    }

    // Common nested structures
    const possiblePaths = ['data', 'result', 'addresses', 'items'];
    
    for (const path of possiblePaths) {
      if (response[path] !== undefined) {
        return response[path];
      }
    }

    return response;
  }

  // Core API methods
  async getAddresses(): Promise<ApiResponse<Address[]>> {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error("Chưa đăng nhập. Vui lòng đăng nhập lại.");
      }

      const response = await axiosClient.get(this.ENDPOINTS.ADDRESSES, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const addressData = this.extractResponseData<Address[]>(response.data) || [];

      return {
        status: response.status || 200,
        message: response.data?.message || "Lấy danh sách địa chỉ thành công",
        data: Array.isArray(addressData) ? addressData : [],
      };

    } catch (error: any) {
      throw new Error(error.message || "Không thể lấy danh sách địa chỉ");
    }
  }

  async createAddress(addressData: CreateAddressRequest): Promise<ApiResponse<Address>> {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error("Chưa đăng nhập. Vui lòng đăng nhập lại.");
      }

      // Validate data
      const validation = this.validateAddressData(addressData);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }

      // Clean and prepare data
      const cleanedData = this.cleanAddressData(addressData);

      const response = await axiosClient.post(this.ENDPOINTS.ADDRESSES, cleanedData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const responseData = this.extractResponseData<Address>(response.data);

      return {
        status: response.status || 201,
        message: response.data?.message || "Tạo địa chỉ thành công",
        data: responseData,
      };

    } catch (error: any) {
      throw new Error(error.message || "Không thể tạo địa chỉ");
    }
  }

  async updateAddress(id: string, addressData: UpdateAddressRequest): Promise<ApiResponse<Address>> {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error("Chưa đăng nhập. Vui lòng đăng nhập lại.");
      }

      if (!id?.trim()) {
        throw new Error("ID địa chỉ không hợp lệ");
      }

      // Validate data
      const validation = this.validateAddressData(addressData);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }

      // Clean data (only include defined fields)
      const cleanedData = this.cleanAddressData(addressData);
      
      // Remove undefined values
      const filteredData: UpdateAddressRequest = {};
      Object.keys(cleanedData).forEach(key => {
        const value = (cleanedData as any)[key];
        if (value !== undefined && value !== null) {
          (filteredData as any)[key] = value;
        }
      });

      const response = await axiosClient.put(this.ENDPOINTS.ADDRESS_BY_ID(id), filteredData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const responseData = this.extractResponseData<Address>(response.data);

      return {
        status: response.status || 200,
        message: response.data?.message || "Cập nhật địa chỉ thành công",
        data: responseData,
      };

    } catch (error: any) {
      throw new Error(error.message || "Không thể cập nhật địa chỉ");
    }
  }

  async deleteAddress(id: string): Promise<ApiResponse<boolean>> {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error("Chưa đăng nhập. Vui lòng đăng nhập lại.");
      }

      if (!id?.trim()) {
        throw new Error("ID địa chỉ không hợp lệ");
      }

      await axiosClient.delete(this.ENDPOINTS.ADDRESS_BY_ID(id), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return {
        status: 200,
        message: "Xóa địa chỉ thành công",
        data: true,
      };

    } catch (error: any) {
      throw new Error(error.message || "Không thể xóa địa chỉ");
    }
  }

  async setDefaultAddress(id: string): Promise<ApiResponse<Address>> {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error("Chưa đăng nhập. Vui lòng đăng nhập lại.");
      }

      if (!id?.trim()) {
        throw new Error("ID địa chỉ không hợp lệ");
      }

      const response = await axiosClient.patch(this.ENDPOINTS.SET_DEFAULT(id), {}, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const responseData = this.extractResponseData<Address>(response.data);

      return {
        status: response.status || 200,
        message: response.data?.message || "Đặt địa chỉ mặc định thành công",
        data: responseData,
      };

    } catch (error: any) {
      throw new Error(error.message || "Không thể đặt địa chỉ mặc định");
    }
  }

  
  

  async duplicateAddress(id: string, newName?: string): Promise<ApiResponse<Address>> {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error("Chưa đăng nhập. Vui lòng đăng nhập lại.");
      }

      if (!id?.trim()) {
        throw new Error("ID địa chỉ không hợp lệ");
      }

      const response = await axiosClient.post(this.ENDPOINTS.DUPLICATE(id), {
        newName: newName?.trim() || undefined,
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const responseData = this.extractResponseData<Address>(response.data);

      return {
        status: response.status || 201,
        message: response.data?.message || "Sao chép địa chỉ thành công",
        data: responseData,
      };

    } catch (error: any) {
      throw new Error(error.message || "Không thể sao chép địa chỉ");
    }
  }

  // Bulk operations
  async deleteBulkAddresses(addressIds: string[]): Promise<ApiResponse<{
    successCount: number;
    failureCount: number;
    deletedIds: string[];
    failedIds: Array<{ id: string; error: string }>;
  }>> {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error("Chưa đăng nhập. Vui lòng đăng nhập lại.");
      }

      if (!addressIds?.length) {
        throw new Error("Danh sách ID không hợp lệ");
      }

      const response = await axiosClient.delete(this.ENDPOINTS.BULK_DELETE, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        data: { ids: addressIds },
      });

      const responseData = this.extractResponseData<any>(response.data) || {
        successCount: 0,
        failureCount: addressIds.length,
        deletedIds: [],
        failedIds: addressIds.map(id => ({ id, error: "Unknown error" }))
      };

      return {
        status: response.status || 200,
        message: response.data?.message || "Xóa địa chỉ hàng loạt hoàn tất",
        data: responseData,
      };

    } catch (error: any) {
      throw new Error(error.message || "Không thể xóa địa chỉ hàng loạt");
    }
  }

  // Export/Import
  async exportAddresses(format: 'json' | 'csv' | 'xlsx' = 'json'): Promise<ApiResponse<Blob | any>> {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error("Chưa đăng nhập. Vui lòng đăng nhập lại.");
      }

      const response = await axiosClient.get(this.ENDPOINTS.EXPORT, {
        params: { format },
        headers: {
          Authorization: `Bearer ${token}`,
        },
        responseType: format === 'json' ? 'json' : 'blob',
      });

      return {
        status: response.status || 200,
        message: response.data?.message || "Export địa chỉ thành công",
        data: response.data,
      };

    } catch (error: any) {
      throw new Error(error.message || "Không thể export địa chỉ");
    }
  }

  async importAddresses(file: File, options: {
    overwriteExisting?: boolean;
    skipInvalid?: boolean;
  } = {}): Promise<ApiResponse<BulkOperationResult>> {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error("Chưa đăng nhập. Vui lòng đăng nhập lại.");
      }

      if (!file) {
        throw new Error("Vui lòng chọn file để import");
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('overwriteExisting', String(options.overwriteExisting || false));
      formData.append('skipInvalid', String(options.skipInvalid || true));

      const response = await axiosClient.post(this.ENDPOINTS.IMPORT, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
        timeout: 60000, // 1 minute for import
      });

      const responseData = this.extractResponseData<BulkOperationResult>(response.data);

      return {
        status: response.status || 200,
        message: response.data?.message || "Import địa chỉ thành công",
        data: responseData,
      };

    } catch (error: any) {
      throw new Error(error.message || "Không thể import địa chỉ");
    }
  }

  // Utility methods
  formatAddress(address: Address): string {
    if (!address) return "";
    
    const parts = [
      address.addressLine,
      address.street,
      address.ward,
      address.district,
      address.city,
    ].filter(part => part && part.trim());

    return parts.join(", ");
  }

  filterAddressesByKeyword(addresses: Address[], keyword: string): Address[] {
    if (!keyword?.trim()) return addresses;
    
    const searchTerm = keyword.toLowerCase().trim();
    return addresses.filter(address => 
      address.name.toLowerCase().includes(searchTerm) ||
      address.phone.includes(searchTerm) ||
      address.city?.toLowerCase().includes(searchTerm) ||
      address.district?.toLowerCase().includes(searchTerm) ||
      address.ward?.toLowerCase().includes(searchTerm) ||
      address.addressLine.toLowerCase().includes(searchTerm) ||
      address.street?.toLowerCase().includes(searchTerm) ||
      this.formatAddress(address).toLowerCase().includes(searchTerm)
    );
  }

  groupAddressesByCity(addresses: Address[]): Record<string, Address[]> {
    return addresses.reduce((groups, address) => {
      const city = address.city || 'Không xác định';
      if (!groups[city]) {
        groups[city] = [];
      }
      groups[city].push(address);
      return groups;
    }, {} as Record<string, Address[]>);
  }

  // Helper methods for components
  async getAddressById(id: string): Promise<ApiResponse<Address | null>> {
    try {
      const response = await this.getAddresses();
      const address = response.data.find(addr => addr.id === id);
      
      return {
        status: 200,
        message: address ? "Tìm thấy địa chỉ" : "Không tìm thấy địa chỉ",
        data: address || null,
      };
    } catch (error: any) {
      throw new Error(error.message || "Không thể lấy địa chỉ");
    }
  }

  async getDefaultAddress(): Promise<ApiResponse<Address | null>> {
    try {
      const response = await this.getAddresses();
      const defaultAddress = response.data.find(addr => addr.isDefault);
      
      return {
        status: 200,
        message: defaultAddress ? "Tìm thấy địa chỉ mặc định" : "Không có địa chỉ mặc định",
        data: defaultAddress || null,
      };
    } catch (error: any) {
      throw new Error(error.message || "Không thể lấy địa chỉ mặc định");
    }
  }

  // Debug and testing utilities
  async testConnection(): Promise<{ success: boolean; message: string; details?: any }> {
    try {
      const token = authService.getToken();
      if (!token) {
        return {
          success: false,
          message: "Không có token xác thực"
        };
      }

      const response = await axiosClient.get(this.ENDPOINTS.ADDRESSES, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        timeout: 10000,
      });

      return {
        success: true,
        message: "Kết nối API thành công",
        details: {
          status: response.status,
          dataType: typeof response.data,
          hasData: !!response.data
        }
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || "Lỗi kết nối",
        details: {
          error: error.message
        }
      };
    }
  }

  // Generate sample data for testing
  generateSampleAddress(): CreateAddressRequest {
    return {
      name: "Nguyen Van A",
      phone: "0123456789",
      city: "Ho Chi Minh",
      district: "Quan 1",
      ward: "Phuong Ben Nghe",
      street: "Duong Nguyen Hue",
      addressLine: "123 Nguyen Hue",
      isDefault: false
    };
  }

  getAddressesByUserId(userId: string) {
  return axiosClient.get(`${this.ENDPOINTS.ADDRESSES}/user/${userId}`);
}
  // Get service information
  getServiceInfo() {
    return {
      version: "2.0.0",
      endpoints: Object.values(this.ENDPOINTS),
      features: [
        'CRUD operations',
        'Bulk operations',
        'Data validation',
        'Import/Export',
        
        'Search & Filter'
      ],
      supportedFormats: ['json', 'csv', 'xlsx'],
      validationRules: {
        name: { required: true, minLength: 2, maxLength: 100 },
        phone: { required: true, pattern: '10-11 digits' },
        addressLine: { required: true, minLength: 5, maxLength: 500 }
      }
    };
  }
}

// Export singleton instance
export const addressService = new AddressService();
