"use client"

import { Sparkles, Plus, Edit, Eye } from "lucide-react"

interface BlogEmptyStateProps {
  isCustomer: boolean
  canCreate: boolean
  onCreateClick: () => void
}

export function BlogEmptyState({ isCustomer, canCreate, onCreateClick }: BlogEmptyStateProps) {
  return (
    <div className="text-center py-16 bg-gradient-to-br from-card via-background to-accent/5 rounded-xl shadow-sm border border-border relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(20,184,166,0.05),transparent_50%)]"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(251,146,60,0.05),transparent_50%)]"></div>

      <div className="relative z-10 max-w-xl mx-auto px-6">
        <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-accent/20 to-secondary/20 rounded-full mb-6 shadow-lg">
          <Sparkles className="h-12 w-12 text-accent" />
        </div>

        <h3 className="font-serif text-2xl font-bold text-foreground mb-3 text-balance">
          {isCustomer ? "Chức năng không khả dụng" : "Bắt Đầu Hành Trình Viết Blog"}
        </h3>

        <p className="text-muted-foreground text-sm mb-6 text-pretty leading-relaxed">
          {isCustomer
            ? "Bạn đang đăng nhập với vai trò Khách hàng. Chức năng này chỉ dành cho Nhân viên."
            : "Bạn chưa có blog nào. Hãy chia sẻ câu chuyện, kiến thức và trải nghiệm của bạn với thế giới!"}
        </p>

        {!isCustomer && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 text-left">
              <div className="bg-card/50 backdrop-blur-sm p-4 rounded-lg border border-border/50">
                <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center mb-3">
                  <Edit className="h-5 w-5 text-accent" />
                </div>
                <h4 className="font-semibold text-foreground mb-1 text-sm">Viết Tự Do</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">Thể hiện suy nghĩ và ý tưởng của bạn</p>
              </div>

              <div className="bg-card/50 backdrop-blur-sm p-4 rounded-lg border border-border/50">
                <div className="w-10 h-10 bg-secondary/10 rounded-lg flex items-center justify-center mb-3">
                  <Eye className="h-5 w-5 text-secondary" />
                </div>
                <h4 className="font-semibold text-foreground mb-1 text-sm">Kiểm Soát</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">Quản lý trạng thái hiển thị</p>
              </div>

              <div className="bg-card/50 backdrop-blur-sm p-4 rounded-lg border border-border/50">
                <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center mb-3">
                  <Sparkles className="h-5 w-5 text-accent" />
                </div>
                <h4 className="font-semibold text-foreground mb-1 text-sm">Chia Sẻ</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">Kết nối với cộng đồng</p>
              </div>
            </div>

            {canCreate && (
              <button
                onClick={onCreateClick}
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-8 py-2.5 rounded-lg hover:bg-primary/90 transition-all font-semibold shadow-lg hover:shadow-xl text-sm"
              >
                <Plus className="h-4 w-4" />
                Tạo Blog Đầu Tiên
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}
