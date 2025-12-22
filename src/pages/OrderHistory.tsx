"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Search,
  Package,
  Clock,
  Truck,
  CheckCircle,
  XCircle,
  ShoppingBag,
  Calendar,
  MapPin,
  CreditCard,
  FileText,
  Phone,
  Eye,
  Star,
} from "lucide-react";
import { orderService } from "@/service/orderService";
import type { OrderItem } from "../types/order";
import { OrderProcessTimeline } from "@/components/OrderProcessTimeline";
import { RatingModal } from "@/components/RatingModal";

// Process status config
const processStatusConfig: Record<
  string,
  { label: string; color: string; icon: React.ReactNode }
> = {
  PRE_ORDER: {
    label: "Hàng đặt trước",
    color:
      "bg-indigo-50 text-indigo-700 ring-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-300 dark:ring-indigo-800",
    icon: <Package className="h-3 w-3" />,
  },
  PENDING: {
    label: "Đang chờ",
    color:
      "bg-yellow-50 text-yellow-700 ring-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:ring-yellow-800",
    icon: <Clock className="h-3 w-3" />,
  },
  PAYMENT: {
    label: "Đã thanh toán",
    color:
      "bg-green-50 text-green-700 ring-green-200 dark:bg-green-900/20 dark:text-green-300 dark:ring-green-800",
    icon: <CheckCircle className="h-3 w-3" />,
  },
  ASSIGN_ORDER_STORE: {
    label: "Cửa hàng đã nhận đơn",
    color:
      "bg-cyan-50 text-cyan-700 ring-cyan-200 dark:bg-cyan-900/20 dark:text-cyan-300 dark:ring-cyan-800",
    icon: <Package className="h-3 w-3" />,
  },
  MANAGER_ACCEPT: {
    label: "Đã xác nhận đơn",
    color:
      "bg-blue-50 text-blue-700 ring-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:ring-blue-800",
    icon: <CheckCircle className="h-3 w-3" />,
  },
  MANAGER_REJECT: {
    label: "Đã hủy đơn",
    color:
      "bg-red-50 text-red-700 ring-red-200 dark:bg-red-900/20 dark:text-red-300 dark:ring-red-800",
    icon: <XCircle className="h-3 w-3" />,
  },
  READY_FOR_INVOICE: {
    label: "Xuất hóa đơn",
    color:
      "bg-violet-50 text-violet-700 ring-violet-200 dark:bg-violet-900/20 dark:text-violet-300 dark:ring-violet-800",
    icon: <Package className="h-3 w-3" />,
  },
  MANAGER_EXPORT_ORDER: {
    label: "Quản lý xuất đơn",
    color:
      "bg-teal-50 text-teal-700 ring-teal-200 dark:bg-teal-900/20 dark:text-teal-300 dark:ring-teal-800",
    icon: <Package className="h-3 w-3" />,
  },
  CONFIRMED: {
    label: "Đã xác nhận",
    color:
      "bg-blue-50 text-blue-700 ring-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:ring-blue-800",
    icon: <CheckCircle className="h-3 w-3" />,
  },
  PACKAGED: {
    label: "Đang đóng gói hàng",
    color:
      "bg-orange-50 text-orange-700 ring-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:ring-orange-800",
    icon: <Package className="h-3 w-3" />,
  },
  SHIPPING: {
    label: "Đang vận chuyển",
    color:
      "bg-purple-50 text-purple-700 ring-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:ring-purple-800",
    icon: <Truck className="h-3 w-3" />,
  },
  DELIVERED: {
    label: "Đã vận chuyển",
    color:
      "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:ring-emerald-800",
    icon: <CheckCircle className="h-3 w-3" />,
  },
  FINISHED: {
    label: "Hoàn thành",
    color:
      "bg-green-50 text-green-700 ring-green-200 dark:bg-green-900/20 dark:text-green-300 dark:ring-green-800",
    icon: <CheckCircle className="h-3 w-3" />,
  },
  CANCELLED: {
    label: "Đã hủy",
    color:
      "bg-red-50 text-red-700 ring-red-200 dark:bg-red-900/20 dark:text-red-300 dark:ring-red-800",
    icon: <XCircle className="h-3 w-3" />,
  },
};

