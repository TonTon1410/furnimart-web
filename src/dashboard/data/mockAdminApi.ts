import type {
    AdminOverviewStats,
    BranchRevenueData,
    DeliveryPerformance,
    ProductSummary
} from './dashboard.types';
import { simulateNetworkRequest, MOCK_PRODUCTS } from './mockData';

export const AdminApi = {
  // API-A1: Thống kê tổng quan
  getOverviewStats: async (): Promise<AdminOverviewStats> => {
    return simulateNetworkRequest({
      totalRevenue: 2540000000, // 2.54 Tỷ
      growthRate: 12.5,
      totalOrders: 1450,
      activeBranches: 8,
      pendingBranches: 2,
      newCustomers: 320,
      newStaffs: 5,
    });
  },

  // API-A2: Doanh thu theo chi nhánh
  getRevenueByBranch: async (): Promise<BranchRevenueData[]> => {
    return simulateNetworkRequest([
      { branchId: 'B01', branchName: 'CN Quận 1', revenue: 850000000 },
      { branchId: 'B02', branchName: 'CN Hà Nội', revenue: 720000000 },
      { branchId: 'B03', branchName: 'CN Đà Nẵng', revenue: 540000000 },
      { branchId: 'B04', branchName: 'CN Cần Thơ', revenue: 320000000 },
      { branchId: 'B05', branchName: 'CN Hải Phòng', revenue: 110000000 },
    ]);
  },

  // API-A3: Hiệu quả giao hàng
  getDeliveryPerformance: async (): Promise<DeliveryPerformance> => {
    return simulateNetworkRequest({
      successful: 82,
      returned: 5,
      late: 13,
    });
  },

  // API-A4: Top sản phẩm toàn hệ thống
  getGlobalTopProducts: async (): Promise<ProductSummary[]> => {
    // Admin thấy dữ liệu gốc (tổng toàn hệ thống)
    return simulateNetworkRequest(MOCK_PRODUCTS);
  }
};