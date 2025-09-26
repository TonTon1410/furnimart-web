/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Package, Loader2, Trash2, Edit3, Power } from "lucide-react";
import axiosClient from "@/service/axiosClient";
import { DP } from "@/router/paths";
import SlideOver from "@/components/SlideOver";
import ProductForm, {
  type ProductFormValues,
  type Status,
} from "./ProductForm";

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
  color?: Array<{
    id: string;
    colorName: string;
    hexCode: string;
    images?: { image: string }[];
    models3D?: any[];
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

const Card: React.FC<{
  p: ProductItem;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string, cur: Status) => void;
  busy?: boolean;
}> = ({ p, onEdit, onDelete, onToggle, busy }) => {
  return (
    <div className="group relative overflow-hidden rounded-3xl border border-emerald-100 bg-white shadow-sm dark:border-emerald-900/40 dark:bg-gray-900">
      <img
        src={p.thumbnailImage || fallbackImg}
        alt={p.name}
        className="h-44 w-full object-cover transition-transform duration-700 group-hover:scale-105"
        onError={onImgError}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent" />
      <div className="absolute bottom-4 left-4 right-4 text-white drop-shadow">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs opacity-90">
              {p.status === "ACTIVE" ? "Đang bán" : "Đã tắt"}
            </div>
            <div className="text-xl font-bold">{p.name}</div>
            <div className="text-sm opacity-90 mt-0.5">
              {p.price?.toLocaleString()}₫
            </div>
          </div>
        </div>
      </div>

      <div className="absolute right-3 top-3 z-10 flex items-center gap-1">
        <button
          onClick={() => onEdit(p.id)}
          className="inline-flex items-center rounded-lg bg-white/90 p-2 text-gray-800 backdrop-blur hover:bg-white dark:bg-gray-800/90 dark:text-gray-100 disabled:opacity-60"
          title="Sửa"
          disabled={busy}
        >
          <Edit3 className="h-4 w-4" />
        </button>
        <button
          onClick={() => onToggle(p.id, p.status)}
          className="inline-flex items-center rounded-lg bg-white/90 p-2 text-gray-800 backdrop-blur hover:bg-white dark:bg-gray-800/90 dark:text-gray-100 disabled:opacity-60"
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
          className="inline-flex items-center rounded-lg bg-white/90 p-2 text-gray-800 backdrop-blur hover:bg-white dark:bg-gray-800/90 dark:text-gray-100 disabled:opacity-60"
          title="Xoá (soft delete)"
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
      colorRequests: [],
    });
    setSelectedId(null);
    setServerMsg(null);
    setServerErr(null);
    setOpen(true);
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
        materialIds: (p.materials || []).map((m) => m.id),
        colorRequests: (p.color || []).map((c) => ({
          colorName: c.colorName,
          hexCode: c.hexCode || "#000000",
          imageRequestList: (c.images || []).map((i) => ({
            imageUrl: i.image,
          })),
        })),
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
        const res = await axiosClient.post("/products", values);
        // Spec ghi 200, nhưng nhiều back trả 201 — ở đây chấp nhận 200/201
        if (res.status === 200 || res.status === 201) {
          const created: ProductItem = res.data.data;
          setList((prev) => [created, ...prev]);
          setServerMsg("Tạo sản phẩm thành công!");
          setTimeout(() => setOpen(false), 600);
        } else {
          setServerMsg(
            res?.data?.message || "Đã gửi yêu cầu, kiểm tra kết quả"
          );
        }
      } else {
        if (!selectedId)
          throw new Error("Không xác định được ID sản phẩm đang sửa");
        const res = await axiosClient.put(`/products/${selectedId}`, values);
        if (res.status === 200) {
          const updated: ProductItem = res.data.data;
          setList((prev) =>
            prev.map((x) => (x.id === updated.id ? updated : x))
          );
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
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((p) => (
              <Card
                key={p.id}
                p={p}
                onEdit={openEdit}
                onDelete={handleDelete}
                onToggle={handleToggle}
                busy={busyId === p.id}
              />
            ))}
          </div>
        )}
      </section>

      {/* Drawer */}
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
    </main>
  );
};

export default SellerProductsPage;
