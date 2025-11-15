import { motion } from 'framer-motion'
import { CreditCard } from 'lucide-react'
import type { Wallet } from '@/service/walletService'

interface Props {
  wallet: Wallet
  isSelected?: boolean
}

export default function WalletCard({ wallet, isSelected }: Props) {
  const formatBalance = (balance: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(balance)
  }

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className={`rounded-2xl p-6 transition ${
        isSelected
          ? 'border-2 border-emerald-600 bg-emerald-50'
          : 'border border-gray-200 bg-white hover:border-emerald-300'
      }`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
          <CreditCard className="h-6 w-6 text-white" />
        </div>
        <span className="text-xs font-semibold text-emerald-700 bg-emerald-100 px-2 py-1 rounded">
          {wallet.status}
        </span>
      </div>

      <h3 className="font-semibold text-gray-900 mb-1">{wallet.code}</h3>
      <p className="text-2xl font-bold text-emerald-600 mb-2">
        {formatBalance(wallet.balance)}
      </p>
      <p className="text-xs text-gray-500">
        Tạo: {new Date(wallet.createdAt).toLocaleDateString('vi-VN')}
      </p>
    </motion.div>
  )
}
