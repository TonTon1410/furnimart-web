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
} from "lucide-react";
// Import service và types thật
import { chatService } from "@/service/chatService"; 
import { authService } from "@/service/authService";
import { useToast } from "@/context/ToastContext";
// Import type từ file types/chat.ts
import type { ChatMessage as ApiChatMessage } from "@/types/chat"; 

// Interface cho UI
interface Message {
  id: string;
  content: string;
  senderId: string;
  senderName?: string;
  timestamp: Date;
}

// ------------------- GIỮ NGUYÊN TYPE CỦA PHẦN AI -------------------
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
// -------------------------------------------------------------------

type ChatMode = "selection" | "ai" | "staff";
// [NEW] Type cho trạng thái kết nối staff
type StaffChatStatus = "WAITING_STAFF" | "STAFF_CONNECTED" | "AI" | null;

export function ChatBox() {
  const { showToast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<ChatMode>("selection");
  
  // State cho Chat
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [chatId, setChatId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  // [NEW] State để theo dõi trạng thái: Đang chờ hay Đã kết nối
  const [chatStatus, setChatStatus] = useState<StaffChatStatus>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // ------------------- GIỮ NGUYÊN STATE CỦA PHẦN AI -------------------
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [roomAnalysisResult, setRoomAnalysisResult] = useState<RoomAnalysisResponse | null>(null);
  const [note, setNote] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  // --------------------------------------------------------------------

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ========================================================================
  // 1. LOGIC CHAT THẬT (MODE: STAFF)
  // ========================================================================

  // Hàm load tin nhắn từ Server
  const loadMessages = async (currentChatId: string) => {
    try {
      const res = await chatService.getMessages(currentChatId);
      if (res.data) {
        const formattedMessages: Message[] = res.data.map((msg: ApiChatMessage) => ({
          id: msg.id,
          content: msg.content,
          senderId: msg.senderId,
          senderName: msg.senderName,
          timestamp: new Date(msg.createdAt),
        }));
        setMessages(formattedMessages);
      }
    } catch (error) {
      console.error("Lỗi load tin nhắn:", error);
    }
  };

  // [NEW] Hàm kiểm tra trạng thái chat (Polling dùng hàm này)
  // Để biết khi nào Staff bấm "Accept" -> Status chuyển từ WAITING_STAFF -> STAFF_CONNECTED
  const checkChatStatus = async () => {
    try {
      const res = await chatService.getUserChats();
      // Tìm chat đang active gần nhất
      const activeChat = res.data?.find(c => c.status === 'ACTIVE');
      
      if (activeChat) {
        // Nếu ID thay đổi (do backend merge chat cũ), cập nhật lại ID
        if (activeChat.id !== chatId) {
            setChatId(activeChat.id);
        }
        // Cập nhật trạng thái
        setChatStatus(activeChat.chatMode as StaffChatStatus);
      }
    } catch (error) {
      console.error("Lỗi check status:", error);
    }
  };

  // Khởi tạo Chat khi chọn "Chat với Nhân viên"
  const handleSelectStaff = async () => {
    setMode("staff");
    setLoading(true);
    try {
      // B1: Kiểm tra xem user đã có chat ACTIVE nào chưa
      const res = await chatService.getUserChats();
      const existingChat = res.data?.find(c => c.status === 'ACTIVE');

      if (existingChat) {
        // Nếu có rồi -> Load lại
        setChatId(existingChat.id);
        setChatStatus(existingChat.chatMode as StaffChatStatus);
        await loadMessages(existingChat.id);
      } else {
        // [QUAN TRỌNG] B2: Nếu chưa có -> Dùng QUICK CREATE (Thay vì createChat)
        // API này sẽ tự set chatMode = WAITING_STAFF
        const quickRes = await chatService.quickCreateChat();
        if (quickRes.data) {
          setChatId(quickRes.data.id);
          setChatStatus(quickRes.data.chatMode as StaffChatStatus); // WAITING_STAFF
          setMessages([]);
        }
      }
    } catch (error) {
      console.error("Lỗi khởi tạo chat:", error);
      showToast({ type: "error", title: "Không thể kết nối đến hệ thống chat" });
    } finally {
      setLoading(false);
    }
  };

  // Polling: Update tin nhắn VÀ kiểm tra trạng thái (3s/lần)
  useEffect(() => {
    if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);

    if (isOpen && mode === "staff") {
      // Chạy ngay lần đầu
      if (chatId) {
          loadMessages(chatId);
          checkChatStatus();
      } else {
          // Nếu mất state ID, check lại từ list
          checkChatStatus();
      }
      
      pollingIntervalRef.current = setInterval(() => {
        if (chatId) {
            loadMessages(chatId);
            checkChatStatus(); // Check xem staff đã accept chưa
        } else {
            checkChatStatus();
        }
      }, 3000);
    }

    return () => {
      if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
    };
  }, [isOpen, mode, chatId]);

  // Gửi tin nhắn
  const handleSend = async () => {
    // [NEW] Chặn gửi tin nhắn nếu đang đợi staff (Backend cũng chặn, nhưng chặn UI cho UX tốt hơn)
    if (chatStatus === 'WAITING_STAFF') {
        showToast({ type: "info", title: "Vui lòng đợi nhân viên kết nối..." });
        return;
    }

    if (!input.trim() || !chatId) return;

    const content = input.trim();
    setInput(""); 
    
    // Optimistic UI
    const tempId = Date.now().toString();
    const myId = authService.getUserId() || "me";
    
    setMessages(prev => [...prev, {
        id: tempId,
        content: content,
        senderId: myId,
        senderName: "Tôi",
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
      console.error("Gửi tin nhắn lỗi:", error);
      showToast({ type: "error", title: "Gửi tin nhắn thất bại" });
    }
  };

  // ========================================================================
  // 2. LOGIC AI (GIỮ NGUYÊN)
  // ========================================================================
  
  const handleSelectAI = () => {
    setMode("ai");
    setMessages([]);
    setChatId(null);
    setChatStatus(null); // Reset status
    setSelectedImage(null);
    setPreviewUrl(null);
    setRoomAnalysisResult(null);
    setNote("");
  };

  // ... (Giữ nguyên các hàm handleImageSelect, handleAnalyzeRoom, handleResetRoomAnalyzer, formatPrice)
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
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
      if (!response.ok) throw new Error(`Phân tích thất bại: ${response.status}`);
      const data = await response.json();
      if (data.status === 200 && data.data) setRoomAnalysisResult(data.data);
      else throw new Error(data.message || "Không nhận được kết quả");
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

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price);
  };

  // ========================================================================
  // 3. UI RENDERING
  // ========================================================================

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
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-50 w-12 h-12 sm:w-14 sm:h-14 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-105"
        aria-label={isOpen ? "Đóng chat" : "Mở chat"}
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </button>

      {/* Chat Popup */}
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
                {mode === "ai" && "Phân Tích Phòng AI"}
                {mode === "staff" && "Chat với Nhân viên"}
              </h3>
              <p className="text-xs opacity-80">
                {mode === "selection" && "Chọn cách bạn muốn liên hệ"}
                {mode === "ai" && "Gợi ý nội thất phù hợp"}
                {mode === "staff" && "Hỗ trợ trực tuyến 24/7"}
              </p>
            </div>
            <button onClick={handleClose} className="p-1 hover:bg-white/20 rounded-full transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          {mode === "selection" ? (
            <div className="flex-1 p-4 flex flex-col justify-center space-y-3">
              <button onClick={handleSelectAI} className="w-full flex items-center gap-4 p-4 rounded-xl border bg-background hover:border-blue-400 hover:shadow-md transition-all group">
                <div className="p-3 rounded-lg bg-blue-100 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <Bot className="w-6 h-6" />
                </div>
                <div className="text-left">
                  <h4 className="font-medium text-foreground group-hover:text-blue-600 transition-colors">Phân Tích Phòng AI</h4>
                  <p className="text-xs text-muted-foreground">Gợi ý nội thất</p>
                </div>
              </button>
              <button onClick={handleSelectStaff} className="w-full flex items-center gap-4 p-4 rounded-xl border bg-background hover:border-green-400 hover:shadow-md transition-all group">
                <div className="p-3 rounded-lg bg-green-100 text-green-600 group-hover:bg-green-600 group-hover:text-white transition-colors">
                  <Headphones className="w-6 h-6" />
                </div>
                <div className="text-left">
                  <h4 className="font-medium text-foreground group-hover:text-green-600 transition-colors">Chat với Nhân viên</h4>
                  <p className="text-xs text-muted-foreground">Hỗ trợ trực tiếp</p>
                </div>
              </button>
            </div>
          ) : mode === "ai" ? (
            
            // --- UI AI (Giữ nguyên) ---
            <div className="flex-1 overflow-y-auto p-4">
              {!roomAnalysisResult ? (
                <div className="space-y-4">
                  <div className="text-center mb-4">
                    <Camera className="w-12 h-12 mx-auto mb-2 text-blue-500" />
                    <p className="text-sm text-muted-foreground">Tải ảnh phòng lên để AI phân tích và gợi ý nội thất</p>
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
                      <div>
                        <label className="block text-sm font-medium mb-2">Ghi chú (tùy chọn)</label>
                        <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Thêm ghi chú..." className="w-full px-3 py-2 border rounded-lg text-sm bg-background" rows={3} disabled={loading} />
                      </div>
                      <button onClick={handleAnalyzeRoom} disabled={loading} className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-muted text-white rounded-lg font-medium flex items-center justify-center gap-2">
                        {loading ? <><Loader2 className="w-5 h-5 animate-spin" />Đang phân tích...</> : <><Sparkles className="w-5 h-5" />Phân tích phòng</>}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {previewUrl && <div className="rounded-lg overflow-hidden border-2 border-gray-200"><img src={previewUrl} alt="Analyzed" className="w-full h-40 object-cover" /></div>}
                  <div className="bg-linear-to-r from-blue-50 to-purple-50 rounded-lg p-3 border border-blue-200">
                    <h3 className="font-bold text-sm text-blue-900 mb-2">🎨 Phong cách: {roomAnalysisResult.style}</h3>
                    <p className="text-xs text-gray-700">{roomAnalysisResult.analysis}</p>
                  </div>
                  {roomAnalysisResult.suggestions && roomAnalysisResult.suggestions.length > 0 && (
                    <div className="bg-white rounded-lg p-3 border border-gray-200">
                       <h4 className="font-semibold text-sm mb-2">💡 Gợi ý sản phẩm:</h4>
                       <div className="space-y-2">
                          {roomAnalysisResult.suggestions.map((s) => (
                             <div key={s.id} className="border border-gray-200 rounded-lg p-2 flex gap-2">
                                <img src={s.thumbnailImage} alt={s.itemName} className="w-16 h-16 object-cover rounded-lg" />
                                <div className="flex-1 min-w-0">
                                   <h5 className="font-semibold text-xs text-gray-900">{s.itemName}</h5>
                                   <p className="text-xs text-blue-600 font-medium">{formatPrice(s.price)}</p>
                                </div>
                             </div>
                          ))}
                       </div>
                    </div>
                  )}
                  <button onClick={handleResetRoomAnalyzer} className="w-full py-2.5 bg-muted hover:bg-muted/80 rounded-lg text-sm">🔄 Phân tích ảnh khác</button>
                </div>
              )}
            </div>

          ) : (
            
            // --- UI STAFF CHAT (Đã cập nhật logic mới) ---
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/30">
                
                {/* [NEW] Banner chờ nhân viên */}
                {chatStatus === 'WAITING_STAFF' && (
                  <div className="flex flex-col items-center justify-center p-6 text-center space-y-3 bg-yellow-50 dark:bg-yellow-900/10 rounded-xl border border-yellow-200 dark:border-yellow-800 m-2">
                    <div className="relative">
                      <Headphones className="w-10 h-10 text-yellow-600 animate-pulse" />
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-ping"></div>
                    </div>
                    <h4 className="font-semibold text-yellow-800 dark:text-yellow-500">Đang kết nối...</h4>
                    <p className="text-xs text-yellow-700 dark:text-yellow-600">
                      Vui lòng đợi nhân viên tiếp nhận yêu cầu.
                    </p>
                  </div>
                )}
                
                {/* Loading state */}
                {loading && messages.length === 0 && (
                   <div className="flex justify-center items-center py-10"><Loader2 className="animate-spin text-gray-400" /></div>
                )}
                
                {/* Empty & Connected state */}
                {!loading && messages.length === 0 && chatStatus === 'STAFF_CONNECTED' && (
                    <div className="text-center text-gray-400 text-sm mt-10">
                        Nhân viên đã tham gia cuộc trò chuyện.
                    </div>
                )}

                {/* Messages List */}
                {messages.map((msg) => {
                  const myId = authService.getUserId();
                  const isMe = msg.senderId === myId;
                  return (
                    <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[80%] p-3 px-4 rounded-2xl text-sm shadow-sm wrap-break-word ${
                          isMe ? "bg-primary text-primary-foreground rounded-br-none" : "bg-background border text-foreground rounded-bl-none"
                        }`}
                      >
                        {!isMe && msg.senderName && <div className="text-[10px] font-bold mb-1 opacity-70">{msg.senderName}</div>}
                        {msg.content}
                        <div className={`text-[9px] mt-1 text-right ${isMe ? 'text-primary-foreground/70' : 'text-gray-400'}`}>
                           {msg.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </div>
                      </div>
                    </div>
                  )
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area - Disable khi WAITING_STAFF */}
              <div className="p-3 border-t bg-background flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                  // [NEW] Disable
                  disabled={chatStatus === 'WAITING_STAFF' || loading}
                  placeholder={chatStatus === 'WAITING_STAFF' ? "Đang chờ nhân viên..." : "Nhập tin nhắn..."}
                  className="flex-1 px-4 py-2 border rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-background disabled:opacity-60 disabled:cursor-not-allowed"
                />
                <button
                  onClick={handleSend}
                  // [NEW] Disable
                  disabled={!input.trim() || loading || chatStatus === 'WAITING_STAFF'}
                  className="bg-primary hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground text-primary-foreground p-2 rounded-full w-10 h-10 flex items-center justify-center transition shadow-sm"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}

export default ChatBox;