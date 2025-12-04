"use client"

import { Edit, Trash2, Calendar, Eye, EyeOff } from "lucide-react"
import { type Blog, blogService } from "@/service/blogService"

interface BlogCardProps {
  blog: Blog
  canCreate: boolean
  onEdit: (blog: Blog) => void
  onDelete: (id: string) => void
  onToggleStatus: (id: string) => void
}

export function BlogCard({ blog, canCreate, onEdit, onDelete, onToggleStatus }: BlogCardProps) {
  return (
    <article className="bg-card rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 border border-border group">
      <div
        className={`px-4 py-2 flex items-center justify-between ${
          blog.status ? "bg-accent/10 border-b border-accent/20" : "bg-muted border-b border-border"
        }`}
      >
        <div className="flex items-center gap-2">
          {blog.status ? (
            <>
              <Eye className="h-3.5 w-3.5 text-accent" />
              <span className="text-xs font-semibold text-accent uppercase tracking-wide">Đang hiển thị</span>
            </>
          ) : (
            <>
              <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Đã ẩn</span>
            </>
          )}
        </div>
        {canCreate && (
          <button
            onClick={() => onToggleStatus(blog.id)}
            className="text-xs text-accent hover:text-accent/80 font-semibold transition-colors"
          >
            Thay đổi
          </button>
        )}
      </div>

      {blog.image && (
        <div className="h-40 overflow-hidden bg-muted">
          <img
            src={blogService.getSafeImageUrl(blog.image) || "/placeholder.svg"}
            alt={blog.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            onError={(e) => {
              ;(e.target as HTMLImageElement).src =
                'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23f5f2ee" width="400" height="300"/%3E%3Ctext fill="%23999" fontFamily="sans-serif" fontSize="20" dy="10.5" fontWeight="bold" x="50%25" y="50%25" textAnchor="middle"%3EKhông có ảnh%3C/text%3E%3C/svg%3E'
            }}
          />
        </div>
      )}

      <div className="p-5">
        <h3 className="font-serif text-lg font-bold text-foreground mb-3 line-clamp-2 leading-tight group-hover:text-accent transition-colors">
          {blog.name}
        </h3>

        <p className="text-muted-foreground mb-4 line-clamp-2 leading-relaxed text-sm">
          {blogService.truncateContent(blog.content, 100)}
        </p>

        <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-3 border-t border-border mb-4">
          <Calendar className="h-3.5 w-3.5" />
          <span>Tạo: {blogService.formatDate(blog.createdAt)}</span>
        </div>

        {canCreate && (
          <div className="flex gap-2">
            <button
              onClick={() => onEdit(blog)}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-accent bg-accent/10 hover:bg-accent/20 rounded-lg transition-all font-semibold text-xs"
            >
              <Edit className="h-3.5 w-3.5" />
              Sửa
            </button>
            <button
              onClick={() => onDelete(blog.id)}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-destructive bg-destructive/10 hover:bg-destructive/20 rounded-lg transition-all font-semibold text-xs"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Xóa
            </button>
          </div>
        )}
      </div>
    </article>
  )
}
