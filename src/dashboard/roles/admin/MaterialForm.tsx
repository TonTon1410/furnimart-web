/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useMemo, useState } from "react";
import { CheckCircle2, ImageIcon, Loader2, Type, AlignLeft, PackageOpen } from "lucide-react";

export type Status = "ACTIVE" | "INACTIVE";

export interface MaterialFormValues {
  materialName: string;
  description?: string;
  status?: Status;
  image?: string;
}

type Props = {
  mode: "create" | "edit";
  initial?: MaterialFormValues;
  submitting?: boolean;
  serverMsg?: string | null;
  serverErr?: string | null;
  onSubmit: (values: MaterialFormValues) => Promise<void> | void;
  onCancel?: () => void;
};

const fallbackImg =
  "https://images.unsplash.com/photo-1582582621959-48d9a2a0e8e7?auto=format&fit=crop&w=1200&q=80";

const onImgError = (e: React.SyntheticEvent<HTMLImageElement>) => {
  const t = e.currentTarget as HTMLImageElement;
  if ((t as any)._fb) return;
  (t as any)._fb = 1;
  t.src = fallbackImg;
};

const MaterialForm: React.FC<Props> = ({
  mode,
  initial,
  submitting = false,
  serverMsg,
  serverErr,
  onSubmit,
  onCancel,
}) => {
  const [form, setForm] = useState<MaterialFormValues>({
    materialName: initial?.materialName ?? "",
    description: initial?.description ?? "",
    status: initial?.status ?? "ACTIVE",
    image: initial?.image ?? "",
  });

  const canSubmit = useMemo(() => form.materialName.trim().length >= 2, [form.materialName]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || submitting) return;
    await onSubmit({
      materialName: form.materialName.trim(),
      description: form.description?.trim() || undefined,
      status: (form.status as Status) || "ACTIVE",
      image: form.image?.trim() || undefined,
    });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Form */}
      <form
        onSubmit={submit}
        className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900"
      >
        <div className="grid gap-5">
          <div>
            <label
              htmlFor="materialName"
              className="mb-1 inline-flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-200"
            >
              <PackageOpen className="h-4 w-4 text-emerald-600" /> Tên chất liệu <span className="text-red-500">*</span>
            </label>
            <input
              id="materialName"
              name="materialName"
              value={form.materialName}
              onChange={handleChange}
              placeholder="Ví dụ: Gỗ sồi, Vải linen, Da PU..."
              className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Tối thiểu 2 ký tự.</p>
          </div>

          <div>
            <label
              htmlFor="description"
              className="mb-1 inline-flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-200"
            >
              <AlignLeft className="h-4 w-4 text-emerald-600" /> Mô tả
            </label>
            <textarea
              id="description"
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={4}
              placeholder="Mô tả ngắn gọn về chất liệu"
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
            />
          </div>

          <div>
            <label
              htmlFor="image"
              className="mb-1 inline-flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-200"
            >
              <ImageIcon className="h-4 w-4 text-emerald-600" /> Ảnh (URL)
            </label>
            <input
              id="image"
              name="image"
              value={form.image}
              onChange={handleChange}
              placeholder="https://...jpg"
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Để trống sẽ dùng ảnh mặc định.</p>
          </div>

          <div>
            <label
              htmlFor="status"
              className="mb-1 inline-flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-200"
            >
              <Type className="h-4 w-4 text-emerald-600" /> Trạng thái
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

          <div className="mt-2 flex items-center gap-3">
            <button
              type="submit"
              disabled={!canSubmit || submitting}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow enabled:hover:bg-emerald-700 enabled:active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              {submitting ? (mode === "edit" ? "Đang lưu..." : "Đang tạo...") : mode === "edit" ? "Lưu thay đổi" : "Tạo chất liệu"}
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

          {serverMsg && <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">{serverMsg}</p>}
          {serverErr && <p className="text-sm font-medium text-red-600 dark:text-red-400">{serverErr}</p>}
        </div>
      </form>

      {/* Preview ảnh vừa khung */}
      <aside className="space-y-4">
        <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">Xem trước</h3>
          <div className="relative overflow-hidden rounded-3xl border border-emerald-100 bg-emerald-50/40 dark:border-emerald-900/40 dark:bg-emerald-900/10">
            <div className="aspect-[16/9] w-full">
              <img
                src={form.image || fallbackImg}
                alt={form.materialName || "Material"}
                className="h-full w-full object-contain"
                onError={onImgError}
              />
            </div>
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent" />
            <div className="absolute bottom-4 left-4 text-white drop-shadow">
              <div className="text-sm opacity-90">{form.status || "ACTIVE"}</div>
              <div className="text-xl font-bold">{form.materialName || "(Chưa có tên)"}</div>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
};

export default MaterialForm;