interface OrderDetailProduct {
  id: number;
  productColorId: string;
  quantity: number;
  price: number;
  productColor?: {
    product?: { name: string };
    color?: { colorName: string };
    images?: Array<{ image: string }>;
  };
}

interface OrderAddress {
  addressLine?: string;
  street?: string;
  ward?: string;
  district?: string;
  city?: string;
  phone?: string;
  userName?: string;
  name?: string;
}

const orderTabs = [
  { key: "all", label: "Tất cả", icon: ShoppingBag },
  { key: "PRE_ORDER", label: "Đặt trước", icon: Clock },
  { key: "PENDING_GROUP", label: "Chờ xử lý", icon: Clock },
  { key: "CONFIRMED_GROUP", label: "Đã xác nhận", icon: CheckCircle },
  { key: "SHIPPING", label: "Đang giao", icon: Truck },
  { key: "DELIVERED", label: "Đã giao", icon: CheckCircle },
  { key: "FINISHED", label: "Hoàn thành", icon: CheckCircle },
  { key: "CANCELLED", label: "Đã hủy", icon: XCircle },
];

const getStatusColor = (status: string) => {
  const statusColors = {
    PRE_ORDER:
      "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400",
    PENDING:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400",
    PAYMENT: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
    ASSIGN_ORDER_STORE:
      "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/20 dark:text-cyan-400",
    MANAGER_ACCEPT:
      "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
    READY_FOR_INVOICE:
      "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400",
    MANAGER_REJECT:
      "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
    MANAGER_EXPORT_ORDER:
      "bg-teal-100 text-teal-800 dark:bg-teal-900/20 dark:text-teal-400",
    CONFIRMED:
      "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
    PACKAGED:
      "bg-violet-100 text-violet-800 dark:bg-violet-900/20 dark:text-violet-400",
    SHIPPING:
      "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400",
    DELIVERED:
      "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
    FINISHED:
      "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400",
    CANCELLED: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
  };
  return (
    statusColors[status as keyof typeof statusColors] || statusColors.PENDING
  );
};

const getStatusLabel = (status: string) => {
  const statusLabels = {
    PRE_ORDER: "Đặt trước",
    PENDING: "Chờ xử lý",
    PAYMENT: "Chờ thanh toán",
    ASSIGN_ORDER_STORE: "Phân phối cho cửa hàng",
    MANAGER_ACCEPT: "Quản lý chấp nhận",
    READY_FOR_INVOICE: "Sẵn sàng xuất hóa đơn",
    MANAGER_REJECT: "Quản lý từ chối",
    MANAGER_EXPORT_ORDER: "Quản lý xuất đơn",
    CONFIRMED: "Đã xác nhận",
    PACKAGED: "Đã đóng gói",
    SHIPPING: "Đang giao hàng",
    DELIVERED: "Đã giao hàng",
    FINISHED: "Hoàn thành",
    CANCELLED: "Đã hủy",
  };
  return statusLabels[status as keyof typeof statusLabels] || status;
};

const getPaymentMethodLabel = (method: string) => {
  const labels: Record<string, string> = {
    COD: "Thanh toán khi nhận hàng",
    VNPAY: "VNPay",
    MOMO: "MoMo",
    BANK: "Chuyển khoản ngân hàng",
  };
  return labels[method] || method;
};

const fadeUp = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

