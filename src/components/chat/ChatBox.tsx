/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useRef, useEffect } from "react";
import {
  MessageCircle,
  X,
  Bot,
  Headphones,
  ArrowLeft,
  Send,
  Camera,
  Loader2,
  Sparkles,
  Lock,
} from "lucide-react";
import { chatService } from "@/service/chatService"; 
import { authService } from "@/service/authService";
import { useToast } from "@/context/ToastContext";
import type { ChatMessage as ApiChatMessage } from "@/types/chat"; 

// Update Interface Message cho UI
interface Message {
  id: string;
  content: string;
  senderId: string;
  senderName?: string;
  senderAvatar?: string | null;
  isOwnMessage?: boolean;
  timestamp: Date;
}

interface ProductSuggestion {
  id: string;
  itemName: string;
  reason: string;
  placementAdvice: string;
  thumbnailImage: string;
  price: number;
  recommendedColor: string;
}

interface RoomAnalysisResponse {
  style: string;
  analysis: string;
  colorPalette: string[];
  suggestions: ProductSuggestion[];
}

type ChatMode = "selection" | "ai" | "staff";
type StaffChatStatus = "WAITING_STAFF" | "STAFF_CONNECTED" | "AI" | null;

export function ChatBox() {
  const { showToast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<ChatMode>("selection");
  
  // State Chat
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [chatId, setChatId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [chatStatus, setChatStatus] = useState<StaffChatStatus>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // State AI
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [roomAnalysisResult, setRoomAnalysisResult] = useState<RoomAnalysisResponse | null>(null);
  const [note, setNote] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto scroll khi có tin nhắn mới
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]); 

  // Load tin nhắn & Map dữ liệu mới
  const loadMessages = async (currentChatId: string) => {
    try {
      const res = await chatService.getMessages(currentChatId);
      if (res.data) {
        const formattedMessages: Message[] = res.data.map((msg: ApiChatMessage) => ({
          id: msg.id,
          content: msg.content,
          senderId: msg.senderId,
          senderName: msg.senderName,
          senderAvatar: msg.senderAvatar,
          isOwnMessage: msg.isOwnMessage,
          timestamp: new Date(msg.createdAt),
        }));
        setMessages(formattedMessages);
      }
    } catch (error) {
      console.error("Lỗi load tin nhắn:", error);
    }
  };

  const checkChatStatus = async () => {
    try {
      const res = await chatService.getUserChats();
      // Tìm chat đang active
      const activeChat = res.data?.find(c => c.status === 'ACTIVE');
      
      if (activeChat) {
        if (activeChat.id !== chatId) setChatId(activeChat.id);
        // Cập nhật status
        setChatStatus(activeChat.chatMode as StaffChatStatus);
      } else {
        // Trường hợp không tìm thấy chat active nào (có thể đã bị đóng hoàn toàn)
        if (mode === 'staff' && chatId) {
             setChatStatus("AI");
        }
      }
    } catch (error) {
      console.error("Lỗi check status:", error);
    }
  };

  const handleSelectStaff = async () => {
    setMode("staff");
    setLoading(true);
    try {
      const res = await chatService.getUserChats();
      let currentChat = res.data?.find(c => c.status === 'ACTIVE');
      if (!currentChat) {
        const createRes = await chatService.quickCreateChat();
        currentChat = createRes.data;
      }
      if (currentChat) {
        setChatId(currentChat.id);
        if (currentChat.chatMode !== 'WAITING_STAFF' && currentChat.chatMode !== 'STAFF_CONNECTED') {
            try {
                const upgradeRes = await chatService.requestStaff(currentChat.id);
                if (upgradeRes.data) setChatStatus(upgradeRes.data.chatMode as StaffChatStatus);
            } catch (err) {
                setChatStatus("WAITING_STAFF"); 
            }
        } else {
            setChatStatus(currentChat.chatMode as StaffChatStatus);
        }
        await loadMessages(currentChat.id);
      }
    } catch (error) {
      console.error("Lỗi khởi tạo chat:", error);
      showToast({ type: "error", title: "Không thể kết nối chat" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
    if (isOpen && mode === "staff") {
      // Gọi ngay lập tức
      if (chatId) {
          loadMessages(chatId);
          checkChatStatus();
      } else {
          checkChatStatus();
      }
      // Polling mỗi 3s
      pollingIntervalRef.current = setInterval(() => {
        if (chatId) {
            loadMessages(chatId);
            checkChatStatus();
        } else {
            checkChatStatus();
        }
      }, 3000);
    }
    return () => {
      if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
    };
  }, [isOpen, mode, chatId]);

  const handleSend = async () => {
    if (chatStatus === 'WAITING_STAFF') {
        showToast({ type: "info", title: "Vui lòng đợi nhân viên..." });
        return;
    }
    // Chặn gửi nếu chat đã kết thúc
    if (chatStatus === 'AI') {
        return;
    }

    if (!input.trim() || !chatId) return;

    const content = input.trim();
    setInput(""); 
    
    const tempId = Date.now().toString();
    const myId = authService.getUserId() || "me";
    
    setMessages(prev => [...prev, {
        id: tempId,
        content: content,
        senderId: myId,
        senderName: "Tôi",
        isOwnMessage: true,
        timestamp: new Date()
    }]);

    try {
      await chatService.sendMessage({
        chatId: chatId,
        content: content,
        type: "TEXT"
      });
      await loadMessages(chatId);
    } catch (error) {
      showToast({ type: "error", title: "Gửi thất bại" });
    }
  };

  const handleSelectAI = () => {
    setMode("ai");
    setMessages([]);
    setChatId(null);
    setChatStatus(null);
    setSelectedImage(null);
    setPreviewUrl(null);
    setRoomAnalysisResult(null);
    setNote("");
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setPreviewUrl(reader.result as string);
      reader.readAsDataURL(file);
      setRoomAnalysisResult(null);
    }
  };

  const handleAnalyzeRoom = async () => {
    if (!selectedImage) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("image", selectedImage);
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://furnimart.click/api";
      let url = `${API_BASE_URL}/ai/analyze/analyze-room`;
      if (note) url += `?note=${encodeURIComponent(note)}`;
      const response = await fetch(url, { method: "POST", body: formData });
      if (!response.ok) throw new Error(`Lỗi: ${response.status}`);
      const data = await response.json();
      if (data.status === 200 && data.data) setRoomAnalysisResult(data.data);
      else throw new Error(data.message);
    } catch (error: any) {
      showToast({ type: "error", title: `Lỗi: ${error.message}` });
    } finally {
      setLoading(false);
    }
  };

  const handleResetRoomAnalyzer = () => {
    setSelectedImage(null);
    setPreviewUrl(null);
    setRoomAnalysisResult(null);
    setNote("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleClose = () => {
    setIsOpen(false);
    if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
  };

  const handleBack = () => {
    setMode("selection");
    setMessages([]);
    setChatId(null);
    setChatStatus(null);
    if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-50 w-12 h-12 sm:w-14 sm:h-14 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-105"
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </button>

      {isOpen && (
        <div className="fixed bottom-30 right-4 left-4 sm:left-auto sm:bottom-24 sm:right-6 z-50 w-auto sm:w-[360px] max-w-[calc(100vw-2rem)] h-[calc(100vh-10rem)] sm:h-[500px] max-h-[calc(100vh-10rem)] bg-background rounded-2xl shadow-2xl border overflow-hidden flex flex-col animate-in slide-in-from-bottom-4 fade-in duration-200">
          
          {/* Header */}
          <div className={`p-4 border-b text-primary-foreground flex items-center gap-3 ${
              mode === "ai" ? "bg-blue-600" : mode === "staff" ? "bg-green-600" : "bg-primary"
            }`}
          >
            {(mode === "ai" || mode === "staff") && (
              <button onClick={handleBack} className="p-1 hover:bg-white/20 rounded-full transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div className="flex-1">
              <h3 className="font-semibold">
                {mode === "selection" && "Hỗ trợ khách hàng"}
                {mode === "ai" && "AI Assistant"}
                {mode === "staff" && "Chat Nhân viên"}
              </h3>
            </div>
            <button onClick={handleClose} className="p-1 hover:bg-white/20 rounded-full transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {mode === "selection" ? (
            <div className="flex-1 p-4 flex flex-col justify-center space-y-3">
              <button onClick={handleSelectAI} className="w-full flex items-center gap-4 p-4 rounded-xl border bg-background hover:border-blue-400 hover:shadow-md transition-all group">
                <div className="p-3 rounded-lg bg-blue-100 text-blue-600">
                  <Bot className="w-6 h-6" />
                </div>
                <div className="text-left">
                  <h4 className="font-medium text-foreground">Phân Tích Phòng AI</h4>
                  <p className="text-xs text-muted-foreground">Gợi ý nội thất</p>
                </div>
              </button>
              <button onClick={handleSelectStaff} className="w-full flex items-center gap-4 p-4 rounded-xl border bg-background hover:border-green-400 hover:shadow-md transition-all group">
                <div className="p-3 rounded-lg bg-green-100 text-green-600">
                  <Headphones className="w-6 h-6" />
                </div>
                <div className="text-left">
                  <h4 className="font-medium text-foreground">Chat với Nhân viên</h4>
                  <p className="text-xs text-muted-foreground">Hỗ trợ trực tiếp</p>
                </div>
              </button>
            </div>
          ) : mode === "ai" ? (
            <div className="flex-1 overflow-y-auto p-4">
               {/* UI AI */}
               {!roomAnalysisResult ? (
                <div className="space-y-4">
                  <div className="text-center mb-4">
                    <Camera className="w-12 h-12 mx-auto mb-2 text-blue-500" />
                    <p className="text-sm text-muted-foreground">Tải ảnh phòng lên để AI phân tích</p>
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
                  {!previewUrl ? (
                    <button onClick={() => fileInputRef.current?.click()} className="w-full border-2 border-dashed border-gray-300 rounded-lg p-8 hover:border-blue-500 transition-colors flex flex-col items-center gap-2">
                      <Camera className="w-12 h-12 text-gray-400" />
                      <span className="text-sm text-gray-600">Nhấn để chọn ảnh</span>
                    </button>
                  ) : (
                    <div className="space-y-3">
                      <div className="relative rounded-lg overflow-hidden border-2 border-gray-200">
                        <img src={previewUrl} alt="Preview" className="w-full h-48 object-cover" />
                        <button onClick={handleResetRoomAnalyzer} className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600"><X className="w-4 h-4" /></button>
                      </div>
                      <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ghi chú..." className="w-full px-3 py-2 border rounded-lg text-sm bg-background" rows={3} disabled={loading} />
                      <button onClick={handleAnalyzeRoom} disabled={loading} className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-muted text-white rounded-lg font-medium flex items-center justify-center gap-2">
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />} Phân tích
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                    <h3 className="font-bold text-sm text-blue-900 mb-1">{roomAnalysisResult.style}</h3>
                    <p className="text-xs text-gray-700">{roomAnalysisResult.analysis}</p>
                  </div>
                  <button onClick={handleResetRoomAnalyzer} className="w-full py-2 bg-muted text-sm rounded-lg">Thử lại</button>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* --- PHẦN THÔNG BÁO KẾT NỐI (CỐ ĐỊNH, KHÔNG SCROLL) --- */}
              {chatStatus === 'STAFF_CONNECTED' && (
                  <div className="flex items-center gap-3 p-3 bg-green-50/95 border-b border-green-200 animate-in fade-in slide-in-from-top-2 duration-500 shadow-sm z-10">
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 shrink-0">
                      <Headphones className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-bold text-green-800">Nhân viên đã tham gia</p>
                      <p className="text-[11px] text-green-600">Bạn có thể trao đổi trực tiếp ngay bây giờ.</p>
                    </div>
                  </div>
              )}

              {/* STAFF CHAT MESSAGES (CÓ SCROLL) */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-gray-50 dark:bg-gray-900/50">
                {messages.map((msg, index) => {
                  const myId = authService.getUserId();
                  const isMe = msg.isOwnMessage !== undefined ? msg.isOwnMessage : msg.senderId === myId;
                  const isNextSame = messages[index + 1]?.senderId === msg.senderId;
                  const showAvatar = !isMe && !isNextSame;

                  return (
                    <div key={msg.id} className={`flex gap-1.5 ${isMe ? "justify-end" : "justify-start"}`}>
                      {!isMe && (
                        <div className={`w-6 h-6 shrink-0 flex items-end ${!showAvatar ? 'invisible' : ''}`}>
                             {msg.senderAvatar ? (
                                <img src={msg.senderAvatar} alt="ava" className="w-6 h-6 rounded-full object-cover"/>
                             ) : (
                                <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center text-[9px] font-bold text-gray-600">
                                    {msg.senderName?.charAt(0).toUpperCase() || "S"}
                                </div>
                             )}
                        </div>
                      )}

                      <div className={`max-w-[75%] flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                        {!isMe && (index === 0 || messages[index - 1]?.senderId !== msg.senderId) && (
                            <span className="text-[10px] text-gray-500 ml-1 mb-0.5">{msg.senderName}</span>
                        )}
                        <div
                            className={`p-2 px-3 text-[13px] shadow-sm wrap-break-word ${
                            isMe 
                                ? "bg-primary text-primary-foreground rounded-2xl rounded-tr-sm" 
                                : "bg-white border text-gray-800 rounded-2xl rounded-tl-sm"
                            }`}
                        >
                            {msg.content}
                        </div>
                      </div>
                    </div>
                  )
                })}
                
                {/* Thông báo Đang kết nối (Giữ nguyên ở dưới để báo hiệu đang chờ) */}
                {chatStatus === 'WAITING_STAFF' && (
                  <div className="flex flex-col items-center justify-center p-6 space-y-3 bg-yellow-50/80 rounded-xl border border-yellow-200 border-dashed mx-4 mt-4 animate-in fade-in slide-in-from-bottom-3 duration-500">
                    <div className="relative">
                      <Headphones className="w-8 h-8 text-yellow-600" />
                      <span className="absolute -top-1 -right-1 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-500"></span>
                      </span>
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-yellow-800 text-sm">Đang kết nối nhân viên...</p>
                      <p className="text-xs text-yellow-600 mt-1 max-w-[200px]">
                        Vui lòng đợi trong giây lát, nhân viên sẽ tham gia ngay.
                      </p>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* INPUT VS ENDED STATE */}
              {chatStatus === 'AI' ? (
                <div className="p-4 border-t bg-gray-50 flex flex-col items-center justify-center gap-2 animate-in fade-in slide-in-from-bottom-2">
                   <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                     <Lock className="w-5 h-5" />
                   </div>
                   <p className="text-sm font-medium text-gray-600">Nhân viên đã kết thúc cuộc trò chuyện</p>
                   <button 
                      onClick={handleBack}
                      className="text-xs text-primary font-medium hover:underline mt-1"
                   >
                      Quay lại menu chính
                   </button>
                </div>
              ) : (
                <div className="p-3 border-t bg-background flex gap-2">
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                    disabled={chatStatus === 'WAITING_STAFF'}
                    placeholder={chatStatus === 'WAITING_STAFF' ? "Đang chờ..." : "Nhập tin nhắn..."}
                    className="flex-1 px-4 py-2 border rounded-full text-sm focus:outline-none focus:ring-1 focus:ring-primary bg-background disabled:opacity-60"
                  />
                  <button
                    onClick={handleSend}
                    disabled={!input.trim() || chatStatus === 'WAITING_STAFF'}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground p-2 rounded-full w-9 h-9 flex items-center justify-center disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </>
  );
}

export default ChatBox;