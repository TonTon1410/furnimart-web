/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import {
  CheckCircle,
  AlertCircle,
  XCircle,
  Plus,
  Edit,
  Trash2,
  X,
  Loader2,
} from "lucide-react";
import warehousesService from "@/service/warehousesService";
import zoneService from "@/service/zoneService";
import locationItemService from "@/service/locationItemService";
import { authService } from "@/service/authService";
import { productService } from "@/service/productService";

interface Zone {
  id: string;
  zoneName: string;
  zoneCode: string;
  description: string;
  status: string;
  quantity: number;
  warehouseId: string;
}

interface LocationItem {
  id: string;
  code: string;
  rowLabel: string;
  columnNumber: number;
  quantity: number;
  currentQuantity?: number;
  status: string;
  zoneId: string;
  description?: string;
  itemResponse?: Array<{
    id: number;
    quantity: number;
    productColorId: string;
    productName: string;
    reservedQuantity: number;
    inventoryId: number;
  }>;
}

interface ZoneSummary {
  zone: Zone;
  locations: LocationItem[];
  totalCapacity: number;
  usedCapacity: number;
  availableCapacity: number;
}

export default function WarehouseMapNew() {
  const [warehouse, setWarehouse] = useState<any>(null);
  const [zoneSummaries, setZoneSummaries] = useState<ZoneSummary[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<LocationItem | null>(
    null
  );
  const [productDetails, setProductDetails] = useState<Map<string, any>>(
    new Map()
  );
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  // CRUD Modal states
  const [warehouseFormOpen, setWarehouseFormOpen] = useState(false);
  const [warehouseFormMode, setWarehouseFormMode] = useState<"create" | "edit">(
    "create"
  );

  const [zoneFormOpen, setZoneFormOpen] = useState(false);
  const [zoneFormMode, setZoneFormMode] = useState<"create" | "edit">("create");
  const [selectedZoneInfo, setSelectedZoneInfo] = useState<{
    id: string | null;
    warehouseId: string;
  } | null>(null);

  const [locationFormOpen, setLocationFormOpen] = useState(false);
  const [locationFormMode, setLocationFormMode] = useState<"create" | "edit">(
    "create"
  );
  const [selectedLocationInfo, setSelectedLocationInfo] = useState<{
    id: string | null;
    zoneId: string;
  } | null>(null);

  // Form data states
  const [warehouseFormData, setWarehouseFormData] = useState({
    warehouseName: "",
    address: "",
    capacity: "",
  });

  const [zoneFormData, setZoneFormData] = useState({
    zoneName: "",
    zoneCode: "",
    description: "",
    quantity: "",
  });

  const [locationFormData, setLocationFormData] = useState({
    code: "",
    rowLabel: "",
    columnNumber: "",
    quantity: "",
    description: "",
    status: "ACTIVE" as "ACTIVE" | "INACTIVE",
  });

  // Loading states
  const [submitting, setSubmitting] = useState(false);

  // Load product details when location is selected
  useEffect(() => {
    if (selectedLocation && selectedLocation.itemResponse) {
      const loadProductDetails = async () => {
        const newDetails = new Map();
        for (const item of selectedLocation.itemResponse!) {
          try {
            const response = await productService.getProductColorById(
              item.productColorId
            );
            newDetails.set(item.productColorId, response.data.data);
          } catch (error) {
            console.error(
              `Failed to load product color ${item.productColorId}:`,
              error
            );
          }
        }
        setProductDetails(newDetails);
      };
      loadProductDetails();
    }
  }, [selectedLocation]);

  // Handler functions for Warehouse
  const handleEditWarehouse = () => {
    if (!warehouse) return;
    setWarehouseFormMode("edit");
    setWarehouseFormData({
      warehouseName: warehouse.warehouseName || "",
      address: warehouse.address || "",
      capacity: warehouse.capacity?.toString() || "",
    });
    setWarehouseFormOpen(true);
  };

  const handleSaveWarehouse = async () => {
    try {
      setSubmitting(true);
      const storeId = authService.getStoreId();

      console.log("=== handleSaveWarehouse START ===");
      console.log("storeId:", storeId);
      console.log("warehouseFormMode:", warehouseFormMode);
      console.log("warehouseFormData:", warehouseFormData);

      if (!storeId) {
        alert("Không tìm thấy thông tin cửa hàng");
        return;
      }

      // Validation
      if (!warehouseFormData.warehouseName.trim()) {
        alert("Vui lòng nhập tên kho");
        return;
      }

      if (
        !warehouseFormData.capacity ||
        Number(warehouseFormData.capacity) <= 0
      ) {
        alert("Vui lòng nhập diện tích hợp lệ (lớn hơn 0)");
        return;
      }

      const payload = {
        warehouseName: warehouseFormData.warehouseName,
        status: "ACTIVE",
        capacity: Number(warehouseFormData.capacity),
      };

      console.log("payload:", payload);

      if (warehouseFormMode === "edit" && warehouse) {
        console.log("Updating warehouse:", warehouse.id);
        const response = await warehousesService.updateWarehouseInfo(
          storeId,
          warehouse.id,
          payload
        );
        console.log("Update response:", response);
      } else {
        console.log("Creating new warehouse");
        const response = await warehousesService.createWarehouse(
          storeId,
          payload
        );
        console.log("Create response:", response);
      }

      console.log("=== handleSaveWarehouse SUCCESS ===");
      setWarehouseFormOpen(false);
      await loadWarehouseData();
    } catch (error: any) {
      console.error("=== handleSaveWarehouse ERROR ===");
      console.error("Error details:", error);
      console.error("Error response:", error?.response);
      console.error("Error message:", error?.message);

      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Lỗi không xác định";
      alert(`Lỗi khi lưu kho hàng: ${errorMessage}`);
    } finally {
      setSubmitting(false);
    }
  };

  // Handler functions for Zone
  const handleCreateZone = () => {
    if (!warehouse) return;
    setZoneFormMode("create");
    setSelectedZoneInfo({ id: null, warehouseId: warehouse.id });
    setZoneFormData({
      zoneName: "",
      zoneCode: "",
      description: "",
      quantity: "",
    });
    setZoneFormOpen(true);
  };

  const handleEditZone = (zone: Zone) => {
    if (!warehouse) return;
    setZoneFormMode("edit");
    setSelectedZoneInfo({ id: zone.id, warehouseId: warehouse.id });
    setZoneFormData({
      zoneName: zone.zoneName,
      zoneCode: zone.zoneCode,
      description: zone.description || "",
      quantity: zone.quantity?.toString() || "",
    });
    setZoneFormOpen(true);
  };

  const handleDeleteZone = async (zoneId: string) => {
    if (!confirm("Bạn có chắc muốn xóa khu vực này?")) return;

    try {
      await zoneService.deleteZone(zoneId);
      loadWarehouseData();
    } catch (error) {
      console.error("Error deleting zone:", error);
      alert("Lỗi khi xóa khu vực");
    }
  };

  const handleSaveZone = async () => {
    if (!selectedZoneInfo) return;

    // Validation
    if (!zoneFormData.zoneName.trim()) {
      alert("Vui lòng nhập Tên khu vực");
      return;
    }

    if (!zoneFormData.zoneCode.trim()) {
      alert("Vui lòng nhập Mã khu vực");
      return;
    }

    if (zoneFormData.quantity === "" || zoneFormData.quantity === null) {
      alert("Vui lòng nhập Diện tích hợp lệ");
      return;
    }

    const finalQuantity = Number(zoneFormData.quantity);
    if (finalQuantity < 0) {
      alert("Diện tích không được là số âm");
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        zoneName: zoneFormData.zoneName,
        zoneCode: zoneFormData.zoneCode,
        quantity: finalQuantity,
        description: zoneFormData.description || "",
        warehouseId: selectedZoneInfo.warehouseId,
        status: "ACTIVE",
      };

      if (zoneFormMode === "edit" && selectedZoneInfo.id) {
        await zoneService.updateZone(selectedZoneInfo.id, payload);
      } else {
        await zoneService.createZone(payload);
      }

      setZoneFormOpen(false);
      setSelectedZoneInfo(null);
      loadWarehouseData();
    } catch (error) {
      console.error("Error saving zone:", error);
      alert("Lỗi khi lưu khu vực");
    } finally {
      setSubmitting(false);
    }
  };

  // Handler functions for Location
  const handleCreateLocation = (zoneId: string) => {
    setLocationFormMode("create");
    setSelectedLocationInfo({ id: null, zoneId });
    setLocationFormData({
      code: "",
      rowLabel: "",
      columnNumber: "",
      quantity: "",
      description: "",
      status: "ACTIVE" as "ACTIVE" | "INACTIVE",
    });
    setLocationFormOpen(true);
  };

  const handleEditLocation = (location: LocationItem) => {
    setLocationFormMode("edit");
    setSelectedLocationInfo({ id: location.id, zoneId: location.zoneId });
    setLocationFormData({
      code: location.code,
      rowLabel: location.rowLabel,
      columnNumber: location.columnNumber?.toString() || "",
      quantity: location.quantity?.toString() || "",
      description: location.description || "",
      status: (location.status as "ACTIVE" | "INACTIVE") || "ACTIVE",
    });
    setLocationFormOpen(true);
  };

  const handleDeleteLocation = async (locationId: string) => {
    if (!confirm("Bạn có chắc muốn xóa vị trí này?")) return;

    try {
      await locationItemService.deleteLocationItem(locationId);
      loadWarehouseData();
    } catch (error) {
      console.error("Error deleting location:", error);
      alert("Lỗi khi xóa vị trí");
    }
  };

  const handleSaveLocation = async () => {
    if (!selectedLocationInfo) return;

    // Validation
    if (!locationFormData.rowLabel.trim()) {
      alert("Vui lòng nhập Hàng (Row Label)");
      return;
    }

    if (
      locationFormData.columnNumber === "" ||
      locationFormData.columnNumber === null
    ) {
      alert("Vui lòng nhập Cột (Column Number) hợp lệ");
      return;
    }

    if (
      locationFormData.quantity === "" ||
      locationFormData.quantity === null
    ) {
      alert("Vui lòng nhập Sức chứa (Quantity) hợp lệ");
      return;
    }

    if (locationFormMode === "edit" && !locationFormData.code.trim()) {
      alert("Mã vị trí không được để trống khi chỉnh sửa");
      return;
    }

    try {
      setSubmitting(true);
      const payload: any = {
        rowLabel: locationFormData.rowLabel,
        columnNumber: Number(locationFormData.columnNumber),
        quantity: Number(locationFormData.quantity),
        description: locationFormData.description || "",
        status: locationFormData.status,
        zoneId: selectedLocationInfo.zoneId,
      };

      if (locationFormMode === "edit" && selectedLocationInfo.id) {
        // Khi edit thì gửi code
        payload.code = locationFormData.code;
        await locationItemService.updateLocationItem(
          selectedLocationInfo.id,
          payload
        );
      } else {
        // Khi create thì không gửi code, API sẽ tự sinh
        await locationItemService.createLocationItem(payload);
      }

      setLocationFormOpen(false);
      setSelectedLocationInfo(null);
      loadWarehouseData();
    } catch (error) {
      console.error("Error saving location:", error);
      alert("Lỗi khi lưu vị trí");
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    loadWarehouseData();
  }, []);

  const loadWarehouseData = async () => {
    try {
      setLoading(true);
      setApiError(null);
      const storeId = authService.getStoreId();

      if (!storeId) {
        console.error("No storeId found");
        setWarehouse(null);
        setLoading(false);
        return;
      }

      // Lấy warehouse theo storeId
      try {
        const warehouseRes = await warehousesService.getWarehouseByStore(
          storeId
        );
        console.log("Warehouse response:", warehouseRes);
        // API trả về { status, message, data }, nên phải lấy .data.data
        const warehouseData = warehouseRes.data?.data || warehouseRes.data;
        console.log("Warehouse data:", warehouseData);

        if (!warehouseData || !warehouseData.id) {
          console.log("No warehouse found");
          setWarehouse(null);
          setLoading(false);
          return;
        }

        setWarehouse(warehouseData);

        // Lấy tất cả zones của warehouse
        const zonesRes = await zoneService.getZoneByWarehouse(warehouseData.id);
        console.log("Zones response:", zonesRes);
        // API trả về { status, message, data: [...] }
        const zones: Zone[] = zonesRes.data?.data || zonesRes.data;
        console.log("Zones data:", zones);

        if (!zones || zones.length === 0) {
          console.log("No zones found");
          setZoneSummaries([]);
          setLoading(false);
          return;
        }

        // Lấy locations cho từng zone
        const summaries: ZoneSummary[] = await Promise.all(
          zones.map(async (zone) => {
            const locationsRes = await locationItemService.getLocationByZone(
              zone.id
            );
            console.log(`Locations for zone ${zone.zoneCode}:`, locationsRes);
            // API trả về { status, message, data: [...] }
            const locations: LocationItem[] =
              locationsRes.data?.data || locationsRes.data;

            // totalCapacity là quantity của Zone, không phải tổng locations
            const totalCapacity = zone.quantity;
            const usedCapacity = locations.reduce(
              (sum, loc) => sum + (loc.currentQuantity || 0),
              0
            );
            const availableCapacity = totalCapacity - usedCapacity;

            return {
              zone,
              locations,
              totalCapacity,
              usedCapacity,
              availableCapacity,
            };
          })
        );

        console.log("Zone summaries:", summaries);
        setZoneSummaries(summaries);
      } catch (warehouseError: any) {
        // Nếu lỗi 404 - chưa có warehouse thì không phải là lỗi
        if (warehouseError?.response?.status === 404) {
          console.log(
            "Warehouse not found (404) - this is normal, no warehouse created yet"
          );
          setWarehouse(null);
          setZoneSummaries([]);
          setLoading(false);
          return;
        }
        // Các lỗi khác mới là lỗi thật sự
        throw warehouseError;
      }
    } catch (error) {
      console.error("Error loading warehouse:", error);
      setApiError("Lỗi khi tải dữ liệu kho hàng. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  const getLocationStatus = (location: LocationItem) => {
    if (location.status === "INACTIVE") return "inactive";

    // Tính phần trăm đã sử dụng dựa trên currentQuantity
    const currentQty = location.currentQuantity || 0;
    const totalQty = location.quantity || 1;
    const usedPercent = (currentQty / totalQty) * 100;

    if (usedPercent >= 90) return "full";
    if (usedPercent >= 50) return "warning";
    if (usedPercent > 0) return "available";
    return "empty";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-emerald-500";
      case "warning":
        return "bg-yellow-500";
      case "full":
        return "bg-red-600";
      case "empty":
        return "bg-gray-500";
      case "inactive":
        return "bg-gray-400";
      default:
        return "bg-gray-300";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "available":
        return <CheckCircle className="w-4 h-4" />;
      case "warning":
        return <AlertCircle className="w-4 h-4" />;
      case "full":
        return <XCircle className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getZoneColor = (zoneCode: string) => {
    if (zoneCode.startsWith("A"))
      return "border-blue-400 bg-blue-50 dark:bg-blue-900/30 dark:border-blue-500";
    if (zoneCode.startsWith("B"))
      return "border-teal-400 bg-teal-50 dark:bg-teal-900/30 dark:border-teal-500";
    if (zoneCode.startsWith("C"))
      return "border-cyan-400 bg-cyan-50 dark:bg-cyan-900/30 dark:border-cyan-500";
    if (zoneCode.startsWith("D"))
      return "border-amber-400 bg-amber-50 dark:bg-amber-900/30 dark:border-amber-500";
    return "border-gray-400 bg-gray-50 dark:bg-gray-700 dark:border-gray-600";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex items-center gap-2 text-gray-500">
          <Loader2 className="w-5 h-5 animate-spin" />
          Đang tải dữ liệu kho...
        </div>
      </div>
    );
  }

  // Hiển thị lỗi API
  if (apiError) {
    return (
      <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-red-200 dark:border-red-800 p-8 text-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Có lỗi xảy ra
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">{apiError}</p>
            <button
              onClick={loadWarehouseData}
              className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 dark:bg-emerald-700 text-white rounded-lg hover:bg-emerald-700 dark:hover:bg-emerald-600 transition-colors"
            >
              <Loader2 className="w-5 h-5" />
              Thử lại
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Nếu chưa có warehouse, hiển thị trang tạo warehouse
  if (!warehouse) {
    return (
      <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Quản lý kho hàng
          </h1>
        </div>
        <div className="max-w-2xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center">
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Plus className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Chưa có kho hàng
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Bạn chưa có kho hàng nào. Hãy tạo kho hàng đầu tiên để bắt đầu
              quản lý.
            </p>
            <button
              onClick={() => {
                setWarehouseFormMode("create");
                setWarehouseFormData({
                  warehouseName: "",
                  address: "",
                  capacity: "",
                });
                setWarehouseFormOpen(true);
              }}
              className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Tạo kho hàng đầu tiên
            </button>
          </div>
        </div>

        {/* Warehouse Form Modal */}
        {warehouseFormOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    Tạo kho mới
                  </h3>
                  <button
                    onClick={() => setWarehouseFormOpen(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                    aria-label="Đóng"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Tên kho <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={warehouseFormData.warehouseName}
                    onChange={(e) =>
                      setWarehouseFormData({
                        ...warehouseFormData,
                        warehouseName: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="Nhập tên kho"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Địa chỉ
                  </label>
                  <input
                    type="text"
                    value={warehouseFormData.address}
                    onChange={(e) =>
                      setWarehouseFormData({
                        ...warehouseFormData,
                        address: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="Nhập địa chỉ"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Diện tích (m²) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={warehouseFormData.capacity}
                    onChange={(e) =>
                      setWarehouseFormData({
                        ...warehouseFormData,
                        capacity: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="Nhập diện tích"
                  />
                </div>
              </div>

              <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex gap-3">
                <button
                  onClick={() => setWarehouseFormOpen(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={handleSaveWarehouse}
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-emerald-600 dark:bg-emerald-700 text-white rounded-lg hover:bg-emerald-700 dark:hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Tạo kho
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Breadcrumb */}
      <div className="mb-4">
        <nav className="text-sm text-gray-600 dark:text-gray-400">
          <ol className="flex items-center gap-2">
            <li>Cửa hàng</li>
            <li className="opacity-60">/</li>
            <li className="font-semibold text-emerald-600 dark:text-emerald-400">
              {warehouse?.warehouseName || "Kho hàng"}
            </li>
            <li className="opacity-60">/</li>
            <li className="text-gray-400 dark:text-gray-500">
              {zoneSummaries.length} khu vực
            </li>
          </ol>
        </nav>
      </div>

      {/* Header with Actions */}
      <div className="mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {warehouse?.warehouseName || "Kho hàng"}
            </h1>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-600 dark:text-gray-400">
              <span className="flex items-center gap-1">
                📦 Tổng diện tích: <strong>{warehouse?.capacity || 0}m²</strong>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                🏗️ Số khu vực: <strong>{zoneSummaries.length}</strong>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                📍 Tổng vị trí:{" "}
                <strong>
                  {zoneSummaries.reduce(
                    (sum, z) => sum + z.locations.length,
                    0
                  )}
                </strong>
              </span>
            </div>
          </div>
          <div className="flex gap-3">
            {warehouse && (
              <button
                onClick={handleEditWarehouse}
                className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <Edit className="w-4 h-4" />
                Sửa kho
              </button>
            )}
            <button
              onClick={handleCreateZone}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 dark:bg-emerald-700 text-white rounded-lg hover:bg-emerald-700 dark:hover:bg-emerald-600 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Thêm khu vực
            </button>
          </div>
        </div>
      </div>

      {/* Header - Zone Summary Cards */}
      {zoneSummaries.length > 0 ? (
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">
            Danh sách khu vực trong kho
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {zoneSummaries.map((summary) => (
              <div
                key={summary.zone.id}
                className={`p-4 rounded-lg border-2 ${getZoneColor(
                  summary.zone.zoneCode
                )} relative`}
              >
                <div className="absolute top-2 right-2 flex gap-1">
                  <button
                    onClick={() => handleEditZone(summary.zone)}
                    className="p-1.5 bg-white rounded-md hover:bg-gray-100 transition-colors"
                    title="Sửa khu vực"
                  >
                    <Edit className="w-3.5 h-3.5 text-gray-600" />
                  </button>
                  <button
                    onClick={() => handleDeleteZone(summary.zone.id)}
                    className="p-1.5 bg-white rounded-md hover:bg-red-50 transition-colors"
                    title="Xóa khu vực"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-600" />
                  </button>
                </div>
                <div className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">
                  {summary.zone.zoneName}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                  {summary.totalCapacity}m² • {summary.locations.length} vị trí
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {summary.usedCapacity}/{summary.totalCapacity} sản phẩm
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 p-8 text-center">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Plus className="w-6 h-6 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            Chưa có khu vực nào
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Hãy tạo khu vực đầu tiên để bắt đầu quản lý kho hàng
          </p>
          <button
            onClick={handleCreateZone}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Tạo khu vực đầu tiên
          </button>
        </div>
      )}

      {/* Warehouse Map */}
      {zoneSummaries.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-1">
              Sơ đồ vị trí trong kho
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Tổng diện tích: {warehouse?.capacity || 0}m² •{" "}
              {zoneSummaries.length} khu vực •{" "}
              {zoneSummaries.reduce((sum, z) => sum + z.locations.length, 0)} vị
              trí
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {zoneSummaries.map((summary) => (
              <div
                key={summary.zone.id}
                className={`border-2 rounded-lg p-4 ${getZoneColor(
                  summary.zone.zoneCode
                )}`}
              >
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-bold text-gray-800 dark:text-gray-100">
                      {summary.zone.zoneName}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                      Mã: {summary.zone.zoneCode} • {summary.locations.length}{" "}
                      vị trí
                    </div>
                  </div>
                  <button
                    onClick={() => handleCreateLocation(summary.zone.id)}
                    className="flex items-center gap-1 px-2 py-1 bg-white dark:bg-gray-700 rounded-md text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Thêm vị trí
                  </button>
                </div>

                {/* Locations Grid */}
                <div className="grid grid-cols-3 gap-2">
                  {summary.locations.map((location) => {
                    const status = getLocationStatus(location);
                    return (
                      <div key={location.id} className="relative group">
                        <button
                          onClick={() => setSelectedLocation(location)}
                          className={`w-full ${getStatusColor(
                            status
                          )} text-white p-3 rounded text-xs font-semibold hover:opacity-80 transition-opacity flex flex-col items-center justify-center min-h-[60px]`}
                        >
                          <div className="flex items-center gap-1 mb-1">
                            {getStatusIcon(status)}
                            <span>{location.code}</span>
                          </div>
                          <div className="text-[10px] opacity-90">
                            {location.currentQuantity || 0}/{location.quantity}
                          </div>
                        </button>
                        {/* Quick actions on hover */}
                        <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditLocation(location);
                            }}
                            className="p-1 bg-white/90 dark:bg-gray-800/90 rounded hover:bg-white dark:hover:bg-gray-800 transition-colors"
                            title="Sửa"
                          >
                            <Edit className="w-3 h-3 text-gray-700 dark:text-gray-300" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteLocation(location.id);
                            }}
                            className="p-1 bg-white/90 dark:bg-gray-800/90 rounded hover:bg-red-50 dark:hover:bg-red-900/50 transition-colors"
                            title="Xóa"
                          >
                            <Trash2 className="w-3 h-3 text-red-600 dark:text-red-400" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="mt-6 flex items-center gap-6 text-xs">
            <div className="font-semibold text-gray-700 dark:text-gray-300">
              Trạng thái:
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-emerald-500 rounded"></div>
              <span className="text-gray-600 dark:text-gray-400">
                Có hàng (&lt;50%)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-500 rounded"></div>
              <span className="text-gray-600 dark:text-gray-400">
                Cảnh báo (50-90%)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-600 rounded"></div>
              <span className="text-gray-600 dark:text-gray-400">
                Gần đầy (&gt;90%)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-500 rounded"></div>
              <span className="text-gray-600 dark:text-gray-400">Trống</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-400 rounded"></div>
              <span className="text-gray-600 dark:text-gray-400">
                Không hoạt động
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Location Details Sidebar */}
      {selectedLocation && (
        <div className="fixed right-0 top-0 h-full w-96 bg-white dark:bg-gray-800 shadow-2xl p-6 overflow-y-auto z-50">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white">
              Chi tiết vị trí {selectedLocation.code}
            </h3>
            <button
              onClick={() => setSelectedLocation(null)}
              className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
            >
              ✕
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                Vị trí
              </div>
              <div className="font-semibold text-gray-800 dark:text-gray-200">
                Hàng {selectedLocation.rowLabel}, Cột{" "}
                {selectedLocation.columnNumber}
              </div>
            </div>

            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                Sức chứa
              </div>
              <div className="font-semibold text-gray-800 dark:text-gray-200">
                {selectedLocation.currentQuantity || 0}/
                {selectedLocation.quantity} sản phẩm
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <h4 className="font-bold text-gray-800 dark:text-white mb-3">
                Sản phẩm trong vị trí (
                {selectedLocation.itemResponse?.length || 0})
              </h4>
              {selectedLocation.itemResponse &&
              selectedLocation.itemResponse.length > 0 ? (
                <div className="space-y-3">
                  {selectedLocation.itemResponse.map((item) => {
                    const productDetail = productDetails.get(
                      item.productColorId
                    );
                    return (
                      <div
                        key={item.id}
                        className="p-3 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 shadow-sm hover:shadow-md transition-shadow"
                      >
                        <div className="flex gap-3">
                          {/* Product Image */}
                          {productDetail?.images?.[0]?.image ? (
                            <img
                              src={productDetail.images[0].image}
                              alt={item.productName}
                              className="w-16 h-16 object-cover rounded-lg shrink-0"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src =
                                  productDetail.product?.thumbnailImage ||
                                  "https://via.placeholder.com/64";
                              }}
                            />
                          ) : (
                            <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center shrink-0">
                              <span className="text-gray-400 text-xs">
                                No image
                              </span>
                            </div>
                          )}

                          {/* Product Info */}
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-sm text-gray-800 dark:text-gray-200 truncate">
                              {item.productName}
                            </div>

                            {/* Color Info */}
                            {productDetail?.color && (
                              <div className="flex items-center gap-2 mt-1">
                                <div
                                  className="w-4 h-4 rounded border border-gray-300 dark:border-gray-600"
                                  style={{
                                    backgroundColor:
                                      productDetail.color.hexCode,
                                  }}
                                />
                                <span className="text-xs text-gray-600 dark:text-gray-400">
                                  {productDetail.color.colorName}
                                </span>
                              </div>
                            )}

                            {/* Price */}
                            {productDetail?.product?.price && (
                              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                Giá:{" "}
                                {productDetail.product.price.toLocaleString(
                                  "vi-VN"
                                )}
                                đ
                              </div>
                            )}

                            {/* Quantity Info */}
                            <div className="flex items-center justify-between mt-2">
                              <div className="font-bold text-emerald-600">
                                {item.quantity} sản phẩm
                              </div>
                              {item.reservedQuantity > 0 && (
                                <div className="text-xs text-amber-600">
                                  Đặt trước: {item.reservedQuantity}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400 dark:text-gray-500">
                  <div className="text-sm">Chưa có sản phẩm nào</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Warehouse Form Modal */}
      {warehouseFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  {warehouseFormMode === "create"
                    ? "Tạo kho mới"
                    : "Sửa thông tin kho"}
                </h3>
                <button
                  onClick={() => setWarehouseFormOpen(false)}
                  className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  aria-label="Đóng"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tên kho <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={warehouseFormData.warehouseName}
                  onChange={(e) =>
                    setWarehouseFormData({
                      ...warehouseFormData,
                      warehouseName: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="Nhập tên kho"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Địa chỉ
                </label>
                <input
                  type="text"
                  value={warehouseFormData.address}
                  onChange={(e) =>
                    setWarehouseFormData({
                      ...warehouseFormData,
                      address: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="Nhập địa chỉ"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Diện tích (m²) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={warehouseFormData.capacity}
                  onChange={(e) =>
                    setWarehouseFormData({
                      ...warehouseFormData,
                      capacity: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="Nhập diện tích"
                />
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex gap-3">
              <button
                onClick={() => setWarehouseFormOpen(false)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleSaveWarehouse}
                disabled={submitting}
                className="flex-1 px-4 py-2 bg-emerald-600 dark:bg-emerald-700 text-white rounded-lg hover:bg-emerald-700 dark:hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {warehouseFormMode === "create" ? "Tạo kho" : "Lưu"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Zone Form Modal */}
      {zoneFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  {zoneFormMode === "create"
                    ? "Tạo khu vực mới"
                    : "Sửa thông tin khu vực"}
                </h3>
                <button
                  onClick={() => setZoneFormOpen(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label="Đóng"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tên khu vực <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={zoneFormData.zoneName}
                  onChange={(e) =>
                    setZoneFormData({
                      ...zoneFormData,
                      zoneName: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="Nhập tên khu vực"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Mã khu vực <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={zoneFormData.zoneCode}
                  onChange={(e) =>
                    setZoneFormData({
                      ...zoneFormData,
                      zoneCode: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="VD: A001, B001"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Diện tích (m²) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={zoneFormData.quantity}
                  onChange={(e) =>
                    setZoneFormData({
                      ...zoneFormData,
                      quantity: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="Nhập diện tích"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Mô tả
                </label>
                <textarea
                  value={zoneFormData.description}
                  onChange={(e) =>
                    setZoneFormData({
                      ...zoneFormData,
                      description: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  rows={3}
                  placeholder="Nhập mô tả"
                />
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex gap-3">
              <button
                onClick={() => setZoneFormOpen(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleSaveZone}
                disabled={submitting}
                className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {zoneFormMode === "create" ? "Tạo khu vực" : "Lưu"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Location Form Modal */}
      {locationFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  {locationFormMode === "create"
                    ? "Tạo vị trí mới"
                    : "Sửa thông tin vị trí"}
                </h3>
                <button
                  onClick={() => setLocationFormOpen(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label="Đóng"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {locationFormMode === "edit" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Mã vị trí
                  </label>
                  <input
                    type="text"
                    value={locationFormData.code}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 cursor-not-allowed"
                    placeholder="VD: A01, B02"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Hàng <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={locationFormData.rowLabel}
                    onChange={(e) =>
                      setLocationFormData({
                        ...locationFormData,
                        rowLabel: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="VD: A, B"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Cột <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={locationFormData.columnNumber}
                    onChange={(e) =>
                      setLocationFormData({
                        ...locationFormData,
                        columnNumber: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="VD: 1, 2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Diện tích (m²) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={locationFormData.quantity}
                  onChange={(e) =>
                    setLocationFormData({
                      ...locationFormData,
                      quantity: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="Nhập diện tích"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Trạng thái
                </label>
                <select
                  value={locationFormData.status}
                  onChange={(e) =>
                    setLocationFormData({
                      ...locationFormData,
                      status: e.target.value as "ACTIVE" | "INACTIVE",
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  aria-label="Trạng thái vị trí"
                >
                  <option value="ACTIVE">Đang hoạt động</option>
                  <option value="INACTIVE">Không hoạt động</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Mô tả
                </label>
                <textarea
                  value={locationFormData.description}
                  onChange={(e) =>
                    setLocationFormData({
                      ...locationFormData,
                      description: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  rows={3}
                  placeholder="Nhập mô tả"
                />
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex gap-3">
              <button
                onClick={() => setLocationFormOpen(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleSaveLocation}
                disabled={submitting}
                className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {locationFormMode === "create" ? "Tạo vị trí" : "Lưu"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
