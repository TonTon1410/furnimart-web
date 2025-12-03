// types/order.ts

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "shipping"
  | "delivered"
  | "completed"
  | "cancelled"
  | "returned";

export interface OrderDetail {
  id: number;
  productId?: string; // Legacy field
  productColorId?: string; // New field - ID của product color
  quantity: number;
  price: number;
  productColor?: {
    id: string;
    product: {
      id: string;
      name: string;
      description?: string;
      price: number;
      code: string;
      thumbnailImage: string;
    };
    color: {
      id: string;
      colorName: string;
      hexCode: string;
    };
    images: Array<{ image: string }>;
    status: string;
  };
}

export interface ProcessOrder {
  id: number;
  status: string;
  createdAt: string;
}

export interface Payment {
  id: number;
  transactionCode: string;
  total: number;
  paymentMethod: string;
  paymentStatus: string;
  date: string;
}

export interface OrderAddress {
  id: number;
  name: string;
  phone: string;
  city: string;
  district: string;
  ward: string;
  street: string;
  addressLine: string;
  fullAddress: string;
  latitude?: number;
  longitude?: number;
  isDefault: boolean;
  userId: string;
  userName: string;
}

export interface OrderUser {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  gender: boolean;
  birthday: string;
  avatar: string | null;
  role: string;
  status: string;
}

export interface OrderItem {
  id: string;
  productName: string;
  productImage: string;
  category: string;
  shopName: string;
  quantity: number;
  price: number;
  status: OrderStatus;
  rawStatus?: string; // Status gốc từ API (PENDING, MANAGER_ACCEPT, etc.)
  orderDate: string;
  deliveryDate?: string;
  material?: string;
  dimensions?: string;
  color?: string;
  brand?: string;
  warranty?: string;

  // Thêm các field từ API
  address?: string | OrderAddress;
  phone?: string; // Số điện thoại khách hàng
  paymentMethod?: string;
  paymentStatus?: string;
  transactionCode?: string;
  note?: string | null;
  orderDetails?: OrderDetail[];
  storeId?: string | null; // Để check xem đã assign hay chưa
  isAssigned?: boolean; // Helper field để dễ check trong UI

  // Full API response fields
  user?: OrderUser;
  payment?: Payment;
  processOrders?: ProcessOrder[];
  total?: number;
  reason?: string | null;
  qrCode?: string | null;
  depositPrice?: number | null;
}

export interface OrderFilters {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
  customerId?: number;
}
