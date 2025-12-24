// Chat API service - kết nối với backend API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://152.53.244.124:8086"

export interface Chat {
  id: string
  name: string
  description: string
  type: "PRIVATE" | "GROUP"
  status: "ACTIVE" | "CLOSED"
  createdById: string
  createdByName: string
  createdAt: string | null
  updatedAt: string | null
  participants: Participant[]
  lastMessage: ChatMessage | null
  unreadCount: number
  isMuted: boolean
  isPinned: boolean
  chatMode: "AI" | "WAITING_STAFF" | "STAFF_CONNECTED"
  assignedStaffId: string | null
  assignedStaffName: string | null
  staffRequestedAt: string | null
  staffChatEndedAt: string | null
}

export interface Participant {
  userId: string
  userName: string
  role: string
  joinedAt: string
}

export interface ChatMessage {
  id: string
  chatId: string
  senderId: string
  senderName: string
  content: string
  type: "TEXT" | "IMAGE" | "FILE"
  status: "SENT" | "DELIVERED" | "READ"
  createdAt: string
  updatedAt: string | null
  isEdited: boolean
  replyToId: string | null
}

export interface PaginatedResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  size: number
  number: number
}

export interface ApiResponse<T> {
  status: number
  message: string
  data: T
}

export const MOCK_CHATS: Chat[] = [
  {
    id: "1",
    name: "Nguyễn Văn A",
    description: "Hỗ trợ đặt hàng",
    type: "PRIVATE",
    status: "ACTIVE",
    createdById: "user-1",
    createdByName: "Nguyễn Văn A",
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    updatedAt: null,
    participants: [],
    lastMessage: {
      id: "msg-1",
      chatId: "1",
      senderId: "user-1",
      senderName: "Nguyễn Văn A",
      content: "Tôi muốn hỏi về sản phẩm ghế sofa",
      type: "TEXT",
      status: "DELIVERED",
      createdAt: new Date(Date.now() - 1800000).toISOString(),
      updatedAt: null,
      isEdited: false,
      replyToId: null,
    },
    unreadCount: 3,
    isMuted: false,
    isPinned: true,
    chatMode: "WAITING_STAFF",
    assignedStaffId: null,
    assignedStaffName: null,
    staffRequestedAt: new Date().toISOString(),
    staffChatEndedAt: null,
  },
  {
    id: "2",
    name: "Trần Thị B",
    description: "Khiếu nại đơn hàng",
    type: "PRIVATE",
    status: "ACTIVE",
    createdById: "user-2",
    createdByName: "Trần Thị B",
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    updatedAt: null,
    participants: [],
    lastMessage: {
      id: "msg-2",
      chatId: "2",
      senderId: "user-2",
      senderName: "Trần Thị B",
      content: "Đơn hàng của tôi bị giao sai màu",
      type: "TEXT",
      status: "READ",
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      updatedAt: null,
      isEdited: false,
      replyToId: null,
    },
    unreadCount: 0,
    isMuted: false,
    isPinned: false,
    chatMode: "STAFF_CONNECTED",
    assignedStaffId: "staff-1",
    assignedStaffName: "Nhân viên Minh",
    staffRequestedAt: null,
    staffChatEndedAt: null,
  },
  {
    id: "3",
    name: "Lê Văn C",
    description: "Tư vấn sản phẩm",
    type: "PRIVATE",
    status: "ACTIVE",
    createdById: "user-3",
    createdByName: "Lê Văn C",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: null,
    participants: [],
    lastMessage: {
      id: "msg-3",
      chatId: "3",
      senderId: "ai-bot",
      senderName: "AI Assistant",
      content: "Cảm ơn bạn đã liên hệ. Tôi có thể giúp gì cho bạn?",
      type: "TEXT",
      status: "DELIVERED",
      createdAt: new Date(Date.now() - 43200000).toISOString(),
      updatedAt: null,
      isEdited: false,
      replyToId: null,
    },
    unreadCount: 1,
    isMuted: true,
    isPinned: false,
    chatMode: "AI",
    assignedStaffId: null,
    assignedStaffName: null,
    staffRequestedAt: null,
    staffChatEndedAt: null,
  },
]

export const MOCK_MESSAGES: Record<string, ChatMessage[]> = {
  "1": [
    {
      id: "msg-1-1",
      chatId: "1",
      senderId: "user-1",
      senderName: "Nguyễn Văn A",
      content: "Xin chào, tôi cần hỗ trợ",
      type: "TEXT",
      status: "READ",
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      updatedAt: null,
      isEdited: false,
      replyToId: null,
    },
    {
      id: "msg-1-2",
      chatId: "1",
      senderId: "ai-bot",
      senderName: "AI Assistant",
      content: "Xin chào! Tôi là trợ lý AI. Tôi có thể giúp gì cho bạn hôm nay?",
      type: "TEXT",
      status: "DELIVERED",
      createdAt: new Date(Date.now() - 3500000).toISOString(),
      updatedAt: null,
      isEdited: false,
      replyToId: null,
    },
    {
      id: "msg-1-3",
      chatId: "1",
      senderId: "user-1",
      senderName: "Nguyễn Văn A",
      content: "Tôi muốn hỏi về sản phẩm ghế sofa. Có mẫu nào đang giảm giá không?",
      type: "TEXT",
      status: "DELIVERED",
      createdAt: new Date(Date.now() - 1800000).toISOString(),
      updatedAt: null,
      isEdited: false,
      replyToId: null,
    },
  ],
  "2": [
    {
      id: "msg-2-1",
      chatId: "2",
      senderId: "user-2",
      senderName: "Trần Thị B",
      content: "Tôi cần khiếu nại về đơn hàng #12345",
      type: "TEXT",
      status: "READ",
      createdAt: new Date(Date.now() - 7200000).toISOString(),
      updatedAt: null,
      isEdited: false,
      replyToId: null,
    },
    {
      id: "msg-2-2",
      chatId: "2",
      senderId: "staff-1",
      senderName: "Nhân viên Minh",
      content:
        "Xin chào chị, tôi là Minh - nhân viên hỗ trợ. Chị có thể cho tôi biết thêm chi tiết về vấn đề được không ạ?",
      type: "TEXT",
      status: "DELIVERED",
      createdAt: new Date(Date.now() - 7000000).toISOString(),
      updatedAt: null,
      isEdited: false,
      replyToId: null,
    },
    {
      id: "msg-2-3",
      chatId: "2",
      senderId: "user-2",
      senderName: "Trần Thị B",
      content: "Đơn hàng của tôi bị giao sai màu. Tôi đặt màu xám nhưng nhận được màu đen.",
      type: "TEXT",
      status: "READ",
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      updatedAt: null,
      isEdited: false,
      replyToId: null,
    },
  ],
  "3": [
    {
      id: "msg-3-1",
      chatId: "3",
      senderId: "user-3",
      senderName: "Lê Văn C",
      content: "Tôi muốn tư vấn về bàn làm việc",
      type: "TEXT",
      status: "READ",
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      updatedAt: null,
      isEdited: false,
      replyToId: null,
    },
    {
      id: "msg-3-2",
      chatId: "3",
      senderId: "ai-bot",
      senderName: "AI Assistant",
      content: "Cảm ơn bạn đã liên hệ. Tôi có thể giúp gì cho bạn?",
      type: "TEXT",
      status: "DELIVERED",
      createdAt: new Date(Date.now() - 43200000).toISOString(),
      updatedAt: null,
      isEdited: false,
      replyToId: null,
    },
  ],
}

