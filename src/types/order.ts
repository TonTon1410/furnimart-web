// types/order.ts
export type OrderStatus = "pending" | "confirmed" | "shipping" | "delivered" | "completed" | "cancelled" | "returned"

export interface OrderItem {
  id: string
  productName: string
  productImage: string
  category: string
  shopName: string
  quantity: number
  price: number
  status: OrderStatus
  orderDate: string
  deliveryDate?: string
  material?: string
  dimensions?: string
  color?: string
  brand?: string
  warranty?: string
}

export interface OrderFilters {
  status?: string
  search?: string
  page?: number
  limit?: number
  customerId?: number
  storeId?: number
}