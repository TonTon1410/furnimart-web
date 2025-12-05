import axiosClient from "./axiosClient";

// ==========================================
// INTERFACES (Types)
// ==========================================

// Wrapper chung cho response (dựa trên mẫu json cung cấp)
export interface ApiResponse<T> {
  status: number;
  message: string;
  data: T;
  timestamp: string;
  redirectUrl?: string;
}

// 1. Overview Stats
export interface StatsOverviewData {
  totalRevenue: number;
  totalOrders: number;
  totalActiveStores: number;
  totalUsers: number;
}

// 2. Revenue By Branch (Đã chỉnh lại đúng logic: Branch trả về Branch)
export interface BranchRevenueItem {
  branchId: string;
  branchName: string;
  revenue: number;
  orderCount: number;
}
export interface RevenueByBranchData {
  branches: BranchRevenueItem[];
}

// 3. Top Products (Đã chỉnh lại đúng logic: Product trả về Product)
export interface TopProductItem {
  productColorId: string;
  productName: string;
  colorName: string;
  totalQuantitySold: number;
  totalRevenue: number;
}
// Lưu ý: Dữ liệu mẫu bạn đưa là Array, nhưng có lúc lại nằm trong object. 
// Dựa trên "revenue-by-branch" response mà bạn cung cấp (bị nhầm sang đây), nó là mảng.
export type TopProductsData = TopProductItem[]; 

// 4. Delivery Performance
export interface DeliveryStatusItem {
  status: string;
  count: number;
  percentage: number;
}

export interface DeliveryPerformanceData {
  statuses: DeliveryStatusItem[];
}

// ==========================================
// SERVICE
// ==========================================

const adminDashboardService = {
  /**
   * Lấy 4 chỉ số tổng quan: doanh thu, đơn hàng, cửa hàng, người dùng
   * GET /api/v1/admin/stats/overview
   */
  getStatsOverview: async () => {
    // URL gốc axiosClient là .../api nên ở đây chỉ gọi /v1/...
    const url = "/v1/admin/stats/overview"; 
    return axiosClient.get<ApiResponse<StatsOverviewData>>(url);
  },

  /**
   * So sánh doanh thu theo chi nhánh (bar chart)
   * GET /api/v1/admin/analytics/revenue-by-branch
   */
  getRevenueByBranch: async () => {
    const url = "/v1/admin/analytics/revenue-by-branch";
    return axiosClient.get<ApiResponse<RevenueByBranchData>>(url);
  },

  /**
   * Top sản phẩm bán chạy toàn hệ thống
   * GET /api/v1/admin/analytics/top-products
   * @param limit Số lượng sản phẩm muốn lấy (mặc định 10)
   */
  getTopProducts: async (limit: number = 10) => {
    // Sử dụng params để axios tự encode query string (?limit=10)
    const url = "/v1/admin/analytics/top-products";
    return axiosClient.get<ApiResponse<TopProductsData>>(url, {
      params: { limit }
    });
  },

  /**
   * Phân bổ trạng thái đơn hàng (pie chart)
   * GET /api/v1/admin/analytics/delivery-performance
   */
  getDeliveryPerformance: async () => {
    const url = "/v1/admin/analytics/delivery-performance";
    return axiosClient.get<ApiResponse<DeliveryPerformanceData>>(url);
  },
};

export default adminDashboardService;