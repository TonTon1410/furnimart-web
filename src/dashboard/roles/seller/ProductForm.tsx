/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useMemo, useState, useId } from "react";
import {
  CheckCircle2,
  Loader2,
  Tag,
  DollarSign,
  ImageIcon,
  Layers,
  Box,
  Ruler,
  Palette,
  Plus,
  Trash2,
} from "lucide-react";
import axiosClient from "@/service/axiosClient";

export type Status = "ACTIVE" | "INACTIVE";

export type ColorReq = {
  colorName: string;
  hexCode: string; // ví dụ "#FFCC00"
  imageRequestList?: { imageUrl: string }[];
  model3DRequestList?: {
    status: Status;
    modelUrl: string;
    format: "OBJ" | "GLB" | "FBX" | "USDZ";
    sizeInMb: number;
    previewImage: string;
    productId?: string; // tạo mới không cần gửi
  }[];
};

export type ProductFormValues = {
  code: string;
  name: string;
  description?: string;
  price: number;
  thumbnailImage?: string;
  weight?: number;
  height?: number;
  width?: number;
  length?: number;
  categoryId: number;
  materialIds?: number[];
  colorRequests?: ColorReq[];
};

type Props = {
  mode: "create" | "edit";
  initial?: ProductFormValues;
  submitting?: boolean;
  serverMsg?: string | null;
  serverErr?: string | null;
  onSubmit: (values: ProductFormValues) => Promise<void> | void;
  onCancel?: () => void;
};

type Category = {
  id: number;
  categoryName: string;
  status: Status;
  image?: string;
};
type Material = {
  id: number;
  materialName: string;
  status: Status;
  image?: string;
};

const emptyForm: ProductFormValues = {
  code: "",
  name: "",
  description: "",
  price: 0,
  thumbnailImage: "",
  weight: 0,
  height: 0,
  width: 0,
  length: 0,
  categoryId: 0,
  materialIds: [],
  colorRequests: [],
};

const fallbackImg =
  "https://images.unsplash.com/photo-1616627981169-f97ab76673be?auto=format&fit=crop&w=1200&q=80";

const onImgError = (e: React.SyntheticEvent<HTMLImageElement>) => {
  const t = e.currentTarget as HTMLImageElement;
  if ((t as any)._fb) return;
  (t as any)._fb = 1;
  t.src = fallbackImg;
};

