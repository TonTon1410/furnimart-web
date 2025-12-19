import React, { useEffect, useState } from 'react';
import {
  ReceiptLong,    // Icon đơn hàng
  Chat,           // Icon chat
  CheckCircle,    // Icon hoàn thành
  Inventory,      // Icon kho
  AccessTime,
  AttachMoney,
  MoreHoriz
} from '@mui/icons-material';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

import type {
    StaffWorkStats,
    StaffWorkloadData,
    RecentOrderLite,
    RecentMessage
} from '../data/dashboard.types';
import { StaffApi } from '../data/mockStaffApi';

// --- COMPONENTS CON (TaskCard - Biến thể nhỏ gọn hơn cho Staff) ---

const CardSkeleton = () => (
  <div className="bg-white dark:bg-gray-800! p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700! animate-pulse h-full">
    <div className="flex justify-between items-center">
      <div className="w-full">
        <div className="h-4 bg-gray-200 dark:bg-gray-700! rounded w-1/2 mb-2"></div>
        <div className="h-8 bg-gray-200 dark:bg-gray-700! rounded w-1/3"></div>
      </div>
      <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700! rounded-full"></div>
    </div>
  </div>
);

// --- CUSTOM TOOLTIP (Đồng bộ với Admin/Manager) ---
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800! p-3 border border-gray-100 dark:border-gray-700! rounded-lg shadow-lg">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400! mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.stroke || entry.fill }} />
              <span className="text-gray-600 dark:text-gray-300!">{entry.name}:</span>
              <span className="font-bold text-gray-900 dark:text-gray-100!">
                {entry.value}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
};

interface TaskCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  colorClass: string; // Tailwind class cho text & icon (vd: text-indigo-600)
  bgClass: string;    // Tailwind class cho background icon (vd: bg-indigo-50)
  loading?: boolean;
  actionLabel?: string;
}

const TaskCard: React.FC<TaskCardProps> = ({ title, value, icon, colorClass, bgClass, loading, actionLabel }) => {
  if (loading) return <CardSkeleton />;

  return (
    <div className="bg-white dark:bg-gray-800! p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700! hover:shadow-md dark:hover:shadow-gray-900/50! transition-all duration-300 flex items-center justify-between group">
      <div>
        <p className="text-gray-500 dark:text-gray-400! text-sm font-medium mb-1">{title}</p>
        <h3 className={`text-3xl font-bold tracking-tight ${colorClass}`}>
          {value}
        </h3>
        {actionLabel && (
           <span className="text-xs font-semibold text-gray-400 dark:text-gray-500! mt-1 inline-block group-hover:text-gray-600 dark:group-hover:text-gray-300! transition-colors cursor-pointer">
             {actionLabel} &rarr;
           </span>
        )}
      </div>
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl ${bgClass} ${colorClass} group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
    </div>
  );
};

