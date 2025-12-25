import React, { useMemo } from 'react';
import {
  ReceiptLong,    // Icon đơn hàng
  Chat,           // Icon chat
  AttachMoney,    // Icon tiền
  Inventory,      // Icon kho
  Refresh,        // Icon refresh
  MoreHoriz,
  CheckCircle,
  // Warning,
  LocalShipping,  // Icon đang giao
  DoneAll         // Icon hoàn tất
} from '@mui/icons-material';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

// Import Hook lấy dữ liệu
import { useStaffData } from '@/hooks/useStaffData'; 

// --- HELPERS ---

// Format tiền tệ VNĐ
const formatCurrency = (value: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value);

// Helper chọn màu cho trạng thái đơn hàng
const getStatusColor = (status: string) => {
  const s = status?.toUpperCase();
  if (['PENDING', 'ASSIGN_ORDER_STORE', 'PRE_ORDER'].includes(s)) return 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400';
  if (['CONFIRMED', 'MANAGER_ACCEPT', 'PAYMENT', 'READY_FOR_INVOICE'].includes(s)) return 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400';
  if (['SHIPPING', 'DELIVERING', 'PACKAGED'].includes(s)) return 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400';
  if (['COMPLETED', 'DELIVERED', 'FINISHED'].includes(s)) return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400';
  if (['CANCELLED', 'MANAGER_REJECT', 'DENIED'].includes(s)) return 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400';
  return 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400';
};

// Helper hiển thị tên trạng thái tiếng Việt
const getStatusLabel = (status: string) => {
  const s = status?.toUpperCase();
  if (['PENDING', 'ASSIGN_ORDER_STORE'].includes(s)) return 'Chờ duyệt';
  if (['MANAGER_ACCEPT'].includes(s)) return 'Đã duyệt';
  if (['DELIVERED', 'FINISHED'].includes(s)) return 'Hoàn thành';
  if (['CANCELLED', 'MANAGER_REJECT'].includes(s)) return 'Đã hủy';
  return s; // Trả về nguyên gốc nếu không khớp
};

// --- COMPONENTS CON (Skeleton & Card) ---

const CardSkeleton = () => (
  <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 animate-pulse h-full">
    <div className="flex justify-between items-center">
      <div className="w-full">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
      </div>
      <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
    </div>
  </div>
);

