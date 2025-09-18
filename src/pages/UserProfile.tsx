"use client"

import React, { useState, useEffect } from "react"
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
  LogOut,
  ArrowLeft,
  AlertCircle,
  RefreshCw
} from "lucide-react"
import { Link } from "react-router-dom"
import axiosClient from "../service/axiosClient"
import { authService } from "../service/authService"

interface UserProfile {
  id: string
  email: string
  fullName: string
  phone?: string
  address?: string
  dateOfBirth?: string
  avatar?: string
  createdAt: string
  updatedAt: string
}

// API Response interface từ Swagger
interface ApiResponse<T> {
  status: number
  message: string
  data: T
  timestamp?: string
}

const fadeUp = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }

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
    dateOfBirth: ""
  })

  // Check authentication on component mount
  useEffect(() => {
    console.log("🔍 UserProfile component mounted");
    
    // Debug authentication
    const isAuth = authService.isAuthenticated();
    const tokenDebug = authService.debugTokens();
    
    setDebugInfo({
      isAuthenticated: isAuth,
      tokens: tokenDebug,
      timestamp: new Date().toLocaleString()
    });

    if (!isAuth) {
      console.log("❌ Not authenticated, redirecting to login");
      window.location.href = "/login"
      return
    }
    
    fetchUserProfile()
  }, [])

  const fetchUserProfile = async () => {
    try {
      setIsLoading(true)
      setError("")
      
      console.log("📡 Fetching user profile...");
      
      // Debug: kiểm tra token trước khi gọi API
      const token = authService.getToken();
      console.log("🔑 Current token:", token ? token.substring(0, 30) + "..." : "None");
      
      const response = await axiosClient.get<ApiResponse<UserProfile>>("/users/profile")
      
      console.log("✅ Profile response:", response);

      if (response.data.status === 200 && response.data.data) {
        const userData = response.data.data
        console.log("👤 User data received:", userData);
        
        setUser(userData)
        
        // Initialize edit form with current data
        setEditForm({
          fullName: userData.fullName || "",
          phone: userData.phone || "",
          address: userData.address || "",
          dateOfBirth: userData.dateOfBirth ? userData.dateOfBirth.split('T')[0] : ""
        })
      } else {
        throw new Error(response.data.message || "Không thể tải thông tin profile")
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
          fullURL: `${error.config?.baseURL}${error.config?.url}`
        });
      }
      
      if (error.response?.status === 401) {
        console.log("🔓 Unauthorized - clearing tokens and redirecting");
        authService.logout()
        window.location.href = "/login"
        return
      }
      
      setError(
        error.response?.data?.message || 
        error.message || 
        "Không thể tải thông tin profile"
      )
      
      // Cập nhật debug info
      setDebugInfo({
        ...debugInfo,
        lastError: {
          message: error.message,
          status: error.response?.status,
          url: error.config?.url,
          timestamp: new Date().toLocaleString()
        }
      });
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditToggle = () => {
    if (isEditing && user) {
      // Cancel edit - reset form to current user data
      setEditForm({
        fullName: user.fullName || "",
        phone: user.phone || "",
        address: user.address || "",
        dateOfBirth: user.dateOfBirth ? user.dateOfBirth.split('T')[0] : ""
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

    try {
      setIsSaving(true)
      setError("")

      const updateData = {
        fullName: editForm.fullName.trim(),
        phone: editForm.phone.trim(),
        address: editForm.address.trim(),
        dateOfBirth: editForm.dateOfBirth || null
      }

      console.log("💾 Updating profile with data:", updateData);

      const response = await axiosClient.put<ApiResponse<UserProfile>>(
        "/users/profile", 
        updateData
      )

      if (response.data.status === 200 && response.data.data) {
        setUser(response.data.data)
        setIsEditing(false)
        setSuccess("Cập nhật thông tin thành công!")
        
        // Clear success message after 5 seconds
        setTimeout(() => setSuccess(""), 5000)
      } else {
        throw new Error(response.data.message || "Cập nhật thông tin thất bại")
      }
    } catch (error: any) {
      console.error("Update profile error:", error)
      setError(
        error.response?.data?.message || 
        error.message || 
        "Cập nhật thông tin thất bại"
      )
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
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
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

      const formData = new FormData()
      formData.append('avatar', file)

      const response = await axiosClient.post<ApiResponse<{ avatar: string }>>(
        "/users/avatar", 
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      )

      if (response.data.status === 200 && response.data.data && user) {
        setUser({ ...user, avatar: response.data.data.avatar })
        setSuccess("Cập nhật avatar thành công!")
        setTimeout(() => setSuccess(""), 3000)
      } else {
        throw new Error(response.data.message || "Cập nhật avatar thất bại")
      }
    } catch (error: any) {
      console.error("Upload avatar error:", error)
      setError(
        error.response?.data?.message || 
        error.message || 
        "Cập nhật avatar thất bại"
      )
    } finally {
      setIsUploadingAvatar(false)
    }
  }

  const handleLogout = () => {
    if (confirm("Bạn có chắc chắn muốn đăng xuất?")) {
      authService.logout()
      window.location.href = "/login"
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Chưa cập nhật"
    try {
      return new Date(dateString).toLocaleDateString("vi-VN", {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    } catch {
      return "Chưa cập nhật"
    }
  }

  const getAvatarUrl = (user: UserProfile) => {
    if (user.avatar) {
      // If avatar starts with http, use as is, otherwise prepend base URL
      return user.avatar.startsWith('http') 
        ? user.avatar 
        : `http://localhost:8086${user.avatar}`
    }
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName)}&background=0ea5e9&color=fff&size=128`
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải thông tin...</p>
          
          {/* Debug Panel khi loading */}
          {debugInfo && (
            <div className="mt-6 p-4 bg-white rounded-lg shadow text-left text-sm">
              <h3 className="font-semibold mb-2">Debug Info:</h3>
              <pre className="text-xs">{JSON.stringify(debugInfo, null, 2)}</pre>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Error state - no user data
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-lg shadow-lg max-w-lg">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Không tìm thấy thông tin</h2>
          <p className="text-gray-600 mb-4">Vui lòng đăng nhập lại</p>
          
          {/* Chi tiết lỗi */}
          {error && (
            <div className="mb-4 p-3 bg-red-100 rounded text-red-700 text-left">
              <p className="font-semibold">Lỗi chi tiết:</p>
              <p className="text-sm">{error}</p>
            </div>
          )}
          
          {/* Debug info */}
          {debugInfo && (
            <div className="mb-4 p-3 bg-gray-100 rounded text-left text-xs">
              <p className="font-semibold mb-2">Debug Information:</p>
              <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
            </div>
          )}
          
          <div className="flex gap-3 justify-center">
            <button
              onClick={fetchUserProfile}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              Thử lại
            </button>
            <Link 
              to="/login" 
              className="flex items-center px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors"
            >
              Đăng nhập lại
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link 
                to="/" 
                className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>Quay lại</span>
              </Link>
              <h1 className="text-xl font-semibold text-gray-900">Thông tin cá nhân</h1>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span>Đăng xuất</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        <motion.div
          initial="hidden"
          animate="show"
          variants={fadeUp}
          transition={{ duration: 0.6 }}
        >
          {/* Messages */}
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg flex items-start justify-between"
            >
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-semibold">Có lỗi xảy ra:</div>
                  <div className="text-sm">{error}</div>
                  {debugInfo?.lastError && (
                    <div className="text-xs mt-2 p-2 bg-red-50 rounded">
                      <div>Status: {debugInfo.lastError.status}</div>
                      <div>URL: {debugInfo.lastError.url}</div>
                      <div>Time: {debugInfo.lastError.timestamp}</div>
                    </div>
                  )}
                </div>
              </div>
              <button 
                onClick={() => setError("")}
                className="text-red-500 hover:text-red-700 ml-2"
              >
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          )}

          {success && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg flex items-center justify-between"
            >
              <span>{success}</span>
              <button 
                onClick={() => setSuccess("")}
                className="text-green-500 hover:text-green-700"
              >
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          )}

          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            {/* Cover & Avatar Section */}
            <div className="relative bg-gradient-to-r from-cyan-500 to-blue-600 h-32">
              <div className="absolute -bottom-16 left-6">
                <div className="relative">
                  <div className="w-32 h-32 rounded-full bg-white p-2 shadow-lg">
                    <img
                      src={getAvatarUrl(user)}
                      alt={user.fullName}
                      className="w-full h-full rounded-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName)}&background=0ea5e9&color=fff&size=128`
                      }}
                    />
                    {isUploadingAvatar && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                      </div>
                    )}
                  </div>
                  <label className={`absolute bottom-2 right-2 bg-cyan-600 hover:bg-cyan-700 text-white p-2 rounded-full cursor-pointer transition-colors ${isUploadingAvatar ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    <Camera className="h-4 w-4" />
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
            </div>

            <div className="pt-20 p-6">
              {/* Header Info */}
              <div className="flex items-start justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{user.fullName}</h2>
                  <p className="text-gray-600 flex items-center gap-2 mt-1">
                    <Mail className="h-4 w-4" />
                    {user.email}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Tham gia từ {formatDate(user.createdAt)}
                  </p>
                </div>
                <div className="flex gap-2">
                  {isEditing ? (
                    <>
                      <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Save className="h-4 w-4" />
                        {isSaving ? "Đang lưu..." : "Lưu"}
                      </button>
                      <button
                        onClick={handleEditToggle}
                        disabled={isSaving}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
                      >
                        <X className="h-4 w-4" />
                        Hủy
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={handleEditToggle}
                      className="flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors"
                    >
                      <Edit3 className="h-4 w-4" />
                      Chỉnh sửa
                    </button>
                  )}
                </div>
              </div>

              {/* Profile Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Personal Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <User className="h-5 w-5 text-cyan-600" />
                    Thông tin cá nhân
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Họ và tên *
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editForm.fullName}
                          onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                          placeholder="Nhập họ và tên"
                          required
                        />
                      ) : (
                        <p className="px-3 py-2 bg-gray-50 rounded-lg">
                          {user.fullName || "Chưa cập nhật"}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        <Phone className="h-4 w-4 inline mr-1" />
                        Số điện thoại
                      </label>
                      {isEditing ? (
                        <input
                          type="tel"
                          value={editForm.phone}
                          onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                          placeholder="Nhập số điện thoại"
                        />
                      ) : (
                        <p className="px-3 py-2 bg-gray-50 rounded-lg">
                          {user.phone || "Chưa cập nhật"}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        <Calendar className="h-4 w-4 inline mr-1" />
                        Ngày sinh
                      </label>
                      {isEditing ? (
                        <input
                          type="date"
                          value={editForm.dateOfBirth}
                          onChange={(e) => setEditForm({ ...editForm, dateOfBirth: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                        />
                      ) : (
                        <p className="px-3 py-2 bg-gray-50 rounded-lg">
                          {formatDate(user.dateOfBirth)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Mail className="h-5 w-5 text-cyan-600" />
                    Thông tin liên hệ
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      <p className="px-3 py-2 bg-gray-100 rounded-lg text-gray-600 flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        {user.email} 
                        <span className="text-xs text-gray-500">(Không thể thay đổi)</span>
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        <MapPin className="h-4 w-4 inline mr-1" />
                        Địa chỉ
                      </label>
                      {isEditing ? (
                        <textarea
                          value={editForm.address}
                          onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                          placeholder="Nhập địa chỉ"
                        />
                      ) : (
                        <p className="px-3 py-2 bg-gray-50 rounded-lg min-h-[80px] whitespace-pre-wrap">
                          {user.address || "Chưa cập nhật"}
                        </p>
                      )}
                    </div>

                    {/* Additional Info */}
                    <div className="text-sm text-gray-500 bg-blue-50 p-3 rounded-lg">
                      <p className="font-medium mb-1">Thông tin tài khoản:</p>
                      <p>ID: {user.id}</p>
                      <p>Cập nhật lần cuối: {formatDate(user.updatedAt)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional Actions */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Settings className="h-5 w-5 text-cyan-600" />
                  Cài đặt tài khoản
                </h3>
                
                <div className="flex flex-wrap gap-3">
                  <Link
                    to="/change-password"
                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Lock className="h-4 w-4" />
                    Đổi mật khẩu
                  </Link>
                  
                  <button
                    onClick={fetchUserProfile}
                    disabled={isLoading}
                    className="flex items-center gap-2 px-4 py-2 border border-cyan-300 text-cyan-600 rounded-lg hover:bg-cyan-50 transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className="h-4 w-4" />
                    {isLoading ? "Đang tải..." : "Làm mới"}
                  </button>
                </div>
              </div>

              {/* Debug Panel - chỉ hiển thị khi có lỗi */}
              {debugInfo && (error || debugInfo.lastError) && (
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-amber-600" />
                    Thông tin debug
                  </h3>
                  <div className="bg-gray-100 p-4 rounded-lg text-sm font-mono">
                    <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}