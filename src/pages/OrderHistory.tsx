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
  Star,
  ShoppingBag,
  Calendar,
  MapPin,
} from "lucide-react"
import { orderService } from "@/service/orderService"
import type { OrderItem, OrderStatus, OrderFilters } from "../types/order"

const mockOrders: OrderItem[] = [
  {
    id: "FUR001",
    productName: "Sofa Góc Chữ L Hiện Đại Bọc Da PU Cao Cấp",
    productImage: "/modern-l-shaped-sofa.jpg",
    category: "Sofa & Ghế",
    shopName: "Nội Thất Hoàng Gia",
    quantity: 1,
    price: 12500000,
    status: "completed",
    orderDate: "2024-01-15",
    deliveryDate: "2024-01-25",
    material: "Da PU cao cấp",
    dimensions: "280x180x85cm",
    color: "Nâu đậm",
    brand: "Hoàng Gia Furniture",
    warranty: "24 tháng",
  },
  {
    id: "FUR002",
    productName: "Bàn Ăn Gỗ Sồi Tự Nhiên 6 Ghế Phong Cách Scandinavian",
    productImage: "/wooden-dining-table-set-scandinavian-style.jpg",
    category: "Bàn Ăn & Ghế Ăn",
    shopName: "Gỗ Việt Premium",
    quantity: 1,
    price: 8900000,
    status: "completed",
    orderDate: "2024-01-10",
    deliveryDate: "2024-01-20",
    material: "Gỗ sồi tự nhiên",
    dimensions: "160x90x75cm",
    color: "Vàng gỗ tự nhiên",
    brand: "Gỗ Việt",
    warranty: "36 tháng",
  },
  {
    id: "FUR003",
    productName: "Tủ Quần Áo 4 Cánh Gỗ MDF Phủ Melamine Trắng",
    productImage: "/white-wardrobe-4-doors-modern.jpg",
    category: "Tủ & Kệ",
    shopName: "Nội Thất Minh Khôi",
    quantity: 1,
    price: 5600000,
    status: "shipping",
    orderDate: "2024-01-20",
    material: "MDF phủ Melamine",
    dimensions: "200x60x220cm",
    color: "Trắng",
    brand: "Minh Khôi Home",
    warranty: "18 tháng",
  },
  {
    id: "FUR004",
    productName: "Giường Ngủ Gỗ Tràm Có Hộc Tủ Phong Cách Hiện Đại",
    productImage: "/modern-wooden-bed-with-storage.jpg",
    category: "Giường & Nệm",
    shopName: "Nội Thất Gia Đình",
    quantity: 1,
    price: 7200000,
    status: "confirmed",
    orderDate: "2024-01-22",
    material: "Gỗ tràm tự nhiên",
    dimensions: "180x200x40cm",
    color: "Nâu gỗ",
    brand: "Gia Đình Furniture",
    warranty: "24 tháng",
  },
  {
    id: "FUR005",
    productName: "Bàn Làm Việc Gỗ Công Nghiệp Có Ngăn Kéo",
    productImage: "/office-desk-with-drawers-wood.jpg",
    category: "Bàn Làm Việc",
    shopName: "Office Home Decor",
    quantity: 1,
    price: 2800000,
    status: "pending",
    orderDate: "2024-01-25",
    material: "Gỗ công nghiệp MFC",
    dimensions: "120x60x75cm",
    color: "Vân gỗ sồi",
    brand: "Office Home",
    warranty: "12 tháng",
  },
]

const orderTabs = [
  { key: "all", label: "Tất cả", icon: ShoppingBag },
  { key: "pending", label: "Chờ xác nhận", icon: Clock },
  { key: "confirmed", label: "Đã xác nhận", icon: CheckCircle },
  { key: "shipping", label: "Đang giao hàng", icon: Truck },
  { key: "completed", label: "Hoàn thành", icon: CheckCircle },
  { key: "cancelled", label: "Đã hủy", icon: XCircle },
  { key: "returned", label: "Trả hàng/Hoàn tiền", icon: RotateCcw },
]

// Keep mock data as fallback
const mockOrdersBackup = mockOrders

const getStatusColor = (status: string) => {
  const statusColors = {
    pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400",
    confirmed: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
    shipping: "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400",
    delivered: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
    completed: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
    cancelled: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
    returned: "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400",
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
    returned: "Đã trả hàng",
  }
  return statusLabels[status as keyof typeof statusLabels] || "Không xác định"
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
    console.log("OrderHistory component loaded") // Debug log
    const loadOrders = async () => {
      setLoading(true)
      setError(null)
      try {
        console.log('🔄 Loading orders with params:', { activeTab, searchQuery, currentPage })
        
        const filters: OrderFilters = {
          status: activeTab,
          search: searchQuery.trim(),
          page: currentPage,
          limit: ordersPerPage,
        }

        const result = await orderService.fetchOrders(filters)
        console.log('✅ Orders loaded successfully:', result)
        
        setFilteredOrders(result.orders || [])
        setTotalOrders(result.total || 0)
        
        if (result.orders.length === 0 && !searchQuery && activeTab === 'all') {
          setError("Chưa có đơn hàng nào. Dữ liệu có thể đang được tải từ server...")
        }
      } catch (error: any) {
        console.error("❌ Error loading orders:", error)
        setError(error.message || "Không thể tải danh sách đơn hàng. Đang sử dụng dữ liệu mẫu.")
        
        // Fallback to mock data filtering
        let filtered = mockOrdersBackup
        if (activeTab !== "all") {
          filtered = filtered.filter((order) => order.status === activeTab)
        }
        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase()
          filtered = filtered.filter(
            (order) =>
              order.productName.toLowerCase().includes(query) ||
              order.shopName.toLowerCase().includes(query) ||
              order.id.toLowerCase().includes(query) ||
              order.category.toLowerCase().includes(query),
          )
        }
        setFilteredOrders(filtered)
        setTotalOrders(filtered.length)
      } finally {
        setLoading(false)
      }
    }

    // Add debounce for search
    const timeoutId = setTimeout(() => {
      loadOrders()
    }, searchQuery ? 500 : 0)

    return () => clearTimeout(timeoutId)
  }, [activeTab, searchQuery, currentPage])

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN").format(price) + "₫"
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const handleOrderAction = async (orderId: string, action: string) => {
    try {
      setLoading(true)
      setError(null)
      
      const orderIdNum = parseInt(orderId.replace(/[^0-9]/g, '')) // Extract number from ID
      console.log(`🎯 Performing action "${action}" on order ${orderIdNum}`)
      
      switch (action) {
        case "cancel":
          await orderService.cancelOrder(orderIdNum, "Khách hàng yêu cầu hủy")
          console.log(`✅ Order ${orderIdNum} cancelled successfully`)
          break
        case "confirm":
          await orderService.updateOrderStatus(orderIdNum, "confirmed")
          console.log(`✅ Order ${orderIdNum} confirmed successfully`)
          break
        default:
          console.warn(`⚠️ Unknown action: ${action}`)
          break
      }
      
      // Reload orders after action with a small delay to ensure server state is updated
      setTimeout(async () => {
        try {
          const result = await orderService.fetchOrders({
            status: activeTab,
            search: searchQuery,
            page: currentPage,
            limit: ordersPerPage,
          })
          setFilteredOrders(result.orders || [])
          setTotalOrders(result.total || 0)
          console.log(`🔄 Orders reloaded after ${action}`)
        } catch (reloadError: any) {
          console.error("❌ Error reloading orders:", reloadError)
          setError("Thao tác thành công nhưng không thể tải lại danh sách. Vui lòng refresh trang.")
        }
      }, 1000)
      
    } catch (error: any) {
      console.error(`❌ Error handling order action ${action}:`, error)
      setError(error.message || "Không thể thực hiện thao tác. Vui lòng thử lại.")
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
      {/* Header */}
      <div className="p-6 border-b border-border/50">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 bg-primary/10 rounded-xl">
            <ShoppingBag className="h-5 w-5 text-primary" />
          </div>
          <h3 className="text-xl font-bold text-foreground">Đơn hàng nội thất</h3>
        </div>

        {/* Search Bar */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Tìm kiếm theo tên sản phẩm, shop, mã đơn hàng hoặc danh mục nội thất"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground placeholder:text-muted-foreground"
          />
        </div>

        {/* Order Status Tabs */}
        <div className="flex flex-wrap gap-2">
          {orderTabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.key
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
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

      {/* Orders List */}
      <div className="p-6">
        {/* Error Message */}
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

        {/* Loading State */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Đang tải đơn hàng...</p>
            <p className="text-xs text-muted-foreground mt-2">Kết nối tới server...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Không có đơn hàng nào</h3>
            <p className="text-muted-foreground">
              {searchQuery
                ? "Không tìm thấy đơn hàng nội thất phù hợp với từ khóa tìm kiếm"
                : "Bạn chưa có đơn hàng nội thất nào trong danh mục này"}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <motion.div
                key={order.id}
                variants={fadeUp}
                className="bg-muted/30 rounded-xl border border-border/50 p-4 hover:shadow-lg transition-all duration-200"
              >
                {/* Shop Header */}
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-border/30">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <ShoppingBag className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">{order.shopName}</h4>
                      <p className="text-sm text-muted-foreground">Mã đơn: {order.id}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                      {getStatusLabel(order.status)}
                    </span>
                    {order.status === "completed" && (
                      <div className="flex items-center gap-1 text-yellow-500">
                        <Star className="h-4 w-4 fill-current" />
                        <span className="text-xs font-medium">Đánh giá</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Product Details */}
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <img
                      src={order.productImage || "/placeholder.svg"}
                      alt={order.productName}
                      className="w-20 h-20 rounded-lg object-cover border border-border/30"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h5 className="font-medium text-foreground mb-2 line-clamp-2 text-balance">{order.productName}</h5>
                    <p className="text-sm text-muted-foreground mb-1">{order.category}</p>
                    {order.material && (
                      <p className="text-xs text-muted-foreground mb-1">Chất liệu: {order.material}</p>
                    )}
                    {order.dimensions && (
                      <p className="text-xs text-muted-foreground mb-1">Kích thước: {order.dimensions}</p>
                    )}
                    {order.color && <p className="text-xs text-muted-foreground mb-2">Màu sắc: {order.color}</p>}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">x{order.quantity}</span>
                      <span className="text-lg font-bold text-primary">{formatPrice(order.price)}</span>
                    </div>
                  </div>
                </div>

                {/* Order Timeline */}
                <div className="mt-4 pt-3 border-t border-border/30">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>Đặt hàng: {formatDate(order.orderDate)}</span>
                    </div>
                    {order.deliveryDate && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span>Giao hàng: {formatDate(order.deliveryDate)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-4 flex gap-2 justify-end">
                  {order.status === "completed" && (
                    <>
                      <button className="px-4 py-2 text-sm font-medium text-muted-foreground border border-border rounded-lg hover:bg-muted/50 transition-colors">
                        Mua lại
                      </button>
                      <button className="px-4 py-2 text-sm font-medium text-primary border border-primary rounded-lg hover:bg-primary/10 transition-colors">
                        Đánh giá
                      </button>
                    </>
                  )}
                  {order.status === "shipping" && (
                    <button className="px-4 py-2 text-sm font-medium text-primary border border-primary rounded-lg hover:bg-primary/10 transition-colors">
                      Theo dõi vận chuyển
                    </button>
                  )}
                  {order.status === "pending" && (
                    <>
                      <button
                        onClick={() => handleOrderAction(order.id, "cancel")}
                        disabled={loading}
                        className="px-4 py-2 text-sm font-medium text-destructive border border-destructive rounded-lg hover:bg-destructive/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loading ? "Đang hủy..." : "Hủy đơn hàng"}
                      </button>
                      <button
                        onClick={() => handleOrderAction(order.id, "confirm")}
                        disabled={loading}
                        className="px-4 py-2 text-sm font-medium text-green-600 border border-green-600 rounded-lg hover:bg-green-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loading ? "Đang xác nhận..." : "Xác nhận"}
                      </button>
                    </>
                  )}
                  {order.status === "confirmed" && (
                    <button className="px-4 py-2 text-sm font-medium text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors">
                      Theo dõi đơn hàng
                    </button>
                  )}
                  {order.warranty && order.status === "completed" && (
                    <button className="px-4 py-2 text-sm font-medium text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors">
                      Bảo hành {order.warranty}
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Pagination */}
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
              Trang {currentPage} / {Math.ceil(totalOrders / ordersPerPage)} ({totalOrders} đơn hàng)
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