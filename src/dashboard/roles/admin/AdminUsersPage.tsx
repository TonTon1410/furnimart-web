/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Plus,
  Users,
  Loader2,
  Trash2,
  Edit3,
  Mail,
  Phone as PhoneIcon,
  CalendarDays,
} from "lucide-react";
import axiosClient from "@/service/axiosClient";
import { DP } from "@/router/paths";
import SlideOver from "@/components/SlideOver";
import UserForm, { type UserFormValues, type Status, type Role } from "./UserForm";

// -------- Types ----------
interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  gender: boolean; // true: Nam, false: Nữ
  birthday?: string;
  avatar?: string;
  role: Role;      // "STAFF" | "MANAGER" | "DELIVERY" | "ADMIN"
  status: Status;  // "ACTIVE" | "INACTIVE"
  cccd?: string;
  point?: number;
  createdAt?: string;
  updatedAt?: string;
}

// -------- Helpers ----------
const fallbackImg =
  "https://images.unsplash.com/photo-1616627981169-f97ab76673be?auto=format&fit=crop&w=1200&q=80";

const onImgError = (e: React.SyntheticEvent<HTMLImageElement>) => {
  const t = e.currentTarget as HTMLImageElement & { _fb?: number };
  if (t._fb) return;
  t._fb = 1;
  t.src = fallbackImg;
};

const genderText = (g: boolean) => (g ? "Nam" : "Nữ");

// -------- Badges ----------
const RoleBadge: React.FC<{ role: Role }> = ({ role }) => {
  const map: Record<Role, string> = {
    STAFF:
      "bg-sky-50 text-sky-700 ring-sky-200 dark:bg-sky-900/20 dark:text-sky-300 dark:ring-sky-800",
    MANAGER:
      "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:ring-amber-800",
    DELIVERY:
      "bg-violet-50 text-violet-700 ring-violet-200 dark:bg-violet-900/20 dark:text-violet-300 dark:ring-violet-800",
    ADMIN:
      "bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-900/20 dark:text-rose-300 dark:ring-rose-800",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ring-1 ${map[role]}`}
    >
      {role}
    </span>
  );
};

const StatusBadge: React.FC<{ status: Status }> = ({ status }) => {
  const active = status === "ACTIVE";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ring-1 ${
        active
          ? "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:ring-emerald-800"
          : "bg-gray-100 text-gray-700 ring-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:ring-gray-700"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          active ? "bg-emerald-500" : "bg-gray-400"
        }`}
      />
      {active ? "Active" : "Inactive"}
    </span>
  );
};

// -------- Tile (card) hiện đại ----------
const UserTile: React.FC<{
  u: User;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  deleting: boolean;
}> = ({ u, onEdit, onDelete, deleting }) => {
  const img = u.avatar || fallbackImg;

  return (
    <div
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md dark:border-gray-800 dark:bg-gray-900"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter") onEdit(u.id);
      }}
    >
      {/* Header với avatar + badges */}
      <div className="flex items-start gap-4 p-4">
        <img
          src={img}
          alt={u.fullName}
          className="h-16 w-16 rounded-xl object-cover ring-1 ring-gray-200 dark:ring-gray-700"
          onError={onImgError}
        />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-base font-semibold text-gray-900 dark:text-gray-100">
              {u.fullName}
            </h3>
            <RoleBadge role={u.role} />
            <StatusBadge status={u.status} />
          </div>
          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
            {genderText(u.gender)}
            {u.birthday
              ? ` • ${new Date(u.birthday).toLocaleDateString("vi-VN")}`
              : ""}
          </p>
        </div>
      </div>

      {/* Info hàng 2 */}
      <div className="grid grid-cols-3 gap-2 px-4 pb-3 text-sm">
        <div className="flex items-center gap-2 truncate text-gray-700 dark:text-gray-300">
          <Mail className="h-4 w-4 text-gray-400" />
          <span className="truncate">{u.email || "—"}</span>
        </div>
        <div className="flex items-center gap-2 truncate text-gray-700 dark:text-gray-300">
          <PhoneIcon className="h-4 w-4 text-gray-400" />
          <span className="truncate">{u.phone || "—"}</span>
        </div>
        <div className="flex items-center gap-2 truncate text-gray-700 dark:text-gray-300">
          <CalendarDays className="h-4 w-4 text-gray-400" />
          <span className="truncate">
            {u.createdAt
              ? new Date(u.createdAt).toLocaleDateString("vi-VN")
              : "—"}
          </span>
        </div>
      </div>

      {/* Footer actions */}
      <div className="mt-auto flex items-center justify-between gap-2 border-t border-gray-100 px-4 py-2 dark:border-gray-800">
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {u.cccd ? `CCCD: ${u.cccd}` : ""}
          {u.cccd && (u.point ?? 0) > 0 ? " • " : ""}
          {(u.point ?? 0) > 0 ? `Điểm: ${u.point}` : ""}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onEdit(u.id)}
            className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 active:scale-95 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
            title="Sửa"
          >
            <Edit3 className="h-4 w-4" />
            Sửa
          </button>
          <button
            onClick={() => onDelete(u.id)}
            disabled={deleting}
            className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-white px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 active:scale-95 disabled:opacity-60 dark:border-red-800 dark:bg-gray-900 dark:text-red-300"
            title="Xoá (soft delete)"
          >
            {deleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            Xoá
          </button>
        </div>
      </div>

      {/* Glow hover */}
      <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition group-hover:opacity-100">
        <div className="absolute inset-0 -z-10 blur-2xl [background:radial-gradient(50%_40%_at_50%_0%,rgba(16,185,129,.10),transparent)]" />
      </div>
    </div>
  );
};

