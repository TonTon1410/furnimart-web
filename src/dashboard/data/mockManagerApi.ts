import type {
    BranchDailyStats,
    ActivityTrendData,
    OrderStatusData,
    ProductSummary
} from './dashboard.types';
import { simulateNetworkRequest, MOCK_PRODUCTS } from './mockData';

export const ManagerApi = {
  // API-M1: Chỉ số vận hành trong ngày
  getDailyStats: async (): Promise<BranchDailyStats> => {
    return simulateNetworkRequest({
      todayRevenue: 45000000, // 45 Triệu
      pendingOrders: 12,      // Cần xử lý gấp
      shippingOrders: 8,      // Đang đi giao
      lowStockItems: 3,       // Cảnh báo hết hàng
    });
  },

  // API-M2: Biểu đồ xu hướng 7 ngày
  getActivityTrend: async (): Promise<ActivityTrendData[]> => {
    const data: ActivityTrendData[] = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      data.push({
        date: `${d.getDate()}/${d.getMonth() + 1}`,
        orders: Math.floor(Math.random() * 20) + 10,
        revenue: Math.floor(Math.random() * 10000000) + 5000000,
      });
    }
    return simulateNetworkRequest(data);
  },

  // API-M3: Thống kê trạng thái đơn hàng
  getOrderStatusBreakdown: async (): Promise<OrderStatusData[]> => {
    return simulateNetworkRequest([
      { status: 'PENDING', count: 12, color: '#FF9800' },   // Cam
      { status: 'CONFIRMED', count: 25, color: '#2196F3' }, // Xanh dương
      { status: 'SHIPPING', count: 8, color: '#9C27B0' },   // Tím
      { status: 'COMPLETED', count: 150, color: '#4CAF50' },// Xanh lá
      { status: 'CANCELLED', count: 5, color: '#F44336' },  // Đỏ
    ]);
  },

  // API-M4: Top sản phẩm tại chi nhánh (Logic khác Admin)
  getLocalTopProducts: async (): Promise<ProductSummary[]> => {
    // Giả lập dữ liệu riêng cho chi nhánh: Số bán thấp hơn, Tồn kho ngẫu nhiên
    const localProducts = MOCK_PRODUCTS.map(p => ({
      ...p,
      sold: Math.floor(p.sold / 5), // Giả sử chi nhánh bán được 1/5 tổng số
      stock: Math.floor(Math.random() * 10) // Tồn kho local ngẫu nhiên
    }));
    return simulateNetworkRequest(localProducts);
  }
};