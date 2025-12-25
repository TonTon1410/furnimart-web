import React, { useEffect, useState } from 'react';
import { getAllBlog, type Blog, deleteBlog, updateBlog, createBlog } from "@/service/blogService";
import { authService } from "@/service/authService";
import { BlogForm } from "@/components/blog/BlogForm";
import { Plus, Edit, Trash2, Search, FileText, User, Calendar, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from "@/context/ToastContext";

export default function BlogManagementPage() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { showToast } = useToast();
  const navigate = useNavigate();

  // Form state
  const [isCreating, setIsCreating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingBlog, setEditingBlog] = useState<Blog | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    content: "",
    image: ""
  });

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      const response = await getAllBlog();

      const data = response.data || response;

      if (Array.isArray(data)) {
        setBlogs(data);
      } else if (data && typeof data === 'object' && 'content' in data && Array.isArray((data as any).content)) {
        setBlogs((data as any).content);
      } else {
        setBlogs([]);
      }
    } catch (error) {
      console.error("Lỗi khi lấy danh sách blog:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlogs();
  }, []);

  // Handlers
  const handleCreateClick = () => {
    setIsCreating(true);
    setEditingBlog(null);
    setFormData({ name: "", content: "", image: "" });
  };

  const handleEditClick = (blog: Blog) => {
    setIsCreating(false);
    setEditingBlog(blog);
    setFormData({
      name: blog.name,
      content: blog.content,
      image: blog.image
    });
  };

  const handleDeleteClick = async (id: string) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa bài viết này?")) {
      try {
        await deleteBlog(id);
        fetchBlogs();
      } catch (error) {
        console.error("Failed to delete blog", error);
        showToast({
            type: "error",
            title: "Lỗi",
            description: "Không thể xóa bài viết. Vui lòng thử lại.",
          });
      }
    }
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);

      const profile = await authService.getProfile();
      const employeeId = profile?.id;

      if (!employeeId) {
        showToast({
            type: "warning",
            title: "Cảnh báo!",
            description: "Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.",
          });
        return;
      }

      if (isCreating) {
        await createBlog({
          ...formData,
          employeeId: employeeId,
          status: true
        });
      } else if (editingBlog) {
        await updateBlog(editingBlog.id, {
          ...formData,
          employeeId: employeeId,
          status: editingBlog.status
        });
      }

      // Reset and refresh
      setIsCreating(false);
      setEditingBlog(null);
      fetchBlogs();
    } catch (error) {
      console.error("Submit error", error);
      showToast({
            type: "error",
            title: "Lỗi",
            description: "Có lỗi xảy ra khi lưu bài viết.",
          });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    setIsCreating(false);
    setEditingBlog(null);
  };

  // Lọc bài viết theo tìm kiếm
  const filteredBlogs = blogs.filter(blog =>
    blog.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Quản lý bài viết</h1>
            <p className="text-gray-500 text-sm mt-1">Tổng số: {filteredBlogs.length} bài viết</p>
          </div>

          <div className="flex gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm kiếm bài viết..."
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <button
              onClick={handleCreateClick}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition-colors"
            >
              <Plus className="w-4 h-4" /> Thêm mới
            </button>
          </div>
        </div>

        {/* Form Section */}
        {(isCreating || editingBlog) && (
          <BlogForm
            formData={formData}
            editingBlog={editingBlog}
            creating={submitting}
            onFormChange={setFormData}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
          />
        )}

        {/* Table Content */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-gray-500">Đang tải dữ liệu...</div>
          ) : filteredBlogs.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center text-gray-500">
              <FileText className="w-12 h-12 text-gray-300 mb-3" />
              <p>Chưa có bài viết nào.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-600 text-sm border-b border-gray-100">
                    <th className="p-4 font-semibold">Bài viết</th>
                    <th className="p-4 font-semibold">Tác giả</th>
                    <th className="p-4 font-semibold">Trạng thái</th>
                    <th className="p-4 font-semibold">Ngày tạo</th>
                    <th className="p-4 font-semibold text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {filteredBlogs.map((blog) => (
                    <tr key={blog.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {blog.image ? (
                            <img src={blog.image} alt={blog.name} className="w-12 h-12 rounded-lg object-cover border border-gray-100" />
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400">
                              <FileText className="w-6 h-6" />
                            </div>
                          )}
                          <div className="max-w-xs">
                            <p className="font-medium text-gray-800 line-clamp-1" title={blog.name}>{blog.name}</p>
                            <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{blog.content?.replace(/<[^>]+>/g, '') || "No content"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2 text-gray-600">
                          <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs">
                            <User className="w-3 h-3" />
                          </div>
                          <span>{blog.employeeName || "Unknown"}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${blog.status
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                          }`}>
                          {blog.status ? 'Public' : 'Draft'}
                        </span>
                      </td>
                      <td className="p-4 text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {blog.createdAt ? new Date(blog.createdAt).toLocaleDateString('vi-VN') : 'N/A'}
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => navigate(`/dashboard/blogs/${blog.id}`)}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                            title="Xem"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEditClick(blog)}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                            title="Chỉnh sửa"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(blog.id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                            title="Xóa"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}