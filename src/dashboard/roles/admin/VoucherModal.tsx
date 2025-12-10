/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/VoucherManagement/components/VoucherModal.tsx

import React, { useState, useEffect } from "react";
import { X, Save, FileText, Calendar, DollarSign } from "lucide-react";
import dayjs from "dayjs";
import type {
    Voucher as VoucherBase, // 1. Đổi tên type gốc để extend
    VoucherPayload,
} from "@/service/voucherService";
import { useToast } from "@/context/ToastContext";

// 2. Định nghĩa lại Type Voucher để khớp với file cha (VoucherManagement)
// Cho phép type là string để nhận POINTS_REWARD, v.v.
type Voucher = Omit<VoucherBase, "type"> & {
  type: string; 
};

// Định nghĩa props cho Modal
interface VoucherModalProps {
  isOpen: boolean;
  onClose: () => void;
  // data sử dụng type Voucher mới đã mở rộng
  data: Voucher | null;
  mode: "create" | "edit" | "view";
  onSubmit: (data: VoucherPayload) => Promise<void>;
  isLoading: boolean;
}

const DEFAULT_FORM_DATA: VoucherPayload = {
  name: "",
  code: "",
  startDate: dayjs().format("YYYY-MM-DDTHH:mm"),
  endDate: dayjs().add(7, "day").format("YYYY-MM-DDTHH:mm"),
  amount: 0,
  description: "",
  point: 0,
  type: "PERCENTAGE", // Mặc định là PERCENTAGE
  status: true,
  orderId: 0,
  usageLimit: 1,
  minimumOrderAmount: 0,
};

// Map các loại Voucher sang tên tiếng Việt
const VOUCHER_TYPES_VIETNAMESE = {
    PERCENTAGE: "Giảm theo Phần trăm (%)",
    FIXED_AMOUNT: "Giảm theo Số tiền (VNĐ)",
    FREE_SHIPPING: "Miễn phí Vận chuyển",
    BUY_ONE_GET_ONE: "Mua 1 Tặng 1",
    CASHBACK: "Hoàn tiền",
    POINTS_REWARD: "Thưởng Điểm",
};

