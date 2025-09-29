"use client"

import type React from "react"
import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  MapPin,
  Plus,
  Edit3,
  Trash2,
  Save,
  X,
  User,
  Phone,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Star,
  MapIcon,
  Search,
  Filter,
  Copy,
  BarChart3,
  FileText,
  Map,
  Trash,
  Settings,
  Globe,
  FileDown,
  FileUp,
  Database,
  Users,
  Building,
  AlertTriangle,
  Clock,
  TrendingUp
} from "lucide-react"
import { authService } from "@/service/authService"
import { addressService, type Address, type BulkOperationResult } from "@/service/addressService"

// Animation variants
const fadeUp = { 
  hidden: { opacity: 0, y: 20 }, 
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } }
}

const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const slideIn = {
  hidden: { opacity: 0, x: -20 },
  show: { opacity: 1, x: 0, transition: { duration: 0.3 } },
  exit: { opacity: 0, x: 20, transition: { duration: 0.2 } }
}

// Interfaces
interface ViewMode {
  type: 'list' | 'grid' | 'map' | 'stats';
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}

interface LoadingState {
  fetch: boolean;
  create: boolean;
  update: boolean;
  delete: boolean;
  bulk: boolean;
  export: boolean;
  import: boolean;
}

// Constants
const viewModes: ViewMode[] = [
  { type: 'list', label: 'Danh sách', icon: FileText },
  { type: 'grid', label: 'Lưới', icon: Building },
  { type: 'stats', label: 'Thống kê', icon: BarChart3 },
  { type: 'map', label: 'Bản đồ', icon: Map },
];

const TOAST_DURATION = 5000;

