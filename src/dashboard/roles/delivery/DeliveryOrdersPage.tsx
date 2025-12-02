import { Package, MapPin, Clock, CheckCircle, Phone } from "lucide-react";
import { useEffect, useState } from "react";
import deliveryService from "@/service/deliveryService";
import type { DeliveryAssignment } from "@/service/deliveryService";
import { authService } from "@/service/authService";

export default function DeliveryOrders() {
  const [assignments, setAssignments] = useState<DeliveryAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAssignments();
  }, []);

  const loadAssignments = async () => {
    try {
      setLoading(true);
      setError(null);
      const profile = await authService.getProfile();
      if (!profile?.id) {
        setError("Không tìm thấy thông tin người dùng");
        return;
      }

      const data = await deliveryService.getAssignmentsByStaff(profile.id);
      console.log("Delivery assignments loaded:", data.length);
      setAssignments(data);
    } catch (err) {
      console.error("Error loading assignments:", err);
      setError("Không thể tải danh sách đơn hàng");
    } finally {
      setLoading(false);
    }
  };

  const getStatusText = (status: DeliveryAssignment["status"]) => {
    const texts = {
      ASSIGNED: "Đã phân công",
      PREPARING: "Đang chuẩn bị",
      READY: "Sẵn sàng",
      IN_TRANSIT: "Đang giao",
      DELIVERED: "Đã giao",
      CANCELLED: "Đã hủy",
    };
    return texts[status] || status;
  };

  const getGradientColor = (status: DeliveryAssignment["status"]) => {
    const colors = {
      ASSIGNED: "from-blue-500 to-blue-600",
      PREPARING: "from-yellow-500 to-yellow-600",
      READY: "from-green-500 to-green-600",
      IN_TRANSIT: "from-purple-500 to-purple-600",
      DELIVERED: "from-gray-500 to-gray-600",
      CANCELLED: "from-red-500 to-red-600",
    };
    return colors[status] || colors.ASSIGNED;
  };

  const handleCallCustomer = (assignment: DeliveryAssignment) => {
    const phone = assignment.order?.address?.phone;
    if (phone) {
      if (confirm(`Gọi cho khách hàng:\n${phone}`)) {
        window.location.href = `tel:${phone}`;
      }
    } else {
      alert("Không tìm thấy số điện thoại khách hàng");
    }
  };

  const handlePickupOrder = async (assignmentId: number) => {
    if (!confirm("Xác nhận lấy hàng và bắt đầu giao?")) return;

    try {
      await deliveryService.updateDeliveryStatus(assignmentId, "IN_TRANSIT");
      alert("Đã cập nhật trạng thái: Đang giao hàng");
      await loadAssignments(); // Reload data
    } catch (err) {
      console.error("Error updating status:", err);
      alert((err as Error).message || "Không thể cập nhật trạng thái");
    }
  };

  const stats = {
    assigned: assignments.filter(
      (a) => a.status === "ASSIGNED" || a.status === "READY"
    ).length,
    inTransit: assignments.filter((a) => a.status === "IN_TRANSIT").length,
    delivered: assignments.filter((a) => a.status === "DELIVERED").length,
    today: assignments.filter((a) => {
      const today = new Date().toDateString();
      return new Date(a.assignedAt).toDateString() === today;
    }).length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Đang tải...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 dark:bg-red-900/20 p-4">
        <p className="text-sm text-red-800 dark:text-red-400">{error}</p>
        <button
          onClick={loadAssignments}
          className="mt-2 text-sm font-medium text-red-600 hover:text-red-500 dark:text-red-400"
        >
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-20">
      {/* Header - More compact on mobile */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
            Đơn hàng của tôi
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
            Quản lý các đơn hàng được phân công
          </p>
        </div>
      </div>

      {/* Stats Cards - 2 columns on mobile */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <div className="rounded-lg bg-white p-4 sm:p-6 shadow dark:bg-gray-800">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-0">
            <div className="rounded-full bg-blue-100 p-2 sm:p-3 dark:bg-blue-900 w-fit">
              <Package className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="sm:ml-4">
              <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">
                Đang chờ
              </p>
              <p className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">
                {stats.assigned}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-white p-4 sm:p-6 shadow dark:bg-gray-800">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-0">
            <div className="rounded-full bg-yellow-100 p-2 sm:p-3 dark:bg-yellow-900 w-fit">
              <MapPin className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className="sm:ml-4">
              <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">
                Đang giao
              </p>
              <p className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">
                {stats.inTransit}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-white p-4 sm:p-6 shadow dark:bg-gray-800">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-0">
            <div className="rounded-full bg-green-100 p-2 sm:p-3 dark:bg-green-900 w-fit">
              <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="sm:ml-4">
              <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">
                Đã giao
              </p>
              <p className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">
                {stats.delivered}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-white p-4 sm:p-6 shadow dark:bg-gray-800">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-0">
            <div className="rounded-full bg-purple-100 p-2 sm:p-3 dark:bg-purple-900 w-fit">
              <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="sm:ml-4">
              <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">
                Hôm nay
              </p>
              <p className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">
                {stats.today}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Active Orders - Mobile-optimized cards */}
      <div className="space-y-3">
        <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white px-1">
          {assignments.filter(
            (a) => a.status === "IN_TRANSIT" || a.status === "READY"
          ).length > 0
            ? "Đơn hàng đang giao"
            : "Danh sách đơn hàng"}
        </h2>

        {assignments.length === 0 ? (
          <div className="rounded-lg bg-white p-8 shadow dark:bg-gray-800 text-center">
            <Package className="h-12 w-12 mx-auto text-gray-400 mb-3" />
            <p className="text-gray-500 dark:text-gray-400">
              Chưa có đơn hàng nào
            </p>
          </div>
        ) : (
          assignments
            .filter((a) => a.status !== "DELIVERED" && a.status !== "CANCELLED")
            .map((assignment) => {
              const order = assignment.order;
              return (
                <div
                  key={assignment.id}
                  className="rounded-lg bg-white shadow dark:bg-gray-800 overflow-hidden"
                >
                  <div
                    className={`bg-linear-to-r ${getGradientColor(
                      assignment.status
                    )} p-3 sm:p-4`}
                  >
                    <div className="flex items-start justify-between text-white">
                      <div>
                        <p className="text-xs opacity-90">Đơn hàng</p>
                        <p className="text-lg sm:text-xl font-bold">
                          #{order?.id || "N/A"}
                        </p>
                      </div>
                      <span className="inline-flex items-center rounded-full bg-white/20 backdrop-blur-sm px-2.5 py-1 text-xs font-medium whitespace-nowrap">
                        {getStatusText(assignment.status)}
                      </span>
                    </div>
                  </div>

                  <div className="p-3 sm:p-4 space-y-3">
                    {/* Tên khách hàng */}
                    <div className="flex items-start gap-2 text-sm">
                      <div className="shrink-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                        <span className="text-blue-600 dark:text-blue-400 font-semibold text-xs">
                          {order?.address?.userName?.charAt(0)?.toUpperCase() ||
                            "K"}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Khách hàng
                        </p>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {order?.address?.userName ||
                            order?.address?.name ||
                            "Chưa có tên"}
                        </p>
                      </div>
                    </div>

                    {/* Địa chỉ */}
                    <div className="flex items-start gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-gray-400 shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-gray-900 dark:text-white font-medium">
                          {order?.address?.fullAddress ||
                            [
                              order?.address?.addressLine,
                              order?.address?.street,
                              order?.address?.ward,
                              order?.address?.district,
                              order?.address?.city,
                            ]
                              .filter(Boolean)
                              .join(", ") ||
                            "Chưa có địa chỉ"}
                        </p>
                      </div>
                    </div>

                    {/* Số điện thoại */}
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-gray-400 shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300">
                        {order?.address?.phone || "Chưa có SĐT"}
                      </span>
                    </div>

                    {/* Thông tin sản phẩm */}
                    {order?.orderDetails && order.orderDetails.length > 0 && (
                      <div className="border-t border-gray-200 dark:border-gray-700 pt-3 mt-3">
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                          Sản phẩm:
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
                                  {/* Product Image */}
                                  {productImage && (
                                    <img
                                      src={productImage}
                                      alt={
                                        productColor?.product?.name || "Product"
                                      }
                                      className="w-12 h-12 object-cover rounded shrink-0"
                                    />
                                  )}

                                  <div className="flex-1 min-w-0">
                                    {/* Product Name & Code */}
                                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                      {productColor?.product?.name ||
                                        `Sản phẩm #${index + 1}`}
                                    </p>
                                    {productColor?.color && (
                                      <p className="text-xs text-gray-500 dark:text-gray-400">
                                        Màu: {productColor.color.colorName}
                                      </p>
                                    )}

                                    {/* Product Details */}
                                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-600 dark:text-gray-400">
                                      <span>SL: {detail.quantity}</span>
                                      <span className="text-gray-400">•</span>
                                      <span>
                                        {detail.price.toLocaleString()}đ/sp
                                      </span>
                                    </div>

                                    {/* Material & Color */}
                                    {productColor && (
                                      <div className="flex flex-wrap gap-1 mt-1">
                                        {productColor.color && (
                                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                                            {productColor.color.colorName}
                                          </span>
                                        )}
                                      </div>
                                    )}
                                  </div>

                                  {/* Subtotal */}
                                  <div className="text-right shrink-0">
                                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                      {(
                                        detail.price * detail.quantity
                                      ).toLocaleString()}
                                      đ
                                    </p>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Tổng cộng:
                          </span>
                          <span className="text-base font-bold text-gray-900 dark:text-white">
                            {order.total?.toLocaleString()}đ
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="space-y-2">
                      {/* Nút lấy hàng - chỉ hiện khi status = READY */}
                      {assignment.status === "READY" && (
                        <button
                          onClick={() => handlePickupOrder(assignment.id)}
                          className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-3 rounded-lg font-medium text-sm hover:bg-blue-700 active:bg-blue-800 transition-colors shadow-md"
                        >
                          <Package className="h-5 w-5" />
                          <span>Lấy hàng & Bắt đầu giao</span>
                        </button>
                      )}

                      {/* Nút gọi điện */}
                      <button
                        onClick={() => handleCallCustomer(assignment)}
                        className="w-full flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-3 rounded-lg font-medium text-sm hover:bg-green-700 active:bg-green-800 transition-colors"
                      >
                        <Phone className="h-5 w-5" />
                        <span>Gọi khách hàng</span>
                      </button>
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
