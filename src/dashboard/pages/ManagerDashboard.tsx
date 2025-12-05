/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from 'react';
import {
  AttachMoney,
  Assignment,
  LocalShipping,
  WarningAmber,
  Inventory2,
  TrendingUp,
  MoreVert
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';

import managerDashboardService, {
    type DailyStatsData,
    type TrendPoint,
    type InventoryItem,
    type OrderStatusItem
} from '@/service/managerDashboardService';
import { authService } from '@/service/authService';

// --- CONSTANTS & HELPERS ---

const COLORS = {
  primary: '#4f46e5',   // Indigo - Xử lý
  secondary: '#8b5cf6', // Violet - Vận chuyển
  success: '#10b981',   // Emerald - Thành công
  warning: '#f59e0b',   // Amber - Chờ
  error: '#f43f5e',     // Rose - Hủy/Lỗi
  slate: '#64748b',     // Slate - Khác
  info:  '#0ea5e9'      // Sky - Kho/Quản lý
};

// 1. Map tên trạng thái sang Tiếng Việt hiển thị cho đẹp
const STATUS_LABELS: Record<string, string> = {
    PRE_ORDER: 'Đặt trước',
    PENDING: 'Chờ xử lý',
    PAYMENT: 'Thanh toán',
    ASSIGN_ORDER_STORE: 'Gán cửa hàng',
    MANAGER_ACCEPT: 'QL Đã duyệt',
    READY_FOR_INVOICE: 'Chờ xuất HD',
    MANAGER_REJECT: 'QL Từ chối',
    MANAGER_EXPORT_ORDER: 'Đã xuất kho',
    CONFIRMED: 'Đã xác nhận',
    PACKAGED: 'Đã đóng gói',
    SHIPPING: 'Đang giao',
    DELIVERED: 'Đã giao',
    FINISHED: 'Hoàn tất',
    CANCELLED: 'Đã hủy'
};

// 2. Cập nhật logic màu sắc dựa trên response JSON thực tế
const getStatusColor = (status: string) => {
    switch (status) {
        // Nhóm Hủy/Từ chối -> Đỏ
        case 'CANCELLED':
        case 'MANAGER_REJECT':
            return COLORS.error;
        
        // Nhóm Thành công -> Xanh lá
        case 'DELIVERED':
        case 'FINISHED':
            return COLORS.success;

        // Nhóm Đang vận chuyển -> Tím
        case 'SHIPPING':
            return COLORS.secondary;

        // Nhóm Đang xử lý tại kho/quản lý -> Xanh dương
        case 'MANAGER_ACCEPT':
        case 'READY_FOR_INVOICE':
        case 'MANAGER_EXPORT_ORDER':
        case 'CONFIRMED':
        case 'PACKAGED':
            return COLORS.info;

        // Nhóm Chờ ban đầu -> Vàng/Cam
        case 'PRE_ORDER':
        case 'PENDING':
        case 'PAYMENT':
        case 'ASSIGN_ORDER_STORE':
            return COLORS.warning;

        default:
            return COLORS.slate;
    }
};

// --- COMPONENTS CON ---

const CardSkeleton = () => (
  <div className="bg-white dark:!bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:!border-gray-700 animate-pulse h-full">
    <div className="flex justify-between items-start">
      <div className="w-full">
        <div className="h-3 bg-gray-200 dark:!bg-gray-700 rounded w-1/2 mb-3"></div>
        <div className="h-6 bg-gray-200 dark:!bg-gray-700 rounded w-3/4 mb-2"></div>
      </div>
      <div className="w-10 h-10 bg-gray-200 dark:!bg-gray-700 rounded-xl"></div>
    </div>
  </div>
);

// --- CUSTOM TOOLTIP ---
const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:!bg-gray-800 p-3 border border-gray-100 dark:!border-gray-700 rounded-lg shadow-lg">
          {label && <p className="text-xs font-semibold text-gray-500 dark:!text-gray-400 mb-2">{label}</p>}
          {payload.map((entry: any, index: number) => {
             // Xử lý hiển thị tên và giá trị tùy vào biểu đồ
             const name = entry.name === 'revenue' ? 'Doanh thu' : (entry.name === 'orderCount' ? 'Số đơn hàng' : entry.name);
             const value = entry.name === 'revenue' || entry.name === 'Doanh thu'
                ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(entry.value)
                : entry.value;

             return (
                <div key={index} className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color || entry.fill }} />
                <span className="text-gray-600 dark:!text-gray-300">{name}:</span>
                <span className="font-bold text-gray-900 dark:!text-gray-100">
                    {value}
                </span>
                </div>
             );
          })}
        </div>
      );
    }
    return null;
};

