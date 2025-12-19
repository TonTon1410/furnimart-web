"use client";

import { useState, useEffect } from "react";
import { Sparkles, ArrowRight, Calendar, User } from "lucide-react";
import {
  getAllBlog,
  type Blog,
  getSafeImageUrl,
  truncateContent,
  formatDate,
} from "@/service/blogService";
import { useNavigate } from "react-router-dom";

export default function BlogPage() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const response = await getAllBlog();
        const responseData = response as any;
        const data = responseData.data || responseData;
        let blogList: Blog[] = [];

        if (Array.isArray(data)) {
          blogList = data;
        } else if (data?.content && Array.isArray(data.content)) {
          blogList = data.content;
        }

        // Filter only public blogs (status === true)
        setBlogs(blogList.filter((b) => b.status));
      } catch (error) {
        console.error("Failed to fetch blogs", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBlogs();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24 sm:pb-20">
      {/* Blog List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        {blogs.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">
              Chưa có bài viết nào được đăng tải.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogs.map((blog) => (
              <article
                key={blog.id}
                className="group bg-card rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-border flex flex-col h-full cursor-pointer"
                onClick={() => navigate(`/blog/${blog.id}`)}
              >
                {/* Image */}
                <div className="relative h-56 overflow-hidden bg-muted">
                  <img
                    src={getSafeImageUrl(blog.image) || "/placeholder.svg"}
                    alt={blog.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                </div>

                {/* Content */}
                <div className="p-6 flex-1 flex flex-col">
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>{formatDate(blog.createdAt)}</span>
                    </div>
                    <span className="w-1 h-1 rounded-full bg-border" />
                    <div className="flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5" />
                      <span>
                        {blog.employeeName || blog.userName || "Admin"}
                      </span>
                    </div>
                  </div>

                  <h3 className="font-serif text-xl font-bold text-foreground mb-3 line-clamp-2 group-hover:text-accent transition-colors">
                    {blog.name}
                  </h3>

                  <p className="text-muted-foreground text-sm line-clamp-3 mb-6 flex-1 leading-relaxed">
                    {truncateContent(blog.content, 150)}
                  </p>

                  <div className="flex items-center text-accent font-semibold text-sm mt-auto group/link">
                    Đọc tiếp
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover/link:translate-x-1" />
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
