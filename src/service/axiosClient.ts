import axios, { AxiosError } from "axios";
import type { AxiosResponse, InternalAxiosRequestConfig } from "axios";

// ───────────────────────────────────────────────
// Tạo instance Axios chính
// ───────────────────────────────────────────────
const axiosClient = axios.create({
  baseURL: "http://localhost:8086/api", // ✅ đặt baseURL đến /api
  headers: {
    "Content-Type": "application/json",
  },
    withCredentials: true,
    timeout: 10000, // 10 giây
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
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ───────────────────────────────────────────────
// Response interceptor → tự refresh token nếu 401
// ───────────────────────────────────────────────
axiosClient.interceptors.response.use(
  (response: AxiosResponse) => response.data,
  async (error: AxiosError<unknown>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig;

    if (error.response?.status === 401 && !originalRequest._retry) {
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
        const res = await axios.post<{ accessToken: string }>(
          "http://localhost:8086/api/auth/refresh",
          { refreshToken }
        );

        const newAccessToken = res.data.accessToken;
        localStorage.setItem("access_token", newAccessToken);
        axiosClient.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;

        processQueue(null, newAccessToken);
        return axiosClient(originalRequest);
      } catch (err: unknown) {
        processQueue(err, null);
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        window.location.href = "/login";
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default axiosClient;
