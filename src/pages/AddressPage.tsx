/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";


import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { userService } from "@/service/userService";
import axios from "axios";
import {
  MapPin,
  Plus,
  Edit3,
  Trash2,
  Save,
  X,
  User,
  Phone,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Star,
  MapIcon,
  Clock,
  TrendingUp,
} from "lucide-react";
import { authService } from "@/service/authService";
import { addressService, type Address } from "@/service/addressService";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix Leaflet icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Animation variants
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const slideIn = {
  hidden: { opacity: 0, x: -20 },
  show: { opacity: 1, x: 0, transition: { duration: 0.3 } },
  exit: { opacity: 0, x: 20, transition: { duration: 0.2 } },
};

// Interfaces
interface Province {
  code: number;
  name: string;
  districts: District[];
}

interface District {
  code: number;
  name: string;
  wards: Ward[];
}

interface Ward {
  code: number;
  name: string;
}

interface Toast {
  id: string;
  type: "success" | "error" | "warning" | "info";
  message: string;
  duration?: number;
}

interface LoadingState {
  fetch: boolean;
  create: boolean;
  update: boolean;
  delete: boolean;
}

const TOAST_DURATION = 5000;

// Map Components
function LocationMarker({
  onSelect,
  position,
}: {
  onSelect: (lat: number, lng: number) => void;
  position: [number, number];
}) {
  useMapEvents({
    click(e) {
      onSelect(e.latlng.lat, e.latlng.lng);
    },
  });

  return <Marker position={position} />;
}

function RecenterMap({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    if (lat && lng) {
      map.setView([lat, lng], 15);
    }
  }, [lat, lng, map]);
  return null;
}

