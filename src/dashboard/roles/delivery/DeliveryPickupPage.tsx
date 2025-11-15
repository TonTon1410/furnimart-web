import { Package, MapPin, Clock, Phone } from "lucide-react";
import { useEffect, useState } from "react";
import deliveryService from "@/service/deliveryService";
import type { DeliveryAssignment } from "@/service/deliveryService";
import { authService } from "@/service/authService";
import orderService from "@/service/orderService";
import type { OrderItem } from "@/types/order";
import { productService, type ProductColor } from "@/service/productService";

export default function DeliveryPickupPage() {
  const [assignments, setAssignments] = useState<DeliveryAssignment[]>([]);
  const [orderDetails, setOrderDetails] = useState<Map<number, OrderItem>>(
    new Map()
  );
  const [productDetails, setProductDetails] = useState<
    Map<string, ProductColor>
  >(new Map());
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
      // Chỉ lấy đơn có status = READY
      const readyOrders = data.filter(
        (assignment) => assignment.status === "READY"
      );
      setAssignments(readyOrders);

      // Fetch order details for each assignment
      const orderDetailsMap = new Map<number, OrderItem>();
      const productDetailsMap = new Map<string, ProductColor>();

      await Promise.all(
        readyOrders.map(async (assignment) => {
          try {
            const orderDetail = await orderService.getOrderById(
              assignment.orderId
            );
            orderDetailsMap.set(assignment.orderId, orderDetail);

            // Fetch product color details for each order detail
            if (orderDetail.orderDetails) {
              await Promise.all(
                orderDetail.orderDetails.map(async (detail) => {
                  if (
                    detail.productColorId &&
                    !productDetailsMap.has(detail.productColorId)
                  ) {
                    try {
                      const productColorResponse =
                        await productService.getProductColorById(
                          detail.productColorId
                        );
                      if (productColorResponse?.data?.data) {
                        productDetailsMap.set(
                          detail.productColorId,
                          productColorResponse.data.data
                        );
                      }
                    } catch (err) {
                      console.error(
                        `Error fetching product color ${detail.productColorId}:`,
                        err
                      );
                    }
                  }
                })
              );
            }
          } catch (err) {
            console.error(`Error fetching order ${assignment.orderId}:`, err);
          }
        })
      );

      setOrderDetails(orderDetailsMap);
      setProductDetails(productDetailsMap);
    } catch (err) {
      console.error("Error loading assignments:", err);
      setError((err as Error).message || "Không thể tải danh sách đơn hàng");
    } finally {
      setLoading(false);
    }
  };

  const handlePickupOrder = async (assignmentId: number) => {
    if (!confirm("Xác nhận lấy hàng và bắt đầu giao?")) return;

    try {
      await deliveryService.updateDeliveryStatus(assignmentId, "IN_TRANSIT");
      alert("Đã cập nhật trạng thái: Đang giao hàng");
      // Reload assignments to update the list
      await loadAssignments();
    } catch (err) {
      console.error("Error updating status:", err);
      alert((err as Error).message || "Không thể cập nhật trạng thái");
    }
  };

  const handleCallCustomer = (orderId: number) => {
    const order = orderDetails.get(orderId);
    if (order?.phone) {
      window.location.href = `tel:${order.phone}`;
    } else {
      alert("Đã sao chép số điện thoại khách hàng");
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const getStatusBadgeClass = (status: string) => {
    const baseClasses =
      "inline-flex items-center px-3 py-1 rounded-full text-xs font-medium";
    switch (status) {
      case "READY":
        return `${baseClasses} bg-green-100 text-green-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      READY: "Sẵn sàng",
      ASSIGNED: "Đã phân công",
      PREPARING: "Đang chuẩn bị",
      IN_TRANSIT: "Đang giao",
      DELIVERED: "Đã giao",
      FAILED: "Thất bại",
    };
    return statusMap[status] || status;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="text-center max-w-md">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Lỗi</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadAssignments}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-6 shadow-lg">
        <h1 className="text-2xl font-bold mb-2">Xác nhận lấy hàng</h1>
        <p className="text-green-100 text-sm">
          {assignments.length} đơn hàng sẵn sàng lấy
        </p>
      </div>

      {/* Orders List */}
      <div className="p-4 space-y-4">
        {assignments.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">
              Không có đơn hàng nào sẵn sàng lấy
            </p>
          </div>
        ) : (
          assignments.map((assignment) => {
            const order = orderDetails.get(assignment.orderId);
            const totalQuantity =
              order?.orderDetails?.reduce(
                (sum, detail) => sum + detail.quantity,
                0
              ) || 0;

            return (
              <div
                key={assignment.id}
                className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow"
              >
                {/* Order Header */}
                <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-green-50 to-white">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Package className="h-5 w-5 text-green-600" />
                        <span className="font-semibold text-gray-800">
                          Đơn #{assignment.orderId}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 font-medium">
                        {order?.shopName || "Đang tải..."}
                      </p>
                    </div>
                    <span className={getStatusBadgeClass(assignment.status)}>
                      {getStatusText(assignment.status)}
                    </span>
                  </div>

                  {/* Customer Info */}
                  <div className="space-y-1 text-sm">
                    <div className="flex items-start gap-2 text-gray-600">
                      <Phone className="h-4 w-4 mt-0.5 flex-shrink-0 text-green-600" />
                      <span>{order?.phone || "N/A"}</span>
                    </div>
                    <div className="flex items-start gap-2 text-gray-600">
                      <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0 text-green-600" />
                      <span className="line-clamp-2">
                        {order?.address || "N/A"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Order Details */}
                <div className="p-4 space-y-3">
                  {/* Products */}
                  {order?.orderDetails && order.orderDetails.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        Sản phẩm ({order.orderDetails.length})
                      </h4>
                      {order.orderDetails.map((detail, idx) => {
                        const productColor = detail.productColorId
                          ? productDetails.get(detail.productColorId)
                          : null;
                        const productImage =
                          productColor?.images?.[0]?.image ||
                          productColor?.product?.thumbnailImage;
                        return (
                          <div
                            key={idx}
                            className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                          >
                            {productImage && (
                              <img
                                src={productImage}
                                alt={productColor?.product?.name || "Product"}
                                className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-800 text-sm line-clamp-1">
                                {productColor?.product?.name ||
                                  `Sản phẩm #${idx + 1}`}
                              </p>
                              <p className="text-xs text-gray-500 mt-0.5">
                                {productColor?.color?.colorName || "N/A"} • SL:{" "}
                                {detail.quantity}
                              </p>
                              <p className="text-sm font-semibold text-green-600 mt-1">
                                {formatCurrency(detail.price)}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Summary */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1 text-gray-600">
                        <Package className="h-4 w-4" />
                        <span>{totalQuantity} sản phẩm</span>
                      </div>
                      <div className="flex items-center gap-1 text-gray-600">
                        <Clock className="h-4 w-4" />
                        <span>
                          {order?.orderDate
                            ? new Date(order.orderDate).toLocaleDateString(
                                "vi-VN"
                              )
                            : "N/A"}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Tổng tiền</p>
                      <p className="text-lg font-bold text-green-600">
                        {formatCurrency(order?.price || 0)}
                      </p>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="space-y-2 pt-2">
                    {/* Nút lấy hàng */}
                    <button
                      onClick={() => handlePickupOrder(assignment.id)}
                      className="w-full flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-3 rounded-lg font-medium text-sm hover:bg-green-700 active:bg-green-800 transition-colors shadow-md"
                    >
                      <Package className="h-5 w-5" />
                      <span>Lấy hàng & Bắt đầu giao</span>
                    </button>

                    {/* Nút gọi điện */}
                    <button
                      onClick={() => handleCallCustomer(assignment.orderId)}
                      className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-3 rounded-lg font-medium text-sm hover:bg-blue-700 active:bg-blue-800 transition-colors shadow-md"
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
