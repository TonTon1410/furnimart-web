import React, { useEffect, useMemo, useState } from "react";
import CustomDropdown from "@/components/CustomDropdown";

export type Status = "ACTIVE" | "INACTIVE";
export type Role = "STAFF" | "MANAGER" | "DELIVERY";

export interface EmployeeFormValues {
  fullName: string;
  password?: string;
  storeId?: string;
  email?: string;
  phone?: string;
  avatar?: string;
  gender: boolean;
  birthday?: string;
  role?: Role;
  status: Status;
  cccd?: string;
}

export interface Store {
  id: string;
  name: string;
  city: string;
  district: string | null;
  ward: string;
  street: string;
  addressLine: string;
}

type Props = {
  mode?: "create" | "edit"; // Chế độ: tạo mới hoặc chỉnh sửa
  initial?: EmployeeFormValues;
  submitting?: boolean;
  serverMsg?: string | null;
  serverErr?: string | null;
  stores?: Store[]; // Danh sách cửa hàng
  onSubmit: (values: EmployeeFormValues) => Promise<void> | void;
  onCancel?: () => void;
};

const EmployeeForm: React.FC<Props> = ({
  mode = "create",
  initial,
  submitting = false,
  serverMsg,
  serverErr,
  stores = [],
  onSubmit,
  onCancel,
}) => {
  const [form, setForm] = useState<EmployeeFormValues>({
    fullName: initial?.fullName ?? "",
    password: initial?.password ?? "",
    storeId: initial?.storeId ?? "",
    email: initial?.email ?? "",
    phone: initial?.phone ?? "",
    avatar: initial?.avatar ?? "",
    gender: initial?.gender ?? true,
    birthday: initial?.birthday ?? "",
    role: initial?.role ?? "STAFF",
    status: initial?.status ?? "ACTIVE",
    cccd: initial?.cccd ?? "",
  });

  // preview avatar
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [previewBroken, setPreviewBroken] = useState(false);

  // Đồng bộ khi initial thay đổi
  useEffect(() => {
    if (initial) setForm({ ...initial });
  }, [initial]);

  // cập nhật preview khi avatar thay đổi
  useEffect(() => {
    const url = (form.avatar || "").trim();
    if (url) {
      setPreviewUrl(url);
      setPreviewBroken(false);
    } else {
      setPreviewUrl("");
      setPreviewBroken(false);
    }
  }, [form.avatar]);

  const canSubmit = useMemo(() => {
    const nameValid = form.fullName.trim().length >= 2;

    if (mode === "create") {
      return (
        nameValid &&
        (form.password?.length ?? 0) >= 6 &&
        (form.email?.trim().length ?? 0) > 0
      );
    }

    // Mode edit chỉ cần tên hợp lệ
    return nameValid;
  }, [form, mode]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target as HTMLInputElement;

    if (name === "storeId") {
      console.log("StoreId changed to:", value);
    }

    if (name === "gender") {
      setForm((s) => ({ ...s, gender: value === "true" }));
      return;
    }

    setForm((s) => ({
      ...s,
      [name]: value,
    }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || submitting) return;

    // Format birthday to ISO string nếu có
    let birthdayISO = undefined;
    if (form.birthday) {
      const d = new Date(form.birthday);
      birthdayISO = d.toISOString();
    }

    // Xử lý storeId: chỉ gửi nếu có giá trị thực sự
    const storeIdValue = form.storeId?.trim();

    // Tạo payload với tất cả field bắt buộc
    const payload: EmployeeFormValues = {
      fullName: form.fullName.trim(),
      password: form.password?.trim() || "",
      storeId: storeIdValue || "",
      email: form.email?.trim() || "",
      phone: form.phone?.trim() || "",
      avatar: form.avatar?.trim() || "",
      gender: !!form.gender,
      birthday: birthdayISO || "",
      role: form.role,
      status: form.status,
      cccd: form.cccd?.trim() || "",
    };

    console.log("Payload being sent:", JSON.stringify(payload, null, 2));

    await onSubmit(payload);
  };

  // Style thống nhất (light/dark)
  const inputClass =
    "mt-1 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100 dark:placeholder:text-gray-500";
  const labelClass =
    "block text-sm font-medium text-gray-700 dark:text-gray-200";

  return (
    <form
      onSubmit={submit}
      className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900"
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* ===== Cột 1 ===== */}
        <div className="grid gap-5">
          <div>
            <label htmlFor="fullName" className={labelClass}>
              Họ và tên <span className="text-red-500">*</span>
            </label>
            <input
              id="fullName"
              name="fullName"
              value={form.fullName}
              onChange={handleChange}
              placeholder="Nguyễn Văn A"
              className={inputClass}
            />
          </div>

          {/* Chỉ hiện khi tạo mới */}
          {mode === "create" && (
            <>
              <div>
                <label htmlFor="password" className={labelClass}>
                  Mật khẩu <span className="text-red-500">*</span>
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Tối thiểu 6 ký tự"
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="email" className={labelClass}>
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="name@company.com"
                  className={inputClass}
                />
              </div>
            </>
          )}

          <div>
            <label htmlFor="phone" className={labelClass}>
              Điện thoại
            </label>
            <input
              id="phone"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="09xx xxx xxx"
              className={inputClass}
            />
          </div>

          <div>
            <CustomDropdown
              id="storeId"
              label="Cửa hàng"
              value={form.storeId || ""}
              onChange={(value) => {
                console.log("StoreId changed to:", value);
                setForm((s) => ({ ...s, storeId: value }));
              }}
              options={[
                { value: "", label: "-- Chọn cửa hàng --" },
                ...stores.map((store) => ({
                  value: store.id,
                  label: `${store.name} - ${store.addressLine}, ${store.ward}, ${store.city}`,
                })),
              ]}
              fullWidth
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Để trống nếu chưa gán cửa hàng
            </p>
          </div>

          <div>
            <label htmlFor="cccd" className={labelClass}>
              CCCD
            </label>
            <input
              id="cccd"
              name="cccd"
              value={form.cccd}
              onChange={handleChange}
              placeholder="001234567890"
              className={inputClass}
            />
          </div>
        </div>

        {/* ===== Cột 2 ===== */}
        <div className="grid gap-5">
          {/* Avatar URL + Preview */}
          <div>
            <label htmlFor="avatar" className={labelClass}>
              Ảnh đại diện (URL)
            </label>
            <input
              id="avatar"
              name="avatar"
              value={form.avatar}
              onChange={handleChange}
              placeholder="https://..."
              className={inputClass}
            />
            {/* preview ảnh nếu có URL */}
            {previewUrl && (
              <div className="mt-2">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                  Xem trước
                </div>
                <div className="overflow-hidden rounded-xl ring-1 ring-gray-200 dark:ring-gray-700 bg-white dark:bg-gray-950">
                  {!previewBroken ? (
                    <img
                      src={previewUrl}
                      alt="Avatar preview"
                      className="h-28 w-full object-contain bg-white dark:bg-gray-950"
                      onError={() => setPreviewBroken(true)}
                    />
                  ) : (
                    <div className="h-28 w-full flex items-center justify-center text-xs text-gray-500 dark:text-gray-400">
                      Không tải được ảnh xem trước
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <CustomDropdown
                id="gender"
                label="Giới tính"
                value={String(form.gender)}
                onChange={(value) => {
                  setForm((s) => ({ ...s, gender: value === "true" }));
                }}
                options={[
                  { value: "true", label: "Nam" },
                  { value: "false", label: "Nữ" },
                ]}
                fullWidth
              />
            </div>
            <div>
              <label htmlFor="birthday" className={labelClass}>
                Ngày sinh
              </label>
              <input
                id="birthday"
                name="birthday"
                type="date"
                value={form.birthday || ""}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <CustomDropdown
                id="role"
                label="Vai trò"
                value={form.role || "STAFF"}
                onChange={(value) => {
                  setForm((s) => ({ ...s, role: value as Role }));
                }}
                options={[
                  { value: "STAFF", label: "STAFF" },
                  { value: "MANAGER", label: "MANAGER" },
                  { value: "DELIVERY", label: "DELIVERY" },
                ]}
                fullWidth
              />
            </div>

            <div>
              <CustomDropdown
                id="status"
                label="Trạng thái"
                value={form.status}
                onChange={(value) => {
                  setForm((s) => ({ ...s, status: value as Status }));
                }}
                options={[
                  { value: "ACTIVE", label: "ACTIVE" },
                  { value: "INACTIVE", label: "INACTIVE" },
                ]}
                fullWidth
              />
            </div>
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div className="mt-6 flex items-center gap-3">
        <button
          type="submit"
          disabled={!canSubmit || submitting}
          className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700 dark:hover:bg-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {submitting
            ? mode === "create"
              ? "Đang tạo..."
              : "Đang cập nhật..."
            : mode === "create"
            ? "Tạo nhân viên"
            : "Cập nhật"}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            Huỷ
          </button>
        )}
      </div>

      {serverMsg && (
        <p className="mt-2 text-sm font-medium text-emerald-700 dark:text-emerald-400">
          {serverMsg}
        </p>
      )}
      {serverErr && (
        <p className="mt-1 text-sm font-medium text-red-600 dark:text-red-400">
          {serverErr}
        </p>
      )}
    </form>
  );
};

export default EmployeeForm;
