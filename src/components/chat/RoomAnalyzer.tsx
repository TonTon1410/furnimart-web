"use client";

import { useState, useRef } from "react";
import { X, Upload, Camera, Loader2, Sparkles, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ProductSuggestion {
  id: string;
  itemName: string;
  reason: string;
  placementAdvice: string;
  thumbnailImage: string;
  price: number;
  recommendedColor: string;
}

interface RoomAnalysisResponse {
  style: string;
  analysis: string;
  colorPalette: string[];
  suggestions: ProductSuggestion[];
}

export function RoomAnalyzer() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RoomAnalysisResponse | null>(null);
  const [note, setNote] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
      setResult(null); // Clear previous results
    }
  };

  const handleAnalyze = async () => {
    if (!selectedImage) return;

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("image", selectedImage);

      const API_BASE_URL =
        import.meta.env.VITE_API_BASE_URL || "https://furnimart.click/api";
      const url = new URL("/ai/analyze/analyze-room", API_BASE_URL);
      if (note) {
        url.searchParams.append("note", note);
      }

      const response = await fetch(url.toString(), {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Phân tích thất bại");
      }

      const data = await response.json();
      setResult(data.data);
    } catch (error) {
      console.error("Error analyzing room:", error);
      alert("Không thể phân tích phòng. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSelectedImage(null);
    setPreviewUrl(null);
    setResult(null);
    setNote("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-12 h-12 sm:w-14 sm:h-14 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-105"
        aria-label={isOpen ? "Đóng phân tích phòng" : "Mở phân tích phòng"}
      >
        {isOpen ? <X className="w-6 h-6" /> : <Camera className="w-6 h-6" />}
      </button>

      {/* Main Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-20 right-4 left-4 sm:left-auto sm:bottom-24 sm:right-6 z-50 w-auto sm:w-[450px] max-w-[calc(100vw-2rem)] h-[calc(100vh-8rem)] sm:h-[600px] max-h-[calc(100vh-8rem)] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b bg-linear-to-r from-emerald-500 to-teal-500 text-white">
              <div className="flex items-center gap-2">
                {result && (
                  <button
                    onClick={handleReset}
                    className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                    aria-label="Quay lại"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                )}
                <Sparkles className="w-5 h-5" />
                <h3 className="font-semibold">Phân Tích Phòng AI</h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                aria-label="Đóng"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {!result ? (
                // Upload Section
                <div className="space-y-4">
                  <div className="text-center">
                    <p className="text-gray-600 text-sm mb-4">
                      Tải lên hình ảnh căn phòng của bạn để nhận gợi ý nội thất
                      phù hợp
                    </p>
                  </div>

                  {/* Image Preview or Upload */}
                  {previewUrl ? (
                    <div className="space-y-4">
                      <div className="relative rounded-xl overflow-hidden border-2 border-gray-200">
                        <img
                          src={previewUrl}
                          alt="Preview"
                          className="w-full h-64 object-cover"
                        />
                        <button
                          onClick={handleReset}
                          className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                          aria-label="Xóa ảnh"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Note Input */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Ghi chú (tùy chọn)
                        </label>
                        <textarea
                          value={note}
                          onChange={(e) => setNote(e.target.value)}
                          placeholder="VD: Tôi muốn phong cách tối giản, màu sáng..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
                          rows={3}
                        />
                      </div>

                      {/* Analyze Button */}
                      <button
                        onClick={handleAnalyze}
                        disabled={loading}
                        className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Đang phân tích...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-5 h-5" />
                            Phân Tích Phòng
                          </>
                        )}
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-emerald-500 hover:bg-emerald-50/50 transition-all"
                    >
                      <Upload className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                      <p className="text-sm font-medium text-gray-700 mb-1">
                        Nhấn để chọn ảnh
                      </p>
                      <p className="text-xs text-gray-500">
                        PNG, JPG, JPEG (tối đa 10MB)
                      </p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageSelect}
                        className="hidden"
                        aria-label="Chọn ảnh phòng"
                      />
                    </div>
                  )}
                </div>
              ) : (
                // Results Section
                <div className="space-y-6">
                  {/* Room Style */}
                  <div className="bg-emerald-50 rounded-xl p-4">
                    <h4 className="font-semibold text-emerald-900 mb-2">
                      Phong Cách Phòng
                    </h4>
                    <p className="text-emerald-700">{result.style}</p>
                  </div>

                  {/* Analysis */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">
                      Phân Tích
                    </h4>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      {result.analysis}
                    </p>
                  </div>

                  {/* Color Palette */}
                  {result.colorPalette && result.colorPalette.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">
                        Bảng Màu
                      </h4>
                      <div className="flex gap-2">
                        {result.colorPalette.map((color, index) => (
                          <div
                            key={index}
                            className="flex-1 h-16 rounded-lg border-2 border-gray-200 shadow-sm"
                            style={{ backgroundColor: color }}
                            title={color}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Product Suggestions */}
                  {result.suggestions && result.suggestions.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">
                        Gợi Ý Sản Phẩm
                      </h4>
                      <div className="space-y-4">
                        {result.suggestions.map((product) => (
                          <div
                            key={product.id}
                            className="border border-gray-200 rounded-xl p-3 hover:shadow-md transition-shadow"
                          >
                            <div className="flex gap-3">
                              <img
                                src={product.thumbnailImage}
                                alt={product.itemName}
                                className="w-20 h-20 object-cover rounded-lg"
                              />
                              <div className="flex-1">
                                <h5 className="font-medium text-gray-900 mb-1">
                                  {product.itemName}
                                </h5>
                                <p className="text-emerald-600 font-semibold text-sm mb-1">
                                  {formatPrice(product.price)}
                                </p>
                                {product.recommendedColor && (
                                  <p className="text-xs text-gray-500 mb-1">
                                    Màu đề xuất: {product.recommendedColor}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="mt-2 pt-2 border-t border-gray-100">
                              <p className="text-xs text-gray-600 mb-1">
                                <strong>Lý do:</strong> {product.reason}
                              </p>
                              <p className="text-xs text-gray-600">
                                <strong>Gợi ý đặt:</strong>{" "}
                                {product.placementAdvice}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Try Again Button */}
                  <button
                    onClick={handleReset}
                    className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
                  >
                    Phân Tích Phòng Khác
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
