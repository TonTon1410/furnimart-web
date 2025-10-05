/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Users, Loader2, Trash2, Edit3 } from "lucide-react";
import axiosClient from "@/service/axiosClient";
import { DP } from "@/router/paths";
import SlideOver from "@/components/SlideOver";
import UserForm, { type UserFormValues, type Status } from "./UserForm";

// -------- Types ----------
interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  gender: boolean; // true: Nam, false: Nữ
  birthday?: string | null; // ISO datetime hoặc null
  avatar?: string | null;
  role: string; // nhận mọi role từ API (kể cả CUSTOMER)
  status: Status; // "ACTIVE" | "INACTIVE"
  cccd?: string | null;
  point?: number;
  createdAt?: string; // ISO
  updatedAt?: string;
}

// -------- Helpers ----------
const fmtDate = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString("vi-VN") : "—";

// YYYY-MM-DD -> ISO 'YYYY-MM-DDT00:00:00.000Z'
const toISODateOrUndefined = (d?: string | null) => {
  const s = (d || "").trim();
  if (!s) return undefined;
  try {
    return new Date(`${s}T00:00:00.000Z`).toISOString();
  } catch {
    return undefined;
  }
};

// -------- Page ----------
type SortKey =
  | "createdAt"
  | "fullName"
  | "role"
  | "status"
  | "email"
  | "phone"
  | "birthday"
  | "point";
