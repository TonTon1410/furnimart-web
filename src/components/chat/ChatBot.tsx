"use client"

import { useState, useEffect } from "react"
import { contactService, type Chat, type Message } from "@/service/contactService"

export default function ChatBox() {
  const [chats, setChats] = useState<Chat[]>([])
  const [activeChat, setActiveChat] = useState<Chat | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)

  // Fake ID cho Staff và AI để demo (Thực tế lấy từ config hoặc API search user)
  const STAFF_ID = "staff-id-placeholder"
  const AI_ID = "ai-id-placeholder"

  useEffect(() => {
    loadChats()
  }, [])

  useEffect(() => {
    if (activeChat) {
      setMessages([])
      setPage(0)
      setHasMore(true)
      loadMessages(activeChat.id, 0)
    }
  }, [activeChat])

  const loadChats = async () => {
    try {
      const res = await contactService.getChats(0, 10)
      setChats(res.data.content || [])
    } catch (error) {
      console.error("Lỗi tải chat", error)
    }
  }

  const loadMessages = async (chatId: string, p: number) => {
    if (loading) return
    setLoading(true)
    try {
      const res = await contactService.getMessages(chatId, p, 20)
      const newMsgs = res.data.content || []
      setMessages((prev) => (p === 0 ? newMsgs.reverse() : [...newMsgs.reverse(), ...prev]))
      setHasMore(!res.data.last)
    } catch (error) {
      console.error("Lỗi tải tin nhắn", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSend = async () => {
    if (!input.trim() || !activeChat) return
    try {
      const res = await contactService.sendMessage(activeChat.id, input)
      setMessages([...messages, res.data])
      setInput("")
    } catch (error) {
      console.error("Lỗi gửi tin", error)
    }
  }

  const startChat = async (userId: string, name: string) => {
    try {
      const res = await contactService.getPrivateChat(userId)
      const chat = res.data
      if (!chats.find((c) => c.id === chat.id)) setChats([chat, ...chats])
      setActiveChat(chat)
    } catch (error) {
      console.error(`Lỗi tạo chat với ${name}`, error)
    }
  }

  return (
    <div className="flex h-[500px] border rounded-lg overflow-hidden bg-white shadow-lg font-sans">
      {/* Sidebar DS Chat */}
      <div className="w-1/3 border-r bg-gray-50 flex flex-col">
        <div className="p-4 border-b bg-white font-bold text-gray-700">Hộp thoại</div>
        <div className="flex-1 overflow-y-auto">
          {/* Quick Action */}
          <div className="p-2 flex gap-2 justify-center">
            <button
              onClick={() => startChat(STAFF_ID, "Nhân viên")}
              className="px-3 py-1 bg-blue-500 text-white text-xs rounded-full hover:bg-blue-600 transition"
            >
              Chat với Staff
            </button>
            <button
              onClick={() => startChat(AI_ID, "AI Support")}
              className="px-3 py-1 bg-green-500 text-white text-xs rounded-full hover:bg-green-600 transition"
            >
              Chat với AI
            </button>
          </div>
          {chats.map((chat) => (
            <div
              key={chat.id}
              onClick={() => setActiveChat(chat)}
              className={`p-3 cursor-pointer hover:bg-gray-100 border-b transition ${activeChat?.id === chat.id ? "bg-blue-50 border-l-4 border-l-blue-500" : ""}`}
            >
              <div className="font-semibold text-gray-800 text-sm truncate">{chat.name || "Cuộc trò chuyện"}</div>
              <div className="text-xs text-gray-500 truncate">{chat.lastMessage?.content || "Chưa có tin nhắn"}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Cửa sổ chat */}
      <div className="w-2/3 flex flex-col bg-white">
        {activeChat ? (
          <>
            <div className="p-4 border-b font-bold text-gray-700 shadow-sm flex justify-between items-center">
              <span>{activeChat.name}</span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/50">
              {hasMore && (
                <div className="text-center">
                  <button
                    onClick={() => {
                      const nextPage = page + 1
                      setPage(nextPage)
                      loadMessages(activeChat.id, nextPage)
                    }}
                    disabled={loading}
                    className="text-xs text-blue-500 hover:underline"
                  >
                    {loading ? "Đang tải..." : "Xem tin nhắn cũ hơn"}
                  </button>
                </div>
              )}
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.senderId === "MY_ID" ? "justify-end" : "justify-start"}`}>
                  {/* Note: Cần logic check senderId thật để align đúng */}
                  <div
                    className={`max-w-[70%] p-3 rounded-2xl text-sm shadow-sm ${msg.senderId === "MY_ID" ? "bg-blue-500 text-white rounded-br-none" : "bg-white border text-gray-800 rounded-bl-none"}`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              {messages.length === 0 && (
                <div className="text-center text-gray-400 text-sm mt-10">Bắt đầu cuộc trò chuyện...</div>
              )}
            </div>

            <div className="p-3 border-t bg-white flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Nhập tin nhắn..."
                className="flex-1 p-2 border rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 pl-4"
              />
              <button
                onClick={handleSend}
                className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-full w-10 h-10 flex items-center justify-center transition shadow-md"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-5 h-5 ml-1"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
                  />
                </svg>
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-16 h-16 mb-2 text-gray-300"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"
              />
            </svg>
            <p>Chọn một cuộc hội thoại để bắt đầu</p>
          </div>
        )}
      </div>
    </div>
  )
}