export default function AddressPage() {
  // Core state
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [filteredAddresses, setFilteredAddresses] = useState<Address[]>([]);

  // UI state
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Loading states
  const [loading, setLoading] = useState<LoadingState>({
    fetch: true,
    create: false,
    update: false,
    delete: false,
  });

  // Search state
  const [searchKeyword, setSearchKeyword] = useState("");

  // Form state
  const [createForm, setCreateForm] = useState({
    name: "",
    phone: "",
    city: "",
    district: "",
    ward: "",
    street: "",
    addressLine: "",
    isDefault: false,
    latitude: 21.0278,
    longitude: 105.8342,
  });

  const [editForm, setEditForm] = useState({
    name: "",
    phone: "",
    city: "",
    district: "",
    ward: "",
    street: "",
    addressLine: "",
    isDefault: false,
    latitude: 21.0278,
    longitude: 105.8342,
  });

  // Province/District/Ward data
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [selectedProvince, setSelectedProvince] = useState<Province | null>(
    null
  );
  const [selectedDistrict, setSelectedDistrict] = useState<District | null>(
    null
  );
  const [selectedWard, setSelectedWard] = useState<Ward | null>(null);

  // Edit mode province/district/ward
  const [editProvince, setEditProvince] = useState<Province | null>(null);
  const [editDistrict, setEditDistrict] = useState<District | null>(null);
  const [editWard, setEditWard] = useState<Ward | null>(null);

  // Toast management
  const showToast = useCallback(
    (type: Toast["type"], message: string, duration = TOAST_DURATION) => {
      const id = `${Date.now()}-${Math.random()}`;
      const toast: Toast = { id, type, message, duration };

      setToasts((prev) => [...prev, toast]);

      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    },
    []
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Loading state helpers
  const setLoadingState = useCallback(
    (key: keyof LoadingState, value: boolean) => {
      setLoading((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  // Memoized filtered addresses
  const memoizedFilteredAddresses = useMemo(() => {
    let filtered = [...addresses];

    if (searchKeyword.trim()) {
      filtered = addressService.filterAddressesByKeyword(
        filtered,
        searchKeyword
      );
    }

    return filtered;
  }, [addresses, searchKeyword]);

  useEffect(() => {
    setFilteredAddresses(memoizedFilteredAddresses);
  }, [memoizedFilteredAddresses]);

  // Fetch functions
  const fetchAddresses = useCallback(async () => {
    try {
      setLoadingState("fetch", true);

      const profile = await authService.getProfile();
      const userId = profile?.id || authService.getUserId();

      if (!userId) {
        throw new Error("Không tìm thấy userId");
      }

      const response = await addressService.getAddressesByUserId(userId);

      if (response?.data && Array.isArray(response.data)) {
        setAddresses(response.data);
        showToast("success", `Đã tải ${response.data.length} địa chỉ`, 2000);
      } else {
        setAddresses([]);
        showToast("warning", "Không có dữ liệu địa chỉ");
      }
    } catch (error: any) {
      console.error("Fetch addresses error:", error);
      if (error.message?.includes("đăng nhập")) {
        authService.logout(false); // false = giữ remember me (token hết hạn tự động)
        window.location.href = "/login";
        return;
      }
      showToast("error", error.message || "Không thể tải danh sách địa chỉ");
      setAddresses([]);
    } finally {
      setLoadingState("fetch", false);
    }
  }, [setLoadingState, showToast]);

  // Initialize component
  useEffect(() => {
    const isAuth = authService.isAuthenticated();
    if (!isAuth) {
      window.location.href = "/login";
      return;
    }

    // Load provinces data
    axios
      .get("https://provinces.open-api.vn/api/?depth=3")
      .then((res) => {
        setProvinces(res.data);
      })
      .catch((err) => {
        console.error("Failed to load provinces:", err);
        showToast("error", "Không thể tải dữ liệu tỉnh/thành phố");
      });

    fetchAddresses();
  }, [fetchAddresses, showToast]);

  // Geocode address helper
  const geocodeAddress = useCallback(
    async (city?: string, district?: string, ward?: string) => {
      if (!city) return;

      const clean = (s: string) =>
        s
          .replace(/^(Thành phố|Quận|Huyện|Thị xã|Phường|Xã|Thị trấn)\s+/g, "")
          .trim();

      let query = "";
      if (city && district && ward) {
        query = `${clean(ward)}, ${clean(district)}, ${clean(city)}, Việt Nam`;
      } else if (city && district) {
        query = `${clean(district)}, ${clean(city)}, Việt Nam`;
      } else if (city) {
        query = `${clean(city)}, Việt Nam`;
      }

      if (!query) return;

      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            query
          )}&countrycodes=VN&limit=1`
        );
        const data = await res.json();
        if (data.length > 0) {
          const lat = parseFloat(data[0].lat);
          const lng = parseFloat(data[0].lon);

          if (isCreating) {
            setCreateForm((prev) => ({
              ...prev,
              latitude: lat,
              longitude: lng,
            }));
          } else if (editingId) {
            setEditForm((prev) => ({ ...prev, latitude: lat, longitude: lng }));
          }
        }
      } catch (e) {
        console.error("Lỗi geocode:", e);
      }
    },
    [isCreating, editingId]
  );

  // Form helpers
  const resetCreateForm = useCallback(() => {
    setCreateForm({
      name: "",
      phone: "",
      city: "",
      district: "",
      ward: "",
      street: "",
      addressLine: "",
      isDefault: false,
      latitude: 21.0278,
      longitude: 105.8342,
    });
    setSelectedProvince(null);
    setSelectedDistrict(null);
    setSelectedWard(null);
  }, []);

  // CRUD operations
  const handleCreate = useCallback(async () => {
    if (
      !createForm.name.trim() ||
      !createForm.phone.trim() ||
      !createForm.addressLine.trim()
    ) {
      showToast("error", "Vui lòng điền đầy đủ thông tin bắt buộc");
      return;
    }

    try {
      setLoadingState("create", true);
      const profile = await authService.getProfile();
      const userId = profile?.id || authService.getUserId();

      const response = await addressService.createAddress({
        ...createForm,
        userId: userId || undefined,
      });

      if (response?.data) {
        await fetchAddresses();
        resetCreateForm();
        setIsCreating(false);
        showToast("success", "Thêm địa chỉ thành công!");
      }
    } catch (error: any) {
      showToast("error", error.message || "Thêm địa chỉ thất bại");
    } finally {
      setLoadingState("create", false);
    }
  }, [createForm, setLoadingState, showToast, fetchAddresses, resetCreateForm]);

  const handleEdit = useCallback(
    (address: Address) => {
      if (!address?.id) {
        showToast("error", "Thông tin địa chỉ không hợp lệ");
        return;
      }

      setEditingId(address.id);
      setEditForm({
        name: address.name || "",
        phone: address.phone || "",
        city: address.city || "",
        district: address.district || "",
        ward: address.ward || "",
        street: address.street || "",
        addressLine: address.addressLine || "",
        isDefault: Boolean(address.isDefault),
        latitude: 21.0278,
        longitude: 105.8342,
      });

      // Set edit provinces/districts/wards
      const prov = provinces.find((p) => p.name === address.city);
      setEditProvince(prov || null);

      if (prov) {
        const dist = prov.districts.find((d) => d.name === address.district);
        setEditDistrict(dist || null);

        if (dist) {
          const ward = dist.wards.find((w) => w.name === address.ward);
          setEditWard(ward || null);
        }
      }
    },
    [provinces, showToast]
  );

  const handleUpdate = useCallback(async () => {
    if (!editingId) return;

    if (
      !editForm.name.trim() ||
      !editForm.phone.trim() ||
      !editForm.addressLine.trim()
    ) {
      showToast("error", "Vui lòng điền đầy đủ thông tin bắt buộc");
      return;
    }

    try {
      setLoadingState("update", true);

      const profile = await authService.getProfile();
      const userId = profile?.id || authService.getUserId();

      const response = await addressService.updateAddress(editingId, {
        ...editForm,
        userId: userId || undefined,
      });

      if (response?.data) {
        await fetchAddresses();
        setEditingId(null);
        showToast("success", "Cập nhật địa chỉ thành công!");
      }
    } catch (error: any) {
      showToast("error", error.message || "Cập nhật địa chỉ thất bại");
    } finally {
      setLoadingState("update", false);
    }
  }, [editingId, editForm, setLoadingState, showToast, fetchAddresses]);

  const handleDelete = useCallback(
    async (id: number) => {
      if (!confirm("Bạn có chắc chắn muốn xóa địa chỉ này?")) return;

      try {
        setLoadingState("delete", true);

        await addressService.deleteAddress(id);
        await fetchAddresses();
        showToast("success", "Xóa địa chỉ thành công!");
      } catch (error: any) {
        showToast("error", error.message || "Xóa địa chỉ thất bại");
      } finally {
        setLoadingState("delete", false);
      }
    },
    [setLoadingState, showToast, fetchAddresses]
  );

  const handleSetDefault = useCallback(
    async (id: number) => {
      try {
        setLoadingState("update", true);

        const response = await addressService.setDefaultAddress(id);

        if (response?.data) {
          const defaultAddress = response.data;
          const formattedAddress = addressService.formatAddress(defaultAddress);

          try {
            const profile = await authService.getProfile();
            // cast payload to any because UpdateProfilePayload doesn't include 'address'
            await userService.updateProfile({
              fullName: profile?.fullName || "",
              address: formattedAddress,
            } as any);
            showToast("success", "Đã đặt làm địa chỉ mặc định!");
          } catch (error) {
            showToast("warning", "Đã đặt mặc định nhưng chưa cập nhật profile");
          }
        }

        await fetchAddresses();
      } catch (error: any) {
        showToast("error", error.message || "Đặt địa chỉ mặc định thất bại");
      } finally {
        setLoadingState("update", false);
      }
    },
    [setLoadingState, showToast, fetchAddresses]
  );

  const formatAddress = useCallback((address: Address) => {
    if (!address) return "";
    return addressService.formatAddress(address);
  }, []);

  const handleRefresh = useCallback(async () => {
    await fetchAddresses();
  }, [fetchAddresses]);

  const handleCancelCreate = useCallback(() => {
    setIsCreating(false);
    resetCreateForm();
  }, [resetCreateForm]);

  const handleCancelEdit = useCallback(() => {
    setEditingId(null);
  }, []);

  // Toast component
  const ToastContainer = () => (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            variants={slideIn}
            initial="hidden"
            animate="show"
            exit="exit"
            className={`max-w-sm p-4 rounded-lg shadow-lg border flex items-start gap-3 ${
              toast.type === "success"
                ? "bg-green-50 border-green-200 text-green-800"
                : toast.type === "error"
                ? "bg-red-50 border-red-200 text-red-800"
                : toast.type === "warning"
                ? "bg-yellow-50 border-yellow-200 text-yellow-800"
                : "bg-blue-50 border-blue-200 text-blue-800"
            }`}
          >
            <div className="shrink-0 mt-0.5">
              {toast.type === "success" && <CheckCircle className="h-4 w-4" />}
              {toast.type === "error" && <AlertCircle className="h-4 w-4" />}
              {toast.type === "warning" && <AlertCircle className="h-4 w-4" />}
              {toast.type === "info" && <AlertCircle className="h-4 w-4" />}
            </div>
            <div className="flex-1 text-sm font-medium">{toast.message}</div>
            <button
              onClick={() => removeToast(toast.id)}
              className="shrink-0 p-1 hover:opacity-70 transition-opacity"
            >
              <X className="h-3 w-3" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );

  if (loading.fetch) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary/20 border-t-primary mx-auto mb-6"></div>
          <p className="text-foreground text-lg font-medium">
            Đang tải danh sách địa chỉ...
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <ToastContainer />

      <motion.div
        initial="hidden"
        animate="show"
        variants={staggerContainer}
        className="space-y-6"
      >
        {/* Header */}
        <motion.div variants={fadeUp} className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-primary/10 rounded-2xl">
              <MapPin className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-4xl font-bold text-foreground">
              Địa chỉ giao hàng
            </h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Quản lý địa chỉ giao hàng của bạn
          </p>
        </motion.div>

        {/* Toolbar */}
        <motion.div
          variants={fadeUp}
          className="bg-white rounded-2xl shadow-lg border border-gray-200 p-4"
        >
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <MapIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  placeholder="Tìm kiếm theo tên, số điện thoại, địa chỉ..."
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleRefresh}
                disabled={loading.fetch}
                className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                <RefreshCw
                  className={`h-4 w-4 ${loading.fetch ? "animate-spin" : ""}`}
                />
                <span className="hidden sm:inline">Làm mới</span>
              </button>
            </div>
          </div>
        </motion.div>

        {/* Add New Address Button */}
        {!isCreating && (
          <motion.div variants={fadeUp} className="text-center">
            <button
              onClick={() => setIsCreating(true)}
              disabled={loading.create}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200 font-medium shadow-lg disabled:opacity-50"
            >
              <Plus className="h-5 w-5" />
              Thêm địa chỉ mới
            </button>
          </motion.div>
        )}

        {/* Create Form */}
        <AnimatePresence>
          {isCreating && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <Plus className="h-6 w-6 text-blue-600" />
                  Thêm địa chỉ mới
                </h3>
                <button
                  onClick={handleCancelCreate}
                  disabled={loading.create}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Họ và tên *
                  </label>
                  <input
                    type="text"
                    value={createForm.name}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, name: e.target.value })
                    }
                    disabled={loading.create}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                    placeholder="Nhập họ và tên"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Số điện thoại *
                  </label>
                  <input
                    type="tel"
                    value={createForm.phone}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, phone: e.target.value })
                    }
                    disabled={loading.create}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                    placeholder="Nhập số điện thoại"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Tỉnh/Thành phố *
                  </label>
                  <select
                    value={selectedProvince?.code || ""}
                    onChange={(e) => {
                      const prov = provinces.find(
                        (p) => p.code === Number(e.target.value)
                      );
                      setSelectedProvince(prov || null);
                      setSelectedDistrict(null);
                      setSelectedWard(null);
                      if (prov) {
                        setCreateForm({
                          ...createForm,
                          city: prov.name,
                          district: "",
                          ward: "",
                        });
                      }
                    }}
                    disabled={loading.create}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                  >
                    <option value="">-- Chọn tỉnh/thành --</option>
                    {provinces.map((p) => (
                      <option key={p.code} value={p.code}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Quận/Huyện *
                  </label>
                  <select
                    value={selectedDistrict?.code || ""}
                    onChange={(e) => {
                      const dist = selectedProvince?.districts.find(
                        (d) => d.code === Number(e.target.value)
                      );
                      setSelectedDistrict(dist || null);
                      setSelectedWard(null);
                      if (dist) {
                        setCreateForm({
                          ...createForm,
                          district: dist.name,
                          ward: "",
                        });
                      }
                    }}
                    disabled={loading.create || !selectedProvince}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                  >
                    <option value="">-- Chọn quận/huyện --</option>
                    {selectedProvince?.districts.map((d) => (
                      <option key={d.code} value={d.code}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Phường/Xã *
                  </label>
                  <select
                    value={selectedWard?.code || ""}
                    onChange={(e) => {
                      const ward = selectedDistrict?.wards.find(
                        (w) => w.code === Number(e.target.value)
                      );
                      setSelectedWard(ward || null);
                      if (ward) {
                        setCreateForm({ ...createForm, ward: ward.name });
                        geocodeAddress(
                          selectedProvince?.name,
                          selectedDistrict?.name,
                          ward.name
                        );
                      }
                    }}
                    disabled={loading.create || !selectedDistrict}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                  >
                    <option value="">-- Chọn phường/xã --</option>
                    {selectedDistrict?.wards.map((w) => (
                      <option key={w.code} value={w.code}>
                        {w.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Đường/Phố
                  </label>
                  <input
                    type="text"
                    value={createForm.street}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, street: e.target.value })
                    }
                    disabled={loading.create}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                    placeholder="Nhập tên đường/phố"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Địa chỉ chi tiết *
                </label>
                <textarea
                  value={createForm.addressLine}
                  onChange={(e) =>
                    setCreateForm({
                      ...createForm,
                      addressLine: e.target.value,
                    })
                  }
                  rows={3}
                  disabled={loading.create}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none disabled:opacity-50"
                  placeholder="Số nhà, tên đường, khu vực..."
                />
              </div>

              {/* Map */}
              <div className="mt-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Vị trí bản đồ
                </label>
                <div className="w-full h-72 rounded-lg border border-gray-200 overflow-hidden">
                  <MapContainer
                    center={[createForm.latitude, createForm.longitude]}
                    zoom={15}
                    scrollWheelZoom
                    style={{ height: "100%", width: "100%" }}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <RecenterMap
                      lat={createForm.latitude}
                      lng={createForm.longitude}
                    />
                    <LocationMarker
                      position={[createForm.latitude, createForm.longitude]}
                      onSelect={(lat, lng) => {
                        setCreateForm({
                          ...createForm,
                          latitude: lat,
                          longitude: lng,
                        });
                      }}
                    />
                  </MapContainer>
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  Click vào bản đồ để chọn vị trí chính xác. Tọa độ:{" "}
                  {createForm.latitude.toFixed(6)},{" "}
                  {createForm.longitude.toFixed(6)}
                </p>
              </div>

              <div className="mt-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={createForm.isDefault}
                    onChange={(e) =>
                      setCreateForm({
                        ...createForm,
                        isDefault: e.target.checked,
                      })
                    }
                    disabled={loading.create}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Đặt làm địa chỉ mặc định
                  </span>
                </label>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleCreate}
                  disabled={loading.create}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200 font-medium disabled:opacity-50"
                >
                  {loading.create ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Đang lưu...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Lưu địa chỉ
                    </>
                  )}
                </button>
                <button
                  onClick={handleCancelCreate}
                  disabled={loading.create}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all duration-200 font-medium disabled:opacity-50"
                >
                  <X className="h-4 w-4" />
                  Hủy
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Address List */}
        <motion.div variants={fadeUp} className="space-y-4">
          {filteredAddresses.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl shadow-lg border border-gray-200">
              <MapIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {searchKeyword
                  ? "Không tìm thấy địa chỉ nào"
                  : "Chưa có địa chỉ nào"}
              </h3>
              <p className="text-gray-600 mb-4">
                {searchKeyword
                  ? "Thử thay đổi từ khóa tìm kiếm"
                  : "Thêm địa chỉ giao hàng để thuận tiện cho việc mua sắm"}
              </p>
              {!isCreating && !searchKeyword && (
                <button
                  onClick={() => setIsCreating(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  Thêm địa chỉ đầu tiên
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <AnimatePresence>
                {filteredAddresses.map((address) => (
                  <motion.div
                    key={address.id}
                    variants={fadeUp}
                    initial="hidden"
                    animate="show"
                    exit="exit"
                    layout
                    className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all duration-200"
                  >
                    {editingId === address.id ? (
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                            <Edit3 className="h-5 w-5 text-blue-600" />
                            Chỉnh sửa địa chỉ
                          </h4>
                          <button
                            onClick={handleCancelEdit}
                            disabled={loading.update}
                            className="p-1 hover:bg-gray-100 rounded transition-colors disabled:opacity-50"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                              Họ và tên *
                            </label>
                            <input
                              type="text"
                              value={editForm.name}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  name: e.target.value,
                                })
                              }
                              disabled={loading.update}
                              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                              Số điện thoại *
                            </label>
                            <input
                              type="tel"
                              value={editForm.phone}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  phone: e.target.value,
                                })
                              }
                              disabled={loading.update}
                              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                              Tỉnh/Thành phố *
                            </label>
                            <select
                              value={editProvince?.code || ""}
                              onChange={(e) => {
                                const prov = provinces.find(
                                  (p) => p.code === Number(e.target.value)
                                );
                                setEditProvince(prov || null);
                                setEditDistrict(null);
                                setEditWard(null);
                                if (prov) {
                                  setEditForm({
                                    ...editForm,
                                    city: prov.name,
                                    district: "",
                                    ward: "",
                                  });
                                }
                              }}
                              disabled={loading.update}
                              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                            >
                              <option value="">-- Chọn tỉnh/thành --</option>
                              {provinces.map((p) => (
                                <option key={p.code} value={p.code}>
                                  {p.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                              Quận/Huyện *
                            </label>
                            <select
                              value={editDistrict?.code || ""}
                              onChange={(e) => {
                                const dist = editProvince?.districts.find(
                                  (d) => d.code === Number(e.target.value)
                                );
                                setEditDistrict(dist || null);
                                setEditWard(null);
                                if (dist) {
                                  setEditForm({
                                    ...editForm,
                                    district: dist.name,
                                    ward: "",
                                  });
                                }
                              }}
                              disabled={loading.update || !editProvince}
                              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                            >
                              <option value="">-- Chọn quận/huyện --</option>
                              {editProvince?.districts.map((d) => (
                                <option key={d.code} value={d.code}>
                                  {d.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                              Phường/Xã *
                            </label>
                            <select
                              value={editWard?.code || ""}
                              onChange={(e) => {
                                const ward = editDistrict?.wards.find(
                                  (w) => w.code === Number(e.target.value)
                                );
                                setEditWard(ward || null);
                                if (ward) {
                                  setEditForm({ ...editForm, ward: ward.name });
                                  geocodeAddress(
                                    editProvince?.name,
                                    editDistrict?.name,
                                    ward.name
                                  );
                                }
                              }}
                              disabled={loading.update || !editDistrict}
                              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                            >
                              <option value="">-- Chọn phường/xã --</option>
                              {editDistrict?.wards.map((w) => (
                                <option key={w.code} value={w.code}>
                                  {w.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                              Đường/Phố
                            </label>
                            <input
                              type="text"
                              value={editForm.street}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  street: e.target.value,
                                })
                              }
                              disabled={loading.update}
                              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                            />
                          </div>
                        </div>

                        <div className="mt-4">
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Địa chỉ chi tiết *
                          </label>
                          <textarea
                            value={editForm.addressLine}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                addressLine: e.target.value,
                              })
                            }
                            rows={3}
                            disabled={loading.update}
                            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none disabled:opacity-50"
                          />
                        </div>

                        {/* Edit Map */}
                        <div className="mt-4">
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Vị trí bản đồ
                          </label>
                          <div className="w-full h-72 rounded-lg border border-gray-200 overflow-hidden">
                            <MapContainer
                              center={[editForm.latitude, editForm.longitude]}
                              zoom={15}
                              scrollWheelZoom
                              style={{ height: "100%", width: "100%" }}
                            >
                              <TileLayer
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                              />
                              <RecenterMap
                                lat={editForm.latitude}
                                lng={editForm.longitude}
                              />
                              <LocationMarker
                                position={[
                                  editForm.latitude,
                                  editForm.longitude,
                                ]}
                                onSelect={(lat, lng) => {
                                  setEditForm({
                                    ...editForm,
                                    latitude: lat,
                                    longitude: lng,
                                  });
                                }}
                              />
                            </MapContainer>
                          </div>
                          <p className="mt-2 text-xs text-gray-500">
                            Click vào bản đồ để chọn vị trí chính xác. Tọa độ:{" "}
                            {editForm.latitude.toFixed(6)},{" "}
                            {editForm.longitude.toFixed(6)}
                          </p>
                        </div>

                        <div className="mt-4">
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={editForm.isDefault}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  isDefault: e.target.checked,
                                })
                              }
                              disabled={loading.update}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                            />
                            <span className="text-sm font-medium text-gray-700">
                              Đặt làm địa chỉ mặc định
                            </span>
                          </label>
                        </div>

                        <div className="flex gap-3 mt-4">
                          <button
                            onClick={handleUpdate}
                            disabled={loading.update}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200 font-medium disabled:opacity-50"
                          >
                            {loading.update ? (
                              <>
                                <RefreshCw className="h-4 w-4 animate-spin" />
                                Đang cập nhật...
                              </>
                            ) : (
                              <>
                                <Save className="h-4 w-4" />
                                Cập nhật
                              </>
                            )}
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            disabled={loading.update}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all duration-200 font-medium disabled:opacity-50"
                          >
                            <X className="h-4 w-4" />
                            Hủy
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                <User className="h-5 w-5 text-blue-600" />
                                {address.name}
                              </h4>
                              {address.isDefault && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-100 text-blue-600 text-xs font-medium rounded-full">
                                  <Star className="h-3 w-3 fill-current" />
                                  Mặc định
                                </span>
                              )}
                            </div>
                            <div className="space-y-2 text-gray-600">
                              <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4" />
                                <span>{address.phone}</span>
                              </div>
                              <div className="flex items-start gap-2">
                                <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                                <span className="text-sm">
                                  {formatAddress(address)}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            {!address.isDefault && (
                              <button
                                onClick={() => handleSetDefault(address.id)}
                                disabled={loading.update}
                                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 disabled:opacity-50"
                                title="Đặt làm mặc định"
                              >
                                <Star className="h-4 w-4" />
                              </button>
                            )}
                            <button
                              onClick={() => handleEdit(address)}
                              disabled={loading.update}
                              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 disabled:opacity-50"
                              title="Chỉnh sửa"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(address.id)}
                              disabled={loading.delete}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 disabled:opacity-50"
                              title="Xóa"
                            >
                              {loading.delete ? (
                                <RefreshCw className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </div>

                        <div className="pt-4 border-t border-gray-200">
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <div className="flex items-center gap-2">
                              <Clock className="h-3 w-3" />
                              <span>
                                Tạo:{" "}
                                {new Date(address.createdAt).toLocaleDateString(
                                  "vi-VN"
                                )}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <TrendingUp className="h-3 w-3" />
                              <span>
                                Cập nhật:{" "}
                                {new Date(address.updatedAt).toLocaleDateString(
                                  "vi-VN"
                                )}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      </motion.div>
    </>
  );
}
