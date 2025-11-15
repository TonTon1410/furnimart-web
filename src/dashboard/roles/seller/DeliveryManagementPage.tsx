import {
  Package,
  FileText,
  CheckSquare,
  Users,
  Loader2,
  Search,
} from "lucide-react";
import { useEffect, useState } from "react";
import deliveryService from "@/service/deliveryService";
import type { DeliveryAssignment } from "@/service/deliveryService";
import orderService from "@/service/orderService";
import type { OrderItem } from "@/types/order";
import { authService } from "@/service/authService";

export default function DeliveryManagementPage() {
  const [assignments, setAssignments] = useState<DeliveryAssignment[]>([]);
  const [orderDetails, setOrderDetails] = useState<Map<number, OrderItem>>(
    new Map()
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [processingInvoice, setProcessingInvoice] = useState<number | null>(
    null
  );
  const [preparingProducts, setPreparingProducts] = useState<number | null>(
    null
  );

  useEffect(() => {
    loadAssignments();
  }, []);

  const loadAssignments = async () => {
    try {
      setLoading(true);
      setError(null);

      // Lấy storeId từ decoded token
      const decodedToken = authService.getDecodedToken();
      console.log("Decoded Token:", decodedToken);

      const storeId = decodedToken?.storeId;

      if (!storeId) {
        console.warn("No storeId in token:", decodedToken);
        setError(
          `Không tìm thấy thông tin cửa hàng trong token. Vui lòng đăng nhập lại.`
        );
        setLoading(false);
        return;
      }

      console.log("Fetching assignments for store:", storeId);
      // Lấy danh sách phân công theo store
      const data = await deliveryService.getAssignmentsByStore(storeId);
      console.log("Assignments loaded:", data.length);
      setAssignments(data);

      // Fetch order details
      const orderDetailsMap = new Map<number, OrderItem>();
      await Promise.all(
        data.map(async (assignment: DeliveryAssignment) => {
          try {
            const orderDetail = await orderService.getOrderById(
              assignment.orderId
            );
            orderDetailsMap.set(assignment.orderId, orderDetail);
          } catch (err) {
            console.error(`Failed to load order ${assignment.orderId}:`, err);
          }
        })
      );

      setOrderDetails(orderDetailsMap);
    } catch (err) {
      console.error("Error loading assignments:", err);
      setError(
        `Không thể tải danh sách đơn hàng: ${
          (err as Error).message || "Lỗi không xác định"
        }`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateInvoice = async (orderId: number) => {
    if (!confirm("Tạo hóa đơn cho đơn hàng này?")) return;

    try {
      setProcessingInvoice(orderId);
      await deliveryService.generateInvoice(orderId);
      alert("Tạo hóa đơn thành công!");
      await loadAssignments(); // Reload
    } catch (err) {
      console.error("Error generating invoice:", err);
      alert((err as Error).message || "Không thể tạo hóa đơn");
    } finally {
      setProcessingInvoice(null);
    }
  };

  const handlePrepareProducts = async (orderId: number) => {
    const notes = prompt("Nhập ghi chú (nếu có):");
    if (notes === null) return; // User cancelled

    try {
      setPreparingProducts(orderId);
      await deliveryService.prepareProducts({
        orderId,
        notes: notes || undefined,
      });
      alert("Chuẩn bị sản phẩm thành công! Trạng thái đã chuyển sang READY.");
      await loadAssignments(); // Reload
    } catch (err) {
      console.error("Error preparing products:", err);
      alert((err as Error).message || "Không thể chuẩn bị sản phẩm");
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

  const filteredAssignments = assignments.filter((assignment) => {
    const order = orderDetails.get(assignment.orderId);
    const matchesSearch =
      assignment.orderId.toString().includes(searchTerm) ||
      order?.shopName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      filterStatus === "all" || assignment.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: assignments.length,
    assigned: assignments.filter((a) => a.status === "ASSIGNED").length,
    preparing: assignments.filter((a) => a.status === "PREPARING").length,
    ready: assignments.filter((a) => a.status === "READY").length,
    needInvoice: assignments.filter((a) => !a.invoiceGenerated).length,
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

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          aria-label="Lọc theo trạng thái"
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
        >
          <option value="all">Tất cả trạng thái</option>
          <option value="ASSIGNED">Đã phân công</option>
          <option value="PREPARING">Đang chuẩn bị</option>
          <option value="READY">Sẵn sàng</option>
          <option value="IN_TRANSIT">Đang giao</option>
          <option value="DELIVERED">Đã giao</option>
          <option value="CANCELLED">Đã hủy</option>
        </select>
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
            const order = orderDetails.get(assignment.orderId);
            const statusInfo = getStatusInfo(assignment.status);

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
                              Đơn hàng #{assignment.orderId}
                            </h3>
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusInfo.bg} ${statusInfo.color}`}
                            >
                              {statusInfo.label}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Khách hàng: {order?.shopName || "N/A"}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-gray-500 dark:text-gray-400">
                            Địa chỉ
                          </p>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {order?.address || "N/A"}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500 dark:text-gray-400">
                            Số điện thoại
                          </p>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {order?.phone || "N/A"}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500 dark:text-gray-400">
                            Tổng tiền
                          </p>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {order?.price?.toLocaleString("vi-VN")}đ
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500 dark:text-gray-400">
                            Số lượng SP
                          </p>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {order?.quantity || 0}
                          </p>
                        </div>
                      </div>

                      {/* Status Flags */}
                      <div className="flex flex-wrap gap-2 text-xs">
                        {assignment.invoiceGenerated ? (
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
                      <button
                        onClick={() =>
                          handleGenerateInvoice(assignment.orderId)
                        }
                        disabled={
                          assignment.invoiceGenerated ||
                          processingInvoice === assignment.orderId
                        }
                        className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed dark:focus:ring-offset-gray-800"
                      >
                        {processingInvoice === assignment.orderId ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Đang xử lý...
                          </>
                        ) : (
                          <>
                            <FileText className="h-4 w-4" />
                            {assignment.invoiceGenerated
                              ? "Đã tạo HĐ"
                              : "Tạo hóa đơn"}
                          </>
                        )}
                      </button>

                      <button
                        onClick={() =>
                          handlePrepareProducts(assignment.orderId)
                        }
                        disabled={
                          assignment.productsPrepared ||
                          preparingProducts === assignment.orderId
                        }
                        className="flex items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed dark:focus:ring-offset-gray-800"
                      >
                        {preparingProducts === assignment.orderId ? (
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
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
