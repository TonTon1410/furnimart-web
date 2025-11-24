import React from 'react';
import { 
  X, 
  Calendar, 
  MapPin, 
  User, 
  FileText, 
  Package, 
  ArrowDownLeft, 
  ArrowUpRight,
  Printer,
  Hash
} from 'lucide-react';
import dayjs from 'dayjs';
import type { InventoryResponse } from '@/service/inventoryService';

interface InventoryDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: InventoryResponse | null;
}

const InventoryDetailModal: React.FC<InventoryDetailModalProps> = ({ isOpen, onClose, data }) => {
  if (!isOpen || !data) return null;

  // Xác định màu sắc chủ đạo dựa trên loại phiếu
  const isImport = ['IMPORT', 'IN', 'STOCK_IN'].includes(data.type);
  const themeColor = isImport ? 'text-emerald-600' : 'text-amber-600';
  const bgColor = isImport ? 'bg-emerald-50' : 'bg-amber-50';
  const borderColor = isImport ? 'border-emerald-100' : 'border-amber-100';
  const Icon = isImport ? ArrowDownLeft : ArrowUpRight;

  // Tính tổng số lượng item
  const totalQuantity = data.itemResponseList?.reduce((sum, item) => sum + item.quantity, 0) || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop with Blur Effect */}
      <div 
        className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-4xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header: Sang trọng, tách biệt */}
        <div className="px-8 py-6 border-b border-gray-100 dark:border-gray-800 flex items-start justify-between bg-white dark:bg-gray-900 z-10">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl ${bgColor} ${themeColor}`}>
              <Icon className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
                  Phiếu {isImport ? 'Nhập Kho' : 'Xuất Kho'}
                </h2>
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${bgColor} ${themeColor} ${borderColor}`}>
                  #{data.id}
                </span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {dayjs(data.date).format('DD tháng MM, YYYY - HH:mm')}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors" title="In phiếu">
                <Printer className="w-5 h-5" />
            </button>
            <button 
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto flex-1 p-8 space-y-8 bg-gray-50/50 dark:bg-gray-900/50">
          
          {/* Section 1: Thông tin chung (Grid Layout) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
              <p className="text-xs font-medium text-gray-400 uppercase mb-2 flex items-center gap-1">
                <MapPin className="w-3 h-3" /> Kho hàng
              </p>
              <p className="font-semibold text-gray-900 dark:text-white truncate" title={data.warehouseName}>
                {data.warehouseName}
              </p>
              <p className="text-xs text-gray-500 mt-1 truncate">ID: {data.warehouseId}</p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
              <p className="text-xs font-medium text-gray-400 uppercase mb-2 flex items-center gap-1">
                <User className="w-3 h-3" /> Người thực hiện
              </p>
              <p className="font-semibold text-gray-900 dark:text-white truncate">
                {/* Giả lập tên vì data chỉ có ID */}
                Nhân viên kho
              </p>
              <p className="text-xs text-gray-500 mt-1 truncate" title={data.employeeId}>ID: {data.employeeId}</p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
              <p className="text-xs font-medium text-gray-400 uppercase mb-2 flex items-center gap-1">
                <Hash className="w-3 h-3" /> Thông tin khác
              </p>
              <div className="flex flex-col gap-1">
                 <span className="text-sm text-gray-700 dark:text-gray-300">
                    Mục đích: <span className="font-medium">{data.purpose}</span>
                 </span>
                 {data.orderId && (
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                        Đơn hàng: <span className="text-blue-600 font-medium">#{data.orderId}</span>
                    </span>
                 )}
              </div>
            </div>
          </div>

          {/* Section 2: Ghi chú */}
          {data.note && (
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800 flex gap-3">
               <FileText className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
               <div>
                  <h4 className="text-sm font-bold text-blue-700 dark:text-blue-400">Ghi chú</h4>
                  <p className="text-sm text-blue-600 dark:text-blue-300 mt-1 leading-relaxed">{data.note}</p>
               </div>
            </div>
          )}

          {/* Section 3: Danh sách sản phẩm (Table Modern) */}
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
                    <th className="px-6 py-4">Tên sản phẩm</th>
                    <th className="px-6 py-4">Màu sắc (Mã)</th>
                    <th className="px-6 py-4 text-right">Số lượng</th>
                    <th className="px-6 py-4 text-right">Đã đặt trước</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {data.itemResponseList?.length === 0 ? (
                    <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-gray-400 text-sm">
                            Không có sản phẩm nào trong phiếu này.
                        </td>
                    </tr>
                  ) : (
                    data.itemResponseList?.map((item, index) => (
                        <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                        <td className="px-6 py-4 text-sm text-gray-400 w-16">{index + 1}</td>
                        <td className="px-6 py-4">
                            <span className="font-medium text-gray-900 dark:text-white block">{item.productName}</span>
                            <span className="text-xs text-gray-400">ID: {item.inventoryId}</span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400 font-mono">
                            {item.productColorId.substring(0, 8)}...
                        </td>
                        <td className="px-6 py-4 text-right">
                            <span className={`font-bold ${themeColor} text-base`}>
                                {item.quantity.toLocaleString()}
                            </span>
                        </td>
                        <td className="px-6 py-4 text-right text-sm text-gray-500">
                            {item.reservedQuantity > 0 ? item.reservedQuantity.toLocaleString() : '-'}
                        </td>
                        </tr>
                    ))
                  )}
                </tbody>
                {/* Footer của Table - Tổng kết */}
                {data.itemResponseList && data.itemResponseList.length > 0 && (
                    <tfoot className="bg-gray-50 dark:bg-gray-800/80 border-t border-gray-200 dark:border-gray-700">
                        <tr>
                            <td colSpan={3} className="px-6 py-4 text-sm font-semibold text-gray-600 dark:text-gray-300 text-right">
                                Tổng cộng:
                            </td>
                            <td className="px-6 py-4 text-right">
                                <span className="text-lg font-bold text-gray-900 dark:text-white">{totalQuantity.toLocaleString()}</span>
                            </td>
                            <td></td>
                        </tr>
                    </tfoot>
                )}
              </table>
            </div>
          </div>

        </div>

        {/* Footer: Action Buttons */}
        <div className="px-8 py-5 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 flex justify-end gap-3 z-10">
            <button 
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors"
            >
                Đóng
            </button>
            <button 
                className={`px-6 py-2.5 rounded-xl text-sm font-semibold text-white shadow-lg shadow-emerald-200/50 dark:shadow-none hover:opacity-90 transition-all active:scale-95 ${isImport ? 'bg-emerald-600' : 'bg-amber-600'}`}
            >
                {isImport ? 'Xuất File PDF' : 'In Phiếu Xuất'}
            </button>
        </div>
      </div>
    </div>
  );
};

export default InventoryDetailModal;