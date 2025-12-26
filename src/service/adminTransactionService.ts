import axiosClient from "./axiosClient"

// Payment Transaction Interface
export interface PaymentTransaction {
  id: number
  transactionCode: string
  total: number
  paymentMethod: "VNPAY" | "COD" | "CASH"
  paymentStatus: "PENDING" | "PAID" | "DEPOSITED" | "FAILED" | "CANCELLED"
  date: string
  userId: string
  userName: string
  email: string
}

// Wallet Transaction Interface (extended from walletService)
export interface AdminWalletTransaction {
  id: string
  code: string
  balanceBefore: number
  balanceAfter: number
  amount: number
  status: "PENDING" | "SUCCESS" | "COMPLETED" | "FAILED" | "CANCELLED"
  type: "DEPOSIT" | "WITHDRAW" | "TRANSFER" | "PAYMENT" | "REFUND"
  description: string
  referenceId: string
  walletId: string
  walletCode: string
  userId: string
  userName: string
  email: string
  createdAt: string
}

export const adminTransactionService = {
  // Get all payment transactions
  getAllPayments: async () => {
    const url = `/payments`
    return axiosClient.get<{ status: number; message: string; data: PaymentTransaction[] }>(url)
  },

  // Get all wallet transactions
  getAllWalletTransactions: async () => {
    const url = `/wallets/all/transactions`
    return axiosClient.get<{ status: number; message: string; data: AdminWalletTransaction[] }>(url)
  },
}