export default function OrderHistory() {
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredOrders, setFilteredOrders] = useState<OrderItem[]>([]);
  const [allOrders, setAllOrders] = useState<OrderItem[]>([]); // Cache tất cả orders
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(
    null
  );
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedOrderToCancel, setSelectedOrderToCancel] =
    useState<OrderItem | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [showDetailModal, setShowDetailModal] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedOrderDetail, setSelectedOrderDetail] = useState<any>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const ordersPerPage = 10;

  // ⭐ Rating modal state
  const [isRatingOpen, setIsRatingOpen] = useState(false);
  const [ratingProductId, setRatingProductId] = useState<string | null>(null);
  const [ratingOrderId, setRatingOrderId] = useState<string | null>(null);

  // Load tất cả orders một lần khi component mount
  useEffect(() => {
    const loadAllOrders = async () => {
      setLoading(true);
      setError(null);
      try {
        // Gọi API search/customer - lấy toàn bộ không giới hạn
        const result = await orderService.searchOrdersByCustomer();

        setAllOrders(result.orders || []);
      } catch (error) {
        console.error("Error loading orders:", error);
        setError(
          error instanceof Error
            ? error.message
            : "Không thể tải danh sách đơn hàng"
        );
        setAllOrders([]);
      } finally {
        setLoading(false);
      }
    };

    loadAllOrders();
  }, []); // Chỉ chạy 1 lần khi mount

  // Filter và pagination ở frontend
  useEffect(() => {
    let filtered = [...allOrders].sort(
      (a, b) =>
        new Date(b.orderDate).getTime() -
        new Date(a.orderDate).getTime()
    );

    // API đã trả về theo thứ tự mới nhất trước

    // Filter theo status
    if (activeTab !== "all") {
      if (activeTab === "PENDING_GROUP") {
        // Chờ xử lý: PENDING, PAYMENT, ASSIGN_ORDER_STORE
        filtered = filtered.filter((order) =>
          ["PENDING", "PAYMENT", "ASSIGN_ORDER_STORE"].includes(
            order.rawStatus || order.status
          )
        );
      } else if (activeTab === "CONFIRMED_GROUP") {
        // Đã xác nhận: MANAGER_ACCEPT, CONFIRMED, PACKAGED
        filtered = filtered.filter((order) =>
          ["MANAGER_ACCEPT", "CONFIRMED", "PACKAGED"].includes(
            order.rawStatus || order.status
          )
        );
      } else {
        filtered = filtered.filter(
          (order) => (order.rawStatus || order.status) === activeTab
        );
      }
    }

    // Filter theo search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (order) =>
          order.id.toLowerCase().includes(query) ||
          order.productName?.toLowerCase().includes(query) ||
          order.shopName?.toLowerCase().includes(query)
      );
    }

    // Pagination
    const totalFiltered = filtered.length;
    const startIndex = (currentPage - 1) * ordersPerPage;
    const endIndex = startIndex + ordersPerPage;
    const paginatedOrders = filtered.slice(startIndex, endIndex);

    setFilteredOrders(paginatedOrders);
    setTotalOrders(totalFiltered);
  }, [allOrders, activeTab, searchQuery, currentPage]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN").format(price) + "đ";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Check if order can be cancelled (before MANAGER_ACCEPT status)
  const canCancelOrder = (order: OrderItem) => {
    const cancelableStatuses = [
      "PRE_ORDER",
      "PENDING",
      "PAYMENT",
      "ASSIGN_ORDER_STORE",
    ];
    return cancelableStatuses.includes(order.rawStatus || order.status);
  };

  const handleCancelOrder = (order: OrderItem) => {
    setSelectedOrderToCancel(order);
    setShowCancelModal(true);
    setCancelReason("");
  };

  const confirmCancelOrder = async () => {
    if (!selectedOrderToCancel) return;

    if (!cancelReason.trim()) {
      setError("Vui lòng nhập lý do hủy đơn hàng");
      return;
    }

    setCancellingOrderId(selectedOrderToCancel.id);
    setShowCancelModal(false);

    try {
      await orderService.cancelOrder(
        Number(selectedOrderToCancel.id),
        cancelReason
      );

      // Refresh orders - lấy toàn bộ không giới hạn
      const result = await orderService.searchOrdersByCustomer();
      setAllOrders(result.orders || []);

      setError(null);
    } catch (error) {
      console.error("Error cancelling order:", error);
      setError(
        error instanceof Error ? error.message : "Không thể hủy đơn hàng"
      );
    } finally {
      setCancellingOrderId(null);
      setSelectedOrderToCancel(null);
      setCancelReason("");
    }
  };

  const handleViewDetail = async (order: OrderItem) => {
    setShowDetailModal(true);
    setLoadingDetail(true);
    setSelectedOrderDetail(null);

    try {
      const detail = await orderService.getOrderFullDetail(Number(order.id));
      setSelectedOrderDetail(detail);
    } catch (error) {
      console.error("Error loading order detail:", error);
      setError("Không thể tải chi tiết đơn hàng");
    } finally {
      setLoadingDetail(false);
    }
  };

  const formatAddress = (address: OrderAddress) => {
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

  // ⭐ Handle open rating modal
  const openRatingModal = (productId: string, orderId: string) => {
    setRatingProductId(productId);
    setRatingOrderId(orderId);
    setIsRatingOpen(true);
  };

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={fadeUp}
      className="bg-card rounded-xl shadow-xl border border-border/50 overflow-hidden"
    >
      <div className="p-3 sm:p-4 border-b border-border/50">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <ShoppingBag className="h-5 w-5 text-primary" />
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-foreground">
            Đơn hàng nội thất
          </h3>
        </div>

        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Tìm kiếm theo mã đơn hàng"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 sm:py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground placeholder:text-muted-foreground text-sm"
          />
        </div>

        <div className="flex flex-wrap gap-1.5">
          {orderTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => {
                  setActiveTab(tab.key);
                  setCurrentPage(1); // Reset về trang 1 khi đổi tab
                }}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 ${isActive
                  ? "bg-primary text-primary-foreground shadow-lg"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="p-3 sm:p-4">
        {error && (
          <div className="mb-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                {error}
              </p>
              <button
                onClick={() => setError(null)}
                className="ml-auto text-yellow-600 dark:text-yellow-400 hover:text-yellow-800 dark:hover:text-yellow-200"
                aria-label="Đóng thông báo"
              >
                <XCircle className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-3"></div>
            <p className="text-sm text-muted-foreground">
              Đang tải đơn hàng...
            </p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-8">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="text-base font-semibold text-foreground mb-1">
              Không có đơn hàng nào
            </h3>
            <p className="text-sm text-muted-foreground">
              {searchQuery
                ? "Không tìm thấy đơn hàng phù hợp"
                : "Bạn chưa có đơn hàng nào"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredOrders.map((order) => (
              <motion.div
                key={order.id}
                variants={fadeUp}
                className="bg-muted/30 rounded-lg border border-border/50 p-3 sm:p-4 hover:shadow-lg transition-all duration-200"
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-3 pb-3 border-b border-border/30">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-primary/10 rounded-lg">
                      <ShoppingBag className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <h4 className="text-sm sm:text-base font-semibold text-foreground">
                        {order.shopName}
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        Mã đơn: #{order.id}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getStatusColor(
                      order.rawStatus || order.status
                    )}`}
                  >
                    {getStatusLabel(order.rawStatus || order.status)}
                  </span>
                </div>

                {/* Summary Info */}
                <div className="mb-3 p-2 sm:p-3 bg-background/50 rounded-lg">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm">
                    {/* Số điện thoại khách hàng */}
                    {(order.user?.phone || order.phone) && (
                      <div className="flex items-center gap-2 col-span-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          SĐT khách hàng:
                        </span>
                        <span className="font-medium text-foreground">
                          {order.user?.phone || order.phone}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Số lượng:</span>
                      <span className="font-medium text-foreground">
                        {order.quantity} sản phẩm
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Đặt hàng:</span>
                      <span className="font-medium text-foreground">
                        {formatDate(order.orderDate)}
                      </span>
                    </div>
                    {order.address && (
                      <div className="flex items-start gap-2 col-span-2">
                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div>
                          <span className="text-muted-foreground">
                            Địa chỉ:{" "}
                          </span>
                          <span className="font-medium text-foreground">
                            {typeof order.address === "string"
                              ? order.address
                              : order.address.fullAddress}
                          </span>
                        </div>
                      </div>
                    )}
                    {order.paymentMethod && (
                      <div className="flex items-center gap-2 col-span-2">
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          Thanh toán:
                        </span>
                        <span className="font-medium text-foreground">
                          {getPaymentMethodLabel(order.paymentMethod)}
                        </span>
                        {order.transactionCode && (
                          <span className="text-xs text-muted-foreground">
                            ({order.transactionCode})
                          </span>
                        )}
                      </div>
                    )}
                    {order.note && (
                      <div className="flex items-start gap-2 col-span-2">
                        <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div>
                          <span className="text-muted-foreground">
                            Ghi chú:{" "}
                          </span>
                          <span className="text-foreground">{order.note}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Order Details */}
                {order.orderDetails && order.orderDetails.length > 0 && (
                  <div className="mb-3 space-y-1.5">
                    <h5 className="text-xs sm:text-sm font-semibold text-foreground mb-1.5">
                      Chi tiết sản phẩm:
                    </h5>
                    {order.orderDetails.map((detail, idx) => (
                      <div
                        key={detail.id}
                        className="flex gap-2 items-center p-2 bg-background/30 rounded-lg text-xs sm:text-sm"
                      >
                        {detail.productColor?.images?.[0]?.image && (
                          <img
                            src={detail.productColor.images[0].image}
                            alt={
                              detail.productColor?.product?.name ||
                              `Sản phẩm ${idx + 1}`
                            }
                            className="w-10 h-10 sm:w-12 sm:h-12 object-cover rounded-lg shrink-0"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground truncate text-xs sm:text-sm">
                            {detail.productColor?.product?.name ||
                              `Sản phẩm ${idx + 1}`}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Màu:{" "}
                            {detail.productColor?.color?.colorName || "N/A"}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-foreground text-xs">
                            x{detail.quantity}
                          </span>
                          <span className="font-medium text-foreground min-w-16 sm:min-w-20 text-right text-xs sm:text-sm">
                            {formatPrice(detail.price)}
                          </span>
                          {/* Rating Button */}
                          {(order.rawStatus || order.status) === "FINISHED" && (
                            <button
                              onClick={() =>
                                openRatingModal(
                                  detail.productColor!.product.id, // Đã thêm dấu ! để fix lỗi TS
                                  order.id
                                )
                              }
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-yellow-50 text-yellow-700 hover:bg-yellow-100 border border-yellow-200 transition-colors dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800 dark:hover:bg-yellow-900/30"
                            >
                              <Star className="h-3.5 w-3.5" />
                              <span className="text-xs font-medium whitespace-nowrap">Đánh giá</span>
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Total */}
                <div className="flex items-center justify-between pt-3 border-t border-border/30">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xs sm:text-sm text-muted-foreground">
                      Tổng tiền:
                    </span>
                    <span className="text-lg sm:text-xl font-bold text-primary">
                      {formatPrice(order.price)}
                    </span>
                    {ratingProductId && ratingOrderId && (
                      <RatingModal
                        isOpen={isRatingOpen}
                        onClose={() => setIsRatingOpen(false)}
                        productId={ratingProductId}
                        orderId={ratingOrderId}
                        onSuccess={() => {
                          // không bắt buộc
                          console.log("Đánh giá thành công");
                        }}
                      />
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {/* View Detail Button */}
                    <button
                      onClick={() => handleViewDetail(order)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200 transition-colors dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800 dark:hover:bg-blue-900/30"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span className="text-xs sm:text-sm font-medium">
                        Xem chi tiết
                      </span>
                    </button>

                    {/* Cancel Button - Only show for cancelable orders */}
                    {canCancelOrder(order) && (
                      <button
                        onClick={() => handleCancelOrder(order)}
                        disabled={cancellingOrderId === order.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed dark:bg-red-900/20 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/30"
                      >
                        {cancellingOrderId === order.id ? (
                          <>
                            <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-red-600"></div>
                            <span className="text-xs sm:text-sm font-medium">
                              Đang hủy...
                            </span>
                          </>
                        ) : (
                          <>
                            <XCircle className="h-3.5 w-3.5" />
                            <span className="text-xs sm:text-sm font-medium">
                              Hủy đơn hàng
                            </span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {totalOrders > ordersPerPage && (
          <div className="flex justify-center items-center gap-2 mt-4 pt-4 border-t border-border/30">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1 || loading}
              className="px-3 py-2 text-sm border border-border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted/50"
            >
              Trước
            </button>
            <span className="px-4 py-2 text-sm text-muted-foreground">
              Trang {currentPage} / {Math.ceil(totalOrders / ordersPerPage)}
            </span>
            <button
              onClick={() =>
                setCurrentPage((prev) =>
                  Math.min(Math.ceil(totalOrders / ordersPerPage), prev + 1)
                )
              }
              disabled={
                currentPage >= Math.ceil(totalOrders / ordersPerPage) || loading
              }
              className="px-3 py-2 text-sm border border-border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted/50"
            >
              Sau
            </button>
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      {showDetailModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 sm:p-4 overflow-y-auto"
          onClick={() => setShowDetailModal(false)}
        >
          <div
            className="bg-card rounded-xl max-w-4xl w-full my-8 shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {loadingDetail ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-sm text-muted-foreground">
                  Đang tải chi tiết...
                </p>
              </div>
            ) : selectedOrderDetail ? (
              <div className="p-4 sm:p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-4 pb-4 border-b border-border">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-full">
                      <Package className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-foreground">
                        Chi tiết đơn hàng #{selectedOrderDetail.id}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(selectedOrderDetail.orderDate)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="p-2 hover:bg-muted rounded-lg transition-colors"
                    aria-label="Đóng"
                  >
                    <XCircle className="h-6 w-6 text-muted-foreground" />
                  </button>
                </div>

                {/* Status */}
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-foreground mb-2">
                    Trạng thái đơn hàng
                  </h4>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-3 py-1.5 rounded-full text-sm font-medium ${getStatusColor(
                        selectedOrderDetail.status
                      )}`}
                    >
                      {getStatusLabel(selectedOrderDetail.status)}
                    </span>
                  </div>
                </div>

                {/* Customer Info */}
                {selectedOrderDetail.user && (
                  <div className="mb-4 p-3 bg-muted/30 rounded-lg">
                    <h4 className="text-sm font-semibold text-foreground mb-2">
                      Thông tin khách hàng
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Họ tên: </span>
                        <span className="font-medium text-foreground">
                          {selectedOrderDetail.user.fullName || "N/A"}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Email: </span>
                        <span className="font-medium text-foreground">
                          {selectedOrderDetail.user.email || "N/A"}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">SĐT: </span>
                        <span className="font-medium text-foreground">
                          {selectedOrderDetail.user.phone || "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Delivery Address */}
                {selectedOrderDetail.address && (
                  <div className="mb-4 p-3 bg-muted/30 rounded-lg">
                    <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Địa chỉ giao hàng
                    </h4>
                    <div className="text-sm space-y-1">
                      <p className="font-medium text-foreground">
                        {selectedOrderDetail.address.userName ||
                          selectedOrderDetail.address.name}
                      </p>
                      <p className="text-muted-foreground">
                        SĐT: {selectedOrderDetail.address.phone}
                      </p>
                      <p className="text-foreground">
                        {formatAddress(selectedOrderDetail.address)}
                      </p>
                    </div>
                  </div>
                )}

                {/* Payment Info */}
                {selectedOrderDetail.payment && (
                  <div className="mb-4 p-3 bg-muted/30 rounded-lg">
                    <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Thông tin thanh toán
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">
                          Phương thức:{" "}
                        </span>
                        <span className="font-medium text-foreground">
                          {getPaymentMethodLabel(
                            selectedOrderDetail.payment.paymentMethod
                          )}
                        </span>
                      </div>
                      {selectedOrderDetail.payment.transactionCode && (
                        <div>
                          <span className="text-muted-foreground">
                            Mã giao dịch:{" "}
                          </span>
                          <span className="font-medium text-foreground">
                            {selectedOrderDetail.payment.transactionCode}
                          </span>
                        </div>
                      )}
                      <div>
                        <span className="text-muted-foreground">
                          Trạng thái TT:{" "}
                        </span>
                        <span
                          className={`font-medium ${selectedOrderDetail.payment.paymentStatus === "PAID"
                            ? "text-green-600"
                            : "text-yellow-600"
                            }`}
                        >
                          {selectedOrderDetail.payment.paymentStatus === "PAID"
                            ? "Đã thanh toán"
                            : selectedOrderDetail.payment.paymentStatus ===
                              "PENDING" ||
                              selectedOrderDetail.payment.paymentStatus ===
                              "NOT_PAID"
                              ? "Chưa thanh toán"
                              : selectedOrderDetail.payment.paymentStatus}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Order Details / Products */}
                {selectedOrderDetail.orderDetails &&
                  selectedOrderDetail.orderDetails.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-foreground mb-3">
                        Sản phẩm ({selectedOrderDetail.orderDetails.length})
                      </h4>
                      <div className="space-y-2">
                        {selectedOrderDetail.orderDetails.map(
                          (detail: OrderDetailProduct, idx: number) => (
                            <div
                              key={detail.id || idx}
                              className="flex gap-3 p-3 bg-muted/30 rounded-lg"
                            >
                              {detail.productColor?.images?.[0]?.image && (
                                <img
                                  src={detail.productColor.images[0].image}
                                  alt={
                                    detail.productColor?.product?.name ||
                                    "Product"
                                  }
                                  className="w-16 h-16 object-cover rounded-lg shrink-0"
                                />
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-foreground text-sm mb-1">
                                  {detail.productColor?.product?.name ||
                                    `Sản phẩm ${idx + 1}`}
                                </p>
                                <p className="text-xs text-muted-foreground mb-1">
                                  Màu:{" "}
                                  {detail.productColor?.color?.colorName ||
                                    "N/A"}
                                </p>
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-muted-foreground">
                                    x{detail.quantity}
                                  </span>
                                  <span className="font-semibold text-primary">
                                    {formatPrice(detail.price)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}

                {/* Order Note */}
                {selectedOrderDetail.note && (
                  <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                    <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Ghi chú đơn hàng
                    </h4>
                    <p className="text-sm text-foreground">
                      {selectedOrderDetail.note}
                    </p>
                  </div>
                )}

                {/* Process History Timeline */}
                <OrderProcessTimeline
                  processOrders={selectedOrderDetail.processOrders || []}
                  processStatusConfig={processStatusConfig}
                  formatDate={formatDate}
                />

                {/* Delivery Confirmation Photos */}
                {(selectedOrderDetail.deliveryConfirmationResponse
                  ?.deliveryPhotos ||
                  selectedOrderDetail.deliveryConfirmationResponse
                    ?.customerSignature) && (
                    <div className="mb-4 rounded-lg bg-muted/30 p-3">
                      <div className="text-xs font-medium text-foreground mb-3 flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        Xác nhận giao hàng thành công
                      </div>

                      {selectedOrderDetail.deliveryConfirmationResponse
                        ?.deliveryPhotos &&
                        selectedOrderDetail.deliveryConfirmationResponse
                          .deliveryPhotos.length > 0 && (
                          <div className="mb-3">
                            <p className="text-xs text-muted-foreground mb-2">
                              Hình ảnh giao hàng:
                            </p>
                            <div className="grid grid-cols-2 gap-2">
                              {selectedOrderDetail.deliveryConfirmationResponse.deliveryPhotos.map(
                                (photo: string, idx: number) => (
                                  <img
                                    key={idx}
                                    src={photo}
                                    alt={`Delivery photo ${idx + 1}`}
                                    className="w-full h-32 object-cover rounded-lg border border-border"
                                  />
                                )
                              )}
                            </div>
                          </div>
                        )}

                      {selectedOrderDetail.deliveryConfirmationResponse
                        ?.customerSignature && (
                          <div>
                            <p className="text-xs text-muted-foreground mb-2">
                              Chữ ký khách hàng:
                            </p>
                            <img
                              src={
                                selectedOrderDetail.deliveryConfirmationResponse
                                  .customerSignature
                              }
                              alt="Customer signature"
                              className="w-full max-w-sm h-32 object-contain rounded-lg border border-border bg-white dark:bg-gray-900"
                            />
                          </div>
                        )}
                    </div>
                  )}

                {/* Total */}
                <div className="border-t border-border pt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-base font-semibold text-foreground">
                      Tổng cộng:
                    </span>
                    <span className="text-2xl font-bold text-primary">
                      {formatPrice(selectedOrderDetail.total)}
                    </span>
                  </div>
                  {selectedOrderDetail.depositPrice &&
                    selectedOrderDetail.depositPrice > 0 && (
                      <div className="flex items-center justify-between mt-2 text-sm">
                        <span className="text-muted-foreground">Đã cọc:</span>
                        <span className="font-medium text-foreground">
                          {formatPrice(selectedOrderDetail.depositPrice)}
                        </span>
                      </div>
                    )}
                </div>

                {/* Close Button */}
                <div className="mt-6">
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="w-full px-4 py-2.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium"
                  >
                    Đóng
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center">
                <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <p className="text-sm text-muted-foreground">
                  Không thể tải chi tiết đơn hàng
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Cancel Order Modal */}
      {showCancelModal && selectedOrderToCancel && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 sm:p-4"
          onClick={() => setShowCancelModal(false)}
        >
          <div
            className="bg-card rounded-xl max-w-md w-full p-4 sm:p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-full">
                <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-foreground">
                Xác nhận hủy đơn hàng
              </h3>
            </div>

            <div className="mb-3">
              <p className="text-xs sm:text-sm text-muted-foreground mb-1.5">
                Bạn có chắc chắn muốn hủy đơn hàng #{selectedOrderToCancel.id}?
              </p>
              <p className="text-xs text-muted-foreground">
                Tổng tiền:{" "}
                <span className="font-semibold text-foreground">
                  {formatPrice(selectedOrderToCancel.price)}
                </span>
              </p>
            </div>

            <div className="mb-4">
              <label
                htmlFor="cancelReason"
                className="block text-xs sm:text-sm font-medium text-foreground mb-1.5"
              >
                Lý do hủy đơn <span className="text-red-500">*</span>
              </label>
              <textarea
                id="cancelReason"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Nhập lý do hủy đơn hàng..."
                rows={3}
                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent bg-background text-foreground placeholder:text-muted-foreground resize-none text-sm"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-foreground hover:bg-muted transition-colors text-xs sm:text-sm"
              >
                Đóng
              </button>
              <button
                onClick={confirmCancelOrder}
                disabled={!cancelReason.trim()}
                className="flex-1 px-3 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm"
              >
                Xác nhận hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
