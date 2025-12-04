"use client"

import { X } from "lucide-react"
import type { Blog } from "@/service/blogService"

interface BlogFormProps {
  formData: {
    name: string
    content: string
    image: string
  }
  editingBlog: Blog | null
  creating: boolean
  onFormChange: (data: any) => void
  onSubmit: () => void
  onCancel: () => void
}

export function BlogForm({ formData, editingBlog, creating, onFormChange, onSubmit, onCancel }: BlogFormProps) {
  return (
    <div className="bg-card rounded-xl shadow-lg p-8 mb-8 border border-border">
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-serif text-2xl font-bold text-foreground">
          {editingBlog ? "Chỉnh Sửa Blog" : "Tạo Blog Mới"}
        </h2>
        <button
          onClick={onCancel}
          className="text-muted-foreground hover:text-foreground transition-colors p-1.5 hover:bg-muted rounded-lg"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="space-y-5">
        <div>
          <label className="block text-xs font-semibold text-foreground mb-2 uppercase tracking-wide">
            Tiêu đề Blog <span className="text-destructive">*</span>
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => onFormChange({ ...formData, name: e.target.value })}
            className="w-full px-4 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-accent focus:border-accent outline-none transition-all bg-background text-foreground text-sm"
            placeholder="Nhập tiêu đề blog..."
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-foreground mb-2 uppercase tracking-wide">
            Nội dung <span className="text-destructive">*</span>
          </label>
          <textarea
            value={formData.content}
            onChange={(e) => onFormChange({ ...formData, content: e.target.value })}
            rows={8}
            className="w-full px-4 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-accent focus:border-accent outline-none resize-none transition-all bg-background text-foreground text-sm leading-relaxed"
            placeholder="Viết nội dung blog của bạn..."
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-foreground mb-2 uppercase tracking-wide">
            URL Hình ảnh
          </label>
          <input
            type="url"
            value={formData.image}
            onChange={(e) => onFormChange({ ...formData, image: e.target.value })}
            className="w-full px-4 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-accent focus:border-accent outline-none transition-all bg-background text-foreground text-sm"
            placeholder="https://example.com/image.jpg"
          />
          {formData.image && (
            <div className="mt-3">
              <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wide">Xem trước:</p>
              <img
                src={formData.image || "/placeholder.svg"}
                alt="Preview"
                className="h-32 w-auto rounded-lg border border-border shadow-md"
                onError={(e) => {
                  ;(e.target as HTMLImageElement).style.display = "none"
                }}
              />
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-4">
          <button
            onClick={onSubmit}
            disabled={creating}
            className="flex-1 bg-primary text-primary-foreground py-2.5 rounded-lg font-semibold hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg text-sm"
          >
            {creating ? "Đang xử lý..." : editingBlog ? "Cập Nhật Blog" : "Tạo Blog"}
          </button>
          <button
            onClick={onCancel}
            className="px-6 py-2.5 border border-border rounded-lg font-semibold hover:bg-muted transition-all text-sm"
          >
            Hủy
          </button>
        </div>
      </div>
    </div>
  )
}
