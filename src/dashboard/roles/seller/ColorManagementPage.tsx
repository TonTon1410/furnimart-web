import React, { useEffect, useState } from "react";
import { Plus, Edit3, Trash2, Loader2, Palette, Search } from "lucide-react";
import colorService, {
  type Color,
  type ColorFormData,
} from "@/service/colorService";
import { useToast } from "@/context/ToastContext";

const ColorManagementPage: React.FC = () => {
  const [colors, setColors] = useState<Color[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingColor, setEditingColor] = useState<Color | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState<ColorFormData>({
    colorName: "",
    hexCode: "#000000",
  });
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    fetchColors();
  }, []);

  const fetchColors = async () => {
    setLoading(true);
    setError(null);
    try {
      const colors = await colorService.getAll();
      setColors(colors);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error?.response?.data?.message || "Lỗi khi tải danh sách màu");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDrawer = (color?: Color) => {
    if (color) {
      setEditingColor(color);
      setFormData({
        colorName: color.colorName,
        hexCode: color.hexCode,
      });
    } else {
      setEditingColor(null);
      setFormData({
        colorName: "",
        hexCode: "#000000",
      });
    }
    setFormError(null);
    setDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    setEditingColor(null);
    setFormData({ colorName: "", hexCode: "#000000" });
    setFormError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitting(true);
    setFormError(null);

    try {
      // Validate hex code format
      if (!/^#[0-9A-F]{6}$/i.test(formData.hexCode)) {
        throw new Error("Mã màu hex không hợp lệ (định dạng: #RRGGBB)");
      }

      if (editingColor) {
        // Update existing color
        await colorService.update(editingColor.id, formData);
      } else {
        // Create new color
        await colorService.create(formData);
      }

      await fetchColors();
      handleCloseDrawer();
    } catch (err: unknown) {
      const error = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      setFormError(
        error?.response?.data?.message || error.message || "Lỗi khi lưu màu"
      );
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa màu này?")) return;

    try {
      await colorService.delete(id);
      await fetchColors();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      showToast({
            type: "error",
            title: "Lỗi",
            description: error?.response?.data?.message || "Lỗi khi xóa màu",
          });
    }
  };

  const normalizeHex = (value: string) => {
    let hex = value.trim().toUpperCase();
    if (!hex.startsWith("#")) hex = "#" + hex;

    // Convert 3-digit to 6-digit hex
    if (/^#[0-9A-F]{3}$/i.test(hex)) {
      hex = `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`;
    }

    return hex;
  };

  const filteredColors = colors.filter(
    (color) =>
      color.colorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      color.hexCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Palette className="h-7 w-7" />
            Quản lý màu sắc
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Tạo và quản lý các màu sắc cho sản phẩm
          </p>
        </div>
        <button
          onClick={() => handleOpenDrawer()}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-5 w-5" />
          Thêm màu mới
        </button>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm kiếm theo tên hoặc mã màu..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {/* Colors Grid */}
      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredColors.length === 0 ? (
            <div className="col-span-full text-center py-12 text-gray-500">
              {searchTerm
                ? "Không tìm thấy màu nào"
                : "Chưa có màu nào. Hãy tạo màu mới!"}
            </div>
          ) : (
            filteredColors.map((color) => (
              <div
                key={color.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-white"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-12 h-12 rounded-lg border-2 border-gray-300 shadow-sm"
                    style={{ backgroundColor: color.hexCode }}
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {color.colorName}
                    </h3>
                    <p className="text-sm text-gray-600 font-mono">
                      {color.hexCode}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleOpenDrawer(color)}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-blue-50 text-blue-700 rounded hover:bg-blue-100 transition-colors text-sm"
                  >
                    <Edit3 className="h-4 w-4" />
                    Sửa
                  </button>
                  <button
                    onClick={() => handleDelete(color.id)}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-red-50 text-red-700 rounded hover:bg-red-100 transition-colors text-sm"
                  >
                    <Trash2 className="h-4 w-4" />
                    Xóa
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Drawer for Create/Edit */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={handleCloseDrawer}
          />

          {/* Drawer */}
          <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl">
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">
                  {editingColor ? "Sửa màu" : "Thêm màu mới"}
                </h2>
              </div>

              {/* Form */}
              <form
                onSubmit={handleSubmit}
                className="flex-1 overflow-y-auto p-6"
              >
                {formError && (
                  <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                    {formError}
                  </div>
                )}

                {/* Color Name */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tên màu *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.colorName}
                    onChange={(e) =>
                      setFormData({ ...formData, colorName: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="VD: Đỏ tươi"
                  />
                </div>

                {/* Hex Code */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mã màu (Hex) *
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      value={formData.hexCode}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          hexCode: normalizeHex(e.target.value),
                        })
                      }
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                      placeholder="#FF0000"
                      pattern="^#[0-9A-Fa-f]{6}$"
                    />
                    <input
                      type="color"
                      value={formData.hexCode}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          hexCode: e.target.value.toUpperCase(),
                        })
                      }
                      className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                      title="Chọn màu"
                      aria-label="Chọn màu"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Định dạng: #RRGGBB (VD: #FF0000 cho màu đỏ)
                  </p>
                </div>

                {/* Color Preview */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Xem trước
                  </label>
                  <div className="flex items-center gap-3">
                    <div
                      className="w-20 h-20 rounded-lg border-2 border-gray-300 shadow-sm"
                      style={{ backgroundColor: formData.hexCode }}
                    />
                    <div>
                      <p className="font-medium text-gray-900">
                        {formData.colorName || "Tên màu"}
                      </p>
                      <p className="text-sm text-gray-600 font-mono">
                        {formData.hexCode}
                      </p>
                    </div>
                  </div>
                </div>
              </form>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-gray-200 flex gap-3">
                <button
                  type="button"
                  onClick={handleCloseDrawer}
                  disabled={formSubmitting}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Hủy
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={formSubmitting}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {formSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Đang lưu...
                    </>
                  ) : (
                    "Lưu"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ColorManagementPage;
