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
      <div className="bg-gradient-to-br from-primary via-primary to-accent/20 text-primary-foreground py-32 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-accent rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-secondary rounded-full blur-3xl"></div>
        </div>
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <Newspaper className="h-8 w-8 text-accent" />
            <span className="text-accent font-semibold tracking-wide uppercase text-sm">Khám phá & Chia sẻ</span>
          </div>
          <h1 className="font-serif text-6xl md:text-7xl font-bold mb-8 text-balance leading-tight max-w-4xl">
            Tin Tức & Blog
          </h1>
          <p className="text-2xl text-primary-foreground/90 max-w-3xl text-pretty leading-relaxed">
            Khám phá những câu chuyện thú vị, kiến thức bổ ích và trải nghiệm đa dạng từ cộng đồng
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-12">
          <div className="flex items-center gap-3">
            <TrendingUp className="h-6 w-6 text-accent" />
            <h2 className="font-serif text-3xl font-bold text-foreground">Bài viết mới nhất</h2>
          </div>

          {user && !showCreateForm && (
            <button
              onClick={() => setShowCreateForm(true)}
              className="flex items-center gap-3 bg-primary text-primary-foreground px-8 py-4 rounded-xl hover:bg-primary/90 transition-all font-semibold shadow-lg hover:shadow-xl hover:scale-105"
            >
              <Plus className="h-5 w-5" />
              Tạo Blog Mới
            </button>
          )}
        </div>

        {!user && (
          <div className="mb-12 bg-accent/10 border-2 border-accent/20 rounded-2xl p-6">
            <p className="text-accent font-medium text-center">Đăng nhập để tạo blog và quản lý các bài viết của bạn</p>
          </div>
        )}

        {showCreateForm && (
          <div className="bg-card rounded-2xl shadow-xl p-10 mb-12 border-2 border-accent/20">
            <div className="flex justify-between items-center mb-8">
              <h2 className="font-serif text-3xl font-bold text-foreground">
                {editingBlog ? "Chỉnh Sửa Blog" : "Tạo Blog Mới"}
              </h2>
              <button
                onClick={handleCancelEdit}
                className="text-muted-foreground hover:text-foreground transition-colors p-2 hover:bg-muted rounded-lg"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-8">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-3 uppercase tracking-wide">
                  Tiêu đề Blog <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-5 py-4 border-2 border-border rounded-xl focus:ring-2 focus:ring-accent focus:border-accent outline-none transition-all bg-background text-foreground"
                  placeholder="Nhập tiêu đề blog..."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-3 uppercase tracking-wide">
                  Nội dung <span className="text-destructive">*</span>
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={8}
                  className="w-full px-5 py-4 border-2 border-border rounded-xl focus:ring-2 focus:ring-accent focus:border-accent outline-none resize-none transition-all bg-background text-foreground leading-relaxed"
                  placeholder="Viết nội dung blog của bạn..."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-3 uppercase tracking-wide">
                  URL Hình ảnh
                </label>
                <input
                  type="url"
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  className="w-full px-5 py-4 border-2 border-border rounded-xl focus:ring-2 focus:ring-accent focus:border-accent outline-none transition-all bg-background text-foreground"
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div className="flex gap-4 pt-6">
                <button
                  onClick={editingBlog ? handleUpdateBlog : handleCreateBlog}
                  disabled={creating}
                  className="flex-1 bg-primary text-primary-foreground py-4 rounded-xl font-semibold hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                >
                  {creating ? "Đang xử lý..." : editingBlog ? "Cập Nhật" : "Tạo Blog"}
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="px-10 py-4 border-2 border-border rounded-xl font-semibold hover:bg-muted transition-all"
                >
                  Hủy
                </button>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block h-16 w-16 animate-spin rounded-full border-4 border-solid border-accent border-r-transparent"></div>
            <p className="mt-6 text-muted-foreground text-lg">Đang tải blogs...</p>
          </div>
        ) : filteredBlogs.length === 0 ? (
          <div className="text-center py-24 bg-card rounded-2xl shadow-sm border border-border">
            <Newspaper className="h-20 w-20 text-muted mx-auto mb-6" />
            <p className="text-foreground text-2xl font-serif font-bold mb-3">
              {user ? "Chưa có blog nào" : "Chưa có blog nào đang hoạt động"}
            </p>
            <p className="text-muted-foreground text-lg">
              {user ? "Hãy là người đầu tiên tạo blog!" : "Hãy quay lại sau nhé!"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredBlogs.map((blog) => (
              <article
                key={blog.id}
                className={`bg-card rounded-2xl shadow-md overflow-hidden hover:shadow-2xl transition-all duration-300 border group ${
                  isHiddenBlog(blog) ? "border-secondary" : "border-border"
                }`}
              >
                {/* Hidden blog badge */}
                {isHiddenBlog(blog) && (
                  <div className="bg-secondary/10 border-b border-secondary/20 px-5 py-3 flex items-center gap-2">
                    <Lock className="h-4 w-4 text-secondary" />
                    <span className="text-xs font-semibold text-secondary uppercase tracking-wide">
                      Blog đã ẩn - Chỉ bạn nhìn thấy
                    </span>
                  </div>
                )}

                {/* Image */}
                {blog.image && (
                  <div className="h-56 overflow-hidden bg-muted">
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

                <div className="p-7">
                  {/* Title */}
                  <h3 className="font-serif text-2xl font-bold text-foreground mb-4 line-clamp-2 leading-tight group-hover:text-accent transition-colors">
                    {blog.name}
                  </h3>

                  {/* Content preview */}
                  <p className="text-muted-foreground mb-6 line-clamp-3 leading-relaxed">
                    {blogService.truncateContent(blog.content, 120)}
                  </p>

                  {/* Meta info */}
                  <div className="flex items-center justify-between pt-5 border-t border-border mb-6">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <User className="h-4 w-4" />
                      <span>User #{blog.userId.slice(0, 8)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>{blogService.formatDate(blog.createdAt)}</span>
                    </div>
                  </div>

                  {/* Status & Actions */}
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => handleToggleStatus(blog.id)}
                      disabled={!user || !blogService.canEditBlog(blog, user.id)}
                      className={`px-4 py-2 text-xs font-semibold rounded-full transition-all ${
                        blog.status
                          ? "bg-accent/10 text-accent hover:bg-accent/20"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      } ${!user || !blogService.canEditBlog(blog, user.id) ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      {blog.status ? "Đang hiển thị" : "Đã ẩn"}
                    </button>

                    {user && blogService.canEditBlog(blog, user.id) && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditClick(blog)}
                          className="p-2.5 text-accent hover:bg-accent/10 rounded-lg transition-all"
                          title="Chỉnh sửa"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteBlog(blog.id)}
                          className="p-2.5 text-destructive hover:bg-destructive/10 rounded-lg transition-all"
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
