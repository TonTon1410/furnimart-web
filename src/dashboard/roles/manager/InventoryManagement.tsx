/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useMemo } from 'react';
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
  Eye
} from 'lucide-react';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import { useNavigate } from 'react-router-dom';

// Services & Hooks
import warehousesService from '@/service/warehousesService';
import inventoryService, { type InventoryResponse } from '@/service/inventoryService';
import { useWarehouseData } from './hook/useWarehouseData';
import { useToast } from '@/context/ToastContext';

// Components
import CustomDropdown from '@/components/CustomDropdown';
import { DateTimePicker } from '@/components/DateTimePicker';
import InventoryDetailModal from './components/InventoryDetailModal'; // Đảm bảo đường dẫn đúng tới file Modal bạn vừa tạo

// Router
import { DP } from '@/router/paths';

dayjs.extend(isBetween);

// --- Sub-components (StatCard & StatusBadge) ---
const StatCard = ({ title, value, type, icon: Icon }: { title: string, value: number, type: 'import' | 'export', icon: any }) => {
    const isImport = type === 'import';
    const bgClass = isImport 
      ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800" 
      : "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800";
    
    const textClass = isImport ? "text-emerald-700 dark:text-emerald-400" : "text-amber-700 dark:text-amber-400";
    const iconBgClass = isImport ? "bg-emerald-100 dark:bg-emerald-800" : "bg-amber-100 dark:bg-amber-800";
  
    return (
      <div className={`flex items-center p-6 border rounded-2xl shadow-sm transition-all hover:shadow-md ${bgClass}`}>
        <div className={`p-4 rounded-full mr-5 ${iconBgClass}`}>
          <Icon className={`w-8 h-8 ${textClass}`} />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">{title}</p>
          <h3 className={`text-3xl font-bold mt-1 ${textClass}`}>
            {value.toLocaleString()} <span className="text-lg font-normal opacity-70">phiếu</span>
          </h3>
        </div>
      </div>
    );
};

const StatusBadge = ({ type }: { type: string }) => {
    let styles = "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    let label = type;
    let icon = null;
  
    switch (type) {
      case 'IMPORT':
      case 'IN':
      case 'STOCK_IN':
        styles = "bg-emerald-100 text-emerald-800 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800";
        label = "Nhập kho";
        icon = <ArrowDownLeft className="w-3 h-3 mr-1" />;
        break;
      case 'EXPORT':
      case 'OUT':
      case 'STOCK_OUT':
        styles = "bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800";
        label = "Xuất kho";
        icon = <ArrowUpRight className="w-3 h-3 mr-1" />;
        break;
      case 'TRANSFER':
        styles = "bg-blue-100 text-blue-800 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800";
        label = "Chuyển kho";
        icon = <RefreshCw className="w-3 h-3 mr-1" />;
        break;
    }
  
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles}`}>
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
  const [filterType, setFilterType] = useState<string>('ALL');
  const [searchId, setSearchId] = useState<string>('');
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: '', end: '' });

  // Modal State
  const [selectedInventory, setSelectedInventory] = useState<InventoryResponse | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filterTypeOptions = [
    { value: 'ALL', label: 'Tất cả loại phiếu' },
    { value: 'IMPORT', label: 'Nhập kho' },
    { value: 'EXPORT', label: 'Xuất kho' },
    { value: 'TRANSFER', label: 'Chuyển kho' },
  ];

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
        showToast({ type: 'error', title: 'Lỗi', description: 'Không thể tải thông tin kho hàng' });
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

        if (item && typeof item === 'object' && 'id' in item) {
          setInventories([item as InventoryResponse]);
        } else {
          setInventories([]);
          showToast({ type: 'info', title: 'Không tìm thấy', description: `Không tìm thấy phiếu mã ${searchId}` });
        }
      } else {
        const res = await inventoryService.getInventoriesByWarehouse(warehouse.id);
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
         showToast({ type: 'info', title: 'Không tìm thấy', description: `Không tìm thấy phiếu mã ${searchId}` });
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

    const currentMonthInvs = inventories.filter(inv => {
      const d = dayjs(inv.date);
      return d.month() === currentMonth && d.year() === currentYear;
    });

    return {
      totalImport: currentMonthInvs.filter(i => ['IMPORT', 'IN', 'STOCK_IN'].includes(i.type)).length,
      totalExport: currentMonthInvs.filter(i => ['EXPORT', 'OUT', 'STOCK_OUT'].includes(i.type)).length,
    };
  }, [inventories]);

  const filteredInventories = useMemo(() => {
    let result = inventories;
    if (filterType !== 'ALL') {
      result = result.filter(inv => {
        if (filterType === 'IMPORT') return ['IMPORT', 'IN', 'STOCK_IN'].includes(inv.type);
        if (filterType === 'EXPORT') return ['EXPORT', 'OUT', 'STOCK_OUT'].includes(inv.type);
        if (filterType === 'TRANSFER') return inv.type === 'TRANSFER';
        return true;
      });
    }
    if (dateRange.start && dateRange.end) {
      result = result.filter(inv => 
        dayjs(inv.date).isBetween(dateRange.start, dateRange.end, 'day', '[]')
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
    setFilterType('ALL');
    setSearchId('');
    setDateRange({ start: '', end: '' });
    loadInventories();
  };

  const handleNavigateToCreate = () => {
    if (warehouse?.id) {
        navigate(DP('inventory/create'), { state: { warehouseId: warehouse.id } });
    } else {
        showToast({ type: 'error', title: 'Chưa chọn kho', description: 'Vui lòng đợi thông tin kho tải xong.' });
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
    return <div className="p-8 text-center text-gray-500 animate-pulse">Đang tải thông tin cửa hàng...</div>;
  }

  return (
    <div className="p-4 lg:p-6 space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen font-sans">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Quản lý Xuất Nhập Kho</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
             Kho: <span className="font-semibold text-emerald-600">{warehouse?.warehouseName || 'Đang tải...'}</span>
          </p>
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
          Hôm nay: <span className="font-medium text-gray-900 dark:text-white">{dayjs().format('DD/MM/YYYY')}</span>
        </div>
      </div>

      {/* KHỐI 1: Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <StatCard title="Tổng Nhập (Tháng này)" value={stats.totalImport} type="import" icon={ArrowDownLeft} />
        <StatCard title="Tổng Xuất (Tháng này)" value={stats.totalExport} type="export" icon={ArrowUpRight} />
      </div>

      {/* KHỐI 2: Action Bar */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col lg:flex-row gap-4 justify-between items-end">
        
        {/* Left: Filters */}
        <div className="flex flex-col md:flex-row gap-3 w-full lg:w-auto items-end">
          {/* Search Box */}
          <div className="w-full md:w-64 flex flex-col gap-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Tìm kiếm</label>
            <form onSubmit={handleSearch} className="relative group w-full">
              <input 
                type="text" 
                placeholder="Nhập mã phiếu..." 
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 bg-white text-gray-900 shadow-sm transition-all hover:border-emerald-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100 dark:hover:border-emerald-500"
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
            </form>
          </div>

          <CustomDropdown 
            id="filter-type"
            label="Loại phiếu"
            value={filterType}
            options={filterTypeOptions}
            onChange={(val) => setFilterType(val)}
            placeholder="Tất cả"
          />

          <div className="flex items-center gap-2 w-full md:w-auto">
             <DateTimePicker
                label="Từ ngày"
                value={dateRange.start}
                onChange={(val) => setDateRange({...dateRange, start: val})}
                className="w-full md:w-40"
             />
             <DateTimePicker
                label="Đến ngày"
                value={dateRange.end}
                onChange={(val) => setDateRange({...dateRange, end: val})}
                className="w-full md:w-40"
             />
          </div>
          
          {(filterType !== 'ALL' || searchId || dateRange.start) && (
            <button 
              onClick={resetFilters}
              className="px-3 py-3.5 mb-0.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors whitespace-nowrap border border-transparent hover:border-red-100"
            >
              Xóa lọc
            </button>
          )}
        </div>

        {/* Right: Primary Action */}
        <button 
          onClick={handleNavigateToCreate}
          className="w-full lg:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 active:translate-y-0 mb-0.5"
        >
          <Plus className="w-5 h-5" />
          Tạo Phiếu Mới
        </button>
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
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Không tìm thấy phiếu nào</h3>
            <p className="max-w-sm text-center mt-2">Thử thay đổi bộ lọc hoặc tạo phiếu mới để bắt đầu quản lý.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700 text-xs uppercase text-gray-500 dark:text-gray-400 font-semibold tracking-wider">
                    <th className="px-6 py-4">Mã Phiếu</th>
                    <th className="px-6 py-4">Loại Phiếu</th>
                    <th className="px-6 py-4">Mục Đích</th>
                    <th className="px-6 py-4">Ngày Tạo</th>
                    <th className="px-6 py-4">Kho / Đối Tác</th>
                    <th className="px-6 py-4">Ghi Chú</th>
                    <th className="px-6 py-4 text-center">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {paginatedData.map((inv) => (
                    <tr 
                      key={inv.id} 
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group"
                    >
                      <td className="px-6 py-4">
                        <span className="font-mono text-sm font-medium text-gray-900 dark:text-white">
                          #{inv.id}
                        </span>
                        {inv.orderId && (
                           <div className="text-xs text-gray-500 mt-0.5">Order: #{inv.orderId}</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge type={inv.type} />
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                        {inv.purpose}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                        {dayjs(inv.date).format('DD/MM/YYYY')}
                        <div className="text-xs opacity-70">{dayjs(inv.date).format('HH:mm')}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                        {inv.warehouseName}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 max-w-[200px] truncate" title={inv.note}>
                        {inv.note || '-'}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                           <button 
                             onClick={() => handleViewDetail(inv)} 
                             className="p-2 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 transition-transform hover:scale-110 active:scale-95" 
                             title="Xem chi tiết"
                           >
                              <Eye className="w-4 h-4" />
                           </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between bg-gray-50 dark:bg-gray-800/50">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Hiển thị {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredInventories.length)} trong số {filteredInventories.length} phiếu
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-white dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                </button>
                <div className="flex gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                     let pageNum = i + 1;
                     if (totalPages > 5 && currentPage > 3) pageNum = currentPage - 2 + i;
                     if (pageNum > totalPages) return null;
                     return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                            currentPage === pageNum 
                            ? 'bg-emerald-600 text-white shadow-sm' 
                            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                          }`}
                        >
                          {pageNum}
                        </button>
                     );
                  })}
                </div>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-white dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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