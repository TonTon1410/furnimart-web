"use client"

import { useState, useEffect, useCallback } from "react"
import useSWR from "swr"
import { ChatList } from "@/components/chat/ChatList"
import { ChatDetail } from "@/components/chat/ChatDetail"
import { ChatEmptyState } from "@/components/chat/chatEmptyState"
import { chatApi, messageApi, type Chat, type ChatMessage, MOCK_CHATS } from "@/service/chatApi"

export default function ChatManagementPage() {
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [sendingMessage, setSendingMessage] = useState(false)
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null)

  // Mock current user ID - thay thế bằng auth thực tế
  const currentUserId = "current-staff-id"

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const {
    data: chats = MOCK_CHATS,
    error: chatsError,
    isLoading: chatsLoading,
    mutate: mutateChats,
  } = useSWR("chats", () => chatApi.getChats(), {
    refreshInterval: 10000,
    fallbackData: MOCK_CHATS,
    onError: (err) => {
      console.warn("Failed to fetch chats, using mock data:", err)
    },
  })

  // Fetch messages khi chọn chat
  const fetchMessages = useCallback(async (chatId: string) => {
    setMessagesLoading(true)
    try {
      const data = await messageApi.getMessages(chatId)
      setMessages(data)
      await chatApi.markAsRead(chatId)
    } catch (err) {
      console.warn("Failed to fetch messages:", err)
    } finally {
      setMessagesLoading(false)
    }
  }, [])

  useEffect(() => {
    if (selectedChat) {
      fetchMessages(selectedChat.id)
    }
  }, [selectedChat, fetchMessages])

  // Handlers
  const handleSelectChat = (chat: Chat) => {
    setSelectedChat(chat)
  }

  const handleSearchChats = async (query: string) => {
    setSearchQuery(query)
    if (query.trim()) {
      try {
        const results = await chatApi.searchChats(query)
        mutateChats(results, false)
      } catch (err) {
        console.warn("Search failed:", err)
      }
    } else {
      mutateChats()
    }
  }

  const handleDeleteChat = async (chatId: string) => {
    try {
      await chatApi.deleteChat(chatId)
      mutateChats((prev) => prev?.filter((c) => c.id !== chatId), false)
      if (selectedChat?.id === chatId) {
        setSelectedChat(null)
        setMessages([])
      }
      showToast("Đã xóa cuộc trò chuyện")
    } catch (err) {
      console.warn("Delete failed:", err)
      showToast("Không thể xóa cuộc trò chuyện", "error")
    }
  }

  const handleTogglePin = async (chatId: string) => {
    try {
      const updated = await chatApi.togglePin(chatId)
      mutateChats((prev) => prev?.map((c) => (c.id === chatId ? updated : c)), false)
    } catch (err) {
      console.warn("Toggle pin failed:", err)
    }
  }

  const handleToggleMute = async (chatId: string) => {
    try {
      const updated = await chatApi.toggleMute(chatId)
      mutateChats((prev) => prev?.map((c) => (c.id === chatId ? updated : c)), false)
    } catch (err) {
      console.warn("Toggle mute failed:", err)
    }
  }

  const handleSendMessage = async (content: string) => {
    if (!selectedChat) return
    setSendingMessage(true)
    try {
      const newMessage = await messageApi.sendMessage({
        chatId: selectedChat.id,
        content,
      })
      setMessages((prev) => [...prev, newMessage])
      mutateChats()
    } catch (err) {
      console.warn("Send message failed:", err)
      showToast("Không thể gửi tin nhắn", "error")
    } finally {
      setSendingMessage(false)
    }
  }

  const handleEditMessage = async (messageId: string, content: string) => {
    try {
      const updated = await messageApi.editMessage(messageId, content)
      setMessages((prev) => prev.map((m) => (m.id === messageId ? updated : m)))
      showToast("Đã sửa tin nhắn")
    } catch (err) {
      console.warn("Edit message failed:", err)
      showToast("Không thể sửa tin nhắn", "error")
    }
  }

  const handleDeleteMessage = async (messageId: string) => {
    try {
      await messageApi.deleteMessage(messageId)
      setMessages((prev) => prev.filter((m) => m.id !== messageId))
      showToast("Đã xóa tin nhắn")
    } catch (err) {
      console.warn("Delete message failed:", err)
      showToast("Không thể xóa tin nhắn", "error")
    }
  }

  const handleSearchMessages = async (query: string) => {
    if (!selectedChat) return
    if (query.trim()) {
      try {
        const results = await messageApi.searchMessages(selectedChat.id, query)
        setMessages(results)
      } catch (err) {
        console.warn("Search messages failed:", err)
      }
    } else {
      fetchMessages(selectedChat.id)
    }
  }

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-950">
      {/* Sidebar - Chat List */}
      <div className="w-[380px] shrink-0">
        <ChatList
          chats={chats}
          selectedChatId={selectedChat?.id || null}
          onSelectChat={handleSelectChat}
          onDeleteChat={handleDeleteChat}
          onTogglePin={handleTogglePin}
          onToggleMute={handleToggleMute}
          onSearch={handleSearchChats}
          loading={chatsLoading}
        />
      </div>

      {/* Main - Chat Detail */}
      <div className="flex-1 relative">
        {selectedChat ? (
          <ChatDetail
            chat={selectedChat}
            messages={messages}
            currentUserId={currentUserId}
            onSendMessage={handleSendMessage}
            onEditMessage={handleEditMessage}
            onDeleteMessage={handleDeleteMessage}
            onSearchMessages={handleSearchMessages}
            loading={messagesLoading}
            sendingMessage={sendingMessage}
          />
        ) : (
          <ChatEmptyState />
        )}
      </div>

      {toast && (
        <div
          className={`fixed bottom-4 right-4 px-4 py-3 rounded-lg shadow-lg text-white text-sm z-50 ${
            toast.type === "success" ? "bg-green-600" : "bg-red-600"
          }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  )
}
