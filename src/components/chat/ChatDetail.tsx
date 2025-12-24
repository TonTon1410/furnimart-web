"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { format } from "date-fns"
import { Send, Bot, Users, Clock, CheckCircle2, MoreVertical, Trash2, Edit2, X, Search, ArrowDown } from "lucide-react"
import type { Chat, ChatMessage } from "@/service/chatApi"

interface ChatDetailProps {
  chat: Chat
  messages: ChatMessage[]
  currentUserId: string
  onSendMessage: (content: string) => void
  onEditMessage: (messageId: string, content: string) => void
  onDeleteMessage: (messageId: string) => void
  onSearchMessages: (query: string) => void
  onLoadMore?: () => void
  hasMore?: boolean
  loading?: boolean
  sendingMessage?: boolean
}

function MessageDropdown({
  isOwn,
  onEdit,
  onDelete,
}: {
  isOwn: boolean
  onEdit?: () => void
  onDelete: () => void
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
        onClick={() => setOpen(!open)}
        className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <MoreVertical className="w-3 h-3 text-gray-500" />
      </button>
      {open && (
        <div
          className={`absolute ${isOwn ? "right-0" : "left-0"} top-full mt-1 w-32 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 py-1`}
        >
          {isOwn && onEdit && (
            <button
              type="button"
              onClick={() => {
                onEdit()
                setOpen(false)
              }}
              className="w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <Edit2 className="w-4 h-4" />
              Sửa
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              onDelete()
              setOpen(false)
            }}
            className="w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-800 text-red-600"
          >
            <Trash2 className="w-4 h-4" />
            Xóa
          </button>
        </div>
      )}
    </div>
  )
}

