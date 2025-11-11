"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { addressService, type Address } from "@/service/addressService";
import { motion } from "framer-motion";
import coverImage from "@/assets/noithat.jpg";
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
} from "lucide-react";
import axiosClient from "@/service/axiosClient";
import { authService } from "@/service/authService";
import { userService } from "@/service/userService";

interface AxiosError {
  response?: {
    status?: number;
    statusText?: string;
    data?: { message?: string };
  };
  config?: {
    url?: string;
    baseURL?: string;
  };
  message?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  address?: string;
  birthday?: string; // Changed from dateOfBirth to birthday to match API
  avatar?: string;
  role?: string;
  status?: string;
  point?: number | null; // Allow null for compatibility with service type
  gender?: boolean; // Added gender field
  cccd?: string | null; // Allow null for compatibility with service type
  createdAt: string;
  updatedAt: string;
}

const fadeUp = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };
const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export default function UserProfile() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [defaultAddress, setDefaultAddress] = useState<Address | null>(null);

  const [editForm, setEditForm] = useState({
    fullName: "",
    phone: "",
    birthday: "",
    gender: false,
    cccd: "",
  });

  useEffect(() => {
    console.log("🔍 UserProfile component mounted");

    // ✅ Check authentication TRƯỚC
    const isAuth = authService.isAuthenticated();
    
    if (!isAuth) {
      console.log("❌ Not authenticated, redirecting to login");
      window.location.href = "/login";
      return;
    }

    // ✅ Chỉ gọi MỘT LẦN sau khi đã xác thực
    fetchUserProfile();
    fetchDefaultAddress();
  }, []);

  const fetchDefaultAddress = async () => {
    try {
      const profile = await authService.getProfile();
      const userId = profile?.id || authService.getUserId();

      if (!userId) {
        console.log("No userId found");
        return;
      }

      // Thử lấy địa chỉ mặc định
      try {
        const response = await addressService.getDefaultAddress(userId);
        if (response?.data) {
          setDefaultAddress(response.data);
          return;
        }
      } catch (error: unknown) {
        // Nếu 404 (không có địa chỉ mặc định), lấy tất cả địa chỉ và tìm default
        const axiosError = error as { response?: { status?: number } };
        if (axiosError.response?.status === 404) {
          console.log("No default address found, fetching all addresses...");

          const allAddressesResponse =
            await addressService.getAddressesByUserId(userId);
          if (
            allAddressesResponse?.data &&
            Array.isArray(allAddressesResponse.data)
          ) {
            const defaultAddr = allAddressesResponse.data.find(
              (addr) => addr.isDefault
            );
            if (defaultAddr) {
              setDefaultAddress(defaultAddr);
            }
          }
        }
      }
    } catch (error) {
      console.log("Failed to fetch default address:", error);
    }
  };

  const fetchUserProfile = async () => {
    try {
      setIsLoading(true);
      setError("");

      console.log("📡 Fetching user profile...");

      const token = authService.getToken();
      console.log(
        "🔑 Current token:",
        token ? token.substring(0, 30) + "..." : "None"
      );

      const response = await userService.getProfile();

      console.log("✅ Profile response:", response);

      if (response.status === 200 && response.data) {
        const userData = response.data;
        console.log("👤 User data received:", userData);

        setUser(userData);

        setEditForm({
          fullName: userData.fullName || "",
          phone: userData.phone || "",
          birthday: userData.birthday ? userData.birthday.split("T")[0] : "",
          gender: userData.gender || false,
          cccd: userData.cccd || "",
        });
      } else {
        throw new Error(response.message || "Không thể tải thông tin profile");
      }
    } catch (error: unknown) {
      const axiosError = error as AxiosError;
      console.error("❌ Fetch profile error:", error);

      if (axiosError.response) {
        console.error("Server Error Details:", {
          status: axiosError.response.status,
          statusText: axiosError.response.statusText,
          data: axiosError.response.data,
          url: axiosError.config?.url,
          fullURL: `${axiosError.config?.baseURL}${axiosError.config?.url}`,
        });
      }

      if (axiosError.response?.status === 401) {
        console.log("🔓 Unauthorized - clearing tokens and redirecting");
        authService.logout(false); // false = giữ remember me (token hết hạn tự động)
        window.location.href = "/login";
        return;
      }

      setError(
        axiosError.response?.data?.message ||
          axiosError.message ||
          "Không thể tải thông tin profile"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditToggle = () => {
    if (isEditing && user) {
      setEditForm({
        fullName: user.fullName || "",
        phone: user.phone || "",
        birthday: user.birthday ? user.birthday.split("T")[0] : "",
        gender: user.gender || false,
        cccd: user.cccd || "",
      });
    }
    setIsEditing(!isEditing);
    setError("");
    setSuccess("");
  };

  const handleSave = async () => {
    console.log("🔵 handleSave called");
    console.log("📝 Current editForm:", editForm);

    if (!editForm.fullName.trim()) {
      setError("Họ và tên không được để trống");
      return;
    }

    // Chỉ validate nếu có giá trị
    const dataToValidate = {
      fullName: editForm.fullName,
      phone: editForm.phone.trim() ? editForm.phone : undefined,
      birthday: editForm.birthday ? editForm.birthday : undefined,
      gender: editForm.gender,
      cccd: editForm.cccd.trim() ? editForm.cccd : undefined,
    };

    console.log("🔍 Data to validate:", dataToValidate);

    const validationErrors = userService.validateProfileData(dataToValidate);
    console.log("❓ Validation errors:", validationErrors);

    if (validationErrors.length > 0) {
      // Hiển thị lỗi validation rõ ràng
      const errorMessage =
        "Lỗi xác thực:\n" +
        validationErrors.map((err) => `• ${err}`).join("\n");
      setError(errorMessage);
      setIsSaving(false);
      // Scroll đến phần hiển thị lỗi
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    try {
      setIsSaving(true);
      setError("");

      const updateData = {
        fullName: editForm.fullName.trim(),
        phone: editForm.phone.trim() || undefined,
        birthday: editForm.birthday
          ? new Date(editForm.birthday).toISOString()
          : undefined,
        gender: editForm.gender,
        cccd: editForm.cccd.trim() || undefined,
      };

      console.log("💾 Updating profile with data:", updateData);

      const response = await userService.updateProfile(updateData);

      if (response.status === 200 && response.data) {
        setUser(response.data);
        setIsEditing(false);
        setSuccess("Cập nhật thông tin thành công!");

        setTimeout(() => setSuccess(""), 5000);
      } else {
        throw new Error(response.message || "Cập nhật thông tin thất bại");
      }
    } catch (error: unknown) {
      const axiosError = error as AxiosError;
      console.error("Update profile error:", error);
      setError(
        axiosError.response?.data?.message ||
          axiosError.message ||
          "Cập nhật thông tin thất bại"
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    event.target.value = "";

    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
    ];
    if (!allowedTypes.includes(file.type)) {
      setError("Chỉ hỗ trợ file ảnh (JPG, PNG, GIF, WebP)");
      return;
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setError("File không được vượt quá 5MB");
      return;
    }

    try {
      setIsUploadingAvatar(true);
      setError("");

      const response = await userService.uploadAvatar(file);

      if (response.status === 200 && response.data && user) {
        setUser({ ...user, avatar: response.data.avatar });
        setSuccess("Cập nhật avatar thành công!");
        setTimeout(() => setSuccess(""), 3000);
      } else {
        throw new Error(response.message || "Cập nhật avatar thất bại");
      }
    } catch (error: unknown) {
      const axiosError = error as AxiosError;
      console.error("Upload avatar error:", error);
      setError(
        axiosError.response?.data?.message ||
          axiosError.message ||
          "Cập nhật avatar thất bại"
      );
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Chưa cập nhật";
    try {
      return new Date(dateString).toLocaleDateString("vi-VN", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return "Chưa cập nhật";
    }
  };

  const getAvatarUrl = (user: UserProfile) => {
    if (user.avatar) {
      // Nếu avatar đã là URL đầy đủ (http/https)
      if (user.avatar.startsWith("http")) {
        return user.avatar;
      }

      // Nếu avatar là đường dẫn tương đối, ghép với base URL server
      const baseURL =
        axiosClient.defaults.baseURL?.replace("/api", "") ||
        "http://152.53.169.79:8080";

      // Đảm bảo avatar có dấu / ở đầu
      const avatarPath = user.avatar.startsWith("/")
        ? user.avatar
        : `/${user.avatar}`;

      return `${baseURL}${avatarPath}`;
    }

    // Fallback về avatar mặc định
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(
      user.fullName
    )}&background=d97706&color=fff&size=112`;
  };

  const getRoleDisplay = (role?: string) => {
    const roleMap: {
      [key: string]: { label: string; color: string; icon: React.ReactNode };
    } = {
      CUSTOMER: {
        label: "Khách hàng",
        color:
          "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300",
        icon: <User className="h-4 w-4" />,
      },
      ADMIN: {
        label: "Quản trị viên",
        color: "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300",
        icon: <Shield className="h-4 w-4" />,
      },
      STAFF: {
        label: "Nhân viên",
        color:
          "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300",
        icon: <UserCheck className="h-4 w-4" />,
      },
    };
    return roleMap[role || "CUSTOMER"] || roleMap["CUSTOMER"];
  };

  const getStatusDisplay = (status?: string) => {
    const statusMap: { [key: string]: { label: string; color: string } } = {
      ACTIVE: {
        label: "Hoạt động",
        color:
          "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300",
      },
      INACTIVE: {
        label: "Không hoạt động",
        color: "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300",
      },
      SUSPENDED: {
        label: "Tạm khóa",
        color: "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300",
      },
    };
    return statusMap[status || "ACTIVE"] || statusMap["ACTIVE"];
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary/20 border-t-primary mx-auto mb-6"></div>
          <p className="text-foreground text-lg font-medium">
            Đang tải thông tin...
          </p>
          <p className="text-muted-foreground mt-2">
            Vui lòng chờ trong giây lát...
          </p>
        </div>
      </div>
    );
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
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Không tìm thấy thông tin
          </h2>
          <p className="text-muted-foreground text-lg mb-8">
            Vui lòng đăng nhập lại để tiếp tục
          </p>

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
    );
  }

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={staggerContainer}
      className="space-y-6"
    >
      {error && (
        <motion.div
          variants={fadeUp}
          className="p-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-xl flex items-start justify-between"
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
            <div>
              <div className="font-semibold mb-1">Có lỗi xảy ra</div>
              <div className="text-sm opacity-90">{error}</div>
            </div>
          </div>
          <button
            onClick={() => setError("")}
            className="text-destructive/60 hover:text-destructive p-1"
            aria-label="Đóng thông báo lỗi"
          >
            <X className="h-4 w-4" />
          </button>
        </motion.div>
      )}

      {success && (
        <motion.div
          variants={fadeUp}
          className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-400 rounded-xl flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-green-100 dark:bg-green-800 rounded-full">
              <Award className="h-4 w-4" />
            </div>
            <span className="font-medium">{success}</span>
          </div>
          <button
            onClick={() => setSuccess("")}
            className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 p-1"
            aria-label="Đóng thông báo thành công"
          >
            <X className="h-4 w-4" />
          </button>
        </motion.div>
      )}

      <motion.div
        variants={fadeUp}
        className="bg-card rounded-2xl shadow-xl border border-border/50 overflow-hidden"
      >
        <div className="relative h-48">
          <div className="absolute inset-0">
            <img
              src={coverImage}
              alt="Cover"
              className="w-full h-full object-cover"
            />
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
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  console.log("Cover upload:", e.target.files?.[0]);
                }}
              />
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
                    const target = e.target as HTMLImageElement;
                    target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                      user.fullName
                    )}&background=d97706&color=fff&size=112`;
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
                aria-label="Tải lên avatar"
              >
                <Camera className="h-4 w-4" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  disabled={isUploadingAvatar}
                  className="hidden"
                  aria-label="Chọn ảnh avatar"
                />
              </label>
            </div>
          </div>

          <div className="absolute bottom-4 right-6 text-right">
            <div className="bg-black/30 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 text-white dark:text-gray-100">
              <h2 className="text-xl font-bold mb-1">{user.fullName}</h2>
              <div className="flex items-center justify-end gap-2 mb-1">
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium bg-white/20 dark:bg-gray-800/50 backdrop-blur-sm text-white dark:text-gray-100`}
                >
                  {getRoleDisplay(user.role).icon}
                  {getRoleDisplay(user.role).label}
                </span>
              </div>
              <p className="text-white/80 dark:text-gray-300 text-sm">
                {user.email}
              </p>
            </div>
          </div>
        </div>

        <div className="pt-16 p-6">
          <div className="flex items-start justify-between mb-8">
            <div className="space-y-3">
              <div className="flex items-center gap-3 mb-2">
                <div className="flex gap-2">
                  <span
                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
                      getStatusDisplay(user.status).color
                    } shadow-sm`}
                  >
                    {getStatusDisplay(user.status).label}
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                {user.point !== null && user.point !== undefined && (
                  <p className="text-primary flex items-center gap-2 text-base font-medium">
                    <Star className="h-4 w-4" />
                    {user.point} điểm thưởng
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <button
                    onClick={() => {
                      console.log("🟢 Save button clicked!");
                      handleSave();
                    }}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-4 py-2.5 bg-green-600 dark:bg-green-700 text-white rounded-xl hover:bg-green-700 dark:hover:bg-green-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-lg"
                  >
                    <Save className="h-4 w-4" />
                    {isSaving ? "Đang lưu..." : "Lưu"}
                  </button>
                  <button
                    onClick={handleEditToggle}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-4 py-2.5 bg-muted text-foreground rounded-xl hover:bg-muted/80 transition-all duration-200 disabled:opacity-50 font-medium"
                  >
                    <X className="h-4 w-4" />
                    Hủy
                  </button>
                </>
              ) : (
                <button
                  onClick={handleEditToggle}
                  className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all duration-200 font-medium shadow-lg"
                >
                  <Edit3 className="h-4 w-4" />
                  Chỉnh sửa
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Personal Information */}
            <motion.div variants={fadeUp} className="space-y-4">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 bg-primary/10 rounded-xl">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-foreground">
                  Thông tin cá nhân
                </h3>
              </div>

              <div className="space-y-4">
                <div className="bg-muted/30 dark:bg-gray-800/50 p-4 rounded-xl border border-border/50 dark:border-gray-700">
                  <label className="block text-xs font-semibold text-foreground mb-2 uppercase tracking-wide">
                    Họ và tên *
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editForm.fullName}
                      onChange={(e) =>
                        setEditForm({ ...editForm, fullName: e.target.value })
                      }
                      className="w-full px-3 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-card text-foreground placeholder:text-muted-foreground"
                      placeholder="Nhập họ và tên"
                      required
                    />
                  ) : (
                    <p className="font-medium text-foreground">
                      {user.fullName || "Chưa cập nhật"}
                    </p>
                  )}
                </div>

                <div className="bg-muted/30 dark:bg-gray-800/50 p-4 rounded-xl border border-border/50 dark:border-gray-700">
                  <label className="text-xs font-semibold text-foreground mb-2 uppercase tracking-wide flex items-center gap-2">
                    <Phone className="h-3 w-3" />
                    Số điện thoại
                  </label>
                  {isEditing ? (
                    <input
                      type="tel"
                      value={editForm.phone}
                      onChange={(e) =>
                        setEditForm({ ...editForm, phone: e.target.value })
                      }
                      className="w-full px-3 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-card text-foreground placeholder:text-muted-foreground"
                      placeholder="Nhập số điện thoại"
                    />
                  ) : (
                    <p className="font-medium text-foreground">
                      {user.phone || "Chưa cập nhật"}
                    </p>
                  )}
                </div>

                <div className="bg-muted/30 dark:bg-gray-800/50 p-4 rounded-xl border border-border/50 dark:border-gray-700">
                  <label className="text-xs font-semibold text-foreground mb-2 uppercase tracking-wide flex items-center gap-2">
                    <Calendar className="h-3 w-3" />
                    Ngày sinh
                  </label>
                  {isEditing ? (
                    <input
                      type="date"
                      value={editForm.birthday}
                      onChange={(e) =>
                        setEditForm({ ...editForm, birthday: e.target.value })
                      }
                      className="w-full px-3 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-card text-foreground placeholder:text-muted-foreground"
                      aria-label="Ngày sinh"
                      title="Chọn ngày sinh"
                    />
                  ) : (
                    <p className="font-medium text-foreground">
                      {formatDate(user.birthday)}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-muted/30 dark:bg-gray-800/50 p-4 rounded-xl border border-border/50 dark:border-gray-700">
                    <label className="block text-xs font-semibold text-foreground mb-2 uppercase tracking-wide">
                      Giới tính
                    </label>
                    {isEditing ? (
                      <select
                        value={editForm.gender ? "true" : "false"}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            gender: e.target.value === "true",
                          })
                        }
                        className="w-full px-3 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-card text-foreground [&>option]:bg-card [&>option]:text-foreground"
                        aria-label="Giới tính"
                        title="Chọn giới tính"
                      >
                        <option value="false">Nữ</option>
                        <option value="true">Nam</option>
                      </select>
                    ) : (
                      <p className="font-medium text-foreground">
                        {user.gender ? "Nam" : "Nữ"}
                      </p>
                    )}
                  </div>

                  <div className="bg-muted/30 dark:bg-gray-800/50 p-4 rounded-xl border border-border/50 dark:border-gray-700">
                    <label className="text-xs font-semibold text-foreground mb-2 uppercase tracking-wide flex items-center gap-2">
                      <CreditCard className="h-3 w-3" />
                      CCCD
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm.cccd}
                        onChange={(e) =>
                          setEditForm({ ...editForm, cccd: e.target.value })
                        }
                        className="w-full px-3 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-card text-foreground placeholder:text-muted-foreground"
                        placeholder="12 số"
                        maxLength={12}
                      />
                    ) : (
                      <p className="font-medium text-foreground">
                        {user.cccd || "Chưa cập nhật"}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Contact Information */}
            <motion.div variants={fadeUp} className="space-y-4">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 bg-secondary/10 rounded-xl">
                  <Mail className="h-5 w-5 text-secondary" />
                </div>
                <h3 className="text-xl font-bold text-foreground">
                  Thông tin liên hệ
                </h3>
              </div>

              <div className="space-y-4">
                <div className="bg-muted/30 dark:bg-gray-800/50 p-4 rounded-xl border border-border/50 dark:border-gray-700">
                  <label className="block text-xs font-semibold text-foreground mb-2 uppercase tracking-wide">
                    Email
                  </label>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-primary" />
                    <span className="font-medium text-foreground">
                      {user.email}
                    </span>
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                      Không thể thay đổi
                    </span>
                  </div>
                </div>

                <div className="bg-muted/30 dark:bg-gray-800/50 p-4 rounded-xl border border-border/50 dark:border-gray-700">
                  <label className="text-xs font-semibold text-foreground mb-2 uppercase tracking-wide flex items-center gap-2">
                    <MapPin className="h-3 w-3" />
                    Địa chỉ
                  </label>
                  <p className="font-medium text-foreground whitespace-pre-wrap min-h-[60px] leading-relaxed">
                    {defaultAddress
                      ? addressService.formatAddress(defaultAddress)
                      : user.address || "Chưa cập nhật"}
                  </p>
                  {!isEditing && (
                    <p className="text-xs text-muted-foreground mt-2 italic">
                      Quản lý địa chỉ tại trang Địa chỉ
                    </p>
                  )}
                </div>

                <div className="bg-primary/5 border border-primary/20 p-4 rounded-xl">
                  <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Shield className="h-4 w-4 text-primary" />
                    Thông tin tài khoản
                  </h4>
                  <div className="space-y-1 text-sm">
                    <p className="text-muted-foreground">
                      <span className="font-medium">Cập nhật lần cuối:</span>{" "}
                      {formatDate(user.updatedAt)}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          <motion.div
            variants={fadeUp}
            className="mt-12 pt-6 border-t border-border"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 bg-accent/10 rounded-xl">
                <Settings className="h-5 w-5 text-accent" />
              </div>
              <h3 className="text-xl font-bold text-foreground">
                Cài đặt tài khoản
              </h3>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => (window.location.href = "/change-password")}
                className="flex items-center gap-2 px-4 py-3 border border-border rounded-xl hover:bg-muted/50 transition-all duration-200 font-medium shadow-sm text-foreground"
              >
                <Lock className="h-4 w-4 text-primary" />
                <span>Đổi mật khẩu</span>
              </button>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
}
