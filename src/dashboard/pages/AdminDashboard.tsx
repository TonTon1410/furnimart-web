import React, { useEffect, useState } from 'react';
import {
  AttachMoney,
  ShoppingCart,
  Store,
  PersonAdd,
  ArrowUpward,
  ArrowDownward,
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

import type {
    AdminOverviewStats,
    BranchRevenueData,
    DeliveryPerformance,
    ProductSummary
} from '../data/dashboard.types';
import { AdminApi } from '../data/mockAdminApi';

// --- COMPONENTS CON ---

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
  trend?: number;
  iconBgColor: string;
  iconColor: string;
  loading?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, trend, iconBgColor, iconColor, loading }) => {
  if (loading) return <StatCardSkeleton />;

  return (
    <div className="bg-white p-5 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-100 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 h-full relative overflow-hidden group">
      {/* Background decoration */}
      <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-10 group-hover:scale-150 transition-transform duration-500 ${iconBgColor}`}></div>
      
      {/* Flex container với min-w-0 để ngăn overflow */}
      <div className="flex justify-between items-start relative z-10 gap-3">
        <div className="flex-1 min-w-0"> {/* min-w-0 là quan trọng nhất để text chịu truncate */}
          <p className="text-gray-500 text-xs font-bold mb-1 tracking-wider uppercase truncate">{title}</p>
          
          {/* Responsive Text: text-xl trên mobile, text-2xl trên màn hình lớn. Không dùng text-3xl nữa */}
          <h3 className="text-xl md:text-2xl font-bold text-gray-800 tracking-tight truncate" title={String(value)}>
            {value}
          </h3>
          
          {trend !== undefined && (
            <div className="flex items-center mt-2 flex-wrap">
              <span className={`flex items-center text-sm font-bold ${trend >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                {trend >= 0 ? <ArrowUpward style={{ fontSize: 16 }} /> : <ArrowDownward style={{ fontSize: 16 }} />}
                <span>{Math.abs(trend)}%</span>
              </span>
              <span className="text-gray-400 text-xs ml-1 whitespace-nowrap">vs tháng trước</span>
            </div>
          )}
        </div>
        
        {/* Icon container giữ nguyên kích thước nhưng flex-shrink-0 để không bị bóp méo */}
        <div className={`flex items-center justify-center w-12 h-12 rounded-xl shadow-md flex-shrink-0 ${iconBgColor} ${iconColor}`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

// --- MAIN COMPONENT (ADMIN) ---
// Phần dưới giữ nguyên logic, chỉ thay đổi StatCard ở trên
const AdminDashboard: React.FC = () => {
  // ... (Giữ nguyên state và useEffect như cũ)
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AdminOverviewStats | null>(null);
  const [revenueData, setRevenueData] = useState<BranchRevenueData[]>([]);
  const [deliveryData, setDeliveryData] = useState<DeliveryPerformance | null>(null);
  const [topProducts, setTopProducts] = useState<ProductSummary[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [statsRes, revenueRes, deliveryRes, productsRes] = await Promise.all([
          AdminApi.getOverviewStats(),
          AdminApi.getRevenueByBranch(),
          AdminApi.getDeliveryPerformance(),
          AdminApi.getGlobalTopProducts()
        ]);
        setStats(statsRes);
        setRevenueData(revenueRes);
        setDeliveryData(deliveryRes);
        setTopProducts(productsRes);
      } catch (error) {
        console.error("Failed", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value);

  const COLORS = {
    primary: '#4f46e5', success: '#10b981', error: '#f43f5e', warning: '#f59e0b',
  };

  const pieChartData = deliveryData ? [
        { name: 'Thành công', value: deliveryData.successful, color: COLORS.success },
        { name: 'Hoàn trả', value: deliveryData.returned, color: COLORS.error },
        { name: 'Trễ hẹn', value: deliveryData.late, color: COLORS.warning },
      ] : [];

  return (
    <div className="min-h-screen bg-gray-50/50 p-4 md:p-6 lg:p-8 font-sans text-slate-900">
      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Tổng quan quản trị</h1>
          <p className="text-gray-500 mt-1 text-sm">Số liệu kinh doanh hôm nay.</p>
        </div>
        <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-md transition-colors flex items-center gap-2 w-fit">
            <Inventory2 fontSize="small" />
            Xuất báo cáo
        </button>
      </div>

      {/* Grid điều chỉnh gap nhỏ hơn trên mobile */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6">
        <StatCard
          title="Tổng Doanh Thu"
          value={stats ? formatCurrency(stats.totalRevenue) : '0 ₫'}
          trend={stats?.growthRate}
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
          title="Chi Nhánh"
          value={stats ? `${stats.activeBranches} Active` : '0'}
          icon={<Store />}
          iconBgColor="bg-gradient-to-br from-amber-400 to-amber-600"
          iconColor="text-white"
          loading={loading}
        />
        <StatCard
          title="Khách Hàng Mới"
          value={stats ? `+${stats.newCustomers}` : '0'}
          icon={<PersonAdd />}
          iconBgColor="bg-gradient-to-br from-emerald-400 to-emerald-600"
          iconColor="text-white"
          loading={loading}
        />
      </div>

      {/* Chart Section */}
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
                  <Bar dataKey="revenue" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col h-[400px]">
          <h2 className="text-lg font-bold text-gray-800 mb-2">Hiệu Quả Giao Hàng</h2>
          <div className="flex-1 relative">
            {!loading && (
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                    <Pie data={pieChartData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                        {pieChartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                    </Pie>
                    <Tooltip />
                    <Legend verticalAlign="bottom" height={36} iconType="circle"/>
                    </PieChart>
                </ResponsiveContainer>
            )}
            {/* Center Text */}
             {!loading && deliveryData && (
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
                    <span className="text-3xl font-black text-gray-800">{deliveryData.successful}%</span>
                    <span className="text-[10px] text-gray-500 font-bold uppercase">Thành công</span>
                </div>
             )}
          </div>
        </div>

        <div className="lg:col-span-7 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-[400px]">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center">
                <h2 className="text-lg font-bold text-gray-800">Top Sản Phẩm</h2>
                <span className="text-xs text-indigo-600 font-bold cursor-pointer">Xem tất cả</span>
            </div>
            <div className="flex-1 overflow-auto p-0">
                <ul className="divide-y divide-gray-50">
                    {!loading && topProducts.map((product, index) => (
                        <li key={product.id} className="group hover:bg-gray-50 p-4 flex items-center gap-3">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${index < 3 ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-500'}`}>
                                #{index + 1}
                            </div>
                            <img src={product.thumbnail} alt="" className="w-10 h-10 rounded-lg object-cover border border-gray-200" />
                            <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-semibold text-gray-900 truncate">{product.name}</h4>
                                <p className="text-xs text-gray-500">Đã bán: {product.sold}</p>
                            </div>
                            <div className="font-bold text-indigo-600 text-xs whitespace-nowrap">
                                {formatCurrency(product.price)}
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;