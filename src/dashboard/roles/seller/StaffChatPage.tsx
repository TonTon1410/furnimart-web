/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
"use client"

import { useState, useEffect } from "react"
import { useToast } from "@/context/ToastContext"
import { useConfirm } from "@/context/ConfirmContext";
import { chatService } from "@/service/chatService"
import { authService } from "@/service/authService"
import { Search, ArrowLeft } from "lucide-react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { webSocketService } from "@/service/websocketService"
import { useWebSocketStore } from "@/store/useWebSocketStore";

// Import Types
import type { ChatSession } from "@/types/chat"

// Import Components
import { ChatList } from "@/components/chat/ChatList"
import { ChatDetail } from "@/components/chat/ChatDetail"
import { ChatEmptyState } from "@/components/chat/chatEmptyState"

export default function StaffChatPage() {
  const { showToast } = useToast()
  const confirm = useConfirm();
  const queryClient = useQueryClient()
  const currentUserId = authService.getUserId() || ""
  const { isConnected } = useWebSocketStore();

  // State local
  const [selectedChat, setSelectedChat] = useState<ChatSession | null>(null)
  const [searchChatQuery, setSearchChatQuery] = useState("")
  const [isSearchingMessage, setIsSearchingMessage] = useState(false)
  const [processingAction, setProcessingAction] = useState(false)

  // 1. Query danh sách chat
  const { data: chats = [], isLoading: loadingChats } = useQuery({
    queryKey: ["staff-chats"],
    queryFn: async () => {
      const [waitingRes, myChatsRes] = await Promise.all([
        chatService.getWaitingChats(),
        chatService.getUserChats()
      ]);
      const waitingChats = waitingRes.data || [];
      const myChats = myChatsRes.data || [];
      const waitingIds = new Set(waitingChats.map(c => c.id));
      const filteredMyChats = myChats.filter(c => !waitingIds.has(c.id));
      const rawMergedChats = [...waitingChats, ...filteredMyChats];

      return rawMergedChats.map(chat => {
        let displayName = chat.name;
        const isGenericName = !chat.name || chat.name.toLowerCase().includes("chat hỗ trợ");
        if (isGenericName) {
          if (chat.createdByName) displayName = chat.createdByName;
          else if (chat.participants && chat.participants.length > 0) {
            const customer = chat.participants.find((p: any) => p.userId && !p.employeeId);
            if (customer && customer.userName) displayName = customer.userName;
          }
        }
        return { ...chat, name: displayName };
      });
    },
    refetchInterval: isConnected ? false : 5000,
  });

  // 2. Query tin nhắn
  const { data: messages = [], isLoading: loadingMessages } = useQuery({
    queryKey: ["chat-messages", selectedChat?.id],
    queryFn: async () => {
      if (!selectedChat?.id) return [];
      const res = await chatService.getMessages(selectedChat.id);
      return res.data || [];
    },
    enabled: !!selectedChat?.id,
    refetchInterval: isConnected ? false : 3000,
  });

  // Đồng bộ selectedChat khi chats update
  useEffect(() => {
    if (selectedChat) {
      const updated = chats.find((c: any) => c.id === selectedChat.id);
      if (updated && updated.chatMode !== selectedChat.chatMode) {
        setSelectedChat(prev => prev ? { ...prev, ...updated } : null);
      }
    }
  }, [chats, selectedChat?.id]);

  // 3. WebSocket integration
  useEffect(() => {
    webSocketService.connect();

    const unsubscribe = webSocketService.subscribe((data) => {
      // Giả sử backend gửi message có chatId
      if (data.chatId) {
        // Refresh tin nhắn nếu đang mở chat đó
        if (selectedChat?.id === data.chatId) {
          queryClient.invalidateQueries({ queryKey: ["chat-messages", data.chatId] });
        }
        // Luôn refresh danh sách chat để update tin nhắn cuối/unread count
        queryClient.invalidateQueries({ queryKey: ["staff-chats"] });
      } else if (data.type === 'CHAT_UPDATE' || data.type === 'NEW_CHAT') {
        queryClient.invalidateQueries({ queryKey: ["staff-chats"] });
      }
    });

    return () => {
      unsubscribe();
      // Ta có thể chọn không disconnect WS nếu muốn giữ kết nối toàn khung ứng dụng
      // Nhưng ở đây component chat page unmount thì tạm thời ngắt hoặc cứ để chạy ngầm phụ thuộc app logic.
      // webSocketService.disconnect(); 
    };
  }, [selectedChat?.id, queryClient]);

  // ========================================================================
  // ACTIONS
  // ========================================================================

  const handleSelectChat = async (chat: ChatSession) => {
    setSelectedChat(chat)
    setIsSearchingMessage(false)
    if (chat.unreadCount > 0) {
      try {
        await chatService.markChatAsRead(chat.id)
        queryClient.invalidateQueries({ queryKey: ["staff-chats"] })
      } catch (err) { console.error(err) }
    }
  }

  const handleBackToList = () => { setSelectedChat(null); }

  const handleSendMessage = async (content: string) => {
    if (!selectedChat || !content.trim()) return
    try {
      await chatService.sendMessage({ chatId: selectedChat.id, content: content, type: "TEXT" })
      queryClient.invalidateQueries({ queryKey: ["chat-messages", selectedChat.id] })
    } catch (error) { showToast({ type: "error", title: "Lỗi gửi tin nhắn" }) }
  }

  const handleAcceptStaff = async () => {
    if (!selectedChat) return
    setProcessingAction(true)
    try {
      await chatService.acceptStaff(selectedChat.id)
      showToast({ type: "success", title: "Đã tiếp nhận" })
      queryClient.invalidateQueries({ queryKey: ["staff-chats"] })
    } catch (error) { showToast({ type: "error", title: "Lỗi tiếp nhận" }) }
    finally { setProcessingAction(false) }
  }

  const handleEndStaffChat = async () => {
    const isConfirmed = await confirm({
      title: "Kết thúc hỗ trợ",
      message: "Bạn có chắc chắn muốn kết thúc phiên hỗ trợ này?",
      confirmLabel: "Kết thúc",
      variant: "warning"
    });

    if (!selectedChat || !isConfirmed) return
    setProcessingAction(true)
    try {
      await chatService.endStaffChat(selectedChat.id)
      showToast({ type: "success", title: "Đã kết thúc" })
      queryClient.invalidateQueries({ queryKey: ["staff-chats"] })
    } catch (error) { showToast({ type: "error", title: "Lỗi kết thúc" }) }
    finally { setProcessingAction(false) }
  }

  const handleTogglePin = async (chatId: string) => {
    const chat = chats.find((c: any) => c.id === chatId);
    if (!chat) return;
    try {
      await chatService.pinChat(chatId, !chat.isPinned);
      queryClient.invalidateQueries({ queryKey: ["staff-chats"] });
    } catch (e) { console.error(e) }
  }

  const handleToggleMute = async (chatId: string) => {
    const chat = chats.find((c: any) => c.id === chatId);
    if (!chat) return;
    try {
      await chatService.muteChat(chatId, !chat.isMuted);
      queryClient.invalidateQueries({ queryKey: ["staff-chats"] });
    } catch (e) { console.error(e) }
  }

  const handleDeleteChat = async (chatId: string) => {
    const isConfirmed = await confirm({
      title: "Xoá đoạn chat",
      message: "Bạn có chắc chắn muốn xoá đoạn chat này?",
      confirmLabel: "Xoá",
      variant: "danger"
    });

    if (!isConfirmed) return;
    try {
      await chatService.deleteChat(chatId);
      queryClient.invalidateQueries({ queryKey: ["staff-chats"] });
      if (selectedChat?.id === chatId) setSelectedChat(null);
    } catch (e) { console.error(e) }
  }

  const handleDeleteMessage = async (msgId: string) => {
    try {
      await chatService.deleteMessage(msgId);
      queryClient.invalidateQueries({ queryKey: ["chat-messages", selectedChat?.id] });
    } catch (e) { console.error(e) }
  }

  const handleEditMessage = async (msgId: string, content: string) => {
    try {
      await chatService.editMessage(msgId, content);
      queryClient.invalidateQueries({ queryKey: ["chat-messages", selectedChat?.id] });
    } catch (e) { console.error(e) }
  }

  const handleSearchMessages = async (q: string) => {
    if (!selectedChat) return;
    if (!q.trim()) {
      queryClient.invalidateQueries({ queryKey: ["chat-messages", selectedChat.id] });
      return;
    }
    try {
      const res = await chatService.searchMessages(selectedChat.id, q);
      if (res.data) queryClient.setQueryData(["chat-messages", selectedChat.id], res.data);
    } catch (e) {
      console.error(e)
    }
  }

  const filteredChats = chats.filter((chat: any) => chat.name?.toLowerCase().includes(searchChatQuery.toLowerCase()))

  return (
    // THAY ĐỔI: Sử dụng h-full và w-full. Layout cha đã lo việc fix chiều cao.
    <div className="flex h-full w-full bg-white dark:bg-gray-950 relative overflow-hidden border-t border-gray-200 dark:border-gray-800">

      {/* 1. LEFT SIDEBAR */}
      <div className={`
flex - col border - r border - gray - 200 dark: border - gray - 800 h - full overflow - hidden shrink - 0 bg - white z - 10
w - full md: w - 80 lg: w - 96 
          ${selectedChat ? 'hidden md:flex' : 'flex'}
`}>
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

      {/* 2. RIGHT PANEL */}
      <div className={`
flex - 1 flex - col h - full min - w - 0 bg - white relative overflow - hidden
          ${!selectedChat ? 'hidden md:flex' : 'flex'}
`}>
        {selectedChat ? (
          <>
            {/* HEADER CỐ ĐỊNH: shrink-0 để không bị nén */}
            <div className="min-h-16 py-2 px-3 border-b border-gray-200 flex items-center justify-between bg-white shadow-sm z-20 shrink-0 gap-2">

              <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
                <button onClick={handleBackToList} className="md:hidden p-1 -ml-1 text-gray-600 hover:bg-gray-100 rounded-full">
                  <ArrowLeft className="w-6 h-6" />
                </button>

                <div className="w-10 h-10 rounded-full bg-linear-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg shadow-sm shrink-0">
                  {selectedChat.name?.charAt(0).toUpperCase() || "U"}
                </div>

                <div className="flex flex-col justify-center min-w-0">
                  <h3 className="font-bold text-gray-900 text-[15px] leading-tight truncate pr-2">
                    {selectedChat.name}
                  </h3>
                  <div className="truncate">
                    {selectedChat.chatMode === 'WAITING_STAFF' ? (
                      <span className="text-xs text-yellow-600 font-medium flex items-center gap-1"><span className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-pulse"></span> Đang chờ</span>
                    ) : selectedChat.chatMode === 'STAFF_CONNECTED' ? (
                      <span className="text-xs text-green-600 font-medium flex items-center gap-1"><span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span> Hoạt động</span>
                    ) : <span className="text-xs text-gray-400">Trợ lý AI</span>}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => setIsSearchingMessage(!isSearchingMessage)} className={`p - 2 rounded - full transition - colors ${isSearchingMessage ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100 text-gray-500'} `}>
                  <Search className="w-5 h-5" />
                </button>

                {selectedChat.chatMode === 'WAITING_STAFF' && (
                  <button onClick={handleAcceptStaff} disabled={processingAction} className="ml-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-full text-sm font-semibold shadow-sm whitespace-nowrap">
                    {processingAction ? "..." : "Tiếp nhận"}
                  </button>
                )}
                {selectedChat.chatMode === 'STAFF_CONNECTED' && (
                  <button onClick={handleEndStaffChat} disabled={processingAction} className="ml-1 bg-gray-100 hover:bg-red-50 text-gray-700 hover:text-red-600 px-3 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap border border-gray-200 hover:border-red-100">
                    Kết thúc
                  </button>
                )}
              </div>
            </div>

            {/* CHAT BODY - Tự động giãn nở và scroll */}
            <div className="flex-1 flex flex-col min-h-0 relative w-full overflow-hidden">
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
                showSearchBar={isSearchingMessage}
                onCloseSearch={() => setIsSearchingMessage(false)}
              />
            </div>
          </>
        ) : (
          <ChatEmptyState />
        )}
      </div>
    </div>
  )
}