// -------- Page ----------
const AdminUsersPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [list, setList] = useState<User[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Drawer state
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [initial, setInitial] = useState<UserFormValues | null>(null);

  // request state
  const [submitting, setSubmitting] = useState(false);
  const [serverMsg, setServerMsg] = useState<string | null>(null);
  const [serverErr, setServerErr] = useState<string | null>(null);

  // xoá theo id
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());

  // filters
  const [q, setQ] = useState("");
  const [roleFilter, setRoleFilter] = useState<Role | "ALL">("ALL");
  const [statusFilter, setStatusFilter] = useState<Status | "ALL">("ALL");

  useEffect(() => {
    (async () => {
      try {
        const res = await axiosClient.get("/users");
        setList(res.data?.data ?? []);
      } catch (e: any) {
        setError(
          e?.response?.data?.message || e?.message || "Không tải được danh sách tài khoản"
        );
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    let arr = [...list];
    if (q.trim()) {
      const s = q.toLowerCase();
      arr = arr.filter((u) =>
        [u.fullName, u.email, u.phone]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(s))
      );
    }
    if (roleFilter !== "ALL") arr = arr.filter((u) => u.role === roleFilter);
    if (statusFilter !== "ALL")
      arr = arr.filter((u) => u.status === statusFilter);
    return arr;
  }, [list, q, roleFilter, statusFilter]);

  // open create
  const openCreate = () => {
    setMode("create");
    setSelectedId(null);
    setInitial(null);
    setServerMsg(null);
    setServerErr(null);
    setOpen(true);
  };

  // open edit
  const openEdit = (id: string) => {
    setMode("edit");
    setSelectedId(id);
    setServerMsg(null);
    setServerErr(null);
    setOpen(true);

    const u = list.find((x) => x.id === id);
    if (!u) return;
    setInitial({
      fullName: u.fullName,
      email: u.email || "",
      phone: u.phone || "",
      avatar: u.avatar || "",
      gender: !!u.gender,
      birthday: u.birthday ? u.birthday.substring(0, 10) : "",
      role: u.role, // PUT không nhận role → khoá ở form khi edit
      status: u.status,
      cccd: u.cccd || "",
      point: u.point ?? 0,
    });
  };

  // submit (POST | PUT)
  const handleSubmit = async (values: UserFormValues) => {
    setSubmitting(true);
    setServerMsg(null);
    setServerErr(null);

    try {
      if (mode === "create") {
        const res = await axiosClient.post("/users", {
          fullName: values.fullName.trim(),
          username: values.username?.trim(),
          password: values.password,
          email: values.email?.trim() || undefined,
          phone: values.phone?.trim() || undefined,
          avatar: values.avatar?.trim() || undefined,
          gender: values.gender,
          birthday: values.birthday || undefined,
          role: values.role, // STAFF/MANAGER/DELIVERY
          status: values.status,
        });
        const created: User = res.data.data;
        setList((prev) => [created, ...prev]);
        setServerMsg("Tạo tài khoản thành công!");
        setTimeout(() => setOpen(false), 600);
      } else {
        if (!selectedId) throw new Error("Thiếu ID người dùng để cập nhật");
        const payload = {
          fullName: values.fullName.trim(),
          phone: values.phone?.trim() || "",
          avatar: values.avatar?.trim() || "",
          gender: !!values.gender,
          birthday: values.birthday ? values.birthday : undefined,
          status: values.status,
          cccd: values.cccd || "",
          point: Number(values.point ?? 0),
        };
        const res = await axiosClient.put(`/users/${selectedId}`, payload);
        const updated: User = res.data.data;
        setList((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
        setServerMsg("Lưu thay đổi thành công!");
        setTimeout(() => setOpen(false), 600);
      }
    } catch (e: any) {
      setServerErr(
        e?.response?.data?.message || e?.message || "Không thể xử lý yêu cầu"
      );
    } finally {
      setSubmitting(false);
    }
  };

  // soft delete
  const handleDelete = async (id: string) => {
    if (!confirm("Xác nhận xoá mềm tài khoản này?")) return;
    setDeletingIds((s) => new Set(s).add(id));
    const prev = list;
    setList((cur) => cur.filter((u) => u.id !== id));

    try {
      const res = await axiosClient.delete(`/users/${id}`);
      if (res.status !== 200) {
        setList(prev);
        alert(res?.data?.message || "Xoá không thành công");
      }
    } catch (e: any) {
      setList(prev);
      alert(
        e?.response?.data?.message || e?.message || "Không thể xoá tài khoản"
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
            <li className="font-semibold">Tài khoản nhân viên</li>
          </ol>
        </nav>

        <div className="flex items-center gap-2">
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-700 active:scale-95"
          >
            <Plus className="h-4 w-4" />
            Thêm tài khoản
          </button>
        </div>
      </div>

      {/* toolbar: search + filter */}
      <div className="mt-4 flex flex-wrap items-center gap-2 rounded-2xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Tìm theo tên, email, SĐT…"
          className="min-w-[220px] grow rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value as any)}
          className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
        >
          <option value="ALL">Tất cả vai trò</option>
          <option value="STAFF">STAFF</option>
          <option value="MANAGER">MANAGER</option>
          <option value="DELIVERY">DELIVERY</option>
          <option value="ADMIN">ADMIN</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
        >
          <option value="ALL">Tất cả trạng thái</option>
          <option value="ACTIVE">ACTIVE</option>
          <option value="INACTIVE">INACTIVE</option>
        </select>
      </div>

      {/* danh sách */}
      <section className="mt-6">
        <div className="mb-4 flex items-center gap-2 text-gray-700 dark:text-gray-200">
          <Users className="h-4 w-4 text-emerald-600" />
          <span className="text-sm">
            Tổng: {loading ? "-" : filtered.length} tài khoản
          </span>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 rounded-3xl border border-gray-200 bg-white p-6 text-gray-600 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300">
            <Loader2 className="h-4 w-4 animate-spin" />
            Đang tải tài khoản...
          </div>
        ) : error ? (
          <div className="rounded-3xl border border-red-300 bg-red-50 p-6 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
            {error}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-3xl border border-gray-200 bg-white p-8 text-center text-gray-600 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300">
            Không có kết quả phù hợp.
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {filtered.map((u) => (
              <UserTile
                key={u.id}
                u={u}
                onEdit={openEdit}
                onDelete={handleDelete}
                deleting={deletingIds.has(u.id)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Drawer: create/edit */}
      <SlideOver
        open={open}
        onClose={() => setOpen(false)}
        title={mode === "edit" ? "Chỉnh sửa tài khoản" : "Thêm tài khoản"}
        widthClass="w-full max-w-2xl"
      >
        {mode === "edit" && !initial ? (
          <div className="rounded-3xl border border-gray-200 bg-white p-6 text-gray-600 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300">
            Đang tải chi tiết...
          </div>
        ) : (
          <UserForm
            mode={mode}
            initial={
              mode === "create"
                ? {
                    fullName: "",
                    username: "",
                    password: "",
                    email: "",
                    phone: "",
                    avatar: "",
                    gender: true,
                    birthday: "",
                    role: "STAFF",
                    status: "ACTIVE",
                    cccd: "",
                    point: 0,
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

export default AdminUsersPage;
