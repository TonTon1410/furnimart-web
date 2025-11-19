'use client'

import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, ArrowUpRight, ArrowDownLeft, RefreshCw, Wallet as WalletIcon, TrendingUp, Clock, X } from 'lucide-react'
import { walletService, type Wallet } from '@/service/walletService'
import { authService } from '@/service/authService'
import WalletCard from '@/components/mywallet/wallet-card'
import TransactionHistory from '@/components/mywallet/transaction-history'
import ActionModal from '@/components/mywallet/action-modal'
import { toast } from 'sonner'

const fadeUp = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }
const stagger = { show: { transition: { staggerChildren: 0.1 } } }

export default function MyWalletPage() {
  const [wallets, setWallets] = useState<Wallet[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedWallet, setSelectedWallet] = useState<Wallet | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalType, setModalType] = useState<'deposit' | 'withdraw' | 'transfer'>('deposit')
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newWalletCode, setNewWalletCode] = useState('')
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    loadWallets()
  }, [refreshTrigger])

  const loadWallets = async () => {
    try {
      setLoading(true)
      
      const userId = authService.getUserId()
      console.log('🔍 [MyWalletPage] userId from authService:', {
        userId,
        type: typeof userId,
        length: userId?.length,
        isEmpty: !userId
      })
      
      if (!userId) {
        console.error('❌ [MyWalletPage] userId is empty/null')
        toast.error('Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại', {
          duration: 4000,
          position: 'top-center'
        })
        return
      }

      console.log('📡 [MyWalletPage] Calling walletService.getMyWallets with userId:', userId)
      const data = await walletService.getMyWallets(userId)
      
      setWallets(data)
      if (data.length > 0 && !selectedWallet) {
        setSelectedWallet(data[0])
      }
    } catch (error: any) {
      console.error('❌ Load wallets error:', error)
      
      if (error?.response?.status === 404) {
        setWallets([])
      } else {
        const errorMsg = error?.response?.data?.message || 'Không thể tải thông tin ví'
        toast.error(errorMsg, { duration: 4000 })
      }
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    setRefreshTrigger(prev => prev + 1)
    setTimeout(() => {
      setRefreshing(false)
      toast.success('Đã cập nhật!', { duration: 2000 })
    }, 500)
  }

  const handleCreateWallet = async () => {
    if (!newWalletCode.trim()) {
      toast.error('Vui lòng nhập mã ví')
      return
    }

    try {
      setCreating(true)
      await walletService.createMyWallet(newWalletCode.trim(), 0)
      toast.success('Tạo ví thành công!')
      setShowCreateModal(false)
      setNewWalletCode('')
      handleRefresh()
    } catch (error: any) {
      const errorMsg = error?.response?.data?.message || 'Không thể tạo ví'
      toast.error(errorMsg)
    } finally {
      setCreating(false)
    }
  }

  const handleOpenModal = (type: 'deposit' | 'withdraw' | 'transfer') => {
    if (!selectedWallet) {
      toast.error('Vui lòng chọn ví để thực hiện giao dịch')
      return
    }
    setModalType(type)
    setModalOpen(true)
  }

  const getTotalBalance = () => {
    return wallets.reduce((sum, wallet) => sum + wallet.balance, 0)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 pt-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col justify-center items-center h-96 gap-4">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-emerald-200"></div>
              <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-emerald-600 absolute top-0"></div>
            </div>
            <p className="text-gray-600 font-medium">Đang tải thông tin ví...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 pt-20 pb-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header with Stats */}
        <motion.div
          initial="hidden"
          animate="show"
          variants={fadeUp}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-2">
                Ví của tôi
              </h1>
              <p className="text-base sm:text-lg text-gray-600">
                Quản lý số dư và theo dõi giao dịch của bạn
              </p>
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition shadow-sm disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Làm mới</span>
            </button>
          </div>

          {/* Stats Overview */}
          {wallets.length > 0 && (
            <motion.div
              variants={stagger}
              className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8"
            >
              <motion.div variants={fadeUp} className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <WalletIcon className="h-5 w-5 text-emerald-600" />
                  </div>
                  <p className="text-sm font-medium text-gray-600">Tổng số dư</p>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(getTotalBalance())}
                </p>
              </motion.div>

              <motion.div variants={fadeUp} className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                  </div>
                  <p className="text-sm font-medium text-gray-600">Số ví</p>
                </div>
                <p className="text-2xl font-bold text-gray-900">{wallets.length}</p>
              </motion.div>

              <motion.div variants={fadeUp} className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                    <Clock className="h-5 w-5 text-purple-600" />
                  </div>
                  <p className="text-sm font-medium text-gray-600">Trạng thái</p>
                </div>
                <p className="text-lg font-semibold text-green-600">Hoạt động</p>
              </motion.div>
            </motion.div>
          )}
        </motion.div>

        <AnimatePresence mode="wait">
          {wallets.length === 0 ? (
            <motion.div
              key="empty"
              initial="hidden"
              animate="show"
              exit={{ opacity: 0 }}
              variants={fadeUp}
              className="rounded-2xl border-2 border-dashed border-emerald-300 bg-gradient-to-br from-emerald-50 to-teal-50 px-8 py-16 text-center"
            >
              <div className="max-w-md mx-auto">
                <div className="h-20 w-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
                  <WalletIcon className="h-10 w-10 text-emerald-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  Chưa có ví nào
                </h3>
                <p className="text-gray-600 mb-6">
                  Bạn chưa có ví trong hệ thống. Tạo ví mới để bắt đầu quản lý tài chính của bạn.
                </p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition shadow-lg"
                >
                  <Plus className="h-5 w-5" />
                  Tạo ví mới
                </motion.button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="content"
              initial="hidden"
              animate="show"
              variants={stagger}
              className="grid gap-6"
            >
              {/* Wallets Grid */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <WalletIcon className="h-5 w-5 text-emerald-600" />
                    Danh sách ví
                  </h2>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition shadow-md"
                  >
                    <Plus className="h-4 w-4" />
                    Tạo ví mới
                  </motion.button>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {wallets.map(wallet => (
                    <motion.div
                      key={wallet.id}
                      variants={fadeUp}
                      onClick={() => setSelectedWallet(wallet)}
                      className="cursor-pointer"
                      whileHover={{ y: -4 }}
                      transition={{ type: 'spring', stiffness: 300 }}
                    >
                      <WalletCard
                        wallet={wallet}
                        isSelected={selectedWallet?.id === wallet.id}
                      />
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Selected Wallet Actions */}
              {selectedWallet && (
                <motion.div
                  variants={fadeUp}
                  className="rounded-2xl border border-gray-200 bg-white p-6 shadow-lg"
                >
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-900">
                      Ví: <span className="text-emerald-600">{selectedWallet.code}</span>
                    </h2>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      selectedWallet.status === 'ACTIVE' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {selectedWallet.status === 'ACTIVE' ? 'Đang hoạt động' : 'Không hoạt động'}
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div className="grid gap-3 sm:grid-cols-3 mb-8">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleOpenModal('deposit')}
                      className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 px-4 py-4 text-white font-semibold hover:from-emerald-700 hover:to-emerald-800 transition shadow-md"
                    >
                      <Plus className="h-5 w-5" />
                      Nạp tiền
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleOpenModal('withdraw')}
                      className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-600 to-orange-700 px-4 py-4 text-white font-semibold hover:from-orange-700 hover:to-orange-800 transition shadow-md"
                    >
                      <ArrowDownLeft className="h-5 w-5" />
                      Rút tiền
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleOpenModal('transfer')}
                      className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-4 text-white font-semibold hover:from-blue-700 hover:to-blue-800 transition shadow-md"
                    >
                      <ArrowUpRight className="h-5 w-5" />
                      Chuyển tiền
                    </motion.button>
                  </div>

                  {/* Transaction History */}
                  <TransactionHistory
                    walletId={selectedWallet.id}
                    refreshTrigger={refreshTrigger}
                  />
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Transaction Modal */}
      {selectedWallet && (
        <ActionModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          type={modalType}
          wallet={selectedWallet}
          otherWallets={wallets.filter(w => w.id !== selectedWallet.id)}
          onSuccess={() => {
            setModalOpen(false)
            handleRefresh()
          }}
        />
      )}

      {/* Create Wallet Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
              onClick={() => !creating && setShowCreateModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md">
                <button
                  onClick={() => !creating && setShowCreateModal(false)}
                  disabled={creating}
                  className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg transition disabled:opacity-50"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>

                <div className="mb-6">
                  <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
                    <WalletIcon className="h-6 w-6 text-emerald-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Tạo ví mới</h2>
                  <p className="text-sm text-gray-600 mt-1">Nhập mã ví để tạo ví mới cho tài khoản của bạn</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mã ví <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newWalletCode}
                      onChange={(e) => setNewWalletCode(e.target.value)}
                      placeholder="VD: WALLET001, MY_WALLET"
                      disabled={creating}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !creating) {
                          handleCreateWallet()
                        }
                      }}
                    />
                    <p className="text-xs text-gray-500 mt-1">Mã ví phải là duy nhất và không trùng với các ví khác</p>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => setShowCreateModal(false)}
                      disabled={creating}
                      className="flex-1 px-4 py-3 border border-gray-300 bg-white text-gray-700 rounded-lg font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                      Hủy
                    </button>
                    <button
                      onClick={handleCreateWallet}
                      disabled={creating || !newWalletCode.trim()}
                      className="flex-1 px-4 py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
                    >
                      {creating ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                          Đang tạo...
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4" />
                          Tạo ví
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </main>
  )
}