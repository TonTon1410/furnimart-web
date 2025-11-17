/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { motion, type Variants } from "framer-motion";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { authService } from "@/service/authService";
import { useGoogleLogin } from "@react-oauth/google";
import noithatImg from "@/assets/noithat.jpg";

const fadeUp = { hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0 } };

const bubbleVariants: Variants = {
  animate: {
    x: [100, -100],
    y: [0, -20, 0, 20, 0],
    scale: [1, 1.1, 1],
    rotate: [0, 360],
    transition: {
      duration: 8,
      repeat: Number.POSITIVE_INFINITY,
      ease: [0.4, 0, 0.2, 1],
    },
  },
};

const bubbleVariants2: Variants = {
  animate: {
    x: [120, -120],
    y: [0, 30, 0, -30, 0],
    scale: [1, 0.9, 1.2, 1],
    rotate: [0, -360],
    transition: {
      duration: 10,
      repeat: Number.POSITIVE_INFINITY,
      ease: [0.4, 0, 0.2, 1],
      delay: 1,
    },
  },
};

const bubbleVariants3: Variants = {
  animate: {
    x: [150, -150],
    y: [0, -40, 0, 40, 0],
    scale: [1, 1.3, 0.8, 1],
    rotate: [0, 180, 360],
    transition: {
      duration: 12,
      repeat: Number.POSITIVE_INFINITY,
      ease: [0.4, 0, 0.2, 1],
      delay: 2,
    },
  },
};

const bubbleVariants4: Variants = {
  animate: {
    x: [80, -80],
    y: [0, 25, 0, -25, 0],
    scale: [1, 0.7, 1.4, 1],
    rotate: [0, -180, -360],
    transition: {
      duration: 9,
      repeat: Number.POSITIVE_INFINITY,
      ease: [0.4, 0, 0.2, 1],
      delay: 0.5,
    },
  },
};

const bubbleVariants5: Variants = {
  animate: {
    x: [110, -110],
    y: [0, -35, 0, 35, 0],
    scale: [1, 1.2, 0.9, 1.3, 0.8, 1.2, 0.6, 1.4, 1],
    rotate: [0, 270, 360],
    transition: {
      duration: 11,
      repeat: Number.POSITIVE_INFINITY,
      ease: [0.4, 0, 0.2, 1],
      delay: 3,
    },
  },
};

const bubbleVariants6: Variants = {
  animate: {
    x: [140, -140],
    y: [0, 45, 0, -45, 0],
    scale: [1, 0.8, 1.5, 1],
    rotate: [0, 90, 180, 270, 360],
    transition: {
      duration: 13,
      repeat: Number.POSITIVE_INFINITY,
      ease: [0.4, 0, 0.2, 1],
      delay: 4,
    },
  },
};

const bubbleVariants7: Variants = {
  animate: {
    x: [0, -55, -110, -55, 0, 55, 110, 55, 0],
    y: [0, 55, 0, -55, -110, -55, 0, 55, 110],
    scale: [1, 1.1, 0.5, 1.5, 0.8, 1.2, 0.6, 1.4, 1],
    rotate: [0, -60, -120, -180, -240, -300, -360],
    transition: {
      duration: 19,
      repeat: Number.POSITIVE_INFINITY,
      ease: [0.4, 0, 0.2, 1],
      delay: 7,
    },
  },
};

const bubbleVariants8: Variants = {
  animate: {
    x: [0, 30, 60, 85, 60, 30, 0, -30, -60, -85, -60, -30, 0],
    y: [0, -30, -60, 0, 60, 85, 60, 30, 0, -30, -60, -85, -60],
    scale: [1, 1.2, 0.7, 1.6, 0.9, 1.3, 0.8, 1.1, 1.4, 0.6, 1.2, 1],
    rotate: [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330, 360],
    transition: {
      duration: 28,
      repeat: Number.POSITIVE_INFINITY,
      ease: [0.4, 0, 0.2, 1],
      delay: 6,
    },
  },
};

