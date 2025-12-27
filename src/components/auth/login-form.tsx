"use client"

import type React from "react"

import { useState } from "react"
import { Eye, EyeOff } from "lucide-react"
import { Link, useNavigate } from "react-router-dom"
import { authService } from "@/service/authService"

interface LoginFormProps {
  isLoading: boolean
  setIsLoading: (loading: boolean) => void
  setError: (error: string) => void
  rememberMe: boolean
  setRememberMe: (remember: boolean) => void
  initialEmail?: string
}

export function LoginForm({
  isLoading,
  setIsLoading,
  setError,
  rememberMe,
  setRememberMe,
  initialEmail = "",
}: LoginFormProps) {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [loginData, setLoginData] = useState({
    email: initialEmail,
    password: "",
  })

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!loginData.email || !loginData.password) {
      setError("Vui lòng nhập đầy đủ thông tin")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      await authService.login(loginData)
      authService.saveRememberMe(loginData.email, rememberMe)
      const role = authService.getRole()
      navigate(role && role !== "customer" ? "/dashboard" : "/")
    } catch (error: any) {
      setError(error?.response?.data?.message || error?.message || "Lỗi đăng nhập")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleLogin} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
        <input
          type="email"
          value={loginData.email}
          onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 outline-none transition-all"
          placeholder="Nhập email"
          required
          disabled={isLoading}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu</label>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            value={loginData.password}
            onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
            className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 outline-none transition-all"
            placeholder="Nhập mật khẩu"
            required
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="w-4 h-4 text-cyan-600 border-gray-300 rounded focus:ring-cyan-500"
          />
          <span className="text-sm text-gray-600">Ghi nhớ đăng nhập</span>
        </label>
        <Link to="/forgot-password" className="text-sm text-cyan-600 hover:underline">
          Quên mật khẩu?
        </Link>
      </div>
      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-3 bg-linear-to-r from-cyan-500 to-blue-600 text-white rounded-lg font-semibold shadow-lg hover:from-cyan-600 hover:to-blue-700 active:scale-95 transition-all disabled:opacity-50"
      >
        {isLoading ? "Đang đăng nhập..." : "Đăng nhập"}
      </button>
    </form>
  )
}
