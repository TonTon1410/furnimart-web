import {
  Package,
  FileText,
  CheckSquare,
  Users,
  Loader2,
  Search,
  X,
  Plus,
  Minus,
} from "lucide-react";
import { useEffect, useState } from "react";
import CustomDropdown from "../../../components/CustomDropdown";
import deliveryService from "@/service/deliveryService";
import type { DeliveryAssignment } from "@/service/deliveryService";
import { authService } from "@/service/authService";
import inventoryService from "@/service/inventoryService";
import type {
  InventoryLocationDetail,
  PendingReservationResponse,
  ReservedItemResponse,
} from "@/service/inventoryService";
import { useToast } from "@/context/ToastContext";

export default function DeliveryManagementPage() {
  const { showToast } = useToast();
  const [assignments, setAssignments] = useState<DeliveryAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [showStockOutModal, setShowStockOutModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] =
    useState<DeliveryAssignment | null>(null);
  const [locationsByProduct, setLocationsByProduct] = useState<
    Record<string, InventoryLocationDetail[]>
  >({});
  const [selectedLocations, setSelectedLocations] = useState<
    Record<string, { locationItemId: string; quantity: number }[]>
  >({});
  const [loadingLocations, setLoadingLocations] = useState(false);
  const [creatingStockOut, setCreatingStockOut] = useState(false);
  const [warehouseId, setWarehouseId] = useState<string | null>(null);
  const [preparingProducts, setPreparingProducts] = useState<number | null>(
    null
  );
  const [reservedItems, setReservedItems] = useState<
    Record<string, ReservedItemResponse[]>
  >({});
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [pendingOrderId, setPendingOrderId] = useState<number | null>(null);

  useEffect(() => {
    loadAssignments();
  }, []);

  const loadAssignments = async () => {
    try {
      setLoading(true);
      setError(null);

      // Lấy storeId từ authService
      const storeId = authService.getStoreId();

      if (!storeId) {
        setError("Không tìm thấy thông tin cửa hàng. Vui lòng đăng nhập lại.");
        setLoading(false);
        return;
      }

      console.log("Fetching assignments for store:", storeId);
      // API mới đã trả về đầy đủ thông tin order trong assignment
      const data = await deliveryService.getAssignmentsByStore(storeId);
      console.log("Assignments loaded:", data.length);
      setAssignments(data);
    } catch (err) {
      console.error("Error loading assignments:", err);
      setError(
        `Không thể tải danh sách đơn hàng: ${(err as Error).message || "Lỗi không xác định"
        }`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleOpenStockOutModal = async (assignment: DeliveryAssignment) => {
    setSelectedAssignment(assignment);
    setShowStockOutModal(true);
    setLoadingLocations(true);

    try {
      const storeId = authService.getStoreId();
      if (!storeId) {
        showToast({
          type: "warning",
          title: "Cảnh báo!",
          description: "Không tìm thấy thông tin cửa hàng. Vui lòng đăng nhập lại.",
        });
        setShowStockOutModal(false);
        return;
      }

      console.log("🔍 Loading locations for storeId:", storeId);

      // Lấy danh sách phiếu giữ hàng đang chờ xử lý
      const reservationsResponse =
        await inventoryService.getPendingReservations(storeId);
      const allReservations: PendingReservationResponse[] =
        reservationsResponse.data.data || [];

      // Lọc những phiếu giữ hàng của orderId hiện tại
      const currentOrderReservations = allReservations.filter(
        (res) => res.orderId === assignment.order.id
      );

      console.log(
        `📦 Found ${currentOrderReservations.length} reservations for order #${assignment.order.id}`
      );

      // Map hàng đã giữ theo productColorId
      const reservedMap: Record<string, ReservedItemResponse[]> = {};
      currentOrderReservations.forEach((reservation) => {
        reservation.itemResponseList.forEach((item) => {
          if (!reservedMap[item.productColorId]) {
            reservedMap[item.productColorId] = [];
          }
          reservedMap[item.productColorId].push(item);
        });
      });
      setReservedItems(reservedMap);

      // Lấy vị trí chứa hàng cho từng sản phẩm
      const locationsMap: Record<string, InventoryLocationDetail[]> = {};
      let firstWarehouseId: string | null = null;

      for (const detail of assignment.order.orderDetails) {
        console.log(
          `🔍 Fetching locations for productColorId: ${detail.productColorId}`
        );
        const response = await inventoryService.getLocationsByWarehouse({
          productColorId: detail.productColorId.toString(),
          storeId,
        });
        console.log(`✅ Locations response:`, response.data);

        const locations = response.data.data.locations || [];
        locationsMap[detail.productColorId] = locations;

        // Lưu warehouseId từ location đầu tiên (1 store chỉ có 1 warehouse)
        if (!firstWarehouseId && locations.length > 0) {
          firstWarehouseId = locations[0].warehouseId;
        }
      }

      console.log("✅ All locations loaded. WarehouseId:", firstWarehouseId);
      setLocationsByProduct(locationsMap);
      setWarehouseId(firstWarehouseId);

      // Initialize selected locations - Auto-select reserved items
      const initialSelections: Record<
        string,
        { locationItemId: string; quantity: number }[]
      > = {};
      assignment.order.orderDetails.forEach((detail) => {
        const reserved = reservedMap[detail.productColorId] || [];
        // Tự động chọn số lượng từ hàng đã giữ
        initialSelections[detail.productColorId] = reserved
          .filter((item) => item.locationId && item.reservedQuantity > 0)
          .map((item) => ({
            locationItemId: item.locationId,
            quantity: Math.min(item.reservedQuantity, detail.quantity),
          }));
      });
      setSelectedLocations(initialSelections);
    } catch (err) {
      console.error("Error loading locations:", err);
      showToast({
        type: "error",
        title: "Lỗi",
        description: "Không thể tải vị trí kho: " + (err as Error).message,
      });
    } finally {
      setLoadingLocations(false);
    }
  };

  const handleCreateStockOut = async () => {
    if (!selectedAssignment) return;

    try {
      setCreatingStockOut(true);

      // Validate: Check if all products have enough quantity selected
      const invalidProducts = [];
      for (const detail of selectedAssignment.order.orderDetails) {
        const selected = selectedLocations[detail.productColorId] || [];
        const totalSelected = selected.reduce(
          (sum, loc) => sum + loc.quantity,
          0
        );

        if (totalSelected < detail.quantity) {
          invalidProducts.push(
            `${detail.productColor.product.name}: cần ${detail.quantity}, đã chọn ${totalSelected}`
          );
        }
      }

      if (invalidProducts.length > 0) {
        showToast({
          type: "warning",
          title: "Cần Nhập Số Lượng",
          description: `Vui lòng chọn đủ số lượng cho các sản phẩm sau:${invalidProducts.map(p => `<br />- ${p}`).join('')}`,
        });
        return;
      }

      // Build inventory items - Xuất tất cả sản phẩm cùng lúc
      const items = selectedAssignment.order.orderDetails.flatMap((detail) => {
        const productLocations = selectedLocations[detail.productColorId] || [];
        return productLocations.map((loc) => ({
          quantity: loc.quantity,
          productColorId: detail.productColorId.toString(),
          locationItemId: loc.locationItemId,
        }));
      });

      if (!warehouseId) {
        showToast({
          type: "error",
          title: "Lỗi Tải Dữ Liệu",
          description: "Không tìm thấy thông tin kho. Vui lòng thử lại.",
        });
        return;
      }

      console.log("📦 Creating stock out with data:", {
        warehouseId,
        orderId: selectedAssignment.order.id,
        itemsCount: items.length,
        items,
      });

      await inventoryService.createOrUpdateInventory({
        type: "EXPORT",
        purpose: "STOCK_OUT",
        note: `Xuất kho cho đơn hàng #${selectedAssignment.order.id}`,
        warehouseId: warehouseId,
        orderId: selectedAssignment.order.id,
        items,
      });

      console.log("✅ Stock out created successfully");
      showToast({
        type: "success",
        title: "Thành công",
        description: "Tạo phiếu xuất kho thành công!",
      });
      setShowStockOutModal(false);
      await loadAssignments();
    } catch (err) {
      console.error("❌ Error creating stock out:", err);
      const errorResponse = err as {
        response?: { data?: { message?: string }; status?: number };
        message?: string;
        status?: number;
      };
      const errorMessage =
        errorResponse?.response?.data?.message ||
        errorResponse?.message ||
        "Lỗi không xác định";
      const errorStatus =
        errorResponse?.response?.status || errorResponse?.status;

      if (errorStatus === 401 || errorStatus === 1208) {
        showToast({
          type: "error",
          title: "Phiên đăng nhập hết hạn",
          description: "Vui lòng đăng nhập lại.",
        });
        window.location.href = "/login";
      } else {
        showToast({
          type: "error",
          title: "Lỗi",
          description: `Không thể tạo phiếu xuất kho: ${errorMessage}`,
        });
      }
    } finally {
      setCreatingStockOut(false);
    }
  };

  const handlePrepareProducts = async (orderId: number) => {
    setPendingOrderId(orderId);
    setNoteText("");
    setShowNoteModal(true);
  };

  const submitPrepareProducts = async () => {
    if (pendingOrderId === null) return;

    try {
      setPreparingProducts(pendingOrderId);
      await deliveryService.prepareProducts({
        orderId: pendingOrderId,
        notes: noteText || undefined,
      });
      showToast({
        type: "success",
        title: "Thành công",
        description:
          "Chuẩn bị sản phẩm thành công! Trạng thái đã chuyển sang READY.",
      });
      setShowNoteModal(false);
      setNoteText("");
      setPendingOrderId(null);
      await loadAssignments(); // Reload
    } catch (err) {
      console.error("Error preparing products:", err);
      showToast({
        type: "error",
        title: "Lỗi",
        description: "Không thể chuẩn bị sản phẩm. Vui lòng thử lại.",
      });
    } finally {
      setPreparingProducts(null);
    }
  };

  const getStatusInfo = (status: DeliveryAssignment["status"]) => {
    const statusMap = {
      ASSIGNED: {
        label: "Đã phân công",
        color: "text-blue-700",
        bg: "bg-blue-100",
        border: "border-blue-200",
      },
      PREPARING: {
        label: "Đang chuẩn bị",
        color: "text-yellow-700",
        bg: "bg-yellow-100",
        border: "border-yellow-200",
      },
      READY: {
        label: "Sẵn sàng",
        color: "text-green-700",
        bg: "bg-green-100",
        border: "border-green-200",
      },
      IN_TRANSIT: {
        label: "Đang giao",
        color: "text-purple-700",
        bg: "bg-purple-100",
        border: "border-purple-200",
      },
      DELIVERED: {
        label: "Đã giao",
        color: "text-gray-700",
        bg: "bg-gray-100",
        border: "border-gray-200",
      },
      CANCELLED: {
        label: "Đã hủy",
        color: "text-red-700",
        bg: "bg-red-100",
        border: "border-red-200",
      },
    };
    return statusMap[status] || statusMap.ASSIGNED;
  };

  const filteredAssignments = assignments
    .filter((assignment) => {
      const order = assignment.order;
      const matchesSearch =
        assignment.order.id.toString().includes(searchTerm) ||
        order?.address?.userName
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        order?.address?.phone?.includes(searchTerm);
      const matchesStatus =
        filterStatus === "all" || assignment.status === filterStatus;
      return matchesSearch && matchesStatus;
    })
    .reverse();

  const stats = {
    total: assignments.length,
    assigned: assignments.filter((a) => a.status === "ASSIGNED").length,
    preparing: assignments.filter((a) => a.status === "PREPARING").length,
    ready: assignments.filter((a) => a.status === "READY").length,
    needInvoice: assignments.filter((a) => !a.order.qrCode).length,
    needPreparation: assignments.filter((a) => !a.productsPrepared).length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 dark:bg-red-900/20 p-6">
        <h3 className="text-lg font-semibold text-red-800 dark:text-red-400 mb-2">
          Lỗi tải dữ liệu
        </h3>
        <p className="text-sm text-red-700 dark:text-red-300 mb-4">{error}</p>
        <div className="flex gap-2">
          <button
            onClick={loadAssignments}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            Thử lại
          </button>
          <button
            onClick={() => (window.location.href = "/dashboard")}
            className="px-4 py-2 text-sm font-medium text-red-600 bg-white border border-red-300 rounded-lg hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            Về trang chủ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Quản lý giao hàng
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Tạo hóa đơn và chuẩn bị sản phẩm cho đơn hàng
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-6">
        <div className="rounded-lg bg-white p-4 shadow dark:bg-gray-800">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-blue-100 p-2 dark:bg-blue-900">
              <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Tổng đơn
              </p>
              <p className="text-xl font-semibold text-gray-900 dark:text-white">
                {stats.total}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-white p-4 shadow dark:bg-gray-800">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-yellow-100 p-2 dark:bg-yellow-900">
              <FileText className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Chưa HĐ
              </p>
              <p className="text-xl font-semibold text-gray-900 dark:text-white">
                {stats.needInvoice}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-white p-4 shadow dark:bg-gray-800">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-orange-100 p-2 dark:bg-orange-900">
              <CheckSquare className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Chưa CB
              </p>
              <p className="text-xl font-semibold text-gray-900 dark:text-white">
                {stats.needPreparation}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-white p-4 shadow dark:bg-gray-800">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-blue-100 p-2 dark:bg-blue-900">
              <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Đã PC</p>
              <p className="text-xl font-semibold text-gray-900 dark:text-white">
                {stats.assigned}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-white p-4 shadow dark:bg-gray-800">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-yellow-100 p-2 dark:bg-yellow-900">
              <Package className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Đang CB
              </p>
              <p className="text-xl font-semibold text-gray-900 dark:text-white">
                {stats.preparing}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-white p-4 shadow dark:bg-gray-800">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-green-100 p-2 dark:bg-green-900">
              <CheckSquare className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Sẵn sàng
              </p>
              <p className="text-xl font-semibold text-gray-900 dark:text-white">
                {stats.ready}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm theo mã đơn, tên khách hàng..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-gray-300 pl-10 pr-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          />
        </div>

        <div className="min-w-[200px]">
          <CustomDropdown
            id="filterStatus"
            label="Trạng thái"
            value={filterStatus}
            onChange={(value) => setFilterStatus(value)}
            options={[
              { value: "all", label: "Tất cả trạng thái" },
              { value: "ASSIGNED", label: "Đã phân công" },
              { value: "PREPARING", label: "Đang chuẩn bị" },
              { value: "READY", label: "Sẵn sàng" },
              { value: "IN_TRANSIT", label: "Đang giao" },
              { value: "DELIVERED", label: "Đã giao" },
              { value: "CANCELLED", label: "Đã hủy" },
            ]}
            placeholder="Chọn trạng thái..."
          />
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {filteredAssignments.length === 0 ? (
          <div className="rounded-lg bg-gray-50 dark:bg-gray-800 p-8 text-center">
            <Package className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Không tìm thấy đơn hàng
            </p>
          </div>
        ) : (
          filteredAssignments.map((assignment) => {
            const order = assignment.order;
            const statusInfo = getStatusInfo(assignment.status);

            // Tính tổng số lượng sản phẩm
            const totalQuantity =
              order?.orderDetails?.reduce(
                (sum, detail) => sum + detail.quantity,
                0
              ) || 0;

            return (
              <div
                key={assignment.id}
                className={`rounded-lg bg-white shadow dark:bg-gray-800 border-l-4 ${statusInfo.border} overflow-hidden`}
              >
                <div className="p-4 sm:p-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    {/* Order Info */}
                    <div className="flex-1 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                              Đơn hàng #{order.id}
                            </h3>
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusInfo.bg} ${statusInfo.color}`}
                            >
                              {statusInfo.label}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Khách hàng:{" "}
                            {order?.address?.userName ||
                              order?.address?.name ||
                              "N/A"}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-gray-500 dark:text-gray-400">
                            Địa chỉ
                          </p>
                          <p className="font-medium text-gray-900 dark:text-white line-clamp-2">
                            {order?.address
                              ? order.address.fullAddress ||
                              [
                                order.address.addressLine,
                                order.address.street,
                                order.address.ward,
                                order.address.district,
                                order.address.city,
                              ]
                                .filter(Boolean)
                                .join(", ")
                              : "N/A"}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500 dark:text-gray-400">
                            Số điện thoại
                          </p>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {order?.address?.phone || "N/A"}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500 dark:text-gray-400">
                            Tổng tiền
                          </p>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {order?.total?.toLocaleString("vi-VN")}đ
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500 dark:text-gray-400">
                            Số lượng SP
                          </p>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {totalQuantity}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500 dark:text-gray-400">
                            Phương thức TT
                          </p>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {order?.payment?.paymentMethod || "N/A"}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500 dark:text-gray-400">
                            Ngày đặt
                          </p>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {order?.orderDate
                              ? new Date(order.orderDate).toLocaleDateString(
                                "vi-VN"
                              )
                              : "N/A"}
                          </p>
                        </div>
                      </div>

                      {/* Status Flags */}
                      <div className="flex flex-wrap gap-2 text-xs">
                        {order?.qrCode ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-1 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                            <FileText className="h-3 w-3" />
                            Đã tạo hóa đơn
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2.5 py-1 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300">
                            <FileText className="h-3 w-3" />
                            Chưa tạo hóa đơn
                          </span>
                        )}

                        {assignment.productsPrepared ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-1 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                            <CheckSquare className="h-3 w-3" />
                            Đã chuẩn bị
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2.5 py-1 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300">
                            <CheckSquare className="h-3 w-3" />
                            Chưa chuẩn bị
                          </span>
                        )}
                      </div>

                      {/* Danh sách sản phẩm */}
                      {order?.orderDetails && order.orderDetails.length > 0 && (
                        <div className="rounded-lg bg-gray-50 dark:bg-gray-900/50 p-3 space-y-2">
                          <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                            Sản phẩm:
                          </p>
                          {order.orderDetails.map((detail, idx) => (
                            <div
                              key={idx}
                              className="flex items-center gap-2 text-sm"
                            >
                              {detail.productColor?.images?.[0]?.image && (
                                <img
                                  src={detail.productColor.images[0].image}
                                  alt={detail.productColor.product?.name}
                                  className="w-10 h-10 object-cover rounded"
                                />
                              )}
                              <div className="flex-1">
                                <p className="font-medium text-gray-900 dark:text-white">
                                  {detail.productColor?.product?.name || "N/A"}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  Màu:{" "}
                                  {detail.productColor?.color?.colorName ||
                                    "N/A"}{" "}
                                  | SL: {detail.quantity} | Giá:{" "}
                                  {detail.price?.toLocaleString("vi-VN")}đ
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {assignment.notes && (
                        <div className="rounded-lg bg-gray-50 dark:bg-gray-900/50 p-3">
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Ghi chú
                          </p>
                          <p className="text-sm text-gray-900 dark:text-white">
                            {assignment.notes}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-2 sm:w-48">
                      {assignment.status === "ASSIGNED" && (
                        <button
                          onClick={() => handleOpenStockOutModal(assignment)}
                          className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed dark:focus:ring-offset-gray-800"
                        >
                          <Package className="h-4 w-4" />
                          Tạo phiếu xuất kho
                        </button>
                      )}

                      {assignment.status === "PREPARING" && (
                        <button
                          onClick={() => handlePrepareProducts(order.id)}
                          disabled={
                            assignment.productsPrepared ||
                            preparingProducts === order.id
                          }
                          className="flex items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed dark:focus:ring-offset-gray-800"
                        >
                          {preparingProducts === order.id ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Đang xử lý...
                            </>
                          ) : (
                            <>
                              <CheckSquare className="h-4 w-4" />
                              {assignment.productsPrepared
                                ? "Đã chuẩn bị"
                                : "Chuẩn bị SP"}
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Stock Out Modal */}
      {showStockOutModal && selectedAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-lg bg-white dark:bg-gray-800 shadow-xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Tạo phiếu xuất kho - Đơn hàng #{selectedAssignment.order.id}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Chọn vị trí xuất hàng cho{" "}
                  {selectedAssignment.order.orderDetails.length} sản phẩm
                </p>
              </div>
              <button
                onClick={() => setShowStockOutModal(false)}
                aria-label="Đóng modal"
                className="rounded-lg p-1 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {loadingLocations ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                  <span className="ml-2 text-gray-600 dark:text-gray-400">
                    Đang tải vị trí kho...
                  </span>
                </div>
              ) : (
                <>
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-4">
                    <p className="text-sm text-blue-800 dark:text-blue-300">
                      💡 Bạn có thể xuất nhiều sản phẩm cùng lúc. Chọn vị trí và
                      số lượng cho từng sản phẩm bên dưới.
                    </p>
                  </div>
                  {selectedAssignment.order.orderDetails.map((detail) => {
                    const locations =
                      locationsByProduct[detail.productColorId] || [];
                    const reserved = reservedItems[detail.productColorId] || [];
                    const selectedLocs =
                      selectedLocations[detail.productColorId] || [];
                    const totalSelected = selectedLocs.reduce(
                      (sum, loc) => sum + loc.quantity,
                      0
                    );
                    const totalReserved = reserved.reduce(
                      (sum, item) => sum + item.reservedQuantity,
                      0
                    );
                    const remaining = detail.quantity - totalSelected;

                    return (
                      <div
                        key={detail.id}
                        className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                      >
                        <div className="flex items-start gap-3 mb-3">
                          {detail.productColor?.images?.[0]?.image && (
                            <img
                              src={detail.productColor.images[0].image}
                              alt={detail.productColor.product?.name}
                              className="w-16 h-16 object-cover rounded"
                            />
                          )}
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900 dark:text-white">
                              {detail.productColor?.product?.name}
                            </h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Màu: {detail.productColor?.color?.colorName} | Cần
                              xuất: {detail.quantity}
                            </p>
                            {totalReserved > 0 && (
                              <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                                🔒 Đã giữ: {totalReserved}
                              </p>
                            )}
                            <p
                              className={`text-sm font-medium ${remaining === 0
                                  ? "text-green-600"
                                  : remaining < 0
                                    ? "text-red-600"
                                    : "text-yellow-600"
                                }`}
                            >
                              Đã chọn: {totalSelected} | Còn thiếu:{" "}
                              {Math.max(0, remaining)}
                            </p>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Chọn vị trí xuất hàng:
                          </p>
                          {locations.length === 0 ? (
                            <p className="text-sm text-red-600">
                              Không có hàng trong kho!
                            </p>
                          ) : (
                            locations.map((loc) => {
                              const selectedLoc = selectedLocs.find(
                                (s) => s.locationItemId === loc.locationItemId
                              );
                              const selectedQty = selectedLoc?.quantity || 0;

                              // Kiểm tra vị trí này có hàng đã giữ không
                              const reservedAtLocation = reserved.find(
                                (r) => r.locationId === loc.locationItemId
                              );
                              const isReserved = !!reservedAtLocation;

                              return (
                                <div
                                  key={loc.locationItemId}
                                  className={`flex items-center gap-3 p-2 rounded ${isReserved
                                      ? "bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800"
                                      : "bg-gray-50 dark:bg-gray-900/50"
                                    }`}
                                >
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                                        {loc.warehouseName} - {loc.zoneName} -{" "}
                                        {loc.locationCode}
                                      </p>
                                      {isReserved && (
                                        <span className="text-xs px-2 py-0.5 bg-blue-600 text-white rounded-full">
                                          Đã giữ
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                      Khả dụng: {loc.available} | Đã giữ:{" "}
                                      {loc.reserved} |{" "}
                                      <span className="font-medium text-green-600 dark:text-green-400">
                                        Có thể xuất:{" "}
                                        {loc.available + loc.reserved}
                                      </span>
                                      {isReserved && reservedAtLocation && (
                                        <span className="ml-2 text-blue-600 dark:text-blue-400 font-medium">
                                          (Giữ cho đơn này:{" "}
                                          {reservedAtLocation.reservedQuantity})
                                        </span>
                                      )}
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
                                            ...(updated[
                                              detail.productColorId
                                            ] || []),
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

                                          updated[detail.productColorId] =
                                            productLocs;
                                          return updated;
                                        });
                                      }}
                                      disabled={selectedQty === 0}
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
                                        const maxQty = Math.min(
                                          loc.available + loc.reserved,
                                          remaining + selectedQty
                                        );
                                        const newQty = Math.min(
                                          selectedQty + 1,
                                          maxQty
                                        );

                                        setSelectedLocations((prev) => {
                                          const updated = { ...prev };
                                          const productLocs = [
                                            ...(updated[
                                              detail.productColorId
                                            ] || []),
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

                                          updated[detail.productColorId] =
                                            productLocs;
                                          return updated;
                                        });
                                      }}
                                      disabled={
                                        selectedQty >=
                                        loc.available + loc.reserved ||
                                        selectedQty >= remaining + selectedQty
                                      }
                                      className="p-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                      aria-label="Tăng số lượng"
                                    >
                                      <Plus className="h-4 w-4" />
                                    </button>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </div>

            <div className="sticky bottom-0 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 flex justify-end gap-3">
              <button
                onClick={() => setShowStockOutModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                Hủy
              </button>
              <button
                onClick={handleCreateStockOut}
                disabled={creatingStockOut || loadingLocations}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {creatingStockOut ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Đang tạo...
                  </>
                ) : (
                  <>
                    <Package className="h-4 w-4" />
                    Tạo phiếu xuất
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Note Modal */}
      {showNoteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Ghi chú chuẩn bị sản phẩm
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Thêm ghi chú cho quá trình chuẩn bị (nếu có)
              </p>
            </div>

            <div className="p-6">
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Nhập ghi chú..."
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowNoteModal(false);
                  setNoteText("");
                  setPendingOrderId(null);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={submitPrepareProducts}
                disabled={preparingProducts !== null}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
              >
                {preparingProducts !== null ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <CheckSquare className="h-4 w-4" />
                    Xác nhận
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
