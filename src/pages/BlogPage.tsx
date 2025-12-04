import React, { useEffect, useState } from 'react';
import { getAllBlog, type Blog } from "@/service/blogService";
import { Calendar, User, ArrowRight } from 'lucide-react';

export default function BlogPage() {
    const [blogs, setBlogs] = useState<Blog[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBlogs = async () => {
            try {
                const response = await getAllBlog();
                const data = response.data || response;
                if (Array.isArray(data)) {
                    setBlogs(data);
                } else if (data.content && Array.isArray(data.content)) {
                    setBlogs(data.content);
                } else {
                    setBlogs([]);
                }
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
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">Bài Viết Mới Nhất</h1>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        Khám phá những xu hướng nội thất mới nhất và mẹo trang trí nhà cửa từ chuyên gia của chúng tôi.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {blogs.map((blog) => (
                        <article key={blog.id} className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col h-full border border-gray-100">
                            <div className="relative h-48 overflow-hidden">
                                <img
                                    src={blog.image || "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&q=80&w=800"}
                                    alt={blog.name}
                                    className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-300"
                                />
                                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium text-gray-700 shadow-sm flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {blog.createdAt ? new Date(blog.createdAt).toLocaleDateString('vi-VN') : 'N/A'}
                                </div>
                            </div>

                            <div className="p-6 flex-1 flex flex-col">
                                <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                                    <User className="w-4 h-4" />
                                    <span>{blog.employeeName || blog.userName || "Admin"}</span>
                                </div>

                                <h3
                                    onClick={() => window.location.href = `/blog/${blog.id}`}
                                    className="text-xl font-bold text-gray-900 mb-3 line-clamp-2 hover:text-blue-600 transition-colors cursor-pointer"
                                >
                                    {blog.name}
                                </h3>

                                <div
                                    className="text-gray-600 mb-4 line-clamp-3 text-sm flex-1 prose prose-sm"
                                    dangerouslySetInnerHTML={{ __html: blog.content || '' }}
                                />

                                <div className="mt-auto pt-4 border-t border-gray-100">
                                    <button
                                        onClick={() => window.location.href = `/blog/${blog.id}`}
                                        className="text-blue-600 font-semibold text-sm flex items-center gap-2 hover:gap-3 transition-all group"
                                    >
                                        Đọc tiếp <ArrowRight className="w-4 h-4 group-hover:text-blue-700" />
                                    </button>
                                </div>
                            </div>
                        </article>
                    ))}
                </div>

                {blogs.length === 0 && (
                    <div className="text-center py-12">
                        <p className="text-gray-500 text-lg">Chưa có bài viết nào được đăng tải.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
