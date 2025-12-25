import { useState, useRef, useEffect, useCallback } from "react";
import { format } from "date-fns";
import {
  Send,
  MoreVertical,
  Trash2,
  Edit2,
  X,
  Search,
  ArrowDown,
  Bot,
  Lock,
} from "lucide-react";
import type { ChatSession, ChatMessage } from "@/types/chat";

interface ChatDetailProps {
  chat: ChatSession;
  messages: ChatMessage[];
  currentUserId: string;
  onSendMessage: (content: string) => void;
  onEditMessage: (messageId: string, content: string) => void;
  onDeleteMessage: (messageId: string) => void;
  onSearchMessages: (query: string) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  loading?: boolean;
  sendingMessage?: boolean;
  showSearchBar?: boolean;
  onCloseSearch?: () => void;
}

function MessageDropdown({
  isOwn,
  onEdit,
  onDelete,
}: {
  isOwn: boolean;
  onEdit?: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      )
        setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  return (
    <div
      ref={dropdownRef}
      className="relative opacity-0 group-hover:opacity-100 transition-opacity"
    >
      <button
        onClick={() => setOpen(!open)}
        className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400"
      >
        <MoreVertical className="w-4 h-4" />
      </button>
      {open && (
        <div
          className={`absolute ${
            isOwn ? "right-0" : "left-0"
          } top-full mt-1 w-24 bg-white dark:bg-gray-900 border rounded shadow-lg z-50 py-1`}
        >
          {isOwn && onEdit && (
            <button
              onClick={() => {
                onEdit();
                setOpen(false);
              }}
              className="w-full px-3 py-2 text-left text-xs hover:bg-gray-100 flex gap-2"
            >
              <Edit2 className="w-3 h-3" /> Sửa
            </button>
          )}
          <button
            onClick={() => {
              onDelete();
              setOpen(false);
            }}
            className="w-full px-3 py-2 text-left text-xs hover:bg-gray-100 text-red-600 flex gap-2"
          >
            <Trash2 className="w-3 h-3" /> Xóa
          </button>
        </div>
      )}
    </div>
  );
}

