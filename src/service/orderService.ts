// services/OrderService.ts
import axiosClient from './axiosClient'
import type { OrderItem, OrderStatus, OrderFilters } from '../types/order'
import type { AxiosResponse } from 'axios'

export interface ApiResponse<T> {
  status: number
  message: string
  data: T
}

export interface OrderSearchResponse {
  orders: OrderItem[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// Thêm interface cho API response
interface ApiOrderDetail {
  id: number
  productId: string
  quantity: number
  price: number
}

interface ApiProcessOrder {
  id: number
  status: string
  createdAt: string
}

interface ApiPayment {
  id: number
  transactionCode: string
  total: number
  paymentMethod: string
  paymentStatus: string
  date: string
}

interface ApiAddress {
  id: number
  name: string
  phone: string
  fullAddress: string
}

interface ApiOrder {
  id: number
  user: any
  address: ApiAddress
  total: number
  note: string | null
  orderDate: string
  orderDetails: ApiOrderDetail[]
  processOrders: ApiProcessOrder[]
  payment: ApiPayment
}

class OrderService {
  // GET /orders/{id}
  async getOrderById(id: number): Promise<OrderItem> {
    try {
      const response: AxiosResponse<ApiResponse<ApiOrder>> = await axiosClient.get(`/orders/${id}`)
      const orderData = response.data.data || response.data
      return this.convertToOrderItem(orderData)
    } catch (error: any) {
      throw new Error(this.handleError(error, 'Không thể lấy thông tin đơn hàng'))
    }
  }

  // PUT /orders/{id}/status
  async updateOrderStatus(id: number, status: OrderStatus): Promise<OrderItem> {
    try {
      const apiStatus = this.mapToApiStatus(status)
      const response: AxiosResponse<ApiResponse<ApiOrder>> = await axiosClient.put(`/orders/${id}/status`, {
        id,
        status: apiStatus
      })
      const orderData = response.data.data || response.data
      return this.convertToOrderItem(orderData)
    } catch (error: any) {
      throw new Error(this.handleError(error, 'Không thể cập nhật trạng thái đơn hàng'))
    }
  }

  // GET /orders/search/customer
  async searchOrdersByCustomer(filters: OrderFilters = {}): Promise<OrderSearchResponse> {
    try {
      console.log('🔍 Searching orders by customer:', filters)
      
      const params: Record<string, string> = {}
      
      if (filters.status && filters.status !== 'all') {
        params.status = this.mapToApiStatus(filters.status as OrderStatus)
      }
      if (filters.search) {
        params.search = filters.search
      }
      if (filters.page) {
        params.page = (filters.page - 1).toString()
      }
      if (filters.limit) {
        params.size = filters.limit.toString()
      }

      const response: AxiosResponse<ApiResponse<any>> = await axiosClient.get('/orders/search/customer', {
        params
      })
      
      const responseData = response.data.data
      
      return {
        orders: (responseData.content || []).map((order: ApiOrder) => this.convertToOrderItem(order)),
        total: responseData.totalElements || 0,
        page: (responseData.number || 0) + 1,
        limit: responseData.size || 10,
        totalPages: responseData.totalPages || 0
      }
    } catch (error: any) {
      console.error('❌ Error searching orders by customer:', error)
      throw new Error(this.handleError(error, 'Không thể tìm kiếm đơn hàng'))
    }
  }

  // Cancel order
  async cancelOrder(id: number, reason?: string): Promise<OrderItem> {
    try {
      console.log(`❌ Cancelling order ${id}, reason: ${reason}`)
      return await this.updateOrderStatus(id, 'cancelled')
    } catch (error: any) {
      throw new Error(this.handleError(error, 'Không thể hủy đơn hàng'))
    }
  }

  // Mapping status
  private mapApiStatus(apiStatus: string): OrderStatus {
    const statusMap: Record<string, OrderStatus> = {
      'PENDING': 'pending',
      'PAYMENT': 'pending',
      'CONFIRMED': 'confirmed',
      'DELIVERED': 'delivered',
      'FINISHED': 'completed',
      'CANCELLED': 'cancelled'
    }
    return statusMap[apiStatus] || 'pending'
  }

  private mapToApiStatus(localStatus: OrderStatus): string {
    const statusMap: Record<OrderStatus, string> = {
      'pending': 'PENDING',
      'confirmed': 'CONFIRMED',
      'shipping': 'CONFIRMED',
      'delivered': 'DELIVERED',
      'completed': 'FINISHED',
      'cancelled': 'CANCELLED',
      'returned': 'CANCELLED'
    }
    return statusMap[localStatus] || 'PENDING'
  }

  // FIXED: Convert với đầy đủ thông tin
  private convertToOrderItem(apiOrder: ApiOrder): OrderItem {
    const totalQuantity = apiOrder.orderDetails?.reduce(
      (sum, item) => sum + item.quantity, 
      0
    ) || 0
    
    const currentStatus = apiOrder.processOrders?.[apiOrder.processOrders.length - 1]?.status || 'PENDING'

    return {
      id: apiOrder.id?.toString() || '',
      productName: `Đơn hàng #${apiOrder.id} (${totalQuantity} sản phẩm)`,
      productImage: '/placeholder.svg',
      category: 'Nội thất',
      shopName: apiOrder.user?.fullName || apiOrder.address?.name || 'Khách hàng',
      quantity: totalQuantity,
      price: apiOrder.total || 0,
      status: this.mapApiStatus(currentStatus),
      orderDate: apiOrder.orderDate || new Date().toISOString(),
      deliveryDate: undefined,
      
      // Thêm thông tin chi tiết
      address: apiOrder.address?.fullAddress,
      paymentMethod: apiOrder.payment?.paymentMethod,
      paymentStatus: apiOrder.payment?.paymentStatus,
      transactionCode: apiOrder.payment?.transactionCode,
      note: apiOrder.note,
      orderDetails: apiOrder.orderDetails, // Giữ nguyên để hiển thị chi tiết
    }
  }

  async fetchOrders(filters: OrderFilters = {}): Promise<OrderSearchResponse> {
    try {
      console.log('📋 Fetching orders:', filters)
      return await this.searchOrdersByCustomer(filters)
    } catch (error: any) {
      console.error('❌ Error fetching orders:', error)
      return {
        orders: [],
        total: 0,
        page: filters.page || 1,
        limit: filters.limit || 10,
        totalPages: 0
      }
    }
  }

  private handleError(error: any, defaultMessage: string): string {
    if (error.response?.status === 401) {
      return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'
    }
    if (error.response?.status === 403) {
      return 'Bạn không có quyền thực hiện thao tác này.'
    }
    if (error.response?.status === 404) {
      return 'Không tìm thấy đơn hàng.'
    }
    if (error.response?.status >= 500) {
      return 'Lỗi máy chủ. Vui lòng thử lại sau.'
    }
    return error.response?.data?.message || error.message || defaultMessage
  }
}

export const orderService = new OrderService()
export default orderService