// Helper để lấy auth token
function getAuthHeaders(): HeadersInit {
  const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null
  return {
    "Content-Type": "application/json",
    Accept: "*/*",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

export const chatApi = {
  // GET /api/chats - Lấy danh sách chat của user
  getChats: async (useMockData = false): Promise<Chat[]> => {
    if (useMockData) return MOCK_CHATS
    try {
      const res = await fetch(`${API_BASE_URL}/api/chats`, {
        headers: getAuthHeaders(),
      })
      if (!res.ok) throw new Error("Failed to fetch chats")
      const data: ApiResponse<Chat[]> = await res.json()
      return data.data
    } catch (error) {
      console.warn("API failed, using mock data:", error)
      return MOCK_CHATS
    }
  },

  // GET /api/chats/paginated - Lấy danh sách chat với phân trang
  getChatsPaginated: async (page = 0, size = 20): Promise<PaginatedResponse<Chat>> => {
    const res = await fetch(`${API_BASE_URL}/api/chats/paginated?page=${page}&size=${size}`, {
      headers: getAuthHeaders(),
    })
    if (!res.ok) throw new Error("Failed to fetch chats")
    const data: ApiResponse<PaginatedResponse<Chat>> = await res.json()
    return data.data
  },

  // GET /api/chats/{id} - Lấy chi tiết chat
  getChatById: async (id: string): Promise<Chat> => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/chats/${id}`, {
        headers: getAuthHeaders(),
      })
      if (!res.ok) throw new Error("Failed to fetch chat")
      const data: ApiResponse<Chat> = await res.json()
      return data.data
    } catch {
      const mockChat = MOCK_CHATS.find((c) => c.id === id)
      if (mockChat) return mockChat
      throw new Error("Chat not found")
    }
  },

  // POST /api/chats - Tạo chat mới
  createChat: async (body: {
    name: string
    description: string
    type: "PRIVATE" | "GROUP"
    participantIds: string[]
  }): Promise<Chat> => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/chats`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error("Failed to create chat")
      const data: ApiResponse<Chat> = await res.json()
      return data.data
    } catch {
      // Mock create
      const newChat: Chat = {
        id: `mock-${Date.now()}`,
        ...body,
        status: "ACTIVE",
        createdById: "current-user",
        createdByName: "Current User",
        createdAt: new Date().toISOString(),
        updatedAt: null,
        participants: [],
        lastMessage: null,
        unreadCount: 0,
        isMuted: false,
        isPinned: false,
        chatMode: "AI",
        assignedStaffId: null,
        assignedStaffName: null,
        staffRequestedAt: null,
        staffChatEndedAt: null,
      }
      return newChat
    }
  },

  // PUT /api/chats/{id} - Cập nhật chat
  updateChat: async (id: string, body: Partial<Chat>): Promise<Chat> => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/chats/${id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error("Failed to update chat")
      const data: ApiResponse<Chat> = await res.json()
      return data.data
    } catch {
      const mockChat = MOCK_CHATS.find((c) => c.id === id)
      if (mockChat) return { ...mockChat, ...body }
      throw new Error("Chat not found")
    }
  },

  // DELETE /api/chats/{id} - Xóa chat
  deleteChat: async (id: string): Promise<void> => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/chats/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      })
      if (!res.ok) throw new Error("Failed to delete chat")
    } catch {
      // Mock delete - do nothing
      console.log("Mock delete chat:", id)
    }
  },

  // POST /api/chats/{id}/read - Đánh dấu đã đọc
  markAsRead: async (id: string): Promise<void> => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/chats/${id}/read`, {
        method: "POST",
        headers: getAuthHeaders(),
      })
      if (!res.ok) throw new Error("Failed to mark as read")
    } catch {
      console.log("Mock mark as read:", id)
    }
  },

  // PATCH /api/chats/{id}/pin - Ghim/bỏ ghim chat
  togglePin: async (id: string): Promise<Chat> => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/chats/${id}/pin`, {
        method: "PATCH",
        headers: getAuthHeaders(),
      })
      if (!res.ok) throw new Error("Failed to toggle pin")
      const data: ApiResponse<Chat> = await res.json()
      return data.data
    } catch {
      const mockChat = MOCK_CHATS.find((c) => c.id === id)
      if (mockChat) return { ...mockChat, isPinned: !mockChat.isPinned }
      throw new Error("Chat not found")
    }
  },

  // PATCH /api/chats/{id}/mute - Tắt/bật thông báo
  toggleMute: async (id: string): Promise<Chat> => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/chats/${id}/mute`, {
        method: "PATCH",
        headers: getAuthHeaders(),
      })
      if (!res.ok) throw new Error("Failed to toggle mute")
      const data: ApiResponse<Chat> = await res.json()
      return data.data
    } catch {
      const mockChat = MOCK_CHATS.find((c) => c.id === id)
      if (mockChat) return { ...mockChat, isMuted: !mockChat.isMuted }
      throw new Error("Chat not found")
    }
  },

  // GET /api/chats/search - Tìm kiếm chat
  searchChats: async (query: string): Promise<Chat[]> => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/chats/search?q=${encodeURIComponent(query)}`, {
        headers: getAuthHeaders(),
      })
      if (!res.ok) throw new Error("Failed to search chats")
      const data: ApiResponse<Chat[]> = await res.json()
      return data.data
    } catch {
      return MOCK_CHATS.filter(
        (c) =>
          c.name.toLowerCase().includes(query.toLowerCase()) ||
          c.description.toLowerCase().includes(query.toLowerCase()),
      )
    }
  },
}

