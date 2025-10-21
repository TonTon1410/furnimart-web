import React, { useState, useId, useEffect } from "react";
import {
  Loader2,
  CheckCircle2,
  Palette,
  Search,
  RefreshCw,
} from "lucide-react";
import colorService, { type Color } from "@/service/colorService";

export type Status = "ACTIVE" | "INACTIVE";

// Type dữ liệu gửi lên backend
// /api/product-colors link màu có sẵn với product
export type ProductColorRequest = {
  productId: string;
  colorId: string; // UUID của màu (chọn từ danh sách)
  status: Status;
  imageRequests: { imageUrl: string }[]; // 1 màu = 1 ảnh
  model3DRequests?: {
    status: Status;
    modelUrl: string;
    format: "OBJ" | "GLB" | "FBX" | "USDZ";
    sizeInMb: number;
    previewImage: string;
  }[]; // Optional - 1 sản phẩm chỉ 1 model 3D
};

type Props = {
  productId: string;
  productName: string;
  submitting?: boolean;
  serverMsg?: string | null;
  serverErr?: string | null;
  onSubmit: (values: ProductColorRequest) => Promise<void> | void;
  onCancel?: () => void;
  onSkip?: () => void;
};

const ProductColorForm: React.FC<Props> = ({
  productId,
  productName,
  submitting = false,
  serverMsg,
  serverErr,
  onSubmit,
  onCancel,
  onSkip,
}) => {
  const uid = useId();

  // State cho danh sách màu từ API
  const [colors, setColors] = useState<Color[]>([]);
  const [loadingColors, setLoadingColors] = useState(false);
  const [colorError, setColorError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Local state cho form
  const [selectedColorId, setSelectedColorId] = useState("");
  const [imageUrl, setImageUrl] = useState(""); // 1 màu = 1 ảnh
  const [model3DUrl, setModel3DUrl] = useState(""); // Optional
  const [model3DFormat, setModel3DFormat] = useState<
    "OBJ" | "GLB" | "FBX" | "USDZ"
  >("GLB");
  const [model3DSize, setModel3DSize] = useState<number>(0);
  const [model3DPreview, setModel3DPreview] = useState("");

  // Fetch colors from API
  useEffect(() => {
    fetchColors();
  }, []);

  const fetchColors = async () => {
    setLoadingColors(true);
    setColorError(null);
    try {
      const colors = await colorService.getAll();
      setColors(colors);
    } catch {
      setColorError("Lỗi khi tải danh sách màu");
    } finally {
      setLoadingColors(false);
    }
  };

  const canSubmit =
    selectedColorId.trim().length > 0 && imageUrl.trim().length > 0;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || submitting) return;

    // Tạo request payload
    const payload: ProductColorRequest = {
      productId,
      colorId: selectedColorId,
      status: "ACTIVE",
      imageRequests: [{ imageUrl: imageUrl.trim() }], // 1 màu = 1 ảnh
    };

    // Thêm model 3D nếu có
    if (model3DUrl.trim()) {
      payload.model3DRequests = [
        {
          status: "ACTIVE",
          modelUrl: model3DUrl.trim(),
          format: model3DFormat,
          sizeInMb: model3DSize,
          previewImage: model3DPreview.trim() || imageUrl.trim(), // Dùng ảnh màu nếu không có preview
        },
      ];
    }

    await onSubmit(payload);
  };

  const idOf = (suffix: string) => `${uid}-${suffix}`;

  // Filter colors by search term
  const filteredColors = colors.filter(
    (color) =>
      color.colorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      color.hexCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get selected color details
  const selectedColor = colors.find((c) => c.id === selectedColorId);

  return (
    <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Thêm màu sắc cho sản phẩm
        </h3>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Sản phẩm: <strong>{productName}</strong>
        </p>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Chọn màu từ danh sách có sẵn và thêm hình ảnh cho màu đó.
        </p>
      </div>

      <form onSubmit={submit} className="space-y-5">
        {/* Chọn màu */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <label
              htmlFor={idOf("color-select")}
              className="inline-flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-200"
            >
              <Palette className="h-4 w-4 text-emerald-600" /> Chọn màu *
            </label>
            <button
              type="button"
              onClick={fetchColors}
              disabled={loadingColors}
              className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 disabled:opacity-50"
            >
              <RefreshCw
                className={`h-3 w-3 ${loadingColors ? "animate-spin" : ""}`}
              />
              Làm mới
            </button>
          </div>

          {/* Search */}
          <div className="relative mb-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm màu..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
            />
          </div>

          {loadingColors && (
            <div className="flex items-center justify-center py-4 text-gray-500">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              Đang tải màu...
            </div>
          )}

          {colorError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
              {colorError}
            </div>
          )}

          {!loadingColors && !colorError && (
            <div className="max-h-60 overflow-y-auto border border-gray-300 rounded-lg dark:border-gray-700">
              {filteredColors.length === 0 ? (
                <div className="p-4 text-center text-sm text-gray-500">
                  {searchTerm
                    ? "Không tìm thấy màu nào"
                    : "Chưa có màu nào. Hãy tạo màu trước!"}
                </div>
              ) : (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredColors.map((color) => (
                    <label
                      key={color.id}
                      className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                        selectedColorId === color.id
                          ? "bg-emerald-50 dark:bg-emerald-900/20"
                          : ""
                      }`}
                    >
                      <input
                        type="radio"
                        name="colorId"
                        value={color.id}
                        checked={selectedColorId === color.id}
                        onChange={(e) => setSelectedColorId(e.target.value)}
                        className="h-4 w-4 text-emerald-600 focus:ring-emerald-500"
                      />
                      <div
                        className="w-8 h-8 rounded border-2 border-gray-300 dark:border-gray-600 flex-shrink-0"
                        style={{ backgroundColor: color.hexCode }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">
                          {color.colorName}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 font-mono">
                          {color.hexCode}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Selected Color Preview */}
          {selectedColor && (
            <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-lg border-2 border-gray-300 dark:border-gray-600"
                style={{ backgroundColor: selectedColor.hexCode }}
              />
              <div>
                <p className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                  {selectedColor.colorName}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400 font-mono">
                  {selectedColor.hexCode}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Hình ảnh (1 màu = 1 ảnh) */}
        <div>
          <label
            htmlFor={idOf("image-url")}
            className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200"
          >
            Hình ảnh (URL) *
          </label>
          <input
            id={idOf("image-url")}
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://...jpg"
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Mỗi màu chỉ có 1 hình ảnh
          </p>
        </div>

        {/* Model 3D (Optional - 1 sản phẩm chỉ 1 model) */}
        <div className="rounded-2xl border border-gray-200 bg-gray-50/50 p-4 dark:border-gray-800 dark:bg-gray-900/50">
          <h4 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">
            Model 3D (Tuỳ chọn)
          </h4>
          <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">
            ⚠️ Lưu ý: 1 sản phẩm chỉ có 1 model 3D duy nhất
          </p>

          <div className="space-y-3">
            <div>
              <label
                htmlFor={idOf("model-url")}
                className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300"
              >
                URL Model 3D
              </label>
              <input
                id={idOf("model-url")}
                value={model3DUrl}
                onChange={(e) => setModel3DUrl(e.target.value)}
                placeholder="https://...model.glb"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
              />
            </div>

            {model3DUrl.trim() && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor={idOf("model-format")}
                      className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300"
                    >
                      Định dạng
                    </label>
                    <select
                      id={idOf("model-format")}
                      value={model3DFormat}
                      onChange={(e) =>
                        setModel3DFormat(
                          e.target.value as "OBJ" | "GLB" | "FBX" | "USDZ"
                        )
                      }
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
                    >
                      <option value="GLB">GLB</option>
                      <option value="OBJ">OBJ</option>
                      <option value="FBX">FBX</option>
                      <option value="USDZ">USDZ</option>
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor={idOf("model-size")}
                      className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300"
                    >
                      Kích thước (MB)
                    </label>
                    <input
                      id={idOf("model-size")}
                      type="number"
                      step="0.1"
                      min="0"
                      value={model3DSize}
                      onChange={(e) => setModel3DSize(Number(e.target.value))}
                      placeholder="0"
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor={idOf("model-preview")}
                    className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300"
                  >
                    Ảnh preview (để trống để dùng ảnh màu)
                  </label>
                  <input
                    id={idOf("model-preview")}
                    value={model3DPreview}
                    onChange={(e) => setModel3DPreview(e.target.value)}
                    placeholder="https://...preview.jpg"
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={!canSubmit || submitting}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow enabled:hover:bg-emerald-700 enabled:active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            {submitting ? "Đang lưu..." : "Thêm màu"}
          </button>
          {onSkip && (
            <button
              type="button"
              onClick={onSkip}
              disabled={submitting}
              className="rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800 disabled:opacity-60"
            >
              Bỏ qua
            </button>
          )}
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={submitting}
              className="rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800 disabled:opacity-60"
            >
              Huỷ
            </button>
          )}
        </div>

        {serverMsg && (
          <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
            {serverMsg}
          </p>
        )}
        {serverErr && (
          <p className="text-sm font-medium text-red-600 dark:text-red-400">
            {serverErr}
          </p>
        )}
      </form>
    </div>
  );
};

export default ProductColorForm;
