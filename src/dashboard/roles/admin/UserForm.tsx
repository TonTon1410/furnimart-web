import React, { useEffect, useMemo, useState } from "react";

export type Status = "ACTIVE" | "INACTIVE";
export type Role = "STAFF" | "MANAGER" | "DELIVERY" | "ADMIN";

export interface UserFormValues {
  fullName: string;
  username?: string;
  password?: string;
  email?: string;
  phone?: string;
  avatar?: string;
  gender: boolean;
  birthday?: string;
  role: Role;
  status: Status;
  cccd?: string;
  point?: number;
}

type Props = {
  mode: "create" | "edit";
  initial?: UserFormValues;
  submitting?: boolean;
  serverMsg?: string | null;
  serverErr?: string | null;
  onSubmit: (values: UserFormValues) => Promise<void> | void;
  onCancel?: () => void;
};

const UserForm: React.FC<Props> = ({
  mode,
  initial,
  submitting = false,
  serverMsg,
  serverErr,
  onSubmit,
  onCancel,
}) => {
  const [form, setForm] = useState<UserFormValues>({
    fullName: initial?.fullName ?? "",
    username: initial?.username ?? "",
    password: initial?.password ?? "",
    email: initial?.email ?? "",
    phone: initial?.phone ?? "",
    avatar: initial?.avatar ?? "",
    gender: initial?.gender ?? true,
    birthday: initial?.birthday ?? "",
    role: initial?.role ?? "STAFF",
    status: initial?.status ?? "ACTIVE",
    cccd: initial?.cccd ?? "",
    point: initial?.point ?? 0,
  });

  // preview avatar
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [previewBroken, setPreviewBroken] = useState(false);

  // Đồng bộ khi mở chế độ sửa
  useEffect(() => {
    if (initial) setForm({ ...initial });
  }, [initial, mode]);

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
    if (mode === "create") {
      return (
        form.fullName.trim().length >= 2 &&
        (form.username?.trim().length ?? 0) >= 3 &&
        (form.password?.length ?? 0) >= 6
      );
    }
    return form.fullName.trim().length >= 2;
  }, [form, mode]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target as HTMLInputElement;
    if (name === "gender") {
      setForm((s) => ({ ...s, gender: value === "true" }));
      return;
    }
    if (name === "point") {
      setForm((s) => ({ ...s, point: Number(value) || 0 }));
      return;
    }
    setForm((s) => ({
      ...s,
      [name]: type === "number" ? Number(value) : value,
    }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || submitting) return;
    await onSubmit({
      fullName: form.fullName.trim(),
      username:
        mode === "create" ? form.username?.trim() || undefined : undefined,
      password: mode === "create" ? form.password || undefined : undefined,
      email: form.email?.trim() || undefined,
      phone: form.phone?.trim() || undefined,
      avatar: form.avatar?.trim() || undefined,
      gender: !!form.gender,
      birthday: form.birthday || "",
      role: form.role,
      status: form.status,
      cccd: form.cccd || "",
      point: Number(form.point ?? 0),
    });
  };

  // Style thống nhất (light/dark)
  const inputClass =
    "mt-1 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100 dark:placeholder:text-gray-500";
  const selectClassRound =
    "mt-1 w-full appearance-none rounded-full border border-gray-300 bg-white px-4 py-3 pr-10 text-gray-900 placeholder:text-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100 dark:placeholder:text-gray-500";
  const labelClass =
    "block text-sm font-medium text-gray-700 dark:text-gray-200";

  // Khối Avatar URL + Preview (tái dùng cho 2 cột)
  const AvatarBlock = (
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
  );

  return (
    <form
      onSubmit={submit}
      className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900"
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* ===== Cột 1 ===== */}
        <div className="grid gap-5">
          {/* Khi EDIT: AvatarBlock nằm ở cột 1 (bên trái) */}
          {mode === "edit" && AvatarBlock}

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

          {mode === "create" && (
            <>
              <div>
                <label htmlFor="username" className={labelClass}>
                  Tên đăng nhập <span className="text-red-500">*</span>
                </label>
                <input
                  id="username"
                  name="username"
                  value={form.username}
                  onChange={handleChange}
                  placeholder="vd: nvduy"
                  className={inputClass}
                />
              </div>

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
            </>
          )}

          <div>
            <label htmlFor="email" className={labelClass}>
              Email
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
        </div>

        {/* ===== Cột 2 ===== */}
        <div className="grid gap-5">
          {/* Khi CREATE: AvatarBlock nằm ở cột 2 (bên phải) */}
          {mode === "create" && AvatarBlock}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="gender" className={labelClass}>
                Giới tính
              </label>
              <div className="relative">
                <select
                  id="gender"
                  name="gender"
                  value={String(form.gender)}
                  onChange={handleChange}
                  className={selectClassRound}
                >
                  <option value="true">Nam</option>
                  <option value="false">Nữ</option>
                </select>
                <svg
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500 dark:text-gray-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.25 8.29a.75.75 0 01-.02-1.08z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
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
            {/* Vai trò */}
<div>
  <label htmlFor="role" className={labelClass}>
    Vai trò
  </label>

  {mode === "edit" ? (
    // ✅ EDIT: chỉ hiển thị, không cho chỉnh
    <div
      aria-readonly="true"
      className="mt-1 inline-flex items-center rounded-full px-4 py-2 text-sm font-medium
                 bg-gray-100 text-gray-700 ring-1 ring-inset ring-gray-200
                 dark:bg-gray-800 dark:text-gray-200 dark:ring-gray-700"
      title="Vai trò không thể chỉnh sửa"
    >
      {form.role}
    </div>
  ) : (
    // ✅ CREATE: dropdown bo tròn như cũ
    <div className="relative">
      <select
        id="role"
        name="role"
        value={form.role}
        onChange={handleChange}
        className={selectClassRound} // rounded-full
      >
        <option value="STAFF">STAFF</option>
        <option value="MANAGER">MANAGER</option>
        <option value="DELIVERY">DELIVERY</option>
        <option value="ADMIN">ADMIN</option>
      </select>
      <svg
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500 dark:text-gray-400"
        viewBox="0 0 20 20"
        fill="currentColor"
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.25 8.29a.75.75 0 01-.02-1.08z"
          clipRule="evenodd"
        />
      </svg>
    </div>
  )}
</div>

            <div>
              <label htmlFor="status" className={labelClass}>
                Trạng thái
              </label>
              <div className="relative">
                <select
                  id="status"
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  className={selectClassRound}
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
                <svg
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500 dark:text-gray-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.25 8.29a.75.75 0 01-.02-1.08z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="cccd" className={labelClass}>
                CCCD
              </label>
              <input
                id="cccd"
                name="cccd"
                value={form.cccd || ""}
                onChange={handleChange}
                placeholder="Số CCCD"
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="point" className={labelClass}>
                Điểm tích luỹ
              </label>
              <input
                id="point"
                name="point"
                type="number"
                min={0}
                value={form.point ?? 0}
                onChange={handleChange}
                placeholder="0"
                className={inputClass}
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
          className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700 dark:hover:bg-emerald-500 disabled:opacity-60"
        >
          {submitting
            ? "Đang lưu..."
            : mode === "edit"
            ? "Lưu thay đổi"
            : "Tạo tài khoản"}
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

export default UserForm;
