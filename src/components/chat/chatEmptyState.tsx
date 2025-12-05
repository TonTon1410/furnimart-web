"use client"

import { MessageCircle } from "lucide-react"

export function ChatEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-gray-500 bg-gray-50 dark:bg-gray-900">
      <div className="w-20 h-20 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center mb-4">
        <MessageCircle className="w-10 h-10 opacity-50" />
      </div>
      <h3 className="text-lg font-medium mb-1 text-gray-900 dark:text-gray-100">Chọn một cuộc trò chuyện</h3>
      <p className="text-sm text-center max-w-xs">
        Chọn một cuộc trò chuyện từ danh sách bên trái để xem chi tiết và trả lời tin nhắn
      </p>
    </div>
  )
}
