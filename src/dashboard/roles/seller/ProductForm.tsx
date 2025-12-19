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
  Upload,
} from "lucide-react";
import axiosClient from "@/service/axiosClient";
import colorService, { type Color } from "@/service/colorService";
import { useToast } from "@/context/ToastContext";
import { uploadToCloudinary } from "@/service/uploadService";

export type Status = "ACTIVE" | "INACTIVE";

export type ColorReq = {
  colorId?: string; // ID của color từ dropdown (nếu chọn từ danh sách)
  productColorId?: string; // ID của product-color đã tồn tại (dùng để update)
  productId?: string; // ID của product (dùng khi update product-color)
  colorName: string;
  hexCode: string; // ví dụ "#FFCC00"
  imageRequestList?: { imageUrl: string; isNew?: boolean }[]; // isNew: đánh dấu ảnh mới chưa lưu
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
  status?: Status;
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
    status: initial?.status ?? "ACTIVE",
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
  const [colors, setColors] = useState<Color[]>([]);
  const [loadingOpt, setLoadingOpt] = useState(true);
  const { showToast } = useToast();

  // New color modal
  const [showNewColorModal, setShowNewColorModal] = useState(false);
  const [newColorName, setNewColorName] = useState("");
  const [newColorHex, setNewColorHex] = useState("#000000");
  const [creatingColor, setCreatingColor] = useState(false);
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const [uploadingColorImages, setUploadingColorImages] = useState<
    Record<string, boolean>
  >({});

  useEffect(() => {
    (async () => {
      try {
        // Load categories and materials
        const [cRes, mRes] = await Promise.all([
          axiosClient.get("/categories"),
          axiosClient.get("/materials"),
        ]);

        // Extract data arrays - check structure carefully
        const categoriesData = (cRes.data?.data || []) as Category[];
        const materialsData = (mRes.data?.data || []) as Material[];

        // Filter active items
        const activeCats = categoriesData.filter((c) => c.status === "ACTIVE");
        const activeMats = materialsData.filter((m) => m.status === "ACTIVE");

        setCats(activeCats);
        setMats(activeMats);

        // Load colors separately (may fail independently)
        try {
          const colorsRes = await colorService.getAll();
          setColors(colorsRes || []);
        } catch (colorErr) {
          console.warn("⚠️ Failed to load colors:", colorErr);
          setColors([]);
        }
      } catch (error) {
        console.error("❌ Error loading options:", error);
      } finally {
        setLoadingOpt(false);
      }
    })();
  }, []);

  // Chỉ reset form khi mode thay đổi, KHÔNG phụ thuộc vào initial
  useEffect(() => {
    // Form mode changed
  }, [mode]);

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

  const handleThumbnailUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showToast({ type: "error", title: "Vui lòng chọn file ảnh" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast({ type: "error", title: "File không được vượt quá 5MB" });
      return;
    }

    setUploadingThumbnail(true);
    try {
      const url = await uploadToCloudinary(file, "image");
      update({ thumbnailImage: url });
      showToast({ type: "success", title: "Upload ảnh thành công" });
    } catch (err) {
      console.error(err);
      showToast({ type: "error", title: "Upload ảnh thất bại" });
    } finally {
      setUploadingThumbnail(false);
    }
  };

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

  // Xóa màu sản phẩm khỏi database (hard delete)
  const deleteProductColor = async (idx: number) => {
    const item = form.colorRequests?.[idx];
    if (!item) return;

    // Nếu chưa có productColorId → chỉ xóa khỏi form (chưa lưu DB)
    if (!item.productColorId) {
      removeColor(idx);
      return;
    }

    // Confirm trước khi xóa
    const confirmMsg = `⚠️ Bạn có chắc muốn XÓA VĨNH VIỄN màu "${item.colorName}"?\n\nThao tác này KHÔNG THỂ HOÀN TÁC!`;
    if (!confirm(confirmMsg)) return;

    try {
      // Gọi API DELETE
      await colorService.deleteProductColor(String(item.productColorId));

      // Xóa khỏi form state
      removeColor(idx);

      showToast({
        type: "success",
        title: "Thành Công!",
        description: "Đã xóa màu thành công!",
      });
    } catch (error: any) {
      const errorMsg =
        error?.response?.data?.message || error?.message || "Không thể xóa màu";
      showToast({
        type: "error",
        title: "Lỗi",
        description: errorMsg,
      });
    }
  };

  // Create new color via API
  const handleCreateColor = async () => {
    if (!newColorName.trim() || !newColorHex) {
      showToast({
        type: "warning",
        title: "Thiếu Thông Tin",
        description: "Vui lòng nhập tên và mã màu.",
      });
      return;
    }

    try {
      setCreatingColor(true);
      const newColor = await colorService.create({
        colorName: newColorName.trim(),
        hexCode: newColorHex,
      });

      // Add to colors list
      setColors((prev) => [...prev, newColor]);

      // Reset form
      setNewColorName("");
      setNewColorHex("#000000");
      setShowNewColorModal(false);
    } catch (err: any) {
      showToast({
        type: "error",
        title: "Lỗi",
        description: err.response?.data?.message || "Không thể tạo màu mới",
      });
    } finally {
      setCreatingColor(false);
    }
  };

  // Select color from dropdown (auto-fill colorName, hexCode and colorId)
  const selectColor = (idx: number, colorId: string) => {
    const selectedColor = colors.find((c) => c.id === colorId);
    if (!selectedColor) return;

    const arr = [...(form.colorRequests || [])];
    const item = { ...(arr[idx] || {}) } as ColorReq;
    item.colorId = selectedColor.id; // ✨ Lưu colorId
    item.colorName = selectedColor.colorName;
    item.hexCode = selectedColor.hexCode;
    arr[idx] = item;
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

  const addColorImage = async (idx: number) => {
    const arr = [...(form.colorRequests || [])];
    const item = { ...(arr[idx] || {}) } as ColorReq;

    // Thêm ảnh mới với flag isNew = true (chỉ ở chế độ edit)
    const isEditMode = mode === "edit" && !!item.productColorId;
    item.imageRequestList = [
      ...(item.imageRequestList || []),
      { imageUrl: "", isNew: isEditMode },
    ];
    arr[idx] = item;
    update({ colorRequests: arr });
  };

  const handleColorImageUpload = async (
    idx: number,
    imgIdx: number,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showToast({ type: "error", title: "Vui lòng chọn file ảnh" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast({ type: "error", title: "File không được vượt quá 5MB" });
      return;
    }

    const key = `${idx}-${imgIdx}`;
    setUploadingColorImages((prev) => ({ ...prev, [key]: true }));
    try {
      const url = await uploadToCloudinary(file, "image");
      const arr = [...(form.colorRequests || [])];
      const item = { ...(arr[idx] || {}) } as ColorReq;
      const list = [...(item.imageRequestList || [])];
      const currentImage = list[imgIdx] || {};
      list[imgIdx] = {
        imageUrl: url,
        isNew: currentImage.isNew,
      };
      item.imageRequestList = list;
      arr[idx] = item;
      update({ colorRequests: arr });
      showToast({ type: "success", title: "Upload ảnh thành công" });
    } catch (err) {
      console.error(err);
      showToast({ type: "error", title: "Upload ảnh thất bại" });
    } finally {
      setUploadingColorImages((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const setColorImage =
    (idx: number, imgIdx: number) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const arr = [...(form.colorRequests || [])];
      const item = { ...(arr[idx] || {}) } as ColorReq;
      const list = [...(item.imageRequestList || [])];
      // ⭐ Giữ lại flag isNew khi update URL
      const currentImage = list[imgIdx] || {};
      list[imgIdx] = {
        imageUrl: e.target.value,
        isNew: currentImage.isNew, // Giữ nguyên flag isNew
      };
      item.imageRequestList = list;
      arr[idx] = item;
      update({ colorRequests: arr });
    };

  // Lưu ảnh mới lên server (chỉ gửi ảnh mới được thêm)
  const saveNewColorImage = async (idx: number, imgIdx: number) => {
    const arr = [...(form.colorRequests || [])];
    const item = { ...arr[idx] };
    if (!item) return;

    const imageUrl = item.imageRequestList?.[imgIdx]?.imageUrl?.trim();
    if (!imageUrl) {
      showToast({
        type: "warning",
        title: "Thiếu Thông Tin",
        description: "Vui lòng nhập URL ảnh!",
      });
      return;
    }

    // Kiểm tra thiếu data
    if (!item.productColorId) {
      showToast({
        type: "error",
        title: "Lỗi",
        description:
          "Không tìm thấy productColorId. Màu này có thể chưa được lưu vào database.",
      });
      return;
    }
    if (!item.productId) {
      showToast({
        type: "error",
        title: "Lỗi",
        description: "Không tìm thấy productId.",
      });
      return;
    }
    if (!item.colorId) {
      showToast({
        type: "error",
        title: "Lỗi",
        description: "Không tìm thấy colorId.",
      });
      return;
    }

    // Kiểm tra xem đây có phải ảnh mới hay không (ảnh mới là ảnh vừa được thêm vào)
    // Ở chế độ edit và có productColorId
    if (mode === "edit") {
      try {
        // ⚠️ GỬI TẤT CẢ ẢNH (cả cũ + mới) vì backend có thể yêu cầu full update
        const allImages = (item.imageRequestList || [])
          .filter((img) => img.imageUrl && img.imageUrl.trim() !== "")
          .map((img) => ({ imageUrl: img.imageUrl }));

        const requestBody = {
          productId: String(item.productId),
          colorId: String(item.colorId), // ✅ GỬI colorId vì backend cần biết màu nào
          status: "ACTIVE" as const,
          imageRequests: allImages, // GỬI TẤT CẢ ẢNH
          model3DRequests: [], // Rỗng vì không update model 3D
        };

        // Gọi API với TẤT CẢ ảnh
        await colorService.updateProductColor(
          String(item.productColorId),
          requestBody
        );

        // Đánh dấu ảnh đã lưu (xóa flag isNew)
        const list = [...(item.imageRequestList || [])];
        list[imgIdx] = { imageUrl, isNew: false };
        item.imageRequestList = list;
        arr[idx] = item;
        update({ colorRequests: arr });

        showToast({
          type: "success",
          title: "Thành Công!",
          description: "Đã lưu ảnh mới thành công!",
        });
      } catch (error: any) {
        const errorMsg =
          error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.message ||
          "Không thể lưu ảnh";

        showToast({
          type: "error",
          title: "Lỗi",
          description: errorMsg,
        });
      }
    } else {
      showToast({
        type: "warning",
        title: "Lưu ý",
        description: "Chế độ create - ảnh sẽ được lưu khi submit form.",
      });
    }
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

  // Model 3D helpers
  const setModel3DValue =
    (
      idx: number,
      field: keyof NonNullable<ColorReq["model3DRequestList"]>[0]
    ) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const arr = [...(form.colorRequests || [])];
      const item = { ...(arr[idx] || {}) } as ColorReq;
      const model3D = item.model3DRequestList?.[0] || {
        status: "ACTIVE" as Status,
        modelUrl: "",
        format: "OBJ" as "OBJ" | "GLB" | "FBX" | "USDZ",
        sizeInMb: 0,
        previewImage: "",
      };

      if (field === "sizeInMb") {
        model3D[field] = Number(e.target.value) || 0;
      } else if (field === "format") {
        model3D[field] = e.target.value as "OBJ" | "GLB" | "FBX" | "USDZ";
      } else if (field === "status") {
        model3D[field] = e.target.value as Status;
      } else {
        (model3D as any)[field] = e.target.value;
      }

      item.model3DRequestList = [model3D];
      arr[idx] = item;
      update({ colorRequests: arr });
    };

  const removeModel3D = (idx: number) => {
    const arr = [...(form.colorRequests || [])];
    const item = { ...(arr[idx] || {}) } as ColorReq;
    item.model3DRequestList = [];
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
        productColorId: c.productColorId, // ⭐ QUAN TRỌNG: Để phân biệt UPDATE vs CREATE
        productId: c.productId, // ⭐ QUAN TRỌNG: ID của product
        colorId: c.colorId,
        colorName: c.colorName,
        hexCode: c.hexCode?.trim() || "#000000",
        // ⚠️ Xóa field isNew khi gửi API
        imageRequestList: (c.imageRequestList || [])
          .filter((i) => i.imageUrl?.trim())
          .map((i) => ({ imageUrl: i.imageUrl.trim() })), // Chỉ gửi imageUrl
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
              <div className="mt-1 flex gap-2">
                <input
                  id={idOf("p-thumb")}
                  value={form.thumbnailImage || ""}
                  onChange={handleChange("thumbnailImage")}
                  placeholder="https://...jpg"
                  className="flex-1 rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
                />
                <label className="relative cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleThumbnailUpload}
                    className="hidden"
                    disabled={uploadingThumbnail}
                  />
                  <div className="flex h-full items-center rounded-xl border border-emerald-500 bg-emerald-50 px-4 py-3 text-emerald-600 transition hover:bg-emerald-100 dark:border-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 dark:hover:bg-emerald-900">
                    {uploadingThumbnail ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Upload className="h-5 w-5" />
                    )}
                  </div>
                </label>
              </div>
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

          {/* Thông báo về màu sắc khi tạo mới */}
          {mode === "create" && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-4 dark:border-emerald-900/40 dark:bg-emerald-900/10">
              <div className="flex items-start gap-3">
                <Palette className="h-5 w-5 text-emerald-600 dark:text-emerald-400 mt-0.5" />
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">
                    Thêm màu sắc sau
                  </h4>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    Sau khi tạo sản phẩm, bạn sẽ được yêu cầu thêm màu sắc và
                    hình ảnh cho sản phẩm.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* colors - chỉ hiển thị khi edit */}
          {mode === "edit" && (
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
                <div className="grid gap-4 max-h-136 overflow-auto pr-1">
                  {(form.colorRequests || []).map((c, idx) => (
                    <div
                      key={idx}
                      className="rounded-2xl border border-gray-200 p-4 dark:border-gray-800"
                    >
                      {/* Color Selection Dropdown */}
                      {colors.length > 0 && (
                        <div className="mb-3">
                          <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
                            Chọn từ màu có sẵn
                          </label>
                          <select
                            onChange={(e) => {
                              if (e.target.value === "__CREATE_NEW__") {
                                setShowNewColorModal(true);
                                e.target.value = ""; // Reset dropdown
                              } else {
                                selectColor(idx, e.target.value);
                              }
                            }}
                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm
                              text-gray-900 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
                            aria-label={`Chọn màu ${idx + 1}`}
                          >
                            <option value="">-- Chọn màu --</option>
                            <option
                              value="__CREATE_NEW__"
                              className="font-semibold text-blue-600"
                            >
                              ➕ Tạo màu mới...
                            </option>
                            {colors.map((color) => (
                              <option key={color.id} value={color.id}>
                                {color.colorName} ({color.hexCode})
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

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
                                const item = {
                                  ...(arr[idx] || {}),
                                } as ColorReq;
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
                          onClick={() => deleteProductColor(idx)}
                          className="inline-flex items-center gap-2 self-start rounded-lg border border-red-300 px-2.5 py-1.5 text-sm text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-900/20"
                          title={
                            c.productColorId
                              ? "Xóa vĩnh viễn màu này khỏi database"
                              : "Xóa màu khỏi form"
                          }
                        >
                          <Trash2 className="h-4 w-4" /> Xóa màu
                        </button>
                      </div>

                      {/* Ảnh (URL) */}
                      <div className="grid gap-2">
                        <div className="flex items-center justify-between">
                          <div className="text-xs font-medium text-gray-600 dark:text-gray-300">
                            Ảnh sản phẩm theo màu (có thể thêm nhiều ảnh)
                          </div>
                          <button
                            type="button"
                            onClick={() => addColorImage(idx)}
                            className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-2 py-1 text-xs text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
                          >
                            <Plus className="h-3 w-3" /> Thêm ảnh
                          </button>
                        </div>

                        {(c.imageRequestList || []).length === 0 ? (
                          <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4 text-center dark:border-gray-700 dark:bg-gray-800/50">
                            <ImageIcon className="mx-auto h-8 w-8 text-gray-400 dark:text-gray-600" />
                            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                              Chưa có ảnh nào. Nhấn "Thêm ảnh" để thêm.
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {(c.imageRequestList || []).map((img, imgIdx) => (
                              <div
                                key={imgIdx}
                                className="flex items-start gap-2"
                              >
                                <div className="flex-1 space-y-1">
                                  <div className="flex items-center gap-2">
                                    <span className="flex h-6 w-6 items-center justify-center rounded bg-gray-100 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                                      {imgIdx + 1}
                                    </span>
                                    <input
                                      id={idOf(`color-img-${idx}-${imgIdx}`)}
                                      aria-label={`Ảnh màu ${idx + 1} - ${
                                        imgIdx + 1
                                      }`}
                                      value={img.imageUrl}
                                      onChange={setColorImage(idx, imgIdx)}
                                      placeholder="https://example.com/image.jpg"
                                      className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
                                    />
                                    <label className="relative cursor-pointer">
                                      <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) =>
                                          handleColorImageUpload(idx, imgIdx, e)
                                        }
                                        className="hidden"
                                        disabled={
                                          uploadingColorImages[
                                            `${idx}-${imgIdx}`
                                          ]
                                        }
                                      />
                                      <div className="flex items-center rounded-lg border border-emerald-500 bg-emerald-50 px-3 py-2 text-emerald-600 transition hover:bg-emerald-100 dark:border-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 dark:hover:bg-emerald-900">
                                        {uploadingColorImages[
                                          `${idx}-${imgIdx}`
                                        ] ? (
                                          <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                          <Upload className="h-4 w-4" />
                                        )}
                                      </div>
                                    </label>
                                    {/* Hiển thị nút Lưu cho ảnh mới chưa lưu */}
                                    {img.isNew && (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          saveNewColorImage(idx, imgIdx)
                                        }
                                        className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800"
                                        title="Lưu ảnh này lên server (không ảnh hưởng thông tin sản phẩm khác)"
                                      >
                                        <CheckCircle2 className="h-4 w-4" />
                                        Lưu ảnh
                                      </button>
                                    )}
                                  </div>
                                  {img.imageUrl && (
                                    <div className="ml-8 rounded-lg border border-gray-200 bg-gray-50 p-2 dark:border-gray-700 dark:bg-gray-800/50">
                                      <img
                                        src={img.imageUrl}
                                        alt={`Preview ${imgIdx + 1}`}
                                        className="h-20 w-20 rounded object-cover"
                                        onError={(e) => {
                                          const target = e.currentTarget;
                                          target.style.display = "none";
                                        }}
                                      />
                                    </div>
                                  )}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeColorImage(idx, imgIdx)}
                                  className="mt-2 rounded-lg border border-red-300 px-2.5 py-1.5 text-sm text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
                                  title="Xóa ảnh này"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        {!isValidHex6(c.hexCode || "") && (
                          <p className="text-xs text-red-600 dark:text-red-400">
                            Nhập mã dạng #RRGGBB (ví dụ #FFCC00). Bạn có thể
                            dùng bộ chọn màu bên trái.
                          </p>
                        )}
                      </div>

                      {/* Model 3D (Optional - Max 1 per product) */}
                      <div className="grid gap-3 border-t border-gray-200 dark:border-gray-700 pt-4">
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Model 3D (Tùy chọn - 1 sản phẩm chỉ có 1 model)
                          </div>
                          {c.model3DRequestList &&
                            c.model3DRequestList.length > 0 && (
                              <button
                                type="button"
                                onClick={() => removeModel3D(idx)}
                                className="text-xs text-red-600 hover:text-red-700 dark:text-red-400"
                              >
                                Xóa Model 3D
                              </button>
                            )}
                        </div>

                        {(() => {
                          // Check if any other color already has a model 3D
                          const hasModelInOtherColor = (
                            form.colorRequests || []
                          ).some(
                            (color, colorIdx) =>
                              colorIdx !== idx &&
                              color.model3DRequestList &&
                              color.model3DRequestList.length > 0
                          );

                          const currentHasModel =
                            c.model3DRequestList &&
                            c.model3DRequestList.length > 0;

                          if (hasModelInOtherColor && !currentHasModel) {
                            return (
                              <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30 p-3 text-sm text-amber-800 dark:text-amber-400">
                                ⚠️ Sản phẩm đã có model 3D ở màu khác. Mỗi sản
                                phẩm chỉ được có 1 model 3D duy nhất.
                              </div>
                            );
                          }

                          if (!currentHasModel) {
                            return (
                              <button
                                type="button"
                                onClick={() => {
                                  const arr = [...(form.colorRequests || [])];
                                  const item = {
                                    ...(arr[idx] || {}),
                                  } as ColorReq;
                                  item.model3DRequestList = [
                                    {
                                      status: "ACTIVE",
                                      modelUrl: "",
                                      format: "OBJ",
                                      sizeInMb: 0,
                                      previewImage: "",
                                    },
                                  ];
                                  arr[idx] = item;
                                  update({ colorRequests: arr });
                                }}
                                className="inline-flex items-center gap-2 rounded-lg border border-dashed border-gray-300 px-3 py-2 text-sm text-gray-600 hover:border-gray-400 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
                              >
                                <Plus className="h-4 w-4" /> Thêm Model 3D
                              </button>
                            );
                          }

                          return (
                            <div className="grid gap-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-3">
                              {/* Model URL */}
                              <div>
                                <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
                                  URL Model{" "}
                                  <span className="text-red-500">*</span>
                                </label>
                                <input
                                  value={
                                    c.model3DRequestList?.[0]?.modelUrl || ""
                                  }
                                  onChange={setModel3DValue(idx, "modelUrl")}
                                  placeholder="https://example.com/model.obj"
                                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
                                />
                              </div>

                              {/* Format & Size */}
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
                                    Định dạng
                                  </label>
                                  <select
                                    value={
                                      c.model3DRequestList?.[0]?.format || "OBJ"
                                    }
                                    onChange={setModel3DValue(idx, "format")}
                                    aria-label="Định dạng model 3D"
                                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
                                  >
                                    <option value="OBJ">OBJ</option>
                                    <option value="GLB">GLB</option>
                                    <option value="FBX">FBX</option>
                                    <option value="USDZ">USDZ</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
                                    Kích thước (MB)
                                  </label>
                                  <input
                                    type="number"
                                    step="0.1"
                                    min="0"
                                    value={
                                      c.model3DRequestList?.[0]?.sizeInMb || 0
                                    }
                                    onChange={setModel3DValue(idx, "sizeInMb")}
                                    placeholder="0"
                                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
                                  />
                                </div>
                              </div>

                              {/* Preview Image */}
                              <div>
                                <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
                                  Ảnh xem trước
                                </label>
                                <input
                                  value={
                                    c.model3DRequestList?.[0]?.previewImage ||
                                    ""
                                  }
                                  onChange={setModel3DValue(
                                    idx,
                                    "previewImage"
                                  )}
                                  placeholder="https://example.com/preview.jpg"
                                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
                                />
                              </div>

                              {/* Status */}
                              <div>
                                <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
                                  Trạng thái
                                </label>
                                <select
                                  value={
                                    c.model3DRequestList?.[0]?.status ||
                                    "ACTIVE"
                                  }
                                  onChange={setModel3DValue(idx, "status")}
                                  aria-label="Trạng thái model 3D"
                                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
                                >
                                  <option value="ACTIVE">ACTIVE</option>
                                  <option value="INACTIVE">INACTIVE</option>
                                </select>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

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
            <div className="aspect-video w-full">
              <img
                src={form.thumbnailImage || fallbackImg}
                alt={form.name || "Product"}
                className="h-full w-full object-contain"
                onError={onImgError}
              />
            </div>
            <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/40 via-black/10 to-transparent" />
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

      {/* New Color Modal */}
      {showNewColorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 dark:bg-gray-900 mx-4">
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
              Tạo màu mới
            </h3>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Tên màu
                </label>
                <input
                  type="text"
                  value={newColorName}
                  onChange={(e) => setNewColorName(e.target.value)}
                  placeholder="VD: Đỏ tươi"
                  className="w-full rounded border border-gray-300 px-3 py-2 text-gray-900 placeholder:text-gray-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500"
                  autoFocus
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Mã màu (Hex)
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={newColorHex}
                    onChange={(e) => setNewColorHex(e.target.value)}
                    className="h-10 w-20 rounded border border-gray-300 dark:border-gray-700 cursor-pointer"
                    title="Chọn màu"
                  />
                  <input
                    type="text"
                    value={newColorHex}
                    onChange={(e) => setNewColorHex(e.target.value)}
                    placeholder="#000000"
                    className="flex-1 rounded border border-gray-300 px-3 py-2 text-gray-900 placeholder:text-gray-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleCreateColor}
                  disabled={creatingColor}
                  className="flex-1 rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:opacity-50"
                >
                  {creatingColor ? (
                    <>
                      <Loader2 className="inline h-4 w-4 animate-spin mr-2" />
                      Đang tạo...
                    </>
                  ) : (
                    "Tạo màu"
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowNewColorModal(false);
                    setNewColorName("");
                    setNewColorHex("#000000");
                  }}
                  className="rounded border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  Hủy
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductForm;
