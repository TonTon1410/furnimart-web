/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState, useMemo } from 'react';
import {
  AttachMoney,
  ShoppingCart,
  Store,
  PersonAdd,
  Inventory2,
  BarChart as BarChartIcon
} from '@mui/icons-material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

// Import Service và Types
import adminDashboardService, { 
    type StatsOverviewData, 
    type RevenueByBranchData,
    type TopProductsData,
    type DeliveryPerformanceData
} from '@/service/adminDashboardService';

// ... (Giữ nguyên các component con StatCardSkeleton, StatCard, CustomTooltip) ...
const StatCardSkeleton = () => (
  <div className="bg-white dark:!bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:!border-gray-700 animate-pulse h-full">
    <div className="flex justify-between items-start">
      <div className="w-full">
        <div className="h-3 bg-gray-200 dark:!bg-gray-700 rounded w-1/2 mb-3"></div>
        <div className="h-6 bg-gray-200 dark:!bg-gray-700 rounded w-3/4 mb-2"></div>
        <div className="h-3 bg-gray-200 dark:!bg-gray-700 rounded w-1/3"></div>
      </div>
      <div className="w-10 h-10 bg-gray-200 dark:!bg-gray-700 rounded-xl"></div>
    </div>
  </div>
);

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  iconBgColor: string;
  iconColor: string;
  loading?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, iconBgColor, iconColor, loading }) => {
  if (loading) return <StatCardSkeleton />;

  return (
    <div className="bg-white dark:!bg-gray-800 p-5 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-100 dark:!border-gray-700 hover:shadow-lg dark:hover:!shadow-gray-900/50 transition-all duration-300 transform hover:-translate-y-1 h-full relative overflow-hidden group">
      <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-10 group-hover:scale-150 transition-transform duration-500 ${iconBgColor}`}></div>
      <div className="flex justify-between items-start relative z-10 gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-gray-500 dark:!text-gray-400 text-xs font-bold mb-1 tracking-wider uppercase truncate">{title}</p>
          <h3 className="text-xl md:text-2xl font-bold text-gray-800 dark:!text-white tracking-tight truncate" title={String(value)}>
            {value}
          </h3>
        </div>
        <div className={`flex items-center justify-center w-12 h-12 rounded-xl shadow-md flex-shrink-0 ${iconBgColor} ${iconColor}`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:!bg-gray-800 p-3 border border-gray-100 dark:!border-gray-700 rounded-lg shadow-lg">
          <p className="text-xs font-semibold text-gray-500 dark:!text-gray-400 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-gray-600 dark:!text-gray-300">{entry.name}:</span>
              <span className="font-bold text-gray-900 dark:!text-gray-100">
                {entry.name === 'Doanh thu' 
                  ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(entry.value)
                  : entry.value}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
};

// Component con hiển thị trạng thái rỗng (để tái sử dụng cho code gọn hơn)
const EmptyDataState = ({ message }: { message: string }) => (
    <div className="flex h-full items-center justify-center flex-col gap-2 min-h-[200px]">
        <Inventory2 className="text-gray-300 dark:!text-gray-600" fontSize="large" />
        <span className="text-gray-400 dark:!text-gray-500 text-sm">{message}</span>
    </div>
);

// --- MAIN COMPONENT (ADMIN) ---

const AdminDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  
  // State definition
  const [stats, setStats] = useState<StatsOverviewData | null>(null);
  const [revenueData, setRevenueData] = useState<RevenueByBranchData['branches']>([]);
  const [deliveryData, setDeliveryData] = useState<DeliveryPerformanceData['statuses']>([]);
  const [topProducts, setTopProducts] = useState<TopProductsData>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [statsRes, revenueRes, deliveryRes, productsRes] = await Promise.all([
          adminDashboardService.getStatsOverview(),
          adminDashboardService.getRevenueByBranch(),
          adminDashboardService.getDeliveryPerformance(),
          adminDashboardService.getTopProducts(5)
        ]);

        if (statsRes.data?.data) setStats(statsRes.data.data);
        if (revenueRes.data?.data?.branches) setRevenueData(revenueRes.data.data.branches); 
        if (deliveryRes.data?.data?.statuses) setDeliveryData(deliveryRes.data.data.statuses);
        if (productsRes.data?.data) setTopProducts(productsRes.data.data);

      } catch (error) {
        console.error("Failed to fetch admin dashboard data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value);

  const { pieChartData, successfulRate } = useMemo(() => {
    // ... (Giữ nguyên logic useMemo như cũ) ...
    const COLORS = {
        primary: '#4f46e5', success: '#10b981', error: '#f43f5e',
        warning: '#f59e0b', info: '#0ea5e9', secondary: '#8b5cf6'
    };

    const getStatusColor = (status: string) => {
        const s = status.toUpperCase();
        if (['FINISHED', 'DELIVERED', 'COMPLETED'].includes(s)) return COLORS.success;
        if (['CANCELLED', 'MANAGER_REJECT', 'RETURN'].includes(s)) return COLORS.error;
        if (['PENDING', 'PRE_ORDER', 'PAYMENT'].includes(s)) return COLORS.warning;
        if (['SHIPPING', 'PACKAGED', 'READY_FOR_INVOICE'].includes(s)) return COLORS.info;
        if (['MANAGER_ACCEPT', 'MANAGER_EXPORT_ORDER'].includes(s)) return COLORS.secondary;
        return COLORS.primary;
    };

    const formatStatusName = (status: string) => {
        const map: Record<string, string> = {
            'PENDING': 'Chờ xử lý', 'ASSIGN_ORDER_STORE': 'Gán cửa hàng',
            'MANAGER_ACCEPT': 'QL đã duyệt', 'FINISHED': 'Hoàn thành',
            'SHIPPING': 'Đang giao', 'PACKAGED': 'Đã đóng gói',
            'CANCELLED': 'Đã hủy', 'DELIVERED': 'Giao thành công',
            'MANAGER_REJECT': 'QL Từ chối', 'PRE_ORDER': 'Đặt trước',
            'PAYMENT': 'Thanh toán', 'READY_FOR_INVOICE': 'Chờ xuất hóa đơn',
            'MANAGER_EXPORT_ORDER': 'QL xuất kho'
        };
        return map[status] || status;
    };

    const chartData = deliveryData
        .filter(item => item.count > 0)
        .map(item => ({
            name: formatStatusName(item.status), 
            value: item.count,
            color: getStatusColor(item.status)
        }))
        .sort((a, b) => b.value - a.value);

    const successItems = deliveryData.filter(d => ['FINISHED', 'DELIVERED'].includes(d.status.toUpperCase()));
    const rate = successItems.reduce((acc, curr) => acc + curr.percentage, 0).toFixed(1);

    return { pieChartData: chartData, successfulRate: rate };
  }, [deliveryData]);

  return (
    <div className="min-h-screen bg-gray-50/50 dark:!bg-gray-900 p-4 md:p-6 lg:p-8 font-sans text-slate-900 dark:!text-slate-100">
      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:!text-white tracking-tight">Tổng quan quản trị</h1>
          <p className="text-gray-500 dark:!text-gray-400 mt-1 text-sm">Số liệu kinh doanh thời gian thực.</p>
        </div>
        <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-md transition-colors flex items-center gap-2 w-fit">
            <Inventory2 fontSize="small" />
            Xuất báo cáo
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6">
        <StatCard title="Tổng Doanh Thu" value={stats ? formatCurrency(stats.totalRevenue) : '0 ₫'} icon={<AttachMoney />} iconBgColor="bg-gradient-to-br from-indigo-500 to-indigo-600" iconColor="text-white" loading={loading} />
        <StatCard title="Tổng Đơn Hàng" value={stats ? stats.totalOrders.toLocaleString() : '0'} icon={<ShoppingCart />} iconBgColor="bg-gradient-to-br from-sky-400 to-sky-600" iconColor="text-white" loading={loading} />
        <StatCard title="Chi Nhánh Active" value={stats ? `${stats.totalActiveStores}` : '0'} icon={<Store />} iconBgColor="bg-gradient-to-br from-amber-400 to-amber-600" iconColor="text-white" loading={loading} />
        <StatCard title="Người Dùng" value={stats ? `${stats.totalUsers}` : '0'} icon={<PersonAdd />} iconBgColor="bg-gradient-to-br from-emerald-400 to-emerald-600" iconColor="text-white" loading={loading} />
      </div>

      {/* Chart Section - Revenue By Branch (ĐÃ SỬA: Thêm logic check empty) */}
      <div className="mb-6 bg-white dark:!bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:!border-gray-700">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-gray-800 dark:!text-white flex items-center gap-2">
                <BarChartIcon fontSize="small" className="text-indigo-500" />
                Doanh Thu Chi Nhánh
            </h2>
          </div>
          <div className="h-[350px] w-full"> 
            {loading ? (
                <div className="h-full w-full bg-gray-100 dark:!bg-gray-700 animate-pulse rounded-lg"></div> 
            ) : revenueData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" className="dark:opacity-20" />
                  <XAxis dataKey="branchName" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 11 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 11 }} tickFormatter={(val) => new Intl.NumberFormat('en', { notation: "compact" }).format(val)} />
                  <Tooltip cursor={{ fill: 'transparent' }} content={<CustomTooltip />} />
                  <Bar dataKey="revenue" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={40} name="Doanh thu" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
                // EMPTY STATE CHO BIỂU ĐỒ CỘT
                <EmptyDataState message="Chưa có dữ liệu doanh thu" />
            )}
          </div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Delivery Performance Pie Chart */}
        <div className="lg:col-span-5 bg-white dark:!bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:!border-gray-700 flex flex-col h-[400px]">
          <h2 className="text-lg font-bold text-gray-800 dark:!text-white mb-2">Hiệu Quả Giao Hàng</h2>
          <div className="flex-1 relative">
            {!loading && pieChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                    <Pie data={pieChartData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                        {pieChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" formatter={(value) => <span className="text-xs font-medium text-gray-600 dark:!text-gray-300 ml-1">{value}</span>} />
                    </PieChart>
                </ResponsiveContainer>
            ) : !loading ? (
                // EMPTY STATE CHO PIE CHART (Giữ nguyên như code gốc)
                <EmptyDataState message="Chưa có dữ liệu giao hàng" />
            ) : (
                <div className="h-full w-full bg-gray-100 dark:!bg-gray-700 animate-pulse rounded-full opacity-20"></div>
            )}
            
             {!loading && pieChartData.length > 0 && (
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
                    <span className="text-3xl font-black text-gray-800 dark:!text-white">{successfulRate}%</span>
                    <span className="text-[10px] text-gray-500 dark:!text-gray-400 font-bold uppercase">Thành công</span>
                </div>
             )}
          </div>
        </div>

        {/* Top Products (ĐÃ SỬA: Thêm logic check empty bên ngoài) */}
        <div className="lg:col-span-7 bg-white dark:!bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:!border-gray-700 overflow-hidden flex flex-col h-[400px]">
            <div className="p-5 border-b border-gray-100 dark:!border-gray-700 flex justify-between items-center">
                <h2 className="text-lg font-bold text-gray-800 dark:!text-white">Top Sản Phẩm</h2>
                <span className="text-xs text-indigo-600 dark:!text-indigo-400 font-bold cursor-pointer hover:underline">Xem tất cả</span>
            </div>
            <div className="flex-1 overflow-auto p-0 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-700">
                {!loading && topProducts.length === 0 ? (
                    // EMPTY STATE CHO TOP PRODUCTS
                    <EmptyDataState message="Chưa có dữ liệu sản phẩm" />
                ) : (
                    <ul className="divide-y divide-gray-50 dark:!divide-gray-700">
                        {!loading && topProducts.map((product, index) => (
                            <li key={product.productColorId || index} className="group hover:bg-gray-50 dark:hover:!bg-gray-700/50 p-4 flex items-center gap-3 transition-colors">
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${index < 3 ? 'bg-indigo-100 text-indigo-700 dark:!bg-indigo-900/50 dark:!text-indigo-300' : 'bg-gray-100 text-gray-500 dark:!bg-gray-700 dark:!text-gray-400'}`}>
                                    #{index + 1}
                                </div>
                                <img 
                                    src={(product as any).image || `https://placehold.co/100x100/e2e8f0/64748b?text=${product.productName.charAt(0)}`} 
                                    alt={product.productName} 
                                    className="w-10 h-10 rounded-lg object-cover border border-gray-200 dark:!border-gray-600" 
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = `https://placehold.co/100x100/e2e8f0/64748b?text=${product.productName.charAt(0)}`;
                                    }}
                                />
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-sm font-semibold text-gray-900 dark:!text-white truncate" title={product.productName}>
                                        {product.productName}
                                    </h4>
                                    <p className="text-xs text-gray-500 dark:!text-gray-400">
                                        Màu: {product.colorName} • Đã bán: <span className="font-medium text-gray-700 dark:!text-gray-300">{product.totalQuantitySold}</span>
                                    </p>
                                </div>
                                <div className="font-bold text-indigo-600 dark:!text-indigo-300 text-xs whitespace-nowrap bg-indigo-50 dark:!bg-indigo-900/30 px-2 py-1 rounded">
                                    {formatCurrency(product.totalRevenue)}
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;