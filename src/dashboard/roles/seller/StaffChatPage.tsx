/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useToast } from "@/context/ToastContext"
import { chatService } from "@/service/chatService"
import { authService } from "@/service/authService"

// Import Types
import type { ChatSession, ChatMessage } from "@/types/chat"

// Import Components
import { ChatList } from "@/components/chat/ChatList"
import { ChatDetail } from "@/components/chat/ChatDetail"
import { ChatEmptyState } from "@/components/chat/chatEmptyState"
import { StaffActions } from "@/components/chat/StaffAction" 

export default function StaffChatPage() {
  const { showToast } = useToast()
  
  // State dữ liệu
  const [chats, setChats] = useState<ChatSession[]>([])
  const [selectedChat, setSelectedChat] = useState<ChatSession | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  
  // State trạng thái
  const [loadingChats, setLoadingChats] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [processingAction, setProcessingAction] = useState(false) 
  
  // State tìm kiếm
  const [searchChatQuery, setSearchChatQuery] = useState("") // Tìm chat ở sidebar
  const [isSearchingMessage, setIsSearchingMessage] = useState(false) // Trạng thái đang tìm tin nhắn

  // Refs cho Polling
  const pollChatsInterval = useRef<NodeJS.Timeout | null>(null)
  const pollMessagesInterval = useRef<NodeJS.Timeout | null>(null)
  
  const currentUserId = authService.getUserId() || ""

  // ========================================================================
  // 1. DATA FETCHING & POLLING
  // ========================================================================

  const fetchChats = useCallback(async () => {
    try {
      // [NEW] Load cả Waiting Chats (hàng chờ) và User Chats (đang phụ trách)
      const [waitingRes, myChatsRes] = await Promise.all([
          chatService.getWaitingChats(),
          chatService.getUserChats()
      ]);

      const waitingChats = waitingRes.data || [];
      const myChats = myChatsRes.data || [];

      // Merge 2 danh sách. Chú ý loại bỏ trùng lặp nếu backend có trả về trùng (dựa vào id)
      // Ưu tiên myChats để đảm bảo thông tin chính xác nhất về trạng thái
      const waitingIds = new Set(waitingChats.map(c => c.id));
      const filteredMyChats = myChats.filter(c => !waitingIds.has(c.id));
      
      const mergedChats = [...waitingChats, ...filteredMyChats];

      setChats(mergedChats);
    } catch (error) {
      console.error("Lỗi tải danh sách chat", error)
    } finally {
      setLoadingChats(false)
    }
  }, [])

  const fetchMessages = useCallback(async (chatId: string) => {
    // Nếu đang trong chế độ tìm kiếm tin nhắn thì KHÔNG fetch đè
    if (isSearchingMessage) return;

    try {
      const res = await chatService.getMessages(chatId)
      if (res.data) {
        setMessages(res.data)
      }
    } catch (error) {
      console.error("Lỗi tải tin nhắn", error)
    } finally {
      setLoadingMessages(false)
    }
  }, [isSearchingMessage])

  // Polling danh sách chat (Mỗi 5s)
  useEffect(() => {
    fetchChats() 
    pollChatsInterval.current = setInterval(fetchChats, 5000)
    return () => {
      if (pollChatsInterval.current) clearInterval(pollChatsInterval.current)
    }
  }, [fetchChats])

  // Polling tin nhắn (Mỗi 3s)
  useEffect(() => {
    if (pollMessagesInterval.current) clearInterval(pollMessagesInterval.current)

    if (selectedChat) {
      // Chỉ polling khi KHÔNG tìm kiếm
      if (!isSearchingMessage) {
        setLoadingMessages(true)
        fetchMessages(selectedChat.id)

        pollMessagesInterval.current = setInterval(() => {
          fetchMessages(selectedChat.id)
        }, 3000)
      }
    } else {
      setMessages([])
    }

    return () => {
      if (pollMessagesInterval.current) clearInterval(pollMessagesInterval.current)
    }
  }, [selectedChat, fetchMessages, isSearchingMessage])

  // ========================================================================
  // 2. LOGIC TƯƠNG TÁC CƠ BẢN
  // ========================================================================

  const handleSelectChat = async (chat: ChatSession) => {
    setSelectedChat(chat)
    setIsSearchingMessage(false) // Reset trạng thái tìm kiếm khi đổi chat
    
    // Đánh dấu đã đọc
    if (chat.unreadCount > 0) {
      try {
        await chatService.markChatAsRead(chat.id)
        // Update local state đơn giản
        setChats(prev => prev.map(c => c.id === chat.id ? { ...c, unreadCount: 0 } : c))
      } catch (err) {
        console.error(err)
      }
    }
  }

  const handleSendMessage = async (content: string) => {
    if (!selectedChat || !content.trim()) return

    try {
      await chatService.sendMessage({
        chatId: selectedChat.id,
        content: content,
        type: "TEXT"
      })
      if (isSearchingMessage) setIsSearchingMessage(false);
      fetchMessages(selectedChat.id)
    } catch (error) {
      showToast({ type: "error", title: "Gửi tin nhắn thất bại" + error })
    }
  }

  // ========================================================================
  // 3. LOGIC XỬ LÝ API MỚI
  // ========================================================================

  // --- Chat Actions (Sidebar) ---

  const handleTogglePin = async (chatId: string) => {
    const chat = chats.find(c => c.id === chatId)
    if (!chat) return
    const newStatus = !chat.isPinned
    try {
      await chatService.pinChat(chatId, newStatus)
      setChats(prev => prev.map(c => c.id === chatId ? { ...c, isPinned: newStatus } : c))
      showToast({ type: "success", title: newStatus ? "Đã ghim đoạn chat" : "Đã bỏ ghim" })
    } catch (error) {
      showToast({ type: "error", title: "Lỗi khi ghim đoạn chat" + error })
    }
  }

  const handleToggleMute = async (chatId: string) => {
    const chat = chats.find(c => c.id === chatId)
    if (!chat) return
    const newStatus = !chat.isMuted
    try {
      await chatService.muteChat(chatId, newStatus)
      setChats(prev => prev.map(c => c.id === chatId ? { ...c, isMuted: newStatus } : c))
      showToast({ type: "success", title: newStatus ? "Đã tắt thông báo" : "Đã bật thông báo" })
    } catch (error) {
      showToast({ type: "error", title: "Lỗi thao tác mute" + error })
    }
  }

  const handleDeleteChat = async (chatId: string) => {
    if (!window.confirm("Bạn có chắc muốn xóa đoạn chat này? Hành động không thể hoàn tác.")) return
    try {
      await chatService.deleteChat(chatId)
      setChats(prev => prev.filter(c => c.id !== chatId))
      if (selectedChat?.id === chatId) setSelectedChat(null)
      showToast({ type: "success", title: "Đã xóa đoạn chat" })
    } catch (error) {
      showToast({ type: "error", title: "Không thể xóa đoạn chat" + error })
    }
  }

  // --- Message Actions (Chat Detail) ---

  const handleDeleteMessage = async (messageId: string) => {
    if (!confirm("Xóa tin nhắn này?")) return
    try {
      await chatService.deleteMessage(messageId)
      setMessages(prev => prev.filter(m => m.id !== messageId))
    } catch (error) {
      showToast({ type: "error", title: "Lỗi khi xóa tin nhắn" + error })
    }
  }

  const handleEditMessage = async (messageId: string, newContent: string) => {
    try {
      const res = await chatService.editMessage(messageId, newContent)
      if (res.data) {
        setMessages(prev => prev.map(m => m.id === messageId ? res.data : m))
        showToast({ type: "success", title: "Đã sửa tin nhắn" })
      }
    } catch (error) {
      showToast({ type: "error", title: "Lỗi khi sửa tin nhắn" + error })
    }
  }

  const handleSearchMessages = async (query: string) => {
    if (!selectedChat) return
    if (!query.trim()) {
      setIsSearchingMessage(false)
      setLoadingMessages(true)
      fetchMessages(selectedChat.id)
      return
    }
    setIsSearchingMessage(true)
    setLoadingMessages(true)
    try {
      const res = await chatService.searchMessages(selectedChat.id, query)
      if (res.data) {
        setMessages(res.data)
      } else {
        setMessages([])
      }
    } catch (error) {
      showToast({ type: "error", title: "Tìm kiếm thất bại" + error })
    } finally {
      setLoadingMessages(false)
    }
  }

  // --- Staff Operations (Pickup / End) ---

  const handleAcceptStaff = async () => {
    if (!selectedChat) return
    setProcessingAction(true)
    try {
      await chatService.acceptStaff(selectedChat.id)
      showToast({ type: "success", title: "Đã kết nối với khách hàng" })
      
      // [QUAN TRỌNG]: Backend có thể merge chat cũ và xóa chat tạm hiện tại.
      // ID của chat có thể thay đổi. Do đó, cần:
      // 1. Reset selected chat tạm thời
      setSelectedChat(null);
      // 2. Fetch lại toàn bộ danh sách để lấy ID đúng
      await fetchChats();
      // NOTE: UX tốt hơn là tự tìm lại chat vừa merge để select, nhưng ID đã đổi.
      // Tạm thời user sẽ chọn lại từ danh sách (đã được update)
    } catch (error) {
      showToast({ type: "error", title: "Lỗi kết nối" + error })
    } finally {
      setProcessingAction(false)
    }
  }

  const handleEndStaffChat = async () => {
    if (!selectedChat) return
    if (!window.confirm("Kết thúc phiên hỗ trợ này?")) return

    setProcessingAction(true)
    try {
      await chatService.endStaffChat(selectedChat.id)
      showToast({ type: "success", title: "Đã kết thúc phiên" })
      await fetchChats()
      // Update local UI
      setSelectedChat(prev => prev ? { 
          ...prev, 
          chatMode: "AI", // Hoặc trạng thái nào đó backend trả về
          assignedStaffId: null 
      } : null)
    } catch (error) {
      showToast({ type: "error", title: "Lỗi kết thúc phiên" + error })
    } finally {
      setProcessingAction(false)
    }
  }

  // Filter danh sách chat ở sidebar
  const filteredChats = chats.filter(chat => 
    chat.name?.toLowerCase().includes(searchChatQuery.toLowerCase()) || 
    chat.lastMessage?.content.toLowerCase().includes(searchChatQuery.toLowerCase())
  )

  // ========================================================================
  // 4. RENDER
  // ========================================================================

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-white dark:bg-gray-950 border-t">
      {/* LEFT SIDEBAR */}
      <div className="w-80 md:w-96 flex flex-col border-r border-gray-200 dark:border-gray-800">
        <ChatList
          chats={filteredChats}
          selectedChatId={selectedChat?.id || null}
          onSelectChat={handleSelectChat}
          onSearch={setSearchChatQuery}
          loading={loadingChats}
          onDeleteChat={handleDeleteChat}
          onTogglePin={handleTogglePin}
          onToggleMute={handleToggleMute}
        />
      </div>

      {/* RIGHT PANEL */}
      <div className="flex-1 flex flex-col min-w-0">
        {selectedChat ? (
          <>
             {/* Staff Action Bar */}
             <StaffActions 
                staffMode={selectedChat.chatMode as any}
                loading={processingAction}
                onRequestStaff={() => {}} 
                onEndStaffChat={handleEndStaffChat}
             />
             
             {/* Nút Accept thủ công nếu cần */}
             {selectedChat.chatMode === 'WAITING_STAFF' && (
                <div className="bg-yellow-50 p-2 flex justify-between items-center px-4 border-b border-yellow-100 animate-in fade-in slide-in-from-top-2">
                    <span className="text-sm text-yellow-800 flex items-center gap-2">
                        <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></span>
                        Khách hàng đang đợi hỗ trợ...
                    </span>
                    <button 
                        onClick={handleAcceptStaff}
                        disabled={processingAction}
                        className="bg-green-600 text-white px-4 py-1.5 rounded-md text-sm hover:bg-green-700 disabled:opacity-50 font-medium transition-colors shadow-sm"
                    >
                        {processingAction ? "Đang xử lý..." : "Tiếp nhận ngay"}
                    </button>
                </div>
             )}

            <ChatDetail
              chat={selectedChat}
              messages={messages}
              currentUserId={currentUserId}
              onSendMessage={handleSendMessage}
              loading={loadingMessages}
              onEditMessage={handleEditMessage}
              onDeleteMessage={handleDeleteMessage}
              onSearchMessages={handleSearchMessages}
              hasMore={false} 
            />
          </>
        ) : (
          <ChatEmptyState />
        )}
      </div>
    </div>
  )
}