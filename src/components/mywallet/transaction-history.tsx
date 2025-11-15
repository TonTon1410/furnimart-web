'use client'

import React, { useEffect, useState } from 'react'
import { ArrowUpRight, ArrowDownLeft, Repeat } from 'lucide-react'
import { walletService, type Transaction } from '@/service/walletService'


interface Props {
  walletId: string
  refreshTrigger: number
}

export default function TransactionHistory({ walletId, refreshTrigger }: Props) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    loadTransactions()
  }, [walletId, page, refreshTrigger])

  const loadTransactions = async () => {
    try {
      setLoading(true)
      const data = await walletService.getTransactionsPaged(walletId, page, 10)
      setTransactions(data.data)
      setTotalPages(data.totalPages)
    } catch (error) {
      console.error('Load transactions error:', error)
    } finally {
      setLoading(false)
    }
  }

  const getTypeIcon = (type: Transaction['type']) => {
    switch (type) {
      case 'DEPOSIT':
        return <ArrowDownLeft className="h-5 w-5 text-green-600" />
      case 'WITHDRAW':
        return <ArrowUpRight className="h-5 w-5 text-red-600" />
      case 'TRANSFER':
        return <Repeat className="h-5 w-5 text-blue-600" />
    }
  }

  const getTypeLabel = (type: Transaction['type']) => {
    switch (type) {
      case 'DEPOSIT':
        return 'Nạp tiền'
      case 'WITHDRAW':
        return 'Rút tiền'
      case 'TRANSFER':
        return 'Chuyển tiền'
    }
  }

  const getAmountColor = (type: Transaction['type']) => {
    switch (type) {
      case 'DEPOSIT':
        return 'text-green-600'
      case 'WITHDRAW':
        return 'text-red-600'
      case 'TRANSFER':
        return 'text-blue-600'
    }
  }

  const formatAmount = (amount: number, type: Transaction['type']) => {
    const formatted = new Intl.NumberFormat('vi-VN').format(Math.abs(amount))
    const prefix = type === 'DEPOSIT' ? '+' : type === 'WITHDRAW' ? '-' : ''
    return `${prefix}${formatted} VND`
  }

  if (loading && transactions.length === 0) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    )
  }

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Lịch sử giao dịch</h3>

      {transactions.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          Chưa có giao dịch nào
        </div>
      ) : (
        <div className="space-y-3">
          {transactions.map((tx) => (
            <div
              key={tx.id}
              className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:border-emerald-300 transition"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                  {getTypeIcon(tx.type)}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{getTypeLabel(tx.type)}</p>
                  <p className="text-sm text-gray-500">{tx.description}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(tx.createdAt).toLocaleString('vi-VN')}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className={`font-semibold ${getAmountColor(tx.type)}`}>
                  {formatAmount(tx.amount, tx.type)}
                </p>
                <span
                  className={`text-xs px-2 py-1 rounded ${
                    tx.status === 'COMPLETED'
                      ? 'bg-green-100 text-green-700'
                      : tx.status === 'PENDING'
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {tx.status}
                </span>
              </div>
            </div>
          ))}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 pt-4">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 rounded-lg border border-gray-300 disabled:opacity-50"
              >
                Trước
              </button>
              <span className="px-4 py-2">
                Trang {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 rounded-lg border border-gray-300 disabled:opacity-50"
              >
                Sau
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}