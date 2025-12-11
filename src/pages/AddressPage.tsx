/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  Search,
  Loader2,
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

// --- Leaflet Icon Fix ---
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// --- Animations ---
const modalVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.1 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
};

// --- Interfaces ---
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
}

interface AddressFormData {
  id?: number;
  name: string;
  phone: string;
  city: string;
  district: string;
  ward: string;
  street: string;
  addressLine: string;
  isDefault: boolean;
  latitude: number;
  longitude: number;
}

const DEFAULT_FORM_DATA: AddressFormData = {
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
};

// --- Map Components ---
// Marker cho phép click để chọn vị trí
const LocationMarker = ({
  position,
  onSelect,
}: {
  position: [number, number];
  onSelect: (lat: number, lng: number) => void;
}) => {
  useMapEvents({
    click(e) {
      onSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return <Marker position={position} />;
};

// Component để di chuyển bản đồ khi tọa độ thay đổi
const RecenterMap = ({ lat, lng }: { lat: number; lng: number }) => {
  const map = useMap();
  useEffect(() => {
    if (lat && lng) {
      map.setView([lat, lng], 15, { animate: true });
    }
  }, [lat, lng, map]);
  return null;
};

// --- Main Component ---
export default function AddressPage() {
  // Data State
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [filteredAddresses, setFilteredAddresses] = useState<Address[]>([]);
  const [provinces, setProvinces] = useState<Province[]>([]);

  // UI State
  const [searchKeyword, setSearchKeyword] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Form State
  const [formData, setFormData] = useState<AddressFormData>(DEFAULT_FORM_DATA);
  const [selectedProvince, setSelectedProvince] = useState<Province | null>(
    null
  );
  const [selectedDistrict, setSelectedDistrict] = useState<District | null>(
    null
  );
  const [selectedWard, setSelectedWard] = useState<Ward | null>(null);

  // --- Toast Logic ---
  const showToast = useCallback((type: Toast["type"], message: string) => {
    const id = Math.random().toString(36).substring(7);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(
      () => setToasts((prev) => prev.filter((t) => t.id !== id)),
      4000
    );
  }, []);

  // --- Helper: Format Address ---
  const formatAddress = useCallback((addr: Address) => {
    return addressService.formatAddress(addr);
  }, []);

  // --- Data Fetching ---
  const fetchAddresses = useCallback(async () => {
    try {
      setLoading(true);
      const profile = await authService.getProfile();
      const userId = profile?.id || authService.getUserId();
      if (!userId) throw new Error("Vui lòng đăng nhập lại");

      const response = await addressService.getAddressesByUserId(userId);
      setAddresses(response?.data || []);
    } catch (error: any) {
      console.error(error);
      setAddresses([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      window.location.href = "/login";
      return;
    }

    // Load Provinces
    axios
      .get("https://provinces.open-api.vn/api/?depth=3")
      .then((res) => setProvinces(res.data))
      .catch(() => showToast("error", "Không thể tải dữ liệu hành chính"));

    fetchAddresses();
  }, [fetchAddresses, showToast]);

  // --- Filtering & Sorting ---
  useEffect(() => {
    let result = [...addresses];

    // 1. Lọc theo từ khóa
    if (searchKeyword.trim()) {
      result = addressService.filterAddressesByKeyword(result, searchKeyword);
    }

    // 2. Sắp xếp: Địa chỉ mặc định (isDefault = true) lên đầu
    result.sort((a, b) => {
      if (a.isDefault === b.isDefault) return 0;
      return a.isDefault ? -1 : 1;
    });

    setFilteredAddresses(result);
  }, [searchKeyword, addresses]);

  // --- Geocoding Logic (Sync Map) ---
  const handleGeocode = useCallback(
    async (
      city?: string,
      district?: string,
      ward?: string,
      street?: string
    ) => {
      const clean = (s: string) =>
        s
          .replace(/^(Thành phố|Quận|Huyện|Thị xã|Phường|Xã|Thị trấn)\s+/g, "")
          .trim();

      let query = "";
      if (street && city && district && ward) {
        query = `${street}, ${clean(ward)}, ${clean(district)}, ${clean(
          city
        )}, Việt Nam`;
      } else if (city && district && ward) {
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
          setFormData((prev) => ({
            ...prev,
            latitude: parseFloat(data[0].lat),
            longitude: parseFloat(data[0].lon),
          }));
        }
      } catch (e) {
        console.error("Geocode error", e);
      }
    },
    []
  );

  // --- Form Handlers ---
  const openCreateModal = () => {
    setFormData(DEFAULT_FORM_DATA);
    setSelectedProvince(null);
    setSelectedDistrict(null);
    setSelectedWard(null);
    setIsModalOpen(true);
  };

  const openEditModal = (address: Address) => {
    const prov = provinces.find((p) => p.name === address.city);
    const dist = prov?.districts.find((d) => d.name === address.district);
    const ward = dist?.wards.find((w) => w.name === address.ward);

    setSelectedProvince(prov || null);
    setSelectedDistrict(dist || null);
    setSelectedWard(ward || null);

    setFormData({
      id: address.id,
      name: address.name,
      phone: address.phone,
      city: address.city || "",
      district: address.district || "",
      ward: address.ward || "",
      street: address.street || "",
      addressLine: address.addressLine,
      isDefault: Boolean(address.isDefault),
      latitude: address.latitude || 21.0278,
      longitude: address.longitude || 105.8342,
    });

    setIsModalOpen(true);
  };

  const handleFormSubmit = async () => {
    const { name, phone, addressLine, city, district, ward } = formData;
    if (!name || !phone || !addressLine || !city || !district || !ward) {
      showToast("error", "Vui lòng điền đầy đủ các trường bắt buộc (*)");
      return;
    }

    try {
      setLoading(true);
      const profile = await authService.getProfile();
      const userId = profile?.id || authService.getUserId();

      if (formData.id) {
        // Update
        await addressService.updateAddress(formData.id, {
          ...formData,
          userId: userId || undefined,
        });
        showToast("success", "Cập nhật địa chỉ thành công");
      } else {
        // Create
        await addressService.createAddress({
          ...formData,
          userId: userId || undefined,
        });
        showToast("success", "Thêm địa chỉ mới thành công");
      }

      await fetchAddresses();
      setIsModalOpen(false);
    } catch (error: any) {
      showToast("error", error.message || "Có lỗi xảy ra khi lưu địa chỉ");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Bạn có chắc chắn muốn xóa địa chỉ này?")) return;
    try {
      setLoading(true);
      await addressService.deleteAddress(id);
      showToast("success", "Đã xóa địa chỉ");
      await fetchAddresses();
    } catch (error: any) {
      showToast("error", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 p-4 md:p-8">
      {/* --- Toast Notifications --- */}
      <div className="fixed top-6 right-6 z-9999 space-y-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border backdrop-blur-md min-w-[300px] ${
                toast.type === "success"
                  ? "bg-green-50/90 border-green-200 text-green-700"
                  : toast.type === "error"
                  ? "bg-red-50/90 border-red-200 text-red-700"
                  : "bg-white/90 border-gray-200 text-gray-700"
              }`}
            >
              {toast.type === "success" ? (
                <CheckCircle size={18} />
              ) : (
                <AlertCircle size={18} />
              )}
              <span className="text-sm font-medium">{toast.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="max-w-7xl mx-auto space-y-6">
        {/* --- Header & Search Bar --- */}
        <div>
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                <MapPin className="text-blue-600" size={32} /> Địa chỉ giao hàng
              </h1>
              <p className="text-gray-500 text-sm mt-1 ml-9">
                Quản lý và tìm kiếm địa chỉ giao hàng của bạn
              </p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-3 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
            <div className="relative flex-1">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                type="text"
                placeholder="Tìm kiếm theo tên, số điện thoại, đường..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={fetchAddresses}
                className="px-4 py-2.5 bg-white text-gray-600 rounded-xl border border-gray-200 hover:bg-gray-50 flex items-center gap-2 transition-colors font-medium text-sm"
                disabled={loading}
              >
                <RefreshCw
                  size={16}
                  className={loading ? "animate-spin" : ""}
                />
                <span className="hidden sm:inline">Làm mới</span>
              </button>
              <button
                onClick={openCreateModal}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium shadow-md shadow-blue-600/20 transition-all flex items-center gap-2 text-sm whitespace-nowrap"
              >
                <Plus size={18} />
                Thêm địa chỉ
              </button>
            </div>
          </div>
        </div>

        {/* --- Empty State --- */}
        {!loading && filteredAddresses.length === 0 && (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <MapPin size={24} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              Không tìm thấy địa chỉ nào
            </h3>
            <p className="text-gray-500 text-sm mt-1">
              Hãy thêm địa chỉ mới để bắt đầu mua sắm.
            </p>
          </div>
        )}

        {/* --- Address List --- */}
        <div className="flex flex-col gap-4">
          <AnimatePresence>
            {filteredAddresses.map((addr, index) => (
              <motion.div
                key={addr.id}
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                layout
                transition={{ delay: index * 0.05 }}
                className={`group relative bg-white rounded-xl p-6 border transition-all duration-200 ${
                  addr.isDefault
                    ? "border-blue-200 shadow-sm ring-1 ring-blue-500/20 bg-blue-50/10"
                    : "border-gray-100 hover:border-blue-200 hover:shadow-md"
                }`}
              >
                <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                  {/* Left: Info Section */}
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-lg ${
                          addr.isDefault
                            ? "bg-blue-100 text-blue-600"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        <User size={18} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-900 text-lg">
                            {addr.name}
                          </span>
                          {addr.isDefault && (
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-bold rounded-md border border-blue-200">
                              Mặc định
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 text-gray-500 text-sm mt-0.5">
                          <Phone size={14} />
                          <span>{addr.phone}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 pl-1">
                      <MapPin
                        size={18}
                        className="text-gray-400 mt-1 shrink-0"
                      />
                      <span className="text-gray-700 leading-relaxed">
                        {formatAddress(addr)}
                      </span>
                    </div>
                  </div>

                  {/* Right: Actions Section */}
                  <div className="flex items-center gap-2 shrink-0 self-start md:self-center border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-4 w-full md:w-auto mt-2 md:mt-0 justify-end">
                    <button
                      onClick={() => openEditModal(addr)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Chỉnh sửa"
                    >
                      <Edit3 size={20} />
                    </button>

                    <button
                      onClick={() => handleDelete(addr.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Xóa"
                      aria-label="Xóa địa chỉ"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* --- Modal Form --- */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setIsModalOpen(false)}
            />

            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="relative bg-white rounded-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col"
            >
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-white shrink-0">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  {formData.id ? (
                    <Edit3 size={24} className="text-blue-600" />
                  ) : (
                    <Plus size={24} className="text-blue-600" />
                  )}
                  {formData.id ? "Cập nhật địa chỉ" : "Thêm địa chỉ mới"}
                </h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
                  aria-label="Đóng"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto bg-gray-50/50">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 h-full">
                  {/* Left Column: Form Fields */}
                  <div className="lg:col-span-5 p-6 space-y-5 bg-white h-full overflow-y-auto">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          Họ và tên <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) =>
                            setFormData({ ...formData, name: e.target.value })
                          }
                          className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                          placeholder="Nguyễn Văn A"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          Số điện thoại <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) =>
                            setFormData({ ...formData, phone: e.target.value })
                          }
                          className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                          placeholder="0912..."
                        />
                      </div>
                    </div>

                    <div className="pt-2 border-t border-dashed border-gray-200">
                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">
                            Tỉnh / Thành phố
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
                                setFormData({
                                  ...formData,
                                  city: prov.name,
                                  district: "",
                                  ward: "",
                                });
                                // Trigger geocode chỉ với tên Tỉnh để map bay về tỉnh đó
                                handleGeocode(prov.name);
                              }
                            }}
                            className="w-full px-4 py-2.5 bg-white rounded-lg border border-gray-300 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                            aria-label="Chọn tỉnh/thành phố"
                          >
                            <option value="">-- Chọn Tỉnh/Thành --</option>
                            {provinces.map((p) => (
                              <option key={p.code} value={p.code}>
                                {p.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">
                              Quận / Huyện
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
                                  setFormData({
                                    ...formData,
                                    district: dist.name,
                                    ward: "",
                                  });
                                  handleGeocode(formData.city, dist.name);
                                }
                              }}
                              disabled={!selectedProvince}
                              className="w-full px-4 py-2.5 bg-white rounded-lg border border-gray-300 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:bg-gray-100"
                              aria-label="Chọn quận/huyện"
                            >
                              <option value="">-- Quận/Huyện --</option>
                              {selectedProvince?.districts.map((d) => (
                                <option key={d.code} value={d.code}>
                                  {d.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">
                              Phường / Xã
                            </label>
                            <select
                              value={selectedWard?.code || ""}
                              onChange={(e) => {
                                const ward = selectedDistrict?.wards.find(
                                  (w) => w.code === Number(e.target.value)
                                );
                                setSelectedWard(ward || null);
                                if (ward) {
                                  setFormData({ ...formData, ward: ward.name });
                                  handleGeocode(
                                    selectedProvince?.name,
                                    selectedDistrict?.name,
                                    ward.name,
                                    formData.street
                                  );
                                }
                              }}
                              disabled={!selectedDistrict}
                              className="w-full px-4 py-2.5 bg-white rounded-lg border border-gray-300 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:bg-gray-100"
                              aria-label="Chọn phường/xã"
                            >
                              <option value="">-- Phường/Xã --</option>
                              {selectedDistrict?.wards.map((w) => (
                                <option key={w.code} value={w.code}>
                                  {w.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Tên đường / Số nhà
                      </label>
                      <input
                        type="text"
                        value={formData.street}
                        onChange={(e) =>
                          setFormData({ ...formData, street: e.target.value })
                        }
                        onBlur={() =>
                          handleGeocode(
                            formData.city,
                            formData.district,
                            formData.ward,
                            formData.street
                          )
                        }
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                        placeholder="Ví dụ: 123 Đường Nguyễn Trãi"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Địa chỉ chi tiết <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        rows={3}
                        value={formData.addressLine}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            addressLine: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none resize-none"
                        placeholder="Tòa nhà A, Khu B, gần công viên..."
                      />
                    </div>
                  </div>

                  {/* Right Column: Map */}
                  <div className="lg:col-span-7 flex flex-col h-[400px] lg:h-auto border-t lg:border-t-0 lg:border-l border-gray-200">
                    <div className="p-3 bg-gray-50 border-b border-gray-200 flex justify-between items-center text-xs text-gray-600">
                      <span className="flex items-center gap-1 font-medium">
                        <MapPin size={14} className="text-red-500" />
                        Click trên bản đồ để chọn vị trí chính xác
                      </span>
                      <span className="bg-white px-2 py-1 rounded border border-gray-200 font-mono">
                        {formData.latitude.toFixed(6)},{" "}
                        {formData.longitude.toFixed(6)}
                      </span>
                    </div>
                    <div className="flex-1 relative z-0">
                      <MapContainer
                        center={[formData.latitude, formData.longitude]}
                        zoom={15}
                        scrollWheelZoom={true}
                        style={{ height: "100%", width: "100%" }}
                      >
                        <TileLayer
                          attribution="&copy; OSM"
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <RecenterMap
                          lat={formData.latitude}
                          lng={formData.longitude}
                        />
                        <LocationMarker
                          position={[formData.latitude, formData.longitude]}
                          onSelect={(lat, lng) =>
                            setFormData({
                              ...formData,
                              latitude: lat,
                              longitude: lng,
                            })
                          }
                        />
                      </MapContainer>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 border-t border-gray-100 bg-white flex justify-between items-center shrink-0">
                <label className="flex items-center gap-3 cursor-pointer group select-none">
                  <div className="relative flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.isDefault}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          isDefault: e.target.checked,
                        })
                      }
                      className="peer h-5 w-5 cursor-pointer appearance-none rounded border border-gray-300 bg-white transition-all checked:border-blue-600 checked:bg-blue-600 group-hover:border-blue-400"
                    />
                    <CheckCircle
                      size={14}
                      className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100"
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600 transition-colors">
                    Đặt làm mặc định
                  </span>
                </label>

                <div className="flex gap-3">
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="px-6 py-2.5 rounded-xl text-gray-600 font-medium hover:bg-gray-100 transition-colors"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={handleFormSubmit}
                    disabled={loading}
                    className="px-8 py-2.5 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 active:scale-95 transition-all shadow-lg shadow-blue-600/20 flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <Save size={18} />
                    )}
                    {formData.id ? "Lưu thay đổi" : "Tạo địa chỉ"}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
