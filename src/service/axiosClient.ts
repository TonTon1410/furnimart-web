/* eslint-disable @typescript-eslint/no-explicit-any */
import axios, { type AxiosError } from "axios";
import type { AxiosResponse, InternalAxiosRequestConfig } from "axios";

// ───────────────────────────────────────────────
// Tạo instance Axios chính
// ───────────────────────────────────────────────
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://152.53.227.115:8080/api";

// 🔍 LOG BASE URL ĐỂ DEBUG
console.log("🌐 API_BASE_URL:", API_BASE_URL);
console.log("🌐 ENV VITE_API_BASE_URL:", import.meta.env.VITE_API_BASE_URL);

const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    "Cache-Control": "no-cache, no-store, must-revalidate",
    "Pragma": "no-cache",
    "Expires": "0",
  },
  withCredentials: true,
  timeout: 15000,
});

// ───────────────────────────────────────────────
// Mở rộng type để thêm _retry
// ───────────────────────────────────────────────
declare module "axios" {
  export interface InternalAxiosRequestConfig {
    _retry?: boolean;
  }
}

// ───────────────────────────────────────────────
// Quản lý hàng đợi request khi đang refresh token
// ───────────────────────────────────────────────
let isRefreshing = false;
let failedQueue: {
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}[] = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (token) prom.resolve(token);
    else prom.reject(error);
  });
  failedQueue = [];
};

// ───────────────────────────────────────────────
// Request interceptor → đính kèm access token
// ───────────────────────────────────────────────
axiosClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // 🔍 LOG FULL URL
    const fullUrl = `${config.baseURL}${config.url}`;
    console.log("🚀 API Request:", {
      fullUrl,
      method: config.method,
      data: config.data,
    });

    // Xóa Authorization cũ trước khi thêm mới (tránh conflict)
    delete config.headers.Authorization;
    
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Thêm headers chống cache cho mọi request
    config.headers["Cache-Control"] = "no-cache, no-store, must-revalidate";
    config.headers["Pragma"] = "no-cache";
    config.headers["Expires"] = "0";
    
    return config;
  },
  (error) => {
    console.error("❌ Request interceptor error:", error);
    return Promise.reject(error);
  }
);

// ───────────────────────────────────────────────
// Response interceptor → tự refresh token nếu 401
// ───────────────────────────────────────────────
axiosClient.interceptors.response.use(
  (response: AxiosResponse) => {
    console.log("✅ API Response:", {
      status: response.status,
      url: response.config.url,
      data: response.data,
    });
    return response;
  },
  async (error: AxiosError<any>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig;

    // 🔍 LOG CHI TIẾT ERROR
    console.error("❌ API Error:", {
      status: error.response?.status,
      statusText: error.response?.statusText,
      message: error.message,
      fullURL: `${error.config?.baseURL}${error.config?.url}`,
      requestData: error.config?.data,
      responseData: error.response?.data,
      headers: error.config?.headers,
    });

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token: string) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(axiosClient(originalRequest));
            },
            reject,
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = localStorage.getItem("refresh_token");

        if (!refreshToken) {
          throw new Error("No refresh token available");
        }

        const refreshInstance = axios.create({
          baseURL: API_BASE_URL,
          headers: { "Content-Type": "application/json" },
        });

        const res = await refreshInstance.post<{
          data: { token: string; refreshToken: string };
        }>("/auth/refresh", {
          refreshToken,
        });

        const newAccessToken = res.data.data.token;
        const newRefreshToken = res.data.data.refreshToken;

        localStorage.setItem("access_token", newAccessToken);
        localStorage.setItem("refresh_token", newRefreshToken);

        axiosClient.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;

        processQueue(null, newAccessToken);
        return axiosClient(originalRequest);
      } catch (err: unknown) {
        console.error("Refresh token failed:", err);
        processQueue(err, null);

        // Clear tất cả auth data
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("app:role");
        sessionStorage.clear();
        delete axiosClient.defaults.headers.common.Authorization;

        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }

        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default axiosClient;
