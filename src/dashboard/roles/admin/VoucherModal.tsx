/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/VoucherManagement/components/VoucherModal.tsx

import React, { useState, useEffect, useRef } from "react";
import { 
  X, 
  Save, 
  FileText, 
  DollarSign, 
  Calendar, 
  Clock, 
  ChevronLeft, 
  ChevronRight,
  AlertCircle
} from "lucide-react";
import dayjs from "dayjs";
import type {
    Voucher as VoucherBase,
    VoucherPayload,
} from "@/service/voucherService";
import { useToast } from "@/context/ToastContext";

// --- CUSTOM TYPES ---
type Voucher = Omit<VoucherBase, "type"> & {
  type: string; 
};

interface VoucherModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: Voucher | null;
  mode: "create" | "edit" | "view";
  onSubmit: (data: VoucherPayload) => Promise<void>;
  isLoading: boolean;
}

// --- INTERNAL COMPONENT: CustomDateTimePicker ---
interface CustomPickerProps {
    label: string;
    value: string; // ISO String
    onChange: (val: string) => void;
    minDate?: string; // Format YYYY-MM-DD
    readOnly?: boolean;
    required?: boolean;
    error?: string;
}

const CustomDateTimePicker: React.FC<CustomPickerProps> = ({ label, value, onChange, minDate, readOnly, required, error }) => {
    const [showDate, setShowDate] = useState(false);
    const [showTime, setShowTime] = useState(false);
    
    // Parse value
    const dateObj = value ? dayjs(value).toDate() : new Date();
    const [currentMonth, setCurrentMonth] = useState(dateObj);
    
    // --- LOCAL STATE CHO INPUT (FIX LỖI NHẢY SỐ) ---
    // Sử dụng state cục bộ để lưu giá trị người dùng đang gõ
    const [inputHour, setInputHour] = useState("");
    const [inputMinute, setInputMinute] = useState("");

    const containerRef = useRef<HTMLDivElement>(null);

    // Đồng bộ input state khi value thay đổi từ bên ngoài (chỉ khi popup đóng hoặc mới mở)
    useEffect(() => {
        if (value) {
            setInputHour(dayjs(value).format("HH"));
            setInputMinute(dayjs(value).format("mm"));
        }
    }, [value, showTime]); // Sync lại khi mở popup time

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setShowDate(false);
                // Khi đóng popup time bằng cách click ra ngoài, trigger save lần cuối nếu cần
                if (showTime) {
                    setShowTime(false);
                }
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [showTime]);

    // --- LOGIC XỬ LÝ DATE ---
    const handleSelectDate = (d: Date) => {
        const timePart = dayjs(value).format("HH:mm");
        const newDateStr = dayjs(d).format("YYYY-MM-DD");
        onChange(`${newDateStr}T${timePart}`);
        setShowDate(false);
    };

    // --- LOGIC XỬ LÝ TIME INPUT (MỚI) ---
    
    // 1. Chỉ cập nhật state cục bộ khi gõ (cho phép xóa trắng, không nhảy focus)
    const handleTyping = (type: 'hour' | 'minute', val: string) => {
        // Chỉ cho phép nhập số
        if (!/^\d*$/.test(val)) return;
        
        if (type === 'hour') setInputHour(val);
        else setInputMinute(val);
    };

    // 2. Logic tính toán và lưu dữ liệu (Dùng chung cho Blur và Enter)
    const commitTimeChange = () => {
        let h = parseInt(inputHour || "0", 10);
        let m = parseInt(inputMinute || "0", 10);

        if (isNaN(h)) h = 0;
        if (isNaN(m)) m = 0;

        // Clamp giá trị
        if (h > 23) h = 23;
        if (m > 59) m = 59;

        // Format lại hiển thị
        const formattedH = String(h).padStart(2, '0');
        const formattedM = String(m).padStart(2, '0');

        setInputHour(formattedH);
        setInputMinute(formattedM);

        // Cập nhật lên Cha
        const datePart = dayjs(value).format("YYYY-MM-DD");
        onChange(`${datePart}T${formattedH}:${formattedM}`);
    };

    // 3. Sự kiện Blur (mất focus) hoặc nhấn Enter
    const handleBlurOrEnter = (e: React.KeyboardEvent | React.FocusEvent) => {
        if (e.type === 'keydown' && (e as React.KeyboardEvent).key !== 'Enter') {
            return;
        }
        commitTimeChange();
    };

    // Render Calendar
    const renderCalendar = () => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const firstDay = new Date(year, month, 1).getDay();
        
        const days = [];
        for (let i = 0; i < firstDay; i++) days.push(<div key={`empty-${i}`} />);
        
        const minDateObj = minDate ? dayjs(minDate).startOf('day') : null;

        for (let d = 1; d <= daysInMonth; d++) {
            const date = new Date(year, month, d);
            const isSelected = dayjs(date).isSame(dayjs(value), 'day');
            const isDisabled = minDateObj ? dayjs(date).isBefore(minDateObj) : false;

            days.push(
                <button
                    key={d}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => handleSelectDate(date)}
                    className={`h-8 w-8 rounded-full text-xs font-medium transition-all
                        ${isSelected ? 'bg-emerald-600 text-white shadow-md' : ''}
                        ${!isSelected && !isDisabled ? 'hover:bg-emerald-50 text-gray-700 dark:text-gray-200 dark:hover:bg-gray-700' : ''}
                        ${isDisabled ? 'text-gray-300 cursor-not-allowed dark:text-gray-600' : ''}
                    `}
                >
                    {d}
                </button>
            );
        }
        return days;
    };

    // Checks visual cho input time (chỉ warning UI)
    const isToday = dayjs(value).isSame(dayjs(), 'day');
    const isMinDateToday = minDate === dayjs().format("YYYY-MM-DD");
    
    // Kiểm tra dựa trên giá trị đang nhập (inputHour/inputMinute) thay vì value cha
    const checkTimeInvalid = () => {
        if (!isToday || !isMinDateToday) return false;
        
        // Parse tạm thời để check
        const h = inputHour === "" ? 0 : parseInt(inputHour, 10);
        const m = inputMinute === "" ? 0 : parseInt(inputMinute, 10);
        
        const currentH = dayjs().hour();
        const currentM = dayjs().minute();

        if (h < currentH) return true;
        if (h === currentH && m < currentM) return true;
        return false;
    };
    const isTimeError = checkTimeInvalid();

    if (readOnly) {
        return (
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {label} {required && <span className="text-red-500">*</span>}
                </label>
                <div className="w-full p-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-500 dark:text-gray-400">
                    {dayjs(value).format("DD/MM/YYYY HH:mm")}
                </div>
            </div>
        );
    }

    return (
        <div className="relative" ref={containerRef}>
             <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            <div className="flex gap-2">
                <button
                    type="button"
                    onClick={() => { setShowDate(!showDate); setShowTime(false); setCurrentMonth(dayjs(value).toDate()); }}
                    className={`flex-1 flex items-center gap-2 p-2 border ${error ? 'border-red-500' : 'border-gray-300'} rounded-lg bg-white dark:bg-gray-800 dark:border-gray-700 hover:border-emerald-500 transition-colors text-sm`}
                >
                    <Calendar className={`w-4 h-4 ${error ? 'text-red-500' : 'text-emerald-600'}`} />
                    <span className="text-gray-900 dark:text-gray-100">{dayjs(value).format("DD/MM/YYYY")}</span>
                </button>

                <button
                    type="button"
                    onClick={() => { setShowTime(!showTime); setShowDate(false); }}
                    className={`w-[100px] flex items-center justify-center gap-2 p-2 border ${error || isTimeError ? 'border-red-500' : 'border-gray-300'} rounded-lg bg-white dark:bg-gray-800 dark:border-gray-700 hover:border-emerald-500 transition-colors text-sm`}
                >
                    <Clock className={`w-4 h-4 ${error || isTimeError ? 'text-red-500' : 'text-emerald-600'}`} />
                    <span className={`text-gray-900 dark:text-gray-100 ${(isTimeError && !error) ? 'text-red-600 font-medium' : ''}`}>
                        {dayjs(value).format("HH:mm")}
                    </span>
                </button>
            </div>
            {error && <p className="text-xs text-red-500 mt-1 font-medium flex items-center gap-1"><AlertCircle className="w-3 h-3"/> {error}</p>}

            {/* DATE PICKER POPUP */}
            {showDate && (
                <div className="absolute top-full left-0 mt-2 w-[280px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-50 p-4 animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex justify-between items-center mb-3">
                        <button type="button" onClick={() => setCurrentMonth(dayjs(currentMonth).subtract(1, 'month').toDate())} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
                            <ChevronLeft className="w-5 h-5 text-gray-500" />
                        </button>
                        <span className="text-sm font-bold text-gray-800 dark:text-white">Tháng {currentMonth.getMonth() + 1}, {currentMonth.getFullYear()}</span>
                        <button type="button" onClick={() => setCurrentMonth(dayjs(currentMonth).add(1, 'month').toDate())} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
                            <ChevronRight className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>
                    <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-gray-400 mb-2 uppercase">
                        <div>CN</div><div>T2</div><div>T3</div><div>T4</div><div>T5</div><div>T6</div><div>T7</div>
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                        {renderCalendar()}
                    </div>
                </div>
            )}

            {/* TIME PICKER POPUP (IMPROVED INPUT) */}
            {showTime && (
                <div className="absolute top-full right-0 mt-2 w-[220px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-50 p-4 animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex flex-col gap-3">
                        <span className="text-xs font-bold text-gray-500 dark:text-gray-400 text-center uppercase">Nhập thời gian</span>
                        <div className="flex items-center justify-center gap-2">
                            {/* Input Giờ */}
                            <div className="flex flex-col items-center gap-1">
                                <label className="text-[10px] text-gray-400">Giờ</label>
                                <input 
                                    type="text" 
                                    maxLength={2}
                                    value={inputHour}
                                    onChange={(e) => handleTyping('hour', e.target.value)}
                                    onBlur={handleBlurOrEnter}
                                    onKeyDown={handleBlurOrEnter}
                                    onFocus={(e) => e.target.select()}
                                    className={`w-14 h-12 text-center text-xl font-bold rounded-lg border focus:ring-2 focus:ring-emerald-200 outline-none
                                        ${isTimeError 
                                            ? 'border-red-300 bg-red-50 text-red-600 dark:bg-red-900/20 dark:border-red-700' 
                                            : 'border-gray-200 bg-gray-50 text-gray-800 dark:bg-gray-900 dark:border-gray-700 dark:text-white focus:border-emerald-500'
                                        }
                                    `}
                                />
                            </div>
                            
                            <span className="text-2xl font-bold text-gray-300 mt-4">:</span>

                            {/* Input Phút */}
                            <div className="flex flex-col items-center gap-1">
                                <label className="text-[10px] text-gray-400">Phút</label>
                                <input 
                                    type="text" 
                                    maxLength={2}
                                    value={inputMinute}
                                    onChange={(e) => handleTyping('minute', e.target.value)}
                                    onBlur={handleBlurOrEnter}
                                    onKeyDown={handleBlurOrEnter}
                                    onFocus={(e) => e.target.select()}
                                    className={`w-14 h-12 text-center text-xl font-bold rounded-lg border focus:ring-2 focus:ring-emerald-200 outline-none
                                        ${isTimeError 
                                            ? 'border-red-300 bg-red-50 text-red-600 dark:bg-red-900/20 dark:border-red-700' 
                                            : 'border-gray-200 bg-gray-50 text-gray-800 dark:bg-gray-900 dark:border-gray-700 dark:text-white focus:border-emerald-500'
                                        }
                                    `}
                                />
                            </div>
                        </div>

                        {/* Thông báo lỗi UI inline */}
                        {isTimeError && (
                            <div className="text-[10px] text-red-500 text-center bg-red-50 dark:bg-red-900/20 p-1.5 rounded">
                                Không thể chọn thời gian trong quá khứ
                            </div>
                        )}

                        <button 
                            type="button"
                            onClick={() => { commitTimeChange(); setShowTime(false); }}
                            className="w-full py-1.5 mt-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors"
                        >
                            Xác nhận
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};


const DEFAULT_FORM_DATA: VoucherPayload = {
  name: "",
  code: "",
  startDate: dayjs().format("YYYY-MM-DDTHH:mm"),
  endDate: dayjs().add(7, "day").format("YYYY-MM-DDTHH:mm"),
  amount: 0,
  description: "",
  point: 0,
  type: "PERCENTAGE", 
  status: true,
  orderId: 0,
  usageLimit: 1,
  minimumOrderAmount: 0,
};

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
  const [formData, setFormData] = useState<VoucherPayload>(DEFAULT_FORM_DATA);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isOpen) {
      setFormData(DEFAULT_FORM_DATA);
      setErrors({});
      return;
    }

    if (mode === "create") {
      setFormData(DEFAULT_FORM_DATA);
    } else if (data) {
      setFormData({
        name: data.name,
        code: data.code,
        startDate: dayjs(data.startDate).format("YYYY-MM-DDTHH:mm"),
        endDate: dayjs(data.endDate).format("YYYY-MM-DDTHH:mm"),
        amount: data.amount,
        description: data.description,
        point: data.point,
        type: data.type as any,
        status: data.status,
        orderId: data.orderId,
        usageLimit: data.usageLimit,
        minimumOrderAmount: data.minimumOrderAmount,
      });
    }
  }, [isOpen, data, mode]);

  const isReadOnly = mode === "view";
  const modalTitle = mode === "create" ? "Tạo Voucher Mới" : mode === "edit" ? `Chỉnh Sửa Voucher #${data?.id}` : `Chi Tiết Voucher #${data?.id}`;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const newValue = type === "checkbox" ? (e.target as HTMLInputElement).checked : type === "number" ? parseFloat(value) || 0 : value;
    setFormData((prev) => ({ ...prev, [name]: newValue }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleStartDateChange = (newVal: string) => {
      setFormData(prev => {
          const start = dayjs(newVal);
          const end = dayjs(prev.endDate);
          let newEnd = prev.endDate;
          if(start.isAfter(end)) {
              newEnd = start.add(7, 'day').format("YYYY-MM-DDTHH:mm");
          }
          return { ...prev, startDate: newVal, endDate: newEnd };
      });
      if (dayjs(newVal).isAfter(dayjs().subtract(1, 'minute'))) {
        setErrors(prev => ({...prev, startDate: ''}));
      }
  }

  const handleEndDateChange = (newVal: string) => {
      setFormData(prev => ({ ...prev, endDate: newVal }));
      setErrors(prev => ({...prev, endDate: ''}));
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    const now = dayjs();

    if (!formData.name.trim()) newErrors.name = "Tên voucher không được để trống.";
    if (!formData.code.trim()) newErrors.code = "Mã code không được để trống.";
    
    if (
        formData.type !== 'BUY_ONE_GET_ONE' && 
        formData.type !== 'FREE_SHIPPING' && 
        formData.type !== 'POINTS_REWARD' && 
        formData.amount <= 0
    ) {
        newErrors.amount = "Giá trị phải lớn hơn 0.";
    }

    if (dayjs(formData.startDate).isBefore(now.subtract(2, 'minute'))) {
        newErrors.startDate = "Thời gian bắt đầu không hợp lệ (không thể chọn quá khứ).";
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
      showToast({ type: "error", title: "Lỗi dữ liệu", description: "Vui lòng kiểm tra lại các trường bị lỗi." });
      return;
    }

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
      <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity" onClick={onClose} />
      <div className="relative w-full max-w-4xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-white dark:bg-gray-900 z-10">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">{modalTitle}</h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Đóng">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tên Voucher <span className="text-red-500">*</span>
              </label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} readOnly={isReadOnly} className={`w-full p-2 border ${errors.name ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 ${isReadOnly ? 'bg-gray-100 dark:bg-gray-700' : ''}`} placeholder="Ví dụ: Giảm 10% dịp lễ" />
              {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
            </div>

            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Mã Code <span className="text-red-500">*</span>
              </label>
              <input type="text" name="code" value={formData.code} onChange={handleChange} readOnly={isReadOnly || mode === 'edit'} className={`w-full p-2 border ${errors.code ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-emerald-500 focus:border-emerald-500 uppercase dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 ${isReadOnly || mode === 'edit' ? 'bg-gray-100 dark:bg-gray-700' : ''}`} placeholder="Ví dụ: SALE10" />
              {errors.code && <p className="text-xs text-red-500 mt-1">{errors.code}</p>}
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
             {/* NGÀY BẮT ĐẦU */}
             <div className="col-span-1">
                <CustomDateTimePicker 
                    label="Ngày Bắt Đầu"
                    value={formData.startDate}
                    onChange={handleStartDateChange}
                    minDate={dayjs().format("YYYY-MM-DD")}
                    readOnly={isReadOnly}
                    required
                    error={errors.startDate}
                />
             </div>

             {/* NGÀY KẾT THÚC */}
             <div className="col-span-1">
                <CustomDateTimePicker 
                    label="Ngày Kết Thúc"
                    value={formData.endDate}
                    onChange={handleEndDateChange}
                    minDate={dayjs(formData.startDate).format("YYYY-MM-DD")}
                    readOnly={isReadOnly}
                    required
                    error={errors.endDate}
                />
             </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Loại Voucher</label>
              <div className={`relative ${isReadOnly ? 'opacity-70 cursor-not-allowed' : ''}`}>
                <select name="type" value={formData.type} onChange={handleChange} disabled={isReadOnly} className="w-full p-2 border border-gray-300 rounded-lg appearance-none bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 focus:ring-emerald-500 focus:border-emerald-500">
                    {Object.entries(VOUCHER_TYPES_VIETNAMESE).map(([key, value]) => (<option key={key} value={key}>{value}</option>))}
                </select>
              </div>
            </div>

            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                <DollarSign className="w-4 h-4 inline-block text-gray-500 mr-1"/> 
                Giá trị ({formData.type === 'PERCENTAGE' ? '%' : formData.type === 'POINTS_REWARD' ? 'Điểm' : 'VNĐ'}) <span className="text-red-500">*</span>
              </label>
              <input type="number" name="amount" value={formData.amount} onChange={handleChange} readOnly={isReadOnly} min={0} className={`w-full p-2 border ${errors.amount ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 ${isReadOnly ? 'bg-gray-100 dark:bg-gray-700' : ''}`} placeholder={formData.type === 'PERCENTAGE' ? "0-100" : "Số tiền/Điểm"} />
              {errors.amount && <p className="text-xs text-red-500 mt-1">{errors.amount}</p>}
            </div>

            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Giới hạn sử dụng</label>
              <input type="number" name="usageLimit" value={formData.usageLimit} onChange={handleChange} readOnly={isReadOnly} min={1} className={`w-full p-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 ${isReadOnly ? 'bg-gray-100 dark:bg-gray-700' : ''}`} placeholder="Số lần" />
            </div>
          </div>

          <div className="col-span-full">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"><FileText className="w-4 h-4 inline-block text-gray-500 mr-1"/> Mô tả</label>
            <textarea name="description" value={formData.description} onChange={handleChange} readOnly={isReadOnly} rows={3} className={`w-full p-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 ${isReadOnly ? 'bg-gray-100 dark:bg-gray-700' : ''}`} placeholder="Nhập mô tả chi tiết về voucher..." />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ĐH Tối thiểu</label>
              <input type="number" name="minimumOrderAmount" value={formData.minimumOrderAmount} onChange={handleChange} readOnly={isReadOnly} min={0} className={`w-full p-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 ${isReadOnly ? 'bg-gray-100 dark:bg-gray-700' : ''}`} placeholder="VNĐ" />
            </div>

            {/* --- SWITCH BUTTON --- */}
            <div className="col-span-1 flex flex-col justify-end">
               <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                 Trạng thái
               </label>
               <div className="flex items-center gap-3">
                 <button
                   type="button"
                   disabled={isReadOnly}
                   onClick={() => setFormData(prev => ({ ...prev, status: !prev.status }))}
                   className={`
                     relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-200 focus:outline-none
                     ${formData.status ? 'bg-emerald-600' : 'bg-red-500'}
                     ${isReadOnly ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                   `}
                 >
                   <span
                     className={`
                       inline-block h-5 w-5 transform rounded-full bg-white transition-transform duration-200 shadow-md
                       ${formData.status ? 'translate-x-6' : 'translate-x-1'}
                     `}
                   />
                 </button>
                 <span className={`text-sm font-semibold ${formData.status ? 'text-emerald-600' : 'text-red-500'}`}>
                   {formData.status ? 'Hoạt động' : 'Vô hiệu'}
                 </span>
               </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 flex justify-end gap-3 z-10">
          <button onClick={onClose} type="button" className="px-6 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors">
            {isReadOnly ? "Đóng" : "Hủy"}
          </button>
          {!isReadOnly && (
            <button onClick={handleSubmit} type="submit" disabled={isLoading} className={`px-6 py-2.5 rounded-xl text-sm font-semibold text-white shadow-lg dark:shadow-none transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2 ${isLoading ? 'bg-emerald-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200/50'}`}>
              {isLoading ? <><Save className="w-4 h-4 animate-pulse" /> Đang Lưu...</> : <><Save className="w-4 h-4" /> Lưu Voucher</>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default VoucherModal;