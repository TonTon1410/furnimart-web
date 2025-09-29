// services/OrderService.ts
import axiosClient from './axiosClient'
import type { OrderItem, OrderStatus, OrderFilters } from '../types/order'
import type { AxiosResponse } from 'axios'

export interface ApiResponse<T> {
  status: string
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

export interface UpdateOrderStatusRequest {
  id: number
  status: OrderStatus
}

export interface CheckoutRequest {
  items: {
    productId: string
    quantity: number
    price: number
  }[]
  customerInfo: {
    fullName: string
    email: string
    phone: string
    address: string
  }
  paymentMethod: string
  shippingMethod: string
}

class OrderService {
  // GET /orders/{id} - Get order by ID
  async getOrderById(id: number): Promise<OrderItem> {
    try {
      console.log(`🔍 Fetching order by ID: ${id}`)
      const response: AxiosResponse<ApiResponse<any>> = await axiosClient.get(`/orders/${id}`)
      
      const orderData = response.data.data || response.data
      return this.convertToOrderItem(orderData)
    } catch (error: any) {
      console.error('❌ Error fetching order by ID:', error)
      throw new Error(this.handleError(error, 'Không thể lấy thông tin đơn hàng'))
    }
  }

  // PUT /orders/{id}/status - Update order status
  async updateOrderStatus(id: number, status: OrderStatus): Promise<OrderItem> {
    try {
      console.log(`📝 Updating order ${id} status to: ${status}`)
      const apiStatus = this.mapToApiStatus(status)
      
      const response: AxiosResponse<ApiResponse<any>> = await axiosClient.put(`/orders/${id}/status`, {
        id,
        status: apiStatus
      })
      
      const orderData = response.data.data || response.data
      return this.convertToOrderItem(orderData)
    } catch (error: any) {
      console.error('❌ Error updating order status:', error)
      throw new Error(this.handleError(error, 'Không thể cập nhật trạng thái đơn hàng'))
    }
  }

  // POST /orders/checkout - Create new order
  async createOrder(checkoutData: CheckoutRequest): Promise<OrderItem> {
    try {
      console.log('🛒 Creating new order:', checkoutData)
      const response: AxiosResponse<ApiResponse<any>> = await axiosClient.post('/orders/checkout', checkoutData)
      
      const orderData = response.data.data || response.data
      return this.convertToOrderItem(orderData)
    } catch (error: any) {
      console.error('❌ Error creating order:', error)
      throw new Error(this.handleError(error, 'Không thể tạo đơn hàng'))
    }
  }

  // GET /orders/search - Search orders with filters
  async searchOrders(filters: OrderFilters = {}): Promise<OrderSearchResponse> {
    try {
      console.log('🔍 Searching orders with filters:', filters)
      
      const params: Record<string, string> = {}
      
      if (filters.status && filters.status !== 'all') {
        params.status = filters.status
      }
      if (filters.search) {
        params.search = filters.search
      }
      if (filters.page) {
        params.page = filters.page.toString()
      }
      if (filters.limit) {
        params.limit = filters.limit.toString()
      }
      if (filters.customerId) {
        params.customerId = filters.customerId.toString()
      }

      const response: AxiosResponse<ApiResponse<any>> = await axiosClient.get('/orders/search', {
        params
      })
      
      const responseData = response.data.data || response.data
      
      // Handle different response formats
      if (Array.isArray(responseData)) {
        return {
          orders: responseData.map(order => this.convertToOrderItem(order)),
          total: responseData.length,
          page: filters.page || 1,
          limit: filters.limit || 10,
          totalPages: Math.ceil(responseData.length / (filters.limit || 10))
        }
      }
      
      return {
        orders: (responseData.orders || responseData.data || []).map((order: any) => this.convertToOrderItem(order)),
        total: responseData.total || responseData.totalCount || 0,
        page: responseData.page || filters.page || 1,
        limit: responseData.limit || filters.limit || 10,
        totalPages: responseData.totalPages || Math.ceil((responseData.total || 0) / (filters.limit || 10))
      }
    } catch (error: any) {
      console.error('❌ Error searching orders:', error)
      throw new Error(this.handleError(error, 'Không thể tìm kiếm đơn hàng'))
    }
  }

  // GET /orders/search/store/{storeId} - Search orders by store
  async searchOrdersByStore(storeId: number, filters: OrderFilters = {}): Promise<OrderSearchResponse> {
    try {
      console.log(`🏪 Searching orders for store ${storeId} with filters:`, filters)
      
      const params: Record<string, string> = {}
      
      if (filters.status && filters.status !== 'all') {
        params.status = filters.status
      }
      if (filters.search) {
        params.search = filters.search
      }
      if (filters.page) {
        params.page = filters.page.toString()
      }
      if (filters.limit) {
        params.limit = filters.limit.toString()
      }

      const response: AxiosResponse<ApiResponse<any>> = await axiosClient.get(`/orders/search/store/${storeId}`, {
        params
      })
      
      const responseData = response.data.data || response.data
      
      return {
        orders: (responseData.orders || responseData.data || []).map((order: any) => this.convertToOrderItem(order)),
        total: responseData.total || responseData.totalCount || 0,
        page: responseData.page || filters.page || 1,
        limit: responseData.limit || filters.limit || 10,
        totalPages: responseData.totalPages || Math.ceil((responseData.total || 0) / (filters.limit || 10))
      }
    } catch (error: any) {
      console.error('❌ Error searching orders by store:', error)
      throw new Error(this.handleError(error, 'Không thể tìm kiếm đơn hàng của cửa hàng'))
    }
  }

