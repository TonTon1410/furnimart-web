import axiosClient from "./axiosClient"

interface LoginPayload {
  email: string
  password: string
}

interface LoginResponse {
  status: number
  message: string
  data: {
    token: string
    refreshToken: string
  }
  timestamp: string
}

export interface RegisterPayload {
  fullName: string
  email: string
  phone: string
  password: string
  birthDay: string
  gender: boolean
}

interface RegisterResponse {
  status: number
  message: string
  data: {
    id: string
    fullName: string
    email: string
    phone: string
    birthDay: string
    gender:boolean
    status: string
    password: string
    timestamp: string
  }
  timestamp: string
}

export const authService = {
  register: async (payload: RegisterPayload) => {
    try {
      console.log("📝 Attempting registration with:", {
        fullName: payload.fullName,
        email: payload.email,
        phone: payload.phone,
      })

      const res = await axiosClient.post<RegisterResponse>("/auth/register", payload)

      console.log("✅ Registration response:", res.data)

      if (res.data.status === 201 && res.data.data) {
        console.log("✅ Registration successful for user:", res.data.data.fullName)
        return res
      } else {
        throw new Error(res.data.message || "Registration response không đúng format")
      }
    } catch (error: any) {
      console.error("❌ Registration service error:", error)

      if (error.response) {
        console.error("Server Error Response:", {
          status: error.response.status,
          data: error.response.data,
          headers: error.response.headers,
        })

        const message =
          error.response.data?.message || error.response.data?.error || `Server error: ${error.response.status}`
        throw new Error(message)
      } else if (error.request) {
        console.error("Network Error - No response received:", error.request)
        throw new Error("Không thể kết nối đến server. Kiểm tra server có đang chạy?")
      } else {
        console.error("Other error:", error.message)
        throw new Error(error.message || "Có lỗi xảy ra")
      }
    }
  },

  login: async (payload: LoginPayload) => {
    try {
      console.log("🔐 Attempting login with:", { email: payload.email })

      const res = await axiosClient.post<LoginResponse>("/auth/login", payload)

      console.log("✅ Login response:", res.data)

      // Kiểm tra cấu trúc response
      if (res.data.status === 200 && res.data.data) {
        const { token, refreshToken } = res.data.data

        console.log("💾 Saving tokens to localStorage")
        localStorage.setItem("access_token", token)
        localStorage.setItem("refresh_token", refreshToken)

        // Verify tokens được lưu thành công
        const savedToken = localStorage.getItem("access_token")
        console.log("✅ Token saved:", savedToken ? "Yes" : "No")

        return res
      } else {
        throw new Error(res.data.message || "Login response không đúng format")
      }
    } catch (error: any) {
      console.error("❌ Login service error:", error)

      if (error.response) {
        // Server phản hồi với error status
        console.error("Server Error Response:", {
          status: error.response.status,
          data: error.response.data,
          headers: error.response.headers,
        })

        const message =
          error.response.data?.message || error.response.data?.error || `Server error: ${error.response.status}`
        throw new Error(message)
      } else if (error.request) {
        // Request được gửi nhưng không nhận được response
        console.error("Network Error - No response received:", error.request)
        throw new Error("Không thể kết nối đến server. Kiểm tra server có đang chạy?")
      } else {
        // Lỗi khác
        console.error("Other error:", error.message)
        throw new Error(error.message || "Có lỗi xảy ra")
      }
    }
  },

  logout: () => {
    console.log("🚪 Logging out - clearing tokens")
    localStorage.removeItem("access_token")
    localStorage.removeItem("refresh_token")
  },

  isAuthenticated: () => {
    const token = localStorage.getItem("access_token")
    const hasToken = !!token
    console.log("🔍 Checking authentication:", hasToken ? "Authenticated" : "Not authenticated")
    return hasToken
  },

  getToken: () => {
    return localStorage.getItem("access_token")
  },

  // Thêm method để debug token
  debugTokens: () => {
    const accessToken = localStorage.getItem("access_token")
    const refreshToken = localStorage.getItem("refresh_token")

    console.log("🔍 Debug tokens:", {
      hasAccessToken: !!accessToken,
      hasRefreshToken: !!refreshToken,
      accessTokenLength: accessToken?.length || 0,
      refreshTokenLength: refreshToken?.length || 0,
    })

    return {
      accessToken: accessToken ? accessToken.substring(0, 20) + "..." : null,
      refreshToken: refreshToken ? refreshToken.substring(0, 20) + "..." : null,
    }
  },
}