export function ChatDetail({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
  showSearchBar = false,
  onCloseSearch,
}: ChatDetailProps) {
  const [input, setInput] = useState("");
  const [editingMessage, setEditingMessage] = useState<ChatMessage | null>(
    null
  );
  const [editContent, setEditContent] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showScrollButton, setShowScrollButton] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  // Ref để kiểm soát việc auto-scroll lần đầu
  const isFirstLoad = useRef(true);

  // Hàm cuộn xuống đáy thuần túy
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // LOGIC CUỘN THÔNG MINH (SMART SCROLL)
  useEffect(() => {
    // 1. Luôn cuộn xuống khi mới load component lần đầu
    if (isFirstLoad.current && messages.length > 0) {
      scrollToBottom();
      isFirstLoad.current = false;
      return;
    }

    // 2. Logic khi có tin nhắn mới update
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      const isOwnMessage = lastMessage.senderId === currentUserId;

      // Nếu là tin nhắn của CHÍNH MÌNH vừa gửi -> Cuộn xuống
      if (isOwnMessage) {
        scrollToBottom();
        return;
      }

      // Nếu người dùng ĐANG Ở ĐÁY (hoặc gần đáy) -> Cuộn theo tin nhắn mới
      if (messagesContainerRef.current) {
        const { scrollTop, scrollHeight, clientHeight } =
          messagesContainerRef.current;
        const isNearBottom = scrollHeight - scrollTop - clientHeight < 150; // 150px ngưỡng

        if (isNearBottom) {
          scrollToBottom();
        }
      }
    }
  }, [messages, currentUserId, scrollToBottom]);

  // Reset flag first load khi đổi chat khác
  useEffect(() => {
    isFirstLoad.current = true;
  }, [chat.id]);

  const handleScroll = () => {
    if (!messagesContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } =
      messagesContainerRef.current;
    setShowScrollButton(scrollHeight - scrollTop - clientHeight > 100);
  };

  const handleSend = () => {
    if (!input.trim() || sendingMessage) return;
    onSendMessage(input.trim());
    setInput("");
  };
  const handleEdit = () => {
    if (!editingMessage || !editContent.trim()) return;
    onEditMessage(editingMessage.id, editContent.trim());
    setEditingMessage(null);
    setEditContent("");
  };
  const startEditing = (message: ChatMessage) => {
    setEditingMessage(message);
    setEditContent(message.content);
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-950 relative overflow-hidden">
      {/* 1. THANH TÌM KIẾM (Overlay) */}
      {showSearchBar && (
        <div className="absolute top-0 left-0 right-0 z-20 p-2 border-b bg-white dark:bg-gray-900 animate-in slide-in-from-top-2 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              autoFocus
              type="text"
              placeholder="Tìm tin nhắn..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                onSearchMessages(e.target.value);
              }}
              className="w-full pl-9 pr-4 py-1.5 text-sm border rounded-full focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={onCloseSearch}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      )}

      {/* 2. DANH SÁCH TIN NHẮN (Cuộn) */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 min-h-0 overflow-y-auto p-4 space-y-1 bg-white dark:bg-gray-900 scroll-smooth"
      >
        {hasMore && onLoadMore && (
          <div className="text-center py-2">
            <button
              onClick={onLoadMore}
              disabled={loading}
              className="text-xs text-blue-600 hover:underline"
            >
              {loading ? "Đang tải..." : "Xem cũ hơn"}
            </button>
          </div>
        )}

        {messages.map((msg, index) => {
          const isOwn =
            msg.isOwnMessage !== undefined
              ? msg.isOwnMessage
              : msg.senderId === currentUserId;
          const isNextMessageFromSameUser =
            messages[index + 1]?.senderId === msg.senderId;
          const showTime =
            index === messages.length - 1 ||
            (messages[index + 1] &&
              new Date(messages[index + 1].createdAt).getTime() -
                new Date(msg.createdAt).getTime() >
                300000);

          return (
            <div
              key={msg.id}
              className={`flex w-full ${
                isOwn ? "justify-end" : "justify-start"
              } group mb-1`}
            >
              {!isOwn && (
                <div
                  className={`w-8 h-8 mr-2 shrink-0 flex items-end ${
                    isNextMessageFromSameUser ? "invisible" : ""
                  }`}
                >
                  {msg.senderAvatar ? (
                    <img
                      src={msg.senderAvatar}
                      alt="ava"
                      className="w-8 h-8 rounded-full object-cover border"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-500">
                      {msg.senderName?.charAt(0).toUpperCase() || "U"}
                    </div>
                  )}
                </div>
              )}
              <div
                className={`flex flex-col max-w-[70%] ${
                  isOwn ? "items-end" : "items-start"
                }`}
              >
                {!isOwn &&
                  (index === 0 ||
                    messages[index - 1]?.senderId !== msg.senderId) && (
                    <span className="text-[10px] text-gray-500 ml-1 mb-0.5">
                      {msg.senderName}
                    </span>
                  )}
                <div className="flex items-center gap-2">
                  {isOwn && (
                    <MessageDropdown
                      isOwn={true}
                      onEdit={() => startEditing(msg)}
                      onDelete={() => onDeleteMessage(msg.id)}
                    />
                  )}
                  <div
                    className={`px-3.5 py-2 text-[15px] shadow-sm wrap-break-word leading-snug ${
                      isOwn
                        ? "bg-blue-600 text-white rounded-2xl rounded-tr-sm"
                        : "bg-gray-100 text-gray-900 rounded-2xl rounded-tl-sm"
                    } ${
                      msg.isDeleted ? "italic opacity-60 bg-gray-50 border" : ""
                    }`}
                  >
                    {msg.content}
                    {msg.isEdited && (
                      <span className="text-[10px] opacity-70 ml-1 block text-right">
                        đã sửa
                      </span>
                    )}
                  </div>
                  {!isOwn && (
                    <MessageDropdown
                      isOwn={false}
                      onDelete={() => onDeleteMessage(msg.id)}
                    />
                  )}
                </div>
                {showTime && (
                  <span className="text-[10px] text-gray-400 mt-0.5 px-1 select-none">
                    {format(new Date(msg.createdAt), "HH:mm")}
                  </span>
                )}
              </div>
            </div>
          );
        })}

        {messages.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <Bot className="w-12 h-12 mb-3 opacity-20" />
            <p className="text-sm">Chưa có tin nhắn nào</p>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {showScrollButton && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-24 right-6 w-9 h-9 rounded-full bg-white border shadow flex items-center justify-center hover:bg-gray-50 text-blue-600 z-10"
        >
          <ArrowDown className="w-4 h-4" />
        </button>
      )}

      {/* 3. Ô NHẬP LIỆU & SỬA */}
      {/* THAY ĐỔI Ở ĐÂY: Kiểm tra chatMode */}
      {chat.chatMode === "AI" ? (
        <div className="p-5 border-t bg-gray-50 dark:bg-gray-900/50 flex flex-col items-center justify-center gap-2 text-gray-500 shrink-0 z-10 animate-in fade-in duration-300">
          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
            <Lock className="w-5 h-5 text-gray-500" />
          </div>
          <p className="text-sm font-medium">Cuộc trò chuyện đã kết thúc</p>
          <p className="text-xs text-gray-400">
            Phiên hỗ trợ này đã được đóng và chuyển về chế độ AI.
          </p>
        </div>
      ) : editingMessage ? (
        <div className="p-3 border-t bg-blue-50 flex items-center gap-2 shrink-0">
          <div className="flex-1">
            <p className="text-xs text-blue-600 font-semibold mb-1">
              Đang chỉnh sửa
            </p>
            <input
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleEdit()}
              autoFocus
              className="w-full px-3 py-1.5 text-sm border rounded bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={handleEdit}
            className="p-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            <Send className="w-4 h-4" />
          </button>
          <button
            onClick={() => setEditingMessage(null)}
            className="p-2 text-gray-500 hover:bg-gray-200 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="p-3 border-t bg-white shrink-0 flex gap-2 items-center z-10">
          <input
            type="text"
            placeholder="Nhập tin nhắn..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            disabled={sendingMessage}
            className="flex-1 px-4 py-2 text-sm border rounded-full bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || sendingMessage}
            className="p-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-300 transition-colors shadow-sm"
          >
            <Send className="w-5 h-5 pl-0.5" />
          </button>
        </div>
      )}
    </div>
  );
}
