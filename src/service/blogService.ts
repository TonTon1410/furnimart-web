
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
  employeeId: string
  status?: boolean
  image?: string
}

export interface UpdateBlogPayload {
  name: string
  content: string
  employeeId?: string
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
    const response = await axiosClient.post<ApiResponse<Blog>>("/blogs", payload)
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
    const response = await axiosClient.put<ApiResponse<Blog>>(`/blogs/${blogId}`, payload)
    return response.data
  } catch (error: any) {
    console.error("updateBlog error:", error)
    throw new Error(
      error.response?.data?.message ||
      "Khong the cap nhat blog"
    )
  }
}

