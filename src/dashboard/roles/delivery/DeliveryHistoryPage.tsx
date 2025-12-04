import { Package, MapPin, Clock, ChevronDown, ChevronUp } from "lucide-react";
import { useEffect, useState } from "react";
import deliveryService from "@/service/deliveryService";
import type { DeliveryAssignment } from "@/service/deliveryService";
import { authService } from "@/service/authService";

export default function DeliveryHistoryPage() {
  const [assignments, setAssignments] = useState<DeliveryAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const formatAddress = (address?: DeliveryAssignment["order"]["address"]) => {
    if (!address) return "N/A";
    const parts = [
      address.addressLine,
      address.street,
      address.ward,
      address.district,
      address.city,
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(", ") : "N/A";
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const profile = await authService.getProfile();
      if (!profile?.id) {
        setError("Không tìm thấy thông tin người dùng");
        return;
      }

      const data = await deliveryService.getAssignmentsByStaff(profile.id);
      // Filter for DELIVERED status
      const historyOrders = data.filter(
        (assignment) =>
          assignment.order !== null && assignment.status === "DELIVERED"
      );
      setAssignments(historyOrders);
    } catch (err) {
      console.error("Error loading history:", err);
      setError("Không thể tải lịch sử giao hàng");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusText = (status: DeliveryAssignment["status"]) => {
    const texts = {
      DELIVERED: "Đã giao",
      FINISHED: "Hoàn thành",
      ASSIGNED: "Đã phân công",
      PREPARING: "Đang chuẩn bị",
      READY: "Sẵn sàng",
      IN_TRANSIT: "Đang giao",
      CANCELLED: "Đã hủy",
    };
    return texts[status] || status;
  };

  const getStatusColor = (status: DeliveryAssignment["status"]) => {
    const colors = {
      DELIVERED:
        "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
      FINISHED:
        "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
      CANCELLED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
      ASSIGNED:
        "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400",
      PREPARING:
        "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
      READY:
        "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
      IN_TRANSIT:
        "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
    };
    return colors[status] || colors.ASSIGNED;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            Đang tải lịch sử...
          </p>
        </div>
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
        <button
          onClick={loadHistory}
          className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
        >
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Lịch sử giao hàng
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Danh sách các đơn hàng đã hoàn thành
          </p>
        </div>
        <div className="rounded-lg bg-white dark:bg-gray-800 px-4 py-2 shadow">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Tổng số đơn
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {assignments.length}
          </p>
        </div>
      </div>

      {/* History List */}
      <div className="space-y-3">
        {assignments.length === 0 ? (
          <div className="rounded-lg bg-white dark:bg-gray-800 p-8 shadow text-center">
            <Package className="h-12 w-12 mx-auto text-gray-400 mb-3" />
            <p className="text-gray-500 dark:text-gray-400">
              Chưa có lịch sử giao hàng
            </p>
          </div>
        ) : (
          assignments.map((assignment) => {
            const order = assignment.order;
            const isExpanded = expandedId === assignment.id;

            return (
              <div
                key={assignment.id}
                className="rounded-lg bg-white dark:bg-gray-800 shadow overflow-hidden"
              >
                <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          Đơn hàng #{order.id}
                        </h3>
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(
                            assignment.status
                          )}`}
                        >
                          {getStatusText(assignment.status)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Khách hàng:{" "}
                        {order?.address?.userName ||
                          order?.address?.name ||
                          "N/A"}
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        setExpandedId(isExpanded ? null : assignment.id)
                      }
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                      aria-label={isExpanded ? "Thu gọn" : "Mở rộng"}
                    >
                      {isExpanded ? (
                        <ChevronUp className="h-5 w-5 text-gray-500" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-gray-500" />
                      )}
                    </button>
                  </div>

                  {/* Basic Info */}
                  <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">
                        Ngày giao
                      </p>
                      <p className="font-medium text-gray-900 dark:text-white flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {assignment.estimatedDeliveryDate
                          ? formatDate(assignment.estimatedDeliveryDate)
                          : "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">
                        Tổng tiền
                      </p>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {order?.total?.toLocaleString("vi-VN")}đ
                      </p>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-3 mt-3 space-y-3">
                      <div>
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                          Địa chỉ giao hàng
                        </p>
                        <div className="flex items-start gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-gray-400 shrink-0 mt-0.5" />
                          <p className="text-gray-900 dark:text-white">
                            {formatAddress(order?.address)}
                          </p>
                        </div>
                      </div>

                      <div>
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                          Số điện thoại
                        </p>
                        <p className="text-sm text-gray-900 dark:text-white">
                          {order?.address?.phone || "N/A"}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                          Phương thức thanh toán
                        </p>
                        <p className="text-sm text-gray-900 dark:text-white">
                          {order?.payment?.paymentMethod === "COD"
                            ? "Tiền mặt"
                            : order?.payment?.paymentMethod === "VNPAY"
                            ? "VNPay"
                            : order?.payment?.paymentMethod === "MOMO"
                            ? "MoMo"
                            : order?.payment?.paymentMethod || "N/A"}
                        </p>
                      </div>

                      {/* Products */}
                      {order?.orderDetails && order.orderDetails.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                            Sản phẩm ({order.orderDetails.length}):
                          </p>
                          <div className="space-y-2">
                            {order.orderDetails.map((detail, index) => {
                              const productColor = detail.productColor;
                              const productImage =
                                productColor?.images?.[0]?.image;
                              return (
                                <div
                                  key={index}
                                  className="bg-gray-50 dark:bg-gray-900/50 p-2.5 rounded-lg"
                                >
                                  <div className="flex gap-2">
                                    {productImage && (
                                      <img
                                        src={productImage}
                                        alt={
                                          productColor?.product?.name ||
                                          "Product"
                                        }
                                        className="w-12 h-12 object-cover rounded shrink-0"
                                      />
                                    )}
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                        {productColor?.product?.name ||
                                          `Sản phẩm #${index + 1}`}
                                      </p>
                                      {productColor?.color && (
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                          Màu: {productColor.color.colorName}
                                        </p>
                                      )}
                                      <div className="flex items-center gap-2 mt-1 text-xs text-gray-600 dark:text-gray-400">
                                        <span>SL: {detail.quantity}</span>
                                        <span className="text-gray-400">•</span>
                                        <span>
                                          {detail.price.toLocaleString()}đ/sp
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Notes */}
                      {assignment.notes && (
                        <div>
                          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                            Ghi chú
                          </p>
                          <p className="text-sm text-gray-900 dark:text-white bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded">
                            {assignment.notes}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
