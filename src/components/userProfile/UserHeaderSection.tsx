"use client"

import type React from "react"
import { Camera, User, Shield, UserCheck } from "lucide-react"
import type { UserProfile } from "@/pages/UserProfile"
import coverImage from "@/assets/noithat.jpg"
import axiosClient from "@/service/axiosClient"

interface UserHeaderSectionProps {
  user: UserProfile
  isUploadingAvatar: boolean
  handleAvatarUpload: (event: React.ChangeEvent<HTMLInputElement>) => void
}

export default function UserHeaderSection({ user, isUploadingAvatar, handleAvatarUpload }: UserHeaderSectionProps) {
  const getAvatarUrl = (user: UserProfile) => {
    if (user.avatar) {
      if (user.avatar.startsWith("http")) return user.avatar
      const baseURL = axiosClient.defaults.baseURL?.replace("/api", "") || "http://152.53.169.79:8080"
      const avatarPath = user.avatar.startsWith("/") ? user.avatar : `/${user.avatar}`
      return `${baseURL}${avatarPath}`
    }
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName)}&background=d97706&color=fff&size=112`
  }

  const getRoleDisplay = (role?: string) => {
    const roleMap: { [key: string]: { label: string; color: string; icon: React.ReactNode } } = {
      CUSTOMER: {
        label: "Khách hàng",
        color: "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300",
        icon: <User className="h-4 w-4" />,
      },
      ADMIN: {
        label: "Quản trị viên",
        color: "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300",
        icon: <Shield className="h-4 w-4" />,
      },
      STAFF: {
        label: "Nhân viên",
        color: "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300",
        icon: <UserCheck className="h-4 w-4" />,
      },
    }
    return roleMap[role || "CUSTOMER"] || roleMap["CUSTOMER"]
  }

  const getStatusDisplay = (status?: string) => {
    const statusMap: { [key: string]: { label: string; color: string } } = {
      ACTIVE: { label: "Hoạt động", color: "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300" },
      INACTIVE: { label: "Không hoạt động", color: "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300" },
      SUSPENDED: { label: "Tạm khóa", color: "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300" },
    }
    return statusMap[status || "ACTIVE"] || statusMap["ACTIVE"]
  }

  return (
    <div className="relative h-48">
      <div className="absolute inset-0">
        <img src={coverImage || "/placeholder.svg"} alt="Cover" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/40 via-secondary/30 to-accent/40"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 dark:from-black/80 via-transparent to-transparent"></div>
        <div className="absolute top-4 left-4 w-16 h-16 border-2 border-white/20 dark:border-gray-400/30 rounded-full"></div>
        <div className="absolute bottom-4 right-4 w-8 h-8 bg-white/10 dark:bg-gray-400/20 rounded-full"></div>
        <div className="absolute top-1/2 right-8 w-4 h-4 bg-white/20 dark:bg-gray-400/30 rotate-45"></div>
      </div>

      <div className="absolute top-4 right-4">
        <label className="bg-black/30 dark:bg-gray-800/50 backdrop-blur-sm hover:bg-black/40 dark:hover:bg-gray-700/60 text-white dark:text-gray-100 p-2.5 rounded-xl cursor-pointer transition-all duration-200 flex items-center gap-2">
          <Camera className="h-4 w-4" />
          <span className="text-sm font-medium">Đổi ảnh bìa</span>
          <input type="file" accept="image/*" className="hidden" />
        </label>
      </div>

      <div className="absolute bottom-0 left-6 translate-y-1/3">
        <div className="relative">
          <div className="w-28 h-28 rounded-2xl bg-card p-2 shadow-xl ring-4 ring-card">
            <img
              src={getAvatarUrl(user) || "/placeholder.svg"}
              alt={user.fullName}
              className="w-full h-full rounded-xl object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                  user.fullName,
                )}&background=d97706&color=fff&size=112`
              }}
            />
            {isUploadingAvatar && (
              <div className="absolute inset-2 bg-black/50 rounded-xl flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-white/20 border-t-white"></div>
              </div>
            )}
          </div>
          <label
            className={`absolute -bottom-1 -right-1 bg-primary hover:bg-primary/90 text-primary-foreground p-2 rounded-xl cursor-pointer transition-all duration-200 shadow-lg ${
              isUploadingAvatar ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
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

      <div className="absolute bottom-4 right-6 text-right">
        <div className="bg-black/30 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 text-white dark:text-gray-100">
          <h2 className="text-xl font-bold mb-1">{user.fullName}</h2>
          <div className="flex items-center justify-end gap-2 mb-1">
            <span
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
                getStatusDisplay(user.status).color
              } shadow-sm`}
            >
              {getRoleDisplay(user.role).icon}
              {getRoleDisplay(user.role).label}
            </span>
          </div>
          <p className="text-white/80 dark:text-gray-300 text-sm">{user.email}</p>
        </div>
      </div>
    </div>
  )
}
