// types/order.ts

export type OrderStatus = 
  | 'pending' 
  | 'confirmed' 
  | 'shipping' 
  | 'delivered' 
  | 'completed' 
  | 'cancelled' 
  | 'returned'

export interface OrderDetail {
  id: number
  productId?: string  // Legacy field
  productColorId?: string  // New field - ID của product color
  quantity: number
  price: number
}

export interface OrderItem {
  id: string
  productName: string
  productImage: string
  category: string
  shopName: string
  quantity: number
  price: number
  status: OrderStatus
  rawStatus?: string      // Status gốc từ API (PENDING, MANAGER_ACCEPT, etc.)
  orderDate: string
  deliveryDate?: string
  material?: string
  dimensions?: string
  color?: string
  brand?: string
  warranty?: string
  
  // Thêm các field từ API
  address?: string
  phone?: string           // Số điện thoại khách hàng
  paymentMethod?: string
  paymentStatus?: string
  transactionCode?: string
  note?: string | null
  orderDetails?: OrderDetail[]
  storeId?: string | null  // Để check xem đã assign hay chưa
  isAssigned?: boolean     // Helper field để dễ check trong UI
}

export interface OrderFilters {
  status?: string
  search?: string
  page?: number
  limit?: number
  customerId?: number
}