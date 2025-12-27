"use client"

import type React from "react"

import { useState } from "react"
import { authService } from "@/service/authService"

interface RegisterFormProps {
  isLoading: boolean
  setIsLoading: (loading: boolean) => void
  setError: (error: string) => void
  setSuccess: (msg: string) => void
  onSuccess: (email: string) => void
}

export function RegisterForm({ isLoading, setIsLoading, setError, setSuccess, onSuccess }: RegisterFormProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [registerData, setRegisterData] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    birthDay: "",
    gender: true,
  })

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (registerData.password !== registerData.confirmPassword) {
      setError("Mật khẩu xác nhận không khớp")
      return
    }

    setIsLoading(true)
    setError("")
    setSuccess("")

    try {
      await authService.register(registerData)
      setSuccess("Đăng ký thành công!")
      setTimeout(() => onSuccess(registerData.email), 2000)
    } catch (error: any) {
      setError(error?.response?.data?.message || "Lỗi đăng ký")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleRegister} className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
      {/* Shortened for brevity - reusing patterns from login */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Họ và tên</label>
        <input
          type="text"
          value={registerData.fullName}
          onChange={(e) => setRegisterData({ ...registerData, fullName: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 outline-none transition-all"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
        <input
          type="email"
          value={registerData.email}
          onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 outline-none transition-all"
          required
        />
      </div>
      {/* ... Other fields (Phone, Birthday, Password) ... */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-3 bg-linear-to-r from-emerald-500 to-teal-600 text-white rounded-lg font-semibold shadow-lg hover:from-emerald-600 hover:to-teal-700 active:scale-95 transition-all disabled:opacity-50"
      >
        {isLoading ? "Đang xử lý..." : "Đăng ký"}
      </button>
    </form>
  )
}