export default function AddressPage() {
  // Core state
  const [addresses, setAddresses] = useState<Address[]>([])
  const [filteredAddresses, setFilteredAddresses] = useState<Address[]>([])
  
  // UI state
  const [isCreating, setIsCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode['type']>('list')
  const [toasts, setToasts] = useState<Toast[]>([])
  
  // Loading states
  const [loading, setLoading] = useState<LoadingState>({
    fetch: true,
    create: false,
    update: false,
    delete: false,
    bulk: false,
    export: false,
    import: false
  })
  
  // Search and filter state
  const [searchKeyword, setSearchKeyword] = useState("")
  const [showAdvancedFilter, setShowAdvancedFilter] = useState(false)
  const [filterOptions, setFilterOptions] = useState({
    city: '',
    district: '',
    isDefault: 'all' as 'all' | 'default' | 'non-default'
  })

  // Bulk operations state
  const [selectedAddresses, setSelectedAddresses] = useState<string[]>([])
  const [showBulkActions, setShowBulkActions] = useState(false)

  // Form state
  const [createForm, setCreateForm] = useState({
    name: "",
    phone: "",
    city: "",
    district: "",
    ward: "",
    street: "",
    addressLine: "",
    isDefault: false
  })

  const [editForm, setEditForm] = useState({
    name: "",
    phone: "",
    city: "",
    district: "",
    ward: "",
    street: "",
    addressLine: "",
    isDefault: false
  })

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Toast management
  const showToast = useCallback((type: Toast['type'], message: string, duration = TOAST_DURATION) => {
    const id = Date.now().toString()
    const toast: Toast = { id, type, message, duration }
    
    setToasts(prev => [...prev, toast])
    
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, duration)
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  // Loading state helpers
  const setLoadingState = useCallback((key: keyof LoadingState, value: boolean) => {
    setLoading(prev => ({ ...prev, [key]: value }))
  }, [])

  // Memoized filtered addresses
  const memoizedFilteredAddresses = useMemo(() => {
    let filtered = [...addresses]

    // Apply search keyword
    if (searchKeyword.trim()) {
      filtered = addressService.filterAddressesByKeyword(filtered, searchKeyword)
    }

    // Apply filters
    if (filterOptions.city) {
      filtered = filtered.filter(addr => 
        addr.city?.toLowerCase().includes(filterOptions.city.toLowerCase())
      )
    }

    if (filterOptions.district) {
      filtered = filtered.filter(addr => 
        addr.district?.toLowerCase().includes(filterOptions.district.toLowerCase())
      )
    }

    if (filterOptions.isDefault !== 'all') {
      filtered = filtered.filter(addr => 
        filterOptions.isDefault === 'default' ? addr.isDefault : !addr.isDefault
      )
    }

    return filtered
  }, [addresses, searchKeyword, filterOptions])

  // Update filtered addresses when dependencies change
  useEffect(() => {
    setFilteredAddresses(memoizedFilteredAddresses)
  }, [memoizedFilteredAddresses])

  // Fetch functions
 const fetchAddresses = useCallback(async () => {
  try {
    setLoadingState('fetch', true);

    // Try to obtain userId from profile endpoint first (more reliable)
    let userId: string | null = null;

    // Using async getProfile from authService
    const profile = await authService.getProfile();
    if (profile && profile.id) {
      userId = profile.id as string;
    } else {
      // fallback: try decode token (existing function)
      userId = authService.getUserId();
    }

    if (!userId) {
      throw new Error("Không tìm thấy userId. Hãy kiểm tra token hoặc gọi /users/profile để lấy id.");
    }

    const response = await addressService.getAddressesByUserId(userId);

    if (response?.data && Array.isArray(response.data)) {
      setAddresses(response.data);
      showToast('success', `Đã tải ${response.data.length} địa chỉ`, 2000);
    } else {
      setAddresses([]);
      showToast('warning', 'Không có dữ liệu địa chỉ');
    }
  } catch (error: any) {
    console.error("Fetch addresses error:", error);
    if (error.message?.includes('đăng nhập')) {
      authService.logout();
      window.location.href = "/login";
      return;
    }
    showToast('error', error.message || "Không thể tải danh sách địa chỉ");
    setAddresses([]);
  } finally {
    setLoadingState('fetch', false);
  }
}, [setLoadingState, showToast]);
 

  // Initialize component
  useEffect(() => {
    const isAuth = authService.isAuthenticated()
    if (!isAuth) {
      window.location.href = "/login"
      return
    }
    fetchAddresses()
  }, [fetchAddresses])

 
  

  // Form helpers
  const resetCreateForm = useCallback(() => {
    setCreateForm({
      name: "",
      phone: "",
      city: "",
      district: "",
      ward: "",
      street: "",
      addressLine: "",
      isDefault: false
    })
  }, [])

  // CRUD operations
  const handleCreate = useCallback(async () => {
    if (!createForm.name.trim() || !createForm.phone.trim() || !createForm.addressLine.trim()) {
      showToast('error', "Vui lòng điền đầy đủ thông tin bắt buộc (Họ tên, Số điện thoại, Địa chỉ chi tiết)")
      return
    }

    try {
      setLoadingState('create', true)
      
      const response = await addressService.createAddress(createForm)
      
      if (response?.data) {
        await fetchAddresses()
        resetCreateForm()
        setIsCreating(false)
        showToast('success', "Thêm địa chỉ thành công!")
      } else {
        throw new Error("Không nhận được dữ liệu địa chỉ từ server")
      }
    } catch (error: any) {
      showToast('error', error.message || "Thêm địa chỉ thất bại")
    } finally {
      setLoadingState('create', false)
    }
  }, [createForm, setLoadingState, showToast, fetchAddresses, resetCreateForm])

  const handleEdit = useCallback((address: Address) => {
    if (!address?.id) {
      showToast('error', "Thông tin địa chỉ không hợp lệ")
      return
    }

    setEditingId(address.id)
    setEditForm({
      name: address.name || "",
      phone: address.phone || "",
      city: address.city || "",
      district: address.district || "",
      ward: address.ward || "",
      street: address.street || "",
      addressLine: address.addressLine || "",
      isDefault: Boolean(address.isDefault)
    })
  }, [])

  const handleUpdate = useCallback(async () => {
    if (!editingId) return

    if (!editForm.name.trim() || !editForm.phone.trim() || !editForm.addressLine.trim()) {
      showToast('error', "Vui lòng điền đầy đủ thông tin bắt buộc")
      return
    }

    try {
      setLoadingState('update', true)
      
      const response = await addressService.updateAddress(editingId, editForm)
      
      if (response?.data) {
        await fetchAddresses()
        setEditingId(null)
        showToast('success', "Cập nhật địa chỉ thành công!")
      } else {
        throw new Error("Không nhận được dữ liệu cập nhật từ server")
      }
    } catch (error: any) {
      showToast('error', error.message || "Cập nhật địa chỉ thất bại")
    } finally {
      setLoadingState('update', false)
    }
  }, [editingId, editForm, setLoadingState, showToast, fetchAddresses])

  const handleDelete = useCallback(async (id: string) => {
    if (!id?.trim()) {
      showToast('error', "ID địa chỉ không hợp lệ")
      return
    }

    if (!confirm("Bạn có chắc chắn muốn xóa địa chỉ này?")) return

    try {
      setLoadingState('delete', true)
      
      await addressService.deleteAddress(id)
      await fetchAddresses()
      showToast('success', "Xóa địa chỉ thành công!")
    } catch (error: any) {
      showToast('error', error.message || "Xóa địa chỉ thất bại")
    } finally {
      setLoadingState('delete', false)
    }
  }, [setLoadingState, showToast, fetchAddresses])

  const handleSetDefault = useCallback(async (id: string) => {
    if (!id?.trim()) {
      showToast('error', "ID địa chỉ không hợp lệ")
      return
    }

    try {
      setLoadingState('update', true)
      
      await addressService.setDefaultAddress(id)
      await fetchAddresses()
      showToast('success', "Đã đặt làm địa chỉ mặc định!")
    } catch (error: any) {
      showToast('error', error.message || "Đặt địa chỉ mặc định thất bại")
    } finally {
      setLoadingState('update', false)
    }
  }, [setLoadingState, showToast, fetchAddresses])

  const handleDuplicate = useCallback(async (address: Address) => {
    const newName = prompt("Nhập tên mới cho địa chỉ sao chép:", `${address.name} (Sao chép)`)
    if (!newName?.trim()) return

    try {
      setLoadingState('create', true)
      
      await addressService.duplicateAddress(address.id, newName)
      await fetchAddresses()
      showToast('success', "Sao chép địa chỉ thành công!")
    } catch (error: any) {
      showToast('error', error.message || "Sao chép địa chỉ thất bại")
    } finally {
      setLoadingState('create', false)
    }
  }, [setLoadingState, showToast, fetchAddresses])

  // Bulk operations
  const handleBulkDelete = useCallback(async () => {
    if (selectedAddresses.length === 0) {
      showToast('error', "Vui lòng chọn ít nhất một địa chỉ để xóa")
      return
    }

    if (!confirm(`Bạn có chắc chắn muốn xóa ${selectedAddresses.length} địa chỉ đã chọn?`)) return

    try {
      setLoadingState('bulk', true)
      
      const response = await addressService.deleteBulkAddresses(selectedAddresses)
      await fetchAddresses()
      
      setSelectedAddresses([])
      setShowBulkActions(false)
      
      showToast('success', `Đã xóa ${response.data.successCount} địa chỉ thành công!`)
      
      if (response.data.failureCount > 0) {
        showToast('warning', `${response.data.failureCount} địa chỉ không thể xóa`)
      }
    } catch (error: any) {
      showToast('error', error.message || "Xóa hàng loạt thất bại")
    } finally {
      setLoadingState('bulk', false)
    }
  }, [selectedAddresses, setLoadingState, showToast, fetchAddresses])

  // Import/Export
  const handleExport = useCallback(async (format: 'json' | 'csv' | 'xlsx') => {
    try {
      setLoadingState('export', true)
      
      const response = await addressService.exportAddresses(format)
      
      // Create download
      let blob: Blob
      let filename: string
      
      if (format === 'json') {
        blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' })
        filename = `addresses_${new Date().toISOString().split('T')[0]}.json`
      } else {
        blob = response.data as Blob
        filename = `addresses_${new Date().toISOString().split('T')[0]}.${format}`
      }
      
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      showToast('success', `Export ${format.toUpperCase()} thành công!`)
    } catch (error: any) {
      showToast('error', error.message || "Export thất bại")
    } finally {
      setLoadingState('export', false)
    }
  }, [setLoadingState, showToast])

  const handleImport = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      setLoadingState('import', true)
      
      const response = await addressService.importAddresses(file, {
        overwriteExisting: false,
        skipInvalid: true
      })
      
      await fetchAddresses()
      
      showToast('success', `Import thành công! Đã tạo ${response.data.successCount} địa chỉ mới.`)
      
      if (response.data.failureCount > 0) {
        showToast('warning', `${response.data.failureCount} địa chỉ không thể import`)
      }
    } catch (error: any) {
      showToast('error', error.message || "Import thất bại")
    } finally {
      setLoadingState('import', false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }, [setLoadingState, showToast, fetchAddresses])

  // Selection handlers
  const toggleAddressSelection = useCallback((addressId: string) => {
    setSelectedAddresses(prev => 
      prev.includes(addressId) 
        ? prev.filter(id => id !== addressId)
        : [...prev, addressId]
    )
  }, [])

  const selectAllAddresses = useCallback(() => {
    setSelectedAddresses(filteredAddresses.map(addr => addr.id))
  }, [filteredAddresses])

  const clearSelection = useCallback(() => {
    setSelectedAddresses([])
  }, [])

  // Utility functions
  const formatAddress = useCallback((address: Address) => {
    if (!address) return ""
    return addressService.formatAddress(address)
  }, [])

  const handleRefresh = useCallback(async () => {
    await fetchAddresses()
  }, [fetchAddresses])

  const handleCancelCreate = useCallback(() => {
    setIsCreating(false)
    resetCreateForm()
  }, [resetCreateForm])

  const handleCancelEdit = useCallback(() => {
    setEditingId(null)
  }, [])

  // Toast component
  const ToastContainer = () => (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            variants={slideIn}
            initial="hidden"
            animate="show"
            exit="exit"
            className={`max-w-sm p-4 rounded-lg shadow-lg border flex items-start gap-3 ${
              toast.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' :
              toast.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' :
              toast.type === 'warning' ? 'bg-yellow-50 border-yellow-200 text-yellow-800' :
              'bg-blue-50 border-blue-200 text-blue-800'
            }`}
          >
            <div className="flex-shrink-0 mt-0.5">
              {toast.type === 'success' && <CheckCircle className="h-4 w-4" />}
              {toast.type === 'error' && <AlertCircle className="h-4 w-4" />}
              {toast.type === 'warning' && <AlertTriangle className="h-4 w-4" />}
              {toast.type === 'info' && <AlertCircle className="h-4 w-4" />}
            </div>
            <div className="flex-1 text-sm font-medium">{toast.message}</div>
            <button
              onClick={() => removeToast(toast.id)}
              className="flex-shrink-0 p-1 hover:opacity-70 transition-opacity"
            >
              <X className="h-3 w-3" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )

  if (loading.fetch) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary/20 border-t-primary mx-auto mb-6"></div>
          <p className="text-foreground text-lg font-medium">Đang tải danh sách địa chỉ...</p>
          <p className="text-muted-foreground mt-2">Vui lòng chờ trong giây lát...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <ToastContainer />
      
      <motion.div initial="hidden" animate="show" variants={staggerContainer} className="space-y-6">
        {/* Header */}
        <motion.div variants={fadeUp} className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-primary/10 rounded-2xl">
              <MapPin className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-4xl font-bold text-foreground">Địa chỉ giao hàng</h1>
          </div>
          <p className="text-muted-foreground text-lg">Quản lý địa chỉ giao hàng của bạn</p>
          
          
        </motion.div>

        {/* Toolbar */}
        <motion.div variants={fadeUp} className="bg-white rounded-2xl shadow-lg border border-gray-200 p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  placeholder="Tìm kiếm theo tên, số điện thoại, địa chỉ..."
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* View Mode Selector */}
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              {viewModes.map((mode) => {
                const Icon = mode.icon
                return (
                  <button
                    key={mode.type}
                    onClick={() => setViewMode(mode.type)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      viewMode === mode.type
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{mode.label}</span>
                  </button>
                )
              })}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowAdvancedFilter(!showAdvancedFilter)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  showAdvancedFilter || Object.values(filterOptions).some(v => v !== '' && v !== 'all')
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                <Filter className="h-4 w-4" />
                <span className="hidden sm:inline">Lọc</span>
              </button>
              
              <button
                onClick={() => setShowBulkActions(!showBulkActions)}
                className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
              >
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">Hành động</span>
              </button>

              <button
                onClick={handleRefresh}
                disabled={loading.fetch}
                className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${loading.fetch ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Làm mới</span>
              </button>
            </div>
          </div>

          {/* Advanced Filter */}
          <AnimatePresence>
            {showAdvancedFilter && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 pt-4 border-t border-gray-200"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Thành phố</label>
                    <input
                      type="text"
                      value={filterOptions.city}
                      onChange={(e) => setFilterOptions(prev => ({ ...prev, city: e.target.value }))}
                      placeholder="Lọc theo thành phố"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Quận/Huyện</label>
                    <input
                      type="text"
                      value={filterOptions.district}
                      onChange={(e) => setFilterOptions(prev => ({ ...prev, district: e.target.value }))}
                      placeholder="Lọc theo quận/huyện"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Loại địa chỉ</label>
                    <select
                      value={filterOptions.isDefault}
                      onChange={(e) => setFilterOptions(prev => ({ ...prev, isDefault: e.target.value as any }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="all">Tất cả</option>
                      <option value="default">Địa chỉ mặc định</option>
                      <option value="non-default">Địa chỉ phụ</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end mt-4">
                  <button
                    onClick={() => {
                      setFilterOptions({
                        city: '',
                        district: '',
                        isDefault: 'all'
                      })
                      setSearchKeyword('')
                    }}
                    className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                  >
                    Xóa bộ lọc
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Bulk Actions Panel */}
          <AnimatePresence>
            {showBulkActions && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 pt-4 border-t border-gray-200"
              >
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedAddresses.length === filteredAddresses.length && filteredAddresses.length > 0}
                      onChange={(e) => e.target.checked ? selectAllAddresses() : clearSelection()}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">
                      Đã chọn {selectedAddresses.length}/{filteredAddresses.length}
                    </span>
                  </div>
                  
                  {selectedAddresses.length > 0 && (
                    <>
                      <button
                        onClick={handleBulkDelete}
                        disabled={loading.bulk}
                        className="flex items-center gap-2 px-3 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                      >
                        {loading.bulk ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash className="h-4 w-4" />
                        )}
                        Xóa đã chọn
                      </button>
                      
                      <button
                        onClick={clearSelection}
                        className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                      >
                        <X className="h-4 w-4" />
                        Bỏ chọn
                      </button>
                    </>
                  )}

                  <div className="flex items-center gap-2 ml-auto">
                    <button
                      onClick={() => handleExport('json')}
                      disabled={loading.export}
                      className="flex items-center gap-2 px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                    >
                      <FileDown className="h-4 w-4" />
                      JSON
                    </button>
                    
                    <button
                      onClick={() => handleExport('csv')}
                      disabled={loading.export}
                      className="flex items-center gap-2 px-3 py-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                    >
                      <FileDown className="h-4 w-4" />
                      CSV
                    </button>

                    <label className="flex items-center gap-2 px-3 py-2 bg-orange-100 hover:bg-orange-200 text-orange-700 rounded-lg text-sm font-medium transition-colors cursor-pointer">
                      <FileUp className="h-4 w-4" />
                      Import
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".json,.csv,.xlsx"
                        onChange={handleImport}
                        disabled={loading.import}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        
        

        {/* Add New Address Button */}
        {!isCreating && viewMode !== 'stats' && (
          <motion.div variants={fadeUp} className="text-center">
            <button
              onClick={() => setIsCreating(true)}
              disabled={loading.create}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200 font-medium shadow-lg disabled:opacity-50"
            >
              <Plus className="h-5 w-5" />
              Thêm địa chỉ mới
            </button>
          </motion.div>
        )}

        {/* Create Form */}
        <AnimatePresence>
          {isCreating && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <Plus className="h-6 w-6 text-blue-600" />
                  Thêm địa chỉ mới
                </h3>
                <button
                  onClick={handleCancelCreate}
                  disabled={loading.create}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Họ và tên *
                  </label>
                  <input
                    type="text"
                    value={createForm.name}
                    onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                    disabled={loading.create}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                    placeholder="Nhập họ và tên"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Số điện thoại *
                  </label>
                  <input
                    type="tel"
                    value={createForm.phone}
                    onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                    disabled={loading.create}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                    placeholder="Nhập số điện thoại"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Tỉnh/Thành phố
                  </label>
                  <input
                    type="text"
                    value={createForm.city}
                    onChange={(e) => setCreateForm({ ...createForm, city: e.target.value })}
                    disabled={loading.create}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                    placeholder="Nhập tỉnh/thành phố"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Quận/Huyện
                  </label>
                  <input
                    type="text"
                    value={createForm.district}
                    onChange={(e) => setCreateForm({ ...createForm, district: e.target.value })}
                    disabled={loading.create}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                    placeholder="Nhập quận/huyện"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Phường/Xã
                  </label>
                  <input
                    type="text"
                    value={createForm.ward}
                    onChange={(e) => setCreateForm({ ...createForm, ward: e.target.value })}
                    disabled={loading.create}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                    placeholder="Nhập phường/xã"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Đường/Phố
                  </label>
                  <input
                    type="text"
                    value={createForm.street}
                    onChange={(e) => setCreateForm({ ...createForm, street: e.target.value })}
                    disabled={loading.create}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                    placeholder="Nhập tên đường/phố"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Địa chỉ chi tiết *
                </label>
                <textarea
                  value={createForm.addressLine}
                  onChange={(e) => setCreateForm({ ...createForm, addressLine: e.target.value })}
                  rows={3}
                  disabled={loading.create}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none disabled:opacity-50"
                  placeholder="Số nhà, tên đường, khu vực..."
                />
              </div>

              <div className="mt-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={createForm.isDefault}
                    onChange={(e) => setCreateForm({ ...createForm, isDefault: e.target.checked })}
                    disabled={loading.create}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                  />
                  <span className="text-sm font-medium text-gray-700">Đặt làm địa chỉ mặc định</span>
                </label>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleCreate}
                  disabled={loading.create}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200 font-medium disabled:opacity-50"
                >
                  {loading.create ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Đang lưu...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Lưu địa chỉ
                    </>
                  )}
                </button>
                <button
                  onClick={handleCancelCreate}
                  disabled={loading.create}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all duration-200 font-medium disabled:opacity-50"
                >
                  <X className="h-4 w-4" />
                  Hủy
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Address List/Grid */}
        {viewMode !== 'stats' && (
          <motion.div variants={fadeUp} className="space-y-4">
            {filteredAddresses.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl shadow-lg border border-gray-200">
                <MapIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {searchKeyword || Object.values(filterOptions).some(v => v !== '' && v !== 'all')
                    ? 'Không tìm thấy địa chỉ nào'
                    : 'Chưa có địa chỉ nào'
                  }
                </h3>
                <p className="text-gray-600 mb-4">
                  {searchKeyword || Object.values(filterOptions).some(v => v !== '' && v !== 'all')
                    ? 'Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc'
                    : 'Thêm địa chỉ giao hàng để thuận tiện cho việc mua sắm'
                  }
                </p>
                {!isCreating && !searchKeyword && !Object.values(filterOptions).some(v => v !== '' && v !== 'all') && (
                  <button
                    onClick={() => setIsCreating(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    Thêm địa chỉ đầu tiên
                  </button>
                )}
              </div>
            ) : (
              <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-4'}>
                <AnimatePresence>
                  {filteredAddresses.map((address) => (
                    <motion.div
                      key={address.id}
                      variants={fadeUp}
                      initial="hidden"
                      animate="show"
                      exit="exit"
                      layout
                      className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all duration-200"
                    >
                      {editingId === address.id ? (
                        <div>
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                              <Edit3 className="h-5 w-5 text-blue-600" />
                              Chỉnh sửa địa chỉ
                            </h4>
                            <button
                              onClick={handleCancelEdit}
                              disabled={loading.update}
                              className="p-1 hover:bg-gray-100 rounded transition-colors disabled:opacity-50"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Họ và tên *
                              </label>
                              <input
                                type="text"
                                value={editForm.name}
                                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                disabled={loading.update}
                                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Số điện thoại *
                              </label>
                              <input
                                type="tel"
                                value={editForm.phone}
                                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                                disabled={loading.update}
                                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Tỉnh/Thành phố
                              </label>
                              <input
                                type="text"
                                value={editForm.city}
                                onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                                disabled={loading.update}
                                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Quận/Huyện
                              </label>
                              <input
                                type="text"
                                value={editForm.district}
                                onChange={(e) => setEditForm({ ...editForm, district: e.target.value })}
                                disabled={loading.update}
                                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Phường/Xã
                              </label>
                              <input
                                type="text"
                                value={editForm.ward}
                                onChange={(e) => setEditForm({ ...editForm, ward: e.target.value })}
                                disabled={loading.update}
                                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Đường/Phố
                              </label>
                              <input
                                type="text"
                                value={editForm.street}
                                onChange={(e) => setEditForm({ ...editForm, street: e.target.value })}
                                disabled={loading.update}
                                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                              />
                            </div>
                          </div>

                          <div className="mt-4">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                              Địa chỉ chi tiết *
                            </label>
                            <textarea
                              value={editForm.addressLine}
                              onChange={(e) => setEditForm({ ...editForm, addressLine: e.target.value })}
                              rows={3}
                              disabled={loading.update}
                              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none disabled:opacity-50"
                            />
                          </div>

                          <div className="mt-4">
                            <label className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={editForm.isDefault}
                                onChange={(e) => setEditForm({ ...editForm, isDefault: e.target.checked })}
                                disabled={loading.update}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                              />
                              <span className="text-sm font-medium text-gray-700">Đặt làm địa chỉ mặc định</span>
                            </label>
                          </div>

                          <div className="flex gap-3 mt-4">
                            <button
                              onClick={handleUpdate}
                              disabled={loading.update}
                              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200 font-medium disabled:opacity-50"
                            >
                              {loading.update ? (
                                <>
                                  <RefreshCw className="h-4 w-4 animate-spin" />
                                  Đang cập nhật...
                                </>
                              ) : (
                                <>
                                  <Save className="h-4 w-4" />
                                  Cập nhật
                                </>
                              )}
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              disabled={loading.update}
                              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all duration-200 font-medium disabled:opacity-50"
                            >
                              <X className="h-4 w-4" />
                              Hủy
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                {showBulkActions && (
                                  <input
                                    type="checkbox"
                                    checked={selectedAddresses.includes(address.id)}
                                    onChange={() => toggleAddressSelection(address.id)}
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                  />
                                )}
                                <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                  <User className="h-5 w-5 text-blue-600" />
                                  {address.name}
                                </h4>
                                {address.isDefault && (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-100 text-blue-600 text-xs font-medium rounded-full">
                                    <Star className="h-3 w-3 fill-current" />
                                    Mặc định
                                  </span>
                                )}
                              </div>
                              <div className="space-y-2 text-gray-600">
                                <div className="flex items-center gap-2">
                                  <Phone className="h-4 w-4" />
                                  <span>{address.phone}</span>
                                </div>
                                <div className="flex items-start gap-2">
                                  <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                  <span className="text-sm">{formatAddress(address)}</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex gap-2">
                              <button
                                onClick={() => handleDuplicate(address)}
                                disabled={loading.create}
                                className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all duration-200 disabled:opacity-50"
                                title="Sao chép"
                              >
                                <Copy className="h-4 w-4" />
                              </button>
                              {!address.isDefault && (
                                <button
                                  onClick={() => handleSetDefault(address.id)}
                                  disabled={loading.update}
                                  className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 disabled:opacity-50"
                                  title="Đặt làm mặc định"
                                >
                                  <Star className="h-4 w-4" />
                                </button>
                              )}
                              <button
                                onClick={() => handleEdit(address)}
                                disabled={loading.update}
                                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 disabled:opacity-50"
                                title="Chỉnh sửa"
                              >
                                <Edit3 className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(address.id)}
                                disabled={loading.delete}
                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 disabled:opacity-50"
                                title="Xóa"
                              >
                                {loading.delete ? (
                                  <RefreshCw className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </button>
                            </div>
                          </div>

                          <div className="pt-4 border-t border-gray-200">
                            <div className="flex items-center justify-between text-xs text-gray-500">
                              <div className="flex items-center gap-2">
                                <Clock className="h-3 w-3" />
                                <span>Tạo: {new Date(address.createdAt).toLocaleDateString('vi-VN')}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <TrendingUp className="h-3 w-3" />
                                <span>Cập nhật: {new Date(address.updatedAt).toLocaleDateString('vi-VN')}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        )}
      </motion.div>
    </>
  )
}