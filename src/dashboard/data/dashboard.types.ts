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