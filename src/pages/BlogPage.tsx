import { useState, useEffect } from 'react';
import { Plus, User, Calendar, X, Trash2, Edit, Lock } from 'lucide-react';
import { authService } from '@/service/authService';
import { blogService, type Blog, type CreateBlogPayload, type UpdateBlogPayload } from '@/service/blogService';

interface UserProfile {
  id: string;
  fullName: string;
}

export default function BlogPage() {
  const [allBlogs, setAllBlogs] = useState<Blog[]>([]);
  const [filteredBlogs, setFilteredBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    content: '',
    image: ''
  });
  const [creating, setCreating] = useState(false);
  const [editingBlog, setEditingBlog] = useState<Blog | null>(null);

  // Lấy thông tin user
  useEffect(() => {
    const fetchUser = async () => {
      if (!authService.isAuthenticated()) {
        console.log('⚠️ User chưa đăng nhập');
        return;
      }
      try {
        const profile = await authService.getProfile();
        console.log('👤 User profile:', profile);
        if (profile) {
          const userData = {
            id: profile.id || '',
            fullName: profile.fullName || profile.email || 'User'
          };
          console.log('✅ User data set:', userData);
          setUser(userData);
        }
      } catch (err) {
        console.error('❌ Lỗi lấy thông tin user:', err);
      }
    };
    fetchUser();
  }, []);

  // Lấy danh sách blogs
  const fetchBlogs = async () => {
    try {
      setLoading(true);
      const response = await blogService.getAllBlogs();
      if (response.status === 200) {
        setAllBlogs(response.data);
      }
    } catch (err: any) {
      console.error('Lỗi tải blogs:', err);
      alert(err.message || 'Có lỗi xảy ra khi tải danh sách blogs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlogs();
  }, []);

  // Filter blogs dựa trên user
  useEffect(() => {
    if (!user) {
      // Guest: chỉ xem blog có status = true
      setFilteredBlogs(allBlogs.filter(blog => blog.status === true));
    } else {
      // User đã đăng nhập:
      // - Xem tất cả blog của mình (cả ẩn và hiện)
      // - Xem blog status=true của người khác
      setFilteredBlogs(
        allBlogs.filter(blog => 
          blog.userId === user.id || blog.status === true
        )
      );
    }
  }, [allBlogs, user]);

  // Tạo blog mới
   const handleCreateBlog = async () => {
    if (!user) {
      alert('Vui lòng đăng nhập để tạo blog!');
      return;
    }

    if (!formData.name.trim() || !formData.content.trim()) {
      alert('Vui lòng nhập đầy đủ tiêu đề và nội dung!');
      return;
    }

    try {
      setCreating(true);
      const payload: CreateBlogPayload = {
        name: formData.name,
        content: formData.content,
        userId: user.id,
        image: formData.image || undefined
      };

      console.log('📝 Payload tạo blog:', payload);
      const response = await blogService.createBlog(payload);
      console.log('✅ Response tạo blog:', response);

      if (response.status === 201) {
        alert('Tạo blog thành công!');
        setFormData({ name: '', content: '', image: '' });
        setShowCreateForm(false);
        fetchBlogs();
      }
    } catch (err: any) {
      console.error('❌ Lỗi tạo blog:', err);
      console.error('❌ Error response:', err.response?.data);
      alert(err.message || 'Có lỗi xảy ra khi tạo blog');
    } finally {
      setCreating(false);
    }
  };

  // Cập nhật blog
  const handleUpdateBlog = async () => {
    if (!editingBlog) return;

    if (!formData.name.trim() || !formData.content.trim()) {
      alert('Vui lòng nhập đầy đủ tiêu đề và nội dung!');
      return;
    }

    try {
      setCreating(true);
      const payload: UpdateBlogPayload = {
        name: formData.name,
        content: formData.content,
        image: formData.image
      };

      const response = await blogService.updateBlog(editingBlog.id, payload);

      if (response.status === 200) {
        alert('Cập nhật blog thành công!');
        setFormData({ name: '', content: '', image: '' });
        setEditingBlog(null);
        setShowCreateForm(false);
        fetchBlogs();
      }
    } catch (err: any) {
      console.error('Lỗi cập nhật blog:', err);
      alert(err.message || 'Có lỗi xảy ra khi cập nhật blog');
    } finally {
      setCreating(false);
    }
  };

  // Xóa blog
  const handleDeleteBlog = async (blogId: string) => {
    if (!confirm('Bạn có chắc muốn xóa blog này?')) return;

    try {
      const response = await blogService.deleteBlog(blogId);

      if (response.status === 200) {
        alert('Xóa blog thành công!');
        fetchBlogs();
      }
    } catch (err: any) {
      console.error('Lỗi xóa blog:', err);
      alert(err.message || 'Có lỗi xảy ra khi xóa blog');
    }
  };

  // Toggle status blog
  const handleToggleStatus = async (blogId: string) => {
    try {
      const response = await blogService.toggleBlogStatus(blogId);

      if (response.status === 200) {
        alert('Cập nhật trạng thái thành công!');
        fetchBlogs();
      }
    } catch (err: any) {
      console.error('Lỗi toggle status:', err);
      alert(err.message || 'Có lỗi xảy ra');
    }
  };

  const handleEditClick = (blog: Blog) => {
    setEditingBlog(blog);
    setFormData({
      name: blog.name,
      content: blog.content,
      image: blog.image || ''
    });
    setShowCreateForm(true);
  };

  const handleCancelEdit = () => {
    setEditingBlog(null);
    setFormData({ name: '', content: '', image: '' });
    setShowCreateForm(false);
  };

  // Kiểm tra xem blog có đang bị ẩn không và user có phải chủ nhân không
  const isHiddenBlog = (blog: Blog) => {
    return !blog.status && user && blog.userId === user.id;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-[#095544] text-white py-16">
        <div className="max-w-7xl mx-auto px-6">
          <h1 className="text-4xl font-bold mb-4">Tin Tức & Blog</h1>
          <p className="text-gray-200">Khám phá những bài viết thú vị từ cộng đồng</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Nút tạo blog - chỉ hiện khi đã đăng nhập */}
        {user && !showCreateForm && (
          <div className="mb-8">
            <button
              onClick={() => setShowCreateForm(true)}
              className="flex items-center gap-2 bg-[#095544] text-white px-6 py-3 rounded-lg hover:bg-[#0a6b55] transition-colors font-semibold"
            >
              <Plus className="h-5 w-5" />
              Tạo Blog Mới
            </button>
          </div>
        )}

        {/* Thông báo cho guest */}
        {!user && (
          <div className="mb-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-800 text-sm">
              Đăng nhập để tạo blog và xem các blog đã ẩn của bạn
            </p>
          </div>
        )}

        {/* Form tạo/sửa blog */}
        {showCreateForm && (
          <div className="bg-white rounded-xl shadow-lg p-8 mb-8 border-2 border-[#095544]">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">
                {editingBlog ? 'Chỉnh Sửa Blog' : 'Tạo Blog Mới'}
              </h2>
              <button
                onClick={handleCancelEdit}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Tiêu đề Blog *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#095544] focus:border-transparent outline-none"
                  placeholder="Nhập tiêu đề blog..."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nội dung *
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#095544] focus:border-transparent outline-none resize-none"
                  placeholder="Viết nội dung blog của bạn..."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  URL Hình ảnh
                </label>
                <input
                  type="url"
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#095544] focus:border-transparent outline-none"
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div className="flex gap-4">
                <button
                  onClick={editingBlog ? handleUpdateBlog : handleCreateBlog}
                  disabled={creating}
                  className="flex-1 bg-[#095544] text-white py-3 rounded-lg font-semibold hover:bg-[#0a6b55] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creating ? 'Đang xử lý...' : editingBlog ? 'Cập Nhật' : 'Tạo Blog'}
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="px-8 py-3 border-2 border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                >
                  Hủy
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Danh sách blogs */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-[#095544] border-r-transparent"></div>
            <p className="mt-4 text-gray-600">Đang tải blogs...</p>
          </div>
        ) : filteredBlogs.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow">
            <p className="text-gray-500 text-lg">
              {user 
                ? 'Chưa có blog nào. Hãy là người đầu tiên tạo blog!' 
                : 'Chưa có blog nào đang hoạt động.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBlogs.map((blog) => (
              <article
                key={blog.id}
                className={`bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 ${
                  isHiddenBlog(blog) ? 'ring-2 ring-yellow-400' : ''
                }`}
              >
                {/* Badge cho blog đã ẩn */}
                {isHiddenBlog(blog) && (
                  <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-2 flex items-center gap-2">
                    <Lock className="h-4 w-4 text-yellow-600" />
                    <span className="text-xs font-semibold text-yellow-700">
                      Blog đã ẩn - Chỉ bạn nhìn thấy
                    </span>
                  </div>
                )}

                {/* Hình ảnh */}
                {blog.image && (
                  <div className="h-48 overflow-hidden bg-gray-200">
                    <img
                      src={blogService.getSafeImageUrl(blog.image)}
                      alt={blog.name}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23ddd" width="400" height="300"/%3E%3Ctext fill="%23999" font-family="sans-serif" font-size="20" dy="10.5" font-weight="bold" x="50%25" y="50%25" text-anchor="middle"%3EKhông có ảnh%3C/text%3E%3C/svg%3E';
                      }}
                    />
                  </div>
                )}

                <div className="p-6">
                  {/* Tiêu đề */}
                  <h3 className="text-xl font-bold text-gray-800 mb-3 line-clamp-2 hover:text-[#095544] transition-colors">
                    {blog.name}
                  </h3>

                  {/* Nội dung rút gọn */}
                  <p className="text-gray-600 mb-4 line-clamp-3">
                    {blogService.truncateContent(blog.content, 120)}
                  </p>

                  {/* Meta info */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <User className="h-4 w-4" />
                      <span>User #{blog.userId.slice(0, 8)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Calendar className="h-4 w-4" />
                      <span>{blogService.formatDate(blog.createdAt)}</span>
                    </div>
                  </div>

                  {/* Status badge & Actions */}
                  <div className="mt-4 flex items-center justify-between">
                    <button
                      onClick={() => handleToggleStatus(blog.id)}
                      disabled={!user || !blogService.canEditBlog(blog, user.id)}
                      className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors ${
                        blog.status
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      } ${
                        !user || !blogService.canEditBlog(blog, user.id)
                          ? 'opacity-50 cursor-not-allowed'
                          : ''
                      }`}
                    >
                      {blog.status ? 'Đang hiển thị' : 'Đã ẩn'}
                    </button>

                    {/* Chỉ hiện nút edit/delete nếu là blog của user hiện tại */}
                    {user && blogService.canEditBlog(blog, user.id) && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditClick(blog)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Chỉnh sửa"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteBlog(blog.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Xóa"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )}
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