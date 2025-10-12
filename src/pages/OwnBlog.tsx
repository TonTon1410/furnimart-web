"use client"

import { useState, useEffect } from "react"
import { Plus, Calendar, X, Trash2, Edit, Eye, EyeOff, Sparkles } from "lucide-react"
import { authService } from "@/service/authService"
import { blogService, type Blog, type CreateBlogPayload, type UpdateBlogPayload } from "@/service/blogService"
import { useNavigate } from "react-router-dom"

interface UserProfile {
  id: string
  fullName: string
}

export default function OwnBlog() {
  const navigate = useNavigate()
  const [myBlogs, setMyBlogs] = useState<Blog[]>([])
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

  // Kiểm tra authentication và lấy thông tin user
  useEffect(() => {
    const checkAuth = async () => {
      if (!authService.isAuthenticated()) {
        alert("Vui lòng đăng nhập để quản lý blog của bạn!")
        navigate("/login")
        return
      }

      try {
        const profile = await authService.getProfile()
        if (profile && profile.id) {
          const userData = {
            id: profile.id,
            fullName: profile.fullName || profile.email || "User",
          }
          console.log("[v0] ✅ User profile loaded:", userData)
          setUser(userData)
        } else {
          // Fallback to getUserId from token
          const userId = authService.getUserId()
          if (userId) {
            console.log("[v0] ⚠️ Using userId from token:", userId)
            setUser({ id: userId, fullName: "User" })
          } else {
            console.error("[v0] ❌ Cannot get user ID")
            navigate("/login")
          }
        }
      } catch (err) {
        console.error("[v0] ❌ Error getting user info:", err)
        const userId = authService.getUserId()
        if (userId) {
          console.log("[v0] ⚠️ Fallback to userId from token:", userId)
          setUser({ id: userId, fullName: "User" })
        } else {
          navigate("/login")
        }
      }
    }

    checkAuth()
  }, [navigate])

  // Lấy danh sách blogs của user
  const fetchMyBlogs = async () => {
    if (!user?.id) return

    try {
      setLoading(true)
      const response = await blogService.getBlogsByUserId(user.id)
      if (response.status === 200) {
        // Sắp xếp theo ngày tạo mới nhất
        const sortedBlogs = response.data.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )
        setMyBlogs(sortedBlogs)
      }
    } catch (err: any) {
      console.error("Lỗi tải blogs:", err)
      alert(err.message || "Có lỗi xảy ra khi tải danh sách blogs")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user?.id) {
      fetchMyBlogs()
    }
  }, [user])

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

      const payload: CreateBlogPayload = {
        name: formData.name.trim(),
        content: formData.content.trim(),
        userId: user.id,
      }

      if (formData.image && formData.image.trim()) {
        payload.image = formData.image.trim()
      }

      const response = await blogService.createBlog(payload)

      if (response.status === 201) {
        alert("Tạo blog thành công!")
        setFormData({ name: "", content: "", image: "" })
        setShowCreateForm(false)
        fetchMyBlogs()
      }
    } catch (err: any) {
      console.error("❌ Lỗi tạo blog:", err)
      alert(err.message || "Có lỗi xảy ra khi tạo blog")
    } finally {
      setCreating(false)
    }
  }

  // Cập nhật blog
  const handleUpdateBlog = async () => {
    if (!editingBlog || !user) return

    if (!formData.name.trim() || !formData.content.trim()) {
      alert("Vui lòng nhập đầy đủ tiêu đề và nội dung!")
      return
    }

    try {
      setCreating(true)
      const payload: UpdateBlogPayload = {
        name: formData.name.trim(),
        content: formData.content.trim(),
        userId: user.id,
        status: editingBlog.status, // Keep current status
        image: formData.image.trim(),
      }

      console.log("[v0] 📤 Updating blog with payload:", payload)
      const response = await blogService.updateBlog(editingBlog.id, payload)

      if (response.status === 200) {
        alert("Cập nhật blog thành công!")
        setFormData({ name: "", content: "", image: "" })
        setEditingBlog(null)
        setShowCreateForm(false)
        fetchMyBlogs()
      }
    } catch (err: any) {
      console.error("[v0] ❌ Update error:", err)
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
        fetchMyBlogs()
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
        fetchMyBlogs()
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

  // Thống kê
  const stats = {
    total: myBlogs.length,
    published: myBlogs.filter((b) => b.status).length,
    hidden: myBlogs.filter((b) => !b.status).length,
  }

  if (!user) {
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
      <div className="bg-primary text-primary-foreground py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-accent/20 opacity-90"></div>
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <Sparkles className="h-8 w-8 text-accent" />
            <span className="text-accent font-semibold tracking-wide uppercase text-sm">Không gian sáng tạo</span>
          </div>
          <h1 className="font-serif text-5xl md:text-6xl font-bold mb-6 text-balance leading-tight">Blog Của Tôi</h1>
          <p className="text-xl text-primary-foreground/80 max-w-2xl text-pretty leading-relaxed">
            Quản lý và chia sẻ những câu chuyện, suy nghĩ và trải nghiệm của bạn với thế giới
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-card rounded-2xl shadow-sm border border-border p-8 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-medium uppercase tracking-wide mb-2">Tổng số blog</p>
                <p className="font-serif text-4xl font-bold text-foreground mt-1">{stats.total}</p>
              </div>
              <div className="h-14 w-14 bg-accent/10 rounded-xl flex items-center justify-center">
                <Calendar className="h-7 w-7 text-accent" />
              </div>
            </div>
          </div>

          <div className="bg-card rounded-2xl shadow-sm border border-border p-8 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-medium uppercase tracking-wide mb-2">Đang hiển thị</p>
                <p className="font-serif text-4xl font-bold text-accent mt-1">{stats.published}</p>
              </div>
              <div className="h-14 w-14 bg-accent/10 rounded-xl flex items-center justify-center">
                <Eye className="h-7 w-7 text-accent" />
              </div>
            </div>
          </div>

          <div className="bg-card rounded-2xl shadow-sm border border-border p-8 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-medium uppercase tracking-wide mb-2">Đã ẩn</p>
                <p className="font-serif text-4xl font-bold text-muted-foreground mt-1">{stats.hidden}</p>
              </div>
              <div className="h-14 w-14 bg-muted rounded-xl flex items-center justify-center">
                <EyeOff className="h-7 w-7 text-muted-foreground" />
              </div>
            </div>
          </div>
        </div>

        {!showCreateForm && (
          <div className="mb-12">
            <button
              onClick={() => setShowCreateForm(true)}
              className="flex items-center gap-3 bg-primary text-primary-foreground px-8 py-4 rounded-xl hover:bg-primary/90 transition-all font-semibold shadow-lg hover:shadow-xl hover:scale-105"
            >
              <Plus className="h-5 w-5" />
              Tạo Blog Mới
            </button>
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
                  rows={10}
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
                {formData.image && (
                  <div className="mt-4">
                    <p className="text-xs text-muted-foreground mb-3 uppercase tracking-wide">Xem trước:</p>
                    <img
                      src={formData.image || "/placeholder.svg"}
                      alt="Preview"
                      className="h-40 w-auto rounded-xl border-2 border-border shadow-md"
                      onError={(e) => {
                        ;(e.target as HTMLImageElement).style.display = "none"
                      }}
                    />
                  </div>
                )}
              </div>

              <div className="flex gap-4 pt-6">
                <button
                  onClick={editingBlog ? handleUpdateBlog : handleCreateBlog}
                  disabled={creating}
                  className="flex-1 bg-primary text-primary-foreground py-4 rounded-xl font-semibold hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                >
                  {creating ? "Đang xử lý..." : editingBlog ? "Cập Nhật Blog" : "Tạo Blog"}
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
        ) : myBlogs.length === 0 ? (
          <div className="text-center py-32 bg-gradient-to-br from-card via-background to-accent/5 rounded-3xl shadow-sm border border-border relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(20,184,166,0.05),transparent_50%)]"></div>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(251,146,60,0.05),transparent_50%)]"></div>

            <div className="relative z-10 max-w-2xl mx-auto px-6">
              <div className="inline-flex items-center justify-center w-32 h-32 bg-gradient-to-br from-accent/20 to-secondary/20 rounded-full mb-8 shadow-lg">
                <Sparkles className="h-16 w-16 text-accent" />
              </div>

              <h3 className="font-serif text-4xl font-bold text-foreground mb-4 text-balance">
                Bắt Đầu Hành Trình Viết Blog
              </h3>

              <p className="text-muted-foreground text-lg mb-8 text-pretty leading-relaxed max-w-xl mx-auto">
                Bạn chưa có blog nào. Hãy chia sẻ câu chuyện, kiến thức và trải nghiệm của bạn với thế giới!
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 text-left">
                <div className="bg-card/50 backdrop-blur-sm p-6 rounded-xl border border-border/50">
                  <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
                    <Edit className="h-6 w-6 text-accent" />
                  </div>
                  <h4 className="font-semibold text-foreground mb-2">Viết Tự Do</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Thể hiện suy nghĩ và ý tưởng của bạn một cách tự nhiên nhất
                  </p>
                </div>

                <div className="bg-card/50 backdrop-blur-sm p-6 rounded-xl border border-border/50">
                  <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mb-4">
                    <Eye className="h-6 w-6 text-secondary" />
                  </div>
                  <h4 className="font-semibold text-foreground mb-2">Kiểm Soát</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Quản lý trạng thái hiển thị và chỉnh sửa blog bất cứ lúc nào
                  </p>
                </div>

                <div className="bg-card/50 backdrop-blur-sm p-6 rounded-xl border border-border/50">
                  <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
                    <Sparkles className="h-6 w-6 text-accent" />
                  </div>
                  <h4 className="font-semibold text-foreground mb-2">Chia Sẻ</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Kết nối với cộng đồng và lan tỏa giá trị của bạn
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowCreateForm(true)}
                className="inline-flex items-center gap-3 bg-primary text-primary-foreground px-10 py-5 rounded-xl hover:bg-primary/90 transition-all font-semibold shadow-xl hover:shadow-2xl hover:scale-105 text-lg"
              >
                <Plus className="h-6 w-6" />
                Tạo Blog Đầu Tiên
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {myBlogs.map((blog) => (
              <article
                key={blog.id}
                className="bg-card rounded-2xl shadow-md overflow-hidden hover:shadow-2xl transition-all duration-300 border border-border group"
              >
                {/* Status badge */}
                <div
                  className={`px-5 py-3 flex items-center justify-between ${
                    blog.status ? "bg-accent/10 border-b border-accent/20" : "bg-muted border-b border-border"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {blog.status ? (
                      <>
                        <Eye className="h-4 w-4 text-accent" />
                        <span className="text-xs font-semibold text-accent uppercase tracking-wide">Đang hiển thị</span>
                      </>
                    ) : (
                      <>
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                          Đã ẩn
                        </span>
                      </>
                    )}
                  </div>
                  <button
                    onClick={() => handleToggleStatus(blog.id)}
                    className="text-xs text-accent hover:text-accent/80 font-semibold transition-colors"
                  >
                    Thay đổi
                  </button>
                </div>

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
                  <div className="flex items-center gap-2 text-sm text-muted-foreground pt-5 border-t border-border mb-6">
                    <Calendar className="h-4 w-4" />
                    <span>Tạo: {blogService.formatDate(blog.createdAt)}</span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleEditClick(blog)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-accent bg-accent/10 hover:bg-accent/20 rounded-xl transition-all font-semibold"
                    >
                      <Edit className="h-4 w-4" />
                      Sửa
                    </button>
                    <button
                      onClick={() => handleDeleteBlog(blog.id)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-destructive bg-destructive/10 hover:bg-destructive/20 rounded-xl transition-all font-semibold"
                    >
                      <Trash2 className="h-4 w-4" />
                      Xóa
                    </button>
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
