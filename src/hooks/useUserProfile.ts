"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { authService } from "@/service/authService"
import { userService } from "@/service/userService"
import { addressService, type Address } from "@/service/addressService"
import type { UserProfile } from "@/pages/UserProfile"

interface AxiosError {
  response?: {
    status?: number
    data?: { message?: string }
  }
  message?: string
}

export function useUserProfile() {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [error, setError] = useState<string>("")
  const [success, setSuccess] = useState<string>("")
  const [defaultAddress, setDefaultAddress] = useState<Address | null>(null)

  const [editForm, setEditForm] = useState({
    fullName: "",
    phone: "",
    birthday: "",
    gender: false,
    cccd: "",
  })

  useEffect(() => {
    const isAuth = authService.isAuthenticated()
    if (!isAuth) {
      window.location.href = "/login"
      return
    }
    fetchUserProfile()
    fetchDefaultAddress()
  }, [])

  const fetchDefaultAddress = async () => {
    try {
      const profile = await authService.getProfile()
      const userId = profile?.id || authService.getUserId()
      if (!userId) return

      try {
        const response = await addressService.getDefaultAddress(userId)
        if (response?.data) {
          setDefaultAddress(response.data)
          return
        }
      } catch (error: unknown) {
        const axiosError = error as { response?: { status?: number } }
        if (axiosError.response?.status === 404) {
          const allAddressesResponse = await addressService.getAddressesByUserId(userId)
          if (allAddressesResponse?.data && Array.isArray(allAddressesResponse.data)) {
            const defaultAddr = allAddressesResponse.data.find((addr) => addr.isDefault)
            if (defaultAddr) setDefaultAddress(defaultAddr)
          }
        }
      }
    } catch (error) {
      console.log("Failed to fetch default address:", error)
    }
  }

  const fetchUserProfile = async () => {
    try {
      setIsLoading(true)
      setError("")
      const response = await userService.getProfile()

      if (response.status === 200 && response.data) {
        const userData = response.data
        setUser(userData)
        setEditForm({
          fullName: userData.fullName || "",
          phone: userData.phone || "",
          birthday: userData.birthday ? userData.birthday.split("T")[0] : "",
          gender: userData.gender || false,
          cccd: userData.cccd || "",
        })
      } else {
        throw new Error(response.message || "Không thể tải thông tin profile")
      }
    } catch (error: unknown) {
      const axiosError = error as AxiosError
      if (axiosError.response?.status === 401) {
        authService.logout(false)
        window.location.href = "/login"
        return
      }
      setError(axiosError.response?.data?.message || axiosError.message || "Không thể tải thông tin profile")
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditToggle = () => {
    if (isEditing && user) {
      setEditForm({
        fullName: user.fullName || "",
        phone: user.phone || "",
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

    const dataToValidate = {
      fullName: editForm.fullName,
      phone: editForm.phone.trim() ? editForm.phone : undefined,
      birthday: editForm.birthday ? editForm.birthday : undefined,
      gender: editForm.gender,
      cccd: editForm.cccd.trim() ? editForm.cccd : undefined,
    }

    const validationErrors = userService.validateProfileData(dataToValidate)
    if (validationErrors.length > 0) {
      setError("Lỗi xác thực:\n" + validationErrors.map((err) => `• ${err}`).join("\n"))
      window.scrollTo({ top: 0, behavior: "smooth" })
      return
    }

    try {
      setIsSaving(true)
      setError("")
      const updateData = {
        fullName: editForm.fullName.trim(),
        phone: editForm.phone.trim() || undefined,
        birthday: editForm.birthday ? new Date(editForm.birthday).toISOString() : undefined,
        gender: editForm.gender,
        cccd: editForm.cccd.trim() || undefined,
      }

      const response = await userService.updateProfile(updateData)
      if (response.status === 200 && response.data) {
        setUser(response.data)
        setIsEditing(false)
        setSuccess("Cập nhật thông tin thành công!")
        setTimeout(() => setSuccess(""), 5000)
      } else {
        throw new Error(response.message || "Cập nhật thông tin thất bại")
      }
    } catch (error: unknown) {
      const axiosError = error as AxiosError
      setError(axiosError.response?.data?.message || axiosError.message || "Cập nhật thông tin thất bại")
    } finally {
      setIsSaving(false)
    }
  }

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    event.target.value = ""

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"]
    if (!allowedTypes.includes(file.type)) {
      setError("Chỉ hỗ trợ file ảnh (JPG, PNG, GIF, WebP)")
      return
    }

    if (file.size > 5 * 1024 * 1024) {
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
        // Refresh profile
        await fetchUserProfile()
      } else {
        throw new Error(response.message || "Cập nhật avatar thất bại")
      }
    } catch (error: unknown) {
      const axiosError = error as AxiosError
      setError(axiosError.response?.data?.message || axiosError.message || "Cập nhật avatar thất bại")
    } finally {
      setIsUploadingAvatar(false)
    }
  }

  const handleAvatarUrlUpdate = async (url: string) => {
    try {
      setIsUploadingAvatar(true)
      setError("")

      // Validate URL format
      try {
        new URL(url)
      } catch {
        throw new Error("URL không hợp lệ")
      }

      const response = await userService.updateAvatarUrl(url)

      if (response.status === 200 && response.data && user) {
        setUser({ ...user, avatar: response.data.avatar })
        setSuccess("Cập nhật avatar thành công!")
        setTimeout(() => setSuccess(""), 3000)
        // Refresh profile to get updated data
        await fetchUserProfile()
      } else {
        throw new Error(response.message || "Cập nhật avatar thất bại")
      }
    } catch (error: unknown) {
      const axiosError = error as AxiosError
      setError(axiosError.response?.data?.message || axiosError.message || "Cập nhật avatar thất bại")
    } finally {
      setIsUploadingAvatar(false)
    }
  }

  return {
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
    handleAvatarUrlUpdate,
    fetchUserProfile,
  }
}