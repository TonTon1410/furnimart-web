
import axiosClient from "./axiosClient"

export interface Blog {
  id: string
  name: string
  content: string
  status: boolean
  employeeId: string
  userName?: string
  employeeName?: string
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
  employeeId?: string
  // some callers use `userId` (e.g. OwnBlog). Allow it and map when sending.
  userId?: string
  status?: boolean
  image?: string
}

export interface UpdateBlogPayload {
  name: string
  content: string
  // backend expects `employeeId` but some callers pass `userId`.
  employeeId?: string
  userId?: string
  status?: boolean
  image?: string
}


export const getAllBlog = async () => {
  try {
    const response = await axiosClient.get<ApiResponse<Blog[]>>("/blogs")
    return response.data
  } catch (error: any) {
    console.error("getAllBlog error:", error)
    throw new Error(
      error.response?.data?.message ||
      "Khong the lay danh sach blog"
    )
  }
}


export const deleteBlog = async (blogId: string) => {
  try {
    const response = await axiosClient.delete<ApiResponse<void>>(`/blogs/${blogId}`)
    return response.data
  } catch (error: any) {
    console.error("deleteBlog error:", error)
    throw new Error(
      error.response?.data?.message ||
      "Khong the xoa blog"
    )
  }
}

export const getBlogById = async (blogId: string) => {
  try {
    const response = await axiosClient.get<ApiResponse<Blog>>(`/blogs/${blogId}`)
    return response.data
  } catch (error: any) {
    console.error("getBlogById error:", error)
    throw new Error(
      error.response?.data?.message ||
      "Khong the lay thong tin blog"
    )
  }
}

export const createBlog = async (payload: CreateBlogPayload) => {
  try {
    const { userId, ...rest } = payload as any
    const requestPayload = {
      ...rest,
      employeeId: payload.employeeId ?? userId,
    }

    const response = await axiosClient.post<ApiResponse<Blog>>("/blogs", requestPayload)
    return response.data
  } catch (error: any) {
    console.error("createBlog error:", error)
    throw new Error(
      error.response?.data?.message ||
      "Khong the tao blog"
    )
  }
}

export const updateBlog = async (blogId: string, payload: UpdateBlogPayload) => {
  try {
    const { userId, ...rest } = payload as any
    const requestPayload = {
      ...rest,
      employeeId: payload.employeeId ?? userId,
    }

    const response = await axiosClient.put<ApiResponse<Blog>>(`/blogs/${blogId}`, requestPayload)
    return response.data
  } catch (error: any) {
    console.error("updateBlog error:", error)
    throw new Error(
      error.response?.data?.message ||
      "Khong the cap nhat blog"
    )
  }
}


export const getBlogsByUserId = async (userId: string) => {
  try {
    const response = await axiosClient.get<ApiResponse<Blog[]>>(`/blogs/user/${userId}`)
    return response.data
  } catch (error: any) {
    console.error("getBlogsByUserId error:", error)
    throw new Error(
      error.response?.data?.message ||
      "Khong the lay danh sach blog cua user"
    )
  }
}

export const toggleBlogStatus = async (blogId: string) => {
  try {
    const response = await axiosClient.patch<ApiResponse<void>>(`/blogs/${blogId}/toggle-status`)
    return response.data
  } catch (error: any) {
    console.error("toggleBlogStatus error:", error)
    throw new Error(
      error.response?.data?.message ||
      "Khong the cap nhat trang thai blog"
    )
  }
}


export const getSafeImageUrl = (url?: string) => {
  if (!url) return null
  if (url.startsWith("http")) return url
  return url
}

export const truncateContent = (content: string, maxLength: number) => {
  if (!content) return ""
  const stripped = content.replace(/<[^>]+>/g, "")
  if (stripped.length <= maxLength) return stripped
  return stripped.substring(0, maxLength) + "..."
}

export const formatDate = (dateString: string) => {
  if (!dateString) return ""
  return new Date(dateString).toLocaleDateString("vi-VN")
}

export const blogService = {
  getAllBlog,
  getBlogById,
  createBlog,
  updateBlog,
  deleteBlog,
  getBlogsByUserId,
  toggleBlogStatus,
  getSafeImageUrl,
  truncateContent,
  formatDate
}
