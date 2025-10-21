/* eslint-disable @typescript-eslint/no-explicit-any */
// src/service/authService.ts
import axiosClient from "./axiosClient";
import { mapBackendRoleToKey, type RoleKey } from "@/router/paths";

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
let DEV_FORCE_ROLE: RoleKey | null = null;
DEV_FORCE_ROLE = "seller";
// DEV_FORCE_ROLE = "admin";
// DEV_FORCE_ROLE = "manager";
// DEV_FORCE_ROLE = "delivery";

/** ====== Helpers: decode JWT an toàn & suy ra role ====== */
function safeBase64UrlDecode(b64url: string): string | null {
  try {
    const b64 = b64url.replace(/-/g, "+").replace(/_/g, "/");
    const pad = b64.length % 4 === 0 ? "" : "=".repeat(4 - (b64.length % 4));
    return atob(b64 + pad);
  } catch {
    return null;
  }
}

function safeDecodeJwt(token: string): any {
  try {
    const payload = token.split(".")[1];
    const json = safeBase64UrlDecode(payload);
    return json ? JSON.parse(json) : null;
  } catch {
    return null;
  }
}

/** Suy ra role từ token: tuỳ backend có thể là role/roles/authorities/... */
function inferRoleFromToken(token: string): RoleKey | null {
  const p = safeDecodeJwt(token);

  // Các khả năng thường gặp:
  // - p.role === "ADMIN"
  // - p.roles = ["ADMIN", ...]
  // - p.authorities = ["ADMIN"] hoặc [{ authority: "ADMIN" }]
  // - Keycloak: p.realm_access.roles = ["ADMIN", ...]
  const rawRole =
    p?.role ??
    (Array.isArray(p?.roles) ? p.roles[0] : undefined) ??
    (Array.isArray(p?.authorities)
      ? (typeof p.authorities[0] === "string" ? p.authorities[0] : p.authorities[0]?.authority)
      : undefined) ??
    (Array.isArray(p?.realm_access?.roles) ? p.realm_access.roles[0] : undefined);

  return mapBackendRoleToKey(rawRole);
}

export const authService = {
  register: async (payload: RegisterPayload) => {
    try {
      const res = await axiosClient.post<RegisterResponse>("/auth/register", payload);
      if (res.data.status === 201 && res.data.data) return res;
      throw new Error(res.data.message || "Registration response không đúng format");
    } catch (error: any) {
      if (error.response) {
        const message =
          error.response.data?.message ||
          error.response.data?.error ||
          `Server error: ${error.response.status}`;
        throw new Error(message);
      } else if (error.request) {
        throw new Error("Không thể kết nối đến server. Kiểm tra server có đang chạy?");
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
        throw new Error("Không thể kết nối đến server. Kiểm tra server có đang chạy?");
      } else {
        throw new Error(error.message || "Có lỗi xảy ra");
      }
    }
  },

  logout: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(ROLE_KEY);
  },

  isAuthenticated: () => {
    const token = localStorage.getItem(TOKEN_KEY);
    return !!token;
  },

   getToken: () => {
    return localStorage.getItem(TOKEN_KEY);
  },

  // New: call server to get current user profile (async)
  async getProfile(): Promise<{ id?: string; email?: string; [k: string]: any } | null> {
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      if (!token) return null;

      // assuming backend exposes /users/profile (adjust path if different)
      const res = await axiosClient.get("/users/profile");
      // res.data?.data hoặc res.data tùy format backend
      const payload = res.data?.data ?? res.data ?? null;
      if (!payload) return null;
      // try to return normalized profile object
      return {
        id: payload.id ?? payload.userId ?? payload.sub ?? null,
        email: payload.email ?? payload.username ?? null,
        ...payload
      };
    } catch (error: any) {
      console.error("authService.getProfile error:", error?.response?.data ?? error?.message ?? error);
      return null;
    }
  },

  // giữ nguyên getUserId() cũ cho backward compatibility
  getUserId(): string | null {
  const token = this.getToken();
  if (!token) return null;

  try {
    const payloadBase64 = token.split(".")[1];
    if (!payloadBase64) return null;

    // Chuẩn hóa base64 để tránh lỗi padding
    const padded = payloadBase64.padEnd(payloadBase64.length + (4 - (payloadBase64.length % 4)) % 4, "=");

    const decoded = atob(padded);
    const payload = JSON.parse(decoded);

    // Tùy backend, có thể là id, userId hoặc sub
    return payload?.id || payload?.userId || payload?.sub || null;
  } catch (err) {
    console.error("Decode token error:", err);
    return null;
  }
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