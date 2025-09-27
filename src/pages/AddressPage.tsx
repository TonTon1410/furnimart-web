"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import {
  MapPin,
  Plus,
  Edit3,
  Trash2,
  Save,
  X,
  Home,
  Building,
  User,
  Phone,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Star,
  MapIcon,
  Navigation,
} from "lucide-react"
import { authService } from "@/service/authService"
import { addressService, type Address } from "@/service/addressService"

const fadeUp = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }
const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

export default function AddressPage() {
  const [addresses, setAddresses] = useState<Address[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [error, setError] = useState<string>("")
  const [success, setSuccess] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [createForm, setCreateForm] = useState({
    name: "",
    phone: "",
    city: "",
    district: "",
    ward: "",
    addressLine: "",
    isDefault: false
  })

  const [editForm, setEditForm] = useState({
    name: "",
    phone: "",
    city: "",
    district: "",
    ward: "",
    addressLine: "",
    isDefault: false
  })

  useEffect(() => {
    const isAuth = authService.isAuthenticated()
    if (!isAuth) {
      window.location.href = "/login"
      return
    }
    fetchAddresses()
  }, [])

  const fetchAddresses = async () => {
    try {
      setIsLoading(true)
      setError("")
      
      const response = await addressService.getAddresses()
      
      // Xử lý response data an toàn
      if (response && response.data && Array.isArray(response.data)) {
        setAddresses(response.data)
      } else {
        setAddresses([])
        console.warn("Response data is not an array:", response)
      }
    } catch (error: any) {
      console.error("Fetch addresses error:", error)
      
      if (error.status === 401) {
        authService.logout()
        window.location.href = "/login"
        return
      }
      
      setError(error.message || "Không thể tải danh sách địa chỉ. Vui lòng thử lại.")
      setAddresses([])
    } finally {
      setIsLoading(false)
    }
  }

  const resetCreateForm = () => {
    setCreateForm({
      name: "",
      phone: "",
      city: "",
      district: "",
      ward: "",
      addressLine: "",
      isDefault: false
    })
  }

  const handleCreate = async () => {
    if (!createForm.name.trim() || !createForm.phone.trim() || !createForm.addressLine.trim()) {
      setError("Vui lòng điền đầy đủ thông tin bắt buộc (Họ tên, Số điện thoại, Địa chỉ chi tiết)")
      return
    }

    if (isSubmitting) return;

    try {
      setIsSubmitting(true)
      setError("")
      
      const response = await addressService.createAddress(createForm)
      
      if (response && response.data) {
        // Refresh lại danh sách để đảm bảo dữ liệu mới nhất
        await fetchAddresses()
        resetCreateForm()
        setIsCreating(false)
        setSuccess("Thêm địa chỉ thành công!")
        setTimeout(() => setSuccess(""), 5000)
      } else {
        throw new Error("Không nhận được dữ liệu địa chỉ từ server")
      }
    } catch (error: any) {
      console.error("Create address error:", error)
      setError(error.message || "Thêm địa chỉ thất bại. Vui lòng thử lại.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = (address: Address) => {
    if (!address || !address.id) {
      setError("Thông tin địa chỉ không hợp lệ")
      return
    }

    setEditingId(address.id)
    setEditForm({
      name: address.name || "",
      phone: address.phone || "",
      city: address.city || "",
      district: address.district || "",
      ward: address.ward || "",
      addressLine: address.addressLine || "",
      isDefault: Boolean(address.isDefault)
    })
    setError("")
  }

  const handleUpdate = async () => {
    if (!editingId) return

    if (!editForm.name.trim() || !editForm.phone.trim() || !editForm.addressLine.trim()) {
      setError("Vui lòng điền đầy đủ thông tin bắt buộc")
      return
    }

    if (isSubmitting) return;

    try {
      setIsSubmitting(true)
      setError("")
      
      const response = await addressService.updateAddress(editingId, editForm)
      
      if (response && response.data) {
        // Refresh lại danh sách để đảm bảo dữ liệu mới nhất
        await fetchAddresses()
        setEditingId(null)
        setSuccess("Cập nhật địa chỉ thành công!")
        setTimeout(() => setSuccess(""), 5000)
      } else {
        throw new Error("Không nhận được dữ liệu cập nhật từ server")
      }
    } catch (error: any) {
      console.error("Update address error:", error)
      setError(error.message || "Cập nhật địa chỉ thất bại. Vui lòng thử lại.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!id || !id.trim()) {
      setError("ID địa chỉ không hợp lệ")
      return
    }

    if (!confirm("Bạn có chắc chắn muốn xóa địa chỉ này?")) return

    if (isSubmitting) return;

    try {
      setIsSubmitting(true)
      setError("")
      
      await addressService.deleteAddress(id)
      
      // Refresh lại danh sách
      await fetchAddresses()
      setSuccess("Xóa địa chỉ thành công!")
      setTimeout(() => setSuccess(""), 5000)
    } catch (error: any) {
      console.error("Delete address error:", error)
      setError(error.message || "Xóa địa chỉ thất bại. Vui lòng thử lại.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSetDefault = async (id: string) => {
    if (!id || !id.trim()) {
      setError("ID địa chỉ không hợp lệ")
      return
    }

    if (isSubmitting) return;

    try {
      setIsSubmitting(true)
      setError("")
      
      await addressService.setDefaultAddress(id)
      
      // Refresh lại danh sách để đảm bảo trạng thái mặc định được cập nhật
      await fetchAddresses()
      setSuccess("Đã đặt làm địa chỉ mặc định!")
      setTimeout(() => setSuccess(""), 5000)
    } catch (error: any) {
      console.error("Set default address error:", error)
      setError(error.message || "Đặt địa chỉ mặc định thất bại. Vui lòng thử lại.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatAddress = (address: Address) => {
    if (!address) return ""
    return addressService.formatAddress(address)
  }

  const handleCancelCreate = () => {
    setIsCreating(false)
    resetCreateForm()
    setError("")
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setError("")
  }

  const handleRefresh = async () => {
    await fetchAddresses()
  }

  if (isLoading) {
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
              
              {/* Refresh Button */}
              <div className="mt-4">
                <button
                  onClick={handleRefresh}
                  disabled={isLoading}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-muted hover:bg-muted/80 text-foreground rounded-lg transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                  Làm mới
                </button>
              </div>
            </motion.div>

            {/* Error/Success Messages */}
            {error && (
              <motion.div
                variants={fadeUp}
                className="p-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-xl flex items-start justify-between"
              >
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-semibold mb-1">Có lỗi xảy ra</div>
                    <div className="text-sm opacity-90">{error}</div>
                  </div>
                </div>
                <button onClick={() => setError("")} className="text-destructive/60 hover:text-destructive p-1">
                  <X className="h-4 w-4" />
                </button>
              </motion.div>
            )}

            {success && (
              <motion.div
                variants={fadeUp}
                className="p-4 bg-green-50 border border-green-200 text-green-800 rounded-xl flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">{success}</span>
                </div>
                <button onClick={() => setSuccess("")} className="text-green-600 hover:text-green-800 p-1">
                  <X className="h-4 w-4" />
                </button>
              </motion.div>
            )}

            {/* Add New Address Button */}
            {!isCreating && (
              <motion.div variants={fadeUp} className="text-center">
                <button
                  onClick={() => setIsCreating(true)}
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all duration-200 font-medium shadow-lg disabled:opacity-50"
                >
                  <Plus className="h-5 w-5" />
                  Thêm địa chỉ mới
                </button>
              </motion.div>
            )}

            {/* Create Form */}
            {isCreating && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-card rounded-2xl shadow-xl border border-border/50 p-6"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-foreground flex items-center gap-2">
                    <Plus className="h-6 w-6 text-primary" />
                    Thêm địa chỉ mới
                  </h3>
                  <button
                    onClick={handleCancelCreate}
                    disabled={isSubmitting}
                    className="p-2 hover:bg-muted rounded-lg transition-colors disabled:opacity-50"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-2">
                      Họ và tên *
                    </label>
                    <input
                      type="text"
                      value={createForm.name}
                      onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                      disabled={isSubmitting}
                      className="w-full px-3 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-card text-foreground disabled:opacity-50"
                      placeholder="Nhập họ và tên"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-2">
                      Số điện thoại *
                    </label>
                    <input
                      type="tel"
                      value={createForm.phone}
                      onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                      disabled={isSubmitting}
                      className="w-full px-3 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-card text-foreground disabled:opacity-50"
                      placeholder="Nhập số điện thoại"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-2">
                      Tỉnh/Thành phố
                    </label>
                    <input
                      type="text"
                      value={createForm.city}
                      onChange={(e) => setCreateForm({ ...createForm, city: e.target.value })}
                      disabled={isSubmitting}
                      className="w-full px-3 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-card text-foreground disabled:opacity-50"
                      placeholder="Nhập tỉnh/thành phố"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-2">
                      Quận/Huyện
                    </label>
                    <input
                      type="text"
                      value={createForm.district}
                      onChange={(e) => setCreateForm({ ...createForm, district: e.target.value })}
                      disabled={isSubmitting}
                      className="w-full px-3 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-card text-foreground disabled:opacity-50"
                      placeholder="Nhập quận/huyện"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-2">
                      Phường/Xã
                    </label>
                    <input
                      type="text"
                      value={createForm.ward}
                      onChange={(e) => setCreateForm({ ...createForm, ward: e.target.value })}
                      disabled={isSubmitting}
                      className="w-full px-3 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-card text-foreground disabled:opacity-50"
                      placeholder="Nhập phường/xã"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    Địa chỉ chi tiết *
                  </label>
                  <textarea
                    value={createForm.addressLine}
                    onChange={(e) => setCreateForm({ ...createForm, addressLine: e.target.value })}
                    rows={3}
                    disabled={isSubmitting}
                    className="w-full px-3 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-card text-foreground resize-none disabled:opacity-50"
                    placeholder="Số nhà, tên đường, khu vực..."
                  />
                </div>

                <div className="mt-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={createForm.isDefault}
                      onChange={(e) => setCreateForm({ ...createForm, isDefault: e.target.checked })}
                      disabled={isSubmitting}
                      className="rounded border-border text-primary focus:ring-primary disabled:opacity-50"
                    />
                    <span className="text-sm font-medium text-foreground">Đặt làm địa chỉ mặc định</span>
                  </label>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={handleCreate}
                    disabled={isSubmitting}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all duration-200 font-medium disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground"></div>
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
                    disabled={isSubmitting}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-muted text-foreground rounded-xl hover:bg-muted/80 transition-all duration-200 font-medium disabled:opacity-50"
                  >
                    <X className="h-4 w-4" />
                    Hủy
                  </button>
                </div>
              </motion.div>
            )}

            {/* Address List */}
            <motion.div variants={fadeUp} className="space-y-4">
              {addresses.length === 0 ? (
                <div className="text-center py-12 bg-card rounded-2xl shadow-xl border border-border/50">
                  <MapIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-foreground mb-2">Chưa có địa chỉ nào</h3>
                  <p className="text-muted-foreground mb-4">Thêm địa chỉ giao hàng để thuận tiện cho việc mua sắm</p>
                  {!isCreating && (
                    <button
                      onClick={() => setIsCreating(true)}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                      Thêm địa chỉ đầu tiên
                    </button>
                  )}
                </div>
              ) : (
                addresses.map((address) => (
                  <motion.div
                    key={address.id}
                    variants={fadeUp}
                    className="bg-card rounded-2xl shadow-xl border border-border/50 p-6 hover:shadow-2xl transition-all duration-200"
                  >
                    {editingId === address.id ? (
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-lg font-semibold text-foreground flex items-center gap-2">
                            <Edit3 className="h-5 w-5 text-primary" />
                            Chỉnh sửa địa chỉ
                          </h4>
                          <button
                            onClick={handleCancelEdit}
                            disabled={isSubmitting}
                            className="p-1 hover:bg-muted rounded transition-colors disabled:opacity-50"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-semibold text-foreground mb-2">
                              Họ và tên *
                            </label>
                            <input
                              type="text"
                              value={editForm.name}
                              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                              disabled={isSubmitting}
                              className="w-full px-3 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-card text-foreground disabled:opacity-50"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-semibold text-foreground mb-2">
                              Số điện thoại *
                            </label>
                            <input
                              type="tel"
                              value={editForm.phone}
                              onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                              disabled={isSubmitting}
                              className="w-full px-3 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-card text-foreground disabled:opacity-50"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-semibold text-foreground mb-2">
                              Tỉnh/Thành phố
                            </label>
                            <input
                              type="text"
                              value={editForm.city}
                              onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                              disabled={isSubmitting}
                              className="w-full px-3 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-card text-foreground disabled:opacity-50"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-semibold text-foreground mb-2">
                              Quận/Huyện
                            </label>
                            <input
                              type="text"
                              value={editForm.district}
                              onChange={(e) => setEditForm({ ...editForm, district: e.target.value })}
                              disabled={isSubmitting}
                              className="w-full px-3 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-card text-foreground disabled:opacity-50"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-semibold text-foreground mb-2">
                              Phường/Xã
                            </label>
                            <input
                              type="text"
                              value={editForm.ward}
                              onChange={(e) => setEditForm({ ...editForm, ward: e.target.value })}
                              disabled={isSubmitting}
                              className="w-full px-3 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-card text-foreground disabled:opacity-50"
                            />
                          </div>
                        </div>

                        <div className="mt-4">
                          <label className="block text-sm font-semibold text-foreground mb-2">
                            Địa chỉ chi tiết *
                          </label>
                          <textarea
                            value={editForm.addressLine}
                            onChange={(e) => setEditForm({ ...editForm, addressLine: e.target.value })}
                            rows={3}
                            disabled={isSubmitting}
                            className="w-full px-3 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-card text-foreground resize-none disabled:opacity-50"
                          />
                        </div>

                        <div className="flex gap-3 mt-4">
                          <button
                            onClick={handleUpdate}
                            disabled={isSubmitting}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all duration-200 font-medium disabled:opacity-50"
                          >
                            {isSubmitting ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground"></div>
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
                            disabled={isSubmitting}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-muted text-foreground rounded-xl hover:bg-muted/80 transition-all duration-200 font-medium disabled:opacity-50"
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
                              <h4 className="text-lg font-semibold text-foreground flex items-center gap-2">
                                <User className="h-5 w-5 text-primary" />
                                {address.name}
                              </h4>
                              {address.isDefault && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full">
                                  <Star className="h-3 w-3 fill-current" />
                                  Mặc định
                                </span>
                              )}
                            </div>
                            <div className="space-y-2 text-muted-foreground">
                              <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4" />
                                <span>{address.phone}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4" />
                                <span>{formatAddress(address)}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            {!address.isDefault && (
                              <button
                                onClick={() => handleSetDefault(address.id)}
                                disabled={isSubmitting}
                                className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-all duration-200 disabled:opacity-50"
                                title="Đặt làm mặc định"
                              >
                                <Star className="h-4 w-4" />
                              </button>
                            )}
                            <button
                              onClick={() => handleEdit(address)}
                              disabled={isSubmitting}
                              className="p-2 text-muted-foreground hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 disabled:opacity-50"
                              title="Chỉnh sửa"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(address.id)}
                              disabled={isSubmitting}
                              className="p-2 text-muted-foreground hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 disabled:opacity-50"
                              title="Xóa"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>

                        <div className="pt-4 border-t border-border/50">
                          <div className="flex items-center justify-between text-sm text-muted-foreground">
                            <span>Tạo lúc: {new Date(address.createdAt).toLocaleDateString('vi-VN')}</span>
                            <span>Cập nhật: {new Date(address.updatedAt).toLocaleDateString('vi-VN')}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))
              )}
            </motion.div>
          </motion.div>
        
  )
}