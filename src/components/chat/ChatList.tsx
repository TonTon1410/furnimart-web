"use client"

import { useState, useRef, useEffect } from "react"
import { formatDistanceToNow } from "date-fns"
import { vi } from "date-fns/locale"
import {
  MessageCircle,
  Search,
  Pin,
  BellOff,
  Bot,
  Users,
  Clock,
  CheckCircle2,
  MoreVertical,
  Trash2,
} from "lucide-react"
import type { ChatSession } from "@/types/chat"

interface ChatListProps {
  chats: ChatSession[]
  selectedChatId: string | null
  onSelectChat: (chat: ChatSession) => void
  onDeleteChat: (chatId: string) => void
  onTogglePin: (chatId: string) => void
  onToggleMute: (chatId: string) => void
  onSearch: (query: string) => void
  loading?: boolean
}

function ChatItemDropdown({
  chat,
  onTogglePin,
  onToggleMute,
  onDeleteChat,
}: {
  chat: ChatSession
  onTogglePin: (id: string) => void
  onToggleMute: (id: string) => void
  onDeleteChat: (id: string) => void
}) {
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <div ref={dropdownRef} className="relative">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          setOpen(!open)
        }}
        className="p-1.5 rounded-md hover:bg-gray-100 transition-colors"
      >
        <MoreVertical className="w-4 h-4 text-gray-500" />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onTogglePin(chat.id)
              setOpen(false)
            }}
            className="w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-gray-100"
          >
            <Pin className="w-4 h-4" /> {chat.isPinned ? "Bỏ ghim" : "Ghim"}
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onToggleMute(chat.id)
              setOpen(false)
            }}
            className="w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-gray-100"
          >
            <BellOff className="w-4 h-4" /> {chat.isMuted ? "Bật thông báo" : "Tắt thông báo"}
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onDeleteChat(chat.id)
              setOpen(false)
            }}
            className="w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-gray-100 text-red-600"
          >
            <Trash2 className="w-4 h-4" /> Xóa
          </button>
        </div>
      )}
    </div>
  )
}

export function ChatList({
  chats,
  selectedChatId,
  onSelectChat,
  onDeleteChat,
  onTogglePin,
  onToggleMute,
  onSearch,
  loading,
}: ChatListProps) {
  const [searchQuery, setSearchQuery] = useState("")

  const handleSearch = (value: string) => {
    setSearchQuery(value)
    onSearch(value)
  }

  const getChatModeIcon = (mode: string | undefined) => {
    switch (mode) {
      case "AI": return <Bot className="w-4 h-4 text-blue-500" />
      case "WAITING_STAFF": return <Clock className="w-4 h-4 text-yellow-500" />
      case "STAFF_CONNECTED": return <CheckCircle2 className="w-4 h-4 text-green-500" />
      default: return <Users className="w-4 h-4 text-gray-500" />
    }
  }

  const getChatModeBadge = (mode: string | undefined) => {
    switch (mode) {
      case "AI": return <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-700">AI</span>
      case "WAITING_STAFF": return <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-yellow-100 text-yellow-700">Đang chờ</span>
      case "STAFF_CONNECTED": return <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-700">Đã kết nối</span>
      default: return null
    }
  }

  const sortedChats = [...chats].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1
    if (!a.isPinned && b.isPinned) return 1
    const aTime = a.lastMessage?.createdAt || a.createdAt || new Date().toISOString()
    const bTime = b.lastMessage?.createdAt || b.createdAt || new Date().toISOString()
    return new Date(bTime).getTime() - new Date(aTime).getTime()
  })

  return (
    // THAY ĐỔI 1: Thêm overflow-hidden vào container cha
    <div className="flex flex-col h-full bg-white dark:bg-gray-950 overflow-hidden">
      
      {/* 1. HEADER (Fixed) */}
      {/* shrink-0 đảm bảo nó không bị co lại, z-10 để nổi lên trên khi list cuộn */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-800 shrink-0 bg-white dark:bg-gray-950 z-10">
        <h2 className="text-lg font-semibold flex items-center gap-2 mb-3 text-gray-900 dark:text-gray-100">
          <MessageCircle className="w-5 h-5" /> Quản lý Chat
        </h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm kiếm..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* 2. LIST (Scrollable) */}
      {/* THAY ĐỔI 2: Thêm min-h-0 để kích hoạt cuộn trong flex container */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full" />
          </div>
        ) : sortedChats.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-gray-500">
            <MessageCircle className="w-8 h-8 mb-2 opacity-50" />
            <p className="text-sm">Trống</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {sortedChats.map((chat) => (
              <div
                key={chat.id}
                className={`relative flex items-start gap-3 p-4 cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-900 ${
                  selectedChatId === chat.id ? "bg-blue-50 dark:bg-blue-900/20" : ""
                }`}
                onClick={() => onSelectChat(chat)}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                  chat.type === "GROUP" ? "bg-purple-100 text-purple-600" : "bg-blue-100 text-blue-600"
                }`}>
                  {chat.type === "GROUP" ? <Users className="w-5 h-5" /> : getChatModeIcon(chat.chatMode)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {chat.isPinned && <Pin className="w-3 h-3 text-blue-500" />}
                    <span className="font-medium truncate text-gray-900 dark:text-gray-100 text-sm">
                      {chat.name || "Khách hàng"}
                    </span>
                    {getChatModeBadge(chat.chatMode)}
                  </div>
                  <p className="text-xs text-gray-500 truncate mt-1">
                    {chat.lastMessage?.content || "..."}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-gray-400">
                      {chat.lastMessage?.createdAt
                        ? formatDistanceToNow(new Date(chat.lastMessage.createdAt), { addSuffix: true, locale: vi })
                        : ""}
                    </span>
                  </div>
                </div>
                {chat.unreadCount > 0 && (
                  <span className="absolute top-4 right-12 px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-red-500 text-white">
                    {chat.unreadCount > 9 ? "9+" : chat.unreadCount}
                  </span>
                )}
                <ChatItemDropdown chat={chat} onTogglePin={onTogglePin} onToggleMute={onToggleMute} onDeleteChat={onDeleteChat} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}