/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Plus,
  Filter,
  ArrowDownLeft, // Nhập
  ArrowUpRight,  // Xuất
  RefreshCw,     // Chuyển
  Calendar,
  FileText,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Eye
} from 'lucide-react';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';

dayjs.extend(isBetween);

// =========================================================================================
// ⚠️ MÔI TRƯỜNG PREVIEW: SỬ DỤNG MOCK DATA
// (Vui lòng UNCOMMENT phần "REAL IMPORTS" và XÓA phần "MOCK DATA" khi dùng trong dự án thật)
// =========================================================================================

//  --- 🟢 REAL IMPORTS (Dùng cho dự án thật) ---
import { useWarehouseData } from './hook/useWarehouseData';
import warehousesService from '@/service/warehousesService';
import inventoryService, { type InventoryResponse } from '@/service/inventoryService';
import CreateInventoryModal from './components/CreateInventoryModal';
import { useToast } from '@/context/ToastContext';


/*// --- 🟡 MOCK DATA & COMPONENTS (Chỉ dùng cho Preview) ---

// 1. Mock Hooks & Context
const useWarehouseData = () => ({ storeId: 'STORE-DEMO-01', loading: false, refetch: () => {} });
const useToast = () => ({ showToast: (opts: any) => console.log('Toast:', opts) });

// 2. Mock Services
const mockInventoryList = Array.from({ length: 15 }).map((_, i) => ({
  id: 1000 + i,
  type: i % 3 === 0 ? 'IMPORT' : i % 3 === 1 ? 'EXPORT' : 'TRANSFER',
  purpose: i % 3 === 0 ? 'STOCK_IN' : i % 3 === 1 ? 'STOCK_OUT' : 'MOVE',
  date: dayjs().subtract(i, 'day').toISOString(),
  note: i % 2 === 0 ? 'Nhập hàng định kỳ tháng 11' : 'Xuất bán lẻ đơn #992' + i,
  warehouseName: 'Kho Tổng TP.HCM',
  warehouseId: 'WH-HCM-01',
  orderId: i % 3 === 1 ? 5000 + i : undefined,
  itemResponseList: []
}));

const warehousesService = {
  getWarehouseByStore: async (_storeId: string) => ({
    data: { data: { id: 'WH-HCM-01', warehouseName: 'Kho Tổng TP.HCM', address: 'Q7, TP.HCM' } }
  })
};

const inventoryService = {
  getInventoryById: async (id: string) => {
    await new Promise(r => setTimeout(r, 500));
    const found = mockInventoryList.find(i => i.id.toString() === id);
    // Giả lập trả về cấu trúc giống axios response
    return { data: { data: found || null } };
  },
  getInventoriesByWarehouse: async (_whId: string) => {
    await new Promise(r => setTimeout(r, 800));
    return { data: { data: mockInventoryList } };
  }
};

// 3. Mock CreateInventoryModal
const CreateInventoryModal = ({ open, onClose, onSuccess }: any) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
        <h3 className="text-xl font-bold mb-4 dark:text-white">Tạo phiếu kho (Demo)</h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Đây là modal giả lập. Trong dự án thực tế, modal nhập liệu đầy đủ sẽ hiện ra tại đây.
        </p>
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Hủy</button>
          <button 
            onClick={() => { onSuccess(); onClose(); }}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
          >
            Lưu phiếu giả lập
          </button>
        </div>
      </div>
    </div>
  );
};

// Interface (Cập nhật để khớp với mock data và tránh lỗi TS)
interface InventoryResponse {
  id: number;
  type: string;
  purpose: string;
  date: string;
  note: string;
  warehouseName: string;
  warehouseId: string;
  orderId?: number;
  itemResponseList?: any[]; // Thêm trường này để khớp type mock
}

// =========================================================================================
// END MOCK DATA
// =========================================================================================
*/
// --- HELPER COMPONENTS ---

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
      styles = "bg-emerald-100 text-emerald-800 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800";
      label = "Nhập kho";
      icon = <ArrowDownLeft className="w-3 h-3 mr-1" />;
      break;
    case 'EXPORT':
    case 'OUT':
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