// --- MAIN COMPONENT (STAFF) ---
const StaffDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<StaffWorkStats | null>(null);
  const [workload, setWorkload] = useState<StaffWorkloadData[]>([]);
  const [orders, setOrders] = useState<RecentOrderLite[]>([]);
  const [messages, setMessages] = useState<RecentMessage[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [statsRes, workloadRes, ordersRes, msgRes] = await Promise.all([
          StaffApi.getWorkStats(),
          StaffApi.getDailyWorkload(),
          StaffApi.getRecentPendingOrders(),
          StaffApi.getRecentMessages()
        ]);
        setStats(statsRes);
        setWorkload(workloadRes);
        setOrders(ordersRes);
        setMessages(msgRes);
      } catch (error) {
        console.error("Failed to load staff dashboard", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value);

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-gray-900! p-4 md:p-6 lg:p-8 font-sans text-slate-900 dark:text-slate-100!">
      
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white! tracking-tight">Bàn Làm Việc</h1>
          <p className="text-gray-500 dark:text-gray-400! mt-1 text-sm">Xin chào, chúc bạn một ca làm việc hiệu quả.</p>
        </div>
        <div className="flex items-center gap-3 bg-white dark:bg-gray-800! px-4 py-2 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700!">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300!">Cửa hàng đang mở cửa</span>
        </div>
      </div>

      {/* 1. Task Overview Cards - Tập trung vào việc cần làm */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <TaskCard 
            title="Đơn Chờ Xác Nhận" 
            value={stats?.pendingOrders || 0} 
            icon={<ReceiptLong fontSize="inherit"/>}
            colorClass="text-amber-600 dark:!text-amber-400"
            bgClass="bg-amber-100 dark:!bg-amber-900/30"
            loading={loading}
            actionLabel="Xử lý ngay"
        />
        <TaskCard 
            title="Tin Nhắn Mới" 
            value={stats?.unreadMessages || 0} 
            icon={<Chat fontSize="inherit"/>}
            colorClass="text-indigo-600 dark:!text-indigo-400"
            bgClass="bg-indigo-100 dark:!bg-indigo-900/30"
            loading={loading}
            actionLabel="Trả lời khách"
        />
        <TaskCard 
            title="Đã Xử Lý Hôm Nay" 
            value={stats?.processedToday || 0} 
            icon={<CheckCircle fontSize="inherit"/>}
            colorClass="text-emerald-600 dark:!text-emerald-400"
            bgClass="bg-emerald-100 dark:!bg-emerald-900/30"
            loading={loading}
        />
        <TaskCard 
            title="Cảnh Báo Tồn Kho" 
            value={stats?.lowStockAlerts || 0} 
            icon={<Inventory fontSize="inherit"/>}
            colorClass="text-rose-600 dark:!text-rose-400"
            bgClass="bg-rose-100 dark:!bg-rose-900/30"
            loading={loading}
            actionLabel="Kiểm tra"
        />
      </div>

      {/* 2. Middle Section: Chart & Pending Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        
        {/* Workload Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800! p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700!">
            <h2 className="text-lg font-bold text-gray-800 dark:text-white! mb-4 flex items-center gap-2">
                <AccessTime fontSize="small" className="text-gray-400"/>
                Hiệu suất làm việc (Hôm nay)
            </h2>
            <div className="h-[300px] w-full">
                {loading ? <div className="h-full bg-gray-100 dark:bg-gray-700! rounded animate-pulse"></div> : (
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={workload} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.1}/>
                                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                                </linearGradient>
                                <linearGradient id="colorMsgs" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
                                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" className="dark:stroke-gray-700 dark:opacity-20"/>
                            <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
                            <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
                            
                            <Tooltip content={<CustomTooltip />} />
                            
                            <Legend iconType="circle" formatter={(val) => <span className="text-gray-600 dark:text-gray-300!">{val}</span>}/>
                            <Area type="monotone" dataKey="ordersProcessed" name="Đơn đã xử lý" stroke="#f59e0b" fillOpacity={1} fill="url(#colorOrders)" strokeWidth={2}/>
                            <Area type="monotone" dataKey="messagesReplied" name="Tin nhắn đã trả lời" stroke="#4f46e5" fillOpacity={1} fill="url(#colorMsgs)" strokeWidth={2}/>
                        </AreaChart>
                    </ResponsiveContainer>
                )}
            </div>
        </div>

        {/* Recent Pending Orders List */}
        <div className="bg-white dark:bg-gray-800! p-0 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700! overflow-hidden flex flex-col h-[380px]">
            <div className="p-5 border-b border-gray-100 dark:border-gray-700! flex justify-between items-center bg-amber-50/50 dark:bg-amber-900/10!">
                <h2 className="text-lg font-bold text-gray-800 dark:text-white!">Cần Duyệt Gấp</h2>
                <span className="bg-amber-100 dark:bg-amber-900/40! text-amber-700 dark:text-amber-400! text-xs font-bold px-2 py-1 rounded-md">{stats?.pendingOrders} đơn</span>
            </div>
            <div className="flex-1 overflow-auto scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-700">
                <ul className="divide-y divide-gray-50 dark:divide-gray-700!">
                    {!loading && orders.map(order => (
                        <li key={order.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50! transition-colors cursor-pointer group">
                            <div className="flex justify-between items-start mb-1">
                                <span className="text-xs font-bold text-gray-400 dark:text-gray-500!">{order.id}</span>
                                <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500!">{order.time}</span>
                            </div>
                            <div className="flex justify-between items-center mb-2">
                                <h4 className="text-sm font-semibold text-gray-800 dark:text-white!">{order.customerName}</h4>
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full 
                                    ${order.status === 'PENDING' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40! dark:text-amber-400!' : 'bg-gray-100 text-gray-600 dark:bg-gray-700! dark:text-gray-400!'}`}>
                                    {order.status}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <div className="flex items-center text-indigo-600 dark:text-indigo-400! font-bold text-sm">
                                    <AttachMoney style={{fontSize: 16}}/>
                                    {formatCurrency(order.total)}
                                </div>
                                <button className="opacity-0 group-hover:opacity-100 transition-opacity bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-3 py-1.5 rounded-lg shadow font-medium">
                                    Xử lý
                                </button>
                            </div>
                        </li>
                    ))}
                    {!loading && orders.length === 0 && (
                        <li className="p-8 text-center text-gray-400 dark:text-gray-500! text-sm">
                            Không có đơn hàng mới
                        </li>
                    )}
                </ul>
            </div>
        </div>
      </div>

      {/* 3. Bottom Section: Messages */}
      <div className="bg-white dark:bg-gray-800! rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700! overflow-hidden">
          <div className="p-5 border-b border-gray-100 dark:border-gray-700! flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-800 dark:text-white! flex items-center gap-2">
                  <Chat fontSize="small" className="text-indigo-500"/>
                  Hỗ Trợ Khách Hàng Gần Đây
              </h2>
              <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300!"><MoreHoriz /></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-100 dark:divide-gray-700!">
              {!loading && messages.map((msg) => (
                  <div key={msg.id} className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50! transition-colors cursor-pointer flex gap-4 ${msg.isUnread ? 'bg-indigo-50/30 dark:bg-indigo-900/20!' : ''}`}>
                      <img src={msg.avatar} alt="" className="w-10 h-10 rounded-full border border-gray-200 dark:border-gray-600!" />
                      <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start mb-1">
                              <h4 className={`text-sm ${msg.isUnread ? 'font-bold text-gray-900 dark:text-white!' : 'font-medium text-gray-700 dark:text-gray-300!'}`}>
                                  {msg.customerName}
                              </h4>
                              <span className="text-[10px] text-gray-400 dark:text-gray-500!">{msg.time}</span>
                          </div>
                          <p className={`text-xs truncate ${msg.isUnread ? 'text-indigo-600 dark:text-indigo-400! font-medium' : 'text-gray-500 dark:text-gray-400!'}`}>
                              {msg.preview}
                          </p>
                      </div>
                      {msg.isUnread && <div className="w-2 h-2 bg-indigo-500 rounded-full mt-2"></div>}
                  </div>
              ))}
          </div>
      </div>
    </div>
  );
};

export default StaffDashboard;