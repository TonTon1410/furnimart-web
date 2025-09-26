import React, { useMemo, useState } from "react";
import {
  CheckCircle2,
  ImageIcon,
  Loader2,
  Tags,
  AtSign,
  Phone as PhoneIcon,
  KeySquare,
  Calendar,
} from "lucide-react";

export type Status = "ACTIVE" | "INACTIVE";
export type Role = "STAFF" | "MANAGER" | "DELIVERY" | "ADMIN";

export interface UserFormValues {
  fullName: string;
  username?: string; // chỉ dùng khi create
  password?: string; // chỉ dùng khi create
  email?: string;
  phone?: string;
  avatar?: string;
  gender: boolean;      // true = Nam, false = Nữ
  birthday?: string;    // 'YYYY-MM-DD' hoặc ''
  role: Role;           // STAFF | MANAGER | DELIVERY | ADMIN
  status: Status;       // ACTIVE | INACTIVE
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

const fallbackImg =
  "https://images.unsplash.com/photo-1616627981169-f97ab76673be?auto=format&fit=crop&w=1200&q=80";

const onImgError = (e: React.SyntheticEvent<HTMLImageElement>) => {
  const t = e.currentTarget as HTMLImageElement & { _fb?: number };
  if (t._fb) return;
  t._fb = 1;
  t.src = fallbackImg;
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
    gender: initial?.gender ?? true, // default Nam
    birthday: initial?.birthday ?? "",
    role: initial?.role ?? "STAFF",
    status: initial?.status ?? "ACTIVE",
    cccd: initial?.cccd ?? "",
    point: initial?.point ?? 0,
  });

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
      username: mode === "create" ? form.username?.trim() || undefined : undefined,
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

  const titleText = form.fullName || "Nhân viên";

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Form */}
      <form
        onSubmit={submit}
        className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900"
      >
        <div className="grid gap-5">
          {/* Full name */}
          <div>
            <label
              htmlFor="fullName"
              className="mb-1 inline-flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-200"
            >
              <Tags className="h-4 w-4 text-emerald-600" /> Họ và tên{" "}
              <span className="text-red-500">*</span>
            </label>
            <input
              id="fullName"
              name="fullName"
              value={form.fullName}
              onChange={handleChange}
              placeholder="Ví dụ: Nguyễn Văn A"
              className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Tối thiểu 2 ký tự.
            </p>
          </div>

          {/* Username & Password (tạo mới) */}
          {mode === "create" && (
            <>
              <div>
                <label
                  htmlFor="username"
                  className="mb-1 inline-flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-200"
                >
                  <AtSign className="h-4 w-4 text-emerald-600" /> Tên đăng nhập{" "}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  id="username"
                  name="username"
                  value={form.username}
                  onChange={handleChange}
                  placeholder="ví dụ: nvdung"
                  className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-1 inline-flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-200"
                >
                  <KeySquare className="h-4 w-4 text-emerald-600" /> Mật khẩu{" "}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Tối thiểu 6 ký tự"
                  className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
                />
              </div>
            </>
          )}

          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="mb-1 inline-flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-200"
            >
              <AtSign className="h-4 w-4 text-emerald-600" /> Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="name@company.com"
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
            />
          </div>

          {/* Phone */}
          <div>
            <label
              htmlFor="phone"
              className="mb-1 inline-flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-200"
            >
              <PhoneIcon className="h-4 w-4 text-emerald-600" /> Điện thoại
            </label>
            <input
              id="phone"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="VD: 09xx xxx xxx"
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
            />
          </div>

          {/* Avatar */}
          <div>
            <label
              htmlFor="avatar"
              className="mb-1 inline-flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-200"
            >
              <ImageIcon className="h-4 w-4 text-emerald-600" /> Ảnh đại diện
              (URL)
            </label>
            <input
              id="avatar"
              name="avatar"
              value={form.avatar}
              onChange={handleChange}
              placeholder="https://...jpg"
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Để trống sẽ dùng ảnh mặc định.
            </p>
          </div>

          {/* Gender + Birthday */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="gender"
                className="mb-1 inline-flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-200"
              >
                Giới tính
              </label>
              <select
                id="gender"
                name="gender"
                value={String(form.gender)}
                onChange={handleChange}
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
              >
                <option value="true">Nam</option>
                <option value="false">Nữ</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="birthday"
                className="mb-1 inline-flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-200"
              >
                <Calendar className="h-4 w-4 text-emerald-600" /> Ngày sinh
              </label>
              <input
                id="birthday"
                name="birthday"
                type="date"
                value={form.birthday || ""}
                onChange={handleChange}
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
              />
            </div>
          </div>

          {/* Role + Status */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="role"
                className="mb-1 inline-flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-200"
              >
                Vai trò
              </label>
              <select
                id="role"
                name="role"
                value={form.role}
                onChange={handleChange}
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
                disabled={mode === "edit"} // PUT không nhận role → khoá khi edit
              >
                <option value="STAFF">STAFF (Người bán hàng)</option>
                <option value="MANAGER">MANAGER (Người quản lý)</option>
                <option value="DELIVERY">DELIVERY (Người giao hàng)</option>
                <option value="ADMIN" disabled>
                  ADMIN
                </option>
              </select>
            </div>

            <div>
              <label
                htmlFor="status"
                className="mb-1 inline-flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-200"
              >
                Trạng thái
              </label>
              <select
                id="status"
                name="status"
                value={form.status}
                onChange={handleChange}
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
              </select>
            </div>
          </div>

          {/* CCCD & Point */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 inline-flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-200">
                CCCD
              </label>
              <input
                name="cccd"
                value={form.cccd || ""}
                onChange={handleChange}
                placeholder="Số CCCD"
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="mb-1 inline-flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-200">
                Điểm tích luỹ
              </label>
              <input
                name="point"
                type="number"
                min={0}
                value={form.point ?? 0}
                onChange={handleChange}
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="mt-2 flex items-center gap-3">
            <button
              type="submit"
              disabled={!canSubmit || submitting}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow enabled:hover:bg-emerald-700 enabled:active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              {submitting
                ? mode === "edit"
                  ? "Đang lưu..."
                  : "Đang tạo..."
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
            <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
              {serverMsg}
            </p>
          )}
          {serverErr && (
            <p className="text-sm font-medium text-red-600 dark:text-red-400">
              {serverErr}
            </p>
          )}
        </div>
      </form>

      {/* Preview */}
      <aside className="space-y-4">
        <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
            Xem trước
          </h3>

          <div className="relative overflow-hidden rounded-3xl border border-emerald-100 bg-emerald-50/40 dark:border-emerald-900/40 dark:bg-emerald-900/10">
            <div className="aspect-[16/9] w-full">
              <img
                src={form.avatar || fallbackImg}
                alt={titleText}
                className="h-full w-full object-contain"
                onError={onImgError}
              />
            </div>
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent" />
            <div className="absolute bottom-4 left-4 text-white drop-shadow">
              <div className="text-sm opacity-90">
                {form.status || "ACTIVE"} · {form.role || "STAFF"} ·{" "}
                {form.gender ? "Nam" : "Nữ"}
              </div>
              <div className="text-xl font-bold">{titleText}</div>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
};

export default UserForm;