const ProductForm: React.FC<Props> = ({
  mode,
  initial,
  submitting = false,
  serverMsg,
  serverErr,
  onSubmit,
  onCancel,
}) => {
  const uid = useId();
  const [form, setForm] = useState<ProductFormValues>({
    code: initial?.code ?? "",
    name: initial?.name ?? "",
    description: initial?.description ?? "",
    price: initial?.price ?? 0,
    thumbnailImage: initial?.thumbnailImage ?? "",
    weight: initial?.weight ?? 0,
    height: initial?.height ?? 0,
    width: initial?.width ?? 0,
    length: initial?.length ?? 0,
    categoryId: initial?.categoryId ?? 0,
    materialIds: initial?.materialIds ?? [],
    colorRequests: initial?.colorRequests ?? [],
  });

  const canSubmit = useMemo(
    () =>
      form.name.trim().length >= 2 &&
      form.code.trim().length >= 1 &&
      form.categoryId > 0,
    [form.name, form.code, form.categoryId]
  );

  // options
  const [cats, setCats] = useState<Category[]>([]);
  const [mats, setMats] = useState<Material[]>([]);
  const [loadingOpt, setLoadingOpt] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [cRes, mRes] = await Promise.all([
          axiosClient.get<{ data: Category[] }>("/categories"),
          axiosClient.get<{ data: Material[] }>("/materials"),
        ]);
        setCats((cRes.data?.data || []).filter((c) => c.status === "ACTIVE"));
        setMats((mRes.data?.data || []).filter((m) => m.status === "ACTIVE"));
      } catch {
        // bỏ qua để form vẫn dùng được
      } finally {
        setLoadingOpt(false);
      }
    })();
  }, []);
  useEffect(() => {
    if (mode === "create") {
      setForm(emptyForm);
    } else if (mode === "edit" && initial) {
      // merge để đảm bảo có đủ field mặc định
      setForm({ ...emptyForm, ...initial });
    }
  }, [mode, initial]);
  const update = (patch: Partial<ProductFormValues>) =>
    setForm((s) => ({ ...s, ...patch }));

  const numericKeys = new Set<keyof ProductFormValues>([
    "price",
    "weight",
    "height",
    "width",
    "length",
  ]);
  // Cho phép nhập số dạng "12.5" hoặc có dấu phẩy "1,234.56"
  const parseNumberInput = (raw: string): number | undefined => {
    const s = raw.replaceAll(",", "").trim();
    if (s === "") return undefined; // cho phép để trống
    const n = Number(s);
    return Number.isFinite(n) ? n : undefined; // nếu không phải số thì bỏ qua
  };

  const handleChange =
    (key: keyof ProductFormValues) =>
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >
    ) => {
      const v = e.target.value;

      // numeric fields: parse về number | undefined
      if (numericKeys.has(key)) {
        const num = parseNumberInput(v);
        update({ [key]: num as any });
        return;
      }

      // select: categoryId (number)
      if (key === "categoryId") {
        update({ categoryId: Number(v) });
        return;
      }

      // còn lại là text
      update({ [key]: v } as any);
    };

  // đặt gần các util khác
  const normalizeHex = (v: string) => {
    let s = (v || "").trim();
    if (!s) return "#000000";
    if (s[0] !== "#") s = "#" + s;
    // chấp nhận #RGB hoặc #RRGGBB; chuyển RRGGBB
    const short = /^#([0-9a-fA-F]{3})$/;
    const long = /^#([0-9a-fA-F]{6})$/;
    if (short.test(s)) {
      const m = s.slice(1);
      s = `#${m[0]}${m[0]}${m[1]}${m[1]}${m[2]}${m[2]}`;
    }
    if (!long.test(s)) return s.toUpperCase(); // để nguyên, validation xử lý thêm
    return s.toUpperCase();
  };
  const isValidHex6 = (v: string) => /^#[0-9A-F]{6}$/i.test(v);

  const toggleMaterial = (id: number) => {
    update({
      materialIds: (form.materialIds || []).includes(id)
        ? (form.materialIds || []).filter((x) => x !== id)
        : [...(form.materialIds || []), id],
    });
  };

  // colors
  const addColor = () => {
    update({
      colorRequests: [
        ...(form.colorRequests || []),
        {
          colorName: "",
          hexCode: "#000000",
          imageRequestList: [{ imageUrl: "" }],
        },
      ],
    });
  };

  const removeColor = (idx: number) => {
    const arr = [...(form.colorRequests || [])];
    arr.splice(idx, 1);
    update({ colorRequests: arr });
  };

  const setColorValue =
    <K extends "colorName" | "hexCode">(idx: number, key: K) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const arr = [...(form.colorRequests || [])];
      const item = { ...(arr[idx] || {}) } as ColorReq;

      if (key === "hexCode") {
        const raw = e.target.value;
        const norm = normalizeHex(raw);
        item.hexCode = norm;
      } else {
        item.colorName = e.target.value;
      }

      arr[idx] = item;
      update({ colorRequests: arr });
    };

  // const addColorImage = (idx: number) => {
  //   const arr = [...(form.colorRequests || [])];
  //   const item = { ...(arr[idx] || {}) } as ColorReq;
  //   item.imageRequestList = [
  //     ...(item.imageRequestList || []),
  //     { imageUrl: "" },
  //   ];
  //   arr[idx] = item;
  //   update({ colorRequests: arr });
  // };

  const setColorImage =
    (idx: number, imgIdx: number) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const arr = [...(form.colorRequests || [])];
      const item = { ...(arr[idx] || {}) } as ColorReq;
      const list = [...(item.imageRequestList || [])];
      list[imgIdx] = { imageUrl: e.target.value };
      item.imageRequestList = list;
      arr[idx] = item;
      update({ colorRequests: arr });
    };

  const removeColorImage = (idx: number, imgIdx: number) => {
    const arr = [...(form.colorRequests || [])];
    const item = { ...(arr[idx] || {}) } as ColorReq;
    const list = [...(item.imageRequestList || [])];
    list.splice(imgIdx, 1);
    item.imageRequestList = list;
    arr[idx] = item;
    update({ colorRequests: arr });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || submitting) return;
    await onSubmit({
      ...form,
      price: Number(form.price || 0),
      weight: Number(form.weight || 0),
      height: Number(form.height || 0),
      width: Number(form.width || 0),
      length: Number(form.length || 0),
      materialIds: form.materialIds || [],
      colorRequests: (form.colorRequests || []).map((c) => ({
        ...c,
        hexCode: c.hexCode?.trim() || "#000000",
        imageRequestList: (c.imageRequestList || []).filter((i) =>
          i.imageUrl?.trim()
        ),
        model3DRequestList: (c.model3DRequestList || []).length
          ? c.model3DRequestList
          : undefined,
      })),
    });
  };

  const idOf = (suffix: string) => `${uid}-${suffix}`;

  return (
    // ✅ form rộng hơn: 3 cột lớn, form chiếm 2 cột
    <div className="grid gap-6 lg:grid-cols-3 xl:grid-cols-4">
      {/* Form */}
      <form
        onSubmit={submit}
        className="lg:col-span-2 xl:col-span-3 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900"
      >
        <div className="grid gap-5 min-w-0">
          {/* code & name */}
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            <div className="min-w-0">
              <label
                htmlFor={idOf("p-code")}
                className="mb-1 inline-flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-200"
              >
                <Tag className="h-4 w-4 text-emerald-600" /> Mã SP
              </label>
              <input
                id={idOf("p-code")}
                value={form.code}
                onChange={handleChange("code")}
                placeholder="VD: SOFA-001"
                className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
              />
            </div>
            <div className="min-w-0">
              <label
                htmlFor={idOf("p-name")}
                className="mb-1 inline-flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-200"
              >
                <Tag className="h-4 w-4 text-emerald-600" /> Tên SP
              </label>
              <input
                id={idOf("p-name")}
                value={form.name}
                onChange={handleChange("name")}
                placeholder="Tên sản phẩm"
                className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
              />
            </div>
          </div>

          {/* description ✅ thêm */}
          <div className="min-w-0">
            <label
              htmlFor={idOf("p-desc")}
              className="mb-1 inline-flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-200"
            >
              Mô tả
            </label>
            <textarea
              id={idOf("p-desc")}
              rows={4}
              value={form.description || ""}
              onChange={handleChange("description")}
              placeholder="Mô tả ngắn gọn về sản phẩm..."
              className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
            />
          </div>

          {/* price & thumb */}
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            <div className="min-w-0">
              <label
                htmlFor={idOf("p-price")}
                className="mb-1 inline-flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-200"
              >
                <DollarSign className="h-4 w-4 text-emerald-600" /> Giá (VNĐ)
              </label>
              <input
                id={idOf("p-price")}
                type="number"
                min={0}
                value={form.price}
                onChange={handleChange("price")}
                className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
              />
            </div>
            <div className="min-w-0">
              <label
                htmlFor={idOf("p-thumb")}
                className="mb-1 inline-flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-200"
              >
                <ImageIcon className="h-4 w-4 text-emerald-600" /> Ảnh thumbnail
                (URL)
              </label>
              <input
                id={idOf("p-thumb")}
                value={form.thumbnailImage || ""}
                onChange={handleChange("thumbnailImage")}
                placeholder="https://...jpg"
                className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
              />
            </div>
          </div>

          {/* Kích thước & khối lượng */}
          <fieldset className="min-w-0">
            <legend className="mb-1 inline-flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-200">
              <Ruler className="h-4 w-4 text-emerald-600" /> Kích thước & khối
              lượng
            </legend>

            <div className="grid gap-3 sm:grid-cols-4 lg:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-8">
              {[
                {
                  key: "weight",
                  label: "Khối lượng",
                  unit: "kg",
                  placeholder: "VD: 12.5",
                },
                {
                  key: "length",
                  label: "Dài",
                  unit: "cm",
                  placeholder: "VD: 200",
                },
                {
                  key: "width",
                  label: "Rộng",
                  unit: "cm",
                  placeholder: "VD: 85",
                },
                {
                  key: "height",
                  label: "Cao",
                  unit: "cm",
                  placeholder: "VD: 75",
                },
              ].map(({ key, label, unit, placeholder }) => (
                <div key={key} className="min-w-0">
                  <label
                    htmlFor={idOf(`p-${key}`)}
                    className="block text-xs font-medium text-gray-600 dark:text-gray-300"
                  >
                    {label} ({unit})
                  </label>
                  <div className="relative mt-1">
                    <input
                      id={idOf(`p-${key}`)}
                      type="text"
                      inputMode="decimal"
                      pattern="[0-9]*\.?[0-9]*"
                      placeholder={placeholder}
                      value={String(form[key as keyof ProductFormValues] ?? "")}
                      onChange={handleChange(key as keyof ProductFormValues)}
                      className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 pr-12 text-gray-900 placeholder:text-gray-400
                       focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200
                       dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
                    />
                    <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-gray-500">
                      {unit}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Quy ước: Dài × Rộng × Cao (cm). Bạn có thể nhập số thập phân (ví
              dụ 182.5).
            </p>
          </fieldset>

          {/* category */}
          <div className="min-w-0">
            <label
              htmlFor={idOf("p-category")}
              className="mb-1 inline-flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-200"
            >
              <Layers className="h-4 w-4 text-emerald-600" /> Danh mục
            </label>
            <select
              id={idOf("p-category")}
              value={form.categoryId || 0}
              onChange={handleChange("categoryId")}
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
            >
              <option value={0} disabled>
                {loadingOpt ? "Đang tải..." : "— Chọn danh mục —"}
              </option>
              {cats.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.categoryName}
                </option>
              ))}
            </select>
          </div>

          {/* materials multi */}
          <div className="min-w-0">
            <label className="mb-1 inline-flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-200">
              <Box className="h-4 w-4 text-emerald-600" /> Chất liệu
            </label>
            <div className="flex flex-wrap gap-2 pr-1">
              {mats.map((m) => {
                const active = (form.materialIds || []).includes(m.id);
                return (
                  <button
                    key={m.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => toggleMaterial(m.id)}
                    className={`rounded-xl border px-3 py-1.5 text-sm ${
                      active
                        ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:border-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-300"
                        : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-300"
                    }`}
                  >
                    {m.materialName}
                  </button>
                );
              })}
              {mats.length === 0 && (
                <span className="text-sm text-gray-500">
                  Chưa có chất liệu khả dụng
                </span>
              )}
            </div>
          </div>

          {/* colors */}
          <div className="min-w-0">
            <div className="mb-1 flex items-center justify-between">
              <label className="inline-flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-200">
                <Palette className="h-4 w-4 text-emerald-600" /> Màu sắc & Ảnh
              </label>
              <button
                type="button"
                onClick={addColor}
                className="inline-flex items-center gap-2 rounded-xl border border-emerald-300 px-3 py-1.5 text-sm text-emerald-700 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-300 dark:hover:bg-emerald-900/20"
              >
                <Plus className="h-4 w-4" /> Thêm màu
              </button>
            </div>

            {(form.colorRequests || []).length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Chưa thêm màu nào.
              </p>
            ) : (
              // ✅ cho phép kéo nếu quá dài, tránh “tràn”
              <div className="grid gap-4 max-h-[34rem] overflow-auto pr-1">
                {(form.colorRequests || []).map((c, idx) => (
                  <div
                    key={idx}
                    className="rounded-2xl border border-gray-200 p-4 dark:border-gray-800"
                  >
                    <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex flex-wrap items-center gap-2 min-w-0">
                        {/* Tên màu */}
                        <input
                          id={idOf(`color-name-${idx}`)}
                          aria-label={`Tên màu ${idx + 1}`}
                          value={c.colorName}
                          onChange={setColorValue(idx, "colorName")}
                          placeholder="Tên màu (VD: Kem, Ghi đậm)"
                          className="w-48 min-w-0 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm
                   text-gray-900 placeholder:text-gray-400
                   dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
                        />

                        {/* Color picker */}
                        <input
                          type="color"
                          value={
                            isValidHex6(c.hexCode || "")
                              ? (c.hexCode as string)
                              : "#000000"
                          }
                          onChange={(e) => {
                            const arr = [...(form.colorRequests || [])];
                            const item = { ...(arr[idx] || {}) } as ColorReq;
                            item.hexCode = e.target.value.toUpperCase();
                            arr[idx] = item;
                            update({ colorRequests: arr });
                          }}
                          className="h-9 w-12 cursor-pointer rounded-lg border border-gray-300 p-1
                   dark:border-gray-700"
                          title="Chọn màu"
                        />

                        {/* Ô nhập mã hex */}
                        <div className="flex items-center gap-2">
                          <input
                            id={idOf(`color-hex-${idx}`)}
                            aria-label={`Mã hex ${idx + 1}`}
                            value={c.hexCode}
                            onChange={setColorValue(idx, "hexCode")}
                            onBlur={(e) => {
                              const arr = [...(form.colorRequests || [])];
                              const item = { ...(arr[idx] || {}) } as ColorReq;
                              const norm = normalizeHex(e.target.value);
                              item.hexCode = norm;
                              arr[idx] = item;
                              update({ colorRequests: arr });
                            }}
                            placeholder="#000000"
                            inputMode="text"
                            className={`w-36 min-w-0 rounded-lg border px-3 py-2 text-sm
                     text-gray-900 placeholder:text-gray-400
                     dark:text-gray-100
                     ${
                       isValidHex6(c.hexCode || "#")
                         ? "border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950"
                         : "border-red-400 bg-red-50 dark:border-red-800 dark:bg-red-950/40"
                     }`}
                          />
                          {/* Swatch nhỏ (thừa kế màu) */}
                          <span
                            className="inline-block h-6 w-6 rounded border border-gray-300 dark:border-gray-700"
                            style={{
                              backgroundColor: isValidHex6(c.hexCode || "")
                                ? c.hexCode
                                : "#000000",
                            }}
                            title={c.hexCode}
                          />
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeColor(idx)}
                        className="inline-flex items-center gap-2 self-start rounded-lg border border-red-300 px-2.5 py-1.5 text-sm text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-900/20"
                      >
                        <Trash2 className="h-4 w-4" /> Xoá màu
                      </button>
                    </div>

                    {/* Ảnh (URL) */}
                    <div className="grid gap-2">
                      <div className="text-xs font-medium text-gray-600 dark:text-gray-300">
                        Ảnh (URL)
                      </div>
                      {(c.imageRequestList || []).map((img, imgIdx) => (
                        <div key={imgIdx} className="flex items-center gap-2">
                          <input
                            id={idOf(`color-img-${idx}-${imgIdx}`)}
                            aria-label={`Ảnh màu ${idx + 1} - ${imgIdx + 1}`}
                            value={img.imageUrl}
                            onChange={setColorImage(idx, imgIdx)}
                            placeholder="https://...jpg"
                            className="grow min-w-0 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm
                     text-gray-900 placeholder:text-gray-400
                     dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
                          />
                          <button
                            type="button"
                            onClick={() => removeColorImage(idx, imgIdx)}
                            className="rounded-lg border border-gray-300 px-2.5 py-1.5 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                          >
                            Xoá
                          </button>
                        </div>
                      ))}
                      {/* <button
                        type="button"
                        onClick={() => addColorImage(idx)}
                        className="mt-1 inline-flex items-center gap-2 rounded-lg border border-gray-300 px-2.5 py-1.5 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                      >
                        <Plus className="h-4 w-4" /> Thêm ảnh
                      </button> */}
                      {!isValidHex6(c.hexCode || "") && (
                        <p className="text-xs text-red-600 dark:text-red-400">
                          Nhập mã dạng #RRGGBB (ví dụ #FFCC00). Bạn có thể dùng
                          bộ chọn màu bên trái.
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* actions */}
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
                : "Tạo sản phẩm"}
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
                src={form.thumbnailImage || fallbackImg}
                alt={form.name || "Product"}
                className="h-full w-full object-contain"
                onError={onImgError}
              />
            </div>
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent" />
            <div className="absolute bottom-4 left-4 text-white drop-shadow">
              <div className="text-sm opacity-90">{form.code || "CODE"}</div>
              <div className="text-xl font-bold">
                {form.name || "(Chưa có tên)"}
              </div>
              <div className="mt-0.5 text-sm opacity-90">
                {form.price ? `${form.price.toLocaleString()}₫` : ""}
              </div>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
};

export default ProductForm;