// Component con hiển thị trạng thái rỗng (Tái sử dụng)
const EmptyDataState = ({ message }: { message: string }) => (
    <div className="flex h-full items-center justify-center flex-col gap-2 min-h-[200px]">
        <Inventory2 className="text-gray-300 dark:!text-gray-600" fontSize="large" />
        <span className="text-gray-400 dark:!text-gray-500 text-sm">{message}</span>
    </div>
);

interface OpsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  iconBgColor: string;
  iconColor: string;
  loading?: boolean;
  isAlert?: boolean;
}

const OpsCard: React.FC<OpsCardProps> = ({ title, value, icon, iconBgColor, iconColor, loading, isAlert }) => {
  if (loading) return <CardSkeleton />;

  return (
    <div className={`relative bg-white dark:!bg-gray-800 p-5 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border transition-all duration-300 transform hover:-translate-y-1 h-full overflow-hidden group
      ${isAlert ? 'border-rose-200 dark:!border-rose-900/50 ring-2 ring-rose-50 dark:ring-rose-900/20' : 'border-gray-100 dark:!border-gray-700 hover:shadow-lg dark:hover:!shadow-gray-900/50'}
    `}>
      <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-10 group-hover:scale-150 transition-transform duration-500 ${iconBgColor}`}></div>
      <div className="flex justify-between items-start relative z-10 gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-gray-500 dark:!text-gray-400 text-xs font-bold mb-1 tracking-wider uppercase truncate">{title}</p>
          <h3 className={`text-xl md:text-2xl font-bold tracking-tight truncate ${isAlert ? 'text-rose-600 dark:!text-rose-400' : 'text-gray-800 dark:!text-white'}`} title={String(value)}>
            {value}
          </h3>
          <div className="mt-2 h-6 flex items-center"> 
            {isAlert ? (
                <div className="inline-flex items-center px-2 py-0.5 rounded text-[10px] md:text-xs font-bold bg-rose-100 dark:!bg-rose-900/30 text-rose-700 dark:!text-rose-300 animate-pulse whitespace-nowrap">
                <WarningAmber style={{ fontSize: 14, marginRight: 4 }} />
                Cần xử lý
                </div>
            ) : (
                <span className="text-transparent text-xs select-none">.</span>
            )}
          </div>
        </div>
        <div className={`flex items-center justify-center w-12 h-12 rounded-xl shadow-md flex-shrink-0 ${iconBgColor} ${iconColor}`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

// --- MAIN COMPONENT (MANAGER) ---
const ManagerDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  
  // State API
  const [dailyStats, setDailyStats] = useState<DailyStatsData | null>(null);
  const [lowStockCount, setLowStockCount] = useState<number>(0); 
  const [trendData, setTrendData] = useState<TrendPoint[]>([]);
  
  // State cho Chart Status
  const [statusData, setStatusData] = useState<OrderStatusItem[]>([]);
  const [totalOrdersFromApi, setTotalOrdersFromApi] = useState<number>(0);

  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);

  // Lấy StoreID từ thông tin đăng nhập
  const storeId = authService.getStoreId();

  useEffect(() => {
    const fetchData = async () => {
      // Nếu không có storeId (ví dụ chưa đăng nhập hoặc không phải manager), dừng tải
      if (!storeId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        // Gọi API song song với storeId thực tế
        const [statsRes, trendRes, statusRes, inventoryRes] = await Promise.all([
          managerDashboardService.getDailyStats(storeId),
          managerDashboardService.getActivityTrend(storeId, 7),
          managerDashboardService.getOrderStatusBreakdown(storeId),
          managerDashboardService.getInventorySummary(storeId)
        ]);

        if (statsRes.data && statsRes.data.data) {
            setDailyStats(statsRes.data.data);
        }
        if (trendRes.data && trendRes.data.data) {
            setTrendData(trendRes.data.data.dataPoints || []);
        }
        if (statusRes.data && statusRes.data.data) {
            const data = statusRes.data.data;
            setStatusData(data.statusCounts || []);
            setTotalOrdersFromApi(data.totalOrders || 0);
        }
        if (inventoryRes.data && inventoryRes.data.data) {
            const invData = inventoryRes.data.data;
            setLowStockCount((invData.lowStockProducts || 0) + (invData.outOfStockProducts || 0));
            setInventoryItems(invData.items || []);
        }

      } catch (error) {
        console.error("Failed to fetch manager dashboard data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [storeId]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value);

  // --- XỬ LÝ DATA CHO CHART ---
  const pieChartData = statusData
    .filter(item => item.count > 0)
    .map(item => ({
      name: STATUS_LABELS[item.status] || item.status, // Hiển thị tiếng Việt
      value: item.count,
      rawStatus: item.status,
      color: getStatusColor(item.status)
    }));

  const displayTotalOrders = totalOrdersFromApi > 0 
    ? totalOrdersFromApi 
    : statusData.reduce((acc, curr) => acc + curr.count, 0);

  if (!storeId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:!bg-gray-900 text-gray-500 dark:!text-gray-400">
        <p>Vui lòng đăng nhập tài khoản quản lý chi nhánh để xem thông tin.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 dark:!bg-gray-900 p-4 md:p-6 lg:p-8 font-sans text-slate-900 dark:!text-slate-100">
      
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:!text-white tracking-tight">Quản Lý Chi Nhánh</h1>
        <p className="text-gray-500 dark:!text-gray-400 mt-1 text-sm">Tổng quan vận hành hôm nay.</p>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6">
        <OpsCard title="Doanh thu hôm nay" value={dailyStats ? formatCurrency(dailyStats.revenueToday) : '0 ₫'} icon={<AttachMoney />} iconBgColor="bg-gradient-to-br from-indigo-500 to-indigo-600" iconColor="text-white" loading={loading} />
        <OpsCard title="Đơn Chờ Xử Lý" value={dailyStats?.pendingOrders || 0} icon={<Assignment />} iconBgColor="bg-gradient-to-br from-amber-400 to-amber-600" iconColor="text-white" loading={loading} isAlert={Boolean(dailyStats?.pendingOrders && dailyStats.pendingOrders > 5)} />
        <OpsCard title="Đang Xử Lý/Giao" value={dailyStats?.processingOrders || 0} icon={<LocalShipping />} iconBgColor="bg-gradient-to-br from-emerald-400 to-emerald-600" iconColor="text-white" loading={loading} />
        <OpsCard title="Sắp Hết/Hết Hàng" value={lowStockCount} icon={<WarningAmber />} iconBgColor="bg-gradient-to-br from-rose-400 to-rose-600" iconColor="text-white" loading={loading} isAlert={lowStockCount > 0} />
      </div>

      {/* Main Chart - Xu Hướng (ĐÃ SỬA: Check Empty) */}
      <div className="mb-6 bg-white dark:!bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:!border-gray-700">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-gray-800 dark:!text-white flex items-center gap-2">
            <TrendingUp fontSize="small" className="text-indigo-500"/>
            Xu hướng hoạt động (7 ngày)
          </h2>
          <button className="p-1 hover:bg-gray-50 dark:hover:!bg-gray-700 rounded-full text-gray-400">
            <MoreVert fontSize="small" />
          </button>
        </div>

        <div className="h-[350px] w-full">
          {loading ? (
            <div className="h-full w-full bg-gray-100 dark:!bg-gray-700 rounded-lg animate-pulse"></div>
          ) : trendData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" className="dark:stroke-gray-700 dark:opacity-20" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 11 }} dy={10} />
                <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 11 }} tickFormatter={(val) => new Intl.NumberFormat('en', { notation: "compact" }).format(val)} />
                <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 11 }} />
                
                <Tooltip content={<CustomTooltip />} />
                
                <Legend iconType="circle" />
                <Line yAxisId="left" type="monotone" dataKey="revenue" name="Doanh thu" stroke={COLORS.primary} strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
                <Line yAxisId="right" type="monotone" dataKey="orderCount" name="Số đơn hàng" stroke={COLORS.secondary} strokeWidth={2} strokeDasharray="5 5" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            // EMPTY STATE CHO LINE CHART
            <EmptyDataState message="Chưa có dữ liệu xu hướng" />
          )}
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Status Pie Chart (ĐÃ SỬA: Check Empty) */}
        <div className="lg:col-span-5 bg-white dark:!bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:!border-gray-700 flex flex-col h-[400px]">
            <h2 className="text-lg font-bold text-gray-800 dark:!text-white mb-2">Trạng thái đơn</h2>
            <div className="flex-1 relative">
                {!loading && pieChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie data={pieChartData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                                {pieChartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                            <Legend verticalAlign="bottom" height={36} iconType="circle" formatter={(value) => <span className="text-xs font-medium text-gray-600 dark:!text-gray-300 ml-1">{value}</span>}/>
                        </PieChart>
                    </ResponsiveContainer>
                ) : !loading ? (
                    // EMPTY STATE CHO PIE CHART
                    <EmptyDataState message="Chưa có đơn hàng nào" />
                ) : (
                    // Loading state
                    <div className="h-full w-full bg-gray-100 dark:!bg-gray-700 rounded-full opacity-20 animate-pulse"></div>
                )}

                {/* Chỉ hiện tổng số khi có dữ liệu */}
                {!loading && displayTotalOrders > 0 && pieChartData.length > 0 && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
                        <span className="text-3xl font-black text-gray-800 dark:!text-white">{displayTotalOrders}</span>
                        <span className="text-[10px] text-gray-500 dark:!text-gray-400 font-bold uppercase">Tổng đơn</span>
                    </div>
                )}
            </div>
        </div>

        {/* Inventory / Top Kho List (ĐÃ SỬA: Check Empty) */}
        <div className="lg:col-span-7 bg-white dark:!bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:!border-gray-700 overflow-hidden flex flex-col h-[400px]">
            <div className="p-5 border-b border-gray-100 dark:!border-gray-700 flex justify-between items-center">
                <h2 className="text-lg font-bold text-gray-800 dark:!text-white">Tình Trạng Kho</h2>
                <Inventory2 className="text-gray-300 dark:!text-gray-600" fontSize="small"/>
            </div>
            <div className="flex-1 overflow-auto p-0 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-700">
                {!loading && inventoryItems.length === 0 ? (
                    // EMPTY STATE CHO INVENTORY
                    <EmptyDataState message="Kho hàng chưa có sản phẩm" />
                ) : (
                    <ul className="divide-y divide-gray-50 dark:!divide-gray-700">
                        {!loading && inventoryItems.map((item, index) => {
                            const isLow = item.status === 'LOW_STOCK' || item.status === 'OUT_OF_STOCK';
                            const stockPercent = Math.min(((item.currentStock || 0) / 50) * 100, 100);
                            
                            return (
                                <li key={item.productId + index} className="p-4 hover:bg-gray-50 dark:hover:!bg-gray-700/50 transition-colors flex items-center gap-3">
                                    <img 
                                        src={`https://placehold.co/100x100/f1f5f9/475569?text=${item.productName.charAt(0)}`}
                                        alt="" 
                                        className="w-10 h-10 rounded-lg object-cover border border-gray-200 dark:!border-gray-600" 
                                    />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-gray-800 dark:!text-white truncate">{item.productName}</p>
                                        <p className="text-xs text-gray-500 dark:!text-gray-400">Phân loại: {item.colorName}</p>
                                    </div>
                                    <div className="w-24 text-right">
                                        <div className="flex items-center justify-end gap-1 mb-1">
                                            <span className={`text-[10px] font-bold ${isLow ? 'text-rose-600 dark:!text-rose-400' : 'text-gray-700 dark:!text-gray-300'}`}>
                                                Kho: {item.currentStock}
                                            </span>
                                            {isLow && <WarningAmber style={{ fontSize: 12 }} className="text-rose-500" />}
                                        </div>
                                        <div className="h-1 w-full bg-gray-100 dark:!bg-gray-700 rounded-full overflow-hidden">
                                            <div className={`h-full rounded-full ${isLow ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{ width: `${stockPercent}%` }}></div>
                                        </div>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboard;