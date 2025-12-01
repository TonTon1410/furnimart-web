/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Search,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  RefreshCw,
  FileText,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Calendar,
} from "lucide-react";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import { useNavigate } from "react-router-dom";

// Services & Hooks
import warehousesService from "@/service/warehousesService";
import inventoryService, {
  type InventoryResponse,
} from "@/service/inventoryService";
import { useWarehouseData } from "./hook/useWarehouseData";
import { useToast } from "@/context/ToastContext";

// Components
import CustomDropdown from "@/components/CustomDropdown";
import InventoryDetailModal from "./components/InventoryDetailModal"; // Đảm bảo đường dẫn đúng tới file Modal bạn vừa tạo

// Router
import { DP } from "@/router/paths";

dayjs.extend(isBetween);

// --- SimpleDatePicker Component ---
const SimpleDatePicker: React.FC<{
  label: string;
  value: string | null;
  onChange: (date: string | null) => void;
  hasError?: boolean;
  minDate?: string | null;
  maxDate?: string | null;
}> = ({
  label,
  value,
  onChange,
  hasError = false,
  minDate = null,
  maxDate = null,
}) => {
  const [showPicker, setShowPicker] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(dayjs(value || undefined));
  const [showYearSelector, setShowYearSelector] = useState(false);
  const [showMonthSelector, setShowMonthSelector] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(event.target as Node)
      ) {
        setShowPicker(false);
        setShowYearSelector(false);
        setShowMonthSelector(false);
      }
    };

    if (showPicker) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showPicker]);

  const handleDateClick = (date: dayjs.Dayjs) => {
    onChange(date.format("YYYY-MM-DD"));
    setShowPicker(false);
  };

  const handleYearSelect = (year: number) => {
    setCurrentMonth(currentMonth.year(year));
    setShowYearSelector(false);
  };

  const handleMonthSelect = (month: number) => {
    setCurrentMonth(currentMonth.month(month));
    setShowMonthSelector(false);
  };

  const renderCalendar = () => {
    const startOfMonth = currentMonth.startOf("month");
    const endOfMonth = currentMonth.endOf("month");
    const startDate = startOfMonth.startOf("week");
    const endDate = endOfMonth.endOf("week");

    const days = [];
    let day = startDate;

    while (day.isBefore(endDate) || day.isSame(endDate, "day")) {
      days.push(day);
      day = day.add(1, "day");
    }

    return (
      <div className="grid grid-cols-7 gap-1">
        {["CN", "T2", "T3", "T4", "T5", "T6", "T7"].map((d) => (
          <div
            key={d}
            className="text-center text-xs font-semibold text-gray-600 dark:text-gray-400 py-2"
          >
            {d}
          </div>
        ))}
        {days.map((d, idx) => {
          const isCurrentMonth = d.month() === currentMonth.month();
          const isToday = d.isSame(dayjs(), "day");
          const isSelected = value && d.isSame(dayjs(value), "day");

          // Check if date is disabled based on minDate/maxDate
          const isDisabled =
            (minDate && d.isBefore(dayjs(minDate), "day")) ||
            (maxDate && d.isAfter(dayjs(maxDate), "day"));

          return (
            <button
              key={idx}
              onClick={() => !isDisabled && handleDateClick(d)}
              disabled={isDisabled}
              className={`
                p-2 text-sm rounded-lg transition-all
                ${
                  isDisabled
                    ? "text-gray-300 dark:text-gray-700 cursor-not-allowed opacity-40"
                    : !isCurrentMonth
                    ? "text-gray-300 dark:text-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                    : isSelected
                    ? "bg-emerald-500 text-white font-semibold shadow-md scale-105"
                    : isToday
                    ? "bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 font-semibold ring-2 ring-blue-400"
                    : "text-gray-700 dark:text-gray-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 hover:scale-105"
                }
              `}
            >
              {d.date()}
            </button>
          );
        })}
      </div>
    );
  };

  const renderYearSelector = () => {
    const currentYear = currentMonth.year();
    const startYear = currentYear - 50;
    const years = Array.from({ length: 101 }, (_, i) => startYear + i);

    return (
      <div className="max-h-64 overflow-y-auto">
        <div className="grid grid-cols-4 gap-2 p-2">
          {years.map((year) => (
            <button
              key={year}
              onClick={() => handleYearSelect(year)}
              className={`
                px-3 py-2 rounded-lg text-sm font-medium transition-all
                ${
                  year === currentYear
                    ? "bg-emerald-500 text-white shadow-md"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/30"
                }
              `}
            >
              {year}
            </button>
          ))}
        </div>
      </div>
    );
  };

  const renderMonthSelector = () => {
    const months = [
      "Tháng 1",
      "Tháng 2",
      "Tháng 3",
      "Tháng 4",
      "Tháng 5",
      "Tháng 6",
      "Tháng 7",
      "Tháng 8",
      "Tháng 9",
      "Tháng 10",
      "Tháng 11",
      "Tháng 12",
    ];

    return (
      <div className="grid grid-cols-3 gap-2 p-2">
        {months.map((month, index) => (
          <button
            key={index}
            onClick={() => handleMonthSelect(index)}
            className={`
              px-3 py-2 rounded-lg text-sm font-medium transition-all
              ${
                index === currentMonth.month()
                  ? "bg-emerald-500 text-white shadow-md"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/30"
              }
            `}
          >
            {month}
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="relative flex-1" ref={pickerRef}>
      <label
        className={`block text-xs sm:text-sm font-medium mb-1 ${
          hasError
            ? "text-red-600 dark:text-red-400"
            : "text-gray-700 dark:text-gray-300"
        }`}
      >
        {label}
      </label>
      <button
        onClick={() => setShowPicker(!showPicker)}
        className={`w-full h-[42px] sm:h-[46px] px-3 py-2 sm:py-3 text-left rounded-xl text-sm transition-all flex items-center justify-between group shadow-sm ${
          hasError
            ? "border-2 border-red-500 dark:border-red-400 bg-red-50 dark:bg-red-900/10 text-red-900 dark:text-red-100 animate-shake"
            : "border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:border-emerald-400 dark:hover:border-emerald-500"
        }`}
      >
        <span>{value ? dayjs(value).format("DD/MM/YYYY") : "Chọn ngày"}</span>
        <Calendar
          className={`w-4 h-4 transition-colors ${
            hasError
              ? "text-red-500"
              : "text-gray-500 group-hover:text-emerald-500"
          }`}
        />
      </button>

      {showPicker && (
        <div className="absolute z-50 mt-2 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl min-w-[320px]">
          <div className="flex items-center justify-between mb-4 gap-2">
            <button
              onClick={() => setCurrentMonth(currentMonth.subtract(1, "month"))}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              aria-label="Tháng trước"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setShowMonthSelector(!showMonthSelector);
                  setShowYearSelector(false);
                }}
                className="px-3 py-1.5 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-colors"
              >
                <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  Tháng {currentMonth.month() + 1}
                </span>
              </button>

              <button
                onClick={() => {
                  setShowYearSelector(!showYearSelector);
                  setShowMonthSelector(false);
                }}
                className="px-3 py-1.5 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-colors"
              >
                <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {currentMonth.year()}
                </span>
              </button>
            </div>

            <button
              onClick={() => setCurrentMonth(currentMonth.add(1, "month"))}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              aria-label="Tháng sau"
            >
              <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>

          {showYearSelector
            ? renderYearSelector()
            : showMonthSelector
            ? renderMonthSelector()
            : renderCalendar()}

          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 flex justify-between">
            <button
              onClick={() => {
                onChange(dayjs().format("YYYY-MM-DD"));
                setShowPicker(false);
              }}
              className="text-sm text-emerald-600 dark:text-emerald-400 hover:underline font-medium"
            >
              Hôm nay
            </button>
            <button
              onClick={() => {
                onChange(null);
                setShowPicker(false);
              }}
              className="text-sm text-red-600 dark:text-red-400 hover:underline font-medium"
            >
              Xóa
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// --- StatusBadge Component ---
const StatusBadge = ({ type }: { type: string }) => {
  let styles = "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
  let label = type;
  let icon = null;

  switch (type) {
    case "IMPORT":
    case "IN":
    case "STOCK_IN":
      styles =
        "bg-emerald-100 text-emerald-800 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800";
      label = "Nhập kho";
      icon = <ArrowDownLeft className="w-3 h-3 mr-1" />;
      break;
    case "EXPORT":
    case "OUT":
    case "STOCK_OUT":
      styles =
        "bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800";
      label = "Xuất kho";
      icon = <ArrowUpRight className="w-3 h-3 mr-1" />;
      break;
    case "TRANSFER":
      styles =
        "bg-blue-100 text-blue-800 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800";
      label = "Chuyển kho";
      icon = <RefreshCw className="w-3 h-3 mr-1" />;
      break;
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles}`}
    >
      {icon}
      {label}
    </span>
  );
};

// --- Main Component ---
export default function InventoryManagement() {
  const navigate = useNavigate();
  const { storeId } = useWarehouseData();
  const { showToast } = useToast();

  // --- STATE ---
  const [warehouse, setWarehouse] = useState<any>(null);
  const [inventories, setInventories] = useState<InventoryResponse[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [filterType, setFilterType] = useState<string>("ALL");
  const [searchId, setSearchId] = useState<string>("");
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: "",
    end: "",
  });

  // Modal State
  const [selectedInventory, setSelectedInventory] =
    useState<InventoryResponse | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filterTypeOptions = [
    { value: "ALL", label: "Tất cả loại phiếu" },
    { value: "IMPORT", label: "Nhập kho" },
    { value: "EXPORT", label: "Xuất kho" },
    { value: "TRANSFER", label: "Chuyển kho" },
  ];

  // Handle date range change
  const handleDateRangeChange = (
    field: "start" | "end",
    value: string | null
  ) => {
    setDateRange({ ...dateRange, [field]: value || "" });
  };

  // --- DATA FETCHING ---
  useEffect(() => {
    const fetchWarehouse = async () => {
      if (!storeId) return;
      try {
        const res = await warehousesService.getWarehouseByStore(storeId);
        const whData = res.data?.data || res.data;
        if (whData) {
          setWarehouse(whData);
        }
      } catch (error) {
        console.error("Failed to fetch warehouse", error);
        showToast({
          type: "error",
          title: "Lỗi",
          description: "Không thể tải thông tin kho hàng",
        });
      }
    };
    fetchWarehouse();
  }, [storeId]);

  const loadInventories = async () => {
    if (!warehouse?.id) return;
    setLoading(true);
    try {
      if (searchId.trim()) {
        const res = await inventoryService.getInventoryById(searchId.trim());
        const rawData = res.data;
        const item = rawData?.data || rawData;

        if (item && typeof item === "object" && "id" in item) {
          setInventories([item as InventoryResponse]);
        } else {
          setInventories([]);
          showToast({
            type: "info",
            title: "Không tìm thấy",
            description: `Không tìm thấy phiếu mã ${searchId}`,
          });
        }
      } else {
        const res = await inventoryService.getInventoriesByWarehouse(
          warehouse.id
        );
        const list = res.data?.data || res.data;

        const sortedList = Array.isArray(list)
          ? list.sort((a: any, b: any) => b.id - a.id)
          : [];
        setInventories(sortedList as InventoryResponse[]);
      }
    } catch (error) {
      console.error("Failed to fetch inventories", error);
      if (searchId.trim()) {
        setInventories([]);
        showToast({
          type: "info",
          title: "Không tìm thấy",
          description: `Không tìm thấy phiếu mã ${searchId}`,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInventories();
  }, [warehouse?.id, searchId]);

  // --- LOGIC: FILTERS & STATS ---
  const stats = useMemo(() => {
    const currentMonth = dayjs().month();
    const currentYear = dayjs().year();

    const currentMonthInvs = inventories.filter((inv) => {
      const d = dayjs(inv.date);
      return d.month() === currentMonth && d.year() === currentYear;
    });

    return {
      totalImport: currentMonthInvs.filter((i) =>
        ["IMPORT", "IN", "STOCK_IN"].includes(i.type)
      ).length,
      totalExport: currentMonthInvs.filter((i) =>
        ["EXPORT", "OUT", "STOCK_OUT"].includes(i.type)
      ).length,
    };
  }, [inventories]);

  const filteredInventories = useMemo(() => {
    let result = inventories;
    if (filterType !== "ALL") {
      result = result.filter((inv) => {
        if (filterType === "IMPORT")
          return ["IMPORT", "IN", "STOCK_IN"].includes(inv.type);
        if (filterType === "EXPORT")
          return ["EXPORT", "OUT", "STOCK_OUT"].includes(inv.type);
        if (filterType === "TRANSFER") return inv.type === "TRANSFER";
        return true;
      });
    }
    if (dateRange.start && dateRange.end) {
      result = result.filter((inv) =>
        dayjs(inv.date).isBetween(dateRange.start, dateRange.end, "day", "[]")
      );
    }
    return result;
  }, [inventories, filterType, dateRange]);

  const totalPages = Math.ceil(filteredInventories.length / itemsPerPage);
  const paginatedData = filteredInventories.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // --- HANDLERS ---
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
  };

  const resetFilters = () => {
    setFilterType("ALL");
    setSearchId("");
    setDateRange({ start: "", end: "" });
    loadInventories();
  };

  const handleNavigateToCreate = () => {
    if (warehouse?.id) {
      navigate(DP("inventory/create"), {
        state: { warehouseId: warehouse.id },
      });
    } else {
      showToast({
        type: "error",
        title: "Chưa chọn kho",
        description: "Vui lòng đợi thông tin kho tải xong.",
      });
    }
  };

  // Modal Handlers
  const handleViewDetail = (inventory: InventoryResponse) => {
    setSelectedInventory(inventory);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    // Timeout nhỏ để clear data sau khi đóng modal, tránh flicker
    setTimeout(() => setSelectedInventory(null), 200);
  };

  if (!storeId) {
    return (
      <div className="p-8 text-center text-gray-500 animate-pulse">
        Đang tải thông tin cửa hàng...
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen font-sans">
      {/* Header with Inline Stats */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Quản lý Xuất Nhập Kho
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Kho:{" "}
            <span className="font-semibold text-emerald-600">
              {warehouse?.warehouseName || "Đang tải..."}
            </span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Inline Stats - Desktop */}
          <div className="hidden md:flex items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg">
              <ArrowDownLeft className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                Nhập: <span className="font-bold">{stats.totalImport}</span>
              </span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <ArrowUpRight className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span className="text-sm font-medium text-amber-700 dark:text-amber-400">
                Xuất: <span className="font-bold">{stats.totalExport}</span>
              </span>
            </div>
          </div>

          {/* Date Badge */}
          <div className="text-sm text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
            Hôm nay:{" "}
            <span className="font-medium text-gray-900 dark:text-white">
              {dayjs().format("DD/MM/YYYY")}
            </span>
          </div>

          {/* Inline Stats - Mobile */}
          <div className="md:hidden w-full grid grid-cols-2 gap-2">
            <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg">
              <ArrowDownLeft className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                Nhập: <span className="font-bold">{stats.totalImport}</span>
              </span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <ArrowUpRight className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span className="text-sm font-medium text-amber-700 dark:text-amber-400">
                Xuất: <span className="font-bold">{stats.totalExport}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* KHỐI 2: Action Bar */}
      <div className="bg-white dark:bg-gray-800 p-3 sm:p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-3 sm:gap-4 justify-between items-stretch lg:items-end">
          {/* Left: Filters */}
          <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-3 w-full lg:flex-1">
            {/* Search Box */}
            <div className="w-full sm:min-w-[200px] sm:flex-1 flex flex-col gap-1">
              <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-200">
                Tìm kiếm
              </label>
              <form onSubmit={handleSearch} className="relative group w-full">
                <input
                  type="text"
                  placeholder="Nhập mã phiếu..."
                  className="w-full h-[42px] sm:h-[46px] pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-3 text-sm rounded-xl border border-gray-300 bg-white text-gray-900 shadow-sm transition-all hover:border-emerald-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100 dark:hover:border-emerald-500"
                  value={searchId}
                  onChange={(e) => setSearchId(e.target.value)}
                />
                <Search className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
              </form>
            </div>

            <div className="w-full sm:min-w-[180px] sm:flex-1">
              <CustomDropdown
                id="filter-type"
                label="Loại phiếu"
                value={filterType}
                options={filterTypeOptions}
                onChange={(val) => setFilterType(val)}
                placeholder="Tất cả"
              />
            </div>

            <div className="w-full sm:w-auto sm:min-w-40">
              <SimpleDatePicker
                label="Từ ngày"
                value={dateRange.start}
                onChange={(val) => handleDateRangeChange("start", val)}
                maxDate={dateRange.end || null}
              />
            </div>

            <div className="w-full sm:w-auto sm:min-w-40">
              <SimpleDatePicker
                label="Đến ngày"
                value={dateRange.end}
                onChange={(val) => handleDateRangeChange("end", val)}
                minDate={dateRange.start || null}
              />
            </div>

            {(filterType !== "ALL" || searchId || dateRange.start) && (
              <div className="w-full sm:w-auto flex items-end">
                <button
                  onClick={resetFilters}
                  className="w-full sm:w-auto px-4 py-2 sm:py-3 h-[42px] sm:h-[46px] text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors whitespace-nowrap border border-red-200 dark:border-red-800 hover:border-red-300 dark:hover:border-red-700"
                >
                  Xóa lọc
                </button>
              </div>
            )}
          </div>

          {/* Right: Primary Action */}
          <div className="w-full lg:w-auto flex items-end">
            <button
              onClick={handleNavigateToCreate}
              className="w-full lg:w-auto flex items-center justify-center gap-2 px-4 sm:px-6 py-2 sm:py-3 h-[42px] sm:h-[46px] bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-xl shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 active:translate-y-0 whitespace-nowrap"
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
              Tạo Phiếu Mới
            </button>
          </div>
        </div>
      </div>

      {/* KHỐI 3: Data Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden flex flex-col h-[600px]">
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
            <Loader2 className="w-10 h-10 animate-spin text-emerald-600 mb-3" />
            <p>Đang tải dữ liệu...</p>
          </div>
        ) : filteredInventories.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
              <FileText className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Không tìm thấy phiếu nào
            </h3>
            <p className="max-w-sm text-center mt-2">
              Thử thay đổi bộ lọc hoặc tạo phiếu mới để bắt đầu quản lý.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700 text-xs uppercase text-gray-500 dark:text-gray-400 font-semibold tracking-wider">
                    <th className="px-6 py-4 w-[10%]">Mã Phiếu</th>
                    <th className="px-6 py-4 w-[15%]">Loại Phiếu</th>
                    <th className="px-6 py-4 w-[15%]">Mục Đích</th>
                    <th className="px-6 py-4 w-[12%]">Ngày Tạo</th>
                    <th className="px-6 py-4 w-[20%]">Kho / Đối Tác</th>
                    <th className="px-6 py-4 w-[28%]">Ghi Chú</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {paginatedData.map((inv) => (
                    <tr
                      key={inv.id}
                      onClick={() => handleViewDetail(inv)}
                      className="hover:bg-emerald-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
                    >
                      <td className="px-6 py-4">
                        <span className="font-mono text-sm font-medium text-gray-900 dark:text-white">
                          #{inv.id}
                        </span>
                        {inv.orderId && (
                          <div className="text-xs text-gray-500 mt-0.5">
                            Order: #{inv.orderId}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge type={inv.type} />
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                        {inv.purpose}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                        {dayjs(inv.date).format("DD/MM/YYYY")}
                        <div className="text-xs opacity-70">
                          {dayjs(inv.date).format("HH:mm")}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                        {inv.warehouseName}
                      </td>
                      <td
                        className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 max-w-[200px] truncate"
                        title={inv.note}
                      >
                        {inv.note || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between bg-gray-50 dark:bg-gray-800/50">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Hiển thị {(currentPage - 1) * itemsPerPage + 1} -{" "}
                {Math.min(
                  currentPage * itemsPerPage,
                  filteredInventories.length
                )}{" "}
                trong số {filteredInventories.length} phiếu
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
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum = i + 1;
                    if (totalPages > 5 && currentPage > 3)
                      pageNum = currentPage - 2 + i;
                    if (pageNum > totalPages) return null;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                          currentPage === pageNum
                            ? "bg-emerald-600 text-white shadow-sm"
                            : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
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
      <InventoryDetailModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        data={selectedInventory}
      />
    </div>
  );
}
