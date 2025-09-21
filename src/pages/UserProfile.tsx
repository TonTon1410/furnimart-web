"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Edit3,
  Save,
  X,
  Camera,
  Lock,
  Settings,
  AlertCircle,
  RefreshCw,
  CreditCard,
  Star,
  Shield,
  UserCheck,
  Award,
} from "lucide-react"
import axiosClient from "@/service/axiosClient"
import { authService } from "@/service/authService"
import { userService } from "@/service/userService"


export interface UserProfile {
  id: string
  email: string
  fullName: string
  phone?: string
  address?: string
  birthday?: string // Changed from dateOfBirth to birthday to match API
  avatar?: string
  role?: string
  status?: string
  point?: number | null // Allow null for compatibility with service type
  gender?: boolean // Added gender field
  cccd?: string | null // Allow null for compatibility with service type
  createdAt: string
  updatedAt: string
}

const fadeUp = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }
const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

export default function UserProfile() {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [error, setError] = useState<string>("")
  const [success, setSuccess] = useState<string>("")
  const [debugInfo, setDebugInfo] = useState<any>(null)

  const [editForm, setEditForm] = useState({
    fullName: "",
    phone: "",
    address: "",
    birthday: "",
    gender: false,
    cccd: "",
  })

  // Check authentication on component mount
  useEffect(() => {
    console.log("🔍 UserProfile component mounted")

    // Debug authentication
    const isAuth = authService.isAuthenticated()
    const tokenDebug = authService.debugTokens()

    setDebugInfo({
      isAuthenticated: isAuth,
      tokens: tokenDebug,
      timestamp: new Date().toLocaleString(),
    })

    if (!isAuth) {
      console.log("❌ Not authenticated, redirecting to login")
      window.location.href = "/login"
      return
    }

    fetchUserProfile()
  }, [])

  const fetchUserProfile = async () => {
    try {
      setIsLoading(true)
      setError("")

      console.log("📡 Fetching user profile...")

      // Debug: kiểm tra token trước khi gọi API
      const token = authService.getToken()
      console.log("🔑 Current token:", token ? token.substring(0, 30) + "..." : "None")

      const response = await userService.getProfile()

      console.log("✅ Profile response:", response)

      if (response.status === 200 && response.data) {
        const userData = response.data
        console.log("👤 User data received:", userData)

        setUser(userData)

        setEditForm({
          fullName: userData.fullName || "",
          phone: userData.phone || "",
          address: userData.address || "",
          birthday: userData.birthday ? userData.birthday.split("T")[0] : "",
          gender: userData.gender || false,
          cccd: userData.cccd || "",
        })
      } else {
        throw new Error(response.message || "Không thể tải thông tin profile")
      }
    } catch (error: any) {
      console.error("❌ Fetch profile error:", error)

      // Chi tiết error logging
      if (error.response) {
        console.error("Server Error Details:", {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
          url: error.config?.url,
          fullURL: `${error.config?.baseURL}${error.config?.url}`,
        })
      }

      if (error.response?.status === 401) {
        console.log("🔓 Unauthorized - clearing tokens and redirecting")
        authService.logout()
        window.location.href = "/login"
        return
      }

      setError(error.response?.data?.message || error.message || "Không thể tải thông tin profile")

      // Cập nhật debug info
      setDebugInfo({
        ...debugInfo,
        lastError: {
          message: error.message,
          status: error.response?.status,
          url: error.config?.url,
          timestamp: new Date().toLocaleString(),
        },
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditToggle = () => {
    if (isEditing && user) {
      setEditForm({
        fullName: user.fullName || "",
        phone: user.phone || "",
        address: user.address || "",
        birthday: user.birthday ? user.birthday.split("T")[0] : "",
        gender: user.gender || false,
        cccd: user.cccd || "",
      })
    }
    setIsEditing(!isEditing)
    setError("")
    setSuccess("")
  }

  const handleSave = async () => {
    if (!editForm.fullName.trim()) {
      setError("Họ và tên không được để trống")
      return
    }

    // Validate using userService
    const validationErrors = userService.validateProfileData(editForm)
    if (validationErrors.length > 0) {
      setError(validationErrors.join(", "))
      return
    }

    try {
      setIsSaving(true)
      setError("")

      const updateData = {
        fullName: editForm.fullName.trim(),
        phone: editForm.phone.trim(),
        address: editForm.address.trim(),
        birthday: editForm.birthday || null,
        gender: editForm.gender,
        cccd: editForm.cccd.trim(),
      }

      console.log("💾 Updating profile with data:", updateData)

      const response = await userService.updateProfile(updateData)

      if (response.status === 200 && response.data) {
        setUser(response.data)
        setIsEditing(false)
        setSuccess("Cập nhật thông tin thành công!")

        // Clear success message after 5 seconds
        setTimeout(() => setSuccess(""), 5000)
      } else {
        throw new Error(response.message || "Cập nhật thông tin thất bại")
      }
    } catch (error: any) {
      console.error("Update profile error:", error)
      setError(error.response?.data?.message || error.message || "Cập nhật thông tin thất bại")
    } finally {
      setIsSaving(false)
    }
  }

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Reset file input to allow same file upload
    event.target.value = ""

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"]
    if (!allowedTypes.includes(file.type)) {
      setError("Chỉ hỗ trợ file ảnh (JPG, PNG, GIF, WebP)")
      return
    }

    // Validate file size (5MB)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      setError("File không được vượt quá 5MB")
      return
    }

    try {
      setIsUploadingAvatar(true)
      setError("")

      const response = await userService.uploadAvatar(file)

      if (response.status === 200 && response.data && user) {
        setUser({ ...user, avatar: response.data.avatar })
        setSuccess("Cập nhật avatar thành công!")
        setTimeout(() => setSuccess(""), 3000)
      } else {
        throw new Error(response.message || "Cập nhật avatar thất bại")
      }
    } catch (error: any) {
      console.error("Upload avatar error:", error)
      setError(error.response?.data?.message || error.message || "Cập nhật avatar thất bại")
    } finally {
      setIsUploadingAvatar(false)
    }
  }


  const formatDate = (dateString?: string) => {
    if (!dateString) return "Chưa cập nhật"
    try {
      return new Date(dateString).toLocaleDateString("vi-VN", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    } catch {
      return "Chưa cập nhật"
    }
  }

  const getAvatarUrl = (user: UserProfile) => {
    if (user.avatar) {
      // Nếu avatar là link tuyệt đối thì dùng luôn, nếu không thì nối với baseURL từ axiosClient
      return user.avatar.startsWith("http")
        ? user.avatar
        : `${axiosClient.defaults.baseURL?.replace("/api", "")}${user.avatar}`
    }
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName)}&background=d97706&color=fff&size=160`
  }

  const getRoleDisplay = (role?: string) => {
    const roleMap: { [key: string]: { label: string; color: string; icon: React.ReactNode } } = {
      CUSTOMER: { label: "Khách hàng", color: "bg-blue-100 text-blue-800", icon: <User className="h-4 w-4" /> },
      ADMIN: { label: "Quản trị viên", color: "bg-red-100 text-red-800", icon: <Shield className="h-4 w-4" /> },
      STAFF: { label: "Nhân viên", color: "bg-green-100 text-green-800", icon: <UserCheck className="h-4 w-4" /> },
    }
    return roleMap[role || "CUSTOMER"] || roleMap["CUSTOMER"]
  }

  const getStatusDisplay = (status?: string) => {
    const statusMap: { [key: string]: { label: string; color: string } } = {
      ACTIVE: { label: "Hoạt động", color: "bg-green-100 text-green-800" },
      INACTIVE: { label: "Không hoạt động", color: "bg-gray-100 text-gray-800" },
      SUSPENDED: { label: "Tạm khóa", color: "bg-red-100 text-red-800" },
    }
    return statusMap[status || "ACTIVE"] || statusMap["ACTIVE"]
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary/20 border-t-primary mx-auto mb-6"></div>
          <p className="text-foreground text-lg font-medium">Đang tải thông tin...</p>
          <p className="text-muted-foreground mt-2">Vui lòng chờ trong giây lát...</p>
        </div>
      </div>
    )
  }

  // Error state - no user data
  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center bg-card p-12 rounded-2xl elegant-shadow max-w-2xl w-full"
        >
          <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-foreground mb-4">Không tìm thấy thông tin</h2>
          <p className="text-muted-foreground text-lg mb-8">Vui lòng đăng nhập lại để tiếp tục</p>

          {error && (
            <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive text-left">
              <p className="font-semibold mb-2">Chi tiết lỗi:</p>
              <p className="text-sm">{error}</p>
            </div>
          )}

          <div className="flex gap-4 justify-center">
            <button
              onClick={fetchUserProfile}
              className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all duration-200 font-medium"
            >
              <RefreshCw className="h-5 w-5" />
              Thử lại
            </button>
            <button
              onClick={() => (window.location.href = "/login")}
              className="flex items-center gap-2 px-6 py-3 bg-secondary text-secondary-foreground rounded-xl hover:bg-secondary/90 transition-all duration-200 font-medium"
            >
              Đăng nhập lại
            </button>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground
                bg-gray-50 text-gray-900
                dark:bg-gray-950 dark:text-gray-50">

      <div className="warm-gradient interior-texture">
        <div className="container mx-auto px-6 py-8">
          
        </div>
      </div>

      <div className="container mx-auto px-6 -mt-4">
        <motion.div initial="hidden" animate="show" variants={staggerContainer} className="space-y-8">
          {error && (
            <motion.div
              variants={fadeUp}
              className="p-6 bg-destructive/10 border border-destructive/20 text-destructive rounded-2xl flex items-start justify-between elegant-shadow"
            >
              <div className="flex items-start gap-4">
                <AlertCircle className="h-6 w-6 mt-1 flex-shrink-0" />
                <div>
                  <div className="font-semibold text-lg mb-1">Có lỗi xảy ra</div>
                  <div className="text-sm opacity-90">{error}</div>
                </div>
              </div>
              <button onClick={() => setError("")} className="text-destructive/60 hover:text-destructive p-1">
                <X className="h-5 w-5" />
              </button>
            </motion.div>
          )}

          {success && (
            <motion.div
              variants={fadeUp}
              className="p-6 bg-green-50 border border-green-200 text-green-800 rounded-2xl flex items-center justify-between elegant-shadow"
            >
              <div className="flex items-center gap-4">
                <div className="p-2 bg-green-100 rounded-full">
                  <Award className="h-5 w-5" />
                </div>
                <span className="font-medium">{success}</span>
              </div>
              <button onClick={() => setSuccess("")} className="text-green-600 hover:text-green-800 p-1">
                <X className="h-5 w-5" />
              </button>
            </motion.div>
          )}

          <motion.div variants={fadeUp} className="bg-card rounded-3xl elegant-shadow ">
            <div className="relative h-80">
              {/* Cover Image */}
              <div className="absolute inset-0">
                <img
                  src="src/assets/noithat.jpg"
                  alt="Cover"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-secondary/20 to-accent/30"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>
              </div>

              {/* Cover Upload Button */}
              <div className="absolute top-6 right-6">
                <label className="bg-black/30 backdrop-blur-sm hover:bg-black/40 text-white p-3 rounded-2xl cursor-pointer transition-all duration-200 elegant-shadow flex items-center gap-2">
                  <Camera className="h-5 w-5" />
                  <span className="text-sm font-medium">Đổi ảnh bìa</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      // Handle cover upload logic here
                      console.log("Cover upload:", e.target.files?.[0])
                    }}
                  />
                </label>
              </div>
              {/* Profile Avatar positioned over cover */}
<div className="absolute bottom-0 left-8 translate-y-1/2">
  <div className="relative">
    <div className="w-40 h-40 rounded-3xl bg-card p-3 elegant-shadow ring-4 ring-card">
      <img
        src={getAvatarUrl(user) || "/placeholder.svg"}
        alt={user.fullName}
        className="w-full h-full rounded-2xl object-cover"
        onError={(e) => {
          const target = e.target as HTMLImageElement
          target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
            user.fullName
          )}&background=d97706&color=fff&size=160`
        }}
      />
      {isUploadingAvatar && (
        <div className="absolute inset-3 bg-black/50 rounded-2xl flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-3 border-white/20 border-t-white"></div>
        </div>
      )}
    </div>
    <label
      className={`absolute -bottom-2 -right-2 bg-primary hover:bg-primary/90 text-primary-foreground p-3 rounded-2xl cursor-pointer transition-all duration-200 elegant-shadow ${
        isUploadingAvatar ? "opacity-50 cursor-not-allowed" : ""
      }`}
    >
      <Camera className="h-5 w-5" />
      <input
        type="file"
        accept="image/*"
        onChange={handleAvatarUpload}
        disabled={isUploadingAvatar}
        className="hidden"
      />
    </label>
  </div>
</div>

              {/* User info overlay on cover */}
              <div className="absolute bottom-8 right-8 text-right">
                <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-6 text-white">
                  <h2 className="text-2xl font-bold mb-2">{user.fullName}</h2>
                  <div className="flex items-center justify-end gap-3 mb-2">
                    <span
                      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-white/20 backdrop-blur-sm text-white`}
                    >
                      {getRoleDisplay(user.role).icon}
                      {getRoleDisplay(user.role).label}
                    </span>
                  </div>
                  <p className="text-white/80 text-sm">{user.email}</p>
                </div>
              </div>
            </div>

            <div className="pt-24 p-8">
              <div className="flex items-start justify-between mb-12">
                <div className="space-y-4">
                  <div className="flex items-center gap-4 mb-3">
                    <div className="flex gap-3">
                      <span
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${getStatusDisplay(user.status).color} elegant-shadow`}
                      >
                        {getStatusDisplay(user.status).label}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {user.point !== null && user.point !== undefined && (
                      <p className="text-primary flex items-center gap-3 text-lg font-medium">
                        <Star className="h-5 w-5" />
                        {user.point} điểm thưởng
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex gap-3">
                  {isEditing ? (
                    <>
                      <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex items-center gap-3 px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium elegant-shadow"
                      >
                        <Save className="h-5 w-5" />
                        {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
                      </button>
                      <button
                        onClick={handleEditToggle}
                        disabled={isSaving}
                        className="flex items-center gap-3 px-6 py-3 bg-muted text-foreground rounded-xl hover:bg-muted/80 transition-all duration-200 disabled:opacity-50 font-medium"
                      >
                        <X className="h-5 w-5" />
                        Hủy bỏ
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={handleEditToggle}
                      className="flex items-center gap-3 px-6 py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all duration-200 font-medium elegant-shadow"
                    >
                      <Edit3 className="h-5 w-5" />
                      Chỉnh sửa thông tin
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                {/* Personal Information */}
                <motion.div variants={fadeUp} className="space-y-6">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="p-3 bg-primary/10 rounded-2xl">
                      <User className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-2xl font-bold text-foreground">Thông tin cá nhân</h3>
                  </div>

                  <div className="space-y-6">
                    <div className="bg-muted/30 p-6 rounded-2xl">
                      <label className="block text-sm font-semibold text-foreground mb-3 uppercase tracking-wide">
                        Họ và tên *
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editForm.fullName}
                          onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                          className="w-full px-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent bg-card text-foreground text-lg"
                          placeholder="Nhập họ và tên"
                          required
                        />
                      ) : (
                        <p className="text-lg font-medium text-foreground">{user.fullName || "Chưa cập nhật"}</p>
                      )}
                    </div>

                    <div className="bg-muted/30 p-6 rounded-2xl">
                      <label className="block text-sm font-semibold text-foreground mb-3 uppercase tracking-wide flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        Số điện thoại
                      </label>
                      {isEditing ? (
                        <input
                          type="tel"
                          value={editForm.phone}
                          onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                          className="w-full px-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent bg-card text-foreground text-lg"
                          placeholder="Nhập số điện thoại"
                        />
                      ) : (
                        <p className="text-lg font-medium text-foreground">{user.phone || "Chưa cập nhật"}</p>
                      )}
                    </div>

                    <div className="bg-muted/30 p-6 rounded-2xl">
                      <label className="block text-sm font-semibold text-foreground mb-3 uppercase tracking-wide flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Ngày sinh
                      </label>
                      {isEditing ? (
                        <input
                          type="date"
                          value={editForm.birthday}
                          onChange={(e) => setEditForm({ ...editForm, birthday: e.target.value })}
                          className="w-full px-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent bg-card text-foreground text-lg"
                        />
                      ) : (
                        <p className="text-lg font-medium text-foreground">{formatDate(user.birthday)}</p>
                      )}
                    </div>

                    <div className="bg-muted/30 p-6 rounded-2xl">
                      <label className="block text-sm font-semibold text-foreground mb-3 uppercase tracking-wide">
                        Giới tính
                      </label>
                      {isEditing ? (
                        <select
                          value={editForm.gender ? "true" : "false"}
                          onChange={(e) => setEditForm({ ...editForm, gender: e.target.value === "true" })}
                          className="w-full px-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent bg-card text-foreground text-lg"
                        >
                          <option value="false">Nữ</option>
                          <option value="true">Nam</option>
                        </select>
                      ) : (
                        <p className="text-lg font-medium text-foreground">{user.gender ? "Nam" : "Nữ"}</p>
                      )}
                    </div>

                    <div className="bg-muted/30 p-6 rounded-2xl">
                      <label className="block text-sm font-semibold text-foreground mb-3 uppercase tracking-wide flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        Căn cước công dân
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editForm.cccd}
                          onChange={(e) => setEditForm({ ...editForm, cccd: e.target.value })}
                          className="w-full px-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent bg-card text-foreground text-lg"
                          placeholder="Nhập số CCCD (12 số)"
                          maxLength={12}
                        />
                      ) : (
                        <p className="text-lg font-medium text-foreground">{user.cccd || "Chưa cập nhật"}</p>
                      )}
                    </div>
                  </div>
                </motion.div>

                {/* Contact Information */}
                <motion.div variants={fadeUp} className="space-y-6">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="p-3 bg-secondary/10 rounded-2xl">
                      <Mail className="h-6 w-6 text-secondary" />
                    </div>
                    <h3 className="text-2xl font-bold text-foreground">Thông tin liên hệ</h3>
                  </div>

                  <div className="space-y-6">
                    <div className="bg-muted/30 p-6 rounded-2xl">
                      <label className="block text-sm font-semibold text-foreground mb-3 uppercase tracking-wide">
                        Email
                      </label>
                      <div className="flex items-center gap-3 text-lg">
                        <Mail className="h-5 w-5 text-primary" />
                        <span className="font-medium text-foreground">{user.email}</span>
                        <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                          Không thể thay đổi
                        </span>
                      </div>
                    </div>

                    <div className="bg-muted/30 p-6 rounded-2xl">
                      <label className="block text-sm font-semibold text-foreground mb-3 uppercase tracking-wide flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Địa chỉ
                      </label>
                      {isEditing ? (
                        <textarea
                          value={editForm.address}
                          onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                          rows={4}
                          className="w-full px-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent bg-card text-foreground text-lg resize-none"
                          placeholder="Nhập địa chỉ"
                        />
                      ) : (
                        <p className="text-lg font-medium text-foreground whitespace-pre-wrap min-h-[100px] leading-relaxed">
                          {user.address || "Chưa cập nhật"}
                        </p>
                      )}
                    </div>

                    {/* Account Info Card */}
                    <div className="bg-primary/5 border border-primary/20 p-6 rounded-2xl">
                      <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                        <Shield className="h-5 w-5 text-primary" />
                        Thông tin tài khoản
                      </h4>
                      <div className="space-y-2 text-sm">
                        <p className="text-muted-foreground">
                          <span className="font-medium">Cập nhật lần cuối:</span> {formatDate(user.updatedAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>

              <motion.div variants={fadeUp} className="mt-16 pt-8 border-t border-border">
                <div className="flex items-center gap-4 mb-8">
                  <div className="p-3 bg-accent/10 rounded-2xl">
                    <Settings className="h-6 w-6 text-accent" />
                  </div>
                  <h3 className="text-2xl font-bold text-foreground">Cài đặt tài khoản</h3>
                </div>

                <div className="flex flex-wrap gap-4">
                  <button
                    onClick={() => (window.location.href = "/change-password")}
                    className="flex items-center gap-3 px-6 py-4 border border-border rounded-xl hover:bg-muted/50 transition-all duration-200 font-medium"
                  >
                    <Lock className="h-5 w-5 text-primary" />
                    <span>Đổi mật khẩu</span>
                  </button>

                 
                </div>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}
