"use client"

import { useState, useEffect } from "react"
import { Plus, Calendar, X, Trash2, Edit, Eye, EyeOff, Sparkles, AlertCircle } from "lucide-react"
import { authService } from "@/service/authService"
import { blogService, type Blog, type CreateBlogPayload, type UpdateBlogPayload } from "@/service/blogService"
import { useNavigate } from "react-router-dom"
import BlogEditor from "@/components/blog/BlogEditor"

interface UserProfile {
  id: string
  fullName: string
  role?: string
}

export default function OwnBlog() {
  const navigate = useNavigate()
  const [myBlogs, setMyBlogs] = useState<Blog[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [user, setUser] = useState<UserProfile | null>(null)
  const [role, setRole] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    content: "",
    image: "",
  })
  const [creating, setCreating] = useState(false)
  const [editingBlog, setEditingBlog] = useState<Blog | null>(null)

  useEffect(() => {
    const checkAuth = async () => {
      if (!authService.isAuthenticated()) {
        alert("Vui lòng đăng nhập để quản lý blog của bạn!")
        navigate("/login")
        return
      }

      try {
        const profile = await authService.getProfile()
        console.log("👤 [OwnBlog] User profile:", profile)

        if (profile && profile.id) {
          const userData = {
            id: profile.id,
            fullName: profile.fullName || profile.email || "User",
            role: profile.role || "",
          }
          console.log("✅ [OwnBlog] User data set:", userData)
          setUser(userData)

          try {
            const userRole = authService.getRole?.() ?? null
            console.log("🔑 [OwnBlog] User role:", userRole)
            setRole(userRole)
          } catch (e) {
            console.error("❌ [OwnBlog] Error getting role:", e)
            setRole(null)
          }
        } else {
          const userId = authService.getUserId()
          if (userId) {
            console.log("[OwnBlog] ⚠️ Using userId from token:", userId)
            setUser({ id: userId, fullName: "User" })

            try {
              const userRole = authService.getRole?.() ?? null
              setRole(userRole)
            } catch (e) {
              setRole(null)
            }
          } else {
            console.error("[OwnBlog] ❌ Cannot get user ID")
            navigate("/login")
          }
        }
      } catch (err) {
        console.error("[OwnBlog] ❌ Error getting user info:", err)
        const userId = authService.getUserId()
        if (userId) {
          console.log("[OwnBlog] ⚠️ Fallback to userId from token:", userId)
          setUser({ id: userId, fullName: "User" })

          try {
            const userRole = authService.getRole?.() ?? null
            setRole(userRole)
          } catch (e) {
            setRole(null)
          }
        } else {
          navigate("/login")
        }
      }
    }

    checkAuth()
  }, [navigate])

  const fetchMyBlogs = async () => {
    if (!user?.id) return

    try {
      setLoading(true)
      const response = await blogService.getBlogsByUserId(user.id)
      if (response.status === 200) {
        const sortedBlogs = response.data.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )
        setMyBlogs(sortedBlogs)
      }
    } catch (err: any) {
      console.error("[OwnBlog] Lỗi tải blogs:", err)
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

  const canCreate = !!role && ["admin", "manager", "seller"].includes(role.toLowerCase())
  const isCustomer = role?.toLowerCase() === "customer"

  const handleCreateBlog = async () => {
    if (!user) {
      alert("Vui lòng đăng nhập để tạo blog!")
      return
    }

    if (!canCreate) {
      alert("Bạn không có quyền tạo blog. Chức năng này chỉ dành cho nhân viên!")
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
        status: true,
      }

      if (formData.image && formData.image.trim()) {
        payload.image = formData.image.trim()
      }

      console.log("[OwnBlog] 📤 Creating blog with payload:", payload)
      const response = await blogService.createBlog(payload)

      if (response.status === 201) {
        alert("Tạo blog thành công!")
        setFormData({ name: "", content: "", image: "" })
        setShowCreateForm(false)
        fetchMyBlogs()
      }
    } catch (err: any) {
      console.error("[OwnBlog] ❌ Lỗi tạo blog:", err)
      console.error("[OwnBlog] ❌ Error response:", err.response?.data)

      if (err.response?.data?.message?.includes("User not found")) {
        alert("Lỗi: Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại!")
      } else {
        alert(err.message || "Có lỗi xảy ra khi tạo blog")
      }
    } finally {
      setCreating(false)
    }
  }

  const handleUpdateBlog = async () => {
    if (!editingBlog || !user) return

    if (!canCreate) {
      alert("Bạn không có quyền cập nhật blog!")
      return
    }

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
        status: editingBlog.status,
        image: formData.image.trim(),
      }

      console.log("[OwnBlog] 📤 Updating blog with payload:", payload)
      const response = await blogService.updateBlog(editingBlog.id, payload)

      if (response.status === 200) {
        alert("Cập nhật blog thành công!")
        setFormData({ name: "", content: "", image: "" })
        setEditingBlog(null)
        setShowCreateForm(false)
        fetchMyBlogs()
      }
    } catch (err: any) {
      console.error("[OwnBlog] ❌ Update error:", err)
      alert(err.message || "Có lỗi xảy ra khi cập nhật blog")
    } finally {
      setCreating(false)
    }
  }

  const handleDeleteBlog = async (blogId: string) => {
    if (!confirm("Bạn có chắc muốn xóa blog này?")) return

    try {
      const response = await blogService.deleteBlog(blogId)

      if (response.status === 200) {
        alert("Xóa blog thành công!")
        fetchMyBlogs()
      }
    } catch (err: any) {
      console.error("[OwnBlog] Lỗi xóa blog:", err)
      alert(err.message || "Có lỗi xảy ra khi xóa blog")
    }
  }

  const handleToggleStatus = async (blogId: string) => {
    try {
      const response = await blogService.toggleBlogStatus(blogId)

      if (response.status === 200) {
        alert("Cập nhật trạng thái thành công!")
        fetchMyBlogs()
      }
    } catch (err: any) {
      console.error("[OwnBlog] Lỗi toggle status:", err)
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
        {isCustomer && (
          <div className="mb-8 bg-yellow-50 border-l-4 border-yellow-400 p-6 rounded-lg shadow-sm">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <AlertCircle className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-yellow-800 mb-2">Quyền truy cập bị hạn chế</h3>
                <p className="text-yellow-700 text-sm leading-relaxed mb-3">
                  Bạn đang đăng nhập với vai trò <span className="font-semibold">Khách hàng</span>. Chức năng tạo và
                  quản lý blog chỉ dành cho <span className="font-semibold">Nhân viên</span> (Admin, Manager, Seller).
                </p>
                <div className="bg-yellow-100 border border-yellow-200 rounded-lg p-3 text-xs text-yellow-800">
                  <p className="font-medium mb-1">💡 Gợi ý:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Nếu bạn là nhân viên, vui lòng đăng nhập bằng tài khoản nhân viên</li>
                    <li>
                      Khách hàng có thể xem blog tại trang <strong>Tin Tức & Blog</strong>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

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
                  <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide mb-1">
                    Đang hiển thị
                  </p>
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
                <BlogEditor
                  value={formData.content}
                  onChange={(content) => setFormData({ ...formData, content })}
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
                  : "Bạn chưa có blog nào. Hãy chia sẻ câu chuyện, kiến thức và trải nghiệm của bạn!"}
              </p>

              {!isCustomer && canCreate && (
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-8 py-2.5 rounded-lg hover:bg-primary/90 transition-all font-semibold shadow-lg hover:shadow-xl text-sm"
                >
                  <Plus className="h-4 w-4" />
                  Tạo Blog Đầu Tiên
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myBlogs.map((blog) => (
              <article
                key={blog.id}
                className="bg-card rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 border border-border group"
              >
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
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                          Đã ẩn
                        </span>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleToggleStatus(blog.id)}
                      className="p-1.5 hover:bg-muted rounded-lg transition-all"
                      title={blog.status ? "Ẩn blog" : "Hiển thị blog"}
                    >
                      {blog.status ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-accent" />
                      )}
                    </button>
                    <button
                      onClick={() => handleEditClick(blog)}
                      className="p-1.5 hover:bg-muted rounded-lg transition-all"
                      title="Chỉnh sửa"
                    >
                      <Edit className="h-4 w-4 text-accent" />
                    </button>
                    <button
                      onClick={() => handleDeleteBlog(blog.id)}
                      className="p-1.5 hover:bg-destructive/10 rounded-lg transition-all"
                      title="Xóa"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </button>
                  </div>
                </div>

                {blog.image && (
                  <img
                    src={blogService.getSafeImageUrl(blog.image) || "/placeholder.svg"}
                    alt={blog.name}
                    className="w-full h-48 object-cover"
                  />
                )}

                <div className="p-4">
                  <h3 className="font-serif text-lg font-bold text-foreground mb-2 line-clamp-2 text-balance">
                    {blog.name}
                  </h3>

                  <div
                    className="text-sm text-muted-foreground line-clamp-3 prose prose-sm dark:prose-invert mb-4"
                    dangerouslySetInnerHTML={{
                      __html: blogService.truncateContent(blog.content, 100),
                    }}
                  />

                  <p className="text-xs text-muted-foreground">{blogService.formatDate(blog.createdAt)}</p>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
