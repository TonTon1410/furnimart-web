import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Loader2, Trash2, Edit3, Eye } from "lucide-react";
import axiosClient from "@/service/axiosClient";
import { DP } from "@/router/paths";
import SlideOver from "@/components/SlideOver";
import StoreForm, { type StoreFormValues } from "./StoreForm";
import type { AxiosError } from "axios";

interface StoreType {
  id: string;
  name: string;
  city: string;
  ward: string;
  street: string;
  addressLine: string;
  latitude: number;
  longitude: number;
  status: "ACTIVE" | "INACTIVE";
  createdAt?: string;
  updatedAt?: string;
  users?: {
    id: string;
    fullName: string;
    email: string;
    phone: string;
    role: string;
  }[];
}

const AdminStoresPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [list, setList] = useState<StoreType[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Drawer state
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"create" | "edit" | "detail">("create");
  const [selected, setSelected] = useState<StoreType | null>(null);
  const [initial, setInitial] = useState<StoreFormValues | null>(null);

  // request state
  const [submitting, setSubmitting] = useState(false);
  const [serverMsg, setServerMsg] = useState<string | null>(null);
  const [serverErr, setServerErr] = useState<string | null>(null);

  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());

  // load store list
  useEffect(() => {
    (async () => {
      try {
        const res = await axiosClient.get("/stores");
        setList(res.data?.data ?? []);
      } catch (e: unknown) {
        const err = e as AxiosError<{ message?: string }>;
        setError(
          err.response?.data?.message ||
            err.message ||
            "Không tải được danh sách cửa hàng"
        );
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const openCreate = () => {
    setMode("create");
    setSelected(null);
    setInitial(null);
    setServerMsg(null);
    setServerErr(null);
    setOpen(true);
  };

  const openEdit = (store: StoreType) => {
    setMode("edit");
    setSelected(store);
    setServerMsg(null);
    setServerErr(null);
    setOpen(true);

    setInitial({
      name: store.name,
      city: store.city,
      ward: store.ward,
      street: store.street,
      addressLine: store.addressLine,
      latitude: store.latitude,
      longitude: store.longitude,
      status: store.status,
    });
  };

  const openDetail = (store: StoreType) => {
    setMode("detail");
    setSelected(store);
    setOpen(true);
  };

  const handleSubmit = async (values: StoreFormValues) => {
    setSubmitting(true);
    setServerMsg(null);
    setServerErr(null);

    try {
      if (mode === "create") {
        const res = await axiosClient.post("/stores", values);
        const created: StoreType = res.data.data;
        setList((prev) => [created, ...prev]);
        setServerMsg("Tạo cửa hàng thành công!");
        setTimeout(() => setOpen(false), 600);
      } else if (mode === "edit" && selected) {
        const res = await axiosClient.put(`/stores/${selected.id}`, values);
        const updated: StoreType = res.data.data;
        setList((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
        setServerMsg("Lưu thay đổi thành công!");
        setTimeout(() => setOpen(false), 600);
      }
    } catch (e: unknown) {
      const err = e as AxiosError<{ message?: string }>;
      setServerErr(
        err.response?.data?.message || err.message || "Không thể xử lý yêu cầu"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Xác nhận xoá cửa hàng này?")) return;
    setDeletingIds((s) => new Set(s).add(id));
    const prev = list;
    setList((cur) => cur.filter((u) => u.id !== id));

    try {
      const res = await axiosClient.delete(`/stores/${id}`);
      if (res.status !== 204) {
        setList(prev);
        alert(res?.data?.message || "Xoá không thành công");
      }
    } catch (e: unknown) {
      const err = e as AxiosError<{ message?: string }>;
      setList(prev);
      alert(
        err.response?.data?.message || err.message || "Không thể xoá cửa hàng"
      );
    } finally {
      setDeletingIds((s) => {
        const n = new Set(s);
        n.delete(id);
        return n;
      });
    }
  };

  return (
    <main className="min-h-screen w-full bg-gradient-to-br from-gray-50 via-white to-gray-50 px-6 py-8 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      {/* Header với gradient */}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-white p-6 shadow-sm dark:bg-gray-900">
        <div>
          <nav
            className="mb-2 text-sm text-gray-600 dark:text-gray-400"
            aria-label="Breadcrumb"
          >
            <ol className="flex items-center gap-1.5">
              <li>
                <Link
                  to={DP()}
                  className="hover:text-emerald-600 dark:hover:text-emerald-400"
                >
                  Bảng điều khiển
                </Link>
              </li>
              <li className="opacity-60">/</li>
              <li className="font-semibold text-gray-900 dark:text-gray-100">
                Quản lý cửa hàng
              </li>
            </ol>
          </nav>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Danh sách cửa hàng
          </h1>
        </div>

        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/30 transition-all hover:shadow-xl hover:shadow-emerald-500/40 active:scale-95"
        >
          <Plus className="h-5 w-5" />
          Thêm cửa hàng
        </button>
      </div>

      <section className="mt-6">
        {loading ? (
          <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-8 text-gray-600 shadow-sm dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300">
            <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
            <span className="font-medium">Đang tải danh sách cửa hàng...</span>
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-red-700 shadow-sm dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
            <p className="font-semibold">⚠️ {error}</p>
          </div>
        ) : list.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center text-gray-600 shadow-sm dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300">
            <p className="text-lg font-medium">Chưa có cửa hàng nào</p>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Nhấn "Thêm cửa hàng" để tạo cửa hàng mới
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg dark:border-gray-800 dark:bg-gray-900">
            <table className="min-w-full text-sm">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-800/80">
                <tr>
                  <th className="px-6 py-4 text-left font-semibold text-gray-700 dark:text-gray-200">
                    Tên cửa hàng
                  </th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-700 dark:text-gray-200">
                    Địa chỉ
                  </th>
                  <th className="px-6 py-4 text-center font-semibold text-gray-700 dark:text-gray-200">
                    Trạng thái
                  </th>
                  <th className="px-6 py-4 text-center font-semibold text-gray-700 dark:text-gray-200">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {list.map((st) => (
                  <tr
                    key={st.id}
                    className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    <td className="px-6 py-4">
                      <p className="font-semibold text-gray-900 dark:text-gray-100">
                        {st.name}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                      {st.addressLine || `${st.street}, ${st.ward}, ${st.city}`}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                          st.status === "ACTIVE"
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                            : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
                        }`}
                      >
                        {st.status === "ACTIVE"
                          ? "✓ Hoạt động"
                          : "○ Không hoạt động"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => openDetail(st)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 transition-all hover:bg-blue-100 active:scale-95 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30"
                        >
                          <Eye className="h-4 w-4" /> Chi tiết
                        </button>
                        <button
                          onClick={() => openEdit(st)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700 transition-all hover:bg-amber-100 active:scale-95 dark:bg-amber-900/20 dark:text-amber-400 dark:hover:bg-amber-900/30"
                        >
                          <Edit3 className="h-4 w-4" /> Sửa
                        </button>
                        <button
                          onClick={() => handleDelete(st.id)}
                          disabled={deletingIds.has(st.id)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 transition-all hover:bg-red-100 active:scale-95 disabled:opacity-50 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30"
                        >
                          {deletingIds.has(st.id) ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                          Xoá
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <SlideOver
        open={open}
        onClose={() => setOpen(false)}
        title={
          mode === "edit"
            ? "Chỉnh sửa cửa hàng"
            : mode === "detail"
            ? "Chi tiết cửa hàng"
            : "Thêm cửa hàng"
        }
        widthClass="w-full max-w-2xl"
      >
        {mode === "detail" && selected ? (
          <div className="space-y-6">
            {/* Thông tin cơ bản */}
            <div className="rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100/50 p-6 dark:from-emerald-900/20 dark:to-emerald-900/10">
              <h3 className="mb-4 text-lg font-bold text-gray-900 dark:text-gray-100">
                Thông tin cửa hàng
              </h3>
              <div className="grid gap-4 text-sm">
                <div className="flex items-start gap-3">
                  <span className="font-semibold text-gray-600 dark:text-gray-400 min-w-[100px]">
                    Tên:
                  </span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {selected.name}
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="font-semibold text-gray-600 dark:text-gray-400 min-w-[100px]">
                    Địa chỉ:
                  </span>
                  <span className="text-gray-700 dark:text-gray-300">
                    {selected.addressLine}, {selected.ward}, {selected.street},{" "}
                    {selected.city}
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="font-semibold text-gray-600 dark:text-gray-400 min-w-[100px]">
                    Tọa độ:
                  </span>
                  <span className="text-gray-700 dark:text-gray-300">
                    {selected.latitude}, {selected.longitude}
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="font-semibold text-gray-600 dark:text-gray-400 min-w-[100px]">
                    Trạng thái:
                  </span>
                  <span
                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                      selected.status === "ACTIVE"
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                        : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
                    }`}
                  >
                    {selected.status === "ACTIVE"
                      ? "✓ Hoạt động"
                      : "○ Không hoạt động"}
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="font-semibold text-gray-600 dark:text-gray-400 min-w-[100px]">
                    Ngày tạo:
                  </span>
                  <span className="text-gray-700 dark:text-gray-300">
                    {selected.createdAt &&
                      new Date(selected.createdAt).toLocaleString("vi-VN")}
                  </span>
                </div>
              </div>
            </div>

            {/* Danh sách nhân viên */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800/50">
              <h3 className="mb-4 text-lg font-bold text-gray-900 dark:text-gray-100">
                👥 Nhân viên cửa hàng ({selected.users?.length || 0})
              </h3>
              {selected.users?.length ? (
                <div className="space-y-3">
                  {selected.users.map((u) => (
                    <div
                      key={u.id}
                      className="rounded-lg border border-gray-200 bg-gray-50 p-4 transition-all hover:shadow-md dark:border-gray-700 dark:bg-gray-900/50"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900 dark:text-gray-100">
                            {u.fullName}
                          </p>
                          <div className="mt-2 flex flex-wrap gap-3 text-xs text-gray-600 dark:text-gray-400">
                            <span className="flex items-center gap-1">
                              📧 {u.email}
                            </span>
                            <span className="flex items-center gap-1">
                              📱 {u.phone}
                            </span>
                          </div>
                        </div>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap ${
                            u.role === "MANAGER"
                              ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                              : u.role === "STAFF"
                              ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                              : "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                          }`}
                        >
                          {u.role === "MANAGER"
                            ? "👔 Quản lý"
                            : u.role === "STAFF"
                            ? "🛍️ Nhân viên"
                            : "🚚 Giao hàng"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-8 text-center dark:border-gray-700 dark:bg-gray-900/30">
                  <p className="text-gray-500 dark:text-gray-400">
                    Chưa có nhân viên nào
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <StoreForm
            mode={mode as "create" | "edit"}
            storeId={selected?.id}
            initial={initial ?? undefined}
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

export default AdminStoresPage;
