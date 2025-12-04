"use client"

import { useState, useEffect } from "react"
import { Plus, Calendar, X, Trash2, Edit, Eye, EyeOff, Sparkles, AlertCircle } from "lucide-react"
import { authService } from "@/service/authService"
import { blogService, type Blog, type CreateBlogPayload, type UpdateBlogPayload } from "@/service/blogService"
import { useNavigate } from "react-router-dom"

interface UserProfile {
  id: string
  fullName: string
  role?: string
}

export default function BlogPage() {
    const [blogs, setBlogs] = useState<Blog[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBlogs = async () => {
            try {
                const response = await getAllBlog();
                const data = response.data || response;
                if (Array.isArray(data)) {
                    setBlogs(data);
                } else if (data.content && Array.isArray(data.content)) {
                    setBlogs(data.content);
                } else {
                    setBlogs([]);
                }
            } catch (error) {
                console.error("Failed to fetch blogs", error);
            } finally {
                setLoading(false);
            }
        };

        fetchBlogs();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-accent border-r-transparent"></div>
          <p className="mt-4 text-muted-foreground">Đang kiểm tra đăng nhập...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-primary text-primary-foreground py-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-secondary/30 opacity-90"></div>
        <div className="max-w-6xl mx-auto px-6 relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <Sparkles className="h-6 w-6 text-accent" />
            <span className="text-accent font-semibold tracking-wide uppercase text-xs">Không gian sáng tạo</span>
          </div>
          <h1 className="font-serif text-4xl md:text-5xl font-bold mb-3 text-balance leading-tight">Blog Của Tôi</h1>
          <p className="text-base text-primary-foreground/90 max-w-2xl text-pretty leading-relaxed">
            Quản lý và chia sẻ những câu chuyện, suy nghĩ và trải nghiệm của bạn với thế giới
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-10">
        {/* ✅ THÔNG BÁO CHO CUSTOMER - ĐẶT TRƯỚC STATS */}
        {isCustomer && (
          <div className="mb-8 bg-yellow-50 border-l-4 border-yellow-400 p-6 rounded-lg shadow-sm">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <AlertCircle className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-yellow-800 mb-2">
                  Quyền truy cập bị hạn chế
                </h3>
                <p className="text-yellow-700 text-sm leading-relaxed mb-3">
                  Bạn đang đăng nhập với vai trò <span className="font-semibold">Khách hàng</span>. 
                  Chức năng tạo và quản lý blog chỉ dành cho <span className="font-semibold">Nhân viên</span> (Admin, Manager, Seller).
                </p>
                <div className="bg-yellow-100 border border-yellow-200 rounded-lg p-3 text-xs text-yellow-800">
                  <p className="font-medium mb-1">💡 Gợi ý:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Nếu bạn là nhân viên, vui lòng đăng nhập bằng tài khoản nhân viên</li>
                    <li>Khách hàng có thể xem blog tại trang <strong>Tin Tức & Blog</strong></li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ✅ STATS - CHỈ HIỂN THỊ CHO EMPLOYEE */}
        {canCreate && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-card rounded-lg shadow-sm border border-border p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide mb-1">Tổng số blog</p>
                  <p className="font-serif text-3xl font-bold text-foreground">{stats.total}</p>
                </div>
                <div className="h-10 w-10 bg-accent/10 rounded-lg flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-accent" />
                </div>
              </div>
            </div>

            <div className="bg-card rounded-lg shadow-sm border border-border p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide mb-1">Đang hiển thị</p>
                  <p className="font-serif text-3xl font-bold text-accent">{stats.published}</p>
                </div>
                <div className="h-10 w-10 bg-accent/10 rounded-lg flex items-center justify-center">
                  <Eye className="h-5 w-5 text-accent" />
                </div>
              </div>
            </div>

            <div className="bg-card rounded-lg shadow-sm border border-border p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide mb-1">Đã ẩn</p>
                  <p className="font-serif text-3xl font-bold text-muted-foreground">{stats.hidden}</p>
                </div>
                <div className="h-10 w-10 bg-muted rounded-lg flex items-center justify-center">
                  <EyeOff className="h-5 w-5 text-muted-foreground" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ✅ NÚT TẠO BLOG - CHỈ CHO EMPLOYEE */}
        {canCreate && !showCreateForm && (
          <div className="mb-8">
            <button
              onClick={() => setShowCreateForm(true)}
              className="flex items-center gap-2 bg-accent text-accent-foreground px-6 py-2.5 rounded-lg hover:bg-accent/90 transition-all font-semibold shadow-md hover:shadow-lg text-sm"
            >
              <Plus className="h-4 w-4" />
              Tạo Blog Mới
            </button>
          </div>
        )}

        {/* ✅ FORM TẠO/SỬA BLOG - CHỈ CHO EMPLOYEE */}
        {canCreate && showCreateForm && (
          <div className="bg-card rounded-xl shadow-lg p-8 mb-8 border border-border">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-serif text-2xl font-bold text-foreground">
                {editingBlog ? "Chỉnh Sửa Blog" : "Tạo Blog Mới"}
              </h2>
              <button
                onClick={handleCancelEdit}
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
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
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
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
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
                  onClick={editingBlog ? handleUpdateBlog : handleCreateBlog}
                  disabled={creating}
                  className="flex-1 bg-primary text-primary-foreground py-2.5 rounded-lg font-semibold hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg text-sm"
                >
                  {creating ? "Đang xử lý..." : editingBlog ? "Cập Nhật Blog" : "Tạo Blog"}
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="px-6 py-2.5 border border-border rounded-lg font-semibold hover:bg-muted transition-all text-sm"
                >
                  Hủy
                </button>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-16">
            <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-accent border-r-transparent"></div>
            <p className="mt-4 text-muted-foreground text-sm">Đang tải blogs...</p>
          </div>
        ) : myBlogs.length === 0 ? (
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
                  ? "Bạn cần đăng nhập với tài khoản nhân viên để sử dụng chức năng quản lý blog."
                  : "Bạn chưa có blog nào. Hãy chia sẻ câu chuyện, kiến thức và trải nghiệm của bạn với thế giới!"
                }
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

                            <div className="p-6 flex-1 flex flex-col">
                                <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                                    <User className="w-4 h-4" />
                                    <span>{blog.employeeName || blog.userName || "Admin"}</span>
                                </div>

                                <h3
                                    onClick={() => window.location.href = `/blog/${blog.id}`}
                                    className="text-xl font-bold text-gray-900 mb-3 line-clamp-2 hover:text-blue-600 transition-colors cursor-pointer"
                                >
                                    {blog.name}
                                </h3>

                                <div
                                    className="text-gray-600 mb-4 line-clamp-3 text-sm flex-1 prose prose-sm"
                                    dangerouslySetInnerHTML={{ __html: blog.content || '' }}
                                />

                                <div className="mt-auto pt-4 border-t border-gray-100">
                                    <button
                                        onClick={() => window.location.href = `/blog/${blog.id}`}
                                        className="text-blue-600 font-semibold text-sm flex items-center gap-2 hover:gap-3 transition-all group"
                                    >
                                        Đọc tiếp <ArrowRight className="w-4 h-4 group-hover:text-blue-700" />
                                    </button>
                                </div>
                            </div>
                        </article>
                    ))}
                </div>

                {blogs.length === 0 && (
                    <div className="text-center py-12">
                        <p className="text-gray-500 text-lg">Chưa có bài viết nào được đăng tải.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
