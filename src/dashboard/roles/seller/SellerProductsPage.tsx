/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Plus,
  Package,
  Loader2,
  Trash2,
  Edit3,
  Power,
  Eye,
  Palette,
} from "lucide-react";
import axiosClient from "@/service/axiosClient";
import colorService from "@/service/colorService";
import { DP } from "@/router/paths";
import SlideOver from "@/components/SlideOver";
import ProductForm, {
  type ProductFormValues,
  type Status,
} from "./ProductForm";
import ProductColorForm, { type ProductColorRequest } from "./ProductColorForm";

type ProductItem = {
  id: string;
  name: string;
  description?: string;
  price: number;
  code: string;
  thumbnailImage?: string;
  slug?: string;
  weight?: number;
  height?: number;
  width?: number;
  length?: number;
  status: Status;
  categoryName?: string;
  categoryId: number;
  // Support both formats: 'color' from list API and 'productColors' from detail API
  color?: Array<{
    id: string;
    colorName: string;
    hexCode: string;
    images?: { image: string }[];
    models3D?: any[];
  }>;
  productColors?: Array<{
    id: string;
    color: {
      id: string;
      colorName: string;
      hexCode: string;
    };
    images: Array<{
      id: string;
      image: string;
    }>;
    models3D: Array<{
      image3d: string;
      status: Status;
      modelUrl: string;
      format: string;
      sizeInMb: number;
      previewImage: string;
    }>;
    status: Status;
  }>;
  materials?: Array<{
    id: number;
    image?: string;
    materialName: string;
    description?: string;
    status: Status;
  }>;
};

const fallbackImg =
  "https://images.unsplash.com/photo-1616627981169-f97ab76673be?auto=format&fit=crop&w=1200&q=80";

const onImgError = (e: React.SyntheticEvent<HTMLImageElement>) => {
  const t = e.currentTarget as HTMLImageElement;
  if ((t as any)._fb) return;
  (t as any)._fb = 1;
  t.src = fallbackImg;
};

