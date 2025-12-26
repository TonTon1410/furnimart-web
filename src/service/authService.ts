/* eslint-disable @typescript-eslint/no-explicit-any */
// src/service/authService.ts
import axiosClient from "./axiosClient";
import axios from "axios";
import { type RoleKey } from "@/router/paths";
import {
  safeDecodeJwt,
  inferRoleFromToken,
  getStoreIdFromToken,
  getUserIdFromToken,
} from "./jwtUtils";

interface LoginPayload {
  email: string;
  password: string;
}

interface LoginResponse {
  status: number;
  message: string;
  data: {
    token: string;
    refreshToken: string;
  };
  timestamp: string;
}

export interface RegisterPayload {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  birthDay: string;
  gender: boolean;
}

interface RegisterResponse {
  status: number;
  message: string;
  data: {
    id: string;
    fullName: string;
    email: string;
    phone: string;
    birthDay: string;
    gender: boolean;
    status: string;
    password: string;
    timestamp: string;
  };
  timestamp: string;
}

/** ====== LocalStorage keys ====== */
const TOKEN_KEY = "access_token";
const REFRESH_KEY = "refresh_token";
const ROLE_KEY = "app:role";

/** ====== DEV: Giả lập role khi test ======
 *  - Mặc định = null (không override, dùng role thật từ token/localStorage)
 *  - Khi cần test: bỏ comment 1 dòng dưới để ép role mong muốn rồi refresh trang.
 */
// eslint-disable-next-line prefer-const
let DEV_FORCE_ROLE: RoleKey | null = null;
// DEV_FORCE_ROLE = "seller";
//  DEV_FORCE_ROLE = "admin";
//  DEV_FORCE_ROLE = "manager";
// DEV_FORCE_ROLE = "delivery";

