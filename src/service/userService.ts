import axiosClient from "./axiosClient";
import { authService } from "./authService";

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  address?: string;
  birthday?: string;
  avatar?: string;
  gender?: boolean;
  cccd?: string | null;
  point?: number | null;
  role?: string;
  status?: string;
  createdAt: string;
  updatedAt: string;
}

interface ApiResponse<T> {
  status: number;
  message: string;
  data: T;
  timestamp?: string;
}

interface UpdateProfilePayload {
  fullName: string;
  phone?: string;
  birthday?: string;
  gender?: boolean;
  cccd?: string;
}

interface ChangePasswordPayload {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export const userService = {
  getProfile: async (): Promise<ApiResponse<UserProfile>> => {
    try {
      const profile = await authService.getProfile();
      if (!profile) throw new Error("Profile not found");
      return {
        status: 200,
        message: "OK",
        data: profile as UserProfile,
      };
    } catch (error: unknown) {
      console.error("Get profile error:", error);
      throw error;
    }
  },

  updateProfile: async (
    payload: UpdateProfilePayload
  ): Promise<ApiResponse<UserProfile>> => {
    try {
      const response = await axiosClient.put<ApiResponse<UserProfile>>(
        "/users/profile",
        payload
      );
      return response.data;
    } catch (error: unknown) {
      console.error("Update profile error:", error);
      throw error;
    }
  },

  // Upload avatar file
  uploadAvatar: async (
    file: File
  ): Promise<ApiResponse<{ avatar: string }>> => {
    try {
      const formData = new FormData();
      formData.append("avatar", file);

      const response = await axiosClient.post<ApiResponse<{ avatar: string }>>(
        "/users/avatar",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return response.data;
    } catch (error: unknown) {
      console.error("Upload avatar error:", error);
      throw error;
    }
  },

  // ✅ NEW: Update avatar by URL (thử nhiều endpoint)
  updateAvatarUrl: async (
    avatarUrl: string
  ): Promise<ApiResponse<{ avatar: string }>> => {
    try {
      // Thử endpoint chính
      const response = await axiosClient.put<ApiResponse<{ avatar: string }>>(
        "/users/avatar-url",
        { avatarUrl }
      );
      return response.data;
    } catch (error: unknown) {
      console.error("Update avatar URL error, trying alternative endpoint:", error);
      
      // Fallback: Thử update qua profile endpoint
      try {
        const response = await axiosClient.put<ApiResponse<UserProfile>>(
          "/users/profile",
          { avatar: avatarUrl }
        );
        return {
          status: response.data.status,
          message: response.data.message,
          data: { avatar: response.data.data.avatar || avatarUrl }
        };
      } catch (fallbackError) {
        console.error("Fallback avatar update also failed:", fallbackError);
        throw error; // Throw original error
      }
    }
  },

  changePassword: async (
    payload: ChangePasswordPayload
  ): Promise<ApiResponse<Record<string, never>>> => {
    try {
      const response = await axiosClient.post<
        ApiResponse<Record<string, never>>
      >("/users/change-password", payload);
      return response.data;
    } catch (error: unknown) {
      console.error("Change password error:", error);
      throw error;
    }
  },

  deleteAccount: async (
    password: string
  ): Promise<ApiResponse<Record<string, never>>> => {
    try {
      const response = await axiosClient.delete<
        ApiResponse<Record<string, never>>
      >("/users/account", {
        data: { password },
      });
      return response.data;
    } catch (error: unknown) {
      console.error("Delete account error:", error);
      throw error;
    }
  },

  getActivityHistory: async (
    page = 1,
    limit = 10
  ): Promise<
    ApiResponse<{
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
    }>
  > => {
    try {
      const response = await axiosClient.get<
        ApiResponse<{
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
        }>
      >(`/users/activities?page=${page}&limit=${limit}`);
      return response.data;
    } catch (error: unknown) {
      console.error("Get activity history error:", error);
      throw error;
    }
  },

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
      const phoneRegex = /^(0|\+84)[0-9]{8,9}$/;
      const cleanPhone = data.phone.trim().replace(/[\s\-()]/g, "");
      if (!phoneRegex.test(cleanPhone)) {
        errors.push(
          "Số điện thoại không hợp lệ (phải là 9-10 số bắt đầu bằng 0 hoặc +84)"
        );
      }
    }

    if (data.birthday) {
      const birthDate = new Date(data.birthday);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();

      if (birthDate > today) {
        errors.push("Ngày sinh không thể trong tương lai");
      }

      if (age > 120) {
        errors.push("Ngày sinh không hợp lệ");
      }
    }

    if (data.cccd && data.cccd.trim()) {
      const cccdRegex = /^[0-9]{12}$/;
      if (!cccdRegex.test(data.cccd.trim())) {
        errors.push("CCCD phải có đúng 12 số");
      }
    }

    return errors;
  },
};