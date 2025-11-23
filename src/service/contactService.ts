import axiosClient from "./axiosClient"

export interface Chat {
  id: string
  name: string
  participants: any[]
  lastMessage?: any
  unreadCount?: number
}

export interface Message {
  id: string
  content: string
  senderId: string
  createdAt: string
}

export const contactService = {
  // Lấy danh sách chat của user (có phân trang)
  getChats: (page = 0, size = 10) => {
    return axiosClient.get(`/api/chats/paginated?page=${page}&size=${size}`)
  },

  // Lấy tin nhắn của một chat (có phân trang)
  getMessages: (chatId: string, page = 0, size = 20) => {
    return axiosClient.get(`/api/chat-messages/chat/${chatId}/paginated?page=${page}&size=${size}`)
  },

  // Gửi tin nhắn
  sendMessage: (chatId: string, content: string) => {
    return axiosClient.post("/api/chat-messages", {
      chatId,
      content,
      type: "TEXT",
    })
  },

  // Tạo/Lấy chat riêng với user (VD: Staff hoặc AI)
  getPrivateChat: (userId: string) => {
    return axiosClient.post(`/api/chats/private/${userId}`)
  },
}
