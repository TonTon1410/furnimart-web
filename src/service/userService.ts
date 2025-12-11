import axiosClient from "./axiosClient";
import { authService } from "./authService";

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  address?: string;
  birthday?: string; // Changed from dateOfBirth to birthday to match API
  avatar?: string;
  gender?: boolean; // Added gender field
  cccd?: string | null; // Added CCCD field
  point?: number | null; // Added point field
  role?: string; // Added role field
  status?: string; // Added status field
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

interface UpdateProfilePayload {
  fullName?: string;
  phone?: string;
  birthday?: string; // ISO date string format
  gender?: boolean;
  cccd?: string;
  avatar?: string; // Added avatar field
}

// Interface cho Change Password
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
      // Kiểm tra role để gọi đúng endpoint
      const role = authService.getRole?.() ?? null;
      const isEmployee = role && role !== "customer"; // customer là lowercase trong RoleKey

      let response;

      if (isEmployee) {
        // Employee: dùng PUT /employees/{id}
        console.log("🔧 Updating employee profile...");

        // Lấy employee ID từ profile
        const profile = await authService.getProfile();
        const employeeId = profile?.id;

        if (!employeeId) {
          throw new Error("Employee ID not found");
        }

        console.log(`📤 PUT /employees/${employeeId}`);
        response = await axiosClient.put<ApiResponse<UserProfile>>(
          `/employees/${employeeId}`,
          payload
        );
      } else {
        // Customer: gọi /users/profile
        console.log("🔧 Updating user profile...");
        response = await axiosClient.put<ApiResponse<UserProfile>>(
          "/users/profile",
          payload
        );
      }

      return response.data;
    } catch (error: unknown) {
      console.error("Update profile error:", error);
      throw error;
    }
  },

  // Upload avatar
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

  // Đổi mật khẩu
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

  // Xóa tài khoản
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

  // Lấy lịch sử hoạt động
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
      // Cho phép số điện thoại Việt Nam:
      // - Format cũ: 0xxxxxxxx (9 số) hoặc +84xxxxxxxx
      // - Format mới: 0xxxxxxxxx (10 số) hoặc +84xxxxxxxxx
      const phoneRegex = /^(0|\+84)[0-9]{8,9}$/;
      const cleanPhone = data.phone.trim().replace(/[\s\-()]/g, ""); // Loại bỏ space, dấu -()
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