export function ChatDetail({
  chat,
  messages,
  currentUserId,
  onSendMessage,
  onEditMessage,
  onDeleteMessage,
  onSearchMessages,
  onLoadMore,
  hasMore,
  loading,
  sendingMessage,
}: ChatDetailProps) {
  const [input, setInput] = useState("")
  const [editingMessage, setEditingMessage] = useState<ChatMessage | null>(null)
  const [editContent, setEditContent] = useState("")
  const [showSearch, setShowSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [showScrollButton, setShowScrollButton] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  const handleScroll = () => {
    if (!messagesContainerRef.current) return
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current
    setShowScrollButton(scrollHeight - scrollTop - clientHeight > 100)
  }

  const handleSend = () => {
    if (!input.trim() || sendingMessage) return
    onSendMessage(input.trim())
    setInput("")
  }

  const handleEdit = () => {
    if (!editingMessage || !editContent.trim()) return
    onEditMessage(editingMessage.id, editContent.trim())
    setEditingMessage(null)
    setEditContent("")
  }

  const startEditing = (message: ChatMessage) => {
    setEditingMessage(message)
    setEditContent(message.content)
  }

  const cancelEditing = () => {
    setEditingMessage(null)
    setEditContent("")
  }

  const handleSearch = (value: string) => {
    setSearchQuery(value)
    onSearchMessages(value)
  }

  const getChatModeInfo = () => {
    switch (chat.chatMode) {
      case "AI":
        return { icon: <Bot className="w-4 h-4" />, label: "AI đang hỗ trợ", color: "text-blue-600" }
      case "WAITING_STAFF":
        return { icon: <Clock className="w-4 h-4" />, label: "Đang chờ nhân viên", color: "text-yellow-600" }
      case "STAFF_CONNECTED":
        return {
          icon: <CheckCircle2 className="w-4 h-4" />,
          label: chat.assignedStaffName || "Nhân viên đã kết nối",
          color: "text-green-600",
        }
    }
  }

  const modeInfo = getChatModeInfo()

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-950">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center ${
              chat.type === "GROUP" ? "bg-purple-100 text-purple-600" : "bg-blue-100 text-blue-600"
            }`}
          >
            {chat.type === "GROUP" ? <Users className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">{chat.name}</h3>
            <div className={`flex items-center gap-1 text-xs ${modeInfo.color}`}>
              {modeInfo.icon}
              <span>{modeInfo.label}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowSearch(!showSearch)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <Search className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </button>
        </div>
      </div>

      {/* Search bar */}
      {showSearch && (
        <div className="p-3 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm tin nhắn..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              autoFocus
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      )}

      {/* Messages */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900"
      >
        {/* Load more */}
        {hasMore && onLoadMore && (
          <div className="text-center">
            <button
              type="button"
              onClick={onLoadMore}
              disabled={loading}
              className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? "Đang tải..." : "Xem tin nhắn cũ hơn"}
            </button>
          </div>
        )}

        {/* Messages list */}
        {messages.map((msg, index) => {
          const isOwn = msg.senderId === currentUserId
          const showAvatar = index === 0 || messages[index - 1]?.senderId !== msg.senderId
          const showTime =
            index === messages.length - 1 ||
            messages[index + 1]?.senderId !== msg.senderId ||
            new Date(messages[index + 1]?.createdAt).getTime() - new Date(msg.createdAt).getTime() > 60000

          return (
            <div key={msg.id} className={`flex gap-2 ${isOwn ? "justify-end" : "justify-start"}`}>
              {!isOwn && showAvatar && (
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-xs font-medium text-blue-600 dark:text-blue-300 shrink-0">
                  {msg.senderName?.charAt(0).toUpperCase() || "?"}
                </div>
              )}
              {!isOwn && !showAvatar && <div className="w-8" />}

              <div className={`group max-w-[70%] ${isOwn ? "flex flex-col items-end" : ""}`}>
                {!isOwn && showAvatar && (
                  <span className="text-xs font-medium text-gray-500 mb-1">{msg.senderName}</span>
                )}
                <div className="flex items-end gap-1">
                  {isOwn && (
                    <MessageDropdown
                      isOwn={true}
                      onEdit={() => startEditing(msg)}
                      onDelete={() => onDeleteMessage(msg.id)}
                    />
                  )}
                  <div
                    className={`px-4 py-2 rounded-2xl text-sm ${
                      isOwn
                        ? "bg-blue-600 text-white rounded-br-md"
                        : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-bl-md"
                    }`}
                  >
                    {msg.content}
                    {msg.isEdited && <span className="text-xs opacity-70 ml-1">(đã sửa)</span>}
                  </div>
                  {!isOwn && <MessageDropdown isOwn={false} onDelete={() => onDeleteMessage(msg.id)} />}
                </div>
                {showTime && (
                  <span className="text-xs text-gray-400 mt-1">{format(new Date(msg.createdAt), "HH:mm")}</span>
                )}
              </div>
            </div>
          )
        })}

        {messages.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <Bot className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-sm">Bắt đầu cuộc trò chuyện...</p>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Scroll to bottom button */}
      {showScrollButton && (
        <button
          type="button"
          onClick={scrollToBottom}
          className="absolute bottom-24 right-6 w-10 h-10 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <ArrowDown className="w-4 h-4 text-gray-600 dark:text-gray-400" />
        </button>
      )}

      {/* Edit message bar */}
      {editingMessage && (
        <div className="p-3 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 flex items-center gap-3">
          <div className="flex-1">
            <p className="text-xs text-gray-500 mb-1">Đang sửa tin nhắn</p>
            <input
              type="text"
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleEdit()}
              autoFocus
              className="w-full px-4 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            type="button"
            onClick={cancelEditing}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <X className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </button>
          <button
            type="button"
            onClick={handleEdit}
            className="p-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Input */}
      {!editingMessage && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 flex gap-3">
          <input
            type="text"
            placeholder="Nhập tin nhắn..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            disabled={sendingMessage}
            className="flex-1 px-4 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={!input.trim() || sendingMessage}
            className="p-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  )
}
