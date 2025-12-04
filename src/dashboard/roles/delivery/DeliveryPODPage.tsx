import { Camera, MapPin, CheckCircle, Upload, X } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import deliveryService from "@/service/deliveryService";
import type { DeliveryAssignment } from "@/service/deliveryService";
import { authService } from "@/service/authService";
import { uploadToCloudinary } from "@/service/uploadService";
import { useNavigate } from "react-router-dom";
import { DP } from "@/router/paths";

export default function DeliveryPOD() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [assignments, setAssignments] = useState<DeliveryAssignment[]>([]);
  const [selectedAssignment, setSelectedAssignment] =
    useState<DeliveryAssignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  const [photoUrl, setPhotoUrl] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    loadAssignments();
  }, []);

  const loadAssignments = async () => {
    try {
      setLoading(true);
      setError(null);
      const profile = await authService.getProfile();
      if (!profile?.id) {
        setError("Không tìm thấy thông tin người dùng");
        return;
      }
      const data = await deliveryService.getAssignmentsByStaff(profile.id);
      // Filter only delivered orders
      const deliveredOrders = data.filter((a) => a.status === "DELIVERED");
      setAssignments(deliveredOrders);
      if (deliveredOrders.length > 0) {
        setSelectedAssignment(deliveredOrders[0]);
      }
    } catch (err) {
      console.error("Error loading assignments:", err);
      setError("Không thể tải danh sách đơn hàng");
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    try {
      setUploading(true);
      const uploadPromises = Array.from(files).map(async (file) => {
        const url = await uploadToCloudinary(file);
        return url;
      });
      const urls = await Promise.all(uploadPromises);
      setPhotos((prev) => [...prev, ...urls]);
    } catch (err) {
      console.error("Error uploading photos:", err);
      alert("Không thể tải ảnh lên. Vui lòng thử lại.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleCameraCapture = () => {
    if (fileInputRef.current) {
      fileInputRef.current.setAttribute("capture", "environment");
      fileInputRef.current.click();
    }
  };

  const handleUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.removeAttribute("capture");
      fileInputRef.current.click();
    }
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddPhotoUrl = () => {
    const trimmedUrl = photoUrl.trim();
    if (!trimmedUrl) {
      alert("Vui lòng nhập URL ảnh");
      return;
    }

    // Basic URL validation
    try {
      new URL(trimmedUrl);
      setPhotos((prev) => [...prev, trimmedUrl]);
      setPhotoUrl("");
    } catch {
      alert(
        "URL không hợp lệ. Vui lòng nhập URL đầy đủ (ví dụ: https://example.com/image.jpg)"
      );
    }
  };

  const handleSubmit = async () => {
    if (!selectedAssignment) {
      alert("Vui lòng chọn đơn hàng");
      return;
    }

    if (photos.length === 0) {
      alert("Vui lòng chụp ít nhất một ảnh bằng chứng giao hàng");
      return;
    }

    try {
      setSubmitting(true);
      await deliveryService.createDeliveryConfirmation({
        orderId: selectedAssignment.order.id,
        deliveryPhotos: photos,
        deliveryNotes: notes.trim() || undefined,
      });

      alert("Xác nhận giao hàng thành công!");
      navigate(DP("delivery/orders"));
    } catch (err) {
      console.error("Error submitting POD:", err);
      alert("Không thể xác nhận giao hàng. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 text-center">
        <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
        <button
          onClick={loadAssignments}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Thử lại
        </button>
      </div>
    );
  }

  if (assignments.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 text-center">
        <CheckCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Không có đơn hàng đã giao
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Bạn chưa có đơn hàng nào đã giao cần xác nhận
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-20">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
        aria-label="Upload delivery photos"
      />

      {/* Order Selection */}
      {assignments.length > 1 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Chọn đơn hàng:
          </label>
          <select
            value={selectedAssignment?.id || ""}
            onChange={(e) => {
              const assignment = assignments.find(
                (a) => a.id.toString() === e.target.value
              );
              setSelectedAssignment(assignment || null);
            }}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            aria-label="Chọn đơn hàng"
          >
            {assignments.map((assignment) => (
              <option key={assignment.id} value={assignment.id}>
                #{assignment.order.id}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Order Info Card */}
      <div className="rounded-lg bg-white p-4 sm:p-6 shadow dark:bg-gray-800">
        <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">
          Thông tin đơn hàng
        </h2>
        <div className="space-y-2 sm:space-y-3">
          <div className="flex items-center gap-2 text-sm sm:text-base text-gray-700 dark:text-gray-300">
            <span className="font-medium">Mã đơn:</span>
            <span className="text-blue-600 dark:text-blue-400">
              #{selectedAssignment?.order?.id}
            </span>
          </div>
          <div className="flex items-start gap-2 text-sm sm:text-base text-gray-700 dark:text-gray-300">
            <MapPin className="h-4 w-4 sm:h-5 sm:w-5 mt-0.5 shrink-0" />
            <span className="flex-1">
              {selectedAssignment?.order?.address?.name || "N/A"}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm sm:text-base text-gray-700 dark:text-gray-300">
            <span className="font-medium">Số điện thoại:</span>
            <span>{selectedAssignment?.order?.address?.phone || "N/A"}</span>
          </div>
        </div>
      </div>

      {/* Photo Upload */}
      <div className="rounded-lg bg-white p-4 sm:p-6 shadow dark:bg-gray-800">
        <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">
          Hình ảnh xác minh
        </h2>

        <div className="space-y-3 sm:space-y-4">
          {/* Upload Area */}
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 sm:p-8">
            <div className="flex flex-col items-center justify-center text-center">
              <Camera className="h-12 w-12 sm:h-14 sm:w-14 text-gray-400 mb-3 sm:mb-4" />
              <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 font-medium mb-1 sm:mb-2">
                Chụp ảnh hoặc tải lên
              </p>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-3 sm:mb-4">
                PNG, JPG lên đến 10MB
              </p>
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <button
                  onClick={handleCameraCapture}
                  disabled={uploading}
                  className="flex items-center justify-center gap-2 bg-blue-600 text-white px-5 py-3 sm:px-4 sm:py-2.5 rounded-lg font-medium text-sm sm:text-base hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
                >
                  <Camera className="h-5 w-5 sm:h-4 sm:w-4" />
                  <span>{uploading ? "Đang tải..." : "Chụp ảnh"}</span>
                </button>
                <button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="flex items-center justify-center gap-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white px-5 py-3 sm:px-4 sm:py-2.5 rounded-lg font-medium text-sm sm:text-base hover:bg-gray-300 dark:hover:bg-gray-600 active:bg-gray-400 dark:active:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
                >
                  <Upload className="h-5 w-5 sm:h-4 sm:w-4" />
                  <span>Tải lên</span>
                </button>
              </div>
            </div>
          </div>

          {/* URL Input - Tạm thời cho debug */}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <p className="text-xs font-semibold text-yellow-800 dark:text-yellow-300 mb-2">
              🔧 Nhập URL ảnh (tạm thời)
            </p>
            <div className="flex gap-2">
              <input
                type="url"
                value={photoUrl}
                onChange={(e) => setPhotoUrl(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleAddPhotoUrl()}
                placeholder="https://example.com/image.jpg"
                className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
              <button
                onClick={handleAddPhotoUrl}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 whitespace-nowrap"
              >
                Thêm ảnh
              </button>
            </div>
          </div>

          {/* Preview Area */}
          {photos.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
              {photos.map((photo, index) => (
                <div
                  key={index}
                  className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700"
                >
                  <img
                    src={photo}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={() => removePhoto(index)}
                    aria-label="Xóa ảnh"
                    className="absolute top-1.5 right-1.5 bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600 active:bg-red-700"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Ghi chú giao hàng (tùy chọn)
            </label>
            <textarea
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Nhập ghi chú về quá trình giao hàng (tên người nhận, chữ ký, ghi chú khác...)..."
              className="w-full px-3 py-2.5 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          {/* Submit Buttons */}
          <div className="grid grid-cols-2 gap-2 sm:flex sm:justify-end sm:gap-3 pt-2 sm:pt-4">
            <button
              onClick={() => navigate(DP("delivery/orders"))}
              disabled={submitting}
              className="px-4 sm:px-6 py-3 sm:py-2.5 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg font-medium text-sm sm:text-base hover:bg-gray-300 dark:hover:bg-gray-600 active:bg-gray-400 dark:active:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed order-1"
            >
              Hủy
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex items-center justify-center gap-2 px-4 sm:px-6 py-3 sm:py-2.5 bg-green-600 text-white rounded-lg font-medium text-sm sm:text-base hover:bg-green-700 active:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed order-2"
            >
              <CheckCircle className="h-5 w-5 sm:h-4 sm:w-4" />
              <span>{submitting ? "Đang xử lý..." : "Xác nhận"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
