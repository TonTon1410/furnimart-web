"use client"

import { useState, useEffect } from "react"
import { Plus, User, Calendar, X, Trash2, Edit, Lock, Newspaper, TrendingUp } from "lucide-react"
import { authService } from "@/service/authService"
import { blogService, type Blog, type CreateBlogPayload, type UpdateBlogPayload } from "@/service/blogService"

interface UserProfile {
  id: string
  fullName: string
}

export default function BlogPage() {
  const [allBlogs, setAllBlogs] = useState<Blog[]>([])
  const [filteredBlogs, setFilteredBlogs] = useState<Blog[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [user, setUser] = useState<UserProfile | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    content: "",
    image: "",
  })
  const [creating, setCreating] = useState(false)
  const [editingBlog, setEditingBlog] = useState<Blog | null>(null)

  // Lấy thông tin user
  useEffect(() => {
    const fetchUser = async () => {
      if (!authService.isAuthenticated()) {
        console.log("⚠️ User chưa đăng nhập")
        return
      }
      try {
        const profile = await authService.getProfile()
        console.log("👤 User profile:", profile)
        if (profile) {
          const userData = {
            id: profile.id || "",
            fullName: profile.fullName || profile.email || "User",
          }
          console.log("✅ User data set:", userData)
          setUser(userData)
        }
      } catch (err) {
        console.error("❌ Lỗi lấy thông tin user:", err)
      }
    }
    fetchUser()
  }, [])

  // Lấy danh sách blogs
  const fetchBlogs = async () => {
    try {
      setLoading(true)
      const response = await blogService.getAllBlogs()
      if (response.status === 200) {
        setAllBlogs(response.data)
      }
    } catch (err: any) {
      console.error("Lỗi tải blogs:", err)
      alert(err.message || "Có lỗi xảy ra khi tải danh sách blogs")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBlogs()
  }, [])

  // Filter blogs dựa trên user
  useEffect(() => {
    if (!user) {
      // Guest: chỉ xem blog có status = true
      setFilteredBlogs(allBlogs.filter((blog) => blog.status === true))
    } else {
      // User đã đăng nhập:
      // - Xem tất cả blog của mình (cả ẩn và hiện)
      // - Xem blog status=true của người khác
      setFilteredBlogs(allBlogs.filter((blog) => blog.userId === user.id || blog.status === true))
    }
  }, [allBlogs, user])

  // Tạo blog mới
  const handleCreateBlog = async () => {
    if (!user) {
      alert("Vui lòng đăng nhập để tạo blog!")
      return
    }

    if (!formData.name.trim() || !formData.content.trim()) {
      alert("Vui lòng nhập đầy đủ tiêu đề và nội dung!")
      return
    }

    try {
      setCreating(true)

      // ⚠️ QUAN TRỌNG: Chỉ gửi các field mà API yêu cầu
      const payload: CreateBlogPayload = {
        name: formData.name.trim(),
        content: formData.content.trim(),
        userId: user.id,
      }

      // Chỉ thêm image nếu có giá trị
      if (formData.image && formData.image.trim()) {
        payload.image = formData.image.trim()
      }

      console.log("📝 Payload tạo blog:", payload)
      const response = await blogService.createBlog(payload)
      console.log("✅ Response tạo blog:", response)

      if (response.status === 201) {
        alert("Tạo blog thành công!")
        setFormData({ name: "", content: "", image: "" })
        setShowCreateForm(false)
        fetchBlogs()
      }
    } catch (err: any) {
      console.error("❌ Lỗi tạo blog:", err)
      console.error("❌ Error response:", err.response?.data)
      alert(err.message || "Có lỗi xảy ra khi tạo blog")
    } finally {
      setCreating(false)
    }
  }

  // Cập nhật blog
  const handleUpdateBlog = async () => {
    if (!editingBlog) return

    if (!formData.name.trim() || !formData.content.trim()) {
      alert("Vui lòng nhập đầy đủ tiêu đề và nội dung!")
      return
    }

    try {
      setCreating(true)
      const payload: UpdateBlogPayload = {
        name: formData.name,
        content: formData.content,
        image: formData.image,
      }

      const response = await blogService.updateBlog(editingBlog.id, payload)

      if (response.status === 200) {
        alert("Cập nhật blog thành công!")
        setFormData({ name: "", content: "", image: "" })
        setEditingBlog(null)
        setShowCreateForm(false)
        fetchBlogs()
      }
    } catch (err: any) {
      console.error("Lỗi cập nhật blog:", err)
      alert(err.message || "Có lỗi xảy ra khi cập nhật blog")
    } finally {
      setCreating(false)
    }
  }

  // Xóa blog
  const handleDeleteBlog = async (blogId: string) => {
    if (!confirm("Bạn có chắc muốn xóa blog này?")) return

    try {
      const response = await blogService.deleteBlog(blogId)

      if (response.status === 200) {
        alert("Xóa blog thành công!")
        fetchBlogs()
      }
    } catch (err: any) {
      console.error("Lỗi xóa blog:", err)
      alert(err.message || "Có lỗi xảy ra khi xóa blog")
    }
  }

  // Toggle status blog
  const handleToggleStatus = async (blogId: string) => {
    try {
      const response = await blogService.toggleBlogStatus(blogId)

      if (response.status === 200) {
        alert("Cập nhật trạng thái thành công!")
        fetchBlogs()
      }
    } catch (err: any) {
      console.error("Lỗi toggle status:", err)
      alert(err.message || "Có lỗi xảy ra")
    }
  }

  const handleEditClick = (blog: Blog) => {
    setEditingBlog(blog)
    setFormData({
      name: blog.name,
      content: blog.content,
      image: blog.image || "",
    })
    setShowCreateForm(true)
  }

  const handleCancelEdit = () => {
    setEditingBlog(null)
    setFormData({ name: "", content: "", image: "" })
    setShowCreateForm(false)
  }

  // Kiểm tra xem blog có đang bị ẩn không và user có phải chủ nhân không
  const isHiddenBlog = (blog: Blog) => {
    return !blog.status && user && blog.userId === user.id
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-gradient-to-br from-primary via-primary to-secondary/30 text-primary-foreground py-16 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-48 h-48 bg-accent rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-64 h-64 bg-secondary rounded-full blur-3xl"></div>
        </div>
        <div className="max-w-6xl mx-auto px-6 relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <Newspaper className="h-6 w-6 text-accent" />
            <span className="text-accent font-semibold tracking-wide uppercase text-xs">Khám phá & Chia sẻ</span>
          </div>
          <h1 className="font-serif text-4xl md:text-5xl font-bold mb-4 text-balance leading-tight max-w-3xl">
            Tin Tức & Blog
          </h1>
          <p className="text-lg text-primary-foreground/90 max-w-2xl text-pretty leading-relaxed">
            Khám phá những câu chuyện thú vị, kiến thức bổ ích và trải nghiệm đa dạo từ cộng đồng
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <TrendingUp className="h-5 w-5 text-accent" />
            <h2 className="font-serif text-2xl font-bold text-foreground">Bài viết mới nhất</h2>
          </div>

          {user && !showCreateForm && (
            <button
              onClick={() => setShowCreateForm(true)}
              className="flex items-center gap-2 bg-accent text-accent-foreground px-6 py-2.5 rounded-lg hover:bg-accent/90 transition-all font-semibold shadow-md hover:shadow-lg text-sm"
            >
              <Plus className="h-4 w-4" />
              Tạo Blog Mới
            </button>
          )}
        </div>

        {!user && (
          <div className="mb-8 bg-accent/10 border border-accent/30 rounded-lg p-4">
            <p className="text-accent font-medium text-center text-sm">
              Đăng nhập để tạo blog và quản lý các bài viết của bạn
            </p>
          </div>
        )}

        {showCreateForm && (
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
                  rows={6}
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
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={editingBlog ? handleUpdateBlog : handleCreateBlog}
                  disabled={creating}
                  className="flex-1 bg-primary text-primary-foreground py-2.5 rounded-lg font-semibold hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg text-sm"
                >
                  {creating ? "Đang xử lý..." : editingBlog ? "Cập Nhật" : "Tạo Blog"}
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
        ) : filteredBlogs.length === 0 ? (
          <div className="text-center py-16 bg-card rounded-xl shadow-sm border border-border">
            <Newspaper className="h-16 w-16 text-muted mx-auto mb-4" />
            <p className="text-foreground text-lg font-serif font-bold mb-2">
              {user ? "Chưa có blog nào" : "Chưa có blog nào đang hoạt động"}
            </p>
            <p className="text-muted-foreground text-sm">
              {user ? "Hãy là người đầu tiên tạo blog!" : "Hãy quay lại sau nhé!"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBlogs.map((blog) => (
              <article
                key={blog.id}
                className={`bg-card rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 border group ${
                  isHiddenBlog(blog) ? "border-secondary" : "border-border"
                }`}
              >
                {isHiddenBlog(blog) && (
                  <div className="bg-secondary/10 border-b border-secondary/20 px-4 py-2 flex items-center gap-2">
                    <Lock className="h-3.5 w-3.5 text-secondary" />
                    <span className="text-xs font-semibold text-secondary uppercase tracking-wide">
                      Blog đã ẩn - Chỉ bạn nhìn thấy
                    </span>
                  </div>
                )}

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

                  <div className="flex items-center justify-between pt-3 border-t border-border mb-4">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <User className="h-3.5 w-3.5" />
                      <span>User #{blog.userId.slice(0, 8)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>{blogService.formatDate(blog.createdAt)}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => handleToggleStatus(blog.id)}
                      disabled={!user || !blogService.canEditBlog(blog, user.id)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-all ${
                        blog.status
                          ? "bg-accent/10 text-accent hover:bg-accent/20"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      } ${!user || !blogService.canEditBlog(blog, user.id) ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      {blog.status ? "Đang hiển thị" : "Đã ẩn"}
                    </button>

                    {user && blogService.canEditBlog(blog, user.id) && (
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => handleEditClick(blog)}
                          className="p-1.5 text-accent hover:bg-accent/10 rounded-lg transition-all"
                          title="Chỉnh sửa"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteBlog(blog.id)}
                          className="p-1.5 text-destructive hover:bg-destructive/10 rounded-lg transition-all"
                          title="Xóa"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
