"use client"

import { useState, useEffect } from "react"
import { Plus } from "lucide-react"
import { authService } from "@/service/authService"
import { blogService, type Blog, type CreateBlogPayload, type UpdateBlogPayload } from "@/service/blogService"
import { useNavigate } from "react-router-dom"
import { BlogHeader } from "@/components/blog/BlogHeader"
import { BlogStats } from "@/components/blog/BlogStats"
import { BlogForm } from "@/components/blog/BlogForm"
import { BlogCard } from "@/components/blog/BlogCard"
import { BlogEmptyState } from "@/components/blog/BlogEmptyState"
import { BlogCustomerAlert } from "@/components/blog/BlogCustomerAlert"

interface UserProfile {
  id: string
  fullName: string
  role?: string
}

export default function OwnBlogPage() {
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
      <BlogHeader />

      <div className="max-w-6xl mx-auto px-6 py-10">
        {isCustomer && <BlogCustomerAlert />}

        {canCreate && <BlogStats total={stats.total} published={stats.published} hidden={stats.hidden} />}

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
          <BlogForm
            formData={formData}
            editingBlog={editingBlog}
            creating={creating}
            onFormChange={setFormData}
            onSubmit={editingBlog ? handleUpdateBlog : handleCreateBlog}
            onCancel={handleCancelEdit}
          />
        )}

        {loading ? (
          <div className="text-center py-16">
            <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-accent border-r-transparent"></div>
            <p className="mt-4 text-muted-foreground text-sm">Đang tải blogs...</p>
          </div>
        ) : myBlogs.length === 0 ? (
          <BlogEmptyState isCustomer={isCustomer} canCreate={canCreate} onCreateClick={() => setShowCreateForm(true)} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myBlogs.map((blog) => (
              <BlogCard
                key={blog.id}
                blog={blog}
                canCreate={canCreate}
                onEdit={handleEditClick}
                onDelete={handleDeleteBlog}
                onToggleStatus={handleToggleStatus}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
