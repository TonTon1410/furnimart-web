import axiosClient from "./axiosClient";
import type { RecentOrderLite } from "@/dashboard/data/dashboard.types"; 

// ==========================================
// INTERFACES
// ==========================================

export interface ApiStoreOrder {
  id: number;
  total: number;
  note: string | null;
  orderDate: string;
  status: string; 
  user?: {
    fullName: string;
    phone: string;
  };
  address?: {
    name: string;
    phone: string;
  };
}

export interface StoreOrderResponse {
  content: ApiStoreOrder[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface ApiResponse<T> {
  status: number;
  message: string;
  data: T;
}

// ==========================================
// HELPERS
// ==========================================

const calculateTimeAgo = (dateString: string): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Vừa xong';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} phút trước`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} giờ trước`;
  return `${Math.floor(diffInSeconds / 86400)} ngày trước`;
};

// Map status API sang status hiển thị trên Dashboard
const mapToDashboardStatus = (apiStatus: string): 'PENDING' | 'CONFIRMED' | 'SHIPPING' | 'COMPLETED' | 'CANCELLED' => {
  const status = apiStatus?.toUpperCase() || '';
  
  // PENDING: Đơn mới gán cho cửa hàng, cần duyệt
  if (['ASSIGN_ORDER_STORE', 'PRE_ORDER', 'PENDING'].includes(status)) {
    return 'PENDING';
  } 
  // CONFIRMED: Đã duyệt, đang xử lý/thanh toán
  if (['CONFIRMED', 'MANAGER_ACCEPT', 'READY_FOR_INVOICE', 'PAYMENT'].includes(status)) {
    return 'CONFIRMED';
  } 
  // SHIPPING: Đang giao
  if (['SHIPPING', 'PACKAGED', 'DELIVERING'].includes(status)) {
    return 'SHIPPING';
  }
  // COMPLETED: Hoàn tất
  if (['DELIVERED', 'FINISHED', 'COMPLETED'].includes(status)) {
    return 'COMPLETED';
  }
  // CANCELLED
  if (['CANCELLED', 'MANAGER_REJECT', 'DENIED'].includes(status)) {
    return 'CANCELLED';
  }

  return 'PENDING'; // Mặc định
};

// ==========================================
// SERVICE
// ==========================================

const storeOrderService = {
  getOrdersByStore: async (
    storeId: string, 
    params: { status?: string; page?: number; size?: number; keyword?: string } = {}
  ) => {
    const url = `/orders/store/${storeId}`;
    return axiosClient.get<ApiResponse<StoreOrderResponse>>(url, { params });
  },

  getStaffPendingOrders: async (storeId: string): Promise<RecentOrderLite[]> => {
    try {
      // Lấy 10 đơn mới nhất (không lọc status để hiển thị tất cả cho test, hoặc bạn có thể thêm status: 'ASSIGN_ORDER_STORE')
      const response = await storeOrderService.getOrdersByStore(storeId, {
        page: 0,
        size: 10,
        // Bỏ comment dòng dưới nếu CHỈ muốn xem đơn chờ duyệt
        // status: 'ASSIGN_ORDER_STORE' 
      });

      // Xử lý lấy data an toàn bất kể axios trả về body hay full response
      // Dựa vào log của bạn: response.data là object { status: 200, data: { content: [] } }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rawData = (response as any).data?.data || (response as any).data; 
      const orders = rawData?.content || [];

      return orders.map((order: ApiStoreOrder) => ({
        id: `ORD-${order.id}`,
        customerName: order.user?.fullName || order.address?.name || "Khách lẻ",
        total: order.total,
        status: mapToDashboardStatus(order.status),
        time: calculateTimeAgo(order.orderDate)
      }));

    } catch (error) {
      console.error("❌ Error fetching staff pending orders:", error);
      return [];
    }
  }
};

export default storeOrderService;