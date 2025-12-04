"use client"

import { useState, useRef, useEffect } from "react"
import { MessageCircle, X, Bot, Headphones, ArrowLeft, Send } from "lucide-react"

interface Message {
  id: string
  content: string
  senderId: string
  senderName?: string
  timestamp: Date
}

type ChatMode = "selection" | "ai" | "staff"

export function ChatBox() {
  const [isOpen, setIsOpen] = useState(false)
  const [mode, setMode] = useState<ChatMode>("selection")
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Reset khi đóng
  const handleClose = () => {
    setIsOpen(false)
    // Giữ lại messages nếu muốn, hoặc reset:
    // setMode("selection")
    // setMessages([])
  }

  const handleBack = () => {
    setMode("selection")
    setMessages([])
  }

  const handleSelectAI = () => {
    setMode("ai")
    setMessages([
      {
        id: "welcome-ai",
        content: "Xin chào! Tôi là trợ lý AI. Tôi có thể giúp gì cho bạn?",
        senderId: "ai",
        senderName: "AI Assistant",
        timestamp: new Date(),
      },
    ])
  }

  const handleSelectStaff = () => {
    setMode("staff")
    setMessages([
      {
        id: "welcome-staff",
        content: "Xin chào! Vui lòng đợi trong giây lát, nhân viên sẽ hỗ trợ bạn ngay.",
        senderId: "system",
        senderName: "Hệ thống",
        timestamp: new Date(),
      },
    ])
  }

  const handleSend = () => {
    if (!input.trim()) return

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      content: input,
      senderId: "user",
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")

    if (mode === "ai") {
      // Simulate AI response
      setIsTyping(true)
      setTimeout(() => {
        const aiResponse: Message = {
          id: `ai-${Date.now()}`,
          content: `Cảm ơn bạn đã nhắn tin! Đây là phản hồi tự động từ AI cho: "${userMessage.content}"`,
          senderId: "ai",
          senderName: "AI Assistant",
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, aiResponse])
        setIsTyping(false)
      }, 1000)
    }
    // Staff mode: messages sẽ được xử lý qua WebSocket trong thực tế
  }

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-105"
        aria-label={isOpen ? "Đóng chat" : "Mở chat"}
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </button>

      {/* Chat Popup */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-[360px] h-[500px] bg-background rounded-2xl shadow-2xl border overflow-hidden flex flex-col animate-in slide-in-from-bottom-4 fade-in duration-200">
          {/* Header */}
          <div
            className={`p-4 border-b text-primary-foreground flex items-center gap-3 ${
              mode === "ai" ? "bg-blue-600" : mode === "staff" ? "bg-green-600" : "bg-primary"
            }`}
          >
            {mode !== "selection" && (
              <button onClick={handleBack} className="p-1 hover:bg-white/20 rounded-full transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div className="flex-1">
              <h3 className="font-semibold">
                {mode === "selection" && "Hỗ trợ khách hàng"}
                {mode === "ai" && "Chat với AI"}
                {mode === "staff" && "Chat với Nhân viên"}
              </h3>
              <p className="text-xs opacity-80">
                {mode === "selection" && "Chọn cách bạn muốn liên hệ"}
                {mode === "ai" && "Trả lời nhanh 24/7"}
                {mode === "staff" && "Đang kết nối..."}
              </p>
            </div>
            <button onClick={handleClose} className="p-1 hover:bg-white/20 rounded-full transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          {mode === "selection" ? (
            <div className="flex-1 p-4 flex flex-col justify-center space-y-3">
              <button
                onClick={handleSelectAI}
                className="w-full flex items-center gap-4 p-4 rounded-xl border bg-background hover:border-blue-400 hover:shadow-md transition-all group"
              >
                <div className="p-3 rounded-lg bg-blue-100 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <Bot className="w-6 h-6" />
                </div>
                <div className="text-left">
                  <h4 className="font-medium text-foreground group-hover:text-blue-600 transition-colors">
                    Chat với AI
                  </h4>
                  <p className="text-xs text-muted-foreground">Trả lời nhanh 24/7</p>
                </div>
              </button>

              <button
                onClick={handleSelectStaff}
                className="w-full flex items-center gap-4 p-4 rounded-xl border bg-background hover:border-green-400 hover:shadow-md transition-all group"
              >
                <div className="p-3 rounded-lg bg-green-100 text-green-600 group-hover:bg-green-600 group-hover:text-white transition-colors">
                  <Headphones className="w-6 h-6" />
                </div>
                <div className="text-left">
                  <h4 className="font-medium text-foreground group-hover:text-green-600 transition-colors">
                    Chat với Nhân viên
                  </h4>
                  <p className="text-xs text-muted-foreground">Hỗ trợ trực tiếp</p>
                </div>
              </button>
            </div>
          ) : (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/30">
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.senderId === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[80%] p-3 px-4 rounded-2xl text-sm shadow-sm break-words ${
                        msg.senderId === "user"
                          ? "bg-primary text-primary-foreground rounded-br-md"
                          : msg.senderId === "system"
                            ? "bg-muted text-muted-foreground rounded-bl-md italic"
                            : "bg-background border text-foreground rounded-bl-md"
                      }`}
                    >
                      {msg.senderId !== "user" && msg.senderName && (
                        <div className="text-xs font-semibold mb-1 opacity-70">{msg.senderName}</div>
                      )}
                      {msg.content}
                    </div>
                  </div>
                ))}

                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-background border text-foreground rounded-2xl rounded-bl-md p-3 px-4 text-sm">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                        <span
                          className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                          style={{ animationDelay: "0.1s" }}
                        />
                        <span
                          className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                          style={{ animationDelay: "0.2s" }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-3 border-t bg-background flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                  placeholder="Nhập tin nhắn..."
                  className="flex-1 px-4 py-2 border rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-background"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim()}
                  className="bg-primary hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground text-primary-foreground p-2 rounded-full w-10 h-10 flex items-center justify-center transition shadow-sm"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  )
}

export default ChatBox
