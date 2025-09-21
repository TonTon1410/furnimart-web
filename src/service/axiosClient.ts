import axios, { type AxiosError } from "axios"
import type { AxiosResponse, InternalAxiosRequestConfig } from "axios"

// ───────────────────────────────────────────────
// Tạo instance Axios chính - SỬA PORT TỪ 8080 THÀNH 8086
// ───────────────────────────────────────────────
const axiosClient = axios.create({
  baseURL: "http://152.53.169.79:8086/api", // ✅ SỬA: Đổi port từ 8080 thành 8086
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
  timeout: 15000, // Tăng timeout lên 15 giây
})

// ───────────────────────────────────────────────
// Mở rộng type để thêm _retry
// ───────────────────────────────────────────────
declare module "axios" {
  export interface InternalAxiosRequestConfig {
    _retry?: boolean
  }
}

// ───────────────────────────────────────────────
// Quản lý hàng đợi request khi đang refresh token
// ───────────────────────────────────────────────
let isRefreshing = false
let failedQueue: {
  resolve: (token: string) => void
  reject: (err: unknown) => void
}[] = []

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (token) prom.resolve(token)
    else prom.reject(error)
  })
  failedQueue = []
}

// ───────────────────────────────────────────────
// Request interceptor → đính kèm access token
// ───────────────────────────────────────────────
axiosClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    console.log("🚀 API Request:", {
      url: config.url,
      method: config.method,
      baseURL: config.baseURL,
    })

    const token = localStorage.getItem("access_token")
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
      console.log("✅ Token attached:", token.substring(0, 20) + "...")
    } else {
      console.log("⚠️ No token found in localStorage")
    }
    return config
  },
  (error) => {
    console.error("❌ Request interceptor error:", error)
    return Promise.reject(error)
  },
)

// ───────────────────────────────────────────────
// Response interceptor → tự refresh token nếu 401
// ───────────────────────────────────────────────
axiosClient.interceptors.response.use(
  (response: AxiosResponse) => {
    console.log("✅ API Response:", {
      status: response.status,
      url: response.config.url,
      data: response.data,
    })
    return response
  },
  async (error: AxiosError<any>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig

    // Log chi tiết error để debug
    console.error("❌ API Error:", {
      status: error.response?.status,
      statusText: error.response?.statusText,
      message: error.message,
      url: error.config?.url,
      baseURL: error.config?.baseURL,
      fullURL: `${error.config?.baseURL}${error.config?.url}`,
      responseData: error.response?.data,
    })

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token: string) => {
              originalRequest.headers.Authorization = `Bearer ${token}`
              resolve(axiosClient(originalRequest))
            },
            reject,
          })
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const refreshToken = localStorage.getItem("refresh_token")

        if (!refreshToken) {
          throw new Error("No refresh token available")
        }

        // ✅ SỬA: Cập nhật port trong refresh instance
        const refreshInstance = axios.create({
          baseURL: "http://152.53.169.79:8080/api", // SỬA port
          headers: { "Content-Type": "application/json" },
        })

        const res = await refreshInstance.post<{
          data: { token: string; refreshToken: string }
        }>("/auth/refresh", {
          refreshToken,
        })

        const newAccessToken = res.data.data.token
        const newRefreshToken = res.data.data.refreshToken

        localStorage.setItem("access_token", newAccessToken)
        localStorage.setItem("refresh_token", newRefreshToken)

        axiosClient.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`

        processQueue(null, newAccessToken)
        return axiosClient(originalRequest)
      } catch (err: unknown) {
        console.error("Refresh token failed:", err)
        processQueue(err, null)

        // Clear tokens
        localStorage.removeItem("access_token")
        localStorage.removeItem("refresh_token")

        // Redirect to login
        if (typeof window !== "undefined") {
          window.location.href = "/login"
        }

        return Promise.reject(err)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  },
)

export default axiosClient