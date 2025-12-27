"use client"

import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { getBlogById, type Blog, getSafeImageUrl, formatDate } from "@/service/blogService"
import { Calendar, User, ArrowLeft, Clock, Share2 } from "lucide-react"

export default function BlogDetailPage() {
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-200 border-t-amber-600"></div>
      </div>
    )
  }

  if (error || !blog) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 px-4">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-100 mb-6">
            <ArrowLeft className="w-10 h-10 text-red-600" />
          </div>
          <h2 className="text-3xl font-bold text-slate-900 mb-3">Đã có lỗi xảy ra</h2>
          <p className="text-slate-600 mb-8 max-w-md">{error || "Không tìm thấy bài viết"}</p>
          <button
            onClick={() => navigate("/blog")}
            className="inline-flex items-center gap-2 px-8 py-3 bg-amber-600 text-white rounded-xl hover:bg-amber-700 transition-colors font-medium shadow-lg hover:shadow-xl"
          >
            <ArrowLeft className="w-5 h-5" /> Quay lại danh sách
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="relative w-full h-96 md:h-[500px] lg:h-[600px] overflow-hidden group">
        <img
          src={getSafeImageUrl(blog.image) || "/placeholder.svg?height=600&width=1200&query=blog"}
          alt={blog.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent" />

        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-6 left-6 inline-flex items-center gap-2 text-white/90 hover:text-white transition-all duration-300 text-sm font-semibold backdrop-blur-md bg-white/10 hover:bg-white/20 px-4 py-2.5 rounded-full border border-white/20 hover:border-white/40 z-10"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại
        </button>

        {/* Hero Content */}
        <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-10 lg:p-12">
          <div className="text-white">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight text-pretty">{blog.name}</h1>

            <div className="flex flex-wrap items-center gap-6 md:gap-8 text-sm md:text-base text-white/90">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-white/70 text-xs uppercase tracking-wide">Tác giả</span>
                  <p className="font-semibold text-white">{blog.employeeName || blog.userName || "Admin"}</p>
                </div>
              </div>
              <div className="h-8 w-px bg-white/20" />
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-white/70 text-xs uppercase tracking-wide">Ngày đăng</span>
                  <p className="font-semibold text-white">{blog.createdAt ? formatDate(blog.createdAt) : "N/A"}</p>
                </div>
              </div>
              <div className="h-8 w-px bg-white/20" />
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-white/70 text-xs uppercase tracking-wide">Thời gian đọc</span>
                  <p className="font-semibold text-white">5 phút</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 lg:py-20">
        <div className="bg-white">
          <div
            className="prose prose-lg max-w-none
              prose-headings:font-bold prose-headings:text-slate-900 prose-h1:text-4xl prose-h2:text-3xl prose-h3:text-2xl prose-h4:text-xl
              prose-p:text-slate-700 prose-p:leading-relaxed
              prose-a:text-amber-600 prose-a:font-semibold hover:prose-a:text-amber-700
              prose-strong:text-slate-900 prose-strong:font-bold
              prose-em:text-slate-800
              prose-img:rounded-2xl prose-img:shadow-lg prose-img:border prose-img:border-slate-200
              prose-blockquote:border-l-4 prose-blockquote:border-amber-500 prose-blockquote:pl-6 prose-blockquote:italic prose-blockquote:text-slate-600
              prose-code:bg-slate-100 prose-code:text-slate-900 prose-code:px-2 prose-code:py-1 prose-code:rounded prose-code:font-mono prose-code:text-sm
              prose-pre:bg-slate-900 prose-pre:text-white prose-pre:rounded-xl prose-pre:p-6 prose-pre:overflow-x-auto
              prose-li:text-slate-700 prose-li:marker:text-amber-600
              prose-hr:border-slate-200"
            dangerouslySetInnerHTML={{ __html: blog.content }}
          />
        </div>

        <div className="mt-12 md:mt-16 pt-8 md:pt-12 border-t border-slate-200">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <p className="text-slate-600 font-medium mb-2">Bài viết này có hữu ích không?</p>
              <p className="text-slate-500 text-sm">Hãy chia sẻ với những người bạn của bạn</p>
            </div>
            <button className="inline-flex items-center gap-2 px-6 py-3 bg-amber-600 text-white rounded-xl hover:bg-amber-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl">
              <Share2 className="w-5 h-5" /> Chia sẻ
            </button>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-slate-50 to-slate-100 border-t border-slate-200 py-12 md:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-2xl md:text-3xl font-bold text-slate-900 mb-4">Khám phá thêm bài viết</h3>
          <p className="text-slate-600 mb-8 max-w-xl mx-auto">
            Quay lại danh sách blog để xem những bài viết thú vị khác
          </p>
          <button
            onClick={() => navigate("/blog")}
            className="inline-flex items-center gap-2 px-8 py-3 bg-amber-600 text-white rounded-xl hover:bg-amber-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl"
          >
            Xem tất cả bài viết
            <ArrowLeft className="w-5 h-5 rotate-180" />
          </button>
        </div>
      </div>
    </div>
  )
}
