// src/types/chat.ts

// 1. Wrapper chung cho Response của API
export interface ApiResponse<T> {
  status: number;
  message: string;
  data: T;
  timestamp: string;
}

// 2. Đối tượng User trong đoạn chat
export interface ChatParticipant {
  id: string;
  chatId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  role: 'ADMIN' | 'STAFF' | 'CUSTOMER' | string; // Cập nhật thêm các role nếu cần
  status: string;
  lastReadAt: string;
  isMuted: boolean;
  isPinned: boolean;
}

// 3. Đối tượng Tin nhắn
export interface ChatMessage {
  id: string;
  content: string;
  type: 'TEXT' | 'IMAGE' | 'FILE' | string;
  status: 'ACTIVE' | 'DELETED' | string;
  chatId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  
  replyToMessageId?: string | null;
  replyToContent?: string | null;
  attachmentUrl?: string | null;
  attachmentType?: string | null;
  
  isEdited: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

// 4. Đối tượng Cuộc hội thoại
export interface ChatSession {
  id: string;
  name?: string;
  description?: string;
  type: 'PRIVATE' | 'GROUP' | string;
  status: 'ACTIVE' | 'ENDED' | 'INACTIVE' | string;
  createdById: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
  
  participants: ChatParticipant[];
  lastMessage?: ChatMessage | null;
  unreadCount: number;
  isMuted: boolean;
  isPinned: boolean;
  
  // Cập nhật các trạng thái chatMode theo luồng mới
  chatMode: 'AI' | 'HUMAN' | 'WAITING_STAFF' | 'STAFF_CONNECTED' | string;
  
  assignedStaffId?: string | null;
  assignedStaffName?: string | null;
  staffRequestedAt?: string | null;
  staffChatEndedAt?: string | null;
}

// 5. Các Payload Input

export interface CreateChatPayload {
  name?: string;
  description?: string;
  type?: string; 
  participantIds?: string;
}

export interface SendMessagePayload {
  chatId: string;
  content: string;
  type?: 'TEXT' | 'IMAGE' | 'FILE';
  replyToMessageId?: string;
  attachmentUrl?: string;
  attachmentType?: string;
}