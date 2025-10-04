"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import {
  Search,
  Package,
  Clock,
  Truck,
  CheckCircle,
  XCircle,
  RotateCcw,
  ShoppingBag,
  Calendar,
  MapPin,
  CreditCard,
  FileText,
} from "lucide-react"
import { orderService } from "@/service/orderService"
import type { OrderItem, OrderFilters } from "@/types/order"

const orderTabs = [
  { key: "all", label: "Tất cả", icon: ShoppingBag },
  { key: "pending", label: "Chờ xác nhận", icon: Clock },
  { key: "confirmed", label: "Đã xác nhận", icon: CheckCircle },
  { key: "shipping", label: "Đang giao hàng", icon: Truck },
  { key: "completed", label: "Hoàn thành", icon: CheckCircle },
  { key: "cancelled", label: "Đã hủy", icon: XCircle },
]

const getStatusColor = (status: string) => {
  const statusColors = {
    pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400",
    confirmed: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
    shipping: "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400",
    delivered: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
    completed: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
    cancelled: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
  }
  return statusColors[status as keyof typeof statusColors] || statusColors.pending
}

const getStatusLabel = (status: string) => {
  const statusLabels = {
    pending: "Chờ xác nhận",
    confirmed: "Đã xác nhận",
    shipping: "Đang giao hàng",
    delivered: "Đã giao hàng",
    completed: "Hoàn thành",
    cancelled: "Đã hủy",
  }
  return statusLabels[status as keyof typeof statusLabels] || "Không xác định"
}

const getPaymentMethodLabel = (method: string) => {
  const labels: Record<string, string> = {
    'COD': 'Thanh toán khi nhận hàng',
    'VNPAY': 'VNPay',
    'MOMO': 'MoMo',
    'BANK': 'Chuyển khoản ngân hàng'
  }
  return labels[method] || method
}

const fadeUp = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }

export default function OrderHistory() {
  const [activeTab, setActiveTab] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredOrders, setFilteredOrders] = useState<OrderItem[]>([])
  const [loading, setLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalOrders, setTotalOrders] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const ordersPerPage = 10

  useEffect(() => {
    const loadOrders = async () => {
      setLoading(true)
      setError(null)
      try {
        const filters: OrderFilters = {
          status: activeTab === 'all' ? undefined : activeTab,
          search: searchQuery.trim() || undefined,
          page: currentPage,
          limit: ordersPerPage,
        }

        const result = await orderService.fetchOrders(filters)
        setFilteredOrders(result.orders || [])
        setTotalOrders(result.total || 0)
      } catch (error: any) {
        console.error("Error loading orders:", error)
        setError(error.message || "Không thể tải danh sách đơn hàng")
        setFilteredOrders([])
        setTotalOrders(0)
      } finally {
        setLoading(false)
      }
    }

    const timeoutId = setTimeout(() => {
      loadOrders()
    }, searchQuery ? 500 : 0)

    return () => clearTimeout(timeoutId)
  }, [activeTab, searchQuery, currentPage])

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN").format(price) + "đ"
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  const handleOrderAction = async (orderId: string, action: string) => {
    try {
      setLoading(true)
      setError(null)
      
      const orderIdNum = parseInt(orderId)
      
      switch (action) {
        case "cancel":
          await orderService.cancelOrder(orderIdNum, "Khách hàng yêu cầu hủy")
          break
        case "confirm":
          await orderService.updateOrderStatus(orderIdNum, "confirmed")
          break
      }
      
      setTimeout(async () => {
        try {
          const result = await orderService.fetchOrders({
            status: activeTab === 'all' ? undefined : activeTab,
            search: searchQuery || undefined,
            page: currentPage,
            limit: ordersPerPage,
          })
          setFilteredOrders(result.orders || [])
          setTotalOrders(result.total || 0)
        } catch (reloadError: any) {
          setError("Thao tác thành công nhưng không thể tải lại danh sách")
        }
      }, 1000)
      
    } catch (error: any) {
      setError(error.message || "Không thể thực hiện thao tác")
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={fadeUp}
      className="bg-card rounded-2xl shadow-xl border border-border/50 overflow-hidden"
    >
      <div className="p-6 border-b border-border/50">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 bg-primary/10 rounded-xl">
            <ShoppingBag className="h-5 w-5 text-primary" />
          </div>
          <h3 className="text-xl font-bold text-foreground">Đơn hàng nội thất</h3>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Tìm kiếm theo mã đơn hàng"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground placeholder:text-muted-foreground"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {orderTabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.key
            return (
              <button
                key={tab.key}
                onClick={() => {
                  setActiveTab(tab.key)
                  setCurrentPage(1)
                }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-lg"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="p-6">
        {error && (
          <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
              <p className="text-sm text-yellow-800 dark:text-yellow-200">{error}</p>
              <button 
                onClick={() => setError(null)}
                className="ml-auto text-yellow-600 dark:text-yellow-400 hover:text-yellow-800 dark:hover:text-yellow-200"
              >
                <XCircle className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Đang tải đơn hàng...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Không có đơn hàng nào</h3>
            <p className="text-muted-foreground">
              {searchQuery ? "Không tìm thấy đơn hàng phù hợp" : "Bạn chưa có đơn hàng nào"}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <motion.div
                key={order.id}
                variants={fadeUp}
                className="bg-muted/30 rounded-xl border border-border/50 p-5 hover:shadow-lg transition-all duration-200"
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-4 pb-4 border-b border-border/30">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <ShoppingBag className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">{order.shopName}</h4>
                      <p className="text-sm text-muted-foreground">Mã đơn: #{order.id}</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                    {getStatusLabel(order.status)}
                  </span>
                </div>

                {/* Summary Info */}
                <div className="mb-4 p-3 bg-background/50 rounded-lg">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Số lượng:</span>
                      <span className="font-medium text-foreground">{order.quantity} sản phẩm</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Đặt hàng:</span>
                      <span className="font-medium text-foreground">{formatDate(order.orderDate)}</span>
                    </div>
                    {order.address && (
                      <div className="flex items-start gap-2 col-span-2">
                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div>
                          <span className="text-muted-foreground">Địa chỉ: </span>
                          <span className="font-medium text-foreground">{order.address}</span>
                        </div>
                      </div>
                    )}
                    {order.paymentMethod && (
                      <div className="flex items-center gap-2 col-span-2">
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Thanh toán:</span>
                        <span className="font-medium text-foreground">{getPaymentMethodLabel(order.paymentMethod)}</span>
                        {order.transactionCode && (
                          <span className="text-xs text-muted-foreground">({order.transactionCode})</span>
                        )}
                      </div>
                    )}
                    {order.note && (
                      <div className="flex items-start gap-2 col-span-2">
                        <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div>
                          <span className="text-muted-foreground">Ghi chú: </span>
                          <span className="text-foreground">{order.note}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Order Details */}
                {order.orderDetails && order.orderDetails.length > 0 && (
                  <div className="mb-4 space-y-2">
                    <h5 className="text-sm font-semibold text-foreground mb-2">Chi tiết sản phẩm:</h5>
                    {order.orderDetails.map((detail, idx) => (
                      <div key={detail.id} className="flex justify-between items-center p-2 bg-background/30 rounded-lg text-sm">
                        <span className="text-muted-foreground">Sản phẩm {idx + 1}</span>
                        <div className="flex items-center gap-4">
                          <span className="text-foreground">x{detail.quantity}</span>
                          <span className="font-medium text-foreground">{formatPrice(detail.price)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Total & Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-border/30">
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm text-muted-foreground">Tổng tiền:</span>
                    <span className="text-2xl font-bold text-primary">{formatPrice(order.price)}</span>
                  </div>
                  
                  <div className="flex gap-2">
                    {order.status === "pending" && (
                      <>
                        <button
                          onClick={() => handleOrderAction(order.id, "cancel")}
                          disabled={loading}
                          className="px-4 py-2 text-sm font-medium text-destructive border border-destructive rounded-lg hover:bg-destructive/10 transition-colors disabled:opacity-50"
                        >
                          Hủy đơn
                        </button>
                        <button
                          onClick={() => handleOrderAction(order.id, "confirm")}
                          disabled={loading}
                          className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                        >
                          Xác nhận
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {totalOrders > ordersPerPage && (
          <div className="flex justify-center items-center gap-2 mt-6 pt-6 border-t border-border/30">
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
              onClick={() => setCurrentPage((prev) => Math.min(Math.ceil(totalOrders / ordersPerPage), prev + 1))}
              disabled={currentPage >= Math.ceil(totalOrders / ordersPerPage) || loading}
              className="px-3 py-2 text-sm border border-border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted/50"
            >
              Sau
            </button>
          </div>
        )}
      </div>
    </motion.div>
  )
}