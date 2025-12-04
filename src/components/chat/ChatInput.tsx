"use client"

import { Send } from "lucide-react"

interface ChatInputProps {
  input: string
  onInputChange: (value: string) => void
  onSend: () => void
  disabled?: boolean
  placeholder?: string
}

export function ChatInput({
  input,
  onInputChange,
  onSend,
  disabled,
  placeholder = "Nhập tin nhắn...",
}: ChatInputProps) {
  return (
    <div className="p-4 border-t bg-background flex gap-3">
      <input
        type="text"
        value={input}
        onChange={(e) => onInputChange(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && onSend()}
        placeholder={placeholder}
        disabled={disabled}
        className="flex-1 px-4 py-2.5 border rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-background disabled:opacity-50"
      />
      <button
        onClick={onSend}
        disabled={!input.trim() || disabled}
        className="bg-primary hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground text-primary-foreground p-2.5 rounded-full w-10 h-10 flex items-center justify-center transition shadow-sm"
      >
        <Send className="w-4 h-4" />
      </button>
    </div>
  )
}
