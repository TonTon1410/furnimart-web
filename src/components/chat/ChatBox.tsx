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
import chatService from "@/service/chatService";
import { authService } from "@/service/authService";
import { useToast } from "@/context/ToastContext";

interface Message {
  id: string;
  content: string;
  senderId: string;
  senderName?: string;
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

export function ChatBox() {
  const { showToast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<ChatMode>("selection");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [chatId, setChatId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const loadedChatIdRef = useRef<string | null>(null);

  // AI Room Analyzer states
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [roomAnalysisResult, setRoomAnalysisResult] =
    useState<RoomAnalysisResponse | null>(null);
  const [note, setNote] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load messages function - defined before useEffect hooks that depend on it
  const loadMessages = async () => {
    if (!chatId) return;

    try {
      const chatMessages = await chatService.getChatMessages(chatId);
      const formattedMessages: Message[] = chatMessages.map((msg) => ({
        id: msg.id,
        content: msg.content,
        senderId: msg.senderId,
        senderName: msg.senderName,
        timestamp: new Date(msg.createdAt),
      }));
      setMessages(formattedMessages);
    } catch (error) {
      console.error("Error loading messages:", error);
      // Không hiển thị lỗi cho user nếu chỉ là lỗi load messages
    }
  };

  // Generate or get chatId for AI chat - chỉ chạy khi chuyển sang mode AI
  useEffect(() => {
    if (mode === "ai" && !chatId) {
      // Generate chatId based on userId and timestamp
      const userId = authService.getUserId() || "guest";
      const timestamp = Date.now();
      const generatedChatId = `ai-chat-${userId}-${timestamp}`;
      setChatId(generatedChatId);
    }
  }, [mode, chatId]);

  // Load messages when chatId is available - chỉ load 1 lần khi có chatId mới
  useEffect(() => {
    if (chatId && mode === "ai" && loadedChatIdRef.current !== chatId) {
      loadedChatIdRef.current = chatId;
      loadMessages();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatId, mode]);

  // Polling for new messages - tăng interval lên 10 giây và cleanup khi không cần
  useEffect(() => {
    // Clear interval cũ nếu có
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }

    // Chỉ poll khi chat đang mở, có chatId và đang ở mode AI
    if (chatId && mode === "ai" && isOpen) {
      pollingIntervalRef.current = setInterval(() => {
        loadMessages();
      }, 10000); // Poll every 10 seconds thay vì 3 giây
    }

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatId, mode, isOpen]);

  // Reset khi đóng
  const handleClose = () => {
    setIsOpen(false);
    // Clear polling interval khi đóng
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  };

  const handleBack = () => {
    setMode("selection");
    setMessages([]);
    setChatId(null);
    loadedChatIdRef.current = null;
    // Clear polling interval khi quay lại
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  };

  const handleSelectAI = () => {
    setMode("ai");
    setMessages([]);
    setChatId(null);
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

      const API_BASE_URL =
        import.meta.env.VITE_API_BASE_URL || "https://furnimart.click/api";
      let url = `${API_BASE_URL}/ai/analyze/analyze-room`;
      if (note) {
        url += `?note=${encodeURIComponent(note)}`;
      }

      console.log("🔍 Calling API:", url);
      console.log(
        "📦 FormData - image file:",
        selectedImage.name,
        selectedImage.type,
        selectedImage.size,
        "bytes"
      );

      const response = await fetch(url, {
        method: "POST",
        body: formData,
      });

      console.log("📡 Response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ API Error:", errorText);
        throw new Error(`Phân tích thất bại: ${response.status}`);
      }

      const data = await response.json();
      console.log("✅ API Response:", data);

      if (data.status === 200 && data.data) {
        setRoomAnalysisResult(data.data);
      } else {
        throw new Error(data.message || "Không nhận được kết quả phân tích");
      }
    } catch (error) {
      console.error("💥 Error analyzing room:", error);
      showToast({
        type: "error",
        title: `Không thể phân tích phòng: ${
          error instanceof Error ? error.message : "Lỗi không xác định"
        }`,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetRoomAnalyzer = () => {
    setSelectedImage(null);
    setPreviewUrl(null);
    setRoomAnalysisResult(null);
    setNote("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const handleSelectStaff = () => {
    setMode("staff");
    setMessages([
      {
        id: "welcome-staff",
        content:
          "Xin chào! Vui lòng đợi trong giây lát, nhân viên sẽ hỗ trợ bạn ngay.",
        senderId: "system",
        senderName: "Hệ thống",
        timestamp: new Date(),
      },
    ]);
  };

  const handleSend = async () => {
    if (!input.trim() || !chatId) return;

    const messageContent = input.trim();
    setInput("");
    setLoading(true);

    try {
      if (mode === "ai") {
        // Send message to API
        await chatService.sendMessage({
          content: messageContent,
          chatId: chatId,
          type: "TEXT",
        });

        // Reload messages to show the sent message and AI response
        await loadMessages();
      } else if (mode === "staff") {
        // Staff mode: send message via API
        await chatService.sendMessage({
          content: messageContent,
          chatId: chatId,
          type: "TEXT",
        });
        await loadMessages();
      }
    } catch (error) {
      console.error("Error sending message:", error);
      // Show error to user
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          content: "Không thể gửi tin nhắn. Vui lòng thử lại.",
          senderId: "system",
          senderName: "Hệ thống",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-50 w-12 h-12 sm:w-14 sm:h-14 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-105"
        aria-label={isOpen ? "Đóng chat" : "Mở chat"}
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <MessageCircle className="w-6 h-6" />
        )}
      </button>

      {/* Chat Popup */}
      {isOpen && (
        <div className="fixed bottom-30 right-4 left-4 sm:left-auto sm:bottom-24 sm:right-6 z-50 w-auto sm:w-[360px] max-w-[calc(100vw-2rem)] h-[calc(100vh-10rem)] sm:h-[500px] max-h-[calc(100vh-10rem)] bg-background rounded-2xl shadow-2xl border overflow-hidden flex flex-col animate-in slide-in-from-bottom-4 fade-in duration-200">
          {/* Header */}
          <div
            className={`p-4 border-b text-primary-foreground flex items-center gap-3 ${
              mode === "ai"
                ? "bg-blue-600"
                : mode === "staff"
                ? "bg-green-600"
                : "bg-primary"
            }`}
          >
            {(mode === "ai" || mode === "staff") && (
              <button
                onClick={handleBack}
                className="p-1 hover:bg-white/20 rounded-full transition-colors"
                aria-label="Quay lại"
              >
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
                {mode === "staff" && "Đang kết nối..."}
              </p>
            </div>
            <button
              onClick={handleClose}
              className="p-1 hover:bg-white/20 rounded-full transition-colors"
              aria-label="Đóng"
            >
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
                    Phân Tích Phòng AI
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Gợi ý nội thất
                  </p>
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
                  <p className="text-xs text-muted-foreground">
                    Hỗ trợ trực tiếp
                  </p>
                </div>
              </button>
            </div>
          ) : mode === "ai" ? (
            /* Room Analyzer Mode */
            <div className="flex-1 overflow-y-auto p-4">
              {!roomAnalysisResult ? (
                <div className="space-y-4">
                  <div className="text-center mb-4">
                    <Camera className="w-12 h-12 mx-auto mb-2 text-blue-500" />
                    <p className="text-sm text-muted-foreground">
                      Tải ảnh phòng lên để AI phân tích và gợi ý nội thất
                    </p>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                    aria-label="Chọn ảnh phòng"
                  />

                  {!previewUrl ? (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full border-2 border-dashed border-gray-300 rounded-lg p-8 hover:border-blue-500 transition-colors flex flex-col items-center gap-2"
                    >
                      <Camera className="w-12 h-12 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        Nhấn để chọn ảnh
                      </span>
                    </button>
                  ) : (
                    <div className="space-y-3">
                      <div className="relative rounded-lg overflow-hidden border-2 border-gray-200">
                        <img
                          src={previewUrl}
                          alt="Preview"
                          className="w-full h-48 object-cover"
                        />
                        <button
                          onClick={() => {
                            setSelectedImage(null);
                            setPreviewUrl(null);
                            if (fileInputRef.current) {
                              fileInputRef.current.value = "";
                            }
                          }}
                          className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600"
                          aria-label="Xóa ảnh"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Ghi chú (tùy chọn)
                        </label>
                        <textarea
                          value={note}
                          onChange={(e) => setNote(e.target.value)}
                          placeholder="Thêm ghi chú về phòng..."
                          className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-ring resize-none bg-background"
                          rows={3}
                          disabled={loading}
                        />
                      </div>

                      <button
                        onClick={handleAnalyzeRoom}
                        disabled={loading}
                        className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-muted text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Đang phân tích...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-5 h-5" />
                            Phân tích phòng
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                /* Analysis Results */
                <div className="space-y-4">
                  {previewUrl && (
                    <div className="rounded-lg overflow-hidden border-2 border-gray-200">
                      <img
                        src={previewUrl}
                        alt="Analyzed room"
                        className="w-full h-40 object-cover"
                      />
                    </div>
                  )}

                  {/* Style & Analysis */}
                  <div className="bg-linear-to-r from-blue-50 to-purple-50 rounded-lg p-3 border border-blue-200">
                    <h3 className="font-bold text-sm text-blue-900 mb-2">
                      🎨 Phong cách: {roomAnalysisResult.style}
                    </h3>
                    <p className="text-xs text-gray-700 leading-relaxed">
                      {roomAnalysisResult.analysis}
                    </p>
                  </div>

                  {/* Color Palette */}
                  {roomAnalysisResult.colorPalette &&
                    roomAnalysisResult.colorPalette.length > 0 && (
                      <div className="bg-white rounded-lg p-3 border border-gray-200">
                        <h4 className="font-semibold text-sm mb-2">
                          🎨 Bảng màu phù hợp:
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {roomAnalysisResult.colorPalette.map(
                            (color, index) => (
                              <span
                                key={index}
                                className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium border border-blue-200"
                              >
                                {color}
                              </span>
                            )
                          )}
                        </div>
                      </div>
                    )}

                  {/* Product Suggestions */}
                  {roomAnalysisResult.suggestions &&
                    roomAnalysisResult.suggestions.length > 0 && (
                      <div className="bg-white rounded-lg p-3 border border-gray-200">
                        <h4 className="font-semibold text-sm mb-2">
                          💡 Gợi ý sản phẩm:
                        </h4>
                        <div className="space-y-2">
                          {roomAnalysisResult.suggestions.map((suggestion) => (
                            <div
                              key={suggestion.id}
                              className="border border-gray-200 rounded-lg p-2 hover:shadow-md transition-shadow"
                            >
                              <div className="flex gap-2">
                                {suggestion.thumbnailImage && (
                                  <img
                                    src={suggestion.thumbnailImage}
                                    alt={suggestion.itemName}
                                    className="w-16 h-16 object-cover rounded-lg shrink-0"
                                  />
                                )}
                                <div className="flex-1 min-w-0">
                                  <h5 className="font-semibold text-xs text-gray-900 mb-1">
                                    {suggestion.itemName}
                                  </h5>
                                  <p className="text-xs text-blue-600 font-medium mb-1">
                                    {formatPrice(suggestion.price)}
                                  </p>
                                  {suggestion.recommendedColor && (
                                    <p className="text-[10px] text-gray-600 mb-1">
                                      🎨 {suggestion.recommendedColor}
                                    </p>
                                  )}
                                  <p className="text-[10px] text-gray-600 mb-1">
                                    💡 {suggestion.reason}
                                  </p>
                                  {suggestion.placementAdvice && (
                                    <p className="text-[10px] text-green-600">
                                      📍 {suggestion.placementAdvice}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  {/* Reset Button */}
                  <button
                    onClick={handleResetRoomAnalyzer}
                    className="w-full py-2.5 bg-muted hover:bg-muted/80 rounded-lg font-medium transition-colors text-sm"
                  >
                    🔄 Phân tích ảnh khác
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Staff Chat Mode */
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/30">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${
                      msg.senderId === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[80%] p-3 px-4 rounded-2xl text-sm shadow-sm wrap-break-word ${
                        msg.senderId === "user"
                          ? "bg-primary text-primary-foreground rounded-br-md"
                          : msg.senderId === "system"
                          ? "bg-muted text-muted-foreground rounded-bl-md italic"
                          : "bg-background border text-foreground rounded-bl-md"
                      }`}
                    >
                      {msg.senderId !== "user" && msg.senderName && (
                        <div className="text-xs font-semibold mb-1 opacity-70">
                          {msg.senderName}
                        </div>
                      )}
                      {msg.content}
                    </div>
                  </div>
                ))}

                <div ref={messagesEndRef} />
              </div>

              <div className="p-3 border-t bg-background flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" && !e.shiftKey && handleSend()
                  }
                  placeholder="Nhập tin nhắn..."
                  className="flex-1 px-4 py-2 border rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-background"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || loading}
                  className="bg-primary hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground text-primary-foreground p-2 rounded-full w-10 h-10 flex items-center justify-center transition shadow-sm"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
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
