/* eslint-disable @typescript-eslint/no-explicit-any */
// src/service/blogService.ts
import axiosClient from "./axiosClient"

// ───────────────────────────────────────────────
// Interfaces
// ───────────────────────────────────────────────
export interface Blog {
  id: string
  name: string
  content: string
  status: boolean
  userId: string
  userName?: string
  image: string
  createdAt: string
  updatedAt: string
}

interface ApiResponse<T> {
  status: number
  message: string
  data: T
  timestamp?: string
}

export interface CreateBlogPayload {
  name: string
  content: string
  userId: string
  status?: boolean // Added status field for backend compatibility
  image?: string
}

export interface UpdateBlogPayload {
  name: string
  content: string
  userId?: string // Added userId field for backend compatibility
  status?: boolean // Added status field for backend compatibility
  image?: string
}

interface PaginatedResponse<T> {
  content: T[]
  totalPages: number
  totalElements: number
  size: number
  number: number
}

// ───────────────────────────────────────────────
// Blog Service
// ───────────────────────────────────────────────
export const blogService = {
  /**
   * GET /blogs - Lấy tất cả blogs
   */
  getAllBlogs: async (): Promise<ApiResponse<Blog[]>> => {
    try {
      const res = await axiosClient.get<ApiResponse<Blog[]>>("/blogs")
      return res.data
    } catch (error: any) {
      console.error("❌ Lỗi lấy danh sách blogs:", error)
      throw new Error(error.response?.data?.message || "Không thể tải danh sách blogs")
    }
  },

  /**
   * GET /api/blogs/{id} - Lấy blog theo ID
   */
  getBlogById: async (id: string): Promise<ApiResponse<Blog>> => {
    try {
      const res = await axiosClient.get<ApiResponse<Blog>>(`/blogs/${id}`)
      return res.data
    } catch (error: any) {
      console.error(`❌ Lỗi lấy blog ${id}:`, error)
      throw new Error(error.response?.data?.message || "Không thể tải thông tin blog")
    }
  },

  /**
   * GET /blogs/user/{userId} - Lấy blogs của user
   */
  getBlogsByUserId: async (userId: string): Promise<ApiResponse<Blog[]>> => {
    try {
      const res = await axiosClient.get<ApiResponse<Blog[]>>(`/blogs/user/${userId}`)
      return res.data
    } catch (error: any) {
      console.error(`❌ Lỗi lấy blogs của user ${userId}:`, error)
      throw new Error(error.response?.data?.message || "Không thể tải blogs của người dùng")
    }
  },

  /**
   * GET /api/blogs/user/{userId}/paginated - Lấy blogs của user có phân trang
   */
  getBlogsByUserIdPaginated: async (
    userId: string,
    page = 0,
    size = 10,
  ): Promise<ApiResponse<PaginatedResponse<Blog>>> => {
    try {
      const res = await axiosClient.get<ApiResponse<PaginatedResponse<Blog>>>(`/blogs/user/${userId}/paginated`, {
        params: { page, size },
      })
      return res.data
    } catch (error: any) {
      console.error(`❌ Lỗi lấy blogs phân trang của user ${userId}:`, error)
      throw new Error(error.response?.data?.message || "Không thể tải blogs của người dùng (phân trang)")
    }
  },

  /**
   * GET /blogs/status/{status} - Lấy blogs theo status
   */
  getBlogsByStatus: async (status: boolean): Promise<ApiResponse<Blog[]>> => {
    try {
      const res = await axiosClient.get<ApiResponse<Blog[]>>(`/blogs/status/${status}`)
      return res.data
    } catch (error: any) {
      console.error(`❌ Lỗi lấy blogs theo status ${status}:`, error)
      throw new Error(error.response?.data?.message || "Không thể tải blogs theo trạng thái")
    }
  },

  /**
   * GET /api/blogs/paginated - Lấy tất cả blogs có phân trang
   */
  getBlogsPaginated: async (page = 0, size = 10): Promise<ApiResponse<PaginatedResponse<Blog>>> => {
    try {
      const res = await axiosClient.get<ApiResponse<PaginatedResponse<Blog>>>("/blogs/paginated", {
        params: { page, size },
      })
      return res.data
    } catch (error: any) {
      console.error("❌ Lỗi lấy blogs phân trang:", error)
      throw new Error(error.response?.data?.message || "Không thể tải danh sách blogs (phân trang)")
    }
  },

  /**
   * POST /api/blogs - Tạo blog mới
   */
  createBlog: async (payload: CreateBlogPayload): Promise<ApiResponse<Blog>> => {
    try {
      const cleanPayload = {
        name: payload.name.trim(),
        content: payload.content.trim(),
        userId: payload.userId,
        status: payload.status ?? true, // Default to true (visible)
        ...(payload.image && payload.image.trim() ? { image: payload.image.trim() } : {}),
      }

      console.log("[v0] 📤 Creating blog with payload:", cleanPayload)
      const res = await axiosClient.post<ApiResponse<Blog>>("/blogs", cleanPayload)
      console.log("[v0] ✅ Blog created successfully:", res.data)
      return res.data
    } catch (error: any) {
      console.error("[v0] ❌ Create blog error:", error)
      console.error("[v0] ❌ Error response:", error.response?.data)
      throw new Error(error.response?.data?.message || "Không thể tạo blog mới")
    }
  },

  /**
   * PUT /blogs/{id} - Cập nhật blog
   */
  updateBlog: async (id: string, payload: UpdateBlogPayload): Promise<ApiResponse<Blog>> => {
    try {
      const cleanPayload = {
        name: payload.name.trim(),
        content: payload.content.trim(),
        ...(payload.userId ? { userId: payload.userId } : {}),
        ...(payload.status !== undefined ? { status: payload.status } : {}),
        ...(payload.image && payload.image.trim() ? { image: payload.image.trim() } : {}),
      }

      console.log("[v0] 📤 Updating blog:", id, "with payload:", cleanPayload)
      const res = await axiosClient.put<ApiResponse<Blog>>(`/blogs/${id}`, cleanPayload)
      console.log("[v0] ✅ Blog updated successfully:", res.data)
      return res.data
    } catch (error: any) {
      console.error("[v0] ❌ Update blog error:", error)
      console.error("[v0] ❌ Error response:", error.response?.data)
      throw new Error(error.response?.data?.message || "Không thể cập nhật blog")
    }
  },

  /**
   * DELETE /api/blogs/{id} - Xóa blog (soft delete)
   */
  deleteBlog: async (id: string): Promise<ApiResponse<null>> => {
    try {
      const res = await axiosClient.delete<ApiResponse<null>>(`/blogs/${id}`)
      return res.data
    } catch (error: any) {
      console.error(`❌ Lỗi xóa blog ${id}:`, error)
      throw new Error(error.response?.data?.message || "Không thể xóa blog")
    }
  },

  /**
   * PATCH /api/blogs/{id}/toggle-status - Bật/tắt trạng thái blog
   */
  toggleBlogStatus: async (id: string): Promise<ApiResponse<Blog>> => {
    try {
      const res = await axiosClient.patch<ApiResponse<Blog>>(`/blogs/${id}/toggle-status`)
      return res.data
    } catch (error: any) {
      console.error(`❌ Lỗi toggle status blog ${id}:`, error)
      throw new Error(error.response?.data?.message || "Không thể thay đổi trạng thái blog")
    }
  },

  // ───────────────────────────────────────────────
  // Helper functions
  // ───────────────────────────────────────────────

  /**
   * Kiểm tra user có quyền chỉnh sửa blog không
   */
  canEditBlog: (blog: Blog, currentUserId: string | null): boolean => {
    if (!currentUserId) return false
    return blog.userId === currentUserId
  },

  /**
   * Format ngày tháng
   */
  formatDate: (dateStr: string, locale = "vi-VN"): string => {
    return new Date(dateStr).toLocaleDateString(locale, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  },

  /**
   * Format ngày giờ đầy đủ
   */
  formatDateTime: (dateStr: string, locale = "vi-VN"): string => {
    return new Date(dateStr).toLocaleString(locale, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  },

  /**
   * Tạo URL hình ảnh an toàn
   */
  getSafeImageUrl: (imageUrl: string | null | undefined): string => {
    if (!imageUrl) {
      return 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23ddd" width="400" height="300"/%3E%3Ctext fill="%23999" font-family="sans-serif" font-size="20" dy="10.5" font-weight="bold" x="50%25" y="50%25" text-anchor="middle"%3EKhông có ảnh%3C/text%3E%3C/svg%3E'
    }

    if (imageUrl.includes("drive.google.com")) {
      const fileIdMatch = imageUrl.match(/[-\w]{25,}/)
      if (fileIdMatch) {
        return `https://drive.google.com/uc?export=view&id=${fileIdMatch[0]}`
      }
    }

    if (imageUrl.startsWith("http")) {
      return imageUrl
    }

    return `${axiosClient.defaults.baseURL}${imageUrl}`
  },

  /**
   * Rút gọn nội dung
   */
  truncateContent: (content: string, maxLength = 150): string => {
    if (content.length <= maxLength) return content
    return content.substring(0, maxLength) + "..."
  },
}
