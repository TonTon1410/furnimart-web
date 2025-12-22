import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Shield,
  Calendar,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import warrantyService, {
  type Warranty,
  type WarrantyClaim,
} from "@/service/warrantyService";
import { productService, type ProductColor } from "@/service/productService";
import { authService } from "@/service/authService";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

type TabKey = "warranties" | "claims";

const WarrantyManagement = () => {
  const [activeTab, setActiveTab] = useState<TabKey>("warranties");
  const [warranties, setWarranties] = useState<Warranty[]>([]);
  const [warrantyClaims, setWarrantyClaims] = useState<WarrantyClaim[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [productColors, setProductColors] = useState<Map<string, ProductColor>>(
    new Map()
  );
  const [selectedWarranty, setSelectedWarranty] = useState<Warranty | null>(
    null
  );
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState<WarrantyClaim | null>(
    null
  );
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [resolvingClaim, setResolvingClaim] = useState(false);
  const [resolveForm, setResolveForm] = useState({
    actionType: "REPAIR" as "RETURN" | "REPAIR" | "DO_NOTHING",
    adminResponse: "",
    resolutionNotes: "",
    repairCost: 0,
    refundAmount: 0,
  });

  const pageSize = 10;

  // Load warranties or claims based on active tab
  useEffect(() => {
    if (activeTab === "warranties") {
      loadWarranties();
    } else {
      loadWarrantyClaims();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, currentPage]);

  const loadWarranties = async () => {
    setLoading(true);
    setError(null);
    try {
      // Get store ID from token
      const storeId = authService.getStoreId();

      if (!storeId) {
        setError("Không tìm thấy thông tin cửa hàng");
        return;
      }

      const result = await warrantyService.getWarrantiesByStore(
        storeId,
        currentPage,
        pageSize
      );

      const sortedWarranties = result.content.sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return dateB - dateA;
      });

      setWarranties(sortedWarranties);
      setTotalPages(result.totalPages);
      setTotalElements(result.totalElements);

      // Load product colors
      const productColorMap = new Map<string, ProductColor>();
      const uniqueProductColorIds = new Set<string>();

      sortedWarranties.forEach((warranty) => {
        if (warranty.productColorId) {
          uniqueProductColorIds.add(warranty.productColorId);
        }
      });

      await Promise.all(
        Array.from(uniqueProductColorIds).map(async (productColorId) => {
          try {
            const response = await productService.getProductColorById(
              productColorId
            );
            if (response.data.data) {
              productColorMap.set(productColorId, response.data.data);
            }
          } catch (error) {
            console.error(
              `Error loading product color ${productColorId}:`,
              error
            );
          }
        })
      );

      setProductColors(productColorMap);
    } catch (error) {
      console.error("Error loading warranties:", error);
      setError("Không thể tải danh sách bảo hành");
    } finally {
      setLoading(false);
    }
  };

  const loadWarrantyClaims = async () => {
    setLoading(true);
    setError(null);
    try {
      const storeId = authService.getStoreId();

      if (!storeId) {
        setError("Không tìm thấy thông tin cửa hàng");
        return;
      }

      const claims = await warrantyService.getWarrantyClaimsByStore(storeId);

      // Sort by createdAt
      const sortedClaims = claims.sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return dateB - dateA;
      });

      setWarrantyClaims(sortedClaims);

      // Load product colors for claim items
      const productColorMap = new Map<string, ProductColor>();
      const uniqueProductColorIds = new Set<string>();

      sortedClaims.forEach((claim) => {
        claim.items.forEach((item) => {
          if (item.productColorId) {
            uniqueProductColorIds.add(item.productColorId);
          }
        });
      });

      await Promise.all(
        Array.from(uniqueProductColorIds).map(async (productColorId) => {
          try {
            const response = await productService.getProductColorById(
              productColorId
            );
            if (response.data.data) {
              productColorMap.set(productColorId, response.data.data);
            }
          } catch (error) {
            console.error(
              `Error loading product color ${productColorId}:`,
              error
            );
          }
        })
      );

      setProductColors(productColorMap);
    } catch (error) {
      console.error("Error loading warranty claims:", error);
      setError("Không thể tải danh sách yêu cầu bảo hành");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateClaimStatus = async (
    claimId: number,
    status: "APPROVED" | "REJECTED" | "UNDER_REVIEW" | "CANCELLED",
    adminResponse?: string
  ) => {
    try {
      await warrantyService.updateWarrantyClaimStatus(claimId, {
        status,
        adminResponse,
      });
      await loadWarrantyClaims();
      setShowClaimModal(false);
    } catch (error) {
      console.error("Error updating claim status:", error);
      alert("Không thể cập nhật trạng thái yêu cầu");
    }
  };

  const handleResolveClaim = async () => {
    if (!selectedClaim) return;

    setResolvingClaim(true);
    try {
      await warrantyService.resolveWarrantyClaim(selectedClaim.id, {
        claimId: selectedClaim.id,
        actionType: resolveForm.actionType,
        adminResponse: resolveForm.adminResponse,
        resolutionNotes: resolveForm.resolutionNotes,
        ...(resolveForm.actionType === "REPAIR" && {
          repairCost: resolveForm.repairCost,
        }),
        ...(resolveForm.actionType === "RETURN" && {
          refundAmount: resolveForm.refundAmount,
        }),
      });

      await loadWarrantyClaims();
      setShowResolveModal(false);
      setShowClaimModal(false);
      setResolveForm({
        actionType: "REPAIR",
        adminResponse: "",
        resolutionNotes: "",
        repairCost: 0,
        refundAmount: 0,
      });
    } catch (error) {
      console.error("Error resolving claim:", error);
      alert("Không thể giải quyết yêu cầu bảo hành");
    } finally {
      setResolvingClaim(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status: string) => {
    const colors = {
      ACTIVE:
        "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
      EXPIRED: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
      EXHAUSTED:
        "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400",
      CANCELLED:
        "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400",
    };
    return colors[status as keyof typeof colors] || colors.ACTIVE;
  };

  const getClaimStatusColor = (status: string) => {
    const colors = {
      PENDING:
        "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400",
      UNDER_REVIEW:
        "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
      APPROVED:
        "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
      REJECTED: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
      RESOLVED:
        "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400",
      CANCELLED:
        "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400",
    };
    return colors[status as keyof typeof colors] || colors.PENDING;
  };

  const getClaimStatusLabel = (status: string) => {
    const labels = {
      PENDING: "Chờ xử lý",
      UNDER_REVIEW: "Đang xem xét",
      APPROVED: "Đã chấp nhận",
      REJECTED: "Từ chối",
      RESOLVED: "Đã giải quyết",
      CANCELLED: "Đã hủy",
    };
    return labels[status as keyof typeof labels] || status;
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      ACTIVE: "Đang hoạt động",
      EXPIRED: "Hết hạn",
      EXHAUSTED: "Đã hết lượt",
      CANCELLED: "Đã hủy",
    };
    return labels[status as keyof typeof labels] || status;
  };

  const filteredWarranties = warranties.filter((warranty) => {
    const productColor = productColors.get(warranty.productColorId);
    const productName = productColor?.product?.name?.toLowerCase() || "";
    const query = searchQuery.toLowerCase();

    return (
      warranty.id.toString().includes(query) ||
      warranty.orderId.toString().includes(query) ||
      productName.includes(query)
    );
  });

  const filteredClaims = warrantyClaims.filter((claim) => {
    const query = searchQuery.toLowerCase();

    return (
      claim.id.toString().includes(query) ||
      claim.orderId.toString().includes(query) ||
      claim.customerId.toLowerCase().includes(query)
    );
  });

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeUp}
      className="p-6 space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Shield className="h-6 w-6 text-green-600" />
            Quản lý Bảo hành
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Quản lý danh sách bảo hành và yêu cầu bảo hành của cửa hàng
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-border">
        <button
          onClick={() => {
            setActiveTab("warranties");
            setCurrentPage(1);
            setSearchQuery("");
          }}
          className={`pb-3 px-4 relative ${
            activeTab === "warranties"
              ? "text-primary font-semibold"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Danh sách bảo hành
          {activeTab === "warranties" && (
            <motion.div
              layoutId="activeTab"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
            />
          )}
        </button>
        <button
          onClick={() => {
            setActiveTab("claims");
            setCurrentPage(1);
            setSearchQuery("");
          }}
          className={`pb-3 px-4 relative ${
            activeTab === "claims"
              ? "text-primary font-semibold"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Yêu cầu bảo hành
          {activeTab === "claims" && (
            <motion.div
              layoutId="activeTab"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
            />
          )}
        </button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Tìm kiếm theo mã bảo hành, đơn hàng, sản phẩm..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-background text-foreground"
          />
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-800 dark:text-red-300">
            <AlertCircle className="h-5 w-5" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600 mx-auto mb-3"></div>
          <p className="text-sm text-muted-foreground">
            Đang tải danh sách{" "}
            {activeTab === "warranties" ? "bảo hành" : "yêu cầu bảo hành"}...
          </p>
        </div>
      ) : activeTab === "warranties" ? (
        filteredWarranties.length === 0 ? (
          <div className="text-center py-12">
            <Shield className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Không có bảo hành nào
            </h3>
            <p className="text-sm text-muted-foreground">
              {searchQuery
                ? "Không tìm thấy bảo hành phù hợp"
                : "Chưa có bảo hành nào trong cửa hàng"}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredWarranties.map((warranty) => {
              const productColor = productColors.get(warranty.productColorId);

              return (
                <motion.div
                  key={warranty.id}
                  variants={fadeUp}
                  className="bg-card rounded-lg border border-border p-4 hover:shadow-lg transition-all duration-200"
                >
                  <div className="flex gap-4">
                    {/* Product Image */}
                    {productColor?.images?.[0]?.image && (
                      <img
                        src={productColor.images[0].image}
                        alt={productColor.product?.name || "Product"}
                        className="w-24 h-24 object-cover rounded-lg border border-border"
                      />
                    )}

                    {/* Main Info */}
                    <div className="flex-1 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-foreground text-lg">
                            {productColor?.product?.name || "Sản phẩm"}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            Mã bảo hành: #{warranty.id} | Đơn hàng: #
                            {warranty.orderId}
                          </p>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                            warranty.status
                          )}`}
                        >
                          {getStatusLabel(warranty.status)}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            Thời hạn:
                          </span>
                          <span className="text-foreground font-medium">
                            {warranty.warrantyDurationMonths} tháng
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            Bắt đầu:
                          </span>
                          <span className="text-foreground">
                            {formatDate(warranty.warrantyStartDate)}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            Kết thúc:
                          </span>
                          <span className="text-foreground">
                            {formatDate(warranty.warrantyEndDate)}
                          </span>
                        </div>
                      </div>

                      {/* Claim Info */}
                      <div className="flex items-center justify-between pt-3 border-t border-border">
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-1">
                            {warranty.canClaimWarranty ? (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-600" />
                            )}
                            <span
                              className={
                                warranty.canClaimWarranty
                                  ? "text-green-600"
                                  : "text-red-600"
                              }
                            >
                              {warranty.canClaimWarranty
                                ? "Có thể yêu cầu"
                                : "Không thể yêu cầu"}
                            </span>
                          </div>
                          <span className="text-muted-foreground">
                            Đã yêu cầu:{" "}
                            <span className="font-medium text-foreground">
                              {warranty.claimCount}/{warranty.maxClaims}
                            </span>
                          </span>
                        </div>

                        <button
                          onClick={() => {
                            setSelectedWarranty(warranty);
                            setShowDetailModal(true);
                          }}
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
                        >
                          Xem chi tiết
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )
      ) : filteredClaims.length === 0 ? (
        <div className="text-center py-12">
          <Shield className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Không có yêu cầu bảo hành nào
          </h3>
          <p className="text-sm text-muted-foreground">
            Chưa có yêu cầu bảo hành nào được gửi đến cửa hàng
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredClaims.map((claim, index) => (
            <motion.div
              key={claim.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-card border border-border rounded-xl p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-foreground">
                      Yêu cầu #{claim.id}
                    </h3>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${getClaimStatusColor(
                        claim.status
                      )}`}
                    >
                      {getClaimStatusLabel(claim.status)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">
                        Mã đơn hàng:{" "}
                      </span>
                      <span className="font-medium text-foreground">
                        #{claim.orderId}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">
                        Khách hàng:{" "}
                      </span>
                      <span className="font-medium text-foreground">
                        {claim.customerId}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">
                        Số sản phẩm:{" "}
                      </span>
                      <span className="font-medium text-foreground">
                        {claim.items.length}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Ngày tạo: </span>
                      <span className="font-medium text-foreground">
                        {formatDate(claim.createdAt)}
                      </span>
                    </div>
                  </div>

                  {claim.actionType && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">Hành động:</span>
                      <span className="font-medium text-foreground">
                        {claim.actionType === "RETURN" && "Trả hàng"}
                        {claim.actionType === "REPAIR" && "Sửa chữa"}
                        {claim.actionType === "DO_NOTHING" && "Không xử lý"}
                      </span>
                      {claim.actionType === "RETURN" && claim.refundAmount && (
                        <span className="text-green-600">
                          (Hoàn tiền: {claim.refundAmount.toLocaleString()}₫)
                        </span>
                      )}
                      {claim.actionType === "REPAIR" && claim.repairCost && (
                        <span className="text-blue-600">
                          (Chi phí: {claim.repairCost.toLocaleString()}₫)
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => {
                    setSelectedClaim(claim);
                    setShowClaimModal(true);
                  }}
                  className="ml-4 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Xử lý
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && filteredWarranties.length > 0 && totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-border pt-4">
          <p className="text-sm text-muted-foreground">
            Hiển thị {(currentPage - 1) * pageSize + 1} -{" "}
            {Math.min(currentPage * pageSize, totalElements)} trong tổng số{" "}
            {totalElements}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="p-2 border border-border rounded-lg hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label="Trang trước"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-4 py-2 text-sm text-foreground">
              Trang {currentPage} / {totalPages}
            </span>
            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(totalPages, prev + 1))
              }
              disabled={currentPage === totalPages}
              className="p-2 border border-border rounded-lg hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label="Trang sau"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedWarranty && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex justify-between items-center">
              <h3 className="text-lg font-bold text-foreground">
                Chi tiết bảo hành #{selectedWarranty.id}
              </h3>
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedWarranty(null);
                }}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
                aria-label="Đóng"
              >
                <XCircle className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Product Info */}
              {productColors.get(selectedWarranty.productColorId) && (
                <div className="flex gap-4 p-4 bg-muted/30 rounded-lg">
                  <img
                    src={
                      productColors.get(selectedWarranty.productColorId)!
                        .images[0].image
                    }
                    alt="Product"
                    className="w-24 h-24 object-cover rounded-lg border border-border"
                  />
                  <div>
                    <h4 className="font-semibold text-foreground">
                      {
                        productColors.get(selectedWarranty.productColorId)!
                          .product.name
                      }
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Màu:{" "}
                      {
                        productColors.get(selectedWarranty.productColorId)!
                          .color.colorName
                      }
                    </p>
                  </div>
                </div>
              )}

              {/* Warranty Details */}
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-border">
                  <span className="text-sm text-muted-foreground">
                    Trạng thái
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                      selectedWarranty.status
                    )}`}
                  >
                    {getStatusLabel(selectedWarranty.status)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-border">
                  <span className="text-sm text-muted-foreground">
                    Mã đơn hàng
                  </span>
                  <span className="text-sm font-medium text-foreground">
                    #{selectedWarranty.orderId}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-border">
                  <span className="text-sm text-muted-foreground">
                    Thời hạn bảo hành
                  </span>
                  <span className="text-sm font-medium text-foreground">
                    {selectedWarranty.warrantyDurationMonths} tháng
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-border">
                  <span className="text-sm text-muted-foreground">
                    Số lần yêu cầu
                  </span>
                  <span className="text-sm font-medium text-foreground">
                    {selectedWarranty.claimCount}/{selectedWarranty.maxClaims}
                  </span>
                </div>
                {selectedWarranty.description && (
                  <div className="flex justify-between items-start py-2 border-b border-border">
                    <span className="text-sm text-muted-foreground">Mô tả</span>
                    <span className="text-sm text-foreground text-right max-w-md">
                      {selectedWarranty.description}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Claim Detail & Processing Modal */}
      {showClaimModal && selectedClaim && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex justify-between items-center">
              <h3 className="text-lg font-bold text-foreground">
                Xử lý yêu cầu bảo hành #{selectedClaim.id}
              </h3>
              <button
                onClick={() => {
                  setShowClaimModal(false);
                  setSelectedClaim(null);
                }}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
                aria-label="Đóng"
              >
                <XCircle className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Claim Status */}
              <div className="flex items-center gap-4">
                <span
                  className={`px-4 py-2 rounded-full text-sm font-medium ${getClaimStatusColor(
                    selectedClaim.status
                  )}`}
                >
                  {getClaimStatusLabel(selectedClaim.status)}
                </span>
                <span className="text-sm text-muted-foreground">
                  Ngày tạo: {formatDate(selectedClaim.createdAt)}
                </span>
              </div>

              {/* Customer & Order Info */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
                <div>
                  <span className="text-sm text-muted-foreground">
                    Mã đơn hàng
                  </span>
                  <p className="font-medium text-foreground">
                    #{selectedClaim.orderId}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">
                    Khách hàng
                  </span>
                  <p className="font-medium text-foreground">
                    {selectedClaim.customerId}
                  </p>
                </div>
              </div>

              {/* Claim Items */}
              <div>
                <h4 className="font-semibold text-foreground mb-3">
                  Sản phẩm yêu cầu bảo hành
                </h4>
                <div className="space-y-4">
                  {selectedClaim.items.map((item, index) => {
                    const productColor = productColors.get(item.productColorId);
                    return (
                      <div
                        key={index}
                        className="border border-border rounded-lg p-4 space-y-3"
                      >
                        {productColor && (
                          <div className="flex gap-4">
                            <img
                              src={productColor.images[0].image}
                              alt="Product"
                              className="w-20 h-20 object-cover rounded-lg border border-border"
                            />
                            <div className="flex-1">
                              <h5 className="font-semibold text-foreground">
                                {productColor.product.name}
                              </h5>
                              <p className="text-sm text-muted-foreground">
                                Màu: {productColor.color.colorName}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Số lượng: {item.quantity}
                              </p>
                            </div>
                          </div>
                        )}
                        <div>
                          <span className="text-sm font-medium text-muted-foreground">
                            Mô tả vấn đề:
                          </span>
                          <p className="text-sm text-foreground mt-1">
                            {item.issueDescription}
                          </p>
                        </div>
                        {item.customerPhotos &&
                          item.customerPhotos.length > 0 && (
                            <div>
                              <span className="text-sm font-medium text-muted-foreground">
                                Hình ảnh:
                              </span>
                              <div className="flex gap-2 mt-2 flex-wrap">
                                {item.customerPhotos.map(
                                  (photo, photoIndex) => (
                                    <img
                                      key={photoIndex}
                                      src={photo}
                                      alt={`Photo ${photoIndex + 1}`}
                                      className="w-24 h-24 object-cover rounded-lg border border-border cursor-pointer hover:opacity-80 transition-opacity"
                                      onClick={() =>
                                        window.open(photo, "_blank")
                                      }
                                    />
                                  )
                                )}
                              </div>
                            </div>
                          )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Current Resolution Info */}
              {(selectedClaim.adminResponse ||
                selectedClaim.resolutionNotes ||
                selectedClaim.actionType) && (
                <div className="border-t border-border pt-4 space-y-3">
                  <h4 className="font-semibold text-foreground">
                    Thông tin giải quyết
                  </h4>
                  {selectedClaim.actionType && (
                    <div>
                      <span className="text-sm text-muted-foreground">
                        Hành động:
                      </span>
                      <p className="text-sm font-medium text-foreground">
                        {selectedClaim.actionType === "RETURN" && "Trả hàng"}
                        {selectedClaim.actionType === "REPAIR" && "Sửa chữa"}
                        {selectedClaim.actionType === "DO_NOTHING" &&
                          "Không xử lý"}
                      </p>
                    </div>
                  )}
                  {selectedClaim.repairCost != null &&
                    selectedClaim.repairCost > 0 && (
                      <div>
                        <span className="text-sm text-muted-foreground">
                          Chi phí sửa chữa:
                        </span>
                        <p className="text-sm font-medium text-blue-600">
                          {selectedClaim.repairCost.toLocaleString()}₫
                        </p>
                      </div>
                    )}
                  {selectedClaim.refundAmount != null &&
                    selectedClaim.refundAmount > 0 && (
                      <div>
                        <span className="text-sm text-muted-foreground">
                          Số tiền hoàn:
                        </span>
                        <p className="text-sm font-medium text-green-600">
                          {selectedClaim.refundAmount.toLocaleString()}₫
                        </p>
                      </div>
                    )}
                  {selectedClaim.adminResponse && (
                    <div>
                      <span className="text-sm text-muted-foreground">
                        Phản hồi:
                      </span>
                      <p className="text-sm text-foreground">
                        {selectedClaim.adminResponse}
                      </p>
                    </div>
                  )}
                  {selectedClaim.resolutionNotes && (
                    <div>
                      <span className="text-sm text-muted-foreground">
                        Ghi chú:
                      </span>
                      <p className="text-sm text-foreground">
                        {selectedClaim.resolutionNotes}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              {selectedClaim.status !== "RESOLVED" &&
                selectedClaim.status !== "CANCELLED" && (
                  <div className="border-t border-border pt-4 space-y-3">
                    <h4 className="font-semibold text-foreground">Hành động</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedClaim.status === "PENDING" && (
                        <>
                          <button
                            onClick={() =>
                              handleUpdateClaimStatus(
                                selectedClaim.id,
                                "UNDER_REVIEW"
                              )
                            }
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                          >
                            Chuyển sang xem xét
                          </button>
                          <button
                            onClick={() => {
                              const response = prompt("Lý do từ chối:");
                              if (response) {
                                handleUpdateClaimStatus(
                                  selectedClaim.id,
                                  "REJECTED",
                                  response
                                );
                              }
                            }}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
                          >
                            Từ chối
                          </button>
                        </>
                      )}
                      {(selectedClaim.status === "PENDING" ||
                        selectedClaim.status === "UNDER_REVIEW") && (
                        <button
                          onClick={() =>
                            handleUpdateClaimStatus(
                              selectedClaim.id,
                              "APPROVED"
                            )
                          }
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
                        >
                          Chấp nhận
                        </button>
                      )}
                      {selectedClaim.status === "APPROVED" && (
                        <button
                          onClick={() => setShowResolveModal(true)}
                          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors"
                        >
                          Giải quyết yêu cầu
                        </button>
                      )}
                      <button
                        onClick={() => {
                          const response = prompt("Lý do hủy:");
                          if (response) {
                            handleUpdateClaimStatus(
                              selectedClaim.id,
                              "CANCELLED",
                              response
                            );
                          }
                        }}
                        className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm font-medium transition-colors"
                      >
                        Hủy yêu cầu
                      </button>
                    </div>
                  </div>
                )}
            </div>
          </div>
        </div>
      )}

      {/* Resolve Claim Modal */}
      {showResolveModal && selectedClaim && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-60 p-4">
          <div className="bg-card rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex justify-between items-center">
              <h3 className="text-lg font-bold text-foreground">
                Giải quyết yêu cầu bảo hành
              </h3>
              <button
                onClick={() => setShowResolveModal(false)}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
                aria-label="Đóng"
              >
                <XCircle className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Action Type */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Hành động xử lý <span className="text-red-500">*</span>
                </label>
                <select
                  value={resolveForm.actionType}
                  onChange={(e) =>
                    setResolveForm((prev) => ({
                      ...prev,
                      actionType: e.target.value as
                        | "RETURN"
                        | "REPAIR"
                        | "DO_NOTHING",
                    }))
                  }
                  title="Chọn hành động xử lý"
                  className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-background text-foreground"
                >
                  <option value="REPAIR">Sửa chữa</option>
                  <option value="RETURN">Trả hàng & Hoàn tiền</option>
                  <option value="DO_NOTHING">Không xử lý</option>
                </select>
              </div>

              {/* Repair Cost */}
              {resolveForm.actionType === "REPAIR" && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Chi phí sửa chữa (₫)
                  </label>
                  <input
                    type="number"
                    value={resolveForm.repairCost}
                    onChange={(e) =>
                      setResolveForm((prev) => ({
                        ...prev,
                        repairCost: Number(e.target.value),
                      }))
                    }
                    min="0"
                    placeholder="Nhập chi phí sửa chữa"
                    className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-background text-foreground"
                  />
                </div>
              )}

              {/* Refund Amount */}
              {resolveForm.actionType === "RETURN" && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Số tiền hoàn (₫)
                  </label>
                  <input
                    type="number"
                    value={resolveForm.refundAmount}
                    onChange={(e) =>
                      setResolveForm((prev) => ({
                        ...prev,
                        refundAmount: Number(e.target.value),
                      }))
                    }
                    min="0"
                    placeholder="Nhập số tiền hoàn"
                    className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-background text-foreground"
                  />
                </div>
              )}

              {/* Admin Response */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Phản hồi cho khách hàng{" "}
                  <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={resolveForm.adminResponse}
                  onChange={(e) =>
                    setResolveForm((prev) => ({
                      ...prev,
                      adminResponse: e.target.value,
                    }))
                  }
                  rows={4}
                  placeholder="Nhập phản hồi cho khách hàng..."
                  className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-background text-foreground resize-none"
                />
              </div>

              {/* Resolution Notes */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Ghi chú nội bộ
                </label>
                <textarea
                  value={resolveForm.resolutionNotes}
                  onChange={(e) =>
                    setResolveForm((prev) => ({
                      ...prev,
                      resolutionNotes: e.target.value,
                    }))
                  }
                  rows={3}
                  placeholder="Ghi chú cho nội bộ (không hiển thị cho khách hàng)..."
                  className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-background text-foreground resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleResolveClaim}
                  disabled={resolvingClaim || !resolveForm.adminResponse}
                  className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {resolvingClaim ? "Đang xử lý..." : "Xác nhận giải quyết"}
                </button>
                <button
                  onClick={() => setShowResolveModal(false)}
                  disabled={resolvingClaim}
                  className="px-6 py-3 border border-border rounded-lg hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Hủy
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default WarrantyManagement;
