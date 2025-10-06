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
        setError(err.response?.data?.message || err.message || "Không tải được danh sách cửa hàng");
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
      setServerErr(err.response?.data?.message || err.message || "Không thể xử lý yêu cầu");
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
      alert(err.response?.data?.message || err.message || "Không thể xoá cửa hàng");
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <nav className="text-sm text-gray-600 dark:text-gray-300" aria-label="Breadcrumb">
          <ol className="flex items-center gap-1">
            <li>
              <Link to={DP()} className="hover:underline">
                Bảng điều khiển
              </Link>
            </li>
            <li className="opacity-60">/</li>
            <li className="font-semibold">Quản lý cửa hàng</li>
          </ol>
        </nav>

        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-700 active:scale-95"
        >
          <Plus className="h-4 w-4" />
          Thêm cửa hàng
        </button>
      </div>

      <section className="mt-6">
        {loading ? (
          <div className="flex items-center gap-2 rounded-3xl border border-gray-200 bg-white p-6 text-gray-600 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300">
            <Loader2 className="h-4 w-4 animate-spin" />
            Đang tải cửa hàng...
          </div>
        ) : error ? (
          <div className="rounded-3xl border border-red-300 bg-red-50 p-6 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
            {error}
          </div>
        ) : list.length === 0 ? (
          <div className="rounded-3xl border border-gray-200 bg-white p-8 text-center text-gray-600 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300">
            Không có cửa hàng nào.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-3xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
            <table className="min-w-full text-sm text-gray-700 dark:text-gray-300">
              <thead className="bg-gray-100 dark:bg-gray-800">
                <tr>
                  <th className="px-3 py-3 text-left font-semibold">Tên</th>
                  <th className="px-3 py-3 text-left font-semibold">Địa chỉ</th>
                  <th className="px-3 py-3 text-left font-semibold">Trạng thái</th>
                  <th className="px-3 py-3 text-center font-semibold">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {list.map((st) => (
                  <tr
                    key={st.id}
                    className="border-t border-gray-100 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/40"
                  >
                    <td className="px-3 py-3 font-medium">{st.name}</td>
                    <td className="px-3 py-3">
                      {st.addressLine || `${st.street}, ${st.ward}, ${st.city}`}
                    </td>
                    <td className="px-3 py-3">{st.status}</td>
                    <td className="px-3 py-3">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => openDetail(st)}
                          className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                        >
                          <Eye className="h-4 w-4" /> Chi tiết
                        </button>
                        <button
                          onClick={() => openEdit(st)}
                          className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                        >
                          <Edit3 className="h-4 w-4" /> Sửa
                        </button>
                        <button
                          onClick={() => handleDelete(st.id)}
                          disabled={deletingIds.has(st.id)}
                          className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-white px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 active:scale-95 disabled:opacity-60 dark:border-red-800 dark:bg-gray-900 dark:text-red-300"
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
          <div className="space-y-4 text-sm text-gray-700 dark:text-gray-300">
            <p>
              <strong>Tên:</strong> {selected.name}
            </p>
            <p>
              <strong>Địa chỉ:</strong> {selected.addressLine}, {selected.ward},{" "}
              {selected.street}, {selected.city}
            </p>
            <p>
              <strong>Tọa độ:</strong> {selected.latitude}, {selected.longitude}
            </p>
            <p>
              <strong>Trạng thái:</strong> {selected.status}
            </p>
            <p>
              <strong>Ngày tạo:</strong>{" "}
              {selected.createdAt && new Date(selected.createdAt).toLocaleString("vi-VN")}
            </p>

            <div>
              <h4 className="font-semibold mb-2">Nhân viên cửa hàng</h4>
              {selected.users?.length ? (
                <ul className="space-y-2">
                  {selected.users.map((u) => (
                    <li
                      key={u.id}
                      className="rounded-lg border px-3 py-2 dark:border-gray-700"
                    >
                      <p className="font-medium">{u.fullName}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {u.email} - {u.phone} ({u.role})
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500">Chưa có nhân viên nào</p>
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
