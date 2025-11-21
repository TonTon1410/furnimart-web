"use client"

import { useEffect, useState } from "react"
import { authService } from "@/service/authService"
import { walletService, type Wallet, type WalletTransaction } from "@/service/walletService"
import { paymentService } from "@/service/paymentService"
import { Loader2, WalletIcon, ArrowUpRight, ArrowDownLeft, History, AlertCircle, Plus } from "lucide-react"

export default function MyWalletPage() {
  const [wallet, setWallet] = useState<Wallet | null>(null)
  const [transactions, setTransactions] = useState<WalletTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [showDeposit, setShowDeposit] = useState(false)
  const [depositAmount, setDepositAmount] = useState("")
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        // 1. Get User Profile to get ID
        const profile = await authService.getProfile()
        if (!profile?.id) throw new Error("Không tìm thấy thông tin người dùng")

        // 2. Get Wallet
        const walletRes = await walletService.getWalletByUserId(profile.id)
        const walletData = walletRes.data.data
        setWallet(walletData)

        // 3. Get Transactions if wallet exists
        if (walletData?.id) {
          fetchTransactions(walletData.id, 0)
        }
      } catch (err: any) {
        console.error(err)
        setError(err.message || "Không thể tải thông tin ví")
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const fetchTransactions = async (walletId: string, pageNo: number) => {
    try {
      const res = await walletService.getTransactions(walletId, pageNo, 5)
      // Assuming response structure based on common Spring Boot pagination
      // If the API returns differently, this might need adjustment.
      // Using 'any' cast for safety if structure varies slightly.
      const data = res.data.data as any

      // Handle both 'content' (Spring Page) or direct array
      const content = Array.isArray(data) ? data : data.content || []
      setTransactions(content)
      setTotalPages(data.totalPages || 0)
      setPage(pageNo)
    } catch (error) {
      console.error("Lỗi tải giao dịch:", error)
    }
  }

  const changePage = (delta: number) => {
    if (wallet?.id) fetchTransactions(wallet.id, page + delta)
  }

  const handleDeposit = async () => {
    if (!wallet || !depositAmount) return
    try {
      const amount = Number(depositAmount)
      if (isNaN(amount) || amount < 10000) return alert("Số tiền tối thiểu là 10,000đ")

      // 1. Create deposit transaction
      const depositRes = await walletService.deposit(wallet.id, amount, "Nạp tiền vào ví qua VNPay")
      const transactionData = depositRes.data.data

      // 2. Create VNPay payment URL using the transaction ID
      // Assuming the deposit response returns the transaction object with an ID
      if (transactionData?.id) {
        const vnpayRes = await paymentService.createVnpay(amount, transactionData.id)
        if (vnpayRes.data) {
          window.location.href = vnpayRes.data
        }
      }
    } catch (error) {
      console.error("Deposit error:", error)
      alert("Có lỗi xảy ra khi tạo giao dịch nạp tiền")
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("vi-VN")
  }

  if (loading)
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#095544]" />
      </div>
    )
  if (error)
    return (
      <div className="flex h-screen items-center justify-center text-red-500 gap-2">
        <AlertCircle /> {error}
      </div>
    )

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-10 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-[#095544] rounded-full text-white">
            <WalletIcon size={24} />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Ví Của Tôi</h1>
        </div>

        {/* Wallet Card */}
        {!wallet ? (
          <div className="bg-white p-8 rounded-2xl shadow-sm text-center">
            <p className="text-gray-500">Bạn chưa có ví. Vui lòng liên hệ quản trị viên.</p>
          </div>
        ) : (
          <>
            <div className="bg-gradient-to-r from-[#095544] to-[#0b6e58] rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <WalletIcon size={120} />
              </div>
              <div className="relative z-10">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-green-100 text-sm font-medium mb-1">Tổng số dư</p>
                    <h2 className="text-4xl font-bold mb-4">{formatCurrency(wallet.balance)}</h2>
                  </div>
                  {/* Deposit Button */}
                  <button
                    onClick={() => setShowDeposit(true)}
                    className="bg-white text-[#095544] px-4 py-2 rounded-lg font-bold shadow-sm hover:bg-green-50 transition-colors flex items-center gap-2"
                  >
                    <Plus size={18} /> Nạp tiền
                  </button>
                </div>
                <div className="flex items-center gap-4 text-sm bg-white/10 w-fit px-3 py-1.5 rounded-lg backdrop-blur-sm">
                  <span className="opacity-80">Mã ví:</span>
                  <span className="font-mono font-semibold tracking-wide">{wallet.code}</span>
                </div>
                <div className="mt-4 flex gap-2">
                  <span
                    className={`px-2 py-1 rounded text-xs font-bold ${wallet.status === "ACTIVE" ? "bg-green-400/20 text-green-100" : "bg-red-400/20 text-red-100"}`}
                  >
                    {wallet.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Transactions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                  <History size={18} /> Lịch sử giao dịch
                </h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 text-gray-500 font-medium">
                    <tr>
                      <th className="px-5 py-3">Thời gian</th>
                      <th className="px-5 py-3">Loại</th>
                      <th className="px-5 py-3">Mô tả</th>
                      <th className="px-5 py-3 text-right">Số tiền</th>
                      <th className="px-5 py-3 text-center">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {transactions.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-5 py-8 text-center text-gray-400">
                          Chưa có giao dịch nào
                        </td>
                      </tr>
                    ) : (
                      transactions.map((tx) => (
                        <tr key={tx.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-5 py-3 text-gray-500 whitespace-nowrap">{formatDate(tx.createdAt)}</td>
                          <td className="px-5 py-3 font-medium">
                            {tx.type === "DEPOSIT" || tx.type === "REFUND" ? (
                              <span className="flex items-center gap-1 text-green-600">
                                <ArrowDownLeft size={14} /> Nạp tiền
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-red-600">
                                <ArrowUpRight size={14} /> {tx.type}
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-3 text-gray-600 max-w-xs truncate" title={tx.description}>
                            {tx.description}
                          </td>
                          <td
                            className={`px-5 py-3 text-right font-bold ${["DEPOSIT", "REFUND"].includes(tx.type) ? "text-green-600" : "text-red-600"}`}
                          >
                            {["DEPOSIT", "REFUND"].includes(tx.type) ? "+" : "-"}
                            {formatCurrency(tx.amount)}
                          </td>
                          <td className="px-5 py-3 text-center">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-semibold 
                              ${
                                tx.status === "SUCCESS"
                                  ? "bg-green-100 text-green-700"
                                  : tx.status === "PENDING"
                                    ? "bg-yellow-100 text-yellow-700"
                                    : "bg-red-100 text-red-700"
                              }`}
                            >
                              {tx.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="flex justify-end gap-4 p-4 border-t text-sm font-medium text-gray-600">
                  <button
                    disabled={page <= 0}
                    onClick={() => changePage(-1)}
                    className="hover:text-[#095544] disabled:opacity-30"
                  >
                    Trước
                  </button>
                  <span>
                    {page + 1} / {totalPages}
                  </span>
                  <button
                    disabled={page >= totalPages - 1}
                    onClick={() => changePage(1)}
                    className="hover:text-[#095544] disabled:opacity-30"
                  >
                    Sau
                  </button>
                </div>
              )}
            </div>
          </>
        )}

        {/* Deposit Modal */}
        {showDeposit && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200">
              <h3 className="text-xl font-bold mb-4 text-gray-800">Nạp tiền vào ví</h3>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Số tiền muốn nạp (VNĐ)</label>
                <div className="relative">
                  <input
                    type="number"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    className="w-full p-3 pl-4 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#095544] focus:border-[#095544] outline-none transition-all text-lg font-medium"
                    placeholder="Nhập số tiền..."
                    min="10000"
                    autoFocus
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">đ</span>
                </div>
                <p className="text-xs text-gray-500 mt-2 ml-1">Số tiền tối thiểu: 10.000 đ</p>
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowDeposit(false)}
                  className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl font-medium transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={handleDeposit}
                  className="px-5 py-2.5 bg-[#095544] text-white rounded-xl font-bold hover:bg-[#0b6e58] transition-colors shadow-lg shadow-green-900/20"
                >
                  Thanh toán VNPay
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
