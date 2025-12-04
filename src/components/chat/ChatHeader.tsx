"use client"

import Link from "next/link"
import { MessageSquare, Users } from "lucide-react"

interface ChatHeaderProps {
  title: string
  subtitle?: string
  type: "ai" | "staff"
  staffMode?: "AI" | "WAITING_STAFF" | "STAFF_CONNECTED"
  staffInfo?: { staffId?: string; staffName?: string } | null
}

export function ChatHeader({ title, subtitle, type, staffMode, staffInfo }: ChatHeaderProps) {
  return (
    <div className="border-b bg-background">
      {/* Navigation tabs */}
      <div className="flex border-b">
        <Link
          href="/chat/ai"
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
            type === "ai" ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          Chat AI
        </Link>
        <Link
          href="/chat/staff"
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
            type === "staff" ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Users className="w-4 h-4" />
          Chat Nhân viên
        </Link>
      </div>

      {/* Chat info */}
      <div className="p-4 flex items-center justify-between">
        <div>
          <h1 className="font-semibold text-foreground">{title}</h1>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        {type === "staff" && staffMode && (
          <span className="text-xs bg-muted px-3 py-1.5 rounded-full flex items-center gap-1.5">
            {staffMode === "AI" && (
              <>
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>🤖 AI
              </>
            )}
            {staffMode === "WAITING_STAFF" && (
              <>
                <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></span>⏳ Đang chờ NV
              </>
            )}
            {staffMode === "STAFF_CONNECTED" && (
              <>
                <span className="w-2 h-2 rounded-full bg-green-500"></span>👤 {staffInfo?.staffName || "Staff"}
              </>
            )}
          </span>
        )}
      </div>
    </div>
  )
}
