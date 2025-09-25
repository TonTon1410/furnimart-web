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

/** ====== Thêm const key lưu trữ ====== */
const TOKEN_KEY = "access_token";
const REFRESH_KEY = "refresh_token";
const ROLE_KEY = "app:role";

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
      ? typeof p.authorities[0] === "string"
        ? p.authorities[0]
        : p.authorities[0]?.authority
      : undefined) ??
    (Array.isArray(p?.realm_access?.roles) ? p.realm_access.roles[0] : undefined);

  return mapBackendRoleToKey(rawRole);
}

export const authService = {
  register: async (payload: RegisterPayload) => {
    try {
      console.log("📝 Attempting registration with:", {
        fullName: payload.fullName,
        email: payload.email,
        phone: payload.phone,
      });

      const res = await axiosClient.post<RegisterResponse>("/auth/register", payload);

      console.log("✅ Registration response:", res.data);

      if (res.data.status === 201 && res.data.data) {
        console.log("✅ Registration successful for user:", res.data.data.fullName);
        return res;
      } else {
        throw new Error(res.data.message || "Registration response không đúng format");
      }
    } catch (error: any) {
      console.error("❌ Registration service error:", error);

      if (error.response) {
        console.error("Server Error Response:", {
          status: error.response.status,
          data: error.response.data,
          headers: error.response.headers,
        });

        const message =
          error.response.data?.message ||
          error.response.data?.error ||
          `Server error: ${error.response.status}`;
        throw new Error(message);
      } else if (error.request) {
        console.error("Network Error - No response received:", error.request);
        throw new Error("Không thể kết nối đến server. Kiểm tra server có đang chạy?");
      } else {
        console.error("Other error:", error.message);
        throw new Error(error.message || "Có lỗi xảy ra");
      }
    }
  },

  login: async (payload: LoginPayload) => {
    try {
      console.log("🔐 Attempting login with:", { email: payload.email });

      const res = await axiosClient.post<LoginResponse>("/auth/login", payload);

      console.log("✅ Login response:", res.data);

      if (res.data.status === 200 && res.data.data) {
        const { token, refreshToken } = res.data.data;

        console.log("💾 Saving tokens to localStorage");
        localStorage.setItem(TOKEN_KEY, token);
        localStorage.setItem(REFRESH_KEY, refreshToken);

        // Suy ra role từ JWT (nếu token có claim role)
        const role = inferRoleFromToken(token);
        if (role) {
          localStorage.setItem(ROLE_KEY, role);
          console.log("✅ Role inferred & saved:", role);
        } else {
          console.log("ℹ️ Không suy ra được role từ token. Sẽ dùng setRole() sau khi fetch profile.");
        }

        const savedToken = localStorage.getItem(TOKEN_KEY);
        console.log("✅ Token saved:", savedToken ? "Yes" : "No");

        return res;
      } else {
        throw new Error(res.data.message || "Login response không đúng format");
      }
    } catch (error: any) {
      console.error("❌ Login service error:", error);

      if (error.response) {
        console.error("Server Error Response:", {
          status: error.response.status,
          data: error.response.data,
          headers: error.response.headers,
        });

        const message =
          error.response.data?.message ||
          error.response.data?.error ||
          `Server error: ${error.response.status}`;
        throw new Error(message);
      } else if (error.request) {
        console.error("Network Error - No response received:", error.request);
        throw new Error("Không thể kết nối đến server. Kiểm tra server có đang chạy?");
      } else {
        console.error("Other error:", error.message);
        throw new Error(error.message || "Có lỗi xảy ra");
      }
    }
  },

  logout: () => {
    console.log("🚪 Logging out - clearing tokens & role");
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(ROLE_KEY); // ✅ xoá luôn role
  },

  isAuthenticated: () => {
    const token = localStorage.getItem(TOKEN_KEY);
    const hasToken = !!token;
    console.log("🔍 Checking authentication:", hasToken ? "Authenticated" : "Not authenticated");
    return hasToken;
  },

  getToken: () => {
    return localStorage.getItem(TOKEN_KEY);
  },

  /** ✅ Lấy role đồng bộ: ưu tiên cache → nếu chưa có thì decode từ JWT và cache lại */
  getRole(): RoleKey | null {
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

  // Debug tokens giữ nguyên
  debugTokens: () => {
    const accessToken = localStorage.getItem(TOKEN_KEY);
    const refreshToken = localStorage.getItem(REFRESH_KEY);

    console.log("🔍 Debug tokens:", {
      hasAccessToken: !!accessToken,
      hasRefreshToken: !!refreshToken,
      accessTokenLength: accessToken?.length || 0,
      refreshTokenLength: refreshToken?.length || 0,
    });

    return {
      accessToken: accessToken ? accessToken.substring(0, 20) + "..." : null,
      refreshToken: refreshToken ? refreshToken.substring(0, 20) + "..." : null,
    };
  },
};