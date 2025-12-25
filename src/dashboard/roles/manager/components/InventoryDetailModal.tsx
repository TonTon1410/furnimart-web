/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Calendar,
  MapPin,
  User,
  FileText,
  Package,
  ArrowDownLeft,
  ArrowUpRight,
  RefreshCw,
  Printer,
  Hash,
  XCircle,
} from "lucide-react";
import dayjs from "dayjs";
import type { InventoryResponse } from "@/service/inventoryService";
import inventoryService from "@/service/inventoryService";
import { useToast } from "@/context/ToastContext";

// Định nghĩa Interface cho response API ProductColor
interface ProductColorDetail {
  id: string;
  color: {
    colorName: string;
    hexCode: string;
  };
  images: { id: string; image: string }[];
  product: {
    thumbnailImage: string;
    name: string;
  };
}

interface InventoryDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: InventoryResponse | null;
  onRefresh?: () => void; // Callback để refresh danh sách sau khi hủy
}

const PURPOSE_MAP: Record<string, string> = {
  STOCK_IN: "Nhập hàng",
  STOCK_OUT: "Xuất bán hàng",
  MOVE: "Xuất điều chuyển",
  REQUEST: "Gửi yêu cầu",
  RESERVE: "Giữ hàng",
};

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

const InventoryDetailModal: React.FC<InventoryDetailModalProps> = ({
  isOpen,
  onClose,
  data,
  onRefresh,
}) => {
  const { showToast } = useToast();
  const [cancelling, setCancelling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  // State lưu trữ thông tin chi tiết của từng ProductColor (image, hexCode...)
  const [productDetails, setProductDetails] = useState<
    Record<string, ProductColorDetail>
  >({});

  // Reset state khi đóng modal hoặc đổi data
  useEffect(() => {
    if (!isOpen) {
      setProductDetails({});
    }
  }, [isOpen]);

  // Fetch thông tin chi tiết (Hình ảnh, Màu sắc) khi có data
  useEffect(() => {
    if (!isOpen || !data?.itemResponseList) return;

    const fetchDetails = async () => {
      const uniqueIds = Array.from(
        new Set(data.itemResponseList.map((item) => item.productColorId))
      );

      // Lọc ra các ID chưa có trong state để tránh fetch lại
      const idsToFetch = uniqueIds.filter((id) => !productDetails[id]);

      if (idsToFetch.length === 0) return;

      const newDetails: Record<string, ProductColorDetail> = {};

      await Promise.all(
        idsToFetch.map(async (id) => {
          try {
            const token = localStorage.getItem("accessToken");
            const headers: HeadersInit = { "Content-Type": "application/json" };
            if (token) headers["Authorization"] = `Bearer ${token}`;

            const response = await fetch(`${BASE_URL}/product-colors/${id}`, {
              headers,
            });
            const resJson = await response.json();

            if (resJson.data) {
              newDetails[id] = resJson.data;
            }
          } catch (error) {
            console.error(`Failed to fetch product color ${id}`, error);
          }
        })
      );

      setProductDetails((prev) => ({ ...prev, ...newDetails }));
    };

    fetchDetails();
  }, [isOpen, data]);

  const handleCancelReserve = async () => {
    if (!data) return;

    setCancelling(true);
    setShowCancelConfirm(false);
    try {
      await inventoryService.cancelReserveTicket(data.id);
      showToast({
        type: "success",
        title: "Hủy phiếu thành công",
        description: `Phiếu giữ hàng #${data.id} đã được hủy.`,
      });
      onClose();
      if (onRefresh) {
        onRefresh();
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error("Error cancelling reserve ticket:", error);
      showToast({
        type: "error",
        title: "Không thể hủy phiếu",
        description:
          error?.response?.data?.message ||
          error?.message ||
          "Vui lòng thử lại sau.",
      });
    } finally {
      setCancelling(false);
    }
  };

  if (!isOpen || !data) return null;

  // --- Cấu hình hiển thị theo Type ---
  const getModalConfig = (type: string) => {
    if (["IMPORT", "IN", "STOCK_IN"].includes(type)) {
      return {
        title: "Phiếu Nhập Kho",
        themeColor: "text-emerald-600",
        bgColor: "bg-emerald-50",
        borderColor: "border-emerald-100",
        Icon: ArrowDownLeft,
        buttonColor: "bg-emerald-600",
        printText: "Xuất File PDF",
      };
    }

    if (type === "TRANSFER") {
      return {
        title: "Phiếu Chuyển Kho",
        themeColor: "text-blue-600",
        bgColor: "bg-blue-50",
        borderColor: "border-blue-100",
        Icon: RefreshCw,
        buttonColor: "bg-blue-600",
        printText: "In Phiếu Chuyển",
      };
    }

    if (type === "RESERVE") {
      return {
        title: "Phiếu Giữ Hàng",
        themeColor: "text-purple-600",
        bgColor: "bg-purple-50",
        borderColor: "border-purple-100",
        Icon: FileText,
        buttonColor: "bg-purple-600",
        printText: "In Phiếu Giữ Hàng",
      };
    }

    return {
      title: "Phiếu Xuất Kho",
      themeColor: "text-amber-600",
      bgColor: "bg-amber-50",
      borderColor: "border-amber-100",
      Icon: ArrowUpRight,
      buttonColor: "bg-amber-600",
      printText: "In Phiếu Xuất",
    };
  };

  const config = getModalConfig(data.type);
  const totalQuantity =
    data.itemResponseList?.reduce((sum, item) => sum + item.quantity, 0) || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div
        className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="relative w-full max-w-5xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-8 py-6 border-b border-gray-100 dark:border-gray-800 flex items-start justify-between bg-white dark:bg-gray-900 z-10">
          <div className="flex items-center gap-4">
            <div
              className={`p-3 rounded-xl ${config.bgColor} ${config.themeColor}`}
            >
              <config.Icon className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
                  {config.title}
                </h2>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${config.bgColor} ${config.themeColor} ${config.borderColor}`}
                >
                  #{data.id}
                </span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {dayjs(data.date).format("DD/MM/YYYY")}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {data.type === "RESERVE" &&
              (!data.reservedWarehouses ||
                data.reservedWarehouses.length === 0 ||
                data.reservedWarehouses.every(
                  (w) => w.assignedWarehouse === false
                )) && (
                <button
                  onClick={() => setShowCancelConfirm(true)}
                  disabled={cancelling}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Hủy phiếu giữ hàng"
                >
                  <XCircle className="w-4 h-4" />
                  {cancelling ? "Đang hủy..." : "Hủy phiếu"}
                </button>
              )}
            <button
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="In phiếu"
            >
              <Printer className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              title="Đóng"
              aria-label="Đóng"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto flex-1 p-8 space-y-8 bg-gray-50/50 dark:bg-gray-900/50">
          {/* Section 1: Thông tin chung */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
              <p className="text-xs font-medium text-gray-400 uppercase mb-2 flex items-center gap-1">
                <MapPin className="w-3 h-3" /> Kho hàng
              </p>
              <p
                className="font-semibold text-gray-900 dark:text-white truncate"
                title={data.warehouseName}
              >
                {data.warehouseName}
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
              <p className="text-xs font-medium text-gray-400 uppercase mb-2 flex items-center gap-1">
                <User className="w-3 h-3" /> Người thực hiện
              </p>
              <p className="font-semibold text-gray-900 dark:text-white truncate">
                Nhân viên kho
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
              <p className="text-xs font-medium text-gray-400 uppercase mb-2 flex items-center gap-1">
                <Hash className="w-3 h-3" /> Thông tin khác
              </p>
              <div className="flex flex-col gap-1">
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-bold">Mục đích:</span>{" "}
                  <span className="font-medium">
                    {PURPOSE_MAP[data.purpose] || data.purpose}
                  </span>
                </span>
                {data.orderId && (
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Đơn hàng:{" "}
                    <span className="text-blue-600 font-medium">
                      #{data.orderId}
                    </span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Section 2: Thông tin kho đích và trạng thái chuyển */}
          {(data.toWarehouseId ||
            data.transferStatus ||
            data.pdfUrl ||
            data.totalQuantity !== undefined) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.toWarehouseId && (
                <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-xl border border-purple-100 dark:border-purple-800">
                  <p className="text-xs font-medium text-purple-400 uppercase mb-2">
                    Kho đích
                  </p>
                  <p className="font-semibold text-purple-900 dark:text-purple-100">
                    {data.toWarehouseName || "N/A"}
                  </p>
                </div>
              )}
              {data.transferStatus && (
                <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-xl border border-indigo-100 dark:border-indigo-800">
                  <p className="text-xs font-medium text-indigo-400 uppercase mb-2">
                    Trạng thái chuyển kho
                  </p>
                  <p className="font-semibold text-indigo-900 dark:text-indigo-100">
                    {data.transferStatus === "PENDING" && "Chờ duyệt"}
                    {data.transferStatus === "ACCEPTED" && "Đã chấp nhận"}
                    {data.transferStatus === "FINISHED" && "Hoàn thành"}
                    {data.transferStatus === "REJECTED" && "Đã từ chối"}
                  </p>
                </div>
              )}
              {data.totalQuantity !== undefined &&
                data.totalQuantity !== null && (
                  <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-xl border border-green-100 dark:border-green-800">
                    <p className="text-xs font-medium text-green-400 uppercase mb-2">
                      Tổng số lượng
                    </p>
                    <p className="font-semibold text-green-900 dark:text-green-100 text-xl">
                      {data.totalQuantity.toLocaleString()}
                    </p>
                  </div>
                )}
              {data.pdfUrl && (
                <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-xl border border-orange-100 dark:border-orange-800">
                  <p className="text-xs font-medium text-orange-400 uppercase mb-2">
                    Tài liệu PDF
                  </p>
                  <a
                    href={data.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-orange-600 dark:text-orange-300 hover:underline font-medium"
                  >
                    Xem PDF
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Section 3: Ghi chú */}
          {data.note && (
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800 flex gap-3">
              <FileText className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-blue-700 dark:text-blue-400">
                  Ghi chú
                </h4>
                <p className="text-sm text-blue-600 dark:text-blue-300 mt-1 leading-relaxed">
                  {data.note}
                </p>
              </div>
            </div>
          )}

          {/* Section 4: Danh sách kho đã giữ hàng */}
          {data.reservedWarehouses && data.reservedWarehouses.length > 0 && (
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
                <MapPin className="w-5 h-5 text-gray-400" />
                Kho đã giữ hàng
              </h3>
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700 text-xs uppercase text-gray-500 font-semibold tracking-wider">
                      <th className="px-6 py-4">Kho</th>
                      <th className="px-6 py-4 text-right">Số lượng giữ</th>
                      <th className="px-6 py-4 text-center">Được phân công</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {data.reservedWarehouses.map((warehouse, idx) => (
                      <tr
                        key={idx}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div>
                            <span className="font-medium text-gray-900 dark:text-white block">
                              {warehouse.warehouseName}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="font-bold text-amber-600 dark:text-amber-400 text-base">
                            {warehouse.reservedQuantity.toLocaleString()}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          {warehouse.assignedWarehouse ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 text-xs font-medium rounded-full">
                              ✓ Có
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400 text-xs font-medium rounded-full">
                              ✗ Không
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Section 5: Danh sách sản phẩm */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Package className="w-5 h-5 text-gray-400" />
                Danh sách sản phẩm
              </h3>
              <span className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-xs font-medium px-2.5 py-1 rounded-lg">
                Tổng {data.itemResponseList?.length || 0} mặt hàng
              </span>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700 text-xs uppercase text-gray-500 font-semibold tracking-wider">
                    <th className="px-6 py-4">STT</th>
                    <th className="px-6 py-4">Sản phẩm</th>
                    {/* Cột Màu sắc mới */}
                    <th className="px-6 py-4 text-center">Màu sắc</th>
                    <th className="px-6 py-4 text-right">Số lượng</th>
                    <th className="px-6 py-4 text-right">Đã đặt trước</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {data.itemResponseList?.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-6 py-8 text-center text-gray-400 text-sm"
                      >
                        Không có sản phẩm nào trong phiếu này.
                      </td>
                    </tr>
                  ) : (
                    data.itemResponseList?.map((item, index) => {
                      const detail = productDetails[item.productColorId];
                      const imageUrl =
                        detail?.images?.[0]?.image ||
                        detail?.product?.thumbnailImage ||
                        "https://placehold.co/100?text=No+Image";
                      const colorHex = detail?.color?.hexCode;
                      const colorName = detail?.color?.colorName;

                      return (
                        <tr
                          key={item.id}
                          className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                        >
                          <td className="px-6 py-4 text-sm text-gray-400 w-16">
                            {index + 1}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              {/* Hình ảnh */}
                              <div className="w-12 h-12 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden bg-gray-100 shrink-0 relative">
                                <img
                                  src={imageUrl}
                                  alt={item.productName}
                                  className="w-full h-full object-cover"
                                />
                              </div>

                              {/* Tên sản phẩm (Đã ẩn ID) */}
                              <div>
                                <span
                                  className="font-medium text-gray-900 dark:text-white block line-clamp-2"
                                  title={item.productName}
                                >
                                  {item.productName}
                                </span>
                              </div>
                            </div>
                          </td>
                          {/* Hiển thị màu ở cột riêng */}
                          <td className="px-6 py-4 text-center">
                            {colorHex ? (
                              <div className="flex flex-col items-center justify-center gap-1">
                                <div
                                  className="w-6 h-6 rounded-full border border-gray-200 shadow-sm"
                                  style={{ backgroundColor: colorHex }}
                                />
                                <span className="text-xs text-gray-500 font-medium">
                                  {colorName || "N/A"}
                                </span>
                              </div>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span
                              className={`font-bold ${config.themeColor} text-base`}
                            >
                              {item.quantity.toLocaleString()}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right text-sm text-gray-500">
                            {item.reservedQuantity > 0
                              ? item.reservedQuantity.toLocaleString()
                              : "-"}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
                {data.itemResponseList && data.itemResponseList.length > 0 && (
                  <tfoot className="bg-gray-50 dark:bg-gray-800/80 border-t border-gray-200 dark:border-gray-700">
                    <tr>
                      {/* Tăng colSpan lên 3 vì đã thêm 1 cột */}
                      <td
                        colSpan={3}
                        className="px-6 py-4 text-sm font-semibold text-gray-600 dark:text-gray-300 text-right"
                      >
                        Tổng cộng:
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-lg font-bold text-gray-900 dark:text-white">
                          {totalQuantity.toLocaleString()}
                        </span>
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-5 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 flex justify-end gap-3 z-10">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors"
          >
            Đóng
          </button>
          <button
            className={`px-6 py-2.5 rounded-xl text-sm font-semibold text-white shadow-lg dark:shadow-none hover:opacity-90 transition-all active:scale-95 ${
              config.buttonColor
            } ${
              config.themeColor.includes("emerald")
                ? "shadow-emerald-200/50"
                : config.themeColor.includes("blue")
                ? "shadow-blue-200/50"
                : "shadow-amber-200/50"
            }`}
          >
            {config.printText}
          </button>
        </div>
      </div>

      {/* Modal Xác Nhận Hủy Phiếu */}
      <AnimatePresence>
        {showCancelConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-60 p-4"
            onClick={() => setShowCancelConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", duration: 0.3 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start gap-4">
                <div className="shrink-0 w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Xác nhận hủy phiếu giữ hàng
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">
                    Bạn có chắc chắn muốn hủy phiếu giữ hàng{" "}
                    <span className="font-semibold">#{data.id}</span>?
                  </p>
                  <p className="text-sm text-red-600 dark:text-red-400 font-medium">
                    ⚠️ Hành động này không thể hoàn tác.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowCancelConfirm(false)}
                  className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg font-medium transition-colors"
                >
                  Không, quay lại
                </button>
                <button
                  onClick={handleCancelReserve}
                  disabled={cancelling}
                  className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {cancelling ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Đang hủy...
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4" />
                      Có, hủy phiếu
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default InventoryDetailModal;