export const authService = {
  register: async (payload: RegisterPayload) => {
    try {
      const res = await axiosClient.post<RegisterResponse>(
        "/auth/register",
        payload
      );
      if (res.data.status === 201 && res.data.data) return res;
      throw new Error(
        res.data.message || "Registration response không đúng format"
      );
    } catch (error: any) {
      if (error.response) {
        const message =
          error.response.data?.message ||
          error.response.data?.error ||
          `Server error: ${error.response.status}`;
        throw new Error(message);
      } else if (error.request) {
        throw new Error(
          "Không thể kết nối đến server. Kiểm tra server có đang chạy?"
        );
      } else {
        throw new Error(error.message || "Có lỗi xảy ra");
      }
    }
  },
  forgotPassword: async (email: string) => {
    try {
      const res = await axiosClient.post("/users/forgot-password", { email });
      return res;
    } catch (error: any) {
      console.error("Forgot password error:", error);
      throw error;
    }
  },

  // Reset Password - Đặt lại mật khẩu với token
  resetPassword: async (token: string, newPassword: string) => {
    try {
      const res = await axiosClient.post("/users/reset-password", {
        token,
        newPassword,
      });
      return res;
    } catch (error: any) {
      console.error("Reset password error:", error);
      throw error;
    }
  },

  login: async (payload: LoginPayload) => {
    try {
      const res = await axiosClient.post<LoginResponse>("/auth/login", payload);
      if (res.data.status === 200 && res.data.data) {
        const { token, refreshToken } = res.data.data;

        localStorage.setItem(TOKEN_KEY, token);
        localStorage.setItem(REFRESH_KEY, refreshToken);

        // Suy ra role từ JWT (nếu có claim)
        const role = inferRoleFromToken(token);
        if (role) localStorage.setItem(ROLE_KEY, role);

        return res;
      }
      throw new Error(res.data.message || "Login response không đúng format");
    } catch (error: any) {
      if (error.response) {
        const message =
          error.response.data?.message ||
          error.response.data?.error ||
          `Server error: ${error.response.status}`;
        throw new Error(message);
      } else if (error.request) {
        throw new Error(
          "Không thể kết nối đến server. Kiểm tra server có đang chạy?"
        );
      } else {
        throw new Error(error.message || "Có lỗi xảy ra");
      }
    }
  },

  // Google OAuth Login
  loginWithGoogle: async (accessToken: string) => {
    try {
      const res = await axiosClient.post<LoginResponse>("/auth/google/login", {
        accessToken,
      });
      if (res.data.status === 200 && res.data.data) {
        const { token, refreshToken } = res.data.data;

        localStorage.setItem(TOKEN_KEY, token);
        localStorage.setItem(REFRESH_KEY, refreshToken);

        // Suy ra role từ JWT (nếu có claim)
        const role = inferRoleFromToken(token);
        if (role) localStorage.setItem(ROLE_KEY, role);

        return res;
      }
      throw new Error(
        res.data.message || "Google login response không đúng format"
      );
    } catch (error: any) {
      if (error.response) {
        const message =
          error.response.data?.message ||
          error.response.data?.error ||
          `Server error: ${error.response.status}`;
        throw new Error(message);
      } else if (error.request) {
        throw new Error(
          "Không thể kết nối đến server. Kiểm tra server có đang chạy?"
        );
      } else {
        throw new Error(error.message || "Có lỗi xảy ra");
      }
    }
  },

  // Logout - GIỮ remember me data
  logout: (clearRememberMe = false) => {
    const rememberEmail = localStorage.getItem("app:remember_email");
    const rememberMeFlag = localStorage.getItem("app:remember_me");

    // Clear auth tokens
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(ROLE_KEY);

    // Xóa Authorization header khỏi axios instance
    delete axiosClient.defaults.headers.common.Authorization;

    // Clear sessionStorage
    sessionStorage.clear();

    // Nếu clearRememberMe = true, xóa hết (ví dụ: user tự logout)
    // Nếu false, giữ lại remember me (ví dụ: token hết hạn tự động)
    if (clearRememberMe) {
      localStorage.removeItem("app:remember_email");
      localStorage.removeItem("app:remember_me");
    } else {
      // Restore remember me data
      if (rememberEmail) {
        localStorage.setItem("app:remember_email", rememberEmail);
      }
      if (rememberMeFlag) {
        localStorage.setItem("app:remember_me", rememberMeFlag);
      }
    }
  },

  // Utility: Clear auth cache - GIỮ remember me
  clearAuthCache: () => {
    const rememberEmail = localStorage.getItem("app:remember_email");
    const rememberMeFlag = localStorage.getItem("app:remember_me");

    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(ROLE_KEY);
    sessionStorage.clear();
    delete axiosClient.defaults.headers.common.Authorization;

    // Restore remember me
    if (rememberEmail) {
      localStorage.setItem("app:remember_email", rememberEmail);
    }
    if (rememberMeFlag) {
      localStorage.setItem("app:remember_me", rememberMeFlag);
    }

    // Clear browser cache (chỉ xóa cache của app, GIỮ Google OAuth cache)
    if ("caches" in window) {
      caches.keys().then((names) => {
        names.forEach((name) => {
          // Chỉ xóa cache của app, không xóa cache của Google/third-party
          if (
            name.includes("workbox") ||
            name.includes("furnimart") ||
            name.includes("app")
          ) {
            caches.delete(name);
          }
        });
      });
    }
  },

  isAuthenticated: () => {
    const token = localStorage.getItem(TOKEN_KEY);
    return !!token;
  },

  getToken: () => {
    return localStorage.getItem(TOKEN_KEY);
  },

  // Get storeId from current token
  getStoreId: (): string | null => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return null;
    return getStoreIdFromToken(token);
  },

  // Remember Me helpers
  saveRememberMe: (email: string, remember: boolean) => {
    if (remember) {
      localStorage.setItem("app:remember_email", email);
      localStorage.setItem("app:remember_me", "true");
    } else {
      localStorage.removeItem("app:remember_email");
      localStorage.removeItem("app:remember_me");
    }
  },

  getRememberedEmail: () => {
    const remember = localStorage.getItem("app:remember_me");
    if (remember === "true") {
      return localStorage.getItem("app:remember_email") || "";
    }
    return "";
  },

  isRememberMe: () => {
    return localStorage.getItem("app:remember_me") === "true";
  },

  // New: call server to get current user profile (async)
  async getProfile(): Promise<{
    id?: string;
    email?: string;
    [k: string]: any;
  } | null> {
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      if (!token) return null;

      // decode token to check raw role claim
      const decoded = safeDecodeJwt(token) ?? {};
      const rawRole =
        decoded?.role ??
        (Array.isArray(decoded?.roles) ? decoded.roles[0] : undefined) ??
        (Array.isArray(decoded?.authorities)
          ? typeof decoded.authorities[0] === "string"
            ? decoded.authorities[0]
            : decoded.authorities[0]?.authority
          : undefined) ??
        undefined;

      const isCustomer = (() => {
        if (!rawRole) return false;
        try {
          return rawRole.toString().toUpperCase() === "CUSTOMER";
        } catch {
          return false;
        }
      })();

      // If role is CUSTOMER → use /users/profile (customer flow)
      if (isCustomer) {
        try {
          const res = await axiosClient.get("/users/profile");
          const payload = res.data?.data ?? res.data ?? null;
          if (!payload) return null;
          return {
            id: payload.id ?? payload.userId ?? payload.sub ?? null,
            email: payload.email ?? payload.username ?? null,
            ...payload,
          };
        } catch (err: any) {
          console.warn(
            "authService.getProfile: /users/profile failed,",
            err?.response?.status
          );
          // allow fallback below
        }
      }

      // For non-CUSTOMER roles, call employees profile endpoint (different service/port)
      // Try a list of candidate employee API bases (primary 8080, fallback 8086) before falling back to user endpoints
      const EMPLOYEE_API_BASES = [
        import.meta.env.VITE_API_EMPLOYEE || "https://furnimart.click/api",
      ];

      for (const base of EMPLOYEE_API_BASES) {
        try {
          const axiosEmp = axios.create({ baseURL: base });
          // Ensure Authorization header with current token
          axiosEmp.defaults.headers = axiosEmp.defaults.headers || {};
          axiosEmp.defaults.headers.Authorization = `Bearer ${token}`;
          console.log(
            `authService.getProfile: calling employees profile endpoint @ ${base}`
          );
          const resEmp = await axiosEmp.get("/employees/profile");
          const payload = resEmp.data?.data ?? resEmp.data ?? null;
          if (payload) {
            return {
              id: payload.id ?? payload.userId ?? payload.sub ?? null,
              email: payload.email ?? payload.username ?? null,
              ...payload,
            };
          }
        } catch (err: any) {
          const status = err?.response?.status;
          console.warn(
            "authService.getProfile: employees endpoint error @",
            base,
            status
          );
          if (status !== 404) {
            // For unexpected errors (401/network), rethrow so caller/interceptor can handle refresh/logout
            throw err;
          }
          // else continue to next base
        }
      }

      // fallback: try common user endpoints if employees endpoint not present
      const endpoints = [
        "/users/profile",
        "/users/me",
        "/auth/profile",
        "/profile",
        "/me",
      ];
      for (const ep of endpoints) {
        try {
          const res = await axiosClient.get(ep);
          const payload = res.data?.data ?? res.data ?? null;
          if (payload) {
            return {
              id: payload.id ?? payload.userId ?? payload.sub ?? null,
              email: payload.email ?? payload.username ?? null,
              ...payload,
            };
          }
        } catch (err: any) {
          if (err?.response?.status === 404) continue;
          throw err;
        }
      }

      // Last resort: return claims from token
      if (decoded) {
        return {
          id: decoded.id ?? decoded.userId ?? decoded.sub ?? null,
          email: decoded.email ?? decoded.username ?? null,
          fullName:
            decoded.fullName ?? decoded.name ?? decoded.displayName ?? null,
          ...decoded,
        };
      }
      return null;
    } catch (error: any) {
      console.error(
        "authService.getProfile error:",
        error?.response?.data ?? error?.message ?? error
      );
      return null;
    }
  },

  getUserId(): string | null {
    const token = this.getToken();
    if (!token) return null;
    return getUserIdFromToken(token);
  },

  /** ✅ Lấy role đồng bộ:
   *  1) Nếu DEV_FORCE_ROLE khác null → dùng role test
   *  2) Nếu đã cache trong localStorage → dùng cache
   *  3) Nếu có token → decode để suy ra role & cache lại
   */
  getRole(): RoleKey | null {
    // ⚡️ DEV override khi test
    if (DEV_FORCE_ROLE) return DEV_FORCE_ROLE;

    const cached = localStorage.getItem(ROLE_KEY) as RoleKey | null;
    if (cached) return cached;

    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return null;

    const role = inferRoleFromToken(token);
    if (role) {
      localStorage.setItem(ROLE_KEY, role);
      return role;
    }
    return null;
  },

  /** ✅ Cho phép set role sau khi gọi /users/profile (nếu JWT không có claim role) */
  setRole(role: RoleKey) {
    localStorage.setItem(ROLE_KEY, role);
  },

  /** ✅ Tiện xoá role nếu cần */
  clearRole() {
    localStorage.removeItem(ROLE_KEY);
  },

  /** ✅ Lấy toàn bộ decoded token payload */
  getDecodedToken(): any {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return null;
    return safeDecodeJwt(token);
  },

  // Debug tokens
  debugTokens: () => {
    const accessToken = localStorage.getItem(TOKEN_KEY);
    const refreshToken = localStorage.getItem(REFRESH_KEY);
    return {
      hasAccessToken: !!accessToken,
      hasRefreshToken: !!refreshToken,
      accessToken: accessToken ? accessToken.substring(0, 20) + "..." : null,
      refreshToken: refreshToken ? refreshToken.substring(0, 20) + "..." : null,
    };
  },
};