type SortDir = "asc" | "desc";

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
  const [roleFilter, setRoleFilter] = useState<
    | "ALL"
    | "STAFF_GROUP"
    | "STAFF"
    | "MANAGER"
    | "DELIVERY"
    | "ADMIN"
    | "CUSTOMER"
  >("STAFF_GROUP");
  const [statusFilter, setStatusFilter] = useState<Status | "ALL">("ALL");

  // sort mặc định
  const [sortKey] = useState<SortKey>("createdAt");
  const [sortDir] = useState<SortDir>("desc");

  useEffect(() => {
    (async () => {
      try {
        const res = await axiosClient.get("/users");
        setList(res.data?.data ?? []);
      } catch (e: any) {
        setError(
          e?.response?.data?.message ||
            e?.message ||
            "Không tải được danh sách tài khoản"
        );
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    let arr = [...list];

    // 1) Lọc vai trò
    if (roleFilter === "STAFF_GROUP") {
      arr = arr.filter((u) => (u.role || "").toUpperCase() !== "CUSTOMER");
    } else if (roleFilter !== "ALL") {
      arr = arr.filter((u) => (u.role || "").toUpperCase() === roleFilter);
    }

    // 2) Lọc trạng thái
    if (statusFilter !== "ALL") {
      arr = arr.filter((u) => u.status === statusFilter);
    }

    // 3) Tìm kiếm
    if (q.trim()) {
      const s = q.toLowerCase();
      arr = arr.filter((u) =>
        [u.fullName, u.email, u.phone]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(s))
      );
    }

    // 4) Sắp xếp
    const getVal = (u: User, key: SortKey) => {
      switch (key) {
        case "point":
          return Number(u.point ?? 0);
        case "birthday":
        case "createdAt":
          return u[key] ? new Date(u[key] as string).getTime() : -Infinity;
        default:
          return String((u as any)[key] ?? "").toLowerCase();
      }
    };
    arr.sort((a, b) => {
      const va = getVal(a, sortKey);
      const vb = getVal(b, sortKey);
      if (va === vb) return 0;
      const res = va > vb ? 1 : -1;
      return sortDir === "asc" ? res : -res;
    });

    return arr;
  }, [list, q, roleFilter, statusFilter, sortKey, sortDir]);

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
      // convert ISO -> YYYY-MM-DD cho input date
      birthday: u.birthday ? new Date(u.birthday).toISOString().slice(0, 10) : "",
      role: (u.role as any) || "STAFF",
      status: u.status,
      cccd: u.cccd || "",
      point: u.point ?? 0,
    });
  };

  // --- Avatar fallback bằng initials ---
  const getInitials = (name?: string) => {
    if (!name) return "U";
    const parts = name.trim().split(/\s+/);
    const [a, b] = [parts[0], parts[parts.length - 1]];
    return ((a?.[0] || "") + (b?.[0] || "")).toUpperCase() || "U";
  };

  const Avatar: React.FC<{ name?: string; src?: string; size?: number }> = ({
    name,
    src,
    size = 40,
  }) => {
    const [broken, setBroken] = React.useState(false);
    const showImg = !!src && !broken;

    if (showImg) {
      return (
        <img
          src={src}
          alt={name || "User"}
          onError={() => setBroken(true)}
          className="rounded-lg object-cover ring-1 ring-gray-200 dark:ring-gray-700"
          style={{ width: size, height: size }}
        />
      );
    }

    return (
      <div
        className="flex items-center justify-center rounded-lg bg-gray-200 text-gray-700 ring-1 ring-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:ring-gray-700"
        style={{ width: size, height: size }}
        aria-label={name ? `Avatar của ${name}` : "Avatar mặc định"}
        title={name || "User"}
      >
        <span className="text-xs font-semibold">{getInitials(name)}</span>
      </div>
    );
  };

  // submit (POST | PUT)
  const handleSubmit = async (values: UserFormValues) => {
    setSubmitting(true);
    setServerMsg(null);
    setServerErr(null);

    // helper: string rỗng -> null (dùng cho POST)
    const orNull = (v?: string) => (v && v.trim() ? v.trim() : null);

    try {
      if (mode === "create") {
        // Giữ nguyên yêu cầu: rỗng -> null
        const res = await axiosClient.post("/users", {
          fullName: values.fullName.trim(),
          username: orNull(values.username || ""),
          password: values.password, // bắt buộc khi tạo
          email: orNull(values.email || ""),
          phone: orNull(values.phone || ""),
          avatar: orNull(values.avatar || ""),
          gender: values.gender,
          // với POST, backend của bạn trước đó chấp nhận null cho birthday
          birthday: orNull(values.birthday || ""),
          role: values.role,
          status: values.status,
          cccd: orNull(values.cccd || ""),
          point: Number(values.point ?? 0),
        });
        const created: User = res.data.data;
        setList((prev) => [created, ...prev]);
        setServerMsg("Tạo tài khoản thành công!");
        setTimeout(() => setOpen(false), 600);
      } else {
        if (!selectedId) throw new Error("Thiếu ID người dùng để cập nhật");

        // Theo schema PUT: không gửi null, chỉ gửi khi có; birthday phải là ISO datetime
        const payload: Record<string, any> = {
          fullName: values.fullName.trim(),
          gender: !!values.gender,
          status: values.status,
          point: Number(values.point ?? 0),
        };

        const phone = values.phone?.trim();
        if (phone) payload.phone = phone;

        const avatar = values.avatar?.trim();
        if (avatar) payload.avatar = avatar;

        const cccd = values.cccd?.trim();
        if (cccd) payload.cccd = cccd;

        const birthdayISO = toISODateOrUndefined(values.birthday);
        if (birthdayISO) payload.birthday = birthdayISO;

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
            <li className="font-semibold">Tất cả tài khoản</li>
          </ol>
        </nav>

        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-700 active:scale-95"
        >
          <Plus className="h-4 w-4" />
          Thêm tài khoản
        </button>
      </div>

      {/* toolbar: search + filter */}
      <div className="mt-4 flex flex-wrap items-center gap-2 rounded-2xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
        <label htmlFor="q" className="sr-only">
          Tìm kiếm
        </label>
        <input
          id="q"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Tìm theo tên, email, SĐT…"
          className="min-w-[220px] grow rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
        />

        <div className="flex items-center gap-2">
          <label
            htmlFor="roleFilter"
            className="text-sm text-gray-600 dark:text-gray-300"
          >
            Vai trò
          </label>
          <select
            id="roleFilter"
            aria-label="Lọc theo vai trò"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as any)}
            className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
          >
            <option value="STAFF_GROUP">Tất cả nhân viên</option>
            <option value="ALL">Tất cả tài khoản</option>
            <option value="STAFF">STAFF (Nhân viên bán hàng)</option>
            <option value="MANAGER">MANAGER (Quản lí cửa hàng)</option>
            <option value="DELIVERY">DELIVERY (Nhân viên giao hàng)</option>
            <option value="ADMIN">ADMIN</option>
            <option value="CUSTOMER">CUSTOMER (Khách hàng)</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label
            htmlFor="statusFilter"
            className="text-sm text-gray-600 dark:text-gray-300"
          >
            Trạng thái
          </label>
          <select
            id="statusFilter"
            aria-label="Lọc theo trạng thái"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
          >
            <option value="ALL">Tất cả</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="INACTIVE">INACTIVE</option>
          </select>
        </div>
      </div>

      {/* Danh sách dạng bảng */}
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
          <div className="overflow-x-auto rounded-3xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
            <table className="min-w-full text-sm text-gray-700 dark:text-gray-300">
              <thead className="bg-gray-100 dark:bg-gray-800">
                <tr>
                  <th className="px-3 py-3 text-left font-semibold">Avatar</th>
                  <th className="px-3 py-3 text-left font-semibold">Họ tên</th>
                  <th className="px-3 py-3 text-left font-semibold">Vai trò</th>
                  <th className="px-3 py-3 text-left font-semibold">
                    Trạng thái
                  </th>
                  <th className="px-3 py-3 text-left font-semibold">Email</th>
                  <th className="px-3 py-3 text-left font-semibold">SĐT</th>
                  <th className="px-3 py-3 text-left font-semibold">
                    Ngày sinh
                  </th>
                  <th className="px-3 py-3 text-left font-semibold">
                    Ngày tạo
                  </th>
                  <th className="px-3 py-3 text-left font-semibold">Điểm</th>
                  <th className="px-3 py-3 text-center font-semibold">
                    Thao tác
                  </th>
                </tr>
              </thead>

              <tbody>
                {filtered.map((u) => (
                  <tr
                    key={u.id}
                    className="border-t border-gray-100 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/40"
                  >
                    <td className="px-3 py-3">
                      <Avatar
                        name={u.fullName}
                        src={u.avatar && u.avatar.trim() ? u.avatar : undefined}
                        size={40}
                      />
                    </td>
                    <td className="px-3 py-3 font-medium text-gray-900 dark:text-gray-100">
                      {u.fullName}
                    </td>
                    <td className="px-3 py-3">{u.role}</td>
                    <td className="px-3 py-3">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs ring-1 ${
                          u.status === "ACTIVE"
                            ? "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:ring-emerald-800"
                            : "bg-gray-100 text-gray-700 ring-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:ring-gray-700"
                        }`}
                      >
                        {u.status}
                      </span>
                    </td>
                    <td className="px-3 py-3">{u.email || "—"}</td>
                    <td className="px-3 py-3">{u.phone || "—"}</td>
                    <td className="px-3 py-3">{fmtDate(u.birthday)}</td>
                    <td className="px-3 py-3">{fmtDate(u.createdAt)}</td>
                    <td className="px-3 py-3">{u.point ?? 0}</td>
                    <td className="px-3 py-3">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => openEdit(u.id)}
                          className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 active:scale-95 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                        >
                          <Edit3 className="h-4 w-4" />
                          Sửa
                        </button>
                        <button
                          onClick={() => handleDelete(u.id)}
                          disabled={deletingIds.has(u.id)}
                          className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-white px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 active:scale-95 disabled:opacity-60 dark:border-red-800 dark:bg-gray-900 dark:text-red-300"
                        >
                          {deletingIds.has(u.id) ? (
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

      {/* Drawer */}
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
