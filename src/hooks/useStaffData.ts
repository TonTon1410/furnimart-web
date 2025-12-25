/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect, useCallback } from 'react';
import { authService } from '@/service/authService';

// Services
import dashboardService, { type StaffDashboardData } from '@/service/generalDashboardService';
import managerDashboardService, { type InventorySummaryData } from '@/service/managerDashboardService';
import storeOrderService from '@/service/storeOrderService';
import { chatService } from '@/service/chatService';

// Types
import type { RecentOrderLite, RecentMessage } from '@/dashboard/data/dashboard.types';
import type { ChatSession } from '@/types/chat'; 

interface UseStaffDataResult {
  stats: StaffDashboardData | null;
  inventory: InventorySummaryData | null;
  orders: RecentOrderLite[];
  messages: RecentMessage[]; 
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export const useStaffData = (): UseStaffDataResult => {
  const [stats, setStats] = useState<StaffDashboardData | null>(null);
  const [inventory, setInventory] = useState<InventorySummaryData | null>(null);
  const [orders, setOrders] = useState<RecentOrderLite[]>([]);
  const [messages, setMessages] = useState<RecentMessage[]>([]);
  
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Helper time ago cho Chat
  const calculateTimeAgo = (dateString: string): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);
    if (diffInMinutes < 1) return 'Vừa xong';
    if (diffInMinutes < 60) return `${diffInMinutes} phút`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} giờ`;
    return `${Math.floor(diffInMinutes / 1440)} ngày`;
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const storeId = authService.getStoreId();
      if (!storeId) {
        throw new Error("Không tìm thấy thông tin cửa hàng (Store ID)");
      }

      // Gọi API song song
      const [statsRes, inventoryRes, ordersRes, chatsRes] = await Promise.all([
        dashboardService.getStaffDashboard().catch(() => ({ data: null })), // Fallback nếu lỗi
        managerDashboardService.getInventorySummary(storeId).catch(() => ({ data: null })),
        storeOrderService.getStaffPendingOrders(storeId),
        chatService.getLatestChats(5).catch(() => ({ data: [] }))
      ]);

      // --- 1. Xử lý Inventory (Fix lỗi hiển thị 0) ---
      // Log của bạn cho thấy: response.data.data = { totalProducts: 2, ... }
      let fetchedInventory: InventorySummaryData | null = null;
      if (inventoryRes) {
        const rawInv = (inventoryRes as any).data;
        // Kiểm tra xem data nằm ở tầng nào
        if (rawInv && rawInv.data) {
             fetchedInventory = rawInv.data; // Tầng data.data
        } else {
             fetchedInventory = rawInv; // Tầng data
        }
        setInventory(fetchedInventory);
      }

      // --- 2. Xử lý Orders ---
      setOrders(ordersRes);

      // --- 3. Xử lý Stats (Tự tính toán nếu API stats trả về 0 hoặc null) ---
      let finalStats: StaffDashboardData = {
        personalRevenue: 0,
        createdOrdersCount: 0,
        pendingStoreOrdersCount: 0
      };

      // Nếu API stats có dữ liệu thì lấy
      if ((statsRes as any)?.data?.data) {
        finalStats = (statsRes as any).data.data;
      }

      // GHI ĐÈ: Tự tính số lượng đơn pending từ list orders lấy được để đảm bảo hiển thị đúng
      const pendingCount = ordersRes.filter(o => o.status === 'PENDING').length;
      if (pendingCount > 0) {
          finalStats.pendingStoreOrdersCount = pendingCount;
      }
      
      // GHI ĐÈ: Tự tính warning kho từ inventory lấy được
      // (Lưu ý: API stats trả về pendingStoreOrdersCount, nhưng ta có thể hiển thị thêm cảnh báo kho ở UI riêng)
      
      setStats(finalStats);

      // --- 4. Xử lý Messages ---
      if (chatsRes) {
         const rawChats = (chatsRes as any).data?.data || (chatsRes as any).data || [];
         const chatList = Array.isArray(rawChats) ? rawChats : [];
         
         const mappedChats = chatList.map((chat: ChatSession) => {
            const participant = chat.participants?.find(p => p.email !== authService.getRememberedEmail());
            const otherUser = (participant as any)?.user || participant; 
            return {
              id: chat.id,
              customerName: chat.chatName || otherUser?.fullName || "Khách hàng",
              avatar: otherUser?.avatar || "https://placehold.co/100",
              preview: chat.lastMessage?.content || "Đã gửi một tin nhắn",
              time: calculateTimeAgo(chat.lastMessageAt || chat.createdAt),
              isUnread: chat.unreadCount > 0
            };
         });
         setMessages(mappedChats);
      }

    } catch (err: any) {
      console.error("❌ Error fetching staff data:", err);
      setError(err.message || "Không thể tải dữ liệu dashboard");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { stats, inventory, orders, messages, loading, error, refresh: fetchData };
};