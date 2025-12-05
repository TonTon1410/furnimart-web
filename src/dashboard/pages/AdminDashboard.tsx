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
// Lưu ý: Đảm bảo đường dẫn import này đúng với project của bạn
import adminDashboardService, { 
    type StatsOverviewData, 
    type RevenueByBranchData,
    type TopProductsData,
    type DeliveryPerformanceData
} from '@/service/adminDashboardService';

// --- COMPONENTS CON (StatCard và Skeleton) ---

const StatCardSkeleton = () => (
  <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 animate-pulse h-full">
    <div className="flex justify-between items-start">
      <div className="w-full">
        <div className="h-3 bg-gray-200 rounded w-1/2 mb-3"></div>
        <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-3 bg-gray-200 rounded w-1/3"></div>
      </div>
      <div className="w-10 h-10 bg-gray-200 rounded-xl"></div>
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
    <div className="bg-white p-5 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-100 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 h-full relative overflow-hidden group">
      <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-10 group-hover:scale-150 transition-transform duration-500 ${iconBgColor}`}></div>
      <div className="flex justify-between items-start relative z-10 gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-gray-500 text-xs font-bold mb-1 tracking-wider uppercase truncate">{title}</p>
          <h3 className="text-xl md:text-2xl font-bold text-gray-800 tracking-tight truncate" title={String(value)}>
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
        // Gọi API song song
        const [statsRes, revenueRes, deliveryRes, productsRes] = await Promise.all([
          adminDashboardService.getStatsOverview(),
          adminDashboardService.getRevenueByBranch(),
          adminDashboardService.getDeliveryPerformance(),
          adminDashboardService.getTopProducts(5)
        ]);

        // 1. Stats Overview
        if (statsRes.data?.data) {
          setStats(statsRes.data.data);
        }

        // 2. Revenue By Branch
        if (revenueRes.data?.data?.branches) {
          setRevenueData(revenueRes.data.data.branches); 
        }

        // 3. Delivery Performance
        if (deliveryRes.data?.data?.statuses) {
          setDeliveryData(deliveryRes.data.data.statuses);
        }

        // 4. Top Products
        if (productsRes.data?.data) {
          setTopProducts(productsRes.data.data);
        }

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

  // --- LOGIC XỬ LÝ BIỂU ĐỒ (Sử dụng useMemo để tối ưu) ---
  
  const { pieChartData, successfulRate } = useMemo(() => {
    const COLORS = {
        primary: '#4f46e5',   // Indigo (Giao cho kho, Xử lý)
        success: '#10b981',   // Green (Hoàn thành, Giao xong)
        error: '#f43f5e',     // Red (Hủy, Từ chối)
        warning: '#f59e0b',   // Amber (Chờ xử lý)
        info: '#0ea5e9',      // Sky (Đang giao, Đóng gói)
        secondary: '#8b5cf6'  // Violet (Quản lý duyệt)
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
            'PENDING': 'Chờ xử lý',
            'ASSIGN_ORDER_STORE': 'Gán cửa hàng',
            'MANAGER_ACCEPT': 'QL đã duyệt',
            'FINISHED': 'Hoàn thành',
            'SHIPPING': 'Đang giao',
            'PACKAGED': 'Đã đóng gói',
            'CANCELLED': 'Đã hủy',
            'DELIVERED': 'Giao thành công',
            'MANAGER_REJECT': 'QL Từ chối',
            'PRE_ORDER': 'Đặt trước',
            'PAYMENT': 'Thanh toán',
            'READY_FOR_INVOICE': 'Chờ xuất hóa đơn',
            'MANAGER_EXPORT_ORDER': 'QL xuất kho'
        };
        return map[status] || status;
    };

    // 1. Lọc và Map dữ liệu
    const chartData = deliveryData
        .filter(item => item.count > 0)
        .map(item => ({
            name: formatStatusName(item.status), 
            value: item.count,
            color: getStatusColor(item.status)
        }))
        .sort((a, b) => b.value - a.value);

    // 2. Tính tỷ lệ thành công (FINISHED + DELIVERED)
    const successItems = deliveryData.filter(d => 
        ['FINISHED', 'DELIVERED'].includes(d.status.toUpperCase())
    );
    const rate = successItems.reduce((acc, curr) => acc + curr.percentage, 0).toFixed(1);

    return { pieChartData: chartData, successfulRate: rate };
  }, [deliveryData]);

  return (
    <div className="min-h-screen bg-gray-50/50 p-4 md:p-6 lg:p-8 font-sans text-slate-900">
      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Tổng quan quản trị</h1>
          <p className="text-gray-500 mt-1 text-sm">Số liệu kinh doanh thời gian thực.</p>
        </div>
        <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-md transition-colors flex items-center gap-2 w-fit">
            <Inventory2 fontSize="small" />
            Xuất báo cáo
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6">
        <StatCard
          title="Tổng Doanh Thu"
          value={stats ? formatCurrency(stats.totalRevenue) : '0 ₫'}
          icon={<AttachMoney />}
          iconBgColor="bg-gradient-to-br from-indigo-500 to-indigo-600"
          iconColor="text-white"
          loading={loading}
        />
        <StatCard
          title="Tổng Đơn Hàng"
          value={stats ? stats.totalOrders.toLocaleString() : '0'}
          icon={<ShoppingCart />}
          iconBgColor="bg-gradient-to-br from-sky-400 to-sky-600"
          iconColor="text-white"
          loading={loading}
        />
        <StatCard
          title="Chi Nhánh Active"
          value={stats ? `${stats.totalActiveStores}` : '0'}
          icon={<Store />}
          iconBgColor="bg-gradient-to-br from-amber-400 to-amber-600"
          iconColor="text-white"
          loading={loading}
        />
        <StatCard
          title="Người Dùng"
          value={stats ? `${stats.totalUsers}` : '0'}
          icon={<PersonAdd />}
          iconBgColor="bg-gradient-to-br from-emerald-400 to-emerald-600"
          iconColor="text-white"
          loading={loading}
        />
      </div>

      {/* Chart Section - Revenue By Branch */}
      <div className="mb-6 bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <BarChartIcon fontSize="small" className="text-indigo-500" />
                Doanh Thu Chi Nhánh
            </h2>
          </div>
          <div className="h-[350px] w-full"> 
            {loading ? <div className="h-full w-full bg-gray-100 animate-pulse rounded-lg"></div> : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="branchName" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 11 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 11 }} tickFormatter={(val) => new Intl.NumberFormat('en', { notation: "compact" }).format(val)} />
                  <Tooltip cursor={{ fill: '#f9fafb' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} formatter={(val: number) => formatCurrency(val)} />
                  <Bar dataKey="revenue" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={40} name="Doanh thu" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Delivery Performance Pie Chart */}
        <div className="lg:col-span-5 bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col h-[400px]">
          <h2 className="text-lg font-bold text-gray-800 mb-2">Hiệu Quả Giao Hàng</h2>
          <div className="flex-1 relative">
            {!loading && pieChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                    <Pie 
                        data={pieChartData} 
                        cx="50%" 
                        cy="50%" 
                        innerRadius={60} 
                        outerRadius={80} 
                        paddingAngle={5} 
                        dataKey="value" 
                        stroke="none"
                    >
                        {pieChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => [value, 'Đơn hàng']} />
                    <Legend 
                        verticalAlign="bottom" 
                        height={36} 
                        iconType="circle"
                        formatter={(value) => <span className="text-xs font-medium text-gray-600 ml-1">{value}</span>}
                    />
                    </PieChart>
                </ResponsiveContainer>
            ) : !loading ? (
                <div className="flex h-full items-center justify-center flex-col gap-2">
                    <Inventory2 className="text-gray-300" fontSize="large" />
                    <span className="text-gray-400 text-sm">Chưa có dữ liệu giao hàng</span>
                </div>
            ) : (
                <div className="h-full w-full bg-gray-100 animate-pulse rounded-full opacity-20"></div>
            )}
            
            {/* Center Text for Success Rate */}
             {!loading && pieChartData.length > 0 && (
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
                    <span className="text-3xl font-black text-gray-800">{successfulRate}%</span>
                    <span className="text-[10px] text-gray-500 font-bold uppercase">Thành công</span>
                </div>
             )}
          </div>
        </div>

        {/* Top Products */}
        <div className="lg:col-span-7 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-[400px]">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center">
                <h2 className="text-lg font-bold text-gray-800">Top Sản Phẩm</h2>
                <span className="text-xs text-indigo-600 font-bold cursor-pointer hover:underline">Xem tất cả</span>
            </div>
            <div className="flex-1 overflow-auto p-0 scrollbar-thin scrollbar-thumb-gray-200">
                <ul className="divide-y divide-gray-50">
                    {!loading && topProducts.map((product, index) => (
                        <li key={product.productColorId || index} className="group hover:bg-gray-50 p-4 flex items-center gap-3 transition-colors">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${index < 3 ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-500'}`}>
                                #{index + 1}
                            </div>
                            <img 
                                src={(product as any).image || `https://placehold.co/100x100/e2e8f0/64748b?text=${product.productName.charAt(0)}`} 
                                alt={product.productName} 
                                className="w-10 h-10 rounded-lg object-cover border border-gray-200" 
                                onError={(e) => {
                                    (e.target as HTMLImageElement).src = `https://placehold.co/100x100/e2e8f0/64748b?text=${product.productName.charAt(0)}`;
                                }}
                            />
                            <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-semibold text-gray-900 truncate" title={product.productName}>
                                    {product.productName}
                                </h4>
                                <p className="text-xs text-gray-500">
                                    Màu: {product.colorName} • Đã bán: <span className="font-medium text-gray-700">{product.totalQuantitySold}</span>
                                </p>
                            </div>
                            <div className="font-bold text-indigo-600 text-xs whitespace-nowrap bg-indigo-50 px-2 py-1 rounded">
                                {formatCurrency(product.totalRevenue)}
                            </div>
                        </li>
                    ))}
                    {!loading && topProducts.length === 0 && (
                        <div className="h-full flex items-center justify-center text-gray-500 text-sm flex-col gap-2">
                             <Inventory2 className="text-gray-300" />
                             <span>Chưa có dữ liệu sản phẩm</span>
                        </div>
                    )}
                </ul>
            </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;