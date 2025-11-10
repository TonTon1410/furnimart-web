/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import {
  Package,
  Search,
  Eye,
  X,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  Truck,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";
import { DP } from "@/router/paths";
import Pagination from "@/components/Pagination";
import CustomDropdown from "@/components/CustomDropdown";
import { orderService } from "@/service/orderService";
import { productService, type ProductColor } from "@/service/productService";
import type { OrderItem } from "@/types/order";

// Process status config - Tất cả trạng thái hiển thị bằng tiếng Việt
const processStatusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  PRE_ORDER: {
    label: "Hàng đặt trước",
    color: "bg-indigo-50 text-indigo-700 ring-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-300 dark:ring-indigo-800",
    icon: <Package className="h-3 w-3" />,
  },
  PENDING: {
    label: "Đang chờ",
    color: "bg-yellow-50 text-yellow-700 ring-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:ring-yellow-800",
    icon: <Clock className="h-3 w-3" />,
  },
  PAYMENT: {
    label: "Đã thanh toán",
    color: "bg-green-50 text-green-700 ring-green-200 dark:bg-green-900/20 dark:text-green-300 dark:ring-green-800",
    icon: <CheckCircle className="h-3 w-3" />,
  },
  ASSIGN_ORDER_STORE: {
    label: "Cửa hàng đã nhận đơn",
    color: "bg-cyan-50 text-cyan-700 ring-cyan-200 dark:bg-cyan-900/20 dark:text-cyan-300 dark:ring-cyan-800",
    icon: <Package className="h-3 w-3" />,
  },
  MANAGER_ACCEPT: {
    label: "Quản lí cửa hàng đã nhận đơn",
    color: "bg-blue-50 text-blue-700 ring-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:ring-blue-800",
    icon: <ThumbsUp className="h-3 w-3" />,
  },
  MANAGER_REJECT: {
    label: "Quản lí cửa hàng đã hủy đơn",
    color: "bg-red-50 text-red-700 ring-red-200 dark:bg-red-900/20 dark:text-red-300 dark:ring-red-800",
    icon: <ThumbsDown className="h-3 w-3" />,
  },
  CONFIRMED: {
    label: "Đã xác nhận",
    color: "bg-blue-50 text-blue-700 ring-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:ring-blue-800",
    icon: <CheckCircle className="h-3 w-3" />,
  },
  PACKAGED: {
    label: "Đang chuẩn bị hàng",
    color: "bg-orange-50 text-orange-700 ring-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:ring-orange-800",
    icon: <Package className="h-3 w-3" />,
  },
  SHIPPING: {
    label: "Đang vận chuyển",
    color: "bg-purple-50 text-purple-700 ring-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:ring-purple-800",
    icon: <Truck className="h-3 w-3" />,
  },
  DELIVERED: {
    label: "Đã vận chuyển",
    color: "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:ring-emerald-800",
    icon: <CheckCircle className="h-3 w-3" />,
  },
  FINISHED: {
    label: "Hoàn thành",
    color: "bg-green-50 text-green-700 ring-green-200 dark:bg-green-900/20 dark:text-green-300 dark:ring-green-800",
    icon: <CheckCircle className="h-3 w-3" />,
  },
  CANCELLED: {
    label: "Đã hủy đơn",
    color: "bg-red-50 text-red-700 ring-red-200 dark:bg-red-900/20 dark:text-red-300 dark:ring-red-800",
    icon: <XCircle className="h-3 w-3" />,
  },
};

const OrderManagement: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [totalOrders, setTotalOrders] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Detail modal
  const [selectedOrder, setSelectedOrder] = useState<OrderItem | null>(null);
  const [fullOrderDetail, setFullOrderDetail] = useState<any>(null); // Full detail từ API /orders/{id}
  const [loadingOrderDetail, setLoadingOrderDetail] = useState(false);
  
  // Product details for order items
  const [productDetails, setProductDetails] = useState<Record<string, ProductColor>>({});
  const [loadingProducts, setLoadingProducts] = useState(false);
  
  // Action loading states
  const [acceptingOrderId, setAcceptingOrderId] = useState<string | null>(null);
  const [rejectingOrderId, setRejectingOrderId] = useState<string | null>(null);

  // Fetch orders - Lấy tất cả đơn hàng 1 lần để filter phía client
  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await orderService.searchAllOrders({
          search: searchQuery,
        });

        setOrders(response.orders);
        setTotalOrders(response.total);
      } catch (err: any) {
        setError(err.message || "Không thể tải danh sách đơn hàng");
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [searchQuery]); // Chỉ gọi lại khi searchQuery thay đổi

  // Handle accept order
  const handleAcceptOrder = async (orderId: string) => {
    if (!confirm("Bạn có chắc chắn muốn chấp nhận đơn hàng này?")) return;
    
    setAcceptingOrderId(orderId);
    try {
      await orderService.acceptOrder(Number(orderId));
      alert("Đã chấp nhận đơn hàng thành công!");
      
      // Refresh orders
      const response = await orderService.searchAllOrders({
        search: searchQuery,
      });
      setOrders(response.orders);
      setTotalOrders(response.total);
    } catch (err: any) {
      alert(err.message || "Không thể chấp nhận đơn hàng");
    } finally {
      setAcceptingOrderId(null);
    }
  };

  // Handle reject order
  const handleRejectOrder = async (orderId: string) => {
    const reason = prompt("Vui lòng nhập lý do từ chối đơn hàng:");
    if (!reason || reason.trim() === "") {
      alert("Vui lòng nhập lý do từ chối!");
      return;
    }
    
    setRejectingOrderId(orderId);
    try {
      await orderService.rejectOrder(Number(orderId), reason);
      alert("Đã từ chối đơn hàng thành công!");
      
      // Refresh orders
      const response = await orderService.searchAllOrders({
        search: searchQuery,
      });
      setOrders(response.orders);
      setTotalOrders(response.total);
    } catch (err: any) {
      alert(err.message || "Không thể từ chối đơn hàng");
    } finally {
      setRejectingOrderId(null);
    }
  };

  // Handle view order detail
  const handleViewDetail = async (order: OrderItem) => {
    setSelectedOrder(order);
    setLoadingOrderDetail(true);
    
    try {
      // Fetch full order detail từ API /orders/{id} - RAW DATA
      const detail = await orderService.getOrderFullDetail(Number(order.id));
      setFullOrderDetail(detail);
    } catch (err: any) {
      console.error("Error fetching order detail:", err);
      alert(err.message || "Không thể tải chi tiết đơn hàng");
    } finally {
      setLoadingOrderDetail(false);
    }
  };

  // Fetch product details when modal opens
  useEffect(() => {
    if (!selectedOrder?.orderDetails || selectedOrder.orderDetails.length === 0) return;
    
    const fetchProductDetails = async () => {
      setLoadingProducts(true);
      const details: Record<string, ProductColor> = {};
      const orderDetails = selectedOrder.orderDetails || [];
      
      try {
        for (const item of orderDetails) {
          if (item.productColorId) {
            const response = await productService.getProductColorById(item.productColorId);
            details[item.productColorId] = response.data.data;
          }
        }
        setProductDetails(details);
      } catch (err: any) {
        console.error("Error fetching product details:", err);
      } finally {
        setLoadingProducts(false);
      }
    };
    
    fetchProductDetails();
  }, [selectedOrder]);

  // Filter by status locally and sort by date (newest first)
  const filteredOrders = useMemo(() => {
    const filtered = statusFilter === "all" 
      ? orders 
      : orders.filter((order) => order.rawStatus === statusFilter);
    
    // Sort by orderDate: newest first (descending)
    return filtered.sort((a, b) => {
      const dateA = new Date(a.orderDate).getTime();
      const dateB = new Date(b.orderDate).getTime();
      return dateB - dateA; // Mới nhất trước (descending)
    });
  }, [orders, statusFilter]);

  // Client-side pagination
  const paginatedOrders = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredOrders.slice(startIndex, endIndex);
  }, [filteredOrders, currentPage, itemsPerPage]);

  // Tính tổng số trang dựa trên filteredOrders
  const totalPagesCalculated = Math.ceil(filteredOrders.length / itemsPerPage);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  // Format date
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <main className="min-h-screen w-full bg-gray-50 px-6 py-8 dark:bg-gray-950">
      {/* Breadcrumb */}
      <div className="mb-6 flex items-center justify-between">
        <nav className="text-sm text-gray-600 dark:text-gray-300">
          <ol className="flex items-center gap-2">
            <li>
              <Link to={DP()} className="hover:underline">
                Bảng điều khiển
              </Link>
            </li>
            <li className="opacity-60">/</li>
            <li className="font-semibold">Quản lý đơn hàng</li>
          </ol>
        </nav>
      </div>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Quản lý đơn hàng
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Quản lý và theo dõi đơn hàng của cửa hàng
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap items-end gap-3 rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
        {/* Search */}
        <div className="flex flex-1 flex-col gap-1.5 min-w-[200px]">
          <label
            htmlFor="search"
            className="text-xs font-medium text-gray-600 dark:text-gray-400"
          >
            Tìm kiếm
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              id="search"
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Tìm theo mã đơn, khách hàng..."
              className="w-full rounded-xl border border-gray-300 bg-white py-2 pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
            />
          </div>
        </div>

        {/* Status filter - CustomDropdown */}
        <div className="min-w-[280px]">
          <CustomDropdown
            id="statusFilter"
            label="Trạng thái"
            value={statusFilter}
            onChange={(value) => setStatusFilter(value)}
            options={[
              { value: "all", label: "Tất cả" },
              { value: "PRE_ORDER", label: "Hàng đặt trước" },
              { value: "PENDING", label: "Đang chờ" },
              { value: "PAYMENT", label: "Đã thanh toán" },
              { value: "ASSIGN_ORDER_STORE", label: "Cửa hàng đã nhận đơn" },
              { value: "MANAGER_ACCEPT", label: "Quản lí cửa hàng đã nhận đơn" },
              { value: "MANAGER_REJECT", label: "Quản lí cửa hàng đã hủy đơn" },
              { value: "CONFIRMED", label: "Đã xác nhận" },
              { value: "PACKAGED", label: "Đang chuẩn bị hàng" },
              { value: "SHIPPING", label: "Đang vận chuyển" },
              { value: "DELIVERED", label: "Đã vận chuyển" },
              { value: "FINISHED", label: "Hoàn thành" },
              { value: "CANCELLED", label: "Đã hủy đơn" },
            ]}
            placeholder="Chọn trạng thái..."
          />
        </div>
      </div>

      {/* Stats */}
      <div className="mb-6 flex items-center gap-2 text-gray-700 dark:text-gray-200">
        <Package className="h-4 w-4 text-emerald-600" />
        <span className="text-sm">
          Tổng: {loading ? "-" : totalOrders} đơn hàng
          {statusFilter !== "all" && ` • ${processStatusConfig[statusFilter]?.label || "Lọc"}: ${filteredOrders.length}`}
        </span>
      </div>

      {/* Orders List */}
      <section>
        {loading ? (
          <div className="flex items-center gap-2 rounded-3xl border border-gray-200 bg-white p-6 text-gray-600 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300">
            <Loader2 className="h-4 w-4 animate-spin" />
            Đang tải đơn hàng...
          </div>
        ) : error ? (
          <div className="rounded-3xl border border-red-300 bg-red-50 p-6 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
            {error}
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="rounded-3xl border border-gray-200 bg-white p-8 text-center text-gray-600 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300">
            Không có đơn hàng nào phù hợp.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-3xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <table className="min-w-full text-sm text-gray-700 dark:text-gray-300">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-800/50">
                <tr>
                  <th className="px-4 py-4 text-left font-semibold text-gray-900 dark:text-gray-100">
                    Mã đơn
                  </th>
                  <th className="px-4 py-4 text-left font-semibold text-gray-900 dark:text-gray-100">
                    Khách hàng
                  </th>
                  <th className="px-4 py-4 text-left font-semibold text-gray-900 dark:text-gray-100">
                    Số lượng
                  </th>
                  <th className="px-4 py-4 text-left font-semibold text-gray-900 dark:text-gray-100">
                    Tổng tiền
                  </th>
                  <th className="px-4 py-4 text-left font-semibold text-gray-900 dark:text-gray-100">
                    Trạng thái
                  </th>
                  <th className="px-4 py-4 text-left font-semibold text-gray-900 dark:text-gray-100">
                    Ngày đặt
                  </th>
                  <th className="px-4 py-4 text-center font-semibold text-gray-900 dark:text-gray-100">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-t border-gray-100 transition-colors hover:bg-gray-50/50 dark:border-gray-800 dark:hover:bg-gray-800/30"
                  >
                    <td className="px-4 py-4">
                      <div className="font-semibold text-gray-900 dark:text-gray-100">
                        #{order.id}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="font-medium text-gray-900 dark:text-gray-100">
                        {order.shopName}
                      </div>
                      {order.address && (
                        <div className="mt-0.5 text-xs text-gray-500 dark:text-gray-400 max-w-xs truncate">
                          {order.address}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <span className="inline-flex items-center rounded-lg bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                        {order.quantity} sản phẩm
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="font-semibold text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(order.price)}
                      </div>
                      {order.paymentMethod && (
                        <div className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                          {order.paymentMethod}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium ring-1 ${
                          processStatusConfig[order.rawStatus || order.status]?.color || "bg-gray-50 text-gray-700 ring-gray-200"
                        }`}
                      >
                        {processStatusConfig[order.rawStatus || order.status]?.icon || <Clock className="h-3 w-3" />}
                        {processStatusConfig[order.rawStatus || order.status]?.label || order.rawStatus || order.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-gray-600 dark:text-gray-400">
                      {formatDate(order.orderDate)}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => handleViewDetail(order)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-white px-3 py-1.5 text-xs font-medium text-blue-600 transition-all hover:bg-blue-50 active:scale-95 dark:border-blue-800 dark:bg-gray-900 dark:text-blue-300 dark:hover:bg-blue-900/20"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          Chi tiết
                        </button>
                        
                        {/* Chỉ hiện nút Accept/Reject nếu: 
                            1. Đơn hàng đã được assign (isAssigned = true)
                            2. Đơn hàng còn ở trạng thái ASSIGN_ORDER_STORE (chưa xử lý)
                        */}
                        {order.isAssigned && order.rawStatus === 'ASSIGN_ORDER_STORE' && (
                          <>
                            <button
                              onClick={() => handleAcceptOrder(order.id)}
                              disabled={acceptingOrderId === order.id}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-green-200 bg-white px-3 py-1.5 text-xs font-medium text-green-600 transition-all hover:bg-green-50 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed dark:border-green-800 dark:bg-gray-900 dark:text-green-300 dark:hover:bg-green-900/20"
                            >
                              {acceptingOrderId === order.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <ThumbsUp className="h-3.5 w-3.5" />
                              )}
                              Chấp nhận
                            </button>
                            
                            <button
                              onClick={() => handleRejectOrder(order.id)}
                              disabled={rejectingOrderId === order.id}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-600 transition-all hover:bg-red-50 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed dark:border-red-800 dark:bg-gray-900 dark:text-red-300 dark:hover:bg-red-900/20"
                            >
                              {rejectingOrderId === order.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <ThumbsDown className="h-3.5 w-3.5" />
                              )}
                              Từ chối
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Pagination */}
      {!loading && !error && filteredOrders.length > 0 && (
        <div className="mt-6">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPagesCalculated}
            onPageChange={setCurrentPage}
            itemsPerPage={itemsPerPage}
            totalItems={filteredOrders.length}
          />
        </div>
      )}

      {/* Detail Modal */}
      {selectedOrder && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onClick={() => setSelectedOrder(null)}
        >
          <div
            className="relative max-h-[90vh] w-full max-w-3xl overflow-auto rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-800 dark:bg-gray-900"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4 dark:border-gray-800 dark:bg-gray-900">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                Chi tiết đơn hàng #{selectedOrder.id}
              </h2>
              <button
                onClick={() => setSelectedOrder(null)}
                className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-300"
                aria-label="Đóng"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-6">
              {/* Status & Store Info */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800/50">
                  <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                    Trạng thái đơn hàng
                  </div>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium ring-1 ${
                      processStatusConfig[selectedOrder.rawStatus || selectedOrder.status]?.color || "bg-gray-50 text-gray-700 ring-gray-200"
                    }`}
                  >
                    {processStatusConfig[selectedOrder.rawStatus || selectedOrder.status]?.icon || <Clock className="h-3 w-3" />}
                    {processStatusConfig[selectedOrder.rawStatus || selectedOrder.status]?.label || selectedOrder.rawStatus || selectedOrder.status}
                  </span>
                  {fullOrderDetail?.reason && (
                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                      <div className="text-xs font-medium text-red-600 dark:text-red-400 mb-1">
                        Lý do từ chối/hủy:
                      </div>
                      <div className="text-xs text-gray-700 dark:text-gray-300">
                        {fullOrderDetail.reason}
                      </div>
                    </div>
                  )}
                </div>

                {fullOrderDetail?.storeId && (
                  <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800/50">
                    <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                      Cửa hàng xử lý
                    </div>
                    <div className="text-sm text-gray-900 dark:text-gray-100 font-medium">
                      🏪 {fullOrderDetail.storeId}
                    </div>
                  </div>
                )}
              </div>

              {/* Customer Info - Enhanced with full user data */}
              <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800/50">
                <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-3">
                  Thông tin khách hàng
                </div>
                {fullOrderDetail?.user ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      {fullOrderDetail.user.avatar && (
                        <img 
                          src={fullOrderDetail.user.avatar} 
                          alt={fullOrderDetail.user.fullName}
                          className="h-12 w-12 rounded-full object-cover border-2 border-white dark:border-gray-800"
                        />
                      )}
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {fullOrderDetail.user.fullName}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          ID: {fullOrderDetail.user.id}
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
                      {fullOrderDetail.user.email && (
                        <div className="text-xs text-gray-700 dark:text-gray-300">
                          📧 {fullOrderDetail.user.email}
                        </div>
                      )}
                      {fullOrderDetail.user.phone && (
                        <div className="text-xs text-gray-700 dark:text-gray-300">
                          📞 {fullOrderDetail.user.phone}
                        </div>
                      )}
                      {fullOrderDetail.user.birthday && (
                        <div className="text-xs text-gray-700 dark:text-gray-300">
                          🎂 {formatDate(fullOrderDetail.user.birthday)}
                        </div>
                      )}
                      {fullOrderDetail.user.point !== undefined && (
                        <div className="text-xs text-gray-700 dark:text-gray-300">
                          ⭐ {fullOrderDetail.user.point} điểm
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-gray-900 dark:text-gray-100 font-medium">
                    {selectedOrder.shopName}
                    {selectedOrder.phone && (
                      <div className="mt-1 text-sm text-gray-700 dark:text-gray-300">
                        📞 {selectedOrder.phone}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Delivery Address - Enhanced */}
              {fullOrderDetail?.address ? (
                <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800/50">
                  <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                    Địa chỉ giao hàng
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-start gap-2">
                      <span className="text-gray-500 dark:text-gray-400">📍</span>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {fullOrderDetail.address.name}
                        </div>
                        <div className="text-xs text-gray-700 dark:text-gray-300 mt-0.5">
                          {fullOrderDetail.address.phone}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          {fullOrderDetail.address.fullAddress || 
                            `${fullOrderDetail.address.street}, ${fullOrderDetail.address.ward}, ${fullOrderDetail.address.district}, ${fullOrderDetail.address.city}`}
                        </div>
                        {(fullOrderDetail.address.latitude && fullOrderDetail.address.longitude) && (
                          <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                            📍 {fullOrderDetail.address.latitude.toFixed(6)}, {fullOrderDetail.address.longitude.toFixed(6)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : selectedOrder.address && (
                <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800/50">
                  <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                    Địa chỉ giao hàng
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    📍 {selectedOrder.address}
                  </div>
                </div>
              )}

              {/* Payment Info - Enhanced */}
              <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800/50">
                <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-3">
                  Thông tin thanh toán
                </div>
                {fullOrderDetail?.payment ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600 dark:text-gray-400">Tổng tiền:</span>
                      <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(fullOrderDetail.payment.total)}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                      <div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Phương thức</div>
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100 mt-0.5">
                          {fullOrderDetail.payment.paymentMethod === 'COD' ? '💵 COD' : 
                           fullOrderDetail.payment.paymentMethod === 'VNPAY' ? '💳 VNPay' : 
                           fullOrderDetail.payment.paymentMethod}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Trạng thái</div>
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100 mt-0.5">
                          {fullOrderDetail.payment.paymentStatus === 'PAID' ? '✅ Đã thanh toán' : 
                           fullOrderDetail.payment.paymentStatus === 'NOT_PAID' ? '⏳ Chưa thanh toán' : 
                           fullOrderDetail.payment.paymentStatus}
                        </div>
                      </div>
                    </div>
                    {fullOrderDetail.payment.transactionCode && (
                      <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                        <div className="text-xs text-gray-500 dark:text-gray-400">Mã giao dịch</div>
                        <div className="text-xs font-mono text-gray-900 dark:text-gray-100 mt-0.5 bg-white dark:bg-gray-800 px-2 py-1 rounded">
                          {fullOrderDetail.payment.transactionCode}
                        </div>
                      </div>
                    )}
                    {fullOrderDetail.payment.date && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Ngày thanh toán: {formatDate(fullOrderDetail.payment.date)}
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(selectedOrder.price)}
                    </div>
                    <div className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                      {selectedOrder.paymentMethod} • {selectedOrder.paymentStatus}
                    </div>
                    {selectedOrder.transactionCode && (
                      <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Mã GD: {selectedOrder.transactionCode}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* QR Code - If available */}
              {fullOrderDetail?.qrCode && (
                <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800/50">
                  <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-3">
                    Mã QR đơn hàng
                  </div>
                  <div className="space-y-3">
                    {/* QR Code Image Generated */}
                    <div className="flex flex-col items-center gap-3">
                      <div className="bg-white p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                        <QRCodeSVG 
                          value={fullOrderDetail.qrCode}
                          size={160}
                          level="H"
                          includeMargin={true}
                          className="rounded"
                        />
                      </div>
                      <div className="text-center">
                        <div className="text-xs font-mono text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 px-3 py-1.5 rounded border border-gray-200 dark:border-gray-700">
                          {fullOrderDetail.qrCode}
                        </div>
                      </div>
                    </div>
                    {fullOrderDetail.qrCodeGeneratedAt && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                        📅 Tạo lúc: {formatDate(fullOrderDetail.qrCodeGeneratedAt)}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Order Date */}
              <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800/50">
                <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                  Ngày đặt hàng
                </div>
                <div className="text-sm text-gray-900 dark:text-gray-100">
                  {formatDate(selectedOrder.orderDate)}
                </div>
              </div>

              {/* Process History Timeline */}
              {loadingOrderDetail ? (
                <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800/50">
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                    <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                      Đang tải lịch sử đơn hàng...
                    </span>
                  </div>
                </div>
              ) : (
                fullOrderDetail?.processOrders && fullOrderDetail.processOrders.length > 0 && (
                  <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800/50">
                    <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-3">
                      Lịch sử xử lý đơn hàng
                    </div>
                    <div className="relative space-y-4">
                      {fullOrderDetail.processOrders.map((process: any, index: number) => {
                        const isLast = index === fullOrderDetail.processOrders.length - 1;
                        const statusInfo = processStatusConfig[process.status] || {
                          label: process.status,
                          color: "bg-gray-100 text-gray-800 ring-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:ring-gray-700",
                          icon: <Clock className="h-3 w-3" />
                        };
                        
                        return (
                          <div key={process.id} className="flex gap-3">
                            {/* Timeline Line */}
                            <div className="flex flex-col items-center">
                              <div className={`flex h-8 w-8 items-center justify-center rounded-full ${
                                isLast 
                                  ? "bg-blue-600 text-white ring-4 ring-blue-100 dark:ring-blue-900/30" 
                                  : "bg-gray-300 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
                              }`}>
                                {statusInfo.icon || (
                                  <div className="h-2 w-2 rounded-full bg-current" />
                                )}
                              </div>
                              {index < fullOrderDetail.processOrders.length - 1 && (
                                <div className="h-full w-0.5 flex-1 bg-gray-300 dark:bg-gray-700 my-1" style={{ minHeight: '20px' }} />
                              )}
                            </div>
                            
                            {/* Content */}
                            <div className="flex-1 pb-4">
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium ring-1 ${statusInfo.color}`}>
                                  {statusInfo.label}
                                </span>
                              </div>
                              <div className="text-xs text-gray-600 dark:text-gray-400">
                                {formatDate(process.createdAt)}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )
              )}

              {/* Note */}
              {(fullOrderDetail?.note || selectedOrder.note) && (
                <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800/50">
                  <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                    Ghi chú
                  </div>
                  <div className="text-sm text-gray-900 dark:text-gray-100">
                    {fullOrderDetail?.note || selectedOrder.note}
                  </div>
                </div>
              )}

              {/* Order Details */}
              {(fullOrderDetail?.orderDetails || selectedOrder.orderDetails) &&
                (fullOrderDetail?.orderDetails || selectedOrder.orderDetails).length > 0 && (
                  <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800/50">
                    <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-3">
                      Chi tiết sản phẩm
                    </div>
                    {loadingProducts ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                        <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                          Đang tải thông tin sản phẩm...
                        </span>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {(fullOrderDetail?.orderDetails || selectedOrder.orderDetails).map((item: any, idx: number) => {
                          const productColor = productDetails[item.productColorId];
                          
                          return (
                            <div
                              key={idx}
                              className="flex gap-3 rounded-lg bg-white p-3 dark:bg-gray-900"
                            >
                              {/* Product Image */}
                              {productColor && (
                                <div className="flex-shrink-0">
                                  <img
                                    src={productColor.images[0]?.image || productColor.product.thumbnailImage}
                                    alt={productColor.product.name}
                                    className="h-20 w-20 rounded-lg object-cover"
                                  />
                                </div>
                              )}
                              
                              {/* Product Info */}
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                  {productColor ? productColor.product.name : `Sản phẩm #${item.productColorId}`}
                                </div>
                                
                                {productColor && (
                                  <>
                                    <div className="flex items-center gap-2 mt-1">
                                      <span className="text-xs text-gray-500 dark:text-gray-400">
                                        Màu:
                                      </span>
                                      <div className="flex items-center gap-1">
                                        <div
                                          className="h-4 w-4 rounded-full border border-gray-300"
                                          style={{ backgroundColor: productColor.color.hexCode }}
                                        />
                                        <span className="text-xs text-gray-700 dark:text-gray-300">
                                          {productColor.color.colorName}
                                        </span>
                                      </div>
                                    </div>
                                    
                                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                      Mã SP: {productColor.product.code}
                                    </div>
                                  </>
                                )}
                                
                                <div className="flex items-center justify-between mt-2">
                                  <span className="text-xs text-gray-600 dark:text-gray-400">
                                    SL: {item.quantity}
                                  </span>
                                  <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                                    {formatCurrency(item.price)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 border-t border-gray-200 bg-white px-6 py-4 dark:border-gray-800 dark:bg-gray-900">
              <button
                onClick={() => setSelectedOrder(null)}
                className="w-full rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-gray-800 active:scale-98 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default OrderManagement;
