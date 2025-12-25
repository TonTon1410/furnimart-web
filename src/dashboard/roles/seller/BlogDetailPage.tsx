import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getBlogById, type Blog, getSafeImageUrl, formatDate } from "@/service/blogService";
import { Calendar, User, ArrowLeft, Clock } from "lucide-react";

export default function BlogDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [blog, setBlog] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBlogDetail = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const response = await getBlogById(id);
        const data = response.data || response;
        setBlog(data as any);
      } catch (err) {
        console.error("Failed to fetch blog detail", err);
        setError("Không thể tải bài viết. Vui lòng thử lại sau.");
      } finally {
        setLoading(false);
      }
    };

    fetchBlogDetail();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (error || !blog) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Đã có lỗi xảy ra</h2>
          <p className="text-gray-600 mb-6">{error || "Không tìm thấy bài viết"}</p>
          <button
            onClick={() => navigate('/dashboard/blogs')}
            className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Quay lại danh sách
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <article className="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
        <div className="relative h-64 md:h-96 w-full">
          <img
            src={getSafeImageUrl(blog.image) || "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&q=80&w=1200"}
            alt={blog.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 text-white">
            <button
              onClick={() => navigate(-1)}
              className="mb-4 inline-flex items-center gap-2 text-white/80 hover:text-white transition-colors text-sm font-medium backdrop-blur-sm bg-white/10 px-3 py-1.5 rounded-lg hover:bg-white/20"
            >
              <ArrowLeft className="w-4 h-4" /> Quay lại
            </button>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 leading-tight">{blog.name}</h1>
            <div className="flex flex-wrap items-center gap-4 md:gap-6 text-sm md:text-base text-white/90">
              <div className="flex items-center gap-2">
                <div className="p-1 bg-white/20 rounded-full">
                  <User className="w-4 h-4" />
                </div>
                <span className="font-medium">{blog.employeeName || blog.userName || "Admin"}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="p-1 bg-white/20 rounded-full">
                  <Calendar className="w-4 h-4" />
                </div>
                <span>{blog.createdAt ? formatDate(blog.createdAt) : 'N/A'}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="p-1 bg-white/20 rounded-full">
                  <Clock className="w-4 h-4" />
                </div>
                <span>5 phút đọc</span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 md:p-10 lg:p-12">
          <div
            className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-a:text-blue-600 hover:prose-a:text-blue-700 prose-img:rounded-xl"
            dangerouslySetInnerHTML={{ __html: blog.content }}
          />
        </div>
      </article>
    </div>
  );
}
