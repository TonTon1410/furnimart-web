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

// 1. Daily Stats (Thống kê ngày)
export interface DailyStatsData {
  totalOrdersToday: number;
  pendingOrders: number;
  processingOrders: number;
  completedOrders: number;
  revenueToday: number;
  newCustomersToday: number;
}

// 2. Inventory Summary (Tóm tắt kho)
export interface InventoryItem {
  productId: string;
  productName: string;
  colorName: string;
  currentStock: number;
  minStock: number;
  status: string; // ex: "LOW_STOCK", "OUT_OF_STOCK"
}

export interface InventorySummaryData {
  totalProducts: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  inStockProducts: number;
  items: InventoryItem[];
}

// 3. Activity Trend (Xu hướng hoạt động)
export interface TrendPoint {
  date: string;
  revenue: number;
  orderCount: number;
}

export interface TrendData {
  dataPoints: TrendPoint[];
}

// 4. Order Status Breakdown (Phân bổ trạng thái đơn hàng)
export interface OrderStatusItem {
  status: string;
  count: number;
  percentage: number;
}

export interface OrderStatusData {
  statusCounts: OrderStatusItem[];
  totalOrders: number;
}

// 5. Top Products (Top sản phẩm bán chạy tại chi nhánh)
export interface BranchTopProductItem {
  productColorId: string;
  productName: string;
  colorName: string;
  totalQuantitySold: number;
  totalRevenue: number;
}

// Dựa trên response mẫu, data trả về là một mảng trực tiếp
export type BranchTopProductsData = BranchTopProductItem[];

// ==========================================
// SERVICE
// ==========================================

const managerDashboardService = {
  /**
   * Thống kê vận hành trong ngày của chi nhánh
   * GET /api/v1/branch/stats/daily
   * @param storeId ID của chi nhánh (Required)
   */
  getDailyStats: async (storeId: string) => {
    // axiosClient base là .../api nên cắt bỏ /api ở đầu
    const url = "/v1/branch/stats/daily";
    return axiosClient.get<ApiResponse<DailyStatsData>>(url, {
      params: { storeId },
    });
  },

  /**
   * Tóm tắt tình trạng kho (tổng sản phẩm, sắp hết, hết hàng, còn hàng)
   * GET /api/v1/branch/inventory/summary
   * @param storeId ID của chi nhánh (Required)
   */
  getInventorySummary: async (storeId: string) => {
    const url = "/v1/branch/inventory/summary";
    return axiosClient.get<ApiResponse<InventorySummaryData>>(url, {
      params: { storeId },
    });
  },

  /**
   * Xu hướng doanh thu và đơn hàng theo thời gian (line chart)
   * GET /api/v1/branch/analytics/trend
   * @param storeId ID của chi nhánh (Required)
   * @param days Số ngày muốn xem (Default: 7)
   */
  getActivityTrend: async (storeId: string, days: number = 7) => {
    const url = "/v1/branch/analytics/trend";
    return axiosClient.get<ApiResponse<TrendData>>(url, {
      params: { storeId, days },
    });
  },

  /**
   * Phân bổ đơn hàng theo trạng thái với phần trăm
   * GET /api/v1/branch/analytics/order-status
   * @param storeId ID của chi nhánh (Required)
   */
  getOrderStatusBreakdown: async (storeId: string) => {
    const url = "/v1/branch/analytics/order-status";
    return axiosClient.get<ApiResponse<OrderStatusData>>(url, {
      params: { storeId },
    });
  },

  /**
   * Top sản phẩm bán chạy theo chi nhánh
   * GET /api/v1/branch/analytics/top-products
   * @param storeId ID của chi nhánh (Required)
   * @param limit Số lượng sản phẩm (Default: 10)
   */
  getTopProducts: async (storeId: string, limit: number = 10) => {
    const url = "/v1/branch/analytics/top-products";
    return axiosClient.get<ApiResponse<BranchTopProductsData>>(url, {
      params: { storeId, limit },
    });
  },
};

export default managerDashboardService;