interface TaskCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  colorClass: string;
  bgClass: string;
  loading?: boolean;
  subText?: string;
  onClick?: () => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ title, value, icon, colorClass, bgClass, loading, subText, onClick }) => {
  if (loading) return <CardSkeleton />;

  return (
    <div 
      onClick={onClick}
      className={`bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all duration-300 flex items-center justify-between group h-full ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div>
        <p className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1">{title}</p>
        <h3 className={`text-2xl font-bold tracking-tight ${colorClass}`}>
          {value}
        </h3>
        {subText && (
           <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 mt-1 inline-block">
             {subText}
           </span>
        )}
      </div>
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl ${bgClass} ${colorClass} group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
    </div>
  );
};

// Tooltip cho biểu đồ tròn
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomPieTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-gray-800 p-2 border border-gray-100 dark:border-gray-700 rounded shadow text-xs">
        <span className="font-semibold text-gray-700 dark:text-gray-300">{payload[0].name}: </span>
        <span className="font-bold text-gray-900 dark:text-white">{payload[0].value}</span>
      </div>
    );
  }
  return null;
};

// --- MAIN COMPONENT ---
const StaffDashboard: React.FC = () => {
  // 1. Gọi Hook lấy dữ liệu
  const { stats, inventory, orders, messages, loading, refresh } = useStaffData();

  // 2. Tính toán các chỉ số hiển thị
  const unreadMessagesCount = useMemo(() => messages.filter(m => m.isUnread).length, [messages]);
  
  // Lọc số lượng đơn chờ xử lý (nếu API stats chưa trả về đúng thì tính thủ công từ list orders)
  const pendingOrdersCount = useMemo(() => {
      // Ưu tiên lấy từ stats API, nếu không có thì đếm từ list orders
      if (stats?.pendingStoreOrdersCount !== undefined && stats.pendingStoreOrdersCount > 0) {
          return stats.pendingStoreOrdersCount;
      }
      return orders.filter(o => ['PENDING', 'ASSIGN_ORDER_STORE'].includes(o.status)).length;
  }, [stats, orders]);

  // 3. Chuẩn bị dữ liệu cho biểu đồ kho
  const inventoryData = useMemo(() => {
      if (!inventory) return [];
      return [
        { name: 'Sẵn hàng', value: inventory.inStockProducts ?? 0, color: '#10b981' }, // Emerald-500
        { name: 'Sắp hết', value: inventory.lowStockProducts ?? 0, color: '#f59e0b' },  // Amber-500
        { name: 'Hết hàng', value: inventory.outOfStockProducts ?? 0, color: '#ef4444' }, // Red-500
      ].filter(item => item.value > 0); // Chỉ hiển thị phần có dữ liệu
  }, [inventory]);

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-gray-900 p-4 md:p-6 lg:p-8 font-sans text-slate-900 dark:text-slate-100">
      
      {/* Header Section */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">Bàn Làm Việc</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
             Xin chào, dưới đây là tổng quan công việc hôm nay.
          </p>
        </div>
        <div className="flex gap-2">
            <button 
                onClick={() => refresh()} 
                className="flex items-center gap-2 bg-white dark:bg-gray-800 px-4 py-2 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium text-gray-600 dark:text-gray-300"
            >
                <Refresh fontSize="small" className={loading ? "animate-spin" : ""} />
                Làm mới
            </button>
            <div className="flex items-center gap-3 bg-white dark:bg-gray-800 px-4 py-2 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Hệ thống online</span>
            </div>
        </div>
      </div>

      {/* 1. Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {/* Card: Đơn chờ */}
        <TaskCard 
            title="Đơn Chờ Cửa Hàng" 
            value={pendingOrdersCount} 
            icon={<ReceiptLong fontSize="inherit"/>}
            colorClass="text-amber-600 dark:!text-amber-400"
            bgClass="bg-amber-100 dark:!bg-amber-900/30"
            loading={loading}
            subText="Cần xử lý ngay"
        />
        
        {/* Card: Tin nhắn */}
        <TaskCard 
            title="Tin Nhắn Chưa Đọc" 
            value={unreadMessagesCount} 
            icon={<Chat fontSize="inherit"/>}
            colorClass="text-indigo-600 dark:!text-indigo-400"
            bgClass="bg-indigo-100 dark:!bg-indigo-900/30"
            loading={loading}
            subText="Hỗ trợ khách hàng"
        />
        
        {/* Card: Doanh số (Dùng stats.personalRevenue) */}
        <TaskCard 
            title="Doanh Số Cá Nhân" 
            value={stats ? formatCurrency(stats.personalRevenue) : '0 ₫'} 
            icon={<AttachMoney fontSize="inherit"/>}
            colorClass="text-emerald-600 dark:!text-emerald-400"
            bgClass="bg-emerald-100 dark:!bg-emerald-900/30"
            loading={loading}
            subText={`${stats?.createdOrdersCount ?? 0} đơn đã tạo`}
        />
        
        {/* Card: Cảnh báo kho (Dùng inventory.lowStockProducts) */}
        <TaskCard 
            title="Cảnh Báo Kho" 
            value={inventory?.lowStockProducts ?? 0} 
            icon={<Inventory fontSize="inherit"/>}
            colorClass="text-rose-600 dark:!text-rose-400"
            bgClass="bg-rose-100 dark:!bg-rose-900/30"
            loading={loading}
            subText="Sản phẩm sắp hết"
        />
      </div>

      {/* 2. Middle Section: Chart & Orders List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        
        {/* Left: Inventory Summary Chart */}
        <div className="lg:col-span-1 bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col h-[400px]">
            <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-2 flex items-center gap-2">
                <Inventory fontSize="small" className="text-gray-400"/>
                Tình Trạng Kho
            </h2>
            <p className="text-xs text-gray-500 mb-4">Tổng {inventory?.totalProducts ?? 0} sản phẩm trong kho</p>
            
            <div className="flex-1 relative">
                {loading ? (
                   <div className="absolute inset-0 bg-gray-100 dark:bg-gray-700 rounded animate-pulse"></div>
                ) : (
                    inventoryData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={inventoryData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {inventoryData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomPieTooltip />} />
                                <Legend verticalAlign="bottom" height={36} iconType="circle"/>
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex h-full flex-col items-center justify-center text-gray-400 text-sm">
                           <Inventory fontSize="large" className="mb-2 opacity-20"/>
                           <span>Chưa có dữ liệu kho</span>
                        </div>
                    )
                )}
            </div>
            
            {/* Quick Stats Footer */}
            {!loading && inventory && (
                 <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                    <div className="text-center">
                        <div className="text-xs text-gray-500">Hết hàng</div>
                        <div className="font-bold text-rose-600">{inventory.outOfStockProducts}</div>
                    </div>
                    <div className="text-center border-l border-r border-gray-100 dark:border-gray-700">
                         <div className="text-xs text-gray-500">Sắp hết</div>
                         <div className="font-bold text-amber-500">{inventory.lowStockProducts}</div>
                    </div>
                    <div className="text-center">
                         <div className="text-xs text-gray-500">Sẵn hàng</div>
                         <div className="font-bold text-emerald-600">{inventory.inStockProducts}</div>
                    </div>
                 </div>
            )}
        </div>

        {/* Right: Orders List */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-0 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col h-[400px]">
            <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-700/30">
                <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                    <LocalShipping fontSize="small" className="text-blue-500"/>
                    Đơn Hàng Gần Đây
                </h2>
                <span className="bg-white dark:bg-gray-600 shadow-sm border border-gray-200 dark:border-gray-500 text-gray-600 dark:text-gray-200 text-xs font-bold px-3 py-1 rounded-full">
                    {orders.length} đơn
                </span>
            </div>
            <div className="flex-1 overflow-auto scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-700">
                {loading ? (
                    <div className="p-4 space-y-4">
                        {[1, 2, 3].map(i => <div key={i} className="h-20 bg-gray-100 dark:bg-gray-700 rounded animate-pulse"></div>)}
                    </div>
                ) : (
                    <ul className="divide-y divide-gray-50 dark:divide-gray-700">
                        {orders.length > 0 ? orders.map((order) => (
                            <li key={order.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer group">
                                <div className="flex justify-between items-start mb-1">
                                    <div className='flex items-center gap-2'>
                                        <span className="text-xs font-bold text-gray-500 dark:text-gray-400">{order.id}</span>
                                        {/* Status Badge */}
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getStatusColor(order.status)}`}>
                                            {getStatusLabel(order.status)}
                                        </span>
                                    </div>
                                    <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500">{order.time}</span>
                                </div>
                                <div className="flex justify-between items-center mb-1">
                                    <h4 className="text-sm font-semibold text-gray-800 dark:text-white truncate max-w-[200px]">
                                        {order.customerName}
                                    </h4>
                                    <div className="flex items-center text-indigo-600 dark:text-indigo-400 font-bold text-sm">
                                        <AttachMoney style={{fontSize: 16}}/>
                                        {formatCurrency(order.total)}
                                    </div>
                                </div>
                                
                                {/* Action Buttons (chỉ hiện khi hover hoặc đơn PENDING) */}
                                <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                    {['PENDING', 'ASSIGN_ORDER_STORE'].includes(order.status) ? (
                                        <button className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-3 py-1 rounded shadow">
                                            Xử lý ngay
                                        </button>
                                    ) : (
                                        <button className="text-gray-400 hover:text-gray-600 text-xs flex items-center gap-1">
                                            Xem chi tiết &rarr;
                                        </button>
                                    )}
                                </div>
                            </li>
                        )) : (
                            <li className="h-full flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 text-sm p-8">
                                <CheckCircle fontSize="large" className="mb-2 opacity-20"/>
                                Không có đơn hàng nào gần đây
                            </li>
                        )}
                    </ul>
                )}
            </div>
        </div>
      </div>

      {/* 3. Bottom: Messages */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                  <Chat fontSize="small" className="text-indigo-500"/>
                  Hỗ Trợ Khách Hàng
              </h2>
              <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"><MoreHoriz /></button>
          </div>
          
          {loading ? (
             <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
                 {[1,2,3].map(i => <div key={i} className="h-16 bg-gray-100 dark:bg-gray-700 rounded animate-pulse"></div>)}
             </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-100 dark:divide-gray-700">
                {messages.length > 0 ? messages.map((msg) => (
                    <div key={msg.id} className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer flex gap-4 ${msg.isUnread ? 'bg-indigo-50/30 dark:bg-indigo-900/20' : ''}`}>
                        <img src={msg.avatar} alt="" className="w-10 h-10 rounded-full border border-gray-200 dark:border-gray-600 object-cover" />
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start mb-1">
                                <h4 className={`text-sm truncate ${msg.isUnread ? 'font-bold text-gray-900 dark:text-white' : 'font-medium text-gray-700 dark:text-gray-300'}`}>
                                    {msg.customerName}
                                </h4>
                                <span className="text-[10px] text-gray-400 dark:text-gray-500 whitespace-nowrap ml-2">{msg.time}</span>
                            </div>
                            <p className={`text-xs truncate ${msg.isUnread ? 'text-indigo-600 dark:text-indigo-400 font-medium' : 'text-gray-500 dark:text-gray-400'}`}>
                                {msg.preview}
                            </p>
                        </div>
                        {msg.isUnread && <div className="w-2 h-2 bg-indigo-500 rounded-full mt-2 shrink-0"></div>}
                    </div>
                )) : (
                    <div className="col-span-3 p-8 text-center text-gray-400 dark:text-gray-500 text-sm flex flex-col items-center">
                        <DoneAll className="mb-2 opacity-20"/>
                        Đã trả lời hết tin nhắn
                    </div>
                )}
            </div>
          )}
      </div>
    </div>
  );
};

export default StaffDashboard;