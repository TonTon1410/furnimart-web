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

import type {
    BranchDailyStats,
    ActivityTrendData,
    OrderStatusData,
    ProductSummary
} from '../data/dashboard.types';
import { ManagerApi } from '../data/mockManagerApi';

// --- COMPONENTS CON ---

const CardSkeleton = () => (
  <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 animate-pulse h-full">
    <div className="flex justify-between items-start">
      <div className="w-full">
        <div className="h-3 bg-gray-200 rounded w-1/2 mb-3"></div>
        <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
      </div>
      <div className="w-10 h-10 bg-gray-200 rounded-xl"></div>
    </div>
  </div>
);

// OpsCard đã tối ưu kích thước
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
    <div className={`relative bg-white p-5 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border transition-all duration-300 transform hover:-translate-y-1 h-full overflow-hidden group
      ${isAlert ? 'border-rose-200 ring-2 ring-rose-50' : 'border-gray-100 hover:shadow-lg'}
    `}>
      <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-10 group-hover:scale-150 transition-transform duration-500 ${iconBgColor}`}></div>

      <div className="flex justify-between items-start relative z-10 gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-gray-500 text-xs font-bold mb-1 tracking-wider uppercase truncate">{title}</p>
          
          <h3 className={`text-xl md:text-2xl font-bold tracking-tight truncate ${isAlert ? 'text-rose-600' : 'text-gray-800'}`} title={String(value)}>
            {value}
          </h3>
          
          {/* Badge Alert nhỏ gọn hơn */}
          <div className="mt-2 h-6 flex items-center"> 
            {isAlert ? (
                <div className="inline-flex items-center px-2 py-0.5 rounded text-[10px] md:text-xs font-bold bg-rose-100 text-rose-700 animate-pulse whitespace-nowrap">
                <WarningAmber style={{ fontSize: 14, marginRight: 4 }} />
                Cần xử lý
                </div>
            ) : (
                <span className="text-transparent text-xs select-none">.</span> // Giữ chỗ để các card cao bằng nhau
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
  // ... (Giữ nguyên State và useEffect)
  const [loading, setLoading] = useState(true);
  const [dailyStats, setDailyStats] = useState<BranchDailyStats | null>(null);
  const [trendData, setTrendData] = useState<ActivityTrendData[]>([]);
  const [statusData, setStatusData] = useState<OrderStatusData[]>([]);
  const [localProducts, setLocalProducts] = useState<ProductSummary[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [statsRes, trendRes, statusRes, productsRes] = await Promise.all([
          ManagerApi.getDailyStats(),
          ManagerApi.getActivityTrend(),
          ManagerApi.getOrderStatusBreakdown(),
          ManagerApi.getLocalTopProducts()
        ]);
        setDailyStats(statsRes);
        setTrendData(trendRes);
        setStatusData(statusRes);
        setLocalProducts(productsRes);
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
    primary: '#4f46e5', secondary: '#8b5cf6', success: '#10b981', warning: '#f59e0b', error: '#f43f5e', slate: '#64748b'
  };

  const totalOrders = statusData.reduce((acc, curr) => acc + curr.count, 0);

  return (
    <div className="min-h-screen bg-gray-50/50 p-4 md:p-6 lg:p-8 font-sans text-slate-900">
      
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">Quản Lý Chi Nhánh</h1>
        <p className="text-gray-500 mt-1 text-sm">Tổng quan vận hành hôm nay.</p>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6">
        <OpsCard
          title="Doanh thu"
          value={dailyStats ? formatCurrency(dailyStats.todayRevenue) : '0 ₫'}
          icon={<AttachMoney />}
          iconBgColor="bg-gradient-to-br from-indigo-500 to-indigo-600"
          iconColor="text-white"
          loading={loading}
        />
        <OpsCard
          title="Đơn Chờ Duyệt"
          value={dailyStats?.pendingOrders || 0}
          icon={<Assignment />}
          iconBgColor="bg-gradient-to-br from-amber-400 to-amber-600"
          iconColor="text-white"
          loading={loading}
          isAlert={Boolean(dailyStats?.pendingOrders && dailyStats.pendingOrders > 5)}
        />
        <OpsCard
          title="Đang Giao Hàng"
          value={dailyStats?.shippingOrders || 0}
          icon={<LocalShipping />}
          iconBgColor="bg-gradient-to-br from-emerald-400 to-emerald-600"
          iconColor="text-white"
          loading={loading}
        />
        <OpsCard
          title="Sắp Hết Hàng"
          value={dailyStats?.lowStockItems || 0}
          icon={<WarningAmber />}
          iconBgColor="bg-gradient-to-br from-rose-400 to-rose-600"
          iconColor="text-white"
          loading={loading}
          isAlert={Boolean(dailyStats?.lowStockItems && dailyStats.lowStockItems > 0)}
        />
      </div>

      {/* Main Chart */}
      <div className="mb-6 bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <TrendingUp fontSize="small" className="text-indigo-500"/>
            Xu hướng hoạt động
          </h2>
          <button className="p-1 hover:bg-gray-50 rounded-full text-gray-400">
            <MoreVert fontSize="small" />
          </button>
        </div>

        <div className="h-[350px] w-full">
          {loading ? (
            <div className="h-full w-full bg-gray-100 rounded-lg animate-pulse"></div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 11 }} dy={10} />
                <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 11 }} tickFormatter={(val) => new Intl.NumberFormat('en', { notation: "compact" }).format(val)} />
                <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 11 }} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} formatter={(value: number, name: string) => [name === 'revenue' ? formatCurrency(value) : value, name === 'revenue' ? 'Doanh thu' : 'Số đơn']} />
                <Legend iconType="circle" />
                <Line yAxisId="left" type="monotone" dataKey="revenue" name="Doanh thu" stroke={COLORS.primary} strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
                <Line yAxisId="right" type="monotone" dataKey="orders" name="Số đơn hàng" stroke={COLORS.secondary} strokeWidth={2} strokeDasharray="5 5" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col h-[400px]">
            <h2 className="text-lg font-bold text-gray-800 mb-2">Trạng thái đơn</h2>
            <div className="flex-1 relative">
                {!loading && (
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie data={statusData as any} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="count" stroke="none">
                                {statusData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                            </Pie>
                            <Tooltip contentStyle={{ borderRadius: '8px' }}/>
                            <Legend verticalAlign="bottom" height={36} iconType="circle"/>
                        </PieChart>
                    </ResponsiveContainer>
                )}
                {!loading && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
                        <span className="text-3xl font-black text-gray-800">{totalOrders}</span>
                        <span className="text-[10px] text-gray-500 font-bold uppercase">Tổng đơn</span>
                    </div>
                )}
            </div>
        </div>

        <div className="lg:col-span-7 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-[400px]">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center">
                <h2 className="text-lg font-bold text-gray-800">Top Kho</h2>
                <Inventory2 className="text-gray-300" fontSize="small"/>
            </div>
            <div className="flex-1 overflow-auto p-0">
                <ul className="divide-y divide-gray-50">
                    {!loading && localProducts.map((product) => {
                        const isLowStock = (product.stock || 0) < 3;
                        const stockPercent = Math.min(((product.stock || 0) / 20) * 100, 100);
                        return (
                            <li key={product.id} className="p-4 hover:bg-gray-50 transition-colors flex items-center gap-3">
                                <img src={product.thumbnail} alt="" className="w-10 h-10 rounded-lg object-cover border border-gray-200" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-gray-800 truncate">{product.name}</p>
                                    <p className="text-xs text-gray-500">Đã bán: {product.sold}</p>
                                </div>
                                <div className="w-24 text-right">
                                    <div className="flex items-center justify-end gap-1 mb-1">
                                        <span className={`text-[10px] font-bold ${isLowStock ? 'text-rose-600' : 'text-gray-700'}`}>
                                            Kho: {product.stock}
                                        </span>
                                        {isLowStock && <WarningAmber style={{ fontSize: 12 }} className="text-rose-500" />}
                                    </div>
                                    <div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden">
                                        <div className={`h-full rounded-full ${isLowStock ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{ width: `${stockPercent}%` }}></div>
                                    </div>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboard;