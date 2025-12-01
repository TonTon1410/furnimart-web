/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import {
  Package,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
  Calendar,
  FileText,
  MapPin,
} from "lucide-react";
import inventoryService from "@/service/inventoryService";
import warehousesService from "@/service/warehousesService";
import { authService } from "@/service/authService";
import { productService } from "@/service/productService";

interface LocationItem {
  createdAt: string;
  updatedAt: string;
  isDeleted: boolean;
  id: string;
  rowLabel: number;
  columnNumber: number;
  code: string;
  description: string;
  status: "ACTIVE" | "INACTIVE";
  quantity: number;
}

interface TransferItem {
  id: number;
  quantity: number;
  productColorId: string;
  productName: string;
  reservedQuantity: number;
  locationItem: LocationItem;
  locationId: string;
  inventoryId: number;
}

interface ProductColorDetail {
  id: string;
  color: {
    id: string;
    colorName: string;
    hexCode: string;
  };
  images: Array<{
    id: string;
    image: string;
  }>;
  status: string;
}

interface TransferRequest {
  id: number;
  employeeId: string;
  type: "IN" | "OUT" | "TRANSFER";
  purpose: string;
  date: string;
  note: string;
  warehouseName: string;
  warehouseId: string;
  orderId: number;
  transferStatus: "PENDING" | "ACCEPTED" | "FINISHED" | "REJECTED";
  itemResponseList: TransferItem[];
}

export default function TransferRequestsPage() {
  const [requests, setRequests] = useState<TransferRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [productColors, setProductColors] = useState<
    Map<string, ProductColorDetail>
  >(new Map());
  const [processingIds, setProcessingIds] = useState<Set<number>>(new Set());
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  useEffect(() => {
    loadWarehouseAndRequests();
  }, []);

  const loadProductColors = async (items: TransferItem[]) => {
    const colorIds = items.map((item) => item.productColorId);
    const newColors = new Map(productColors);

    for (const colorId of colorIds) {
      if (!newColors.has(colorId)) {
        try {
          const res = await productService.getProductColorById(colorId);
          const colorData = res.data?.data || res.data;
          if (colorData) {
            newColors.set(colorId, colorData);
          }
        } catch (err) {
          console.error(`Failed to load product color ${colorId}:`, err);
        }
      }
    }

    setProductColors(newColors);
  };

  // Load product color details when requests are loaded or expanded
  useEffect(() => {
    if (expandedIds.size > 0) {
      const expandedRequests = requests.filter((r) => expandedIds.has(r.id));
      expandedRequests.forEach((request) => {
        loadProductColors(request.itemResponseList);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expandedIds, requests]);

  const loadWarehouseAndRequests = async () => {
    try {
      setLoading(true);
      setError(null);

      const storeId = authService.getStoreId();
      if (!storeId) {
        setError("Không tìm thấy thông tin cửa hàng");
        setLoading(false);
        return;
      }

      // Lấy warehouse của store
      const warehouseRes = await warehousesService.getWarehouseByStore(storeId);
      const warehouseData = warehouseRes.data?.data || warehouseRes.data;

      if (!warehouseData || !warehouseData.id) {
        setError("Chưa có kho hàng. Vui lòng tạo kho trước.");
        setLoading(false);
        return;
      }

      // Lấy danh sách yêu cầu chuyển kho đang chờ
      const transferRes = await inventoryService.getPendingTransfers(
        warehouseData.id
      );
      const transferData = transferRes.data?.data || transferRes.data || [];

      // Sắp xếp: PENDING lên đầu, sau đó theo id giảm dần (mới nhất lên trước)
      const sortedData = Array.isArray(transferData)
        ? [...transferData].sort((a, b) => {
            // Ưu tiên PENDING lên đầu
            if (
              a.transferStatus === "PENDING" &&
              b.transferStatus !== "PENDING"
            )
              return -1;
            if (
              a.transferStatus !== "PENDING" &&
              b.transferStatus === "PENDING"
            )
              return 1;
            // Cùng status thì sắp xếp theo id giảm dần
            return b.id - a.id;
          })
        : [];

      setRequests(sortedData);
    } catch (err: any) {
      console.error("Error loading transfer requests:", err);
      if (err?.response?.status === 404) {
        setRequests([]);
      } else {
        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Không thể tải danh sách yêu cầu chuyển kho"
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleStatusFilter = (status: string) => {
    setStatusFilter((prev) => (prev === status ? null : status));
  };

  const handleApproveOrReject = async (
    inventoryId: number,
    action: "ACCEPTED" | "REJECTED"
  ) => {
    const actionText = action === "ACCEPTED" ? "duyệt" : "từ chối";
    if (!confirm(`Bạn có chắc chắn muốn ${actionText} phiếu này?`)) {
      return;
    }

    setProcessingIds((prev) => new Set(prev).add(inventoryId));

    try {
      await inventoryService.approveOrRejectTransfer(inventoryId, action);

      // Reload lại danh sách sau khi xử lý thành công
      await loadWarehouseAndRequests();

      // Hiển thị thông báo thành công (có thể thêm toast notification)
      alert(
        `${
          actionText.charAt(0).toUpperCase() + actionText.slice(1)
        } phiếu thành công!`
      );
    } catch (err: any) {
      console.error(`Error ${actionText} transfer:`, err);
      alert(
        err?.response?.data?.message ||
          err?.message ||
          `Không thể ${actionText} phiếu`
      );
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(inventoryId);
        return next;
      });
    }
  };

  const handleFinish = async (inventoryId: number) => {
    if (!confirm("Bạn có chắc chắn muốn hoàn thành phiếu này?")) {
      return;
    }

    setProcessingIds((prev) => new Set(prev).add(inventoryId));

    try {
      await inventoryService.approveOrRejectTransfer(inventoryId, "FINISHED");

      // Reload lại danh sách sau khi xử lý thành công
      await loadWarehouseAndRequests();

      alert("Hoàn thành phiếu thành công!");
    } catch (err: any) {
      console.error("Error finishing transfer:", err);
      alert(
        err?.response?.data?.message ||
          err?.message ||
          "Không thể hoàn thành phiếu"
      );
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(inventoryId);
        return next;
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "ACCEPTED":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
      case "FINISHED":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "REJECTED":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Clock className="w-4 h-4" />;
      case "ACCEPTED":
        return <CheckCircle className="w-4 h-4" />;
      case "FINISHED":
        return <CheckCircle className="w-4 h-4" />;
      case "REJECTED":
        return <XCircle className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "PENDING":
        return "Chờ duyệt";
      case "ACCEPTED":
        return "Đã chấp nhận";
      case "FINISHED":
        return "Hoàn thành";
      case "REJECTED":
        return "Đã từ chối";
      default:
        return status;
    }
  };

  const getPurposeText = (purpose: string) => {
    switch (purpose) {
      case "STOCK_IN":
        return "Nhập kho";
      case "BS_STOCK":
        return "Bán hàng";
      case "TRANSFER":
        return "Chuyển kho";
      default:
        return purpose;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex items-center gap-2 text-gray-500">
          <Loader2 className="w-5 h-5 animate-spin" />
          Đang tải danh sách yêu cầu...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-red-200 dark:border-red-800 p-8 text-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Có lỗi xảy ra
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
            <button
              onClick={loadWarehouseAndRequests}
              className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 dark:bg-emerald-700 text-white rounded-lg hover:bg-emerald-700 dark:hover:bg-emerald-600 transition-colors"
            >
              <Loader2 className="w-5 h-5" />
              Thử lại
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Breadcrumb */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Yêu cầu chuyển kho đang chờ
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Quản lý / Danh sách chờ chuyển kho
        </p>
      </div>

      {/* Stats - Filter Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <button
          onClick={() => toggleStatusFilter("PENDING")}
          className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border-2 p-3 sm:p-4 transition-all hover:shadow-md active:scale-95 ${
            statusFilter === "PENDING"
              ? "border-yellow-500 dark:border-yellow-400 ring-2 ring-yellow-200 dark:ring-yellow-900/50"
              : "border-gray-200 dark:border-gray-700 hover:border-yellow-300"
          }`}
        >
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-2 sm:p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg shrink-0">
              <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className="text-left min-w-0">
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">
                Chờ duyệt
              </p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                {requests.filter((r) => r.transferStatus === "PENDING").length}
              </p>
            </div>
          </div>
        </button>

        <button
          onClick={() => toggleStatusFilter("ACCEPTED")}
          className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border-2 p-3 sm:p-4 transition-all hover:shadow-md active:scale-95 ${
            statusFilter === "ACCEPTED"
              ? "border-blue-500 dark:border-blue-400 ring-2 ring-blue-200 dark:ring-blue-900/50"
              : "border-gray-200 dark:border-gray-700 hover:border-blue-300"
          }`}
        >
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-2 sm:p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg shrink-0">
              <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="text-left min-w-0">
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">
                Đã chấp nhận
              </p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                {requests.filter((r) => r.transferStatus === "ACCEPTED").length}
              </p>
            </div>
          </div>
        </button>

        <button
          onClick={() => toggleStatusFilter("FINISHED")}
          className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border-2 p-3 sm:p-4 transition-all hover:shadow-md active:scale-95 ${
            statusFilter === "FINISHED"
              ? "border-green-500 dark:border-green-400 ring-2 ring-green-200 dark:ring-green-900/50"
              : "border-gray-200 dark:border-gray-700 hover:border-green-300"
          }`}
        >
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-2 sm:p-3 bg-green-100 dark:bg-green-900/30 rounded-lg shrink-0">
              <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="text-left min-w-0">
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">
                Hoàn thành
              </p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                {requests.filter((r) => r.transferStatus === "FINISHED").length}
              </p>
            </div>
          </div>
        </button>

        <button
          onClick={() => toggleStatusFilter("REJECTED")}
          className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border-2 p-3 sm:p-4 transition-all hover:shadow-md active:scale-95 ${
            statusFilter === "REJECTED"
              ? "border-red-500 dark:border-red-400 ring-2 ring-red-200 dark:ring-red-900/50"
              : "border-gray-200 dark:border-gray-700 hover:border-red-300"
          }`}
        >
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-2 sm:p-3 bg-red-100 dark:bg-red-900/30 rounded-lg shrink-0">
              <XCircle className="w-5 h-5 sm:w-6 sm:h-6 text-red-600 dark:text-red-400" />
            </div>
            <div className="text-left min-w-0">
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">
                Đã từ chối
              </p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                {requests.filter((r) => r.transferStatus === "REJECTED").length}
              </p>
            </div>
          </div>
        </button>
      </div>

      {/* Requests List */}
      {(() => {
        const filteredRequests = statusFilter
          ? requests.filter((r) => r.transferStatus === statusFilter)
          : requests;

        return filteredRequests.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Không có yêu cầu chuyển kho
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Hiện tại chưa có yêu cầu chuyển kho nào đang chờ duyệt
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRequests.map((request) => (
              <div
                key={request.id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
              >
                {/* Header */}
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <div
                    className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors -m-4 p-4"
                    onClick={() => toggleExpand(request.id)}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-3 flex-wrap">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Phiếu #{request.id}
                          </h3>
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                              request.transferStatus
                            )}`}
                          >
                            {getStatusIcon(request.transferStatus)}
                            {getStatusText(request.transferStatus)}
                          </span>
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                            {getPurposeText(request.purpose)}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                            <MapPin className="w-4 h-4" />
                            <span>{request.warehouseName}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                            <Calendar className="w-4 h-4" />
                            <span>
                              {new Date(request.date).toLocaleDateString(
                                "vi-VN"
                              )}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                            <Package className="w-4 h-4" />
                            <span>
                              {request.itemResponseList.length} sản phẩm
                            </span>
                          </div>
                        </div>

                        {request.note && (
                          <div className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <FileText className="w-4 h-4 mt-0.5 shrink-0" />
                            <span>{request.note}</span>
                          </div>
                        )}
                      </div>

                      <div className="shrink-0">
                        {expandedIds.has(request.id) ? (
                          <ChevronUp className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  {request.transferStatus === "PENDING" && (
                    <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleApproveOrReject(request.id, "ACCEPTED");
                        }}
                        disabled={processingIds.has(request.id)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white rounded-lg text-sm font-medium transition-colors disabled:cursor-not-allowed"
                      >
                        {processingIds.has(request.id) ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Đang xử lý...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4" />
                            Duyệt phiếu
                          </>
                        )}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleApproveOrReject(request.id, "REJECTED");
                        }}
                        disabled={processingIds.has(request.id)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg text-sm font-medium transition-colors disabled:cursor-not-allowed"
                      >
                        {processingIds.has(request.id) ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Đang xử lý...
                          </>
                        ) : (
                          <>
                            <XCircle className="w-4 h-4" />
                            Từ chối
                          </>
                        )}
                      </button>
                    </div>
                  )}
                  {request.transferStatus === "ACCEPTED" && (
                    <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleFinish(request.id);
                        }}
                        disabled={processingIds.has(request.id)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg text-sm font-medium transition-colors disabled:cursor-not-allowed"
                      >
                        {processingIds.has(request.id) ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Đang xử lý...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4" />
                            Hoàn thành
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {/* Expanded Details */}
                <div
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    expandedIds.has(request.id)
                      ? "max-h-[2000px] opacity-100"
                      : "max-h-0 opacity-0"
                  }`}
                >
                  <div className="p-4 bg-gray-50 dark:bg-gray-900">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                      Chi tiết sản phẩm
                    </h4>
                    <div className="space-y-3">
                      {request.itemResponseList.map((item) => {
                        const colorDetail = productColors.get(
                          item.productColorId
                        );
                        const imageUrl = colorDetail?.images?.[0]?.image;

                        return (
                          <div
                            key={item.id}
                            className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700"
                          >
                            <div className="flex items-start gap-3">
                              {/* Product Image */}
                              {imageUrl ? (
                                <img
                                  src={imageUrl}
                                  alt={item.productName}
                                  className="w-16 h-16 object-cover rounded-lg border border-gray-200 dark:border-gray-700 shrink-0"
                                />
                              ) : (
                                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center shrink-0">
                                  <Package className="w-8 h-8 text-gray-400" />
                                </div>
                              )}

                              {/* Product Info */}
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-900 dark:text-white">
                                  {item.productName}
                                </p>

                                {/* Color Info */}
                                {colorDetail && (
                                  <div className="flex items-center gap-2 mt-1">
                                    <span
                                      className="w-4 h-4 rounded-full border border-gray-300 dark:border-gray-600"
                                      style={{
                                        backgroundColor:
                                          colorDetail.color.hexCode,
                                      }}
                                    />
                                    <span className="text-sm text-gray-600 dark:text-gray-400">
                                      {colorDetail.color.colorName}
                                    </span>
                                  </div>
                                )}

                                {/* Quantity and Location */}
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-gray-600 dark:text-gray-400">
                                  {item.locationItem && (
                                    <span className="flex items-center gap-1">
                                      <MapPin className="w-3.5 h-3.5" />
                                      {item.locationItem.code}
                                    </span>
                                  )}
                                  <span className="flex items-center gap-1">
                                    <Package className="w-3.5 h-3.5" />
                                    SL: {item.quantity}
                                  </span>
                                  {item.reservedQuantity > 0 && (
                                    <span className="text-yellow-600 dark:text-yellow-400 font-medium">
                                      Đã đặt: {item.reservedQuantity}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        );
      })()}
    </div>
  );
}
