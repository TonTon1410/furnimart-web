"use client"

interface StaffActionsProps {
  staffMode: "AI" | "WAITING_STAFF" | "STAFF_CONNECTED"
  loading: boolean
  onRequestStaff: () => void
  onEndStaffChat: () => void
}

export function StaffActions({ staffMode, loading, onRequestStaff, onEndStaffChat }: StaffActionsProps) {
  if (staffMode === "AI") {
    return (
      <div className="p-3 border-t bg-muted/50 flex gap-2">
        <button
          onClick={onRequestStaff}
          disabled={loading}
          className="flex-1 px-4 py-2.5 text-sm bg-green-600 hover:bg-green-700 disabled:bg-muted disabled:text-muted-foreground text-white rounded-lg transition font-medium"
        >
          {loading ? "Đang gửi..." : "🙋 Yêu cầu nhân viên hỗ trợ"}
        </button>
      </div>
    )
  }

  if (staffMode === "WAITING_STAFF") {
    return (
      <div className="p-3 border-t bg-yellow-50 dark:bg-yellow-950/30 flex items-center gap-3">
        <div className="flex-1 flex items-center gap-2 text-sm text-yellow-700 dark:text-yellow-400">
          <span className="animate-spin">⏳</span>
          Đang chờ nhân viên kết nối...
        </div>
        <button
          onClick={onEndStaffChat}
          disabled={loading}
          className="px-4 py-2 text-sm bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-lg transition"
        >
          Hủy
        </button>
      </div>
    )
  }

  if (staffMode === "STAFF_CONNECTED") {
    return (
      <div className="p-3 border-t bg-green-50 dark:bg-green-950/30 flex items-center gap-3">
        <div className="flex-1 flex items-center gap-2 text-sm text-green-700 dark:text-green-400">
          <span className="w-2 h-2 rounded-full bg-green-500"></span>
          Nhân viên đã kết nối
        </div>
        <button
          onClick={onEndStaffChat}
          disabled={loading}
          className="px-4 py-2 text-sm bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-lg transition"
        >
          Kết thúc
        </button>
      </div>
    )
  }

  return null
}
