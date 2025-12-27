/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import {
  adminTransactionService,
  type PaymentTransaction,
  type AdminWalletTransaction,
} from "@/service/adminTransactionService";
import {
  Loader2,
  CreditCard,
  Wallet,
  AlertCircle,
  Search,
} from "lucide-react";
import CustomDropdown from "@/components/CustomDropdown";

type TabType = "payments" | "wallets";

export default function AdminTransactionsPage() {
  const [activeTab, setActiveTab] = useState<TabType>("payments");
  const [paymentTransactions, setPaymentTransactions] = useState<PaymentTransaction[]>([]);
  const [walletTransactions, setWalletTransactions] = useState<AdminWalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [methodFilter, setMethodFilter] = useState("");

  // Load both APIs on mount
  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      setError("");
      
      // Load both APIs in parallel
      const [paymentsRes, walletsRes] = await Promise.all([
        adminTransactionService.getAllPayments(),
        adminTransactionService.getAllWalletTransactions(),
      ]);
      
      setPaymentTransactions(paymentsRes.data.data);
      setWalletTransactions(walletsRes.data.data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Không thể tải dữ liệu giao dịch");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("vi-VN");
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { bg: string; text: string; label: string }> = {
      PAID: { bg: "bg-green-100", text: "text-green-700", label: "Đã thanh toán" },
      PENDING: { bg: "bg-yellow-100", text: "text-yellow-700", label: "Đang chờ" },
      DEPOSITED: { bg: "bg-blue-100", text: "text-blue-700", label: "Đã đặt cọc" },
      COMPLETED: { bg: "bg-green-100", text: "text-green-700", label: "Hoàn thành" },
      SUCCESS: { bg: "bg-green-100", text: "text-green-700", label: "Thành công" },
      FAILED: { bg: "bg-red-100", text: "text-red-700", label: "Thất bại" },
      CANCELLED: { bg: "bg-gray-100", text: "text-gray-700", label: "Đã hủy" },
    };
    const config = statusMap[status] || { bg: "bg-gray-100", text: "text-gray-700", label: status };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  const getMethodBadge = (method: string) => {
    const methodMap: Record<string, { bg: string; text: string; label: string }> = {
      VNPAY: { bg: "bg-blue-100", text: "text-blue-700", label: "VNPay" },
      COD: { bg: "bg-orange-100", text: "text-orange-700", label: "COD" },
      CASH: { bg: "bg-green-100", text: "text-green-700", label: "Tiền mặt" },
    };
    const config = methodMap[method] || { bg: "bg-gray-100", text: "text-gray-700", label: method };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  const getTypeBadge = (type: string) => {
    const typeMap: Record<string, { bg: string; text: string; label: string }> = {
      DEPOSIT: { bg: "bg-green-100", text: "text-green-700", label: "Nạp tiền" },
      WITHDRAW: { bg: "bg-red-100", text: "text-red-700", label: "Rút tiền" },
      TRANSFER: { bg: "bg-blue-100", text: "text-blue-700", label: "Chuyển khoản" },
      PAYMENT: { bg: "bg-purple-100", text: "text-purple-700", label: "Thanh toán" },
      REFUND: { bg: "bg-yellow-100", text: "text-yellow-700", label: "Hoàn tiền" },
    };
    const config = typeMap[type] || { bg: "bg-gray-100", text: "text-gray-700", label: type };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  // Filter payment transactions
  const filteredPayments = paymentTransactions.filter((tx) => {
    const matchSearch = 
      tx.transactionCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = !statusFilter || tx.paymentStatus === statusFilter;
    const matchMethod = !methodFilter || tx.paymentMethod === methodFilter;
    return matchSearch && matchStatus && matchMethod;
  });

  // Filter wallet transactions
  const filteredWallets = walletTransactions.filter((tx) => {
    const matchSearch = 
      tx.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.walletCode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = !statusFilter || tx.status === statusFilter;
    const matchMethod = !methodFilter || tx.type === methodFilter;
    return matchSearch && matchStatus && matchMethod;
  });

  if (loading && (paymentTransactions.length === 0 && walletTransactions.length === 0)) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-6 pb-10 px-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-600 rounded-full text-white">
              <CreditCard size={24} />
            </div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Quản lý giao dịch</h1>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Tổng giao dịch</p>
            <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">
              {activeTab === "payments" ? filteredPayments.length : filteredWallets.length}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Tổng giá trị</p>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {formatCurrency(
                activeTab === "payments"
                  ? filteredPayments.reduce((sum, tx) => sum + tx.total, 0)
                  : filteredWallets.reduce((sum, tx) => sum + tx.amount, 0)
              )}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Thành công</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {activeTab === "payments"
                ? filteredPayments.filter((tx) => tx.paymentStatus === "PAID").length
                : filteredWallets.filter((tx) => tx.status === "COMPLETED" || tx.status === "SUCCESS").length}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-2 flex gap-2">
          <button
            onClick={() => setActiveTab("payments")}
            className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
              activeTab === "payments"
                ? "bg-emerald-600 text-white shadow-md"
                : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            }`}
          >
            <CreditCard size={18} />
            Giao dịch thanh toán ({paymentTransactions.length})
          </button>
          <button
            onClick={() => setActiveTab("wallets")}
            className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
              activeTab === "wallets"
                ? "bg-emerald-600 text-white shadow-md"
                : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            }`}
          >
            <Wallet size={18} />
            Giao dịch ví ({walletTransactions.length})
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Search */}
            <div className="flex flex-col gap-1 w-full">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                Tìm kiếm
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none z-10" size={18} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Nhập mã GD, tên, email..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm transition-all hover:border-emerald-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <CustomDropdown
                id="status-filter"
                label="Trạng thái"
                value={statusFilter}
                onChange={setStatusFilter}
                options={
                  activeTab === "payments"
                    ? [
                        { value: "", label: "Tất cả trạng thái" },
                        { value: "PAID", label: "Đã thanh toán" },
                        { value: "PENDING", label: "Đang chờ" },
                        { value: "DEPOSITED", label: "Đã đặt cọc" },
                        { value: "FAILED", label: "Thất bại" },
                        { value: "CANCELLED", label: "Đã hủy" },
                      ]
                    : [
                        { value: "", label: "Tất cả trạng thái" },
                        { value: "COMPLETED", label: "Hoàn thành" },
                        { value: "SUCCESS", label: "Thành công" },
                        { value: "PENDING", label: "Đang chờ" },
                        { value: "FAILED", label: "Thất bại" },
                        { value: "CANCELLED", label: "Đã hủy" },
                      ]
                }
                placeholder="Chọn trạng thái"
                fullWidth
              />
            </div>

            {/* Method/Type Filter */}
            <div>
              <CustomDropdown
                id="method-filter"
                label={activeTab === "payments" ? "Phương thức" : "Loại GD"}
                value={methodFilter}
                onChange={setMethodFilter}
                options={
                  activeTab === "payments"
                    ? [
                        { value: "", label: "Tất cả phương thức" },
                        { value: "VNPAY", label: "VNPay" },
                        { value: "COD", label: "COD" },
                        { value: "CASH", label: "Tiền mặt" },
                      ]
                    : [
                        { value: "", label: "Tất cả loại GD" },
                        { value: "DEPOSIT", label: "Nạp tiền" },
                        { value: "WITHDRAW", label: "Rút tiền" },
                        { value: "TRANSFER", label: "Chuyển khoản" },
                        { value: "PAYMENT", label: "Thanh toán" },
                        { value: "REFUND", label: "Hoàn tiền" },
                      ]
                }
                placeholder={activeTab === "payments" ? "Chọn phương thức" : "Chọn loại GD"}
                fullWidth
              />
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-center gap-3 text-red-700 dark:text-red-400">
            <AlertCircle size={20} />
            {error}
          </div>
        )}

        {/* Transactions Table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            {activeTab === "payments" ? (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-medium">
                  <tr>
                    <th className="px-5 py-3 text-left">Mã GD</th>
                    <th className="px-5 py-3 text-left">Thời gian</th>
                    <th className="px-5 py-3 text-left">Khách hàng</th>
                    <th className="px-5 py-3 text-left">Email</th>
                    <th className="px-5 py-3 text-right">Số tiền</th>
                    <th className="px-5 py-3 text-center">Phương thức</th>
                    <th className="px-5 py-3 text-center">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {filteredPayments.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-5 py-8 text-center text-gray-400 dark:text-gray-500">
                        Không có giao dịch nào
                      </td>
                    </tr>
                  ) : (
                    filteredPayments.map((tx) => (
                      <tr key={tx.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-colors">
                        <td className="px-5 py-3 font-mono text-xs text-gray-700 dark:text-gray-300">
                          {tx.transactionCode}
                        </td>
                        <td className="px-5 py-3 text-gray-500 whitespace-nowrap">
                          {formatDate(tx.date)}
                        </td>
                        <td className="px-5 py-3 font-medium text-gray-800">
                          {tx.userName}
                        </td>
                        <td className="px-5 py-3 text-gray-600 dark:text-gray-400">
                          {tx.email}
                        </td>
                        <td className="px-5 py-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(tx.total)}
                        </td>
                        <td className="px-5 py-3 text-center">
                          {getMethodBadge(tx.paymentMethod)}
                        </td>
                        <td className="px-5 py-3 text-center">
                          {getStatusBadge(tx.paymentStatus)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-600 font-medium">
                  <tr>
                    <th className="px-5 py-3 text-left">Mã GD</th>
                    <th className="px-5 py-3 text-left">Mã ví</th>
                    <th className="px-5 py-3 text-left">Thời gian</th>
                    <th className="px-5 py-3 text-left">Khách hàng</th>
                    <th className="px-5 py-3 text-left">Loại</th>
                    <th className="px-5 py-3 text-right">Số tiền</th>
                    <th className="px-5 py-3 text-right">Số dư sau</th>
                    <th className="px-5 py-3 text-center">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {filteredWallets.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-5 py-8 text-center text-gray-400 dark:text-gray-500">
                        Không có giao dịch nào
                      </td>
                    </tr>
                  ) : (
                    filteredWallets.map((tx) => (
                      <tr key={tx.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-colors">
                        <td className="px-5 py-3 font-mono text-xs text-gray-700 dark:text-gray-300">
                          {tx.code}
                        </td>
                        <td className="px-5 py-3 font-mono text-xs text-gray-600 dark:text-gray-400">
                          {tx.walletCode}
                        </td>
                        <td className="px-5 py-3 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                          {formatDate(tx.createdAt)}
                        </td>
                        <td className="px-5 py-3 font-medium text-gray-800 dark:text-gray-200">
                          {tx.userName}
                        </td>
                        <td className="px-5 py-3">
                          {getTypeBadge(tx.type)}
                        </td>
                        <td className={`px-5 py-3 text-right font-bold ${
                          ["DEPOSIT", "REFUND"].includes(tx.type) ? "text-green-600" : "text-red-600"
                        }`}>
                          {["DEPOSIT", "REFUND"].includes(tx.type) ? "+" : "-"}
                          {formatCurrency(tx.amount)}
                        </td>
                        <td className="px-5 py-3 text-right text-gray-600 dark:text-gray-400">
                          {formatCurrency(tx.balanceAfter)}
                        </td>
                        <td className="px-5 py-3 text-center">
                          {getStatusBadge(tx.status)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