export default function InventoryManagement() {
  const { storeId } = useWarehouseData();
  const { showToast } = useToast();
  
  // --- STATE ---
  const [warehouse, setWarehouse] = useState<any>(null);
  const [inventories, setInventories] = useState<InventoryResponse[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Filters
  const [filterType, setFilterType] = useState<string>('ALL');
  const [searchId, setSearchId] = useState<string>('');
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: '', end: '' });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // --- DATA FETCHING ---

  // 1. Lấy thông tin Warehouse từ StoreId
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

  // 2. Lấy danh sách phiếu khi đã có WarehouseId
  const loadInventories = async () => {
    if (!warehouse?.id) return;
    setLoading(true);
    try {
      // Nếu có searchId thì gọi API tìm kiếm cụ thể
      if (searchId.trim()) {
        const res = await inventoryService.getInventoryById(searchId.trim());
        // 👇 FIX LỖI: Kiểm tra kỹ cấu trúc trả về trước khi set state
        const rawData = res.data;
        const item = rawData?.data || rawData; // Ưu tiên data bên trong wrapper

        // Kiểm tra xem item có phải là một object phiếu hợp lệ không (có id)
        if (item && typeof item === 'object' && 'id' in item) {
          setInventories([item as InventoryResponse]);
        } else {
          setInventories([]);
          showToast({ type: 'info', title: 'Không tìm thấy', description: `Không tìm thấy phiếu mã ${searchId}` });
        }
      } else {
        // Lấy toàn bộ theo kho
        const res = await inventoryService.getInventoriesByWarehouse(warehouse.id);
        const list = res.data?.data || res.data;
        // Sắp xếp mới nhất lên đầu
        const sortedList = Array.isArray(list) 
          ? list.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()) 
          : [];
        setInventories(sortedList as InventoryResponse[]);
      }
    } catch (error) {
      console.error("Failed to fetch inventories", error);
      // Nếu tìm ID không thấy thì clear list hoặc báo lỗi nhẹ
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
  }, [warehouse?.id, searchId]); // Reload khi warehouse thay đổi hoặc user submit search

  // --- LOGIC ---

  // 1. Tính toán Thống kê (Block 1)
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

  // 2. Filter danh sách hiển thị (Block 3)
  const filteredInventories = useMemo(() => {
    let result = inventories;

    // Filter Type
    if (filterType !== 'ALL') {
      result = result.filter(inv => {
        if (filterType === 'IMPORT') return ['IMPORT', 'IN'].includes(inv.type);
        if (filterType === 'EXPORT') return ['EXPORT', 'OUT'].includes(inv.type);
        if (filterType === 'TRANSFER') return inv.type === 'TRANSFER';
        return true;
      });
    }

    // Filter Date Range
    if (dateRange.start && dateRange.end) {
      result = result.filter(inv => 
        dayjs(inv.date).isBetween(dateRange.start, dateRange.end, 'day', '[]')
      );
    }

    return result;
  }, [inventories, filterType, dateRange]);

  // 3. Pagination
  const totalPages = Math.ceil(filteredInventories.length / itemsPerPage);
  const paginatedData = filteredInventories.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // --- HANDLERS ---
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Logic search đã nằm trong useEffect dependencies [searchId]
    // Hàm này chỉ để chặn submit form mặc định
  };

  const resetFilters = () => {
    setFilterType('ALL');
    setSearchId('');
    setDateRange({ start: '', end: '' });
    loadInventories();
  };

  if (!storeId) {
    return <div className="p-8 text-center text-gray-500">Đang tải thông tin cửa hàng...</div>;
  }

  return (
    <div className="p-4 lg:p-6 space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen font-sans">
      
      {/* Header Title */}
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

      {/* KHỐI 1: TỔNG QUAN NHANH (OVERVIEW CARDS) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <StatCard 
          title="Tổng Nhập (Tháng này)" 
          value={stats.totalImport} 
          type="import" 
          icon={ArrowDownLeft} 
        />
        <StatCard 
          title="Tổng Xuất (Tháng này)" 
          value={stats.totalExport} 
          type="export" 
          icon={ArrowUpRight} 
        />
      </div>

      {/* KHỐI 2: THANH CÔNG CỤ (ACTION BAR) */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
        
        {/* Left: Filters */}
        <div className="flex flex-col md:flex-row gap-3 w-full lg:w-auto">
          
          {/* Search Box */}
          <form onSubmit={handleSearch} className="relative group w-full md:w-64">
            <input 
              type="text" 
              placeholder="Tìm theo mã phiếu (Enter)..." 
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
          </form>

          {/* Type Dropdown */}
          <div className="relative w-full md:w-48">
            <select 
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full appearance-none pl-10 pr-8 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent cursor-pointer"
            >
              <option value="ALL">Tất cả loại phiếu</option>
              <option value="IMPORT">Nhập kho</option>
              <option value="EXPORT">Xuất kho</option>
              <option value="TRANSFER">Chuyển kho</option>
            </select>
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </div>
          </div>

          {/* Date Range - Simplified */}
          <div className="flex items-center gap-2 w-full md:w-auto">
             <div className="relative flex-1 md:w-40">
                <input 
                  type="date" 
                  className="w-full pl-9 pr-2 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500"
                  value={dateRange.start}
                  onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
                />
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
             </div>
             <span className="text-gray-400">-</span>
             <div className="relative flex-1 md:w-40">
                <input 
                  type="date" 
                  className="w-full pl-9 pr-2 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500"
                  value={dateRange.end}
                  onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
                />
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
             </div>
          </div>
          
          {/* Reset Button */}
          {(filterType !== 'ALL' || searchId || dateRange.start) && (
            <button 
              onClick={resetFilters}
              className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors whitespace-nowrap"
            >
              Xóa lọc
            </button>
          )}
        </div>

        {/* Right: Primary Action */}
        <button 
          onClick={() => setIsCreateModalOpen(true)}
          className="w-full lg:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 active:translate-y-0"
        >
          <Plus className="w-5 h-5" />
          Tạo Phiếu Mới
        </button>
      </div>

      {/* KHỐI 3: DANH SÁCH PHIẾU (DATA TABLE) */}
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
                           <button className="p-2 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400" title="Xem chi tiết">
                              <Eye className="w-4 h-4" />
                           </button>
                           {/* Add more actions if needed */}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
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
                     // Simple pagination logic for demo
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

      {/* CREATE MODAL */}
      <CreateInventoryModal 
        open={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
        // TRUYỀN WAREHOUSE ID TỪ ĐÂY (storeId lấy từ useWarehouseData trong InventoryManagement)
        currentWarehouseId={warehouse?.id} 
        onSuccess={() => {
           loadInventories();
           setFilterType('ALL');
        }}
      />
    </div>
  );
}