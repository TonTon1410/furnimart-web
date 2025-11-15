import React, { useState } from "react";
import { Calendar, Clock, ChevronLeft, ChevronRight } from "lucide-react";

interface DateTimePickerProps {
  value: string; // ISO format: "YYYY-MM-DDTHH:mm"
  onChange: (value: string) => void;
  label?: string;
  required?: boolean;
  minDate?: string; // ISO format: "YYYY-MM-DD"
  className?: string;
}

export const DateTimePicker: React.FC<DateTimePickerProps> = ({
  value,
  onChange,
  label = "Chọn ngày giờ",
  required = false,
  minDate,
  className = "",
}) => {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(
    value ? new Date(value) : new Date()
  );
  const datePickerRef = React.useRef<HTMLDivElement>(null);
  const timePickerRef = React.useRef<HTMLDivElement>(null);

  // Close popups when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        datePickerRef.current &&
        !datePickerRef.current.contains(event.target as Node)
      ) {
        setShowDatePicker(false);
      }
      if (
        timePickerRef.current &&
        !timePickerRef.current.contains(event.target as Node)
      ) {
        setShowTimePicker(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedDate = value ? new Date(value) : null;
  const selectedTime = value
    ? {
        hour: new Date(value).getHours(),
        minute: new Date(value).getMinutes(),
      }
    : { hour: 9, minute: 0 };

  const handleDateSelect = (date: Date) => {
    const dateStr = date.toISOString().slice(0, 10);
    const timeStr =
      value?.slice(11, 16) ||
      `${String(selectedTime.hour).padStart(2, "0")}:${String(
        selectedTime.minute
      ).padStart(2, "0")}`;
    onChange(`${dateStr}T${timeStr}`);
    setShowDatePicker(false);
  };

  const handleTimeSelect = (hour: number, minute: number) => {
    const date = selectedDate || new Date();
    const dateStr = date.toISOString().slice(0, 10);
    const timeStr = `${String(hour).padStart(2, "0")}:${String(minute).padStart(
      2,
      "0"
    )}`;
    onChange(`${dateStr}T${timeStr}`);
  };

  const handleTimeConfirm = () => {
    setShowTimePicker(false);
  };

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          {label}
          {required && <span className="text-red-500"> *</span>}
        </label>
      )}

      <div className="grid grid-cols-2 gap-3">
        {/* Date Button */}
        <div className="relative" ref={datePickerRef}>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
            Chọn ngày
          </label>
          <button
            type="button"
            onClick={() => {
              setShowDatePicker(!showDatePicker);
              setShowTimePicker(false);
              if (!selectedDate) {
                setCurrentMonth(new Date());
              }
            }}
            className="w-full flex items-center gap-3 rounded-xl border-2 border-gray-300 bg-white px-3 py-3 text-sm font-medium text-gray-900 shadow-sm transition-all duration-200 hover:border-purple-400 hover:shadow-md focus:border-purple-500 focus:outline-none focus:ring-4 focus:ring-purple-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:hover:border-purple-600"
          >
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900/40 dark:to-purple-800/40 shadow-sm">
              <Calendar className="h-4 w-4 text-purple-700 dark:text-purple-300" />
            </div>
            <span className="flex-1 text-left">
              {selectedDate
                ? selectedDate.toLocaleDateString("vi-VN", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  })
                : "Chọn ngày..."}
            </span>
          </button>

          {/* Calendar Popup */}
          {showDatePicker && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
              <div className="w-full max-w-sm rounded-2xl border-2 border-purple-200 bg-white p-4 shadow-2xl dark:border-purple-800 dark:bg-gray-900 max-h-[90vh] overflow-y-auto">
                {/* Month Navigation */}
                <div className="mb-4 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      const newMonth = new Date(currentMonth);
                      newMonth.setMonth(newMonth.getMonth() - 1);
                      setCurrentMonth(newMonth);
                    }}
                    aria-label="Tháng trước"
                    className="rounded-lg p-2 hover:bg-purple-100 dark:hover:bg-purple-900/30"
                  >
                    <ChevronLeft className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </button>
                  <div className="text-sm font-bold text-gray-900 dark:text-gray-100">
                    Tháng {currentMonth.getMonth() + 1},{" "}
                    {currentMonth.getFullYear()}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const newMonth = new Date(currentMonth);
                      newMonth.setMonth(newMonth.getMonth() + 1);
                      setCurrentMonth(newMonth);
                    }}
                    aria-label="Tháng sau"
                    className="rounded-lg p-2 hover:bg-purple-100 dark:hover:bg-purple-900/30"
                  >
                    <ChevronRight className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </button>
                </div>

                {/* Weekday Headers */}
                <div className="mb-2 grid grid-cols-7 gap-1">
                  {["CN", "T2", "T3", "T4", "T5", "T6", "T7"].map((day) => (
                    <div
                      key={day}
                      className="text-center text-xs font-semibold text-gray-600 dark:text-gray-400"
                    >
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar Days */}
                <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
                  {(() => {
                    const year = currentMonth.getFullYear();
                    const month = currentMonth.getMonth();
                    const firstDay = new Date(year, month, 1).getDay();
                    const daysInMonth = new Date(year, month + 1, 0).getDate();
                    const days = [];
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const minDateObj = minDate ? new Date(minDate) : null;
                    if (minDateObj) minDateObj.setHours(0, 0, 0, 0);

                    // Empty cells for days before month starts
                    for (let i = 0; i < firstDay; i++) {
                      days.push(<div key={`empty-${i}`} />);
                    }

                    // Days of the month
                    for (let day = 1; day <= daysInMonth; day++) {
                      const date = new Date(year, month, day);
                      const isSelected =
                        selectedDate &&
                        date.toDateString() === selectedDate.toDateString();
                      const isPast = minDateObj
                        ? date < minDateObj
                        : date < today;
                      const isToday =
                        date.toDateString() === today.toDateString();

                      days.push(
                        <button
                          key={day}
                          type="button"
                          disabled={isPast}
                          onClick={() => handleDateSelect(date)}
                          className={`relative rounded-lg p-1.5 sm:p-2 text-xs sm:text-sm font-medium transition-all ${
                            isPast
                              ? "cursor-not-allowed text-gray-300 dark:text-gray-700"
                              : isSelected
                              ? "bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-md"
                              : isToday
                              ? "border-2 border-purple-400 text-purple-600 dark:text-purple-400"
                              : "hover:bg-purple-100 text-gray-700 dark:text-gray-300 dark:hover:bg-purple-900/30"
                          }`}
                        >
                          {day}
                        </button>
                      );
                    }

                    return days;
                  })()}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Time Button */}
        <div className="relative" ref={timePickerRef}>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
            Chọn giờ
          </label>
          <button
            type="button"
            onClick={() => {
              setShowTimePicker(!showTimePicker);
              setShowDatePicker(false);
            }}
            className="w-full flex items-center gap-3 rounded-xl border-2 border-gray-300 bg-white px-3 py-3 text-sm font-medium text-gray-900 shadow-sm transition-all duration-200 hover:border-indigo-400 hover:shadow-md focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:hover:border-indigo-600"
          >
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-100 to-indigo-200 dark:from-indigo-900/40 dark:to-indigo-800/40 shadow-sm">
              <Clock className="h-4 w-4 text-indigo-700 dark:text-indigo-300" />
            </div>
            <span className="flex-1 text-left">
              {`${String(selectedTime.hour).padStart(2, "0")}:${String(
                selectedTime.minute
              ).padStart(2, "0")}`}
            </span>
          </button>

          {/* Time Picker Popup */}
          {showTimePicker && (
            <TimePickerPopup
              selectedTime={selectedTime}
              onTimeChange={handleTimeSelect}
              onConfirm={handleTimeConfirm}
            />
          )}
        </div>
      </div>

      {/* Preview Card - Compact Version */}
      {value && (
        <div className="mt-3 flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 p-3 border border-purple-200 dark:border-purple-700">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            <span className="font-medium text-gray-900 dark:text-gray-100">
              {new Date(value).toLocaleDateString("vi-VN", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              })}
            </span>
          </div>
          <div className="w-px h-4 bg-gray-300 dark:bg-gray-600"></div>
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            <span className="font-medium text-gray-900 dark:text-gray-100">
              {new Date(value).toLocaleTimeString("vi-VN", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

interface TimePickerPopupProps {
  selectedTime: { hour: number; minute: number };
  onTimeChange: (hour: number, minute: number) => void;
  onConfirm: () => void;
}

const TimePickerPopup: React.FC<TimePickerPopupProps> = ({
  selectedTime,
  onTimeChange,
  onConfirm,
}) => {
  const [localTime, setLocalTime] = React.useState(selectedTime);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-2xl border-2 border-indigo-200 bg-white p-4 shadow-2xl dark:border-indigo-800 dark:bg-gray-900 max-h-[90vh] overflow-y-auto">
        <div className="mb-3 text-center text-sm font-bold text-gray-900 dark:text-gray-100">
          Chọn giờ
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Hours */}
          <div>
            <div className="mb-2 text-xs font-semibold text-gray-600 dark:text-gray-400">
              Giờ
            </div>
            <div className="max-h-32 space-y-1 overflow-y-auto rounded-lg border border-gray-200 p-1.5 sm:p-2 dark:border-gray-700">
              {Array.from({ length: 24 }, (_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setLocalTime({ ...localTime, hour: i });
                    onTimeChange(i, localTime.minute);
                  }}
                  className={`w-full rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                    localTime.hour === i
                      ? "bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-md"
                      : "hover:bg-indigo-100 text-gray-700 dark:text-gray-300 dark:hover:bg-indigo-900/30"
                  }`}
                >
                  {String(i).padStart(2, "0")}
                </button>
              ))}
            </div>
          </div>

          {/* Minutes */}
          <div>
            <div className="mb-2 text-xs font-semibold text-gray-600 dark:text-gray-400">
              Phút
            </div>
            <div className="max-h-32 space-y-1 overflow-y-auto rounded-lg border border-gray-200 p-1.5 sm:p-2 dark:border-gray-700">
              {Array.from({ length: 60 }, (_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setLocalTime({ ...localTime, minute: i });
                    onTimeChange(localTime.hour, i);
                  }}
                  className={`w-full rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                    localTime.minute === i
                      ? "bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-md"
                      : "hover:bg-indigo-100 text-gray-700 dark:text-gray-300 dark:hover:bg-indigo-900/30"
                  }`}
                >
                  {String(i).padStart(2, "0")}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onConfirm}
          className="mt-3 w-full rounded-lg bg-gradient-to-r from-indigo-500 to-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-md transition-all hover:from-indigo-600 hover:to-indigo-700"
        >
          Xác nhận
        </button>
      </div>
    </div>
  );
};
