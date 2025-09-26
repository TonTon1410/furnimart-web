/* eslint-disable @typescript-eslint/no-explicit-any */
import axios, { type AxiosError, AxiosHeaders } from "axios";
import type { AxiosResponse, InternalAxiosRequestConfig } from "axios";
const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://152.53.169.79:8080/api";

// ───────────────────────────────────────────────
// Tạo instance Axios chính
// ───────────────────────────────────────────────
const axiosClient = axios.create({
  baseURL: BASE_URL, // Sử dụng biến môi trường
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
  timeout: 15000, // Tăng timeout lên 15 giây
});

// ───────────────────────────────────────────────
// Mở rộng type để thêm _retry
// ───────────────────────────────────────────────
declare module "axios" {
  export interface InternalAxiosRequestConfig {
    _retry?: boolean;
  }
}

/** =========================================================================
 *  HÀNG ĐỢI KHI ĐANG REFRESH TOKEN
 *  ========================================================================= */
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((p) => (token ? p.resolve(token) : p.reject(error)));
  failedQueue = [];
};

/** =========================================================================
 *  HELPER: SET HEADER Authorization CHO NHIỀU KIỂU CẤU TRÚC HEADERS
 *  - axios v1 có thể dùng AxiosHeaders hoặc object thường (HeadersDefaults)
 *  ========================================================================= */
function setAuthHeader(headersObj: unknown, token: string) {
  if (!headersObj) return;

  // Trường hợp AxiosHeaders: có .set()
  if (typeof (headersObj as any).set === "function") {
    (headersObj as any).set("Authorization", `Bearer ${token}`);
    return;
  }

  // Trường hợp object thường: gán trực tiếp + gán vào common
  const h = headersObj as Record<string, any>;
  h["Authorization"] = `Bearer ${token}`;
  if (h.common && typeof h.common === "object") {
    h.common["Authorization"] = `Bearer ${token}`;
  }
}

/** =========================================================================
 *  REQUEST INTERCEPTOR → GẮN ACCESS TOKEN
 *  ========================================================================= */
axiosClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem("access_token");
    if (token) {
      // Dùng AxiosHeaders.from để đảm bảo đúng kiểu trong v1
      const hdr = AxiosHeaders.from(config.headers);
      hdr.set("Authorization", `Bearer ${token}`);
      config.headers = hdr;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/** =========================================================================
 *  RESPONSE INTERCEPTOR → TỰ ĐỘNG REFRESH TOKEN KHI 401
 *  ========================================================================= */
axiosClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError<any>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig | undefined;
    const status = error.response?.status;

    // Không refresh cho chính endpoint auth
    const url = originalRequest?.url || "";
    const isAuthEndpoint =
      url.includes("/auth/login") || url.includes("/auth/refresh");

    if (status === 401 && originalRequest && !originalRequest._retry && !isAuthEndpoint) {
      if (isRefreshing) {
        // Đợi tới khi refresh xong, dùng token mới retry request
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token: string) => {
              const hdr = AxiosHeaders.from(originalRequest.headers);
              hdr.set("Authorization", `Bearer ${token}`);
              originalRequest.headers = hdr;
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
        if (!refreshToken) throw new Error("No refresh token available");

        // Dùng cùng base URL (8080)
        const refreshInstance = axios.create({
          baseURL: API_BASE,
          headers: { "Content-Type": "application/json" },
          withCredentials: true,
          timeout: 15000,
        });

        const res = await refreshInstance.post<{
          data: { token: string; refreshToken: string };
        }>("/auth/refresh", { refreshToken });

        const newAccessToken = res.data?.data?.token;
        const newRefreshToken = res.data?.data?.refreshToken;

        if (!newAccessToken) throw new Error("Refresh response missing access token");

        // Lưu token mới
        localStorage.setItem("access_token", newAccessToken);
        if (newRefreshToken) {
          localStorage.setItem("refresh_token", newRefreshToken);
        }

        // Gắn vào default headers (tránh TS lỗi bằng helper)
        setAuthHeader(axiosClient.defaults.headers, newAccessToken);

        // Đánh thức hàng đợi
        processQueue(null, newAccessToken);

        // Gắn token mới cho request gốc và retry
        const hdr = AxiosHeaders.from(originalRequest.headers);
        hdr.set("Authorization", `Bearer ${newAccessToken}`);
        originalRequest.headers = hdr;

        return axiosClient(originalRequest);
      } catch (err) {
        // Báo lỗi cho các request đang chờ
        processQueue(err, null);

        // Dọn token & về /login
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        if (typeof window !== "undefined") window.location.href = "/login";

        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default axiosClient;

