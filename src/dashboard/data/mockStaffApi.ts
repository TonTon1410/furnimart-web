import type {
    StaffWorkStats,
    StaffWorkloadData,
    RecentOrderLite,
    RecentMessage
} from './dashboard.types';
import { simulateNetworkRequest } from './mockData';

export const StaffApi = {
  // API-S1: Thống kê công việc cần làm ngay
  getWorkStats: async (): Promise<StaffWorkStats> => {
    return simulateNetworkRequest({
      pendingOrders: 5,       // Cần confirm gấp
      unreadMessages: 3,      // Cần reply gấp
      processedToday: 12,     // KPI trong ngày
      lowStockAlerts: 4,      // Cần nhập hàng/báo quản lý
    });
  },

  // API-S2: Hiệu suất làm việc trong ngày (Theo giờ)
  getDailyWorkload: async (): Promise<StaffWorkloadData[]> => {
    // Giả lập từ 8h sáng đến 17h chiều
    const data: StaffWorkloadData[] = [
      { hour: '8:00', ordersProcessed: 2, messagesReplied: 1 },
      { hour: '9:00', ordersProcessed: 5, messagesReplied: 4 },
      { hour: '10:00', ordersProcessed: 8, messagesReplied: 6 },
      { hour: '11:00', ordersProcessed: 4, messagesReplied: 2 },
      { hour: '12:00', ordersProcessed: 1, messagesReplied: 0 },
      { hour: '13:00', ordersProcessed: 3, messagesReplied: 5 },
      { hour: '14:00', ordersProcessed: 6, messagesReplied: 8 },
      { hour: '15:00', ordersProcessed: 4, messagesReplied: 3 },
    ];
    return simulateNetworkRequest(data);
  },

  // API-S3: Danh sách đơn hàng mới nhất cần xác nhận
  getRecentPendingOrders: async (): Promise<RecentOrderLite[]> => {
    return simulateNetworkRequest([
      { id: 'ORD-2024-001', customerName: 'Nguyễn Văn A', total: 15500000, status: 'PENDING', time: '5 phút trước' },
      { id: 'ORD-2024-002', customerName: 'Trần Thị B', total: 2400000, status: 'PENDING', time: '12 phút trước' },
      { id: 'ORD-2024-003', customerName: 'Lê Hoàng C', total: 8900000, status: 'CONFIRMED', time: '30 phút trước' },
      { id: 'ORD-2024-004', customerName: 'Phạm Minh D', total: 450000, status: 'SHIPPING', time: '1 giờ trước' },
      { id: 'ORD-2024-005', customerName: 'Võ Thanh E', total: 32000000, status: 'PENDING', time: '2 giờ trước' },
    ]);
  },

  // API-S4: Tin nhắn gần đây từ khách hàng
  getRecentMessages: async (): Promise<RecentMessage[]> => {
    return simulateNetworkRequest([
      { id: 'MSG-01', customerName: 'Hoàng Nam', avatar: 'https://placehold.co/100', preview: 'Sản phẩm này còn màu xanh không shop?', time: '2 phút', isUnread: true },
      { id: 'MSG-02', customerName: 'Thu Hằng', avatar: 'https://placehold.co/100', preview: 'Cho mình hỏi phí ship về Quận 9.', time: '15 phút', isUnread: true },
      { id: 'MSG-03', customerName: 'Ngọc Thảo', avatar: 'https://placehold.co/100', preview: 'Cảm ơn shop, mình nhận được hàng rồi.', time: '1 giờ', isUnread: false },
    ]);
  }
};