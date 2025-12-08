import { useState, useEffect, useRef } from "react";
import {
  Camera,
  Loader2,
  PenTool,
  CheckCircle,
  XCircle,
  Package,
} from "lucide-react";
import { authService } from "@/service/authService";
import deliveryService, {
  type DeliveryAssignment,
} from "@/service/deliveryService";
import { uploadToCloudinary } from "@/service/uploadService";

export default function DeliverySignaturePage() {
  const [assignments, setAssignments] = useState<DeliveryAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAssignment, setSelectedAssignment] =
    useState<DeliveryAssignment | null>(null);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [signatureImage, setSignatureImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatAddress = (address?: DeliveryAssignment["order"]["address"]) => {
    if (!address) return "N/A";
    const parts = [
      address.addressLine,
      address.street,
      address.ward,
      address.district,
      address.city,
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(", ") : "N/A";
  };

  useEffect(() => {
    loadDeliveredOrders();
  }, []);

  const loadDeliveredOrders = async () => {
    try {
      setLoading(true);
      setError(null);

      const storeId = authService.getStoreId();
      if (!storeId) {
        setError("Không tìm thấy thông tin cửa hàng. Vui lòng đăng nhập lại.");
        return;
      }

      const data = await deliveryService.getAssignmentsByStore(storeId);
      // Chỉ lấy các đơn có status DELIVERED và order không null
      const deliveredOrders = data.filter(
        (assignment) =>
          assignment.status === "DELIVERED" && assignment.order !== null
      );
      setAssignments(deliveredOrders);
    } catch (err) {
      console.error("Error loading delivered orders:", err);
      setError("Không thể tải danh sách đơn hàng: " + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenSignatureModal = (assignment: DeliveryAssignment) => {
    setSelectedAssignment(assignment);
    setSignatureImage(null);
    setShowSignatureModal(true);
  };

  const handleImageCapture = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Vui lòng chọn file ảnh!");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setSignatureImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleConfirmDelivery = async () => {
    if (!selectedAssignment || !signatureImage) {
      alert("Vui lòng chụp ảnh chữ ký khách hàng!");
      return;
    }

    if (!selectedAssignment.order.qrCode) {
      alert("Đơn hàng này không có mã QR!");
      return;
    }

    try {
      setConfirming(true);

      // Upload signature image
      setUploading(true);
      const blob = await fetch(signatureImage).then((r) => r.blob());
      const file = new File([blob], "signature.jpg", { type: "image/jpeg" });
      const uploadedUrl = await uploadToCloudinary(file, "image");
      setUploading(false);

      // Confirm delivery with signature
      await deliveryService.confirmDeliveryWithSignature({
        qrCode: selectedAssignment.order.qrCode,
        customerSignature: uploadedUrl,
      });

      alert("Xác nhận giao hàng thành công! Đơn hàng đã hoàn thành.");
      setShowSignatureModal(false);
      setSelectedAssignment(null);
      setSignatureImage(null);
      await loadDeliveredOrders(); // Reload to remove confirmed order
    } catch (err: unknown) {
      console.error("Error confirming delivery:", err);
      const message =
        err instanceof Error
          ? err.message
          : "Không thể xác nhận giao hàng. Vui lòng thử lại.";
      alert(message);
    } finally {
      setConfirming(false);
      setUploading(false);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 dark:bg-red-900/20 p-6">
        <h3 className="text-lg font-semibold text-red-800 dark:text-red-400 mb-2">
          Lỗi tải dữ liệu
        </h3>
        <p className="text-sm text-red-700 dark:text-red-300 mb-4">{error}</p>
        <button
          onClick={loadDeliveredOrders}
          className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
        >
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Xác nhận chữ ký khách hàng
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Chụp ảnh chữ ký khách hàng để hoàn tất giao hàng
        </p>
      </div>

      {/* Stats */}
      <div className="rounded-lg bg-white p-4 shadow dark:bg-gray-800">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-green-100 p-2 dark:bg-green-900">
            <Package className="h-5 w-5 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Đơn hàng đã giao - Chờ xác nhận
            </p>
            <p className="text-xl font-semibold text-gray-900 dark:text-white">
              {assignments.length}
            </p>
          </div>
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {assignments.length === 0 ? (
          <div className="rounded-lg bg-gray-50 dark:bg-gray-800 p-8 text-center">
            <CheckCircle className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Không có đơn hàng nào cần xác nhận chữ ký
            </p>
          </div>
        ) : (
          assignments.map((assignment) => {
            const order = assignment.order;
            const totalQuantity =
              order?.orderDetails?.reduce(
                (sum, detail) => sum + detail.quantity,
                0
              ) || 0;

            return (
              <div
                key={assignment.id}
                className="rounded-lg bg-white shadow dark:bg-gray-800 border-l-4 border-green-200 overflow-hidden"
              >
                <div className="p-4 sm:p-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    {/* Order Info */}
                    <div className="flex-1 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                              Đơn hàng #{order.id}
                            </h3>
                            <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-green-100 text-green-700">
                              Đã giao
                            </span>
                          </div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Khách hàng:{" "}
                            {order?.address?.userName ||
                              order?.address?.name ||
                              "N/A"}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-gray-500 dark:text-gray-400">
                            Địa chỉ
                          </p>
                          <p className="font-medium text-gray-900 dark:text-white line-clamp-2">
                            {formatAddress(order?.address)}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500 dark:text-gray-400">
                            Số điện thoại
                          </p>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {order?.address?.phone || "N/A"}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500 dark:text-gray-400">
                            Tổng tiền
                          </p>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {order?.total?.toLocaleString("vi-VN")}đ
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500 dark:text-gray-400">
                            Phương thức thanh toán
                          </p>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {order?.payment?.paymentMethod === "COD"
                              ? "Tiền mặt"
                              : order?.payment?.paymentMethod === "VNPAY"
                              ? "VNPay"
                              : order?.payment?.paymentMethod === "MOMO"
                              ? "MoMo"
                              : order?.payment?.paymentMethod || "N/A"}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500 dark:text-gray-400">
                            Số lượng SP
                          </p>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {totalQuantity}
                          </p>
                        </div>
                        {assignment.estimatedDeliveryDate && (
                          <div>
                            <p className="text-gray-500 dark:text-gray-400">
                              Ngày giao dự kiến
                            </p>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {formatDate(assignment.estimatedDeliveryDate)}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Product List */}
                      {order?.orderDetails && order.orderDetails.length > 0 && (
                        <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                            Sản phẩm ({order.orderDetails.length}):
                          </p>
                          <div className="space-y-2">
                            {order.orderDetails.map((detail, index) => {
                              const productColor = detail.productColor;
                              const productImage =
                                productColor?.images?.[0]?.image;
                              return (
                                <div
                                  key={index}
                                  className="bg-gray-50 dark:bg-gray-900/50 p-2.5 rounded-lg"
                                >
                                  <div className="flex gap-2">
                                    {productImage && (
                                      <img
                                        src={productImage}
                                        alt={
                                          productColor?.product?.name ||
                                          "Product"
                                        }
                                        className="w-12 h-12 object-cover rounded shrink-0"
                                      />
                                    )}
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                        {productColor?.product?.name ||
                                          `Sản phẩm #${index + 1}`}
                                      </p>
                                      {productColor?.color && (
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                          Màu: {productColor.color.colorName}
                                        </p>
                                      )}
                                      <div className="flex items-center gap-2 mt-1 text-xs text-gray-600 dark:text-gray-400">
                                        <span>SL: {detail.quantity}</span>
                                        <span className="text-gray-400">•</span>
                                        <span>
                                          {detail.price.toLocaleString()}đ/sp
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {order?.qrCode && (
                        <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 p-3">
                          <p className="text-xs text-blue-700 dark:text-blue-300 font-medium">
                            Mã QR: {order.qrCode}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Action Button */}
                    <div className="flex flex-col gap-2 sm:w-48">
                      <button
                        onClick={() => handleOpenSignatureModal(assignment)}
                        className="flex items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                      >
                        <PenTool className="h-4 w-4" />
                        Xác nhận chữ ký
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Signature Modal */}
      {showSignatureModal && selectedAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-lg bg-white dark:bg-gray-800 shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 p-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Xác nhận chữ ký - Đơn hàng #{selectedAssignment.order.id}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Chụp ảnh chữ ký của khách hàng
                </p>
              </div>
              <button
                onClick={() => {
                  setShowSignatureModal(false);
                  setSignatureImage(null);
                }}
                className="rounded-lg p-1 hover:bg-gray-100 dark:hover:bg-gray-700"
                aria-label="Đóng"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Image Preview */}
              {signatureImage ? (
                <div className="space-y-3">
                  <div className="rounded-lg border-2 border-gray-200 dark:border-gray-700 overflow-hidden">
                    <img
                      src={signatureImage}
                      alt="Chữ ký khách hàng"
                      className="w-full h-64 object-contain bg-gray-50 dark:bg-gray-900"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600"
                    >
                      <Camera className="h-4 w-4" />
                      Chụp lại
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-center rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 p-12">
                    <div className="text-center">
                      <Camera className="mx-auto h-12 w-12 text-gray-400" />
                      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        Chưa có ảnh chữ ký
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                  >
                    <Camera className="h-4 w-4" />
                    Tải ảnh chữ ký lên
                  </button>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageCapture}
                className="hidden"
                aria-label="Chọn ảnh chữ ký"
              />
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 p-4 flex gap-3">
              <button
                onClick={() => {
                  setShowSignatureModal(false);
                  setSignatureImage(null);
                }}
                disabled={confirming || uploading}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600"
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmDelivery}
                disabled={!signatureImage || confirming || uploading}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {confirming || uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {uploading ? "Đang tải ảnh..." : "Đang xác nhận..."}
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    Xác nhận hoàn tất
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
