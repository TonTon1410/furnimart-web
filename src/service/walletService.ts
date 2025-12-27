import axiosClient from "./axiosClient"

export interface Wallet {
  id: string
  code: string
  balance: number
  status: string
  userId: string
  userFullName: string
  createdAt: string
  updatedAt: string
}

export interface WalletTransaction {
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
  createdAt: string
}

export interface TransactionResponse {
  content: WalletTransaction[]
  pageNo: number
  pageSize: number
  totalElements: number
  totalPages: number
  last: boolean
}

export const walletService = {
  // Get current user's wallet
  getMyWallet: async () => {
    const url = `/wallets/my-wallet`
    return axiosClient.get<{ data: Wallet }>(url)
  },

  // Get wallet by User ID (for admin)
  getWalletByUserId: async (userId: string) => {
    const url = `/wallets/user/${userId}`
    return axiosClient.get<{ data: Wallet }>(url)
  },

  // Get transactions with pagination
  getTransactions: async (walletId: string, page = 0, size = 10) => {
    const url = `/wallets/${walletId}/transactions/paged?page=${page}&size=${size}`
    return axiosClient.get<{ data: TransactionResponse }>(url)
  },

  deposit: async (walletId: string, amount: number, description: string) => {
    const url = `/wallets/${walletId}/deposit?amount=${amount}&description=${encodeURIComponent(description)}`
    return axiosClient.post(url)
  },

  // Create wallet manually (if needed)
  createWallet: async (data: { code: string; balance: number; status: string; userId: string }) => {
    return axiosClient.post("/wallets", data)
  },
}