// Chat Message Controller APIs
export const messageApi = {
  // GET /api/chat-messages/chat/{chatId} - Lấy tin nhắn của chat
  getMessages: async (chatId: string): Promise<ChatMessage[]> => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/chat-messages/chat/${chatId}`, {
        headers: getAuthHeaders(),
      })
      if (!res.ok) throw new Error("Failed to fetch messages")
      const data: ApiResponse<ChatMessage[]> = await res.json()
      return data.data
    } catch {
      return MOCK_MESSAGES[chatId] || []
    }
  },

  // GET /api/chat-messages/chat/{chatId}/paginated - Lấy tin nhắn với phân trang
  getMessagesPaginated: async (chatId: string, page = 0, size = 50): Promise<PaginatedResponse<ChatMessage>> => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/chat-messages/chat/${chatId}/paginated?page=${page}&size=${size}`, {
        headers: getAuthHeaders(),
      })
      if (!res.ok) throw new Error("Failed to fetch messages")
      const data: ApiResponse<PaginatedResponse<ChatMessage>> = await res.json()
      return data.data
    } catch {
      const messages = MOCK_MESSAGES[chatId] || []
      return {
        content: messages,
        totalElements: messages.length,
        totalPages: 1,
        size,
        number: page,
      }
    }
  },

  // POST /api/chat-messages - Gửi tin nhắn
  sendMessage: async (body: { chatId: string; content: string; type?: string }): Promise<ChatMessage> => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/chat-messages`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ ...body, type: body.type || "TEXT" }),
      })
      if (!res.ok) throw new Error("Failed to send message")
      const data: ApiResponse<ChatMessage> = await res.json()
      return data.data
    } catch {
      // Mock send message
      const newMessage: ChatMessage = {
        id: `mock-msg-${Date.now()}`,
        chatId: body.chatId,
        senderId: "current-staff-id",
        senderName: "Bạn",
        content: body.content,
        type: "TEXT",
        status: "SENT",
        createdAt: new Date().toISOString(),
        updatedAt: null,
        isEdited: false,
        replyToId: null,
      }
      return newMessage
    }
  },

  // PUT /api/chat-messages/{id} - Sửa tin nhắn
  editMessage: async (id: string, content: string): Promise<ChatMessage> => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/chat-messages/${id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ content }),
      })
      if (!res.ok) throw new Error("Failed to edit message")
      const data: ApiResponse<ChatMessage> = await res.json()
      return data.data
    } catch {
      // Mock edit
      return {
        id,
        chatId: "",
        senderId: "current-staff-id",
        senderName: "Bạn",
        content,
        type: "TEXT",
        status: "SENT",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isEdited: true,
        replyToId: null,
      }
    }
  },

  // DELETE /api/chat-messages/{id} - Xóa tin nhắn
  deleteMessage: async (id: string): Promise<void> => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/chat-messages/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      })
      if (!res.ok) throw new Error("Failed to delete message")
    } catch {
      console.log("Mock delete message:", id)
    }
  },

  // POST /api/chat-messages/{id}/read - Đánh dấu tin nhắn đã đọc
  markMessageAsRead: async (id: string): Promise<void> => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/chat-messages/${id}/read`, {
        method: "POST",
        headers: getAuthHeaders(),
      })
      if (!res.ok) throw new Error("Failed to mark message as read")
    } catch {
      console.log("Mock mark message as read:", id)
    }
  },

  // GET /api/chat-messages/chat/{chatId}/search - Tìm kiếm tin nhắn
  searchMessages: async (chatId: string, query: string): Promise<ChatMessage[]> => {
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/chat-messages/chat/${chatId}/search?q=${encodeURIComponent(query)}`,
        {
          headers: getAuthHeaders(),
        },
      )
      if (!res.ok) throw new Error("Failed to search messages")
      const data: ApiResponse<ChatMessage[]> = await res.json()
      return data.data
    } catch {
      const messages = MOCK_MESSAGES[chatId] || []
      return messages.filter((m) => m.content.toLowerCase().includes(query.toLowerCase()))
    }
  },
}
