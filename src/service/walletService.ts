/* eslint-disable @typescript-eslint/no-explicit-any */
import axiosClient from './axiosClient'

export interface Wallet {
  id: string
  code: string
  balance: number
  status: 'ACTIVE' | 'INACTIVE'
  userId: string
  userFullName?: string
  createdAt: string
  updatedAt: string
}

export interface Transaction {
  id: string
  walletId: string
  walletCode?: string
  amount: number
  type: 'DEPOSIT' | 'WITHDRAW' | 'TRANSFER'
  description: string
  referenceId?: string
  status: 'PENDING' | 'COMPLETED' | 'FAILED'
  createdAt: string
  updatedAt?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export const walletService = {
  // ✅ Get wallets by user ID - FIXED: Backend trả về single object, không phải array
  getMyWallets: async (userId: string) => {
    try {
      // Validate userId trước khi gọi API
      if (!userId || typeof userId !== 'string' || userId.trim() === '') {
        console.error('❌ Invalid userId:', userId, typeof userId)
        throw new Error('Invalid userId format')
      }

      const trimmedUserId = userId.trim()
      console.log('🔍 UserId details:', {
        original: userId,
        trimmed: trimmedUserId,
        length: trimmedUserId.length,
        type: typeof trimmedUserId
      })
      
      const url = `/wallets/user/${trimmedUserId}`
      console.log('📡 Calling API:', url)
      
      const res = await axiosClient.get(url)
      
      console.log('✅ API Response received:', {
        status: res.status,
        fullData: res.data
      })

      // 🔥 FIX: Backend trả về { status: 200, message: "...", data: {single wallet object} }
      let wallets: Wallet[] = []
      
      // Case 1: { data: {single wallet object} } - BACKEND CỦA BẠN
      if (res.data?.data && typeof res.data.data === 'object' && !Array.isArray(res.data.data)) {
        // Nếu data là object đơn và có các field của Wallet
        if (res.data.data.id && res.data.data.code) {
          wallets = [res.data.data]
        } else {
          // Có thể data chứa nested structure
          wallets = []
        }
      }
      // Case 2: { data: [...] } - Array of wallets
      else if (res.data?.data && Array.isArray(res.data.data)) {
        wallets = res.data.data
      }
      // Case 3: Direct wallet object response
      else if (res.data && res.data.id && res.data.code) {
        wallets = [res.data]
      }
      // Case 4: Direct array response
      else if (Array.isArray(res.data)) {
        wallets = res.data
      }

      console.log(`✅ Successfully parsed ${wallets.length} wallet(s)`, wallets)
      return wallets
    } catch (error: any) {
      console.error('❌ Get my wallets error:', error.message)
      console.error('❌ Full error:', error)
      console.error('❌ Status:', error?.response?.status)
      console.error('❌ Error response:', error?.response?.data)
      console.error('❌ Error config:', {
        url: error?.config?.url,
        method: error?.config?.method,
        baseURL: error?.config?.baseURL
      })
      throw error
    }
  },

  // Get all wallets (admin only)
  getAllWallets: async () => {
    try {
      const res = await axiosClient.get<{
        status: number
        message: string
        data: Wallet[]
      }>('/wallets')
      return res.data.data || []
    } catch (error: any) {
      console.error('Get all wallets error:', error)
      throw error
    }
  },

  // Get wallet by ID
  getWalletById: async (id: string) => {
    try {
      const res = await axiosClient.get<{
        status: number
        message: string
        data: Wallet
      }>(`/wallets/${id}`)
      return res.data.data
    } catch (error: any) {
      console.error('Get wallet by ID error:', error)
      throw error
    }
  },

  // Get wallet by code
  getWalletByCode: async (code: string) => {
    try {
      const res = await axiosClient.get<{
        status: number
        message: string
        data: Wallet
      }>(`/wallets/code/${code}`)
      return res.data.data
    } catch (error: any) {
      console.error('Get wallet by code error:', error)
      throw error
    }
  },

  // Create wallet (admin only) - Requires userId in payload
  createWallet: async (payload: {
    code: string
    balance: number
    status: string
    userId: string
  }) => {
    try {
      const res = await axiosClient.post<{
        status: number
        message: string
        data: Wallet
      }>('/wallets', payload)
      return res.data.data
    } catch (error: any) {
      console.error('Create wallet error:', error)
      throw error
    }
  },

  // ✅ NEW: Create wallet for current user (không cần userId trong payload)
  createMyWallet: async (code: string, initialBalance: number = 0) => {
    try {
      console.log('📡 Creating wallet with code:', code)
      
      // Backend tự lấy userId từ token, không cần truyền trong body
      const res = await axiosClient.post<{
        status: number
        message: string
        data: Wallet
      }>('/wallets/create', {
        code,
        balance: initialBalance,
        status: 'ACTIVE'
      })
      
      console.log('✅ Wallet created successfully:', res.data)
      return res.data.data
    } catch (error: any) {
      console.error('❌ Create my wallet error:', error)
      console.error('❌ Response:', error?.response?.data)
      throw error
    }
  },

  // Get transactions with pagination
  getTransactionsPaged: async (
    walletId: string,
    page: number = 1,
    pageSize: number = 10
  ) => {
    try {
      const res = await axiosClient.get<{
        status: number
        message: string
        data: PaginatedResponse<Transaction>
      }>(`/wallets/${walletId}/transactions/paged`, {
        params: { page, pageSize }
      })
      return res.data.data
    } catch (error: any) {
      console.error('Get transactions paged error:', error)
      throw error
    }
  },

  // Deposit
  deposit: async (walletId: string, amount: number, description: string) => {
    try {
      const res = await axiosClient.post<{
        status: number
        message: string
        data: Transaction
      }>(`/wallets/${walletId}/deposit`, {
        amount,
        description
      })
      return res.data.data
    } catch (error: any) {
      console.error('Deposit error:', error)
      throw error
    }
  },

  // Withdraw
  withdraw: async (walletId: string, amount: number, description: string) => {
    try {
      const res = await axiosClient.post<{
        status: number
        message: string
        data: Transaction
      }>(`/wallets/${walletId}/withdraw`, {
        amount,
        description
      })
      return res.data.data
    } catch (error: any) {
      console.error('Withdraw error:', error)
      throw error
    }
  },

  // Transfer between wallets
  transfer: async (
    fromWalletId: string,
    toWalletId: string,
    amount: number,
    description: string
  ) => {
    try {
      const res = await axiosClient.post<{
        status: number
        message: string
        data: Transaction
      }>('/wallets/transfer', {
        fromWalletId,
        toWalletId,
        amount,
        description
      })
      return res.data.data
    } catch (error: any) {
      console.error('Transfer error:', error)
      throw error
    }
  }
}