import axiosClient from "./axiosClient"

export interface Chat {
  id: string
  name?: string
  description?: string
  type: "PRIVATE" | "GROUP"
  chatMode?: "AI" | "WAITING_STAFF" | "STAFF_CONNECTED"
  assignedStaffId?: string | null
  assignedStaffName?: string
  staffRequestedAt?: string
  createdAt: string
  updatedAt: string
  participants: Array<{
    id: string
    chatId: string
    userId: string
    userName: string
    userAvatar?: string
    role: string
    status: string
  }>
  unreadCount?: number
  isMuted: boolean
  isPinned: boolean
  lastMessage?: {
    content: string
    createdAt: string
  } | null
}

export interface Message {
  id: string
  content: string
  type: "TEXT" | "IMAGE" | "FILE" | "SYSTEM" | "REPLY"
  status: "ACTIVE" | "DELETED"
  chatId: string
  senderId: string
  senderName?: string
  senderAvatar?: string
  replyToMessageId?: string
  replyToContent?: string
  attachmentUrl?: string
  attachmentType?: string
  isEdited: boolean
  isDeleted: boolean
  createdAt: string
  updatedAt: string
}

export const contactService = {
  getChats: (page = 0, size = 10) => {
    return axiosClient.get<{
      status: number
      message: string
      data: {
        content: Chat[]
        totalElements: number
        totalPages: number
        size: number
        number: number
        last: boolean
      }
    }>(`/chats/paginated?page=${page}&size=${size}`)
  },

  getMessages: (chatId: string, page = 0, size = 20) => {
    return axiosClient.get<{
      status: number
      message: string
      data: {
        content: Message[]
        totalElements: number
        totalPages: number
        size: number
        number: number
        last: boolean
      }
    }>(`/chat-messages/chat/${chatId}/paginated?page=${page}&size=${size}`)
  },

  sendMessage: (chatId: string, content: string, replyToMessageId?: string) => {
    return axiosClient.post<{
      status: number
      message: string
      data: Message
    }>("/chat-messages", {
      content,
      chatId,
      type: "TEXT",
      ...(replyToMessageId && { replyToMessageId }),
    })
  },

  getPrivateChat: (userId: string) => {
    return axiosClient.post<{
      status: number
      message: string
      data: Chat
    }>(`/chats/private/${userId}`)
  },

  requestStaff: (chatId: string) => {
    return axiosClient.post<{
      status: number
      message: string
      data: Chat
    }>(`/chats/${chatId}/request-staff`)
  },

  acceptStaff: (chatId: string) => {
    return axiosClient.post<{
      status: number
      message: string
      data: Chat
    }>(`/chats/${chatId}/accept-staff`)
  },

  endStaffChat: (chatId: string) => {
    return axiosClient.post<{
      status: number
      message: string
      data: Chat
    }>(`/chats/${chatId}/end-staff-chat`)
  },

  getChatStatus: (chatId: string) => {
    return axiosClient.get<{
      status: number
      message: string
      data: {
        id: string
        chatMode: "AI" | "WAITING_STAFF" | "STAFF_CONNECTED"
        assignedStaffId: string | null
        assignedStaffName?: string
        staffRequestedAt?: string
        isWaitingForStaff: boolean
        isStaffConnected: boolean
      }
    }>(`/chats/${chatId}/status`)
  },
}
