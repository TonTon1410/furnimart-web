"use client"

import { useState, useEffect } from "react"
import { Plus, Calendar, X, Trash2, Edit, Eye, EyeOff, Sparkles } from "lucide-react"
import { authService } from "@/service/authService"
import { blogService, type Blog, type CreateBlogPayload, type UpdateBlogPayload } from "@/service/blogService"
import { useNavigate } from "react-router-dom"

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

  // ✅ Kiểm tra authentication và lấy thông tin user
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
          
          // ✅ Lấy role từ authService
          try {
            const userRole = authService.getRole?.() ?? null
            console.log("🔑 [OwnBlog] User role:", userRole)
            setRole(userRole)
          } catch (e) {
            console.error("❌ [OwnBlog] Error getting role:", e)
            setRole(null)
          }
        } else {
          // Fallback to getUserId from token
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

  // ✅ CHỈ CHO EMPLOYEE (admin, manager, seller) TẠO BLOG
  const canCreate = !!role && ["admin", "manager", "seller"].includes(role.toLowerCase())
  
  // ✅ Kiểm tra xem user có phải là customer không
  const isCustomer = role?.toLowerCase() === "customer"

  // Tạo blog mới
  const handleCreateBlog = async () => {
    if (!user) {
      alert("Vui lòng đăng nhập để tạo blog!")
      return
    }

    // ✅ Kiểm tra role - CHỈ CHO EMPLOYEE
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
        status: true, // Mặc định hiển thị
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
      
      // ✅ Xử lý lỗi "User not found"
      if (err.response?.data?.message?.includes("User not found")) {
        alert("Lỗi: Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại!")
      } else {
        alert(err.message || "Có lỗi xảy ra khi tạo blog")
      }
    } finally {
      setCreating(false)
    }
  }

  // Cập nhật blog
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
        status: editingBlog.status, // Keep current status
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
      console.error("[OwnBlog] Lỗi xóa blog:", err)
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
      <div className="bg-primary text-primary-foreground py-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-secondary/30 opacity-90"></div>
        <div className="max-w-6xl mx-auto px-6 relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <Sparkles className="h-6 w-6 text-accent" />
            <span className="text-accent font-semibold tracking-wide uppercase text-xs">Không gian sáng tạo</span>
          </div>
          <h1 className="font-serif text-4xl md:text-5xl font-bold mb-3 text-balance leading-tight">Blog & Tin Tức</h1>
          <p className="text-base text-primary-foreground/90 max-w-2xl text-pretty leading-relaxed">
            Quản lý và chia sẻ những câu chuyện, suy nghĩ và trải nghiệm của bạn với thế giới
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-10">

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

                  {canCreate && (
                    <button
                      onClick={() => setShowCreateForm(true)}
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
                  {canCreate && (
                    <button
                      onClick={() => handleToggleStatus(blog.id)}
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
                        onClick={() => handleEditClick(blog)}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-accent bg-accent/10 hover:bg-accent/20 rounded-lg transition-all font-semibold text-xs"
                      >
                        <Edit className="h-3.5 w-3.5" />
                        Sửa
                      </button>
                      <button
                        onClick={() => handleDeleteBlog(blog.id)}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-destructive bg-destructive/10 hover:bg-destructive/20 rounded-lg transition-all font-semibold text-xs"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Xóa
                      </button>
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}