const VoucherModal: React.FC<VoucherModalProps> = ({
  isOpen,
  onClose,
  data,
  mode,
  onSubmit,
  isLoading,
}) => {
  const { showToast } = useToast();
  const [formData, setFormData] = useState<VoucherPayload>(
    DEFAULT_FORM_DATA
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Cập nhật form data khi data hoặc mode thay đổi
  useEffect(() => {
    if (!isOpen) {
      setFormData(DEFAULT_FORM_DATA);
      setErrors({});
      return;
    }

    if (mode === "create") {
      setFormData(DEFAULT_FORM_DATA);
    } else if (data) {
      // Chuyển đổi data API sang format của form
      setFormData({
        name: data.name,
        code: data.code,
        // Chuyển đổi ngày tháng sang format input datetime-local
        startDate: dayjs(data.startDate).format("YYYY-MM-DDTHH:mm"),
        endDate: dayjs(data.endDate).format("YYYY-MM-DDTHH:mm"),
        amount: data.amount,
        description: data.description,
        point: data.point,
        // 3. Ép kiểu as any cho type để tránh lỗi nếu VoucherPayload yêu cầu enum chặt chẽ
        type: data.type as any,
        status: data.status,
        orderId: data.orderId,
        usageLimit: data.usageLimit,
        minimumOrderAmount: data.minimumOrderAmount,
      });
    }
  }, [isOpen, data, mode]);

  const isReadOnly = mode === "view";
  const modalTitle =
    mode === "create"
      ? "Tạo Voucher Mới"
      : mode === "edit"
      ? `Chỉnh Sửa Voucher #${data?.id}`
      : `Chi Tiết Voucher #${data?.id}`;

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value, type } = e.target;
    // Xử lý checkbox riêng
    const newValue =
      type === "checkbox"
        ? (e.target as HTMLInputElement).checked
        : type === "number"
        ? parseFloat(value) || 0
        : value;

    setFormData((prev) => ({ ...prev, [name]: newValue }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = "Tên voucher không được để trống.";
    if (!formData.code.trim()) newErrors.code = "Mã code không được để trống.";
    
    // Chỉ kiểm tra amount > 0 nếu không phải là BOGO, Free Shipping hoặc Thưởng Điểm
    if (
        formData.type !== 'BUY_ONE_GET_ONE' && 
        formData.type !== 'FREE_SHIPPING' && 
        formData.type !== 'POINTS_REWARD' && 
        formData.amount <= 0
    ) {
        newErrors.amount = "Giá trị phải lớn hơn 0.";
    }

    if (dayjs(formData.startDate).isAfter(dayjs(formData.endDate))) {
      newErrors.endDate = "Ngày kết thúc phải sau ngày bắt đầu.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return;

    if (!validateForm()) {
      showToast({
        type: "error",
        title: "Lỗi dữ liệu",
        description: "Vui lòng kiểm tra lại các trường bị lỗi.",
      });
      return;
    }

    // Chuyển đổi định dạng ngày tháng sang ISO 8601
    const payload: VoucherPayload = {
        ...formData,
        startDate: dayjs(formData.startDate).toISOString(),
        endDate: dayjs(formData.endDate).toISOString(),
    };

    await onSubmit(payload);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div
        className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="relative w-full max-w-2xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-white dark:bg-gray-900 z-10">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
            {modalTitle}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            title="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Tên Voucher */}
            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tên Voucher <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                readOnly={isReadOnly}
                className={`w-full p-2 border ${errors.name ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 ${isReadOnly ? 'bg-gray-100 dark:bg-gray-700' : ''}`}
                placeholder="Ví dụ: Giảm 10% dịp lễ"
              />
              {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
            </div>

            {/* Mã Code */}
            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Mã Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="code"
                value={formData.code}
                onChange={handleChange}
                readOnly={isReadOnly || mode === 'edit'}
                className={`w-full p-2 border ${errors.code ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-emerald-500 focus:border-emerald-500 uppercase dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 ${isReadOnly || mode === 'edit' ? 'bg-gray-100 dark:bg-gray-700' : ''}`}
                placeholder="Ví dụ: SALE10"
              />
              {errors.code && <p className="text-xs text-red-500 mt-1">{errors.code}</p>}
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Ngày bắt đầu */}
            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 items-center gap-1">
                <Calendar className="w-4 h-4 text-gray-500"/> Ngày Bắt Đầu
              </label>
              <input
                type="datetime-local"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                readOnly={isReadOnly}
                className={`w-full p-2 border ${errors.startDate ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 ${isReadOnly ? 'bg-gray-100 dark:bg-gray-700' : ''}`}
              />
            </div>

            {/* Ngày kết thúc */}
            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 items-center gap-1">
              <Calendar className="w-4 h-4 text-gray-500"/> Ngày Kết Thúc <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
                readOnly={isReadOnly}
                className={`w-full p-2 border ${errors.endDate ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 ${isReadOnly ? 'bg-gray-100 dark:bg-gray-700' : ''}`}
              />
              {errors.endDate && <p className="text-xs text-red-500 mt-1">{errors.endDate}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Loại Voucher */}
            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Loại Voucher
              </label>
              <div className={`relative ${isReadOnly ? 'opacity-70 cursor-not-allowed' : ''}`}>
                <select
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    disabled={isReadOnly}
                    className="w-full p-2 border border-gray-300 rounded-lg appearance-none bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 focus:ring-emerald-500 focus:border-emerald-500"
                >
                    {Object.entries(VOUCHER_TYPES_VIETNAMESE).map(([key, value]) => (
                        <option key={key} value={key}>
                            {value}
                        </option>
                    ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-300">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                </div>
              </div>
            </div>

            {/* Giá trị / Số tiền */}
            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              <DollarSign className="w-4 h-4 inline-block text-gray-500 mr-1"/> 
                Giá trị ({formData.type === 'PERCENTAGE' ? '%' : formData.type === 'POINTS_REWARD' ? 'Điểm' : 'VNĐ'}) 
                <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                readOnly={isReadOnly}
                min={0}
                className={`w-full p-2 border ${errors.amount ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 ${isReadOnly ? 'bg-gray-100 dark:bg-gray-700' : ''}`}
                placeholder={formData.type === 'PERCENTAGE' ? "0-100" : "Số tiền/Điểm"}
              />
              {errors.amount && <p className="text-xs text-red-500 mt-1">{errors.amount}</p>}
            </div>

            {/* Giới hạn sử dụng */}
            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Giới hạn sử dụng
              </label>
              <input
                type="number"
                name="usageLimit"
                value={formData.usageLimit}
                onChange={handleChange}
                readOnly={isReadOnly}
                min={1}
                className={`w-full p-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 ${isReadOnly ? 'bg-gray-100 dark:bg-gray-700' : ''}`}
                placeholder="Số lần"
              />
            </div>
          </div>

          {/* Mô tả */}
          <div className="col-span-full">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            <FileText className="w-4 h-4 inline-block text-gray-500 mr-1"/> Mô tả
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              readOnly={isReadOnly}
              rows={3}
              className={`w-full p-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 ${isReadOnly ? 'bg-gray-100 dark:bg-gray-700' : ''}`}
              placeholder="Nhập mô tả chi tiết về voucher..."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Đơn hàng tối thiểu */}
              <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              ĐH Tối thiểu
              </label>
              <input
                type="number"
                name="minimumOrderAmount"
                value={formData.minimumOrderAmount}
                onChange={handleChange}
                readOnly={isReadOnly}
                min={0}
                className={`w-full p-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 ${isReadOnly ? 'bg-gray-100 dark:bg-gray-700' : ''}`}
                placeholder="VNĐ"
              />
            </div>

            {/* Trạng thái (Status) */}
            <div className="col-span-1 flex items-end">
                <div className="flex items-center">
                    <input
                        id="status"
                        name="status"
                        type="checkbox"
                        checked={formData.status}
                        onChange={handleChange}
                        disabled={isReadOnly}
                        className="h-4 w-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                    />
                    <label htmlFor="status" className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                        Áp dụng (Active)
                    </label>
                </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 flex justify-end gap-3 z-10">
          <button
            onClick={onClose}
            type="button"
            className="px-6 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors"
          >
            {isReadOnly ? "Đóng" : "Hủy"}
          </button>
          {!isReadOnly && (
            <button
              onClick={handleSubmit}
              type="submit"
              disabled={isLoading}
              className={`px-6 py-2.5 rounded-xl text-sm font-semibold text-white shadow-lg dark:shadow-none transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2 ${isLoading ? 'bg-emerald-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200/50'}`}
            >
              {isLoading ? (
                <>
                  <Save className="w-4 h-4 animate-pulse" /> Đang Lưu...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" /> Lưu Voucher
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default VoucherModal;