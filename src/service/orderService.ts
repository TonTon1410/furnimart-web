/* eslint-disable @typescript-eslint/no-explicit-any */
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
  storeId: string | null  // Thêm storeId để check assigned
  address: ApiAddress
  total: number
  note: string | null
  orderDate: string
  orderDetails: ApiOrderDetail[]
  processOrders: ApiProcessOrder[]
  payment: ApiPayment
}

class OrderService {
  // GET /orders/{id} - Trả về OrderItem đã convert
  async getOrderById(id: number): Promise<OrderItem> {
    try {
      const response: AxiosResponse<ApiResponse<ApiOrder>> = await axiosClient.get(`/orders/${id}`)
      const orderData = response.data.data || response.data
      return this.convertToOrderItem(orderData)
    } catch (error: any) {
      throw new Error(this.handleError(error, 'Không thể lấy thông tin đơn hàng'))
    }
  }

  // GET /orders/{id} - Trả về FULL RAW DATA từ API
  async getOrderFullDetail(id: number): Promise<any> {
    try {
      const response: AxiosResponse<ApiResponse<ApiOrder>> = await axiosClient.get(`/orders/${id}`)
      return response.data.data || response.data
    } catch (error: any) {
      throw new Error(this.handleError(error, 'Không thể lấy thông tin đơn hàng'))
    }
  }

  // PUT /orders/status/{id} - Update order status (query param)
  async updateOrderStatus(id: number, status: string): Promise<OrderItem> {
    try {
      console.log(`📝 Updating order ${id} status to: ${status}`)
      const response: AxiosResponse<ApiResponse<ApiOrder>> = await axiosClient.put(
        `/orders/status/${id}?status=${status}`
      )
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
        params.status = filters.status.toUpperCase()
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

  // GET /orders/search - For admin/manager (search all orders)
  async searchAllOrders(filters: OrderFilters = {}): Promise<OrderSearchResponse> {
    try {
      console.log('🔍 Searching all orders:', filters)
      
      const params: Record<string, string> = {}
      
      // Chỉ truyền keyword nếu có, không truyền page và size để lấy tất cả
      if (filters.search) {
        params.keyword = filters.search
      }

      const response: AxiosResponse<ApiResponse<any>> = await axiosClient.get(
        '/orders/search', 
        { params }
      )
      
      const responseData = response.data.data
      
      return {
        orders: (responseData.content || []).map((order: ApiOrder) => this.convertToOrderItem(order)),
        total: responseData.totalElements || 0,
        page: 1,
        limit: responseData.totalElements || 0,
        totalPages: 1
      }
    } catch (error: any) {
      console.error('❌ Error searching all orders:', error)
      throw new Error(this.handleError(error, 'Không thể tìm kiếm đơn hàng'))
    }
  }

  // GET /orders/search/store/{storeId} - For manager
  async searchOrdersByStore(storeId: string, filters: OrderFilters = {}): Promise<OrderSearchResponse> {
    try {
      console.log('🏪 Searching orders by store:', storeId, filters)
      
      const params: Record<string, string> = {}
      
      if (filters.search) {
        params.keyword = filters.search
      }
      if (filters.page !== undefined) {
        params.page = (filters.page - 1).toString()
      }
      if (filters.limit) {
        params.size = filters.limit.toString()
      }

      const response: AxiosResponse<ApiResponse<any>> = await axiosClient.get(
        `/orders/search/store/${storeId}`, 
        { params }
      )
      
      const responseData = response.data.data
      
      return {
        orders: (responseData.content || []).map((order: ApiOrder) => this.convertToOrderItem(order)),
        total: responseData.totalElements || 0,
        page: (responseData.number || 0) + 1,
        limit: responseData.size || 10,
        totalPages: responseData.totalPages || 0
      }
    } catch (error: any) {
      console.error('❌ Error searching orders by store:', error)
      throw new Error(this.handleError(error, 'Không thể tìm kiếm đơn hàng'))
    }
  }

  // POST /orders/{orderId}/manager-decision - Accept order (Manager only)
  async acceptOrder(id: number, storeId?: string): Promise<void> {
    try {
      console.log(`✅ Manager accepting order ${id}`)
      
      const params = new URLSearchParams({
        status: 'MANAGER_ACCEPT',
      })
      
      if (storeId) {
        params.append('storeId', storeId)
      }
      
      await axiosClient.post(`/orders/${id}/manager-decision?${params.toString()}`)
    } catch (error: any) {
      throw new Error(this.handleError(error, 'Không thể chấp nhận đơn hàng'))
    }
  }

  // POST /orders/{orderId}/manager-decision - Reject order (Manager only)
  async rejectOrder(id: number, reason: string): Promise<void> {
    try {
      console.log(`❌ Manager rejecting order ${id}, reason: ${reason}`)
      
      const params = new URLSearchParams({
        status: 'MANAGER_REJECT',
        reason: reason,
      })
      
      await axiosClient.post(`/orders/${id}/manager-decision?${params.toString()}`)
    } catch (error: any) {
      throw new Error(this.handleError(error, 'Không thể từ chối đơn hàng'))
    }
  }

  // POST /orders/{orderId}/assign-store - Assign order to store
  async assignOrderToStore(id: number): Promise<void> {
    try {
      console.log(`🏪 Assigning order ${id} to store`)
      await axiosClient.post(`/orders/${id}/assign-store`)
    } catch (error: any) {
      throw new Error(this.handleError(error, 'Không thể phân công đơn hàng'))
    }
  }

  // Cancel order (Customer action)
  async cancelOrder(id: number, reason?: string): Promise<void> {
    try {
      console.log(`❌ Cancelling order ${id}, reason: ${reason}`)
      await this.updateOrderStatus(id, 'CANCELLED')
    } catch (error: any) {
      throw new Error(this.handleError(error, 'Không thể hủy đơn hàng'))
    }
  }

  // Mapping status from API to local
  private mapApiStatus(apiStatus: string): OrderStatus {
    const statusMap: Record<string, OrderStatus> = {
      'PRE_ORDER': 'pending',
      'PENDING': 'pending',
      'PAYMENT': 'pending',
      'ASSIGN_ORDER_STORE': 'pending',
      'MANAGER_ACCEPT': 'confirmed',
      'MANAGER_REJECT': 'cancelled',
      'CONFIRMED': 'confirmed',
      'PACKAGED': 'shipping',
      'SHIPPING': 'shipping',
      'DELIVERED': 'delivered',
      'FINISHED': 'completed',
      'CANCELLED': 'cancelled'
    }
    return statusMap[apiStatus.toUpperCase()] || 'pending'
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
      rawStatus: currentStatus,  // Lưu status gốc từ API
      orderDate: apiOrder.orderDate || new Date().toISOString(),
      deliveryDate: undefined,
      
      // Thêm thông tin chi tiết
      address: apiOrder.address?.fullAddress,
      phone: apiOrder.address?.phone || apiOrder.user?.phone,  // Lấy từ address hoặc user
      paymentMethod: apiOrder.payment?.paymentMethod,
      paymentStatus: apiOrder.payment?.paymentStatus,
      transactionCode: apiOrder.payment?.transactionCode,
      note: apiOrder.note,
      orderDetails: apiOrder.orderDetails, // Giữ nguyên để hiển thị chi tiết
      
      // Thêm storeId và flag isAssigned
      storeId: apiOrder.storeId,
      isAssigned: apiOrder.storeId !== null && apiOrder.storeId !== undefined,
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