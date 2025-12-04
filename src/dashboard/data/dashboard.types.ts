// --- COMMON TYPES ---
export interface ProductSummary {
  id: string;
  name: string;
  thumbnail: string;
  price: number;
  sold: number;
  stock?: number; // Chỉ dùng cho Manager
}

// --- ADMIN DASHBOARD TYPES ---
export interface AdminOverviewStats {
  totalRevenue: number;
  growthRate: number; // % so với tháng trước
  totalOrders: number;
  activeBranches: number;
  pendingBranches: number;
  newCustomers: number;
  newStaffs: number;
}

export interface BranchRevenueData {
  branchId: string;
  branchName: string;
  revenue: number;
}

export interface DeliveryPerformance {
  successful: number; // %
  returned: number;   // %
  late: number;       // %
}

// --- MANAGER DASHBOARD TYPES ---
export interface BranchDailyStats {
  todayRevenue: number;
  pendingOrders: number;
  shippingOrders: number;
  lowStockItems: number;
}

export interface ActivityTrendData {
  date: string;
  orders: number;
  revenue: number;
}

export interface OrderStatusData {
  status: 'PENDING' | 'CONFIRMED' | 'SHIPPING' | 'COMPLETED' | 'CANCELLED';
  count: number;
  color: string;
}

// --- STAFF DASHBOARD TYPES ---
export interface StaffWorkStats {
  pendingOrders: number;    // Đơn chờ xác nhận (Quan trọng nhất)
  unreadMessages: number;   // Tin nhắn khách chưa đọc
  processedToday: number;   // Đơn đã xử lý trong ngày
  lowStockAlerts: number;   // SP sắp hết tại kho
}

export interface StaffWorkloadData {
  hour: string;             // Khung giờ (8h, 9h...)
  ordersProcessed: number;
  messagesReplied: number;
}

export interface RecentOrderLite {
  id: string;
  customerName: string;
  total: number;
  status: 'PENDING' | 'CONFIRMED' | 'SHIPPING'; // Staff chỉ quan tâm các trạng thái này để xử lý
  time: string;
}

export interface RecentMessage {
  id: string;
  customerName: string;
  avatar: string;
  preview: string;
  time: string;
  isUnread: boolean;
}