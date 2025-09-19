import axiosClient from "./axiosClient";

// Interface cho User Profile
export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  address?: string;
  dateOfBirth?: string;
  avatar?: string;
  role?: string;
  status?: string;
  point?: number;
  createdAt: string;
  updatedAt: string;
}

// Interface cho API Response
interface ApiResponse<T> {
  status: number;
  message: string;
  data: T;
  timestamp?: string;
}

// Interface cho Profile Update
interface UpdateProfilePayload {
  fullName: string;
  phone?: string;
  address?: string;
  dateOfBirth?: string | null;
}

// Interface cho Change Password
interface ChangePasswordPayload {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export const userService = {
  // Lấy thông tin profile
  getProfile: async (): Promise<ApiResponse<UserProfile>> => {
    try {
      const response = await axiosClient.get<ApiResponse<UserProfile>>("/user/profile");
      return response.data;
    } catch (error: any) {
      console.error("Get profile error:", error);
      throw error;
    }
  },

  // Cập nhật thông tin profile
  updateProfile: async (payload: UpdateProfilePayload): Promise<ApiResponse<UserProfile>> => {
    try {
      const response = await axiosClient.put<ApiResponse<UserProfile>>(
        "/user/profile", 
        payload
      );
      return response.data;
    } catch (error: any) {
      console.error("Update profile error:", error);
      throw error;
    }
  },

  // Upload avatar
  uploadAvatar: async (file: File): Promise<ApiResponse<{ avatar: string }>> => {
    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await axiosClient.post<ApiResponse<{ avatar: string }>>(
        "/user/avatar",
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      return response.data;
    } catch (error: any) {
      console.error("Upload avatar error:", error);
      throw error;
    }
  },

  // Đổi mật khẩu
  changePassword: async (payload: ChangePasswordPayload): Promise<ApiResponse<{}>> => {
    try {
      const response = await axiosClient.post<ApiResponse<{}>>(
        "/user/change-password",
        payload
      );
      return response.data;
    } catch (error: any) {
      console.error("Change password error:", error);
      throw error;
    }
  },

  // Xóa tài khoản
  deleteAccount: async (password: string): Promise<ApiResponse<{}>> => {
    try {
      const response = await axiosClient.delete<ApiResponse<{}>>(
        "/user/account",
        {
          data: { password }
        }
      );
      return response.data;
    } catch (error: any) {
      console.error("Delete account error:", error);
      throw error;
    }
  },

  // Lấy lịch sử hoạt động
  getActivityHistory: async (page = 1, limit = 10): Promise<ApiResponse<{
    activities: Array<{
      id: string;
      type: string;
      description: string;
      createdAt: string;
    }>;
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }>> => {
    try {
      const response = await axiosClient.get<ApiResponse<any>>(
        `/user/activities?page=${page}&limit=${limit}`
      );
      return response.data;
    } catch (error: any) {
      console.error("Get activity history error:", error);
      throw error;
    }
  },

  // Validate dữ liệu trước khi gửi
  validateProfileData: (data: Partial<UpdateProfilePayload>): string[] => {
    const errors: string[] = [];

    if (data.fullName !== undefined) {
      if (!data.fullName || data.fullName.trim().length < 2) {
        errors.push("Họ và tên phải có ít nhất 2 ký tự");
      }
      if (data.fullName.trim().length > 50) {
        errors.push("Họ và tên không được quá 50 ký tự");
      }
    }

    if (data.phone && data.phone.trim()) {
      const phoneRegex = /^[0-9+\-\s()]{10,15}$/;
      if (!phoneRegex.test(data.phone.trim())) {
        errors.push("Số điện thoại không hợp lệ");
      }
    }

    if (data.address && data.address.trim().length > 200) {
      errors.push("Địa chỉ không được quá 200 ký tự");
    }

    if (data.dateOfBirth) {
      const birthDate = new Date(data.dateOfBirth);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      
      if (birthDate > today) {
        errors.push("Ngày sinh không thể trong tương lai");
      }
      
      if (age > 120) {
        errors.push("Ngày sinh không hợp lệ");
      }
    }

    return errors;
  }
};