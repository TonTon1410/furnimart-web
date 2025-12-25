/* eslint-disable @typescript-eslint/no-explicit-any */
// src/services/chatService.ts
import axiosClient from "./axiosClient"; 
import type {
  ApiResponse,
  ChatSession,
  ChatMessage,
  CreateChatPayload,
  SendMessagePayload
} from '../types/chat';

export const chatService = {
  
  /**
   * 1. Lấy danh sách các cuộc hội thoại (Của người dùng hiện tại)
   */
  getUserChats: async (): Promise<ApiResponse<ChatSession[]>> => {
    const response = await axiosClient.get<ApiResponse<ChatSession[]>>('/chats');
    return response.data;
  },

  /**
   * 2. Tạo cuộc hội thoại mới (Thường dùng cho admin/staff tạo thủ công)
   */
  createChat: async (payload: CreateChatPayload = {}): Promise<ApiResponse<ChatSession>> => {
    const response = await axiosClient.post<ApiResponse<ChatSession>>('/chats', payload);
    return response.data;
  },

  /**
   * [NEW] 2.1. Tạo chat nhanh cho khách hàng (Quick Create)
   * POST /api/chats/quick-create
   * Dùng khi khách hàng bấm "Bắt đầu hỗ trợ"
   */
  quickCreateChat: async (): Promise<ApiResponse<ChatSession>> => {
    const response = await axiosClient.post<ApiResponse<ChatSession>>('/chats/quick-create');
    return response.data;
  },

  /**
   * [NEW] 2.2. Lấy danh sách chat đang chờ nhân viên (Dành cho Staff)
   * GET /api/chats/waiting-staff
   * Dùng để Staff xem danh sách hàng chờ
   */
  getWaitingChats: async (): Promise<ApiResponse<ChatSession[]>> => {
    const response = await axiosClient.get<ApiResponse<ChatSession[]>>('/chats/waiting-staff');
    return response.data;
  },

  /**
   * 3. Lấy tin nhắn của một cuộc hội thoại
   */
  getMessages: async (chatId: string): Promise<ApiResponse<ChatMessage[]>> => {
    const response = await axiosClient.get<ApiResponse<ChatMessage[]>>(`/chat-messages/chat/${chatId}`);
    return response.data;
  },

  /**
   * 4. Gửi tin nhắn
   */
  sendMessage: async (payload: SendMessagePayload): Promise<ApiResponse<ChatMessage>> => {
    const response = await axiosClient.post<ApiResponse<ChatMessage>>('/chat-messages', payload);
    return response.data;
  },

  /**
   * 5. Khách hàng yêu cầu gặp nhân viên (API cũ - có thể giữ lại hoặc thay thế bằng luồng quick-create tùy logic)
   */
  requestStaff: async (chatId: string): Promise<ApiResponse<ChatSession>> => {
    const response = await axiosClient.post<ApiResponse<ChatSession>>(`/chats/${chatId}/request-staff`);
    return response.data;
  },

  /**
   * 6. Nhân viên chấp nhận hỗ trợ (Pickup)
   * POST /api/chats/{id}/accept-staff
   * Chuyển trạng thái từ WAITING_STAFF -> STAFF_CONNECTED
   */
  acceptStaff: async (chatId: string): Promise<ApiResponse<ChatSession>> => {
    const response = await axiosClient.post<ApiResponse<ChatSession>>(`/chats/${chatId}/accept-staff`);
    return response.data;
  },

  /**
   * 7. Nhân viên kết thúc phiên hỗ trợ
   * POST /api/chats/{id}/end-staff-chat
   * Chuyển trạng thái -> INACTIVE (nhưng vẫn giữ kết nối history)
   */
  endStaffChat: async (chatId: string): Promise<ApiResponse<ChatSession>> => {
    const response = await axiosClient.post<ApiResponse<ChatSession>>(`/chats/${chatId}/end-staff-chat`);
    return response.data;
  },

  /**
   * 8. Đánh dấu đã đọc cả đoạn chat
   */
  markChatAsRead: async (chatId: string): Promise<ApiResponse<any>> => {
    const response = await axiosClient.post<ApiResponse<any>>(`/chats/${chatId}/read`);
    return response.data;
  },

  /**
   * 9. Đánh dấu đã đọc một tin nhắn cụ thể
   */
  markMessageAsRead: async (messageId: string): Promise<ApiResponse<any>> => {
    const response = await axiosClient.post<ApiResponse<any>>(`/chat-messages/${messageId}/read`);
    return response.data;
  },

  // --- CÁC API KHÁC ---

  /**
   * 10. Ghim / Bỏ ghim đoạn chat
   */
  pinChat: async (chatId: string, pinned: boolean): Promise<ApiResponse<ChatSession>> => {
    const response = await axiosClient.patch<ApiResponse<ChatSession>>(
      `/chats/${chatId}/pin`,
      null,
      { params: { pinned } }
    );
    return response.data;
  },

  /**
   * 11. Tắt / Bật thông báo đoạn chat
   */
  muteChat: async (chatId: string, muted: boolean): Promise<ApiResponse<ChatSession>> => {
    const response = await axiosClient.patch<ApiResponse<ChatSession>>(
      `/chats/${chatId}/mute`,
      null,
      { params: { muted } }
    );
    return response.data;
  },

  /**
   * 12. Xóa đoạn chat
   */
  deleteChat: async (chatId: string): Promise<ApiResponse<any>> => {
    const response = await axiosClient.delete<ApiResponse<any>>(`/chats/${chatId}`);
    return response.data;
  },

  /**
   * 13. Xóa một tin nhắn cụ thể
   */
  deleteMessage: async (messageId: string): Promise<ApiResponse<any>> => {
    const response = await axiosClient.delete<ApiResponse<any>>(`/chat-messages/${messageId}`);
    return response.data;
  },

  /**
   * 14. Sửa tin nhắn
   */
  editMessage: async (messageId: string, content: string): Promise<ApiResponse<ChatMessage>> => {
    const response = await axiosClient.put<ApiResponse<ChatMessage>>(
      `/chat-messages/${messageId}`,
      null,
      { params: { content } }
    );
    return response.data;
  },

  /**
   * 15. Tìm kiếm tin nhắn trong đoạn chat
   */
  searchMessages: async (chatId: string, searchTerm: string): Promise<ApiResponse<ChatMessage[]>> => {
    const response = await axiosClient.get<ApiResponse<ChatMessage[]>>(
      `/chat-messages/chat/${chatId}/search`,
      { params: { searchTerm } }
    );
    return response.data;
  },

  /**
   * 16. Lấy danh sách các cuộc hội thoại mới nhất
   */
  getLatestChats: async (limit: number = 10): Promise<ApiResponse<ChatSession[]>> => {
    const response = await axiosClient.get<ApiResponse<ChatSession[]>>('/chats/latest', {
      params: { limit }
    });
    return response.data;
  }
};