/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Tags, Loader2, Trash2, Edit3 } from "lucide-react";
import axiosClient from "@/service/axiosClient";
import { DP } from "@/router/paths";
import SlideOver from "@/components/SlideOver";
import CategoryForm, {
  type CategoryFormValues,
  type Status,
} from "./CategoryForm";
import { useToast } from "@/context/ToastContext";
import { useConfirm } from "@/context/ConfirmContext";

interface Category {
  id: number;
  categoryName: string;
  description?: string;
  image?: string;
  status: Status;
  createdAt: string;
  updatedAt: string;
}

const fallbackImg =
  "https://images.unsplash.com/photo-1540573133985-87b6da6d54a9?auto=format&fit=crop&w=1200&q=80";

const onImgError = (e: React.SyntheticEvent<HTMLImageElement>) => {
  const t = e.currentTarget as HTMLImageElement;
  if ((t as any)._fb) return;
  (t as any)._fb = 1;
  t.src = fallbackImg;
};

const CategoryCard: React.FC<{
  c: Category;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
  deleting: boolean;
}> = ({ c, onEdit, onDelete, deleting }) => {
  const img = c.image || fallbackImg;
  return (
    <div className="group relative overflow-hidden rounded-3xl border border-emerald-100 bg-white shadow-sm dark:border-emerald-900/40 dark:bg-gray-900">
      <img
        src={img}
        alt={c.categoryName}
        className="h-44 w-full object-cover transition-transform duration-700 group-hover:scale-105"
        onError={onImgError}
      />
      <div className="absolute inset-0 bg-linear-to-t from-black/50 via-black/20 to-transparent" />
      <div className="absolute bottom-4 left-4 right-4 text-white drop-shadow">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs opacity-90">
              {c.status === "ACTIVE" ? "Đang hoạt động" : "Tạm ẩn"}
            </div>
            <div className="text-xl font-bold">{c.categoryName}</div>
          </div>
        </div>
      </div>

      {/* actions góc phải trên */}
      <div className="absolute right-3 top-3 z-10 flex items-center gap-1">
        <button
          onClick={() => onEdit(c.id)}
          className="inline-flex items-center rounded-lg bg-white/90 p-2 text-gray-800 backdrop-blur hover:bg-white dark:bg-gray-800/90 dark:text-gray-100"
          title="Sửa"
          disabled={deleting}
        >
          <Edit3 className="h-4 w-4" />
        </button>
        <button
          className="inline-flex items-center rounded-lg bg-white/90 p-2 text-gray-800 backdrop-blur hover:bg-white dark:bg-gray-800/90 dark:text-gray-100 disabled:opacity-60"
          title="Xoá (soft delete)"
          onClick={() => onDelete(c.id)}
          disabled={deleting}
        >
          {deleting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4" />
          )}
        </button>
      </div>
    </div>
  );
};

const AdminCategoriesPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [list, setList] = useState<Category[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();
  const confirm = useConfirm();

  // Drawer state
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [initial, setInitial] = useState<CategoryFormValues | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  // Request state
  const [submitting, setSubmitting] = useState(false);
  const [serverMsg, setServerMsg] = useState<string | null>(null);
  const [serverErr, setServerErr] = useState<string | null>(null);

  // Track xoá theo từng id
  const [deletingIds, setDeletingIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    (async () => {
      try {
        const res = await axiosClient.get("/categories"); // baseURL đã có /api
        setList(res.data?.data ?? []);
      } catch (e: any) {
        setError(
          e?.response?.data?.message || e?.message || "Không tải được danh mục"
        );
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const openCreate = () => {
    setMode("create");
    setInitial(null);
    setSelectedId(null);
    setServerMsg(null);
    setServerErr(null);
    setOpen(true);
  };

  const openEdit = async (id: number) => {
    setMode("edit");
    setSelectedId(id);
    setInitial(null);
    setServerMsg(null);
    setServerErr(null);
    setOpen(true);
    try {
      const res = await axiosClient.get(`/categories/${id}`);
      const c: Category = res.data.data;
      setInitial({
        categoryName: c.categoryName,
        description: c.description ?? "",
        status: c.status,
        image: c.image ?? "",
      });
    } catch (e: any) {
      setServerErr(
        e?.response?.data?.message || e?.message || "Không tải được danh mục"
      );
    }
  };

  const handleSubmit = async (values: CategoryFormValues) => {
    setSubmitting(true);
    setServerMsg(null);
    setServerErr(null);
    try {
      if (mode === "create") {
        const res = await axiosClient.post("/categories", values);
        if (res.status === 201) {
          const created: Category = res.data.data;
          setList((prev) => [created, ...prev]);
          setServerMsg("Tạo danh mục thành công!");
          setTimeout(() => setOpen(false), 600);
        } else {
          setServerMsg(
            res?.data?.message || "Đã gửi yêu cầu, kiểm tra kết quả"
          );
        }
      } else {
        if (!selectedId)
          throw new Error("Không xác định được ID danh mục đang sửa");
        const res = await axiosClient.put(`/categories/${selectedId}`, values);
        if (res.status === 200) {
          const updated: Category = res.data.data;
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

  // ✅ Soft delete /categories/{id}
  const handleDelete = async (id: number) => {
    const isConfirmed = await confirm({
      title: "Xác nhận xoá",
      message: "Bạn có chắc chắn muốn xoá mềm danh mục này không?",
      confirmLabel: "Xoá",
      variant: "danger"
    });

    if (!isConfirmed) return;
    // đánh dấu đang xoá
    setDeletingIds((s) => new Set(s).add(id));
    // lạc quan: xoá khỏi UI trước
    const prev = list;
    setList((cur) => cur.filter((c) => c.id !== id));

    try {
      const res = await axiosClient.delete(`/categories/${id}`);
      if (res.status !== 200) {
        // lỗi: khôi phục
        setList(prev);
        showToast({
          type: "error",
          title: "Lỗi",
          description: res?.data?.message || "Xoá không thành công",
        });
      }
    } catch (e: any) {
      setList(prev);
      showToast({
        type: "error",
        title: "Lỗi",
        description:
          e?.response?.data?.message || e?.message || "Không thể xoá danh mục",
      });
    } finally {
      setDeletingIds((s) => {
        const n = new Set(s);
        n.delete(id);
        return n;
      });
    }
  };

  return (
    <main className="min-h-screen w-full bg-gray-50 px-6 py-8 dark:bg-gray-950">
      {/* breadcrumb + actions */}
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
            <li className="font-semibold">Danh mục</li>
          </ol>
        </nav>

        <div className="flex items-center gap-2">
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-700 active:scale-95"
          >
            <Plus className="h-4 w-4" />
            Thêm danh mục
          </button>
        </div>
      </div>

      {/* danh sách */}
      <section className="mt-6">
        <div className="mb-4 flex items-center gap-2 text-gray-700 dark:text-gray-200">
          <Tags className="h-4 w-4 text-emerald-600" />
          <span className="text-sm">
            Tổng: {loading ? "-" : list.length} danh mục
          </span>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 rounded-3xl border border-gray-200 bg-white p-6 text-gray-600 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300">
            <Loader2 className="h-4 w-4 animate-spin" />
            Đang tải danh mục...
          </div>
        ) : error ? (
          <div className="rounded-3xl border border-red-300 bg-red-50 p-6 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
            {error}
          </div>
        ) : list.length === 0 ? (
          <div className="rounded-3xl border border-gray-200 bg-white p-8 text-center text-gray-600 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300">
            Chưa có danh mục nào. Hãy bấm <strong>Thêm danh mục</strong> để tạo
            mới.
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((c) => (
              <CategoryCard
                key={c.id}
                c={c}
                onEdit={openEdit}
                onDelete={handleDelete}
                deleting={deletingIds.has(c.id)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Drawer: create/edit */}
      <SlideOver
        open={open}
        onClose={() => setOpen(false)}
        title={mode === "edit" ? "Chỉnh sửa danh mục" : "Thêm danh mục"}
        widthClass="w-full max-w-2xl"
      >
        {mode === "edit" && !initial ? (
          <div className="rounded-3xl border border-gray-200 bg-white p-6 text-gray-600 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300">
            Đang tải chi tiết...
          </div>
        ) : (
          <CategoryForm
            mode={mode}
            initial={
              mode === "create"
                ? {
                    categoryName: "",
                    description: "",
                    status: "ACTIVE",
                    image: "",
                  }
                : initial ?? undefined
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

export default AdminCategoriesPage;
