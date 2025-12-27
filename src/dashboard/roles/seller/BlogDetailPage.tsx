"use client"

import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { getBlogById, type Blog, getSafeImageUrl, formatDate } from "@/service/blogService"
import { Calendar, User, ArrowLeft, Clock, Share2, Edit } from "lucide-react"

export default function BlogDetailDashboard() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [blog, setBlog] = useState<Blog | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchBlogDetail = async () => {
      if (!id) return
      try {
        setLoading(true)
        const response = await getBlogById(id)
        const data = response.data || response
        setBlog(data as any)
      } catch (err) {
        console.error("Failed to fetch blog detail", err)
        setError("Không thể tải bài viết. Vui lòng thử lại sau.")
      } finally {
        setLoading(false)
      }
    }

    fetchBlogDetail()
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-gray-200 border-t-blue-600"></div>
          <p className="text-gray-500 text-sm">Đang tải bài viết...</p>
        </div>
      </div>
    )
  }

  if (error || !blog) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white px-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
            <ArrowLeft className="w-8 h-8 text-red-500 opacity-50" />
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Đã có lỗi xảy ra</h2>
          <p className="text-gray-600 mb-6">{error || "Không tìm thấy bài viết"}</p>
          <button
            onClick={() => navigate("/dashboard/blog")}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <ArrowLeft className="w-4 h-4" /> Quay lại danh sách
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <article className="max-w-5xl mx-auto">
        {/* Header with back button */}
        <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-sm border-b border-gray-100 px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate("/dashboard/blog")}
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors font-medium text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Quay lại
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate(`/dashboard/blog/${id}/edit`)}
                className="inline-flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors font-medium text-sm"
              >
                <Edit className="w-4 h-4" />
                Chỉnh sửa
              </button>
            </div>
          </div>
        </div>

        {/* Hero Image */}
        <div className="relative h-96 w-full overflow-hidden bg-gray-200">
          <img
            src={
              getSafeImageUrl(blog.image) ||
              "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&q=80&w=1400"
            }
            alt={blog.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        </div>

        {/* Content Container */}
        <div className="bg-white px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          {/* Title Section */}
          <div className="max-w-3xl mx-auto mb-12">
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6 leading-tight text-balance">
              {blog.name}
            </h1>

            {/* Metadata */}
            <div className="flex flex-wrap items-center gap-6 pb-8 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Tác giả</p>
                  <p className="text-gray-900 font-medium">{blog.employeeName || blog.userName || "Admin"}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Ngày tạo</p>
                  <p className="text-gray-900 font-medium">{blog.createdAt ? formatDate(blog.createdAt) : "N/A"}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Thời gian đọc</p>
                  <p className="text-gray-900 font-medium">5 phút</p>
                </div>
              </div>
            </div>
          </div>

          {/* Article Content */}
          <div className="max-w-3xl mx-auto">
            <div
              className="prose prose-lg max-w-none text-gray-700 leading-relaxed
                prose-headings:text-gray-900 prose-headings:font-bold prose-headings:mt-8 prose-headings:mb-4
                prose-p:mb-6 prose-p:text-base
                prose-strong:text-gray-900 prose-strong:font-semibold
                prose-em:text-gray-800 prose-em:italic
                prose-a:text-blue-600 prose-a:font-medium hover:prose-a:text-blue-700
                prose-img:rounded-lg prose-img:shadow-md prose-img:my-8
                prose-ul:my-6 prose-ul:ml-6 prose-li:text-base prose-li:mb-2
                prose-blockquote:border-l-4 prose-blockquote:border-blue-200 prose-blockquote:bg-blue-50 prose-blockquote:pl-4 prose-blockquote:py-0.5 prose-blockquote:italic prose-blockquote:text-gray-700"
              dangerouslySetInnerHTML={{ __html: blog.content }}
            />
          </div>

          {/* Footer Actions */}
          <div className="max-w-3xl mx-auto mt-16 pt-8 border-t border-gray-200">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <button
                onClick={() => navigate("/dashboard/blog")}
                className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors font-medium"
              >
                <ArrowLeft className="w-4 h-4" />
                Quay lại danh sách bài viết
              </button>

              <button className="inline-flex items-center gap-2 px-4 py-2.5 text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors font-medium">
                <Share2 className="w-4 h-4" />
                Chia sẻ
              </button>
            </div>
          </div>
        </div>
      </article>
    </div>
  )
}
