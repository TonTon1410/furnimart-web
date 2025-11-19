"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { motion, type Variants } from "framer-motion";
import {
  ArrowLeft,
  Lock,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  Loader2,
  Shield,
} from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { authService } from "@/service/authService";
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
    scale: [1, 1.2, 0.9, 1],
    rotate: [0, 270, 360],
    transition: {
      duration: 11,
      repeat: Number.POSITIVE_INFINITY,
      ease: [0.4, 0, 0.2, 1],
      delay: 3,
    },
  },
};

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");
  const [isValidToken, setIsValidToken] = useState(true);

  useEffect(() => {
    if (!token) {
      setIsValidToken(false);
      setError("Token khôi phục không hợp lệ hoặc đã hết hạn");
    }
  }, [token]);

  const validatePassword = (password: string) => {
    const errors = [];
    if (password.length < 6) {
      errors.push("Mật khẩu phải có ít nhất 6 ký tự");
    }
    if (!/(?=.*[a-z])/.test(password)) {
      errors.push("Mật khẩu phải có ít nhất 1 chữ thường");
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      errors.push("Mật khẩu phải có ít nhất 1 chữ hoa");
    }
    if (!/(?=.*\d)/.test(password)) {
      errors.push("Mật khẩu phải có ít nhất 1 số");
    }
    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.password || !formData.confirmPassword) {
      setError("Vui lòng nhập đầy đủ thông tin");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Mật khẩu xác nhận không khớp");
      return;
    }

    const passwordErrors = validatePassword(formData.password);
    if (passwordErrors.length > 0) {
      setError(passwordErrors.join(", "));
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      await authService.resetPassword(token!, formData.password);
      setIsSuccess(true);
    } catch (error: any) {
      console.error("Reset password error:", error);

      if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else if (error.response?.status === 400) {
        setError("Token không hợp lệ hoặc đã hết hạn");
      } else if (error.response?.status === 404) {
        setError("Yêu cầu khôi phục không tồn tại");
      } else if (error.response?.status >= 500) {
        setError("Lỗi server, vui lòng thử lại sau");
      } else {
        setError("Không thể đặt lại mật khẩu. Vui lòng thử lại");
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!isValidToken) {
    return (
      <main className="min-h-screen flex">
        <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
          <img
            src="/assets/noithat.jpg"
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
            <p className="text-white/90 font-bold text-lg">
              Ứng dụng công nghệ tiên tiến vào từng sản phẩm.
            </p>
            <p className="text-white/90 font-bold text-lg">
              Tối ưu hóa không gian sống và tận hưởng sự tiện nghi mỗi ngày.
            </p>
          </div>
        </div>

        <div className="w-full lg:w-1/2 flex items-center justify-center p-6 relative overflow-hidden bg-gradient-to-br from-red-50 via-pink-50 to-rose-50">
          <motion.div
            initial="hidden"
            animate="show"
            variants={fadeUp}
            transition={{ duration: 0.6 }}
            className="w-full max-w-md relative z-10"
          >
            <div className="bg-white/90 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-white/20 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6"
              >
                <AlertCircle className="h-10 w-10 text-red-600" />
              </motion.div>

              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Liên kết không hợp lệ
              </h2>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Liên kết khôi phục mật khẩu không hợp lệ hoặc đã hết hạn. Vui
                lòng yêu cầu khôi phục mật khẩu mới.
              </p>

              <div className="space-y-3">
                <Link
                  to="/forgot-password"
                  className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl hover:from-cyan-600 hover:to-blue-700 transition-all duration-300 transform hover:scale-105 flex items-center justify-center"
                >
                  Yêu cầu khôi phục mới
                </Link>

                <Link
                  to="/login"
                  className="w-full py-3 border border-gray-300 bg-white text-gray-700 rounded-lg font-semibold hover:bg-gray-50 hover:shadow-md transition-all duration-300 transform hover:scale-105 flex items-center justify-center"
                >
                  Quay lại đăng nhập
                </Link>
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

  if (isSuccess) {
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
            <p className="text-white/90 font-bold text-lg">
              Ứng dụng công nghệ tiên tiến vào từng sản phẩm.
            </p>
            <p className="text-white/90 font-bold text-lg">
              Tối ưu hóa không gian sống và tận hưởng sự tiện nghi mỗi ngày.
            </p>
          </div>
        </div>

        <div className="w-full lg:w-1/2 flex items-center justify-center p-6 relative overflow-hidden bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
          <motion.div
            className="absolute top-20 right-20 w-48 h-48 bg-gradient-to-br from-green-500/60 to-emerald-500/40 rounded-full blur-sm"
            variants={bubbleVariants}
            animate="animate"
          />
          <motion.div
            className="absolute top-40 left-10 w-40 h-40 bg-gradient-to-br from-teal-500/70 to-cyan-500/50 rounded-full blur-sm"
            variants={bubbleVariants2}
            animate="animate"
          />
          <motion.div
            className="absolute bottom-32 right-16 w-56 h-56 bg-gradient-to-br from-emerald-500/50 to-green-500/30 rounded-full blur-sm"
            variants={bubbleVariants3}
            animate="animate"
          />
          <motion.div
            className="absolute bottom-20 left-20 w-36 h-36 bg-gradient-to-br from-cyan-600/65 to-teal-600/45 rounded-full blur-sm"
            variants={bubbleVariants4}
            animate="animate"
          />
          <motion.div
            className="absolute top-60 right-32 w-32 h-32 bg-gradient-to-br from-green-500/75 to-emerald-500/55 rounded-full blur-sm"
            variants={bubbleVariants5}
            animate="animate"
          />

          <motion.div
            initial="hidden"
            animate="show"
            variants={fadeUp}
            transition={{ duration: 0.6 }}
            className="w-full max-w-md relative z-10"
          >
            <div className="bg-white/90 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-white/20 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
              >
                <CheckCircle className="h-10 w-10 text-green-600" />
              </motion.div>

              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Đặt lại mật khẩu thành công!
              </h2>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Mật khẩu của bạn đã được cập nhật thành công. Bây giờ bạn có thể
                đăng nhập với mật khẩu mới.
              </p>

              <Link
                to="/login"
                className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-300 transform hover:scale-105 flex items-center justify-center"
              >
                Đăng nhập ngay
              </Link>
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
          <p className="text-white/90 font-bold text-lg">
            Ứng dụng công nghệ tiên tiến vào từng sản phẩm.
          </p>
          <p className="text-white/90 font-bold text-lg">
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
          initial="hidden"
          animate="show"
          variants={fadeUp}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md relative z-10"
        >
          <div className="bg-white/90 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-white/20">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-cyan-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-cyan-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Đặt lại mật khẩu
              </h2>
              <p className="text-gray-600">
                Nhập mật khẩu mới cho tài khoản của bạn
              </p>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg flex items-start gap-2"
              >
                <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <span className="text-sm">{error}</span>
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mật khẩu mới *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    placeholder="Nhập mật khẩu mới"
                    className="w-full px-4 py-3 pl-12 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition-all"
                    required
                    disabled={isLoading}
                  />
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
                <div className="mt-2 text-xs text-gray-500 space-y-1">
                  <p>Mật khẩu phải có:</p>
                  <ul className="list-disc list-inside space-y-0.5 ml-2">
                    <li>Ít nhất 6 ký tự</li>
                    <li>Ít nhất 1 chữ thường</li>
                    <li>Ít nhất 1 chữ hoa</li>
                    <li>Ít nhất 1 số</li>
                  </ul>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Xác nhận mật khẩu *
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        confirmPassword: e.target.value,
                      })
                    }
                    placeholder="Nhập lại mật khẩu mới"
                    className="w-full px-4 py-3 pl-12 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition-all"
                    required
                    disabled={isLoading}
                  />
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
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
                className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl hover:from-cyan-600 hover:to-blue-700 active:scale-95 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 disabled:hover:scale-100 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Đang cập nhật...
                  </>
                ) : (
                  "Cập nhật mật khẩu"
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <Link
                to="/login"
                className="text-sm text-cyan-600 hover:text-cyan-700 hover:underline font-medium"
              >
                ← Quay lại đăng nhập
              </Link>
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
