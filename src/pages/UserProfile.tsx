"use client"

import { motion } from "framer-motion"
import { X, AlertCircle, RefreshCw, Award, Settings, Lock, Star, Save, Edit3 } from "lucide-react"
import UserInfoSection from "@/components/userProfile/UserInfoSection"
import ContactInfoSection from "@/components/userProfile/ContactInfoSection"
import UserHeaderSection from "@/components/userProfile/UserHeaderSection"
import { useUserProfile } from "@/hooks/useUserProfile"

export interface UserProfile {
  id: string
  email: string
  fullName: string
  phone?: string
  address?: string
  birthday?: string
  avatar?: string
  role?: string
  status?: string
  point?: number | null
  gender?: boolean
  cccd?: string | null
  createdAt: string
  updatedAt: string
}

const fadeUp = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }
const staggerContainer = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
}

export default function UserProfile() {
  const {
    user,
    isLoading,
    isEditing,
    isSaving,
    isUploadingAvatar,
    error,
    success,
    defaultAddress,
    editForm,
    setEditForm,
    setError,
    setSuccess,
    handleEditToggle,
    handleSave,
    handleAvatarUpload,
    handleAvatarUrlUpdate, // Get new handler
    fetchUserProfile,
  } = useUserProfile()

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary/20 border-t-primary mx-auto mb-6"></div>
          <p className="text-foreground text-lg font-medium">Đang tải thông tin...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center py-20">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center bg-card p-12 rounded-2xl elegant-shadow max-w-2xl w-full"
        >
          <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-foreground mb-4">Không tìm thấy thông tin</h2>
          <div className="flex gap-4 justify-center mt-8">
            <button
              onClick={fetchUserProfile}
              className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90"
            >
              <RefreshCw className="h-5 w-5" /> Thử lại
            </button>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <motion.div initial="hidden" animate="show" variants={staggerContainer} className="space-y-6">
      {error && (
        <motion.div
          variants={fadeUp}
          className="p-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-xl flex justify-between"
        >
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 mt-0.5" />
            <div>
              <div className="font-semibold">Có lỗi xảy ra</div>
              <div className="text-sm opacity-90">{error}</div>
            </div>
          </div>
          <button onClick={() => setError("")}>
            <X className="h-4 w-4" />
          </button>
        </motion.div>
      )}

      {success && (
        <motion.div
          variants={fadeUp}
          className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 text-green-800 rounded-xl flex justify-between"
        >
          <div className="flex items-center gap-3">
            <Award className="h-4 w-4" />
            <span className="font-medium">{success}</span>
          </div>
          <button onClick={() => setSuccess("")}>
            <X className="h-4 w-4" />
          </button>
        </motion.div>
      )}

      <motion.div variants={fadeUp} className="bg-card rounded-2xl shadow-xl border border-border/50 overflow-hidden">
        <UserHeaderSection
          user={user}
          isUploadingAvatar={isUploadingAvatar}
          handleAvatarUpload={handleAvatarUpload}
          handleAvatarUrlUpdate={handleAvatarUrlUpdate} // Pass handler to header
        />

        <div className="pt-16 p-6">
          <div className="flex items-start justify-between mb-8">
            <div className="space-y-3">
              <div className="flex items-center gap-3 mb-2">
                <span
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
                    user.status === "ACTIVE" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {user.status === "ACTIVE" ? "Hoạt động" : "Không hoạt động"}
                </span>
              </div>
              {user.point !== null && (
                <p className="text-primary flex items-center gap-2 text-base font-medium">
                  <Star className="h-4 w-4" /> {user.point} điểm thưởng
                </p>
              )}
            </div>

            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50"
                  >
                    <Save className="h-4 w-4" /> {isSaving ? "Đang lưu..." : "Lưu"}
                  </button>
                  <button
                    onClick={handleEditToggle}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-4 py-2.5 bg-muted text-foreground rounded-xl hover:bg-muted/80 disabled:opacity-50"
                  >
                    <X className="h-4 w-4" /> Hủy
                  </button>
                </>
              ) : (
                <button
                  onClick={handleEditToggle}
                  className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90"
                >
                  <Edit3 className="h-4 w-4" /> Chỉnh sửa
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <UserInfoSection
              user={user}
              isEditing={isEditing}
              editForm={editForm}
              setEditForm={setEditForm}
              formatDate={formatDate}
              fadeUp={fadeUp}
            />
            <ContactInfoSection
              user={user}
              defaultAddress={defaultAddress}
              isEditing={isEditing}
              formatDate={formatDate}
              fadeUp={fadeUp}
            />
          </div>

          <motion.div variants={fadeUp} className="mt-12 pt-6 border-t border-border">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 bg-accent/10 rounded-xl">
                <Settings className="h-5 w-5 text-accent" />
              </div>
              <h3 className="text-xl font-bold text-foreground">Cài đặt tài khoản</h3>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => (window.location.href = "/forgot-password")}
                className="flex items-center gap-2 px-4 py-3 border border-border rounded-xl hover:bg-muted/50 font-medium shadow-sm text-foreground"
              >
                <Lock className="h-4 w-4 text-primary" />
                <span>Đổi mật khẩu</span>
              </button>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  )
}