// List Row Component
const ProductRow: React.FC<{
  p: ProductItem;
  onViewDetail: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string, cur: Status) => void;
  busy?: boolean;
}> = ({ p, onViewDetail, onEdit, onDelete, onToggle, busy }) => {
  return (
    <div className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow dark:bg-gray-900 dark:border-gray-800">
      {/* Thumbnail */}
      <img
        src={p.thumbnailImage || fallbackImg}
        alt={p.name}
        className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
        onError={onImgError}
      />

      {/* Product Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
              {p.name}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
              Mã: {p.code}
            </p>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                {p.price?.toLocaleString()}₫
              </span>
              <span
                className={`px-2 py-0.5 text-xs rounded-full ${
                  p.status === "ACTIVE"
                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                    : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
                }`}
              >
                {p.status === "ACTIVE" ? "Đang bán" : "Đã tắt"}
              </span>
            </div>
          </div>
        </div>

        {/* Meta info */}
        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
          {p.categoryName && (
            <span className="flex items-center gap-1">
              <Package className="h-3 w-3" />
              {p.categoryName}
            </span>
          )}
          {((p.color && p.color.length > 0) ||
            (p.productColors && p.productColors.length > 0)) && (
            <span className="flex items-center gap-1">
              <Palette className="h-3 w-3" />
              {p.color?.length || p.productColors?.length || 0} màu sắc
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={() => onViewDetail(p.id)}
          className="flex items-center gap-1 px-3 py-2 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50"
          title="Xem chi tiết"
        >
          <Eye className="h-4 w-4" />
          <span className="hidden sm:inline">Chi tiết</span>
        </button>
        <button
          onClick={() => onEdit(p.id)}
          className="p-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors dark:text-gray-300 dark:hover:bg-gray-800 disabled:opacity-50"
          title="Sửa"
          disabled={busy}
        >
          <Edit3 className="h-4 w-4" />
        </button>
        <button
          onClick={() => onToggle(p.id, p.status)}
          className="p-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors dark:text-gray-300 dark:hover:bg-gray-800 disabled:opacity-50"
          title={p.status === "ACTIVE" ? "Tắt sản phẩm" : "Bật sản phẩm"}
          disabled={busy}
        >
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Power className="h-4 w-4" />
          )}
        </button>
        <button
          onClick={() => onDelete(p.id)}
          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors dark:text-red-400 dark:hover:bg-red-900/30 disabled:opacity-50"
          title="Xoá"
          disabled={busy}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

const SellerProductsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [list, setList] = useState<ProductItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Drawer
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [initial, setInitial] = useState<ProductFormValues | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [formKey, setFormKey] = useState(0); // Key để force re-render form

  // Color drawer (bước 2 sau khi tạo sản phẩm)
  const [colorDrawerOpen, setColorDrawerOpen] = useState(false);
  const [newProductForColor, setNewProductForColor] = useState<{
    id: string;
    name: string;
  } | null>(null);

  // Detail modal
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailProduct, setDetailProduct] = useState<ProductItem | null>(null);

  // Request state
  const [submitting, setSubmitting] = useState(false);
  const [serverMsg, setServerMsg] = useState<string | null>(null);
  const [serverErr, setServerErr] = useState<string | null>(null);

  // Busy per id for toggle/delete
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await axiosClient.get("/products");
        setList(res.data?.data ?? []);
      } catch (e: any) {
        setError(
          e?.response?.data?.message || e?.message || "Không tải được sản phẩm"
        );
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const openCreate = () => {
    // Reset về chế độ tạo mới
    setMode("create");
    setInitial({
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
      status: "ACTIVE",
      colorRequests: [],
    });
    setSelectedId(null);
    setServerMsg(null);
    setServerErr(null);

    // Tăng formKey để force re-render form
    setFormKey((prev) => prev + 1);

    // Nếu đang mở drawer edit, đóng rồi mở lại với form mới
    if (open) {
      setOpen(false);
      setTimeout(() => setOpen(true), 100);
    } else {
      setOpen(true);
    }
  };
  const openDetail = async (id: string) => {
    try {
      const res = await axiosClient.get(`/products/${id}`);
      setDetailProduct(res.data.data);
      setDetailModalOpen(true);
    } catch (e: any) {
      alert(
        e?.response?.data?.message ||
          e?.message ||
          "Không tải được chi tiết sản phẩm"
      );
    }
  };

  const openEdit = async (id: string) => {
    setMode("edit");
    setSelectedId(id);
    setInitial(null);
    setServerMsg(null);
    setServerErr(null);
    setOpen(true);
    try {
      const res = await axiosClient.get(`/products/${id}`);
      const p: ProductItem = res.data.data;

      // Map colorRequests - support both 'color' and 'productColors' formats
      let colorRequests: any[] = [];

      if (p.productColors && p.productColors.length > 0) {
        // Format from detail API: productColors
        colorRequests = p.productColors.map((pc) => ({
          productColorId: pc.id, // ⭐ QUAN TRỌNG: ID của product-color để update
          productId: p.id, // ⭐ QUAN TRỌNG: ID của product
          colorId: pc.color.id,
          colorName: pc.color.colorName,
          hexCode: pc.color.hexCode || "#000000",
          imageRequestList: (pc.images || []).map((i) => ({
            imageUrl: i.image,
            isNew: false, // Ảnh cũ không phải ảnh mới
          })),
          model3DRequestList: (pc.models3D || []).map((m) => ({
            status: m.status || "ACTIVE",
            modelUrl: m.modelUrl || "",
            format: (m.format || "OBJ") as "OBJ" | "GLB" | "FBX" | "USDZ",
            sizeInMb: m.sizeInMb || 0,
            previewImage: m.previewImage || "",
          })),
        }));
      } else if (p.color && p.color.length > 0) {
        // Format from list API: color (không có productColorId từ list API)
        // ⚠️ Cần gọi detail API để có productColorId cho chức năng thêm ảnh
        colorRequests = p.color.map((c) => ({
          productColorId: undefined, // List API không trả về, cần fetch detail
          productId: p.id, // ⭐ ID của product
          colorId: c.id,
          colorName: c.colorName,
          hexCode: c.hexCode || "#000000",
          imageRequestList: (c.images || []).map((i) => ({
            imageUrl: i.image,
            isNew: false, // Ảnh cũ không phải ảnh mới
          })),
          model3DRequestList: (c.models3D || []).map((m) => ({
            status: m.status || "ACTIVE",
            modelUrl: m.modelUrl || "",
            format: (m.format || "OBJ") as "OBJ" | "GLB" | "FBX" | "USDZ",
            sizeInMb: m.sizeInMb || 0,
            previewImage: m.previewImage || "",
          })),
        }));
      }

      // Map sang ProductFormValues
      setInitial({
        code: p.code || "",
        name: p.name || "",
        description: p.description || "",
        price: p.price || 0,
        thumbnailImage: p.thumbnailImage || "",
        weight: p.weight || 0,
        height: p.height || 0,
        width: p.width || 0,
        length: p.length || 0,
        categoryId: p.categoryId,
        status: p.status,
        materialIds: (p.materials || []).map((m) => m.id),
        colorRequests: colorRequests,
      });
    } catch (e: any) {
      setServerErr(
        e?.response?.data?.message || e?.message || "Không tải được sản phẩm"
      );
    }
  };

  const handleSubmit = async (values: ProductFormValues) => {
    setSubmitting(true);
    setServerMsg(null);
    setServerErr(null);
    try {
      if (mode === "create") {
        // Loại bỏ colorRequests khỏi payload vì API mới không hỗ trợ
        const { colorRequests: _colorRequests, ...productPayload } = values;
        const res = await axiosClient.post("/products", productPayload);

        if (res.status === 200 || res.status === 201) {
          const created: ProductItem = res.data.data;
          setList((prev) => [created, ...prev]);
          setServerMsg("Tạo sản phẩm thành công!");

          // Đóng drawer tạo sản phẩm
          setOpen(false);

          // Mở modal chỉnh sửa sản phẩm vừa tạo
          setTimeout(() => {
            openEdit(created.id);
          }, 300);
        } else {
          setServerMsg(
            res?.data?.message || "Đã gửi yêu cầu, kiểm tra kết quả"
          );
        }
      } else {
        if (!selectedId)
          throw new Error("Không xác định được ID sản phẩm đang sửa");

        // Step 1: Update product basic info (without colorRequests)
        const { colorRequests, ...productPayload } = values;
        const res = await axiosClient.put(
          `/products/${selectedId}`,
          productPayload
        );

        if (res.status === 200) {
          const updated: ProductItem = res.data.data;

          // Step 2: Update/Create productColors
          if (colorRequests && colorRequests.length > 0) {
            for (const colorReq of colorRequests) {
              try {
                let colorId = colorReq.colorId;

                // If no colorId (manual input), create new color first
                if (!colorId && colorReq.colorName && colorReq.hexCode) {
                  const newColor = await colorService.create({
                    colorName: colorReq.colorName,
                    hexCode: colorReq.hexCode,
                  });
                  colorId = newColor.id;
                }

                // ⭐ Phân biệt: UPDATE nếu có productColorId, CREATE nếu không
                console.log("🔍 Check productColorId:", {
                  colorReq,
                  hasProductColorId: !!(colorReq as any).productColorId,
                  productColorId: (colorReq as any).productColorId,
                });

                if ((colorReq as any).productColorId) {
                  // UPDATE product-color đã tồn tại - CHỈ gửi imageRequests và model3D
                  console.log(
                    "🔄 UPDATE product-color:",
                    (colorReq as any).productColorId
                  );

                  await axiosClient.put(
                    `/product-colors/${(colorReq as any).productColorId}`,
                    {
                      productId: selectedId,
                      // ❌ KHÔNG gửi colorId khi update để tránh lỗi "Color already exists"
                      status: "ACTIVE",
                      imageRequests:
                        colorReq.imageRequestList
                          ?.map((img: any) => ({
                            imageUrl: img.imageUrl ? img.imageUrl.trim() : img,
                          }))
                          .filter((img: any) => img.imageUrl || img) || [],
                      model3DRequests: colorReq.model3DRequestList || [],
                    }
                  );
                } else if (colorId) {
                  // CREATE product-color mới
                  console.log("➕ CREATE product-color for colorId:", colorId);

                  await axiosClient.post("/product-colors", {
                    productId: selectedId,
                    colorId: colorId,
                    status: "ACTIVE",
                    imageRequests:
                      colorReq.imageRequestList
                        ?.map((img: any) => ({
                          imageUrl: img.imageUrl ? img.imageUrl.trim() : img,
                        }))
                        .filter((img: any) => img.imageUrl || img) || [],
                    model3DRequests: colorReq.model3DRequestList || [],
                  });
                }
              } catch (err: any) {
                console.error("Failed to update/create product color:", err);
                setServerErr(
                  err?.response?.data?.message ||
                    "Lỗi khi xử lý màu: " + colorReq.colorName
                );
                // Continue with other colors
              }
            }

            // Refresh product to get updated productColors
            const refreshRes = await axiosClient.get(`/products/${selectedId}`);
            const refreshed: ProductItem = refreshRes.data.data;
            setList((prev) =>
              prev.map((x) => (x.id === refreshed.id ? refreshed : x))
            );
          } else {
            setList((prev) =>
              prev.map((x) => (x.id === updated.id ? updated : x))
            );
          }

          setServerMsg("Lưu thay đổi thành công!");
          setTimeout(() => setOpen(false), 600);
        } else {
          setServerMsg(
            res?.data?.message || "Đã gửi yêu cầu, kiểm tra kết quả"
          );
        }
      }
    } catch (e: any) {
      setServerErr(
        e?.response?.data?.message || e?.message || "Không thể xử lý yêu cầu"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Xác nhận xoá mềm sản phẩm này?")) return;
    setBusyId(id);
    const prev = list;
    setList((cur) => cur.filter((x) => x.id !== id));
    try {
      const res = await axiosClient.delete(`/products/${id}`);
      if (res.status !== 200) {
        setList(prev);
        alert(res?.data?.message || "Xoá không thành công");
      }
    } catch (e: any) {
      setList(prev);
      alert(
        e?.response?.data?.message || e?.message || "Không thể xoá sản phẩm"
      );
    } finally {
      setBusyId(null);
    }
  };

  const handleToggle = async (id: string, cur: Status) => {
    setBusyId(id);
    try {
      const res = await axiosClient.patch(`/products/${id}`);
      if (res.status === 200) {
        setList((prev) =>
          prev.map((x) =>
            x.id === id
              ? { ...x, status: cur === "ACTIVE" ? "INACTIVE" : "ACTIVE" }
              : x
          )
        );
      } else {
        alert(res?.data?.message || "Thao tác không thành công");
      }
    } catch (e: any) {
      alert(
        e?.response?.data?.message ||
          e?.message ||
          "Không thể thay đổi trạng thái"
      );
    } finally {
      setBusyId(null);
    }
  };

  const handleColorSubmit = async (values: ProductColorRequest) => {
    setSubmitting(true);
    setServerMsg(null);
    setServerErr(null);
    try {
      const res = await axiosClient.post("/product-colors", values);
      if (res.status === 200 || res.status === 201) {
        setServerMsg("Thêm màu sắc thành công!");
        // Refresh product list để hiển thị màu mới
        const refreshRes = await axiosClient.get("/products");
        setList(refreshRes.data?.data ?? []);
        setTimeout(() => {
          setColorDrawerOpen(false);
          setNewProductForColor(null);
        }, 600);
      } else {
        setServerMsg(res?.data?.message || "Đã gửi yêu cầu, kiểm tra kết quả");
      }
    } catch (e: any) {
      setServerErr(
        e?.response?.data?.message || e?.message || "Không thể thêm màu sắc"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkipColor = () => {
    setColorDrawerOpen(false);
    setNewProductForColor(null);
    setServerMsg(null);
    setServerErr(null);
  };

  return (
    <main className="min-h-screen w-full bg-gray-50 px-6 py-8 dark:bg-gray-950">
      {/* breadcrumb + action */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <nav
          className="text-sm text-gray-600 dark:text-gray-300"
          aria-label="Breadcrumb"
        >
          <ol className="flex items-center gap-1">
            <li>
              <Link to={DP()} className="hover:underline">
                Bảng điều khiển
              </Link>
            </li>
            <li className="opacity-60">/</li>
            <li className="font-semibold">Sản phẩm</li>
          </ol>
        </nav>

        <div className="flex items-center gap-2">
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-700 active:scale-95"
          >
            <Plus className="h-4 w-4" />
            Thêm sản phẩm
          </button>
        </div>
      </div>

      {/* list */}
      <section className="mt-6">
        <div className="mb-4 flex items-center gap-2 text-gray-700 dark:text-gray-200">
          <Package className="h-4 w-4 text-emerald-600" />
          <span className="text-sm">
            Tổng: {loading ? "-" : list.length} sản phẩm
          </span>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 rounded-3xl border border-gray-200 bg-white p-6 text-gray-600 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300">
            <Loader2 className="h-4 w-4 animate-spin" />
            Đang tải sản phẩm...
          </div>
        ) : error ? (
          <div className="rounded-3xl border border-red-300 bg-red-50 p-6 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
            {error}
          </div>
        ) : list.length === 0 ? (
          <div className="rounded-3xl border border-gray-200 bg-white p-8 text-center text-gray-600 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300">
            Chưa có sản phẩm nào. Hãy bấm <strong>Thêm sản phẩm</strong> để tạo
            mới.
          </div>
        ) : (
          <div className="space-y-3">
            {list.map((p) => (
              <ProductRow
                key={p.id}
                p={p}
                onViewDetail={openDetail}
                onEdit={openEdit}
                onDelete={handleDelete}
                onToggle={handleToggle}
                busy={busyId === p.id}
              />
            ))}
          </div>
        )}
      </section>

      {/* Drawer tạo/sửa sản phẩm */}
      <SlideOver
        open={open}
        onClose={() => setOpen(false)}
        title={mode === "edit" ? "Chỉnh sửa sản phẩm" : "Thêm sản phẩm"}
        widthClass="w-full max-w-[1280px] 2xl:max-w-[1440px]"
      >
        {mode === "edit" && !initial ? (
          <div className="rounded-3xl border border-gray-200 bg-white p-6 text-gray-600 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300">
            Đang tải chi tiết...
          </div>
        ) : (
          <ProductForm
            key={formKey}
            mode={mode}
            initial={
              initial ?? {
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
                status: "ACTIVE",
                colorRequests: [],
              }
            }
            submitting={submitting}
            serverMsg={serverMsg}
            serverErr={serverErr}
            onCancel={() => setOpen(false)}
            onSubmit={handleSubmit}
          />
        )}
      </SlideOver>

      {/* Drawer thêm màu sắc (sau khi tạo sản phẩm) */}
      <SlideOver
        open={colorDrawerOpen}
        onClose={() => setColorDrawerOpen(false)}
        title="Thêm màu sắc"
        widthClass="w-full max-w-2xl"
      >
        {newProductForColor && (
          <ProductColorForm
            productId={newProductForColor.id}
            productName={newProductForColor.name}
            submitting={submitting}
            serverMsg={serverMsg}
            serverErr={serverErr}
            onSubmit={handleColorSubmit}
            onSkip={handleSkipColor}
            onCancel={() => setColorDrawerOpen(false)}
          />
        )}
      </SlideOver>

      {/* Modal chi tiết sản phẩm */}
      {detailModalOpen && detailProduct && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setDetailModalOpen(false)}
          />

          {/* Modal */}
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-xl dark:bg-gray-900 max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-4 flex items-center justify-between z-10">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  Chi tiết sản phẩm
                </h2>
                <button
                  onClick={() => setDetailModalOpen(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  title="Đóng"
                  aria-label="Đóng modal"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* Content - 2 Column Layout: Info | Colors */}
              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* LEFT COLUMN: Product Information */}
                  <div className="space-y-6">
                    {/* Header Section: Image + Basic Info */}
                    <div className="flex flex-col gap-4">
                      {/* Thumbnail Image */}
                      <div className="w-full h-64 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                        <img
                          src={detailProduct.thumbnailImage || fallbackImg}
                          alt={detailProduct.name}
                          className="w-full h-full object-cover"
                          onError={onImgError}
                        />
                      </div>

                      {/* Basic Info */}
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                            {detailProduct.name}
                          </h3>
                          <div className="flex flex-wrap items-center gap-3 mt-2">
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Mã:{" "}
                              <span className="font-mono font-medium">
                                {detailProduct.code}
                              </span>
                            </p>
                            {detailProduct.categoryName && (
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded text-xs">
                                <Package className="h-3 w-3" />
                                {detailProduct.categoryName}
                              </span>
                            )}
                          </div>
                          {detailProduct.slug && (
                            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1 font-mono">
                              {detailProduct.slug}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                            {detailProduct.price?.toLocaleString()}₫
                          </span>
                          <span
                            className={`px-3 py-1 text-sm rounded-full ${
                              detailProduct.status === "ACTIVE"
                                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
                            }`}
                          >
                            {detailProduct.status === "ACTIVE"
                              ? "Đang bán"
                              : "Đã tắt"}
                          </span>
                        </div>

                        {/* Specifications - Inline */}
                        <div className="grid grid-cols-2 gap-3">
                          {(detailProduct.weight ?? 0) > 0 && (
                            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2.5">
                              <p className="text-xs text-gray-600 dark:text-gray-400">
                                Trọng lượng
                              </p>
                              <p className="font-semibold text-gray-900 dark:text-gray-100">
                                {detailProduct.weight} kg
                              </p>
                            </div>
                          )}
                          {(detailProduct.height ?? 0) > 0 && (
                            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2.5">
                              <p className="text-xs text-gray-600 dark:text-gray-400">
                                Cao
                              </p>
                              <p className="font-semibold text-gray-900 dark:text-gray-100">
                                {detailProduct.height} cm
                              </p>
                            </div>
                          )}
                          {(detailProduct.width ?? 0) > 0 && (
                            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2.5">
                              <p className="text-xs text-gray-600 dark:text-gray-400">
                                Rộng
                              </p>
                              <p className="font-semibold text-gray-900 dark:text-gray-100">
                                {detailProduct.width} cm
                              </p>
                            </div>
                          )}
                          {(detailProduct.length ?? 0) > 0 && (
                            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2.5">
                              <p className="text-xs text-gray-600 dark:text-gray-400">
                                Dài
                              </p>
                              <p className="font-semibold text-gray-900 dark:text-gray-100">
                                {detailProduct.length} cm
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    {detailProduct.description && (
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                          Mô tả sản phẩm
                        </h4>
                        <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed whitespace-pre-wrap">
                          {detailProduct.description}
                        </p>
                      </div>
                    )}

                    {/* Materials */}
                    {detailProduct.materials &&
                      detailProduct.materials.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
                            Vật liệu ({detailProduct.materials.length})
                          </h4>
                          <div className="space-y-2">
                            {detailProduct.materials.map((m) => (
                              <div
                                key={m.id}
                                className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                              >
                                {m.image && (
                                  <img
                                    src={m.image}
                                    alt={m.materialName}
                                    className="w-12 h-12 rounded object-cover"
                                    onError={onImgError}
                                  />
                                )}
                                <div className="flex-1">
                                  <p className="font-medium text-gray-900 dark:text-gray-100">
                                    {m.materialName}
                                  </p>
                                  {m.description && (
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                      {m.description}
                                    </p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                  </div>

                  {/* RIGHT COLUMN: Product Colors */}
                  <div className="space-y-4">
                    {detailProduct.productColors &&
                    detailProduct.productColors.length > 0 ? (
                      <>
                        <h4 className="font-semibold text-gray-900 dark:text-gray-100 sticky top-0 bg-white dark:bg-gray-900 py-2 z-10">
                          Màu sắc ({detailProduct.productColors.length})
                        </h4>
                        <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                          {detailProduct.productColors.map((pc) => {
                            const model3D =
                              pc.models3D && pc.models3D.length > 0
                                ? pc.models3D[0]
                                : null;

                            // Validate modelUrl - only show if it's a valid URL
                            const hasValidModelUrl =
                              model3D?.modelUrl &&
                              (model3D.modelUrl.startsWith("http://") ||
                                model3D.modelUrl.startsWith("https://"));

                            return (
                              <div
                                key={pc.id}
                                className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 bg-gray-50 dark:bg-gray-800"
                              >
                                {/* Color Header - Compact */}
                                <div className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-200 dark:border-gray-700">
                                  <div
                                    className="w-8 h-8 rounded-full border-2 border-gray-300 dark:border-gray-600 shrink-0"
                                    style={{
                                      backgroundColor: pc.color.hexCode,
                                    }}
                                  />
                                  <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate">
                                      {pc.color.colorName}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                                      {pc.color.hexCode}
                                    </p>
                                  </div>
                                  <span
                                    className={`px-2 py-0.5 text-xs rounded shrink-0 ${
                                      pc.status === "ACTIVE"
                                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                        : "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-400"
                                    }`}
                                  >
                                    {pc.status === "ACTIVE"
                                      ? "Hoạt động"
                                      : "Tắt"}
                                  </span>
                                </div>

                                {/* Images Gallery - Responsive Grid */}
                                {pc.images && pc.images.length > 0 && (
                                  <div className="mb-3">
                                    <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                                      {pc.images.length} hình ảnh
                                    </p>
                                    <div className="grid grid-cols-3 gap-2">
                                      {pc.images.map((img) => (
                                        <div
                                          key={img.id}
                                          className="aspect-square rounded overflow-hidden bg-gray-200 dark:bg-gray-700"
                                        >
                                          <img
                                            src={img.image}
                                            alt={`${pc.color.colorName} - ${img.id}`}
                                            className="w-full h-full object-cover hover:scale-110 transition-transform cursor-pointer"
                                            onError={onImgError}
                                          />
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Single 3D Model - Compact */}
                                {model3D && hasValidModelUrl && (
                                  <div className="flex items-center gap-2 p-2 bg-white dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700">
                                    {model3D.previewImage && (
                                      <img
                                        src={model3D.previewImage}
                                        alt="3D Model"
                                        className="w-12 h-12 rounded object-cover shrink-0"
                                        onError={onImgError}
                                      />
                                    )}
                                    <div className="flex-1 min-w-0">
                                      <p className="text-xs font-medium text-gray-900 dark:text-gray-100">
                                        Model 3D - {model3D.format}
                                      </p>
                                      <p className="text-xs text-gray-500 dark:text-gray-400">
                                        {model3D.sizeInMb} MB
                                      </p>
                                      {model3D.modelUrl && (
                                        <a
                                          href={model3D.modelUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                                        >
                                          Xem →
                                        </a>
                                      )}
                                    </div>
                                    <span
                                      className={`px-1.5 py-0.5 text-xs rounded shrink-0 ${
                                        model3D.status === "ACTIVE"
                                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                          : "bg-gray-200 text-gray-700"
                                      }`}
                                    >
                                      {model3D.status}
                                    </span>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center justify-center h-64 text-gray-400 dark:text-gray-600">
                        <p>Chưa có màu sắc</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="sticky bottom-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 px-6 py-4">
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => setDetailModalOpen(false)}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    Đóng
                  </button>
                  <button
                    onClick={() => {
                      setDetailModalOpen(false);
                      openEdit(detailProduct.id);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Edit3 className="h-4 w-4" />
                    Chỉnh sửa
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default SellerProductsPage;
