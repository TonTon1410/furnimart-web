import axiosClient from "./axiosClient";

export type MessageType = "TEXT" | "IMAGE" | "FILE";
export type MessageStatus = "ACTIVE" | "DELETED";

export interface ChatMessage {
  id: string;
  content: string;
  type: MessageType;
  status: MessageStatus;
  chatId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  replyToMessageId?: string;
  replyToContent?: string;
  attachmentUrl?: string;
  attachmentType?: string;
  isEdited: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SendMessageRequest {
  content: string;
  chatId: string;
  type?: MessageType;
  replyToMessageId?: string;
  attachmentUrl?: string;
  attachmentType?: string;
}

class ChatService {
  // Send message
  async sendMessage(request: SendMessageRequest): Promise<ChatMessage> {
    const response = await axiosClient.post("/chat-messages", request);
    return response.data.data;
  }

  // Get messages by chatId
  async getChatMessages(chatId: string): Promise<ChatMessage[]> {
    const response = await axiosClient.get(`/chat-messages/chat/${chatId}`);
    return response.data.data;
  }

  // Get message by ID
  async getMessageById(id: string): Promise<ChatMessage> {
    const response = await axiosClient.get(`/chat-messages/${id}`);
    return response.data.data;
  }

  // Edit message
  async editMessage(id: string, content: string): Promise<ChatMessage> {
    const response = await axiosClient.put(
      `/chat-messages/${id}?content=${encodeURIComponent(content)}`
    );
    return response.data.data;
  }

  // Delete message
  async deleteMessage(id: string): Promise<void> {
    await axiosClient.delete(`/chat-messages/${id}`);
  }

  // Mark message as read
  async markAsRead(id: string): Promise<void> {
    await axiosClient.post(`/chat-messages/${id}/read`);
  }

  // Get unread messages
  async getUnreadMessages(chatId: string): Promise<ChatMessage[]> {
    const response = await axiosClient.get(
      `/chat-messages/chat/${chatId}/unread`
    );
    return response.data.data;
  }

  // Search messages in chat
  async searchMessages(
    chatId: string,
    searchTerm: string
  ): Promise<ChatMessage[]> {
    const response = await axiosClient.get(
      `/chat-messages/chat/${chatId}/search?searchTerm=${encodeURIComponent(
        searchTerm
      )}`
    );
    return response.data.data;
  }

  // Get message replies
  async getMessageReplies(id: string): Promise<ChatMessage[]> {
    const response = await axiosClient.get(`/chat-messages/${id}/replies`);
    return response.data.data;
  }
}

export const chatService = new ChatService();
export default chatService;
