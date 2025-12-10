/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
// src/pages/VoucherManagement/VoucherManagement.tsx

import { useState, useEffect, useMemo } from "react";
import {
  Search,
  Plus,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Edit,
  Trash2,
  Eye,
  Calendar,
  DollarSign,
  Percent,
  FileText,
} from "lucide-react";
import dayjs from "dayjs";

// Services & Hooks
import vouchersService, {
  type Voucher as VoucherBase,
  type VoucherPayload,
} from "@/service/voucherService";

// Extend Voucher type: Dùng Omit để loại bỏ type gốc trước khi mở rộng
type Voucher = Omit<VoucherBase, "type"> & {
  type:
    | "PERCENTAGE"
    | "FIXED_AMOUNT"
    | "FREE_SHIPPING"
    | "BUY_ONE_GET_ONE"
    | "CASHBACK"
    | "POINTS_REWARD"
    | string;
};

import { useToast } from "@/context/ToastContext";

// Components
import VoucherModal from "./VoucherModal";
import ConfirmDialog from "@/dashboard/roles/manager/components/ConfirmDialog";

// Map các loại Voucher sang tên tiếng Việt
const VOUCHER_TYPES_VIETNAMESE = {
    PERCENTAGE: "Giảm theo Phần trăm (%)",
    FIXED_AMOUNT: "Giảm theo Số tiền (VNĐ)",
    FREE_SHIPPING: "Miễn phí Vận chuyển",
    BUY_ONE_GET_ONE: "Mua 1 Tặng 1",
    CASHBACK: "Hoàn tiền",
    POINTS_REWARD: "Thưởng Điểm",
};