export default function Login() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>(""); // Added success state
  const [rememberMe, setRememberMe] = useState(false);

  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  });

  // Load remembered email khi component mount
  useEffect(() => {
    const savedEmail = authService.getRememberedEmail();
    const isRemembered = authService.isRememberMe();

    if (savedEmail && isRemembered) {
      setLoginData((prev) => ({ ...prev, email: savedEmail }));
      setRememberMe(true);
    }
  }, []);

  const [registerData, setRegisterData] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    birthDay: "",
    gender: true, // hoặc false, tuỳ người dùng chọn
  });

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !registerData.fullName ||
      !registerData.email ||
      !registerData.phone ||
      !registerData.password ||
      !registerData.birthDay
    ) {
      setError("Vui lòng nhập đầy đủ thông tin");
      return;
    }

    if (registerData.password !== registerData.confirmPassword) {
      setError("Mật khẩu xác nhận không khớp");
      return;
    }

    if (registerData.password.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự");
      return;
    }

    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const { ...registerPayload } = registerData;
      console.log("Payload gửi đăng ký:", registerPayload);
      const response = await authService.register(registerPayload);

      console.log("Đăng ký thành công:", response.data);
      setSuccess("Đăng ký thành công! Chuyển sang đăng nhập...");

      // Reset form
      setRegisterData({
        fullName: "",
        email: "",
        phone: "",
        password: "",
        confirmPassword: "",
        birthDay: "",
        gender: true,
      });

      // Auto switch to login tab after 2 seconds
      setTimeout(() => {
        setActiveTab("login");
        setSuccess("");
        // Pre-fill email in login form
        setLoginData((prev) => ({ ...prev, email: registerData.email }));
      }, 2000);
    } catch (error: any) {
      console.error("Lỗi đăng ký:", error);

      if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else if (error.response?.status === 400) {
        setError("Thông tin đăng ký không hợp lệ");
      } else if (error.response?.status === 409) {
        setError("Email hoặc tên đăng nhập đã tồn tại");
      } else if (error.response?.status >= 500) {
        setError("Lỗi server, vui lòng thử lại sau");
      } else {
        setError("Không thể kết nối đến server");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); // Ngăn form submit mặc định

    if (!loginData.email || !loginData.password) {
      setError("Vui lòng nhập đầy đủ thông tin");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // Sử dụng authService thay vì gọi trực tiếp axiosClient
      const response = await authService.login(loginData);

      // Lưu remember me
      authService.saveRememberMe(loginData.email, rememberMe);

      console.log("Đăng nhập thành công:", response.data);

      // Lấy role từ authService
      const role = authService.getRole();

      // Redirect dựa trên role
      if (role && role !== "customer") {
        // Các role khác (admin, manager, seller, delivery) → dashboard
        navigate("/dashboard");
      } else {
        // CUSTOMER hoặc không có role → trang chủ
        navigate("/");
      }

      // Redirect hoặc cập nhật UI sau khi đăng nhập thành công
      // window.location.href = "/dashboard" // hoặc sử dụng navigate từ react-router
    } catch (error: any) {
      console.error("Lỗi đăng nhập:", error);

      // Xử lý lỗi chi tiết hơn
      if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else if (error.response?.status === 401) {
        setError("Email hoặc mật khẩu không đúng");
      } else if (error.response?.status >= 500) {
        setError("Lỗi server, vui lòng thử lại sau");
      } else {
        setError("Không thể kết nối đến server");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleAuth = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setIsLoading(true);
      setError("");

      try {
        // Call backend API with access token
        const response = await authService.loginWithGoogle(
          tokenResponse.access_token
        );

        console.log("Đăng nhập Google thành công:", response.data);

        // Lấy role từ authService
        const role = authService.getRole();

        // Redirect dựa trên role
        if (role && role !== "customer") {
          // Các role khác (admin, manager, seller, delivery) → dashboard
          navigate("/dashboard");
        } else {
          // CUSTOMER hoặc không có role → trang chủ
          navigate("/");
        }
      } catch (error: any) {
        console.error("Lỗi đăng nhập Google:", error);

        if (error.response?.data?.message) {
          setError(error.response.data.message);
        } else if (error.response?.status === 401) {
          setError("Xác thực Google không thành công");
        } else if (error.response?.status >= 500) {
          setError("Lỗi server, vui lòng thử lại sau");
        } else {
          setError("Không thể kết nối đến server");
        }
      } finally {
        setIsLoading(false);
      }
    },
    onError: () => {
      setError("Đăng nhập Google thất bại");
    },
    // Cấu hình để tránh hỏi lại mật khẩu
    flow: "implicit", // Sử dụng implicit flow cho web app
    scope: "openid email profile", // Chỉ yêu cầu các quyền cơ bản
    // Không dùng 'prompt: consent' để tránh hỏi lại mỗi lần
  });

  return (
    <main className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <img
          src={noithatImg}
          alt="Nội thất hiện đại"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/20 to-cyan-600/20" />
        <Link
          to="/"
          className="absolute top-6 left-6 flex items-center gap-2 px-4 py-2 bg-white/90 backdrop-blur-sm rounded-full text-gray-700 hover:bg-white transition-all"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại Trang Chủ
        </Link>

        <div className="absolute bottom-8 left-8 text-white">
          <h1 className="text-7xl font-bold mb-2">FurniMart</h1>
          <p className=" text-white/90 font-bold text-lg">
            Ứng dụng công nghệ tiên tiến vào từng sản phẩm.
          </p>
          <p className=" text-white/90 font-bold text-lg">
            {" "}
            Tối ưu hóa không gian sống và tận hưởng sự tiện nghi mỗi ngày.
          </p>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 relative overflow-hidden bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50">
        <motion.div
          className="absolute top-20 right-20 w-48 h-48 bg-gradient-to-br from-purple-500/60 to-pink-500/40 rounded-full blur-sm"
          variants={bubbleVariants}
          animate="animate"
        />
        <motion.div
          className="absolute top-40 left-10 w-40 h-40 bg-gradient-to-br from-emerald-500/70 to-teal-500/50 rounded-full blur-sm"
          variants={bubbleVariants2}
          animate="animate"
        />
        <motion.div
          className="absolute bottom-32 right-16 w-56 h-56 bg-gradient-to-br from-orange-500/50 to-red-500/30 rounded-full blur-sm"
          variants={bubbleVariants3}
          animate="animate"
        />
        <motion.div
          className="absolute bottom-20 left-20 w-36 h-36 bg-gradient-to-br from-indigo-600/65 to-blue-600/45 rounded-full blur-sm"
          variants={bubbleVariants4}
          animate="animate"
        />
        <motion.div
          className="absolute top-60 right-32 w-32 h-32 bg-gradient-to-br from-yellow-500/75 to-amber-500/55 rounded-full blur-sm"
          variants={bubbleVariants5}
          animate="animate"
        />
        <motion.div
          className="absolute top-32 left-32 w-44 h-44 bg-gradient-to-br from-rose-500/60 to-pink-600/40 rounded-full blur-sm"
          variants={bubbleVariants6}
          animate="animate"
        />
        <motion.div
          className="absolute bottom-40 right-8 w-36 h-36 bg-gradient-to-br from-cyan-600/55 to-blue-700/35 rounded-full blur-sm"
          variants={bubbleVariants7}
          animate="animate"
        />
        <motion.div
          className="absolute top-16 right-64 w-22 h-22 bg-gradient-to-br from-lime-500/70 to-green-600/50 rounded-full blur-sm"
          variants={bubbleVariants8}
          animate="animate"
        />

        <motion.div
          initial="hidden"
          animate="show"
          variants={fadeUp}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md relative z-10"
        >
          <div className="bg-white/90 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-white/20">
            <div className="flex mb-8 bg-gray-100 rounded-xl p-1 relative">
              {/* Sliding background indicator */}
              <motion.div
                className="absolute top-1 bottom-1 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg shadow-md"
                initial={false}
                animate={{
                  x: activeTab === "login" ? 0 : "100%",
                  width: "50%",
                }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 30,
                }}
              />

              <button
                onClick={() => {
                  setActiveTab("login");
                  setError("");
                  setSuccess("");
                }}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-all duration-300 transform hover:scale-105 relative z-10 ${
                  activeTab === "login"
                    ? "text-white"
                    : "text-gray-600 hover:text-gray-800"
                }`}
              >
                Đăng Nhập
              </button>
              <button
                onClick={() => {
                  setActiveTab("register");
                  setError("");
                  setSuccess("");
                }}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-all duration-300 transform hover:scale-105 relative z-10 ${
                  activeTab === "register"
                    ? "text-white"
                    : "text-gray-600 hover:text-gray-800"
                }`}
              >
                Đăng ký
              </button>
            </div>

            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: activeTab === "login" ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: activeTab === "login" ? 20 : -20 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              {/* Login Form */}
              {activeTab === "login" && (
                <div>
                  <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                      Đăng nhập tài khoản
                    </h2>
                  </div>

                  {/* Hiển thị lỗi */}
                  {error && (
                    <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                      {error}
                    </div>
                  )}

                  <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        * Email
                      </label>
                      <input
                        type="email"
                        value={loginData.email}
                        onChange={(e) =>
                          setLoginData({ ...loginData, email: e.target.value })
                        }
                        placeholder="Nhập email"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition-all"
                        required
                        disabled={isLoading}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        * Mật khẩu
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          value={loginData.password}
                          onChange={(e) =>
                            setLoginData({
                              ...loginData,
                              password: e.target.value,
                            })
                          }
                          placeholder="Nhập mật khẩu"
                          className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition-all"
                          required
                          disabled={isLoading}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          disabled={isLoading}
                        >
                          {showPassword ? (
                            <EyeOff className="h-5 w-5" />
                          ) : (
                            <Eye className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          className="w-4 h-4 text-cyan-600 bg-gray-100 border-gray-300 rounded focus:ring-cyan-500 dark:bg-gray-700 dark:border-gray-600"
                        />
                        <span className="text-sm text-gray-600 dark:text-gray-300">
                          Ghi nhớ đăng nhập
                        </span>
                      </label>

                      <Link
                        to="/forgot-password"
                        className="text-sm text-cyan-600 hover:text-cyan-700 hover:underline"
                      >
                        Quên mật khẩu?
                      </Link>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl hover:from-cyan-600 hover:to-blue-700 active:scale-95 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 disabled:hover:scale-100"
                    >
                      {isLoading ? "Đang đăng nhập..." : "Đăng nhập"}
                    </button>
                  </form>
                </div>
              )}

              {activeTab === "register" && (
                <div>
                  <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                      Tạo tài khoản mới
                    </h2>
                  </div>

                  {/* Hiển thị lỗi và thành công */}
                  {error && (
                    <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                      {error}
                    </div>
                  )}
                  {success && (
                    <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg">
                      {success}
                    </div>
                  )}

                  <form onSubmit={handleRegister} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        * Tên đăng nhập
                      </label>
                      <input
                        type="text"
                        value={registerData.fullName}
                        onChange={(e) =>
                          setRegisterData({
                            ...registerData,
                            fullName: e.target.value,
                          })
                        }
                        placeholder="Nhập tên đăng nhập"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition-all"
                        required
                        disabled={isLoading}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        * Email
                      </label>
                      <input
                        type="email"
                        value={registerData.email}
                        onChange={(e) =>
                          setRegisterData({
                            ...registerData,
                            email: e.target.value,
                          })
                        }
                        placeholder="Nhập email"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition-all"
                        required
                        disabled={isLoading}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        * Số điện thoại
                      </label>
                      <input
                        type="tel"
                        value={registerData.phone}
                        onChange={(e) =>
                          setRegisterData({
                            ...registerData,
                            phone: e.target.value,
                          })
                        }
                        placeholder="Nhập số điện thoại"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition-all"
                        required
                        disabled={isLoading}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        * Ngày sinh
                      </label>
                      <input
                        type="date"
                        value={registerData.birthDay}
                        onChange={(e) =>
                          setRegisterData({
                            ...registerData,
                            birthDay: e.target.value,
                          })
                        }
                        title="Ngày sinh"
                        placeholder="Chọn ngày sinh"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        required
                        disabled={isLoading}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        * Mật khẩu
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          value={registerData.password}
                          onChange={(e) =>
                            setRegisterData({
                              ...registerData,
                              password: e.target.value,
                            })
                          }
                          placeholder="Nhập mật khẩu (ít nhất 6 ký tự)"
                          className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition-all"
                          required
                          minLength={6}
                          disabled={isLoading}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          disabled={isLoading}
                        >
                          {showPassword ? (
                            <EyeOff className="h-5 w-5" />
                          ) : (
                            <Eye className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        * Xác nhận mật khẩu
                      </label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          value={registerData.confirmPassword}
                          onChange={(e) =>
                            setRegisterData({
                              ...registerData,
                              confirmPassword: e.target.value,
                            })
                          }
                          placeholder="Nhập lại mật khẩu"
                          className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition-all"
                          required
                          disabled={isLoading}
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowConfirmPassword(!showConfirmPassword)
                          }
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          disabled={isLoading}
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-5 w-5" />
                          ) : (
                            <Eye className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl hover:from-cyan-600 hover:to-blue-700 active:scale-95 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 disabled:hover:scale-100"
                    >
                      {isLoading ? "Đang đăng ký..." : "Đăng ký"}
                    </button>
                  </form>
                </div>
              )}
            </motion.div>

            {/* Google Login */}
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">hoặc</span>
                </div>
              </div>

              <button
                onClick={() => handleGoogleAuth()}
                disabled={isLoading}
                className="mt-4 w-full py-3 border border-gray-300 bg-white text-gray-700 rounded-lg font-semibold hover:bg-gray-50 hover:shadow-md active:scale-95 transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                {activeTab === "login" ? "Đăng nhập" : "Đăng ký"} với Google
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Mobile back button */}
      <Link
        to="/"
        className="lg:hidden fixed top-4 left-4 z-10 flex items-center gap-2 px-3 py-2 bg-white/90 backdrop-blur-sm rounded-full text-gray-700 hover:bg-white transition-all shadow-lg"
      >
        <ArrowLeft className="h-4 w-4" />
        Trang Chủ
      </Link>
    </main>
  );
}
