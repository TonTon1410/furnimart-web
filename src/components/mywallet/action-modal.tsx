'use client'

import { useState } from 'react'
import { walletService, type Wallet } from '@/service/walletService'
import { toast } from 'sonner'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  type: 'deposit' | 'withdraw' | 'transfer'
  wallet: Wallet
  otherWallets: Wallet[]
  onSuccess: () => void
}

export default function ActionModal({
  open,
  onOpenChange,
  type,
  wallet,
  otherWallets,
  onSuccess
}: Props) {
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [targetWalletId, setTargetWalletId] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Vui lòng nhập số tiền hợp lệ')
      return
    }

    try {
      setLoading(true)
      const parsedAmount = parseFloat(amount)

      if (type === 'deposit') {
        await walletService.deposit(
          wallet.id,
          parsedAmount,
          description || 'Nạp tiền'
        )
        toast.success('Nạp tiền thành công')
      } else if (type === 'withdraw') {
        await walletService.withdraw(
          wallet.id,
          parsedAmount,
          description || 'Rút tiền'
        )
        toast.success('Rút tiền thành công')
      } else if (type === 'transfer') {
        if (!targetWalletId) {
          toast.error('Vui lòng chọn ví nhận')
          return
        }
        await walletService.transfer(
          wallet.id,
          targetWalletId,
          parsedAmount,
          description || 'Chuyển tiền'
        )
        toast.success('Chuyển tiền thành công')
      }

      onSuccess()
      setAmount('')
      setDescription('')
      setTargetWalletId('')
    } catch (error: any) {
      const errorMsg = error?.response?.data?.message || 'Có lỗi xảy ra'
      toast.error(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  const getTitle = () => {
    switch (type) {
      case 'deposit':
        return 'Nạp tiền'
      case 'withdraw':
        return 'Rút tiền'
      case 'transfer':
        return 'Chuyển tiền'
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50"
        onClick={() => onOpenChange(false)}
      />

      {/* Modal Content */}
      <div
        className="relative z-50 bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-gray-900">{getTitle()}</h2>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Amount Input */}
          <div>
            <label
              htmlFor="amount"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Số tiền (VND)
            </label>
            <input
              id="amount"
              type="number"
              min="0"
              step="1000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Nhập số tiền"
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>

          {/* Target Wallet Select (only for transfer) */}
          {type === 'transfer' && (
            <div>
              <label
                htmlFor="target"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Ví nhận
              </label>
              <select
                id="target"
                value={targetWalletId}
                onChange={(e) => setTargetWalletId(e.target.value)}
                disabled={loading}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">Chọn ví nhận</option>
                {otherWallets.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.code} - {w.balance.toLocaleString('vi-VN')} VND
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Description Input */}
          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Mô tả
            </label>
            <input
              id="description"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Nhập mô tả (tùy chọn)"
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="flex-1 px-4 py-2 border border-gray-300 bg-white text-gray-700 rounded-md font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-md font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {loading ? 'Đang xử lý...' : 'Xác nhận'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}