// --- Main Component ---
export default function VoucherManagement() {
  const { showToast } = useToast();

  // --- STATE ---
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filters State
  const [filterType, setFilterType] = useState<string>("ALL");
  const [searchCode, setSearchCode] = useState<string>("");

  // Modal State
  const [modalData, setModalData] = useState<Voucher | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit" | "view">("create");

  // Confirm Delete State
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [voucherToDelete, setVoucherToDelete] = useState<Voucher | null>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Cập nhật danh sách loại lọc
  const filterTypeOptions = [
    { value: "ALL", label: "Tất cả loại voucher" },
    { value: "PERCENTAGE", label: VOUCHER_TYPES_VIETNAMESE.PERCENTAGE },
    { value: "FIXED_AMOUNT", label: VOUCHER_TYPES_VIETNAMESE.FIXED_AMOUNT },
    { value: "FREE_SHIPPING", label: VOUCHER_TYPES_VIETNAMESE.FREE_SHIPPING },
    { value: "BUY_ONE_GET_ONE", label: VOUCHER_TYPES_VIETNAMESE.BUY_ONE_GET_ONE },
    { value: "CASHBACK", label: VOUCHER_TYPES_VIETNAMESE.CASHBACK },
    { value: "POINTS_REWARD", label: VOUCHER_TYPES_VIETNAMESE.POINTS_REWARD },
  ];

  // --- DATA FETCHING ---
  const loadVouchers = async () => {
    setLoading(true);
    try {
      const res = await vouchersService.getVoucherList();
      // FIX: Ép kiểu as any để truy cập .data khi res.data không phải là mảng
      const list = Array.isArray(res.data) ? res.data : (res.data as any)?.data || [];

      // Sắp xếp giảm dần theo ID
      const sortedList = Array.isArray(list)
        ? list.sort((a: any, b: any) => b.id - a.id)
        : [];
      setVouchers(sortedList as Voucher[]);
      setCurrentPage(1); 
    } catch (error) {
      console.error("Failed to fetch vouchers", error);
      showToast({
        type: "error",
        title: "Lỗi",
        description: "Không thể tải danh sách voucher",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVouchers();
  }, []);

  // --- LOGIC: FILTERS & PAGINATION ---
  const filteredVouchers = useMemo(() => {
    let result = vouchers;

    // Lọc theo loại
    if (filterType !== "ALL") {
      result = result.filter((v) => v.type === filterType);
    }

    // Lọc theo code (hoặc tên)
    if (searchCode.trim()) {
      const search = searchCode.trim().toLowerCase();
      result = result.filter(
        (v) =>
          v.code.toLowerCase().includes(search) ||
          v.name.toLowerCase().includes(search)
      );
    }

    return result;
  }, [vouchers, filterType, searchCode]);

  const totalPages = Math.ceil(filteredVouchers.length / itemsPerPage);
  const paginatedData = filteredVouchers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // --- HANDLERS ---

  const handleOpenModal = (
    mode: "create" | "edit" | "view",
    voucher: Voucher | null = null
  ) => {
    setModalMode(mode);
    setModalData(voucher);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setModalData(null);
  };

  const handleModalSubmit = async (payload: VoucherPayload) => {
    setIsSubmitting(true);
    try {
      if (modalMode === "create") {
        await vouchersService.createVoucher(payload);
        showToast({
          type: "success",
          title: "Thành công",
          description: "Tạo voucher mới thành công!",
        });
      } else if (modalMode === "edit" && modalData) {
        await vouchersService.updateVoucher(modalData.id, payload);
        showToast({
          type: "success",
          title: "Thành công",
          description: `Cập nhật voucher #${modalData.id} thành công!`,
        });
      }
      handleCloseModal();
      await loadVouchers();
    } catch (error: any) {
      console.error("Voucher operation failed", error);
      const msg = error.response?.data?.message || error.message || "Đã xảy ra lỗi!";
      showToast({
        type: "error",
        title: modalMode === "create" ? "Tạo thất bại" : "Cập nhật thất bại",
        description: msg,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Handlers
  const handleOpenConfirmDelete = (voucher: Voucher) => {
    setVoucherToDelete(voucher);
    setIsConfirmOpen(true);
  };

  const handleDelete = async () => {
    if (!voucherToDelete) return;
    setIsConfirmOpen(false);

    try {
      await vouchersService.deleteVoucher(voucherToDelete.id);
      showToast({
        type: "success",
        title: "Thành công",
        description: `Xóa voucher #${voucherToDelete.id} thành công.`,
      });
      setVoucherToDelete(null);
      await loadVouchers();
    } catch (error: any) {
      console.error("Delete voucher failed", error);
      const msg = error.response?.data?.message || error.message || "Đã xảy ra lỗi!";
      showToast({
        type: "error",
        title: "Xóa thất bại",
        description: msg,
      });
    }
  };

  return (
    <div className="p-4 lg:p-6 space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen font-sans">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Quản lý Voucher & Khuyến mãi
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Quản lý và tạo mã giảm giá cho hệ thống.
          </p>
        </div>
      </div>

      {/* Action Bar & Filters */}
      <div className="bg-white dark:bg-gray-800 p-3 sm:p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-3 sm:gap-4 justify-between items-stretch lg:items-end">
          {/* Left: Filters */}
          <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-3 w-full lg:flex-1">
            {/* Search Box */}
            <div className="w-full sm:min-w-[200px] sm:flex-1 flex flex-col gap-1">
              <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-200">
                Tìm kiếm
              </label>
              <form onSubmit={(e) => e.preventDefault()} className="relative group w-full">
                <input
                  type="text"
                  placeholder="Nhập mã code/tên voucher..."
                  className="w-full h-[46px] pl-10 pr-4 py-3 text-sm rounded-xl border border-gray-300 bg-white text-gray-900 shadow-sm transition-all hover:border-emerald-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100 dark:hover:border-emerald-500"
                  value={searchCode}
                  onChange={(e) => setSearchCode(e.target.value)}
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
              </form>
            </div>

            {/* Loại Voucher Filter */}
            <div className="w-full sm:min-w-[180px] sm:flex-1 flex flex-col gap-1">
              <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-200">
                Loại Voucher
              </label>
              <div className="relative">
                <select
                  id="filter-type"
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full h-[46px] p-2 border border-gray-300 rounded-xl appearance-none bg-white dark:bg-gray-950 dark:border-gray-700 dark:text-gray-100 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                >
                  {filterTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-300">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Primary Action */}
          <div className="w-full lg:w-auto flex items-end">
            <button
              onClick={() => handleOpenModal("create")}
              className="w-full lg:w-auto flex items-center justify-center gap-2 px-6 py-3 h-[46px] bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-xl shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 active:translate-y-0 whitespace-nowrap"
            >
              <Plus className="w-5 h-5" />
              Tạo Voucher Mới
            </button>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden flex flex-col h-[600px]">
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
            <Loader2 className="w-10 h-10 animate-spin text-emerald-600 mb-3" />
            <p>Đang tải dữ liệu...</p>
          </div>
        ) : filteredVouchers.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
              <FileText className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Không tìm thấy Voucher nào
            </h3>
            <p className="max-w-sm text-center mt-2">
              Thử thay đổi bộ lọc hoặc tạo voucher mới để bắt đầu quản lý.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700 text-xs uppercase text-gray-500 dark:text-gray-400 font-semibold tracking-wider">
                    <th className="px-6 py-4 w-[5%]">ID</th>
                    <th className="px-6 py-4 w-[15%]">Mã Code</th>
                    <th className="px-6 py-4 w-[25%]">Tên Voucher</th>
                    <th className="px-6 py-4 w-[15%]">Giá trị</th>
                    <th className="px-6 py-4 w-[15%]">Thời gian</th>
                    <th className="px-6 py-4 w-[10%] text-center">Trạng thái</th>
                    <th className="px-6 py-4 w-[15%] text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {paginatedData.map((voucher) => {
                    const isExpired = dayjs().isAfter(dayjs(voucher.endDate));

                    const getDiscountValue = (v: Voucher) => {
                      if (v.type === "PERCENTAGE")
                        return `${v.amount.toLocaleString()}%`;
                      if (v.type === "FIXED_AMOUNT")
                        return `${v.amount.toLocaleString()} VNĐ`;
                      if (v.type === "FREE_SHIPPING")
                        return `Miễn phí VC`;
                      if (v.type === "BUY_ONE_GET_ONE")
                        return `Mua 1 Tặng 1`;
                      if (v.type === "CASHBACK")
                        return `Hoàn ${v.amount.toLocaleString()} VNĐ`;
                      if (v.type === "POINTS_REWARD")
                        return `Thưởng ${v.point?.toLocaleString() || 0} Điểm`; // Safety check for point
                      return VOUCHER_TYPES_VIETNAMESE[v.type as keyof typeof VOUCHER_TYPES_VIETNAMESE] || v.type;
                    };

                    const getStatusBadge = (v: Voucher, expired: boolean) => {
                      if (expired)
                        return (
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                            Hết hạn
                          </span>
                        );
                      if (v.status && v.active)
                        return (
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                            Đang áp dụng
                          </span>
                        );
                      return (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                          Ngừng áp dụng
                        </span>
                      );
                    };
                    
                    const getDiscountIcon = (v: Voucher) => {
                        if (v.type === "PERCENTAGE") return <Percent className="w-4 h-4 text-emerald-500" />;
                        if (v.type === "POINTS_REWARD") return <Plus className="w-4 h-4 text-blue-500" />;
                        return <DollarSign className="w-4 h-4 text-green-500" />;
                    }

                    return (
                      <tr
                        key={voucher.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <span className="font-mono text-sm font-medium text-gray-900 dark:text-white">
                            #{voucher.id}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-bold text-base text-blue-600 dark:text-blue-400">
                            {voucher.code}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                          {voucher.name}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300 font-medium">
                          <div className="flex items-center gap-1">
                            {getDiscountIcon(voucher)}
                            {getDiscountValue(voucher)}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-xs text-gray-600 dark:text-gray-400">
                          <p>
                            <Calendar className="w-3 h-3 inline-block mr-1 text-gray-500" />
                            <span className="font-medium">Từ:</span>{" "}
                            {dayjs(voucher.startDate).format("DD/MM/YY HH:mm")}
                          </p>
                          <p>
                            <Calendar className="w-3 h-3 inline-block mr-1 text-gray-500" />
                            <span className="font-medium">Đến:</span>{" "}
                            {dayjs(voucher.endDate).format("DD/MM/YY HH:mm")}
                          </p>
                        </td>
                        <td className="px-6 py-4 text-center">
                          {getStatusBadge(voucher, isExpired)}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenModal("view", voucher);
                              }}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Xem chi tiết"
                            >
                              <Eye className="w-5 h-5" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenModal("edit", voucher);
                              }}
                              className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                              title="Chỉnh sửa"
                            >
                              <Edit className="w-5 h-5" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenConfirmDelete(voucher);
                              }}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Xóa"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between bg-gray-50 dark:bg-gray-800/50">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Hiển thị {(currentPage - 1) * itemsPerPage + 1} -{" "}
                {Math.min(
                  currentPage * itemsPerPage,
                  filteredVouchers.length
                )}{" "}
                trong số {filteredVouchers.length} voucher
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-white dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  aria-label="Trang trước"
                >
                  <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                </button>
                <div className="flex gap-1">
                  {Array.from({ length: totalPages }, (_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                        currentPage === i + 1
                          ? "bg-emerald-600 text-white shadow-sm"
                          : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      }`}
                    >
                      {i + 1}
                    </button>
                  )).slice(
                    Math.max(0, currentPage - 3),
                    Math.min(totalPages, currentPage + 2)
                  )}
                </div>
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-white dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  aria-label="Trang tiếp"
                >
                  <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* --- MODAL RENDER --- */}
      <VoucherModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        data={modalData}
        mode={modalMode}
        onSubmit={handleModalSubmit}
        isLoading={isSubmitting}
      />

      {/* --- CONFIRM DIALOG RENDER --- */}
      <ConfirmDialog
        open={isConfirmOpen}
        onCancel={() => {
          setIsConfirmOpen(false);
          setVoucherToDelete(null);
        }}
        onConfirm={handleDelete}
        title="Xác nhận xóa Voucher"
        message={`Bạn có chắc chắn muốn xóa Voucher #${voucherToDelete?.id} (${voucherToDelete?.code})? Hành động này không thể hoàn tác.`}
      />
    </div>
  );
}