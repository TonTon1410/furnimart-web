import axiosClient from "./axiosClient";

// ==========================================
// INTERFACES (Types)
// ==========================================

// Wrapper chung cho response
export interface ApiResponse<T> {
  status: number;
  message: string;
  data: T;
  timestamp: string;
  redirectUrl?: string;
}

// --- ADMIN DASHBOARD TYPES ---

export interface AdminTopProduct {
  productColorId: string;
  productName: string;
  colorName: string;
  totalQuantitySold: number;
  totalRevenue: number;
}

export interface AdminRevenueChartPoint {
  date: string;
  revenue: number;
  orderCount: number;
}

export interface AdminDashboardData {
  totalRevenue: number;
  totalActiveStores: number;
  totalUsers: number;
  topProducts: AdminTopProduct[];
  revenueChart: AdminRevenueChartPoint[];
}

// --- MANAGER DASHBOARD TYPES ---

export interface ManagerLowStockProduct {
  productColorId: string;
  productName: string;
  colorName: string;
  currentStock: number;
  threshold: number;
  warehouseName: string;
  locationCode: string;
}

export interface ManagerShipperOrder {
  orderId: number;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  total: number;
  orderDate: string; // ISO Date string
  status: string; // ex: "PRE_ORDER"
  deliveryStatus: string;
  assignedShipperId: string;
  assignedShipperName: string;
  estimatedDeliveryDate: string; // ISO Date string
}

export interface ManagerDashboardData {
  branchRevenue: number;
  pendingOrdersCount: number;
  shippingOrdersCount: number;
  lowStockProducts: ManagerLowStockProduct[];
  ordersForShipper: ManagerShipperOrder[];
}

// ==========================================
// SERVICE
// ==========================================

const dashboardService = {
  /**
   * Dashboard tổng hợp cho Admin 
   * (doanh thu, cửa hàng, người dùng, top sản phẩm, biểu đồ)
   * GET /api/dashboard/admin
   */
  getAdminDashboard: async () => {
    // URL gốc là .../api nên endpoint chỉ cần truyền /dashboard/admin
    const url = "/dashboard/admin";
    return axiosClient.get<ApiResponse<AdminDashboardData>>(url);
  },

  /**
   * Dashboard tổng hợp cho Manager
   * (doanh thu chi nhánh, đơn chờ, đơn ship, kho sắp hết, đơn cho shipper)
   * GET /api/dashboard/manager
   * @param storeId - ID của chi nhánh (Required)
   */
  getManagerDashboard: async (storeId: string) => {
    const url = "/dashboard/manager";
    return axiosClient.get<ApiResponse<ManagerDashboardData>>(url, {
      params: { storeId }
    });
  }
};

export default dashboardService;