/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import {
  Package,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
  Calendar,
  FileText,
  MapPin,
  Warehouse,
  Send,
  Minus,
  Plus,
  Info,
  X,
} from "lucide-react";
import inventoryService from "@/service/inventoryService";
import warehousesService from "@/service/warehousesService";
import { authService } from "@/service/authService";
import { productService } from "@/service/productService";
import { useToast } from "@/context/ToastContext";
import { useConfirm } from "@/context/ConfirmContext";
import WarehouseZoneLocationSelector from "./components/WarehouseZoneLocationSelector";
import CustomDropdown from "@/components/CustomDropdown";

interface LocationItem {
  createdAt: string;
  updatedAt: string;
  isDeleted: boolean;
  id: string;
  rowLabel: number;
  columnNumber: number;
  code: string;
  description: string;
  status: "ACTIVE" | "INACTIVE";
  quantity: number;
}

interface TransferItem {
  id: number;
  quantity: number;
  productColorId: string;
  productName: string;
  reservedQuantity: number;
  locationItem: LocationItem;
  locationId: string;
  inventoryId: number;
}

interface ProductColorDetail {
  id: string;
  color: {
    id: string;
    colorName: string;
    hexCode: string;
  };
  images: Array<{
    id: string;
    image: string;
  }>;
  status: string;
}

interface InventoryLocationDetail {
  locationItemId: string;
  warehouseId: string;
  warehouseName: string;
  zoneId: string;
  zoneName: string;
  locationCode: string;
  available: number;
  reserved: number;
}

interface TransferRequest {
  id: number;
  employeeId: string;
  type: "IN" | "OUT" | "TRANSFER";
  purpose: string;
  date: string;
  note: string;
  warehouseName: string;
  warehouseId: string;
  toWarehouseName?: string;
  toWarehouseId?: string;
  orderId: number;
  transferStatus:
  | "PENDING"
  | "ACCEPTED"
  | "FINISHED"
  | "REJECTED"
  | "PENDING_CONFIRM";
  itemResponseList: TransferItem[];
}

interface Warehouse {
  id: string;
  name: string;
  address: string;
  storeId: string;
}

export default function TransferRequestsPage() {
  const { showToast } = useToast();
  const confirm = useConfirm();
  const [requests, setRequests] = useState<TransferRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [productColors, setProductColors] = useState<
    Map<string, ProductColorDetail>
  >(new Map());
  const [processingIds, setProcessingIds] = useState<Set<number>>(new Set());
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  // Modal xuất kho
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedRequest, setSelectedRequest] =
    useState<TransferRequest | null>(null);
  const [toWarehouseId, setToWarehouseId] = useState<string | null>(null);
  const [selectedLocations, setSelectedLocations] = useState<
    Record<string, { locationItemId: string; quantity: number }[]>
  >({});
  const [locationsByProduct, setLocationsByProduct] = useState<
    Record<string, InventoryLocationDetail[]>
  >({});
  const [loadingLocations, setLoadingLocations] = useState(false);
  const [exportNote, setExportNote] = useState("");
  const [exportingStock, setExportingStock] = useState(false);

  // Modal nhập kho (cho PENDING_CONFIRM)
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedImportRequest, setSelectedImportRequest] =
    useState<TransferRequest | null>(null);
  const [importLocations, setImportLocations] = useState<
    Record<
      string,
      { zoneId: string | null; locationId: string | null; locationCode: string }
    >
  >({});
  const [importLocationTypes, setImportLocationTypes] = useState<
    Record<string, "existing" | "new">
  >({});
  const [existingLocations, setExistingLocations] = useState<
    Record<
      string,
      Array<{
        locationId: string;
        locationCode: string;
        quantity: number;
        zoneId: string;
        zoneName: string;
      }>
    >
  >({});
  const [importNote, setImportNote] = useState("");
  const [importingStock, setImportingStock] = useState(false);
  const [currentWarehouseId, setCurrentWarehouseId] = useState<string | null>(
    null
  );
  const [currentStoreId, setCurrentStoreId] = useState<string | null>(null);
  const [loadingExistingLocations, setLoadingExistingLocations] =
    useState(false);

  useEffect(() => {
    loadWarehouseAndRequests();
  }, []);

  const loadProductColors = async (items: TransferItem[]) => {
    const colorIds = items.map((item) => item.productColorId);
    const newColors = new Map(productColors);

    for (const colorId of colorIds) {
      if (!newColors.has(colorId)) {
        try {
          const res = await productService.getProductColorById(colorId);
          const colorData = res.data?.data || res.data;
          if (colorData) {
            newColors.set(colorId, colorData);
          }
        } catch (err) {
          console.error(`Failed to load product color ${colorId}:`, err);
        }
      }
    }

    setProductColors(newColors);
  };

  // Load product color details when requests are loaded
  useEffect(() => {
    if (requests.length > 0) {
      // Load tất cả product colors ngay khi có requests
      const allItems = requests.flatMap((r) => r.itemResponseList);
      loadProductColors(allItems);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requests]);

  const loadWarehouseAndRequests = async () => {
    try {
      setLoading(true);
      setError(null);

      const storeId = authService.getStoreId();
      if (!storeId) {
        setError("Không tìm thấy thông tin cửa hàng");
        setLoading(false);
        return;
      }

      // Lấy warehouse của store
      const warehouseRes = await warehousesService.getWarehouseByStore(storeId);
      const warehouseData = warehouseRes.data?.data || warehouseRes.data;

      if (!warehouseData || !warehouseData.id) {
        setError("Chưa có kho hàng. Vui lòng tạo kho trước.");
        setLoading(false);
        return;
      }

      // Lưu warehouse ID và storeId
      setCurrentWarehouseId(warehouseData.id);
      setCurrentStoreId(storeId);

      // Lấy danh sách yêu cầu chuyển kho đang chờ
      const transferRes = await inventoryService.getPendingTransfers(
        warehouseData.id
      );
      const transferData = transferRes.data?.data || transferRes.data || [];

      // Lọc chỉ các phiếu TRANSFER (loại bỏ EXPORT, IMPORT, RESERVE)
      const transferOnly = Array.isArray(transferData)
        ? transferData.filter(
          (item: TransferRequest) => item.type === "TRANSFER"
        )
        : [];

      // Sắp xếp: PENDING lên đầu, sau đó theo id giảm dần (mới nhất lên trước)
      const sortedData = transferOnly.sort((a, b) => {
        // Ưu tiên PENDING lên đầu
        if (a.transferStatus === "PENDING" && b.transferStatus !== "PENDING")
          return -1;
        if (a.transferStatus !== "PENDING" && b.transferStatus === "PENDING")
          return 1;
        // Cùng status thì sắp xếp theo id giảm dần
        return b.id - a.id;
      });

      setRequests(sortedData);
    } catch (err: any) {
      console.error("Error loading transfer requests:", err);
      if (err?.response?.status === 404) {
        setRequests([]);
      } else {
        setError(
          err?.response?.data?.message ||
          err?.message ||
          "Không thể tải danh sách yêu cầu chuyển kho"
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleStatusFilter = (status: string) => {
    setStatusFilter((prev) => (prev === status ? null : status));
  };

  const handleApproveOrReject = async (
    inventoryId: number,
    action: "ACCEPTED" | "REJECTED"
  ) => {
    // Nếu là duyệt, mở modal xuất kho
    if (action === "ACCEPTED") {
      const request = requests.find((r) => r.id === inventoryId);
      if (request) {
        // Load thông tin màu sắc sản phẩm trước khi mở modal
        await loadProductColors(request.itemResponseList);

        setSelectedRequest(request);
        // Set kho đích từ API (nếu có)
        setToWarehouseId(request.toWarehouseId || null);
        setSelectedLocations({});
        setExportNote("");
        setShowExportModal(true);
        await loadLocationsForTransfer(request);
      }
      return;
    }

    // Nếu là từ chối, xử lý trực tiếp
    const actionText = "từ chối";
    const isConfirmed = await confirm({
      title: "Từ chối phiếu",
      message: `Bạn có chắc chắn muốn ${actionText} phiếu này?`,
      confirmLabel: "Từ chối",
      variant: "danger"
    });

    if (!isConfirmed) {
      return;
    }

    setProcessingIds((prev) => new Set(prev).add(inventoryId));

    try {
      await inventoryService.approveOrRejectTransfer(inventoryId, action);
      await loadWarehouseAndRequests();
      showToast({
        type: "success",
        title: "Thành công",
        description: `${actionText.charAt(0).toUpperCase() + actionText.slice(1)
          } phiếu thành công!`,
      });
    } catch (err: any) {
      console.error(`Error ${actionText} transfer:`, err);
      showToast({
        type: "error",
        title: "Lỗi",
        description:
          err?.response?.data?.message ||
          err?.message ||
          `Không thể ${actionText} phiếu`,
      });
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(inventoryId);
        return next;
      });
    }
  };

  const handleFinish = async (inventoryId: number) => {
    const isConfirmed = await confirm({
      title: "Hoàn thành phiếu",
      message: "Bạn có chắc chắn muốn hoàn thành phiếu này không?",
      confirmLabel: "Hoàn thành",
      variant: "success"
    });

    if (!isConfirmed) {
      return;
    }

    setProcessingIds((prev) => new Set(prev).add(inventoryId));

    try {
      await inventoryService.approveOrRejectTransfer(inventoryId, "FINISHED");
      await loadWarehouseAndRequests();

      showToast({
        type: "success",
        title: "Thành công",

        description: "Hoàn thành phiếu thành công!",
      });
    } catch (err: any) {
      showToast({
        type: "error",
        title: "Lỗi",
        description:
          err?.response?.data?.message ||
          err?.message ||
          "Không thể hoàn thành phiếu",
      });
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(inventoryId);
        return next;
      });
    }
  };

  // Load danh sách vị trí trong kho nguồn để chọn lấy hàng
  const loadLocationsForTransfer = async (request: TransferRequest) => {
    setLoadingLocations(true);
    try {
      const locationsMap: Record<string, InventoryLocationDetail[]> = {};
      const storeId = authService.getStoreId();

      if (!storeId) {
        showToast({
          type: "error",
          title: "Lỗi",
          description: "Không tìm thấy thông tin cửa hàng",
        });
        setLoadingLocations(false);
        return;
      }

      for (const item of request.itemResponseList) {
        const response = await inventoryService.getLocationsByWarehouse({
          productColorId: item.productColorId.toString(),
          storeId,
        });

        // Lọc ra các vị trí trong kho nguồn (warehouseId)
        const allLocations = response.data.data.locations || [];
        const sourceWarehouseLocations = allLocations.filter(
          (loc: InventoryLocationDetail) =>
            loc.warehouseId === request.warehouseId
        );

        locationsMap[item.productColorId] = sourceWarehouseLocations;
      }

      setLocationsByProduct(locationsMap);
      setSelectedLocations({}); // Reset selections
    } catch (err) {
      console.error("Error loading locations:", err);
      showToast({
        type: "error",
        title: "Lỗi",
        description: "Không thể tải danh sách vị trí kho",
      });
    } finally {
      setLoadingLocations(false);
    }
  };

  // Hàm xử lý xuất kho
  const handleExportStock = async () => {
    if (!selectedRequest) return;

    // Validate kho đích
    if (!toWarehouseId) {
      showToast({
        type: "error",
        title: "Lỗi",
        description: "Vui lòng chọn kho đích",
      });
      return;
    }

    // Validate: Kiểm tra tất cả sản phẩm đã chọn đủ số lượng chưa
    const invalidProducts = [];
    for (const item of selectedRequest.itemResponseList) {
      const selected = selectedLocations[item.productColorId] || [];
      const totalSelected = selected.reduce(
        (sum, loc) => sum + loc.quantity,
        0
      );

      if (totalSelected < item.quantity) {
        invalidProducts.push(
          `${item.productName}: cần ${item.quantity}, đã chọn ${totalSelected}`
        );
      }
    }

    if (invalidProducts.length > 0) {
      showToast({
        type: "error",
        title: "Chưa chọn đủ số lượng",
        description: invalidProducts.join("; "),
      });
      return;
    }

    setExportingStock(true);
    setProcessingIds((prev) => new Set(prev).add(selectedRequest.id));

    try {
      // Tạo phiếu xuất kho
      const items = selectedRequest.itemResponseList.flatMap((item) => {
        const locs = selectedLocations[item.productColorId] || [];
        return locs.map((loc) => ({
          productColorId: item.productColorId,
          quantity: loc.quantity,
          locationItemId: loc.locationItemId, // vị trí nguồn
        }));
      });

      await inventoryService.createOrUpdateInventory({
        type: "EXPORT",
        purpose: "MOVE",
        note: exportNote || `Xuất điều chuyển cho phiếu #${selectedRequest.id}`,
        warehouseId: selectedRequest.warehouseId,
        toWarehouseId: toWarehouseId,
        items,
      });

      // Duyệt phiếu chuyển kho
      await inventoryService.approveOrRejectTransfer(
        selectedRequest.id,
        "ACCEPTED"
      );

      showToast({
        type: "success",
        title: "Thành công",
        description: "Xuất kho và duyệt phiếu thành công!",
      });

      setShowExportModal(false);
      setSelectedRequest(null);
      setToWarehouseId(null);
      setSelectedLocations({});
      setLocationsByProduct({});
      setExportNote("");
      await loadWarehouseAndRequests();
    } catch (err: any) {
      console.error("Error exporting stock:", err);
      showToast({
        type: "error",
        title: "Lỗi",
        description:
          err?.response?.data?.message || err?.message || "Không thể xuất kho",
      });
    } finally {
      setExportingStock(false);
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(selectedRequest.id);
        return next;
      });
    }
  };

  // Load vị trí có sẵn cho các sản phẩm
  const loadExistingLocationsForProducts = async (itemList: TransferItem[]) => {
    if (!currentStoreId) {
      console.warn("Cannot load existing locations: currentStoreId is null");
      return;
    }

    console.log(
      "Loading existing locations for products:",
      itemList.map((i) => i.productColorId)
    );
    console.log("Using storeId:", currentStoreId);

    setLoadingExistingLocations(true);
    try {
      const locationsMap: Record<
        string,
        Array<{
          locationId: string;
          locationCode: string;
          quantity: number;
          zoneId: string;
          zoneName: string;
        }>
      > = {};

      for (const item of itemList) {
        try {
          const response = await inventoryService.getLocationsByWarehouse({
            productColorId: item.productColorId,
            storeId: currentStoreId, // Dùng storeId thay vì warehouseId
          });

          console.log(
            `Response for product ${item.productColorId}:`,
            response.data
          );

          // API trả về response.data.data.locations (nested data object)
          const responseData = response.data?.data || response.data;
          if (
            responseData?.locations &&
            Array.isArray(responseData.locations)
          ) {
            locationsMap[item.productColorId] = responseData.locations.map(
              (loc: any) => ({
                locationId: loc.locationItemId,
                locationCode: loc.locationCode,
                quantity: loc.available || 0,
                zoneId: loc.zoneId,
                zoneName: loc.zoneName,
              })
            );
            console.log(
              `Mapped ${locationsMap[item.productColorId].length
              } locations for product ${item.productColorId}`
            );
          } else {
            locationsMap[item.productColorId] = [];
            console.log(
              `No locations in response for product ${item.productColorId}`
            );
          }
        } catch (error: any) {
          // Nếu API trả về 404 hoặc lỗi khác, mặc định là không có vị trí sẵn
          if (error?.response?.status === 404) {
            console.log(
              `No existing locations found for product ${item.productColorId}`
            );
          } else {
            console.error(
              `Error loading locations for product ${item.productColorId}:`,
              error
            );
          }
          locationsMap[item.productColorId] = [];
        }
      }

      console.log("Final locationsMap:", locationsMap);
      setExistingLocations(locationsMap);

      // Set mặc định: nếu có vị trí sẵn thì chọn 'existing', không thì 'new'
      const defaultTypes: Record<string, "existing" | "new"> = {};
      itemList.forEach((item) => {
        defaultTypes[item.productColorId] =
          locationsMap[item.productColorId]?.length > 0 ? "existing" : "new";
      });
      console.log("Default location types:", defaultTypes);
      setImportLocationTypes(defaultTypes);
    } catch (error) {
      console.error("Error loading existing locations:", error);
      // Mặc định tất cả là 'new' nếu có lỗi
      const defaultTypes: Record<string, "existing" | "new"> = {};
      itemList.forEach((item) => {
        defaultTypes[item.productColorId] = "new";
      });
      setImportLocationTypes(defaultTypes);
    } finally {
      setLoadingExistingLocations(false);
    }
  };

  // Handler nhập kho (cho PENDING_CONFIRM)
  const handleImportStock = async () => {
    if (!selectedImportRequest || !currentWarehouseId) return;

    // Validate: Kiểm tra tất cả sản phẩm đã chọn vị trí chưa
    const missingLocations = selectedImportRequest.itemResponseList.filter(
      (item) => {
        const loc = importLocations[item.productColorId];
        return !loc || !loc.locationId;
      }
    );

    if (missingLocations.length > 0) {
      showToast({
        type: "error",
        title: "Thiếu vị trí",
        description: "Vui lòng chọn vị trí nhập kho cho tất cả sản phẩm",
      });
      return;
    }

    setImportingStock(true);
    setProcessingIds((prev) => new Set(prev).add(selectedImportRequest.id));

    try {
      // Tạo phiếu nhập kho từ transfer request
      const items = selectedImportRequest.itemResponseList.map((item) => {
        const loc = importLocations[item.productColorId];
        return {
          productColorId: item.productColorId,
          quantity: item.quantity,
          locationItemId: loc.locationId!,
        };
      });

      await inventoryService.createOrUpdateInventory({
        type: "IMPORT",
        purpose: "MOVE",
        note:
          importNote || `Nhập kho từ phiếu chuyển #${selectedImportRequest.id}`,
        warehouseId: currentWarehouseId,
        toWarehouseId: selectedImportRequest.warehouseId, // kho nguồn
        transferId: selectedImportRequest.id.toString(),
        items,
      });

      // Cập nhật trạng thái phiếu chuyển thành FINISHED
      await inventoryService.approveOrRejectTransfer(
        selectedImportRequest.id,
        "FINISHED"
      );

      showToast({
        type: "success",
        title: "Thành công",
        description: "Nhập kho thành công và đã hoàn thành phiếu chuyển!",
      });

      setShowImportModal(false);
      setSelectedImportRequest(null);
      setImportLocations({});
      setImportLocationTypes({});
      setExistingLocations({});
      setImportNote("");
      await loadWarehouseAndRequests();
    } catch (err: any) {
      console.error("Error importing stock:", err);
      showToast({
        type: "error",
        title: "Lỗi",
        description:
          err?.response?.data?.message || err?.message || "Không thể nhập kho",
      });
    } finally {
      setImportingStock(false);
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(selectedImportRequest.id);
        return next;
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "ACCEPTED":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
      case "PENDING_CONFIRM":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400";
      case "FINISHED":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "REJECTED":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Clock className="w-4 h-4" />;
      case "ACCEPTED":
        return <CheckCircle className="w-4 h-4" />;
      case "PENDING_CONFIRM":
        return <Package className="w-4 h-4" />;
      case "FINISHED":
        return <CheckCircle className="w-4 h-4" />;
      case "REJECTED":
        return <XCircle className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "PENDING":
        return "Chờ duyệt";
      case "ACCEPTED":
        return "Đã chấp nhận";
      case "PENDING_CONFIRM":
        return "Đơn yêu cầu đã đến";
      case "FINISHED":
        return "Hoàn thành";
      case "REJECTED":
        return "Đã từ chối";
      default:
        return status;
    }
  };

  const getPurposeText = (purpose: string) => {
    switch (purpose) {
      case "STOCK_IN":
        return "Nhập kho";
      case "BS_STOCK":
        return "Bán hàng";
      case "TRANSFER":
        return "Chuyển kho";
      default:
        return purpose;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex items-center gap-2 text-gray-500">
          <Loader2 className="w-5 h-5 animate-spin" />
          Đang tải danh sách yêu cầu...
        </div>
      </div>
    );
  }

  if (error) {
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
            <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
            <button
              onClick={loadWarehouseAndRequests}
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

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Breadcrumb */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Yêu cầu chuyển kho đang chờ
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Quản lý / Danh sách chờ chuyển kho
        </p>
      </div>

      {/* Stats - Filter Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4 mb-6">
        <button
          onClick={() => toggleStatusFilter("PENDING")}
          className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border-2 p-3 sm:p-4 transition-all hover:shadow-md active:scale-95 ${statusFilter === "PENDING"
            ? "border-yellow-500 dark:border-yellow-400 ring-2 ring-yellow-200 dark:ring-yellow-900/50"
            : "border-gray-200 dark:border-gray-700 hover:border-yellow-300"
            }`}
        >
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-2 sm:p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg shrink-0">
              <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className="text-left min-w-0">
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">
                Chờ duyệt
              </p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                {requests.filter((r) => r.transferStatus === "PENDING").length}
              </p>
            </div>
          </div>
        </button>

        <button
          onClick={() => toggleStatusFilter("ACCEPTED")}
          className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border-2 p-3 sm:p-4 transition-all hover:shadow-md active:scale-95 ${statusFilter === "ACCEPTED"
            ? "border-blue-500 dark:border-blue-400 ring-2 ring-blue-200 dark:ring-blue-900/50"
            : "border-gray-200 dark:border-gray-700 hover:border-blue-300"
            }`}
        >
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-2 sm:p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg shrink-0">
              <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="text-left min-w-0">
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">
                Đã chấp nhận
              </p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                {requests.filter((r) => r.transferStatus === "ACCEPTED").length}
              </p>
            </div>
          </div>
        </button>

        <button
          onClick={() => toggleStatusFilter("PENDING_CONFIRM")}
          className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border-2 p-3 sm:p-4 transition-all hover:shadow-md active:scale-95 ${statusFilter === "PENDING_CONFIRM"
            ? "border-purple-500 dark:border-purple-400 ring-2 ring-purple-200 dark:ring-purple-900/50"
            : "border-gray-200 dark:border-gray-700 hover:border-purple-300"
            }`}
        >
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-2 sm:p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg shrink-0">
              <Package className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="text-left min-w-0">
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">
                Đã đến
              </p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                {
                  requests.filter((r) => r.transferStatus === "PENDING_CONFIRM")
                    .length
                }
              </p>
            </div>
          </div>
        </button>

        <button
          onClick={() => toggleStatusFilter("FINISHED")}
          className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border-2 p-3 sm:p-4 transition-all hover:shadow-md active:scale-95 ${statusFilter === "FINISHED"
            ? "border-green-500 dark:border-green-400 ring-2 ring-green-200 dark:ring-green-900/50"
            : "border-gray-200 dark:border-gray-700 hover:border-green-300"
            }`}
        >
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-2 sm:p-3 bg-green-100 dark:bg-green-900/30 rounded-lg shrink-0">
              <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="text-left min-w-0">
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">
                Hoàn thành
              </p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                {requests.filter((r) => r.transferStatus === "FINISHED").length}
              </p>
            </div>
          </div>
        </button>

        <button
          onClick={() => toggleStatusFilter("REJECTED")}
          className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border-2 p-3 sm:p-4 transition-all hover:shadow-md active:scale-95 ${statusFilter === "REJECTED"
            ? "border-red-500 dark:border-red-400 ring-2 ring-red-200 dark:ring-red-900/50"
            : "border-gray-200 dark:border-gray-700 hover:border-red-300"
            }`}
        >
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-2 sm:p-3 bg-red-100 dark:bg-red-900/30 rounded-lg shrink-0">
              <XCircle className="w-5 h-5 sm:w-6 sm:h-6 text-red-600 dark:text-red-400" />
            </div>
            <div className="text-left min-w-0">
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">
                Đã từ chối
              </p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                {requests.filter((r) => r.transferStatus === "REJECTED").length}
              </p>
            </div>
          </div>
        </button>
      </div>

      {/* Requests List */}
      {(() => {
        const filteredRequests = statusFilter
          ? requests.filter((r) => r.transferStatus === statusFilter)
          : requests;

        return filteredRequests.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Không có yêu cầu chuyển kho
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Hiện tại chưa có yêu cầu chuyển kho nào đang chờ duyệt
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRequests.map((request) => (
              <div
                key={request.id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
              >
                {/* Header */}
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <div
                    className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors -m-4 p-4"
                    onClick={() => toggleExpand(request.id)}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-3 flex-wrap">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Phiếu #{request.id}
                          </h3>
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                              request.transferStatus
                            )}`}
                          >
                            {getStatusIcon(request.transferStatus)}
                            {getStatusText(request.transferStatus)}
                          </span>
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                            {getPurposeText(request.purpose)}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                            <MapPin className="w-4 h-4" />
                            <span>{request.warehouseName}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                            <Calendar className="w-4 h-4" />
                            <span>
                              {new Date(request.date).toLocaleDateString(
                                "vi-VN"
                              )}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                            <Package className="w-4 h-4" />
                            <span>
                              {request.itemResponseList.length} sản phẩm
                            </span>
                          </div>
                        </div>

                        {request.note && (
                          <div className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <FileText className="w-4 h-4 mt-0.5 shrink-0" />
                            <span>{request.note}</span>
                          </div>
                        )}
                      </div>

                      <div className="shrink-0">
                        {expandedIds.has(request.id) ? (
                          <ChevronUp className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Danh sách sản phẩm hiển thị luôn - Bên ngoài click handler */}
                  <div className="mt-4 space-y-2">
                    <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-2">
                      Danh sách sản phẩm
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {request.itemResponseList.map((item) => {
                        const productColor = productColors.get(
                          item.productColorId
                        );
                        return (
                          <div
                            key={item.id}
                            className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700"
                          >
                            {productColor?.images?.[0]?.image && (
                              <img
                                src={productColor.images[0].image}
                                alt={item.productName}
                                className="w-12 h-12 object-cover rounded border border-gray-200 dark:border-gray-600"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-gray-900 dark:text-white truncate">
                                {item.productName}
                              </p>
                              {productColor?.color && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                  {productColor.color.colorName}
                                </p>
                              )}
                              <p className="text-xs font-semibold text-purple-600 dark:text-purple-400">
                                SL: {item.quantity}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  {request.transferStatus === "PENDING" && (
                    <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleApproveOrReject(request.id, "ACCEPTED");
                        }}
                        disabled={processingIds.has(request.id)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white rounded-lg text-sm font-medium transition-colors disabled:cursor-not-allowed"
                      >
                        {processingIds.has(request.id) ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Đang xử lý...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4" />
                            Duyệt phiếu
                          </>
                        )}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleApproveOrReject(request.id, "REJECTED");
                        }}
                        disabled={processingIds.has(request.id)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg text-sm font-medium transition-colors disabled:cursor-not-allowed"
                      >
                        {processingIds.has(request.id) ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Đang xử lý...
                          </>
                        ) : (
                          <>
                            <XCircle className="w-4 h-4" />
                            Từ chối
                          </>
                        )}
                      </button>
                    </div>
                  )}
                  {request.transferStatus === "PENDING_CONFIRM" && (
                    <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedImportRequest(request);
                          setShowImportModal(true);
                          loadExistingLocationsForProducts(
                            request.itemResponseList
                          );
                        }}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors"
                      >
                        <Package className="w-4 h-4" />
                        Nhập hàng
                      </button>
                    </div>
                  )}
                  {request.transferStatus === "ACCEPTED" && (
                    <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleFinish(request.id);
                        }}
                        disabled={processingIds.has(request.id)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg text-sm font-medium transition-colors disabled:cursor-not-allowed"
                      >
                        {processingIds.has(request.id) ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Đang xử lý...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4" />
                            Hoàn thành
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {/* Expanded Details */}
                <div
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${expandedIds.has(request.id)
                    ? "max-h-[2000px] opacity-100"
                    : "max-h-0 opacity-0"
                    }`}
                >
                  <div className="p-4 bg-gray-50 dark:bg-gray-900">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                      Chi tiết sản phẩm
                    </h4>
                    <div className="space-y-3">
                      {request.itemResponseList.map((item) => {
                        const colorDetail = productColors.get(
                          item.productColorId
                        );
                        const imageUrl = colorDetail?.images?.[0]?.image;

                        return (
                          <div
                            key={item.id}
                            className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700"
                          >
                            <div className="flex items-start gap-3">
                              {/* Product Image */}
                              {imageUrl ? (
                                <img
                                  src={imageUrl}
                                  alt={item.productName}
                                  className="w-16 h-16 object-cover rounded-lg border border-gray-200 dark:border-gray-700 shrink-0"
                                />
                              ) : (
                                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center shrink-0">
                                  <Package className="w-8 h-8 text-gray-400" />
                                </div>
                              )}

                              {/* Product Info */}
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-900 dark:text-white">
                                  {item.productName}
                                </p>

                                {/* Color Info */}
                                {colorDetail && (
                                  <div className="flex items-center gap-2 mt-1">
                                    <span
                                      className="w-4 h-4 rounded-full border border-gray-300 dark:border-gray-600"
                                      style={{
                                        backgroundColor:
                                          colorDetail.color.hexCode,
                                      }}
                                    />
                                    <span className="text-sm text-gray-600 dark:text-gray-400">
                                      {colorDetail.color.colorName}
                                    </span>
                                  </div>
                                )}

                                {/* Quantity and Location */}
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-gray-600 dark:text-gray-400">
                                  {item.locationItem && (
                                    <span className="flex items-center gap-1">
                                      <MapPin className="w-3.5 h-3.5" />
                                      {item.locationItem.code}
                                    </span>
                                  )}
                                  <span className="flex items-center gap-1">
                                    <Package className="w-3.5 h-3.5" />
                                    SL: {item.quantity}
                                  </span>
                                  {item.reservedQuantity > 0 && (
                                    <span className="text-yellow-600 dark:text-yellow-400 font-medium">
                                      Đã đặt: {item.reservedQuantity}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        );
      })()}

      {/* Modal Xuất Kho */}
      {showExportModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Send className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Xuất Kho Điều Chuyển
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowExportModal(false);
                  setSelectedRequest(null);
                  setToWarehouseId(null);
                  setSelectedLocations({});
                  setLocationsByProduct({});
                  setExportNote("");
                }}
                disabled={exportingStock}
                aria-label="Đóng modal"
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Thông tin phiếu */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                      Phiếu chuyển kho #{selectedRequest.id}
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-blue-700 dark:text-blue-300">
                          Kho nguồn:
                        </span>
                        <p className="font-medium text-blue-900 dark:text-blue-100">
                          {selectedRequest.warehouseName}
                        </p>
                      </div>
                      <div>
                        <span className="text-blue-700 dark:text-blue-300">
                          Số lượng sản phẩm:
                        </span>
                        <p className="font-medium text-blue-900 dark:text-blue-100">
                          {selectedRequest.itemResponseList.length} sản phẩm
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Kho đích */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Kho đích <span className="text-red-500">*</span>
                </label>
                {selectedRequest.toWarehouseId ? (
                  <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Warehouse className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      <span className="font-medium text-gray-900 dark:text-white">
                        {selectedRequest.toWarehouseName || "Kho đích"}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Kho đích đã được chỉ định trong yêu cầu chuyển kho
                    </p>
                  </div>
                ) : (
                  <>
                    <WarehouseZoneLocationSelector
                      labelPrefix=""
                      selectedWarehouseId={toWarehouseId}
                      selectedZoneId={null}
                      selectedLocationId={null}
                      onWarehouseChange={(id) => setToWarehouseId(id)}
                      onZoneChange={() => { }}
                      onLocationChange={() => { }}
                      disabled={exportingStock || loadingLocations}
                      hideZoneAndLocation={true}
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Chọn kho để chuyển hàng đến (không bao gồm kho nguồn)
                    </p>
                  </>
                )}
              </div>

              {/* Loading locations */}
              {loadingLocations && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                  <span className="ml-3 text-gray-600 dark:text-gray-400">
                    Đang tải danh sách vị trí...
                  </span>
                </div>
              )}

              {/* Danh sách sản phẩm và chọn vị trí */}
              {!loadingLocations &&
                selectedRequest.itemResponseList.map((item) => {
                  const colorDetail = productColors.get(item.productColorId);
                  const imageUrl = colorDetail?.images?.[0]?.image;
                  const locations =
                    locationsByProduct[item.productColorId] || [];
                  const selectedLocs =
                    selectedLocations[item.productColorId] || [];
                  const totalSelected = selectedLocs.reduce(
                    (sum, loc) => sum + loc.quantity,
                    0
                  );
                  const remaining = item.quantity - totalSelected;

                  return (
                    <div
                      key={item.id}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-4"
                    >
                      {/* Product Header */}
                      <div className="flex items-start gap-3 pb-3 border-b border-gray-200 dark:border-gray-700">
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={item.productName}
                            className="w-16 h-16 object-cover rounded border border-gray-200 dark:border-gray-600"
                          />
                        ) : (
                          <div className="w-16 h-16 bg-gray-200 dark:bg-gray-600 rounded flex items-center justify-center">
                            <Package className="w-8 h-8 text-gray-400" />
                          </div>
                        )}
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 dark:text-white">
                            {item.productName}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Màu: {colorDetail?.color.colorName || "N/A"}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-sm">
                            <span className="text-gray-600 dark:text-gray-400">
                              Cần xuất: <strong>{item.quantity}</strong>
                            </span>
                            <span
                              className={
                                remaining > 0
                                  ? "text-orange-600 dark:text-orange-400 font-medium"
                                  : "text-green-600 dark:text-green-400 font-medium"
                              }
                            >
                              Đã chọn: <strong>{totalSelected}</strong>
                            </span>
                            {remaining > 0 && (
                              <span className="text-red-600 dark:text-red-400 font-medium">
                                Còn thiếu: <strong>{remaining}</strong>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Locations List */}
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Chọn vị trí kho đích:
                        </h4>
                        {locations.length === 0 ? (
                          <p className="text-sm text-red-600 dark:text-red-400 p-3 bg-red-50 dark:bg-red-900/20 rounded">
                            Không có vị trí khả dụng trong kho khác!
                          </p>
                        ) : (
                          <div className="space-y-2">
                            {locations.map((loc) => {
                              const selectedLoc = selectedLocs.find(
                                (s) => s.locationItemId === loc.locationItemId
                              );
                              const selectedQty = selectedLoc?.quantity || 0;
                              const maxQty = Math.min(
                                loc.available + loc.reserved,
                                remaining + selectedQty
                              );

                              return (
                                <div
                                  key={loc.locationItemId}
                                  className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-gray-900/50 rounded"
                                >
                                  <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                                      {loc.warehouseName} - {loc.zoneName} -{" "}
                                      {loc.locationCode}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                      Khả dụng: {loc.available} | Đã giữ:{" "}
                                      {loc.reserved} |{" "}
                                      <span className="font-medium text-green-600 dark:text-green-400">
                                        Có thể nhận:{" "}
                                        {loc.available + loc.reserved}
                                      </span>
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const newQty = Math.max(
                                          0,
                                          selectedQty - 1
                                        );
                                        setSelectedLocations((prev) => {
                                          const updated = { ...prev };
                                          const productLocs = [
                                            ...(updated[item.productColorId] ||
                                              []),
                                          ];
                                          const existingIndex =
                                            productLocs.findIndex(
                                              (s) =>
                                                s.locationItemId ===
                                                loc.locationItemId
                                            );

                                          if (newQty === 0) {
                                            if (existingIndex !== -1) {
                                              productLocs.splice(
                                                existingIndex,
                                                1
                                              );
                                            }
                                          } else {
                                            if (existingIndex !== -1) {
                                              productLocs[
                                                existingIndex
                                              ].quantity = newQty;
                                            } else {
                                              productLocs.push({
                                                locationItemId:
                                                  loc.locationItemId,
                                                quantity: newQty,
                                              });
                                            }
                                          }

                                          updated[item.productColorId] =
                                            productLocs;
                                          return updated;
                                        });
                                      }}
                                      disabled={
                                        selectedQty === 0 || exportingStock
                                      }
                                      className="p-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                      aria-label="Giảm số lượng"
                                    >
                                      <Minus className="h-4 w-4" />
                                    </button>

                                    <div className="min-w-12 text-center">
                                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                                        {selectedQty}
                                      </span>
                                    </div>

                                    <button
                                      type="button"
                                      onClick={() => {
                                        const newQty = Math.min(
                                          selectedQty + 1,
                                          maxQty
                                        );
                                        setSelectedLocations((prev) => {
                                          const updated = { ...prev };
                                          const productLocs = [
                                            ...(updated[item.productColorId] ||
                                              []),
                                          ];
                                          const existingIndex =
                                            productLocs.findIndex(
                                              (s) =>
                                                s.locationItemId ===
                                                loc.locationItemId
                                            );

                                          if (existingIndex !== -1) {
                                            productLocs[
                                              existingIndex
                                            ].quantity = newQty;
                                          } else {
                                            productLocs.push({
                                              locationItemId:
                                                loc.locationItemId,
                                              quantity: newQty,
                                            });
                                          }

                                          updated[item.productColorId] =
                                            productLocs;
                                          return updated;
                                        });
                                      }}
                                      disabled={
                                        selectedQty >= maxQty || exportingStock
                                      }
                                      className="p-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                      aria-label="Tăng số lượng"
                                    >
                                      <Plus className="h-4 w-4" />
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

              {/* Ghi chú */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Ghi chú
                </label>
                <textarea
                  value={exportNote}
                  onChange={(e) => setExportNote(e.target.value)}
                  disabled={exportingStock}
                  placeholder={`Xuất điều chuyển cho phiếu #${selectedRequest.id}`}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowExportModal(false);
                  setSelectedRequest(null);
                  setSelectedLocations({});
                  setLocationsByProduct({});
                  setExportNote("");
                }}
                disabled={exportingStock}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleExportStock}
                disabled={exportingStock}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
              >
                {exportingStock ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Xuất Kho & Duyệt
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Nhập Hàng (cho PENDING_CONFIRM) */}
      {showImportModal && selectedImportRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="sticky top-0 bg-linear-to-r from-purple-600 to-purple-700 text-white px-6 py-4 rounded-t-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Package className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Nhập Hàng</h3>
                  <p className="text-sm text-purple-100">
                    Phiếu chuyển #{selectedImportRequest.id} - Chọn vị trí nhập
                    kho
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowImportModal(false);
                  setSelectedImportRequest(null);
                  setImportLocations({});
                  setImportLocationTypes({});
                  setExistingLocations({});
                  setImportNote("");
                }}
                disabled={importingStock}
                aria-label="Đóng modal"
                className="p-2 hover:bg-white/20 rounded-lg transition-colors disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                <p className="text-sm text-purple-900 dark:text-purple-300">
                  <Info className="w-4 h-4 inline mr-2" />
                  Chọn vị trí kho để nhập từng sản phẩm. Vị trí có thể là vị trí
                  đang có sản phẩm hoặc vị trí trống.
                </p>
              </div>

              {/* Danh sách sản phẩm */}
              <div className="space-y-4">
                {selectedImportRequest.itemResponseList.map((item) => {
                  const productColor = productColors.get(item.productColorId);
                  const selectedLocation = importLocations[item.productColorId];

                  return (
                    <div
                      key={item.id}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-900/50"
                    >
                      <div className="flex gap-4 mb-4">
                        {/* Product Image */}
                        {productColor?.images?.[0]?.image && (
                          <img
                            src={productColor.images[0].image}
                            alt={item.productName}
                            className="w-20 h-20 object-cover rounded-lg border border-gray-200 dark:border-gray-600"
                          />
                        )}

                        {/* Product Info */}
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 dark:text-white">
                            {item.productName}
                          </h4>
                          {productColor?.color && (
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Màu: {productColor.color.colorName}
                            </p>
                          )}
                          <p className="text-sm font-medium text-purple-600 dark:text-purple-400 mt-1">
                            Số lượng: {item.quantity}
                          </p>
                        </div>
                      </div>

                      {/* Location Selector */}
                      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                          Chọn vị trí nhập kho{" "}
                          <span className="text-red-500">*</span>
                        </label>

                        {/* Radio buttons: Vị trí có sẵn / Vị trí mới */}
                        {loadingExistingLocations ? (
                          <div className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                            Đang tải vị trí có sẵn...
                          </div>
                        ) : (
                          <div className="flex gap-6 mb-4">
                            <label className="flex items-center cursor-pointer">
                              <input
                                type="radio"
                                name={`locationType-${item.productColorId}`}
                                value="existing"
                                checked={
                                  importLocationTypes[item.productColorId] ===
                                  "existing"
                                }
                                onChange={() => {
                                  setImportLocationTypes((prev) => ({
                                    ...prev,
                                    [item.productColorId]: "existing",
                                  }));
                                  // Reset location selection
                                  setImportLocations((prev) => ({
                                    ...prev,
                                    [item.productColorId]: {
                                      zoneId: null,
                                      locationId: null,
                                      locationCode: "",
                                    },
                                  }));
                                }}
                                disabled={
                                  importingStock ||
                                  existingLocations[item.productColorId]
                                    ?.length === 0
                                }
                                className="mr-2"
                              />
                              <span className="text-sm text-gray-700 dark:text-gray-300">
                                Vị trí có sẵn
                                {existingLocations[item.productColorId]
                                  ?.length > 0 && (
                                    <span className="ml-1 text-purple-600 dark:text-purple-400 font-medium">
                                      (
                                      {
                                        existingLocations[item.productColorId]
                                          .length
                                      }
                                      )
                                    </span>
                                  )}
                                {existingLocations[item.productColorId]
                                  ?.length === 0 && (
                                    <span className="ml-1 text-gray-400 text-xs">
                                      (Không có)
                                    </span>
                                  )}
                              </span>
                            </label>

                            <label className="flex items-center cursor-pointer">
                              <input
                                type="radio"
                                name={`locationType-${item.productColorId}`}
                                value="new"
                                checked={
                                  importLocationTypes[item.productColorId] ===
                                  "new"
                                }
                                onChange={() => {
                                  setImportLocationTypes((prev) => ({
                                    ...prev,
                                    [item.productColorId]: "new",
                                  }));
                                  // Reset location selection
                                  setImportLocations((prev) => ({
                                    ...prev,
                                    [item.productColorId]: {
                                      zoneId: null,
                                      locationId: null,
                                      locationCode: "",
                                    },
                                  }));
                                }}
                                disabled={importingStock}
                                className="mr-2"
                              />
                              <span className="text-sm text-gray-700 dark:text-gray-300">
                                Vị trí mới
                              </span>
                            </label>
                          </div>
                        )}

                        {/* Hiển thị selector tương ứng */}
                        {importLocationTypes[item.productColorId] ===
                          "existing" ? (
                          // Dropdown chọn vị trí có sẵn
                          <div>
                            <CustomDropdown
                              id={`location-${item.productColorId}`}
                              label=""
                              value={selectedLocation?.locationId || ""}
                              options={[
                                {
                                  value: "",
                                  label: "-- Chọn vị trí có sẵn --",
                                },
                                ...(
                                  existingLocations[item.productColorId] || []
                                ).map((loc) => ({
                                  value: loc.locationId,
                                  label: `${loc.locationCode} - ${loc.zoneName} (Tồn kho: ${loc.quantity})`,
                                })),
                              ]}
                              onChange={(locationId) => {
                                const selectedLoc = existingLocations[
                                  item.productColorId
                                ]?.find((loc) => loc.locationId === locationId);
                                if (selectedLoc) {
                                  setImportLocations((prev) => ({
                                    ...prev,
                                    [item.productColorId]: {
                                      zoneId: selectedLoc.zoneId,
                                      locationId: selectedLoc.locationId,
                                      locationCode: selectedLoc.locationCode,
                                    },
                                  }));
                                }
                              }}
                              placeholder="-- Chọn vị trí có sẵn --"
                              fullWidth
                            />
                            {selectedLocation?.locationCode && (
                              <div className="mt-2 text-sm text-green-600 dark:text-green-400">
                                ✓ Đã chọn: {selectedLocation.locationCode}
                              </div>
                            )}
                          </div>
                        ) : (
                          // WarehouseZoneLocationSelector cho vị trí mới
                          <div>
                            <WarehouseZoneLocationSelector
                              labelPrefix=""
                              onWarehouseChange={() => { }} // Warehouse đã được fix
                              onZoneChange={(zoneId) => {
                                setImportLocations((prev) => ({
                                  ...prev,
                                  [item.productColorId]: {
                                    ...prev[item.productColorId],
                                    zoneId,
                                    locationId: null,
                                    locationCode: "",
                                  },
                                }));
                              }}
                              onLocationChange={(locationId, locationCode) => {
                                setImportLocations((prev) => ({
                                  ...prev,
                                  [item.productColorId]: {
                                    ...prev[item.productColorId],
                                    locationId,
                                    locationCode: locationCode || "",
                                  },
                                }));
                              }}
                              selectedWarehouseId={currentWarehouseId}
                              selectedZoneId={selectedLocation?.zoneId || null}
                              selectedLocationId={
                                selectedLocation?.locationId || null
                              }
                              disabled={importingStock}
                              hideWarehouse={true}
                            />
                            {selectedLocation?.locationCode && (
                              <div className="mt-2 text-sm text-green-600 dark:text-green-400">
                                ✓ Đã chọn: {selectedLocation.locationCode}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Ghi chú */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Ghi chú
                </label>
                <textarea
                  value={importNote}
                  onChange={(e) => setImportNote(e.target.value)}
                  disabled={importingStock}
                  placeholder={`Nhập kho từ phiếu chuyển #${selectedImportRequest.id}`}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-end gap-3 rounded-b-2xl">
              <button
                onClick={() => {
                  setShowImportModal(false);
                  setSelectedImportRequest(null);
                  setImportLocations({});
                  setImportLocationTypes({});
                  setExistingLocations({});
                  setImportNote("");
                }}
                disabled={importingStock}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleImportStock}
                disabled={importingStock}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
              >
                {importingStock ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Xác nhận nhập kho
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
