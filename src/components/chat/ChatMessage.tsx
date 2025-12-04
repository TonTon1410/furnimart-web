"use client"

import { useRef, useEffect } from "react"
import type { Message } from "@/service/contactService"

interface ChatMessagesProps {
  messages: Message[]
  currentUserId: string | null
  loading: boolean
  hasMore?: boolean
  onLoadMore?: () => void
}

export function ChatMessages({ messages, currentUserId, loading, hasMore, onLoadMore }: ChatMessagesProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/30">
      {hasMore && onLoadMore && (
        <div className="text-center">
          <button
            onClick={onLoadMore}
            disabled={loading}
            className="text-xs text-primary hover:underline disabled:text-muted-foreground"
          >
            {loading ? "Đang tải..." : "Xem tin nhắn cũ hơn"}
          </button>
        </div>
      )}

      {messages.map((msg) => (
        <div key={msg.id} className={`flex ${msg.senderId === currentUserId ? "justify-end" : "justify-start"}`}>
          <div
            className={`max-w-[80%] p-3 px-4 rounded-2xl text-sm shadow-sm break-words ${
              msg.senderId === currentUserId
                ? "bg-primary text-primary-foreground rounded-br-md"
                : "bg-background border text-foreground rounded-bl-md"
            }`}
          >
            {msg.senderId !== currentUserId && msg.senderName && (
              <div className="text-xs font-semibold mb-1 opacity-70">{msg.senderName}</div>
            )}
            {msg.content}
          </div>
        </div>
      ))}

      {messages.length === 0 && !loading && (
        <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
          Bắt đầu cuộc trò chuyện...
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  )
}
