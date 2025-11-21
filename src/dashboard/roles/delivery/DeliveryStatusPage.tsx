import {
  Package,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import deliveryService from "@/service/deliveryService";
import type { DeliveryAssignment } from "@/service/deliveryService";
import { authService } from "@/service/authService";
import orderService from "@/service/orderService";
import type { OrderItem } from "@/types/order";

export default function DeliveryStatus() {
  const [assignments, setAssignments] = useState<DeliveryAssignment[]>([]);
  const [orderDetails, setOrderDetails] = useState<Map<number, OrderItem>>(
    new Map()
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<number | null>(null);

  useEffect(() => {
    loadAssignments();
  }, []);

  const loadAssignments = async () => {
    try {
      setLoading(true);
      setError(null);
      const profile = await authService.getProfile();
      console.log("👤 Current profile:", profile);

      if (!profile?.id) {
        setError("Không tìm thấy thông tin người dùng");
        return;
      }

      console.log("🔄 Calling API: getAssignmentsByStaff(" + profile.id + ")");
      const data = await deliveryService.getAssignmentsByStaff(profile.id);
      console.log("📦 API Response - Total assignments:", data.length);
      console.log("📦 All assignments:", data);
      console.log(
        "📦 Assignments statuses:",
        data.map((a) => ({ id: a.id, orderId: a.orderId, status: a.status }))
      );
      setAssignments(data);

      // Fetch order details for each assignment
      const orderDetailsMap = new Map<number, OrderItem>();
      await Promise.all(
        data.map(async (assignment) => {
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
      setError("Không thể tải danh sách đơn hàng");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (
    assignmentId: number,
    newStatus: DeliveryAssignment["status"]
  ) => {
    try {
      setUpdating(assignmentId);
      await deliveryService.updateDeliveryStatus(assignmentId, newStatus);
      await loadAssignments();
    } catch (err) {
      console.error("Error updating status:", err);
      alert("Không thể cập nhật trạng thái. Vui lòng thử lại.");
    } finally {
      setUpdating(null);
    }
  };

  const statuses = [
    {
      status: "ASSIGNED" as const,
      icon: AlertCircle,
      label: "Đã phân công",
      description: "Đơn hàng đã được phân công cho bạn",
      color: "text-blue-500",
      bgColor: "bg-blue-50 dark:bg-blue-900/20",
      borderColor: "border-blue-200 dark:border-blue-800",
    },
    {
      status: "PREPARING" as const,
      icon: Package,
      label: "Đang chuẩn bị",
      description: "Cửa hàng đang chuẩn bị hàng",
      color: "text-yellow-500",
      bgColor: "bg-yellow-50 dark:bg-yellow-900/20",
      borderColor: "border-yellow-200 dark:border-yellow-800",
    },
    {
      status: "READY" as const,
      icon: CheckCircle2,
      label: "Sẵn sàng",
      description: "Hàng đã sẵn sàng để lấy",
      color: "text-green-500",
      bgColor: "bg-green-50 dark:bg-green-900/20",
      borderColor: "border-green-200 dark:border-green-800",
    },
    {
      status: "IN_TRANSIT" as const,
      icon: Clock,
      label: "Đang giao",
      description: "Đang trên đường giao hàng",
      color: "text-purple-500",
      bgColor: "bg-purple-50 dark:bg-purple-900/20",
      borderColor: "border-purple-200 dark:border-purple-800",
    },
    {
      status: "DELIVERED" as const,
      icon: CheckCircle2,
      label: "Đã giao",
      description: "Đã giao hàng thành công",
      color: "text-gray-500",
      bgColor: "bg-gray-50 dark:bg-gray-900/20",
      borderColor: "border-gray-200 dark:border-gray-800",
    },
    {
      status: "CANCELLED" as const,
      icon: XCircle,
      label: "Đã hủy",
      description: "Đơn hàng đã bị hủy",
      color: "text-red-500",
      bgColor: "bg-red-50 dark:bg-red-900/20",
      borderColor: "border-red-200 dark:border-red-800",
    },
  ];

  const getStatusInfo = (status: DeliveryAssignment["status"]) => {
    return statuses.find((s) => s.status === status);
  };

  // Chỉ hiển thị đơn đang giao (IN_TRANSIT)
  const activeOrders = assignments.filter((a) => a.status === "IN_TRANSIT");

  console.log("🚚 IN_TRANSIT orders:", activeOrders);
  console.log(
    "📊 Total assignments:",
    assignments.length,
    "| IN_TRANSIT:",
    activeOrders.length
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 text-center">
        <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
        <button
          onClick={loadAssignments}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-20">
      {/* Debug Info - Xóa sau khi debug xong */}
      {assignments.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-semibold text-yellow-800 mb-2">🔍 Debug Info</h3>
          <p className="text-sm text-yellow-700">
            Tổng số assignments: <strong>{assignments.length}</strong>
          </p>
          <p className="text-sm text-yellow-700">
            IN_TRANSIT orders: <strong>{activeOrders.length}</strong>
          </p>
          <details className="mt-2">
            <summary className="text-sm text-yellow-800 cursor-pointer">
              Xem tất cả assignments
            </summary>
            <div className="mt-2 space-y-1 text-xs">
              {assignments.map((a) => (
                <div key={a.id} className="bg-yellow-100 p-2 rounded">
                  Order #{a.orderId} - Status: <strong>{a.status}</strong>
                </div>
              ))}
            </div>
          </details>
        </div>
      )}

      {activeOrders.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 text-center">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Không có đơn hàng đang giao
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            Bạn chưa có đơn hàng nào có trạng thái "Đang giao" (IN_TRANSIT)
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Tổng số assignments: {assignments.length} | IN_TRANSIT:{" "}
            {activeOrders.length}
          </p>
          {assignments.length > 0 && (
            <div className="mt-4 text-left bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
              <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Các đơn hàng khác:
              </p>
              {assignments.map((a) => (
                <div
                  key={a.id}
                  className="text-xs text-gray-600 dark:text-gray-400 mb-1"
                >
                  • Order #{a.orderId} - Status: <strong>{a.status}</strong>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        activeOrders.map((assignment) => {
          const order = orderDetails.get(assignment.orderId);
          const statusInfo = getStatusInfo(assignment.status);
          const StatusIcon = statusInfo?.icon || Package;

          return (
            <div
              key={assignment.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden"
            >
              {/* Order Header */}
              <div
                className={`p-4 border-l-4 ${
                  statusInfo?.borderColor || "border-gray-200"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <StatusIcon
                      className={`${statusInfo?.color || "text-gray-500"}`}
                      size={20}
                    />
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      #{order?.id || assignment.orderId}
                    </h3>
                  </div>
                  <span
                    className={`px-3 py-1 text-xs font-medium rounded-full ${statusInfo?.bgColor} ${statusInfo?.color}`}
                  >
                    {statusInfo?.label || assignment.status}
                  </span>
                </div>

                <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400 mb-4">
                  <p>Địa chỉ: {order?.address || "N/A"}</p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    Tổng tiền: {order?.price?.toLocaleString("vi-VN")}đ
                  </p>
                </div>

                {/* Status Update Buttons */}
                <div>
                  <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Cập nhật trạng thái:
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {statuses
                      .filter((s) => {
                        // Show next possible statuses based on current status
                        if (assignment.status === "ASSIGNED")
                          return ["PREPARING", "CANCELLED"].includes(s.status);
                        if (assignment.status === "PREPARING")
                          return ["READY", "CANCELLED"].includes(s.status);
                        if (assignment.status === "READY")
                          return ["IN_TRANSIT", "CANCELLED"].includes(s.status);
                        if (assignment.status === "IN_TRANSIT")
                          return ["DELIVERED", "CANCELLED"].includes(s.status);
                        return false;
                      })
                      .map((statusOption) => {
                        const Icon = statusOption.icon;
                        const isUpdating = updating === assignment.id;
                        return (
                          <button
                            key={statusOption.status}
                            onClick={() =>
                              handleUpdateStatus(
                                assignment.id,
                                statusOption.status
                              )
                            }
                            disabled={isUpdating}
                            className={`flex items-center gap-2 p-2.5 rounded-lg border transition-all text-left
                              ${statusOption.borderColor} ${statusOption.bgColor}
                              hover:shadow-md active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed`}
                          >
                            <Icon className={statusOption.color} size={18} />
                            <span
                              className={`text-xs font-medium ${statusOption.color}`}
                            >
                              {isUpdating
                                ? "Đang cập nhật..."
                                : statusOption.label}
                            </span>
                          </button>
                        );
                      })}
                  </div>
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