  // GET /orders/search/customer - Search orders by customer
  async searchOrdersByCustomer(filters: OrderFilters = {}): Promise<OrderSearchResponse> {
    try {
      console.log('👤 Searching orders by customer with filters:', filters)
      
      const params: Record<string, string> = {}
      
      if (filters.status && filters.status !== 'all') {
        params.status = filters.status
      }
      if (filters.search) {
        params.search = filters.search
      }
      if (filters.page) {
        params.page = filters.page.toString()
      }
      if (filters.limit) {
        params.limit = filters.limit.toString()
      }
      if (filters.customerId) {
        params.customerId = filters.customerId.toString()
      }

      const response: AxiosResponse<ApiResponse<any>> = await axiosClient.get('/orders/search/customer', {
        params
      })
      
      const responseData = response.data.data || response.data
      
      return {
        orders: (responseData.orders || responseData.data || []).map((order: any) => this.convertToOrderItem(order)),
        total: responseData.total || responseData.totalCount || 0,
        page: responseData.page || filters.page || 1,
        limit: responseData.limit || filters.limit || 10,
        totalPages: responseData.totalPages || Math.ceil((responseData.total || 0) / (filters.limit || 10))
      }
    } catch (error: any) {
      console.error('❌ Error searching orders by customer:', error)
      throw new Error(this.handleError(error, 'Không thể tìm kiếm đơn hàng của khách hàng'))
    }
  }

  // GET /orders/payment-callback - Handle payment callback
  async handlePaymentCallback(params: Record<string, string>): Promise<any> {
    try {
      console.log('💳 Handling payment callback:', params)
      const response: AxiosResponse<ApiResponse<any>> = await axiosClient.get('/orders/payment-callback', {
        params
      })
      
      return response.data.data || response.data
    } catch (error: any) {
      console.error('❌ Error handling payment callback:', error)
      throw new Error(this.handleError(error, 'Không thể xử lý callback thanh toán'))
    }
  }

  // Cancel order (soft delete by updating status)
  async cancelOrder(id: number, reason?: string): Promise<OrderItem> {
    try {
      console.log(`❌ Cancelling order ${id}, reason: ${reason}`)
      return await this.updateOrderStatus(id, 'cancelled')
    } catch (error: any) {
      console.error('❌ Error cancelling order:', error)
      throw new Error(this.handleError(error, 'Không thể hủy đơn hàng'))
    }
  }

  // Helper method to map API status to local status
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

  // Helper method to map local status to API status
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

  // Convert API response to local OrderItem format
  private convertToOrderItem(apiOrder: any): OrderItem {
    return {
      id: apiOrder.id?.toString() || apiOrder.orderId?.toString(),
      productName: apiOrder.productName || apiOrder.items?.[0]?.productName || 'Sản phẩm không xác định',
      productImage: apiOrder.productImage || apiOrder.items?.[0]?.productImage || '/placeholder.svg',
      category: apiOrder.category || apiOrder.items?.[0]?.category || 'Nội thất',
      shopName: apiOrder.shopName || apiOrder.storeName || 'Cửa hàng không xác định',
      quantity: apiOrder.quantity || apiOrder.items?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 1,
      price: apiOrder.totalAmount || apiOrder.price || 0,
      status: this.mapApiStatus(apiOrder.status),
      orderDate: apiOrder.createdAt || apiOrder.orderDate || new Date().toISOString(),
      deliveryDate: apiOrder.deliveredAt || apiOrder.deliveryDate,
      material: apiOrder.material || apiOrder.items?.[0]?.material,
      dimensions: apiOrder.dimensions || apiOrder.items?.[0]?.dimensions,
      color: apiOrder.color || apiOrder.items?.[0]?.color,
      brand: apiOrder.brand || apiOrder.items?.[0]?.brand,
      warranty: apiOrder.warranty || apiOrder.items?.[0]?.warranty,
    }
  }

  // Main method to fetch orders with proper conversion
  async fetchOrders(filters: OrderFilters = {}): Promise<OrderSearchResponse> {
    try {
      console.log('📋 Fetching orders with filters:', filters)
      
      // Convert local status to API status if needed
      const apiFilters = {
        ...filters,
        status: filters.status && filters.status !== 'all' ? this.mapToApiStatus(filters.status as OrderStatus) : filters.status
      }
      
      const response = await this.searchOrders(apiFilters)
      
      return {
        ...response,
        orders: response.orders.map(order => this.convertToOrderItem(order))
      }
    } catch (error: any) {
      console.error('❌ Error fetching orders:', error)
      
      // Return empty result for graceful degradation
      return {
        orders: [],
        total: 0,
        page: filters.page || 1,
        limit: filters.limit || 10,
        totalPages: 0
      }
    }
  }


  // Enhanced error handling with user-friendly messages
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
    if (error.code === 'NETWORK_ERROR' || error.message?.includes('Network')) {
      return 'Lỗi kết nối mạng. Vui lòng kiểm tra kết nối internet.'
    }
    
    return error.response?.data?.message || error.message || defaultMessage
  }
}

export const orderService = new OrderService()
export default orderService