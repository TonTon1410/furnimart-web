/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Users, Loader2, Trash2, Eye, X, Plus, Edit } from "lucide-react";
import axiosClient from "@/service/axiosClient";
import { DP } from "@/router/paths";
import SlideOver from "@/components/SlideOver";
import CustomDropdown from "@/components/CustomDropdown";
import Pagination from "@/components/Pagination";
import EmployeeForm, {
  type EmployeeFormValues,
  type Role,
} from "./EmployeeForm";

// -------- Types ----------
interface Employee {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  gender: boolean; // true: Nam, false: Nữ
  birthday?: string | null; // ISO date hoặc null
  avatar?: string | null;
  role: string; // STAFF, MANAGER, DELIVERY
  status: "ACTIVE" | "INACTIVE";
  cccd?: string | null;
  createdAt?: string; // ISO
  updatedAt?: string;
  storeIds?: string[]; // mảng ID các cửa hàng
}

interface Store {
  id: string;
  name: string;
  city: string;
  district: string | null;
  ward: string;
  street: string;
  addressLine: string;
}

// -------- Page ----------
type SortKey = "fullName" | "role" | "status" | "email" | "phone" | "createdAt";
type SortDir = "asc" | "desc";

const AdminEmployeesPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [list, setList] = useState<Employee[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [error, setError] = useState<string | null>(null);

  // xoá theo id
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());

  // modal xem chi tiết
  const [detailEmployee, setDetailEmployee] = useState<Employee | null>(null);

  // slide-over form tạo nhân viên
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [serverMsg, setServerMsg] = useState<string | null>(null);
  const [serverErr, setServerErr] = useState<string | null>(null);

  // slide-over form sửa nhân viên
  const [editOpen, setEditOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editServerMsg, setEditServerMsg] = useState<string | null>(null);
  const [editServerErr, setEditServerErr] = useState<string | null>(null);

  // filters
  const [q, setQ] = useState("");
  const [roleFilter, setRoleFilter] = useState<
    "ALL" | "STAFF" | "MANAGER" | "DELIVERY"
  >("ALL");
  const [statusFilter, setStatusFilter] = useState<
    "ACTIVE" | "INACTIVE" | "ALL"
  >("ALL");
  const [storeFilter, setStoreFilter] = useState<string>(""); // Filter theo cửa hàng - mặc định là tất cả (chuỗi rỗng)

  // pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // sort mặc định - sắp xếp theo ngày tạo mới nhất
  const [sortKey] = useState<SortKey>("createdAt");
  const [sortDir] = useState<SortDir>("desc");

  // Tải danh sách nhân viên và cửa hàng
  useEffect(() => {
    (async () => {
      try {
        const [empRes, storeRes] = await Promise.all([
          axiosClient.get("/employees"),
          axiosClient.get("/stores"),
        ]);
        setList(empRes.data?.data ?? []);
        setStores(storeRes.data?.data ?? []);
      } catch (e: any) {
        setError(
          e?.response?.data?.message || e?.message || "Không tải được danh sách"
        );
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Normalize backend role strings to simple keys used for filtering/display
  const normalizeRoleKey = (role?: string) => {
    if (!role) return "";
    const r = role.toUpperCase().replace(/^ROLE_/, "");
    if (r === "BRANCH_MANAGER") return "MANAGER";
    if (r === "STAFF") return "STAFF";
    if (r === "DELIVERY") return "DELIVERY";
    if (r === "ADMIN") return "ADMIN";
    return r;
  };

  const roleLabel = (role?: string) => {
    const key = normalizeRoleKey(role);
    switch (key) {
      case "STAFF":
        return "Nhân viên bán hàng";
      case "MANAGER":
        return "Quản lí cửa hàng";
      case "DELIVERY":
        return "Nhân viên giao hàng";
      case "ADMIN":
        return "Quản trị hệ thống";
      default:
        return role || "—";
    }
  };

  const filtered = useMemo(() => {
    let arr = [...list];

    // 1) Lọc vai trò
    if (roleFilter !== "ALL") {
      arr = arr.filter((u) => normalizeRoleKey(u.role) === roleFilter);
    }

    // 2) Lọc trạng thái
    if (statusFilter !== "ALL") {
      arr = arr.filter((u) => u.status === statusFilter);
    }

    // 3) Lọc theo cửa hàng
    if (storeFilter && storeFilter !== "") {
      arr = arr.filter((u) => u.storeIds?.includes(storeFilter));
    }

    // 4) Tìm kiếm
    if (q.trim()) {
      const s = q.toLowerCase();
      arr = arr.filter((u) =>
        [u.fullName, u.email, u.phone]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(s))
      );
    }

    // 4) Sắp xếp
    const getVal = (u: Employee, key: SortKey) => {
      // Xử lý đặc biệt cho createdAt (so sánh theo timestamp)
      if (key === "createdAt") {
        return (u as any)[key] ? new Date((u as any)[key]).getTime() : 0;
      }
      return String((u as any)[key] ?? "").toLowerCase();
    };
    arr.sort((a, b) => {
      const va = getVal(a, sortKey);
      const vb = getVal(b, sortKey);
      if (va === vb) return 0;
      const res = va > vb ? 1 : -1;
      return sortDir === "asc" ? res : -res;
    });

    return arr;
  }, [list, q, roleFilter, statusFilter, storeFilter, sortKey, sortDir]);

  // Tính toán phân trang
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedList = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filtered.slice(startIndex, endIndex);
  }, [filtered, currentPage, itemsPerPage]);

  // Reset về trang 1 khi filter thay đổi
  useEffect(() => {
    setCurrentPage(1);
  }, [q, roleFilter, statusFilter, storeFilter]);

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
          {...({
            style: { width: size, height: size },
          } as React.ImgHTMLAttributes<HTMLImageElement>)}
        />
      );
    }

    return (
      <div
        className="flex items-center justify-center rounded-lg bg-gray-200 text-gray-700 ring-1 ring-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:ring-gray-700"
        {...({
          style: { width: size, height: size },
        } as React.HTMLAttributes<HTMLDivElement>)}
        aria-label={name ? `Avatar của ${name}` : "Avatar mặc định"}
        title={name || "User"}
      >
        <span className="text-xs font-semibold">{getInitials(name)}</span>
      </div>
    );
  };

  // soft delete
  const handleDelete = async (id: string) => {
    if (!confirm("Xác nhận xoá mềm nhân viên này?")) return;
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
        e?.response?.data?.message || e?.message || "Không thể xoá nhân viên"
      );
    } finally {
      setDeletingIds((s) => {
        const n = new Set(s);
        n.delete(id);
        return n;
      });
    }
  };

  // Hàm xử lý tạo nhân viên
  const handleCreateEmployee = async (values: EmployeeFormValues) => {
    setSubmitting(true);
    setServerMsg(null);
    setServerErr(null);

    try {
      // Loại bỏ các field empty string, chỉ giữ giá trị thực sự
      const payload: Record<string, any> = {};
      Object.entries(values).forEach(([key, value]) => {
        if (value !== "" && value !== undefined && value !== null) {
          payload[key] = value;
        }
      });

      console.log("Cleaned payload:", JSON.stringify(payload, null, 2));

      const res = await axiosClient.post("/employees", payload);
      if (res.status === 201 && res.data?.data) {
        setServerMsg("Tạo nhân viên thành công!");
        // Thêm nhân viên mới vào list
        setList((prev) => [res.data.data, ...prev]);
        // Đóng form sau 1s
        setTimeout(() => {
          setOpen(false);
          setServerMsg(null);
        }, 1000);
      } else {
        setServerErr(res.data?.message || "Tạo nhân viên không thành công");
      }
    } catch (e: any) {
      setServerErr(
        e?.response?.data?.message || e?.message || "Lỗi khi tạo nhân viên"
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Hàm xử lý cập nhật thông tin nhân viên
  const handleUpdateEmployee = async (values: EmployeeFormValues) => {
    if (!editingEmployee) return;

    setEditSubmitting(true);
    setEditServerMsg(null);
    setEditServerErr(null);

    try {
      // Tạo payload đầy đủ theo API specification
      const payload: any = {
        fullName: values.fullName,
        gender: values.gender,
        status: values.status,
        role: values.role,
      };

      // Thêm các trường optional nếu có giá trị
      if (values.phone && values.phone.trim()) {
        payload.phone = values.phone.trim();
      }
      if (values.avatar && values.avatar.trim()) {
        payload.avatar = values.avatar.trim();
      }
      if (values.birthday) {
        payload.birthday = values.birthday; // Đã là ISO format từ form
      }
      if (values.cccd && values.cccd.trim()) {
        payload.cccd = values.cccd.trim();
      }
      if (values.storeId && values.storeId.trim()) {
        payload.storeId = values.storeId.trim();
      }

      console.log("Update payload:", JSON.stringify(payload, null, 2));

      const res = await axiosClient.put(
        `/employees/${editingEmployee.id}`,
        payload
      );
      if (res.status === 200 && res.data?.data) {
        setEditServerMsg("Cập nhật thông tin thành công!");
        // Cập nhật nhân viên trong list
        setList((prev) =>
          prev.map((emp) =>
            emp.id === editingEmployee.id ? res.data.data : emp
          )
        );
        // Đóng form sau 1s
        setTimeout(() => {
          setEditOpen(false);
          setEditServerMsg(null);
          setEditingEmployee(null);
        }, 1000);
      } else {
        setEditServerErr(
          res.data?.message || "Cập nhật thông tin không thành công"
        );
      }
    } catch (e: any) {
      setEditServerErr(
        e?.response?.data?.message || e?.message || "Lỗi khi cập nhật thông tin"
      );
    } finally {
      setEditSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen w-full bg-gray-50 px-6 py-8 dark:bg-gray-950">
      {/* breadcrumb */}
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
            <li className="font-semibold">Quản lý nhân viên</li>
          </ol>
        </nav>

        {/* Nút tạo nhân viên */}
        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 dark:hover:bg-emerald-500"
        >
          <Plus className="h-4 w-4" />
          Tạo nhân viên
        </button>
      </div>

      {/* toolbar: search + filter */}
      <div className="mt-4 flex flex-wrap items-end gap-3 rounded-2xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
        {/* Filter Cửa hàng */}
        <CustomDropdown
          id="storeFilter"
          label="Cửa hàng"
          value={storeFilter}
          onChange={setStoreFilter}
          options={[
            { value: "", label: "Tất cả cửa hàng" },
            ...stores.map((store) => ({
              value: store.id,
              label: store.name,
            })),
          ]}
        />

        {/* Filter Vai trò */}
        <CustomDropdown
          id="roleFilter"
          label="Vai trò"
          value={roleFilter}
          onChange={(val) => setRoleFilter(val as any)}
          options={[
            { value: "ALL", label: "Tất cả nhân viên" },
            { value: "STAFF", label: "Nhân viên bán hàng" },
            { value: "MANAGER", label: "Quản lí cửa hàng" },
            { value: "DELIVERY", label: "Nhân viên giao hàng" },
          ]}
        />

        {/* Filter Trạng thái */}
        <CustomDropdown
          id="statusFilter"
          label="Trạng thái"
          value={statusFilter}
          onChange={(val) => setStatusFilter(val as any)}
          options={[
            { value: "ALL", label: "Tất cả" },
            { value: "ACTIVE", label: "Hoạt động" },
            { value: "INACTIVE", label: "Không hoạt động" },
          ]}
        />

        {/* Search box */}
        <div className="flex flex-col gap-1 flex-1 min-w-[200px]">
          <label
            htmlFor="q"
            className="text-xs font-medium text-gray-600 dark:text-gray-400"
          >
            Tìm kiếm
          </label>
          <input
            id="q"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Tên, email, SĐT..."
            className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
          />
        </div>
      </div>

      {/* Danh sách dạng bảng */}
      <section className="mt-6">
        <div className="mb-4 flex items-center gap-2 text-gray-700 dark:text-gray-200">
          <Users className="h-4 w-4 text-emerald-600" />
          <span className="text-sm">
            Tổng: {loading ? "-" : filtered.length} nhân viên
          </span>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 rounded-3xl border border-gray-200 bg-white p-6 text-gray-600 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300">
            <Loader2 className="h-4 w-4 animate-spin" />
            Đang tải nhân viên...
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
          <div className="overflow-x-auto rounded-3xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <table className="min-w-full text-sm text-gray-700 dark:text-gray-300">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-800/50">
                <tr>
                  <th className="px-4 py-4 text-left font-semibold text-gray-900 dark:text-gray-100">
                    Avatar
                  </th>
                  <th className="px-4 py-4 text-left font-semibold text-gray-900 dark:text-gray-100">
                    Họ tên
                  </th>
                  <th className="px-4 py-4 text-left font-semibold text-gray-900 dark:text-gray-100">
                    Vai trò
                  </th>
                  <th className="px-4 py-4 text-left font-semibold text-gray-900 dark:text-gray-100">
                    Trạng thái
                  </th>
                  <th className="px-4 py-4 text-left font-semibold text-gray-900 dark:text-gray-100">
                    Email
                  </th>
                  <th className="px-4 py-4 text-left font-semibold text-gray-900 dark:text-gray-100">
                    SĐT
                  </th>
                  <th className="px-4 py-4 text-left font-semibold text-gray-900 dark:text-gray-100">
                    Cửa hàng
                  </th>
                  <th className="px-4 py-4 text-center font-semibold text-gray-900 dark:text-gray-100">
                    Thao tác
                  </th>
                </tr>
              </thead>

              <tbody>
                {paginatedList.map((u) => (
                  <tr
                    key={u.id}
                    className="border-t border-gray-100 transition-colors hover:bg-gray-50/50 dark:border-gray-800 dark:hover:bg-gray-800/30"
                  >
                    <td className="px-4 py-4">
                      <Avatar
                        name={u.fullName}
                        src={u.avatar && u.avatar.trim() ? u.avatar : undefined}
                        size={44}
                      />
                    </td>
                    <td className="px-4 py-4">
                      <div className="font-semibold text-gray-900 dark:text-gray-100">
                        {u.fullName}
                      </div>
                      <div className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                        {u.gender ? "Nam" : "Nữ"}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="inline-flex items-center rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 ring-1 ring-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:ring-blue-800">
                        {normalizeRoleKey(u.role) || u.role}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium ring-1 ${
                          u.status === "ACTIVE"
                            ? "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:ring-emerald-800"
                            : "bg-gray-100 text-gray-700 ring-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:ring-gray-700"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            u.status === "ACTIVE"
                              ? "bg-emerald-500"
                              : "bg-gray-400"
                          }`}
                        />
                        {u.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-gray-600 dark:text-gray-400">
                      {u.email || "—"}
                    </td>
                    <td className="px-4 py-4 text-gray-600 dark:text-gray-400">
                      {u.phone || "—"}
                    </td>
                    <td className="px-4 py-4">
                      {u.storeIds && u.storeIds.length > 0 ? (
                        <span className="inline-flex items-center rounded-lg bg-purple-50 px-2 py-1 text-xs font-medium text-purple-700 ring-1 ring-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:ring-purple-800">
                          {u.storeIds.length} cửa hàng
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => setDetailEmployee(u)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-white px-3 py-1.5 text-xs font-medium text-blue-600 transition-all hover:bg-blue-50 active:scale-95 dark:border-blue-800 dark:bg-gray-900 dark:text-blue-300 dark:hover:bg-blue-900/20"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          Chi tiết
                        </button>
                        <button
                          onClick={() => {
                            setEditingEmployee(u);
                            setEditOpen(true);
                          }}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-white px-3 py-1.5 text-xs font-medium text-emerald-600 transition-all hover:bg-emerald-50 active:scale-95 dark:border-emerald-800 dark:bg-gray-900 dark:text-emerald-300 dark:hover:bg-emerald-900/20"
                        >
                          <Edit className="h-3.5 w-3.5" />
                          Sửa
                        </button>
                        <button
                          onClick={() => handleDelete(u.id)}
                          disabled={deletingIds.has(u.id)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-600 transition-all hover:bg-red-50 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-800 dark:bg-gray-900 dark:text-red-300 dark:hover:bg-red-900/20"
                        >
                          {deletingIds.has(u.id) ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
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

      {/* Pagination */}
      {!loading && !error && filtered.length > 0 && (
        <div className="mt-6">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            itemsPerPage={itemsPerPage}
            totalItems={filtered.length}
          />
        </div>
      )}

      {/* Modal xem chi tiết */}
      {detailEmployee && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onClick={() => setDetailEmployee(null)}
        >
          <div
            className="relative max-h-[90vh] w-full max-w-2xl overflow-auto rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-800 dark:bg-gray-900"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4 dark:border-gray-800 dark:bg-gray-900">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                Chi tiết nhân viên
              </h2>
              <button
                onClick={() => setDetailEmployee(null)}
                className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-300"
                aria-label="Đóng"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6">
              {/* Avatar và tên */}
              <div className="mb-6 flex items-center gap-4">
                <Avatar
                  name={detailEmployee.fullName}
                  src={
                    detailEmployee.avatar && detailEmployee.avatar.trim()
                      ? detailEmployee.avatar
                      : undefined
                  }
                  size={80}
                />
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {detailEmployee.fullName}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    <span className="font-medium">Cửa hàng: </span>
                    {detailEmployee.storeIds &&
                    detailEmployee.storeIds.length > 0
                      ? stores
                          .filter((s) =>
                            detailEmployee.storeIds?.includes(s.id)
                          )
                          .map((s) => s.name)
                          .join(", ") || "Chưa có"
                      : "Chưa có"}
                  </p>
                </div>
              </div>

              {/* Thông tin chi tiết - 2 cột */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Cột 1 */}
                <div className="space-y-3">
                  <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800/50">
                    <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                      Vai trò
                    </div>
                    <span className="inline-flex items-center rounded-lg bg-blue-50 px-2.5 py-1 text-sm font-medium text-blue-700 ring-1 ring-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:ring-blue-800">
                      {roleLabel(detailEmployee.role)}
                    </span>
                  </div>

                  <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800/50">
                    <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                      Trạng thái
                    </div>
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-sm font-medium ring-1 ${
                        detailEmployee.status === "ACTIVE"
                          ? "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:ring-emerald-800"
                          : "bg-gray-100 text-gray-700 ring-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:ring-gray-700"
                      }`}
                    >
                      <span
                        className={`h-2 w-2 rounded-full ${
                          detailEmployee.status === "ACTIVE"
                            ? "bg-emerald-500"
                            : "bg-gray-400"
                        }`}
                      />
                      {detailEmployee.status}
                    </span>
                  </div>

                  <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800/50">
                    <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                      Email
                    </div>
                    <div className="text-sm text-gray-900 dark:text-gray-100 break-all">
                      {detailEmployee.email || "—"}
                    </div>
                  </div>

                  <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800/50">
                    <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                      Số điện thoại
                    </div>
                    <div className="text-sm text-gray-900 dark:text-gray-100">
                      {detailEmployee.phone || "—"}
                    </div>
                  </div>

                  <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800/50">
                    <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                      Giới tính
                    </div>
                    <div className="text-sm text-gray-900 dark:text-gray-100">
                      {detailEmployee.gender ? "Nam" : "Nữ"}
                    </div>
                  </div>

                  {detailEmployee.updatedAt && (
                    <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800/50">
                      <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                        Cập nhật lần cuối
                      </div>
                      <div className="text-sm text-gray-900 dark:text-gray-100">
                        {new Date(detailEmployee.updatedAt).toLocaleString(
                          "vi-VN"
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Cột 2 */}
                <div className="space-y-3">
                  <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800/50">
                    <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                      Ngày sinh
                    </div>
                    <div className="text-sm text-gray-900 dark:text-gray-100">
                      {detailEmployee.birthday
                        ? new Date(detailEmployee.birthday).toLocaleDateString(
                            "vi-VN"
                          )
                        : "—"}
                    </div>
                  </div>

                  <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800/50">
                    <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                      CCCD
                    </div>
                    <div className="text-sm text-gray-900 dark:text-gray-100">
                      {detailEmployee.cccd || "—"}
                    </div>
                  </div>

                  <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800/50">
                    <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                      Ngày tạo
                    </div>
                    <div className="text-sm text-gray-900 dark:text-gray-100">
                      {detailEmployee.createdAt
                        ? new Date(detailEmployee.createdAt).toLocaleString(
                            "vi-VN"
                          )
                        : "—"}
                    </div>
                  </div>

                  {detailEmployee.storeIds &&
                    detailEmployee.storeIds.length > 0 && (
                      <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800/50">
                        <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                          Cửa hàng quản lý
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {detailEmployee.storeIds.map((storeId, idx) => {
                            const store = stores.find((s) => s.id === storeId);
                            return (
                              <span
                                key={idx}
                                className="inline-flex items-center rounded-lg bg-purple-50 px-2.5 py-1 text-xs font-medium text-purple-700 ring-1 ring-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:ring-purple-800"
                                title={
                                  store
                                    ? `${store.addressLine}, ${store.ward}, ${store.city}`
                                    : storeId
                                }
                              >
                                {store ? store.name : storeId}
                              </span>
                            );
                          })}
                        </div>
                        <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                          {detailEmployee.storeIds.length} cửa hàng
                        </p>
                      </div>
                    )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 border-t border-gray-200 bg-white px-6 py-4 dark:border-gray-800 dark:bg-gray-900">
              <button
                onClick={() => setDetailEmployee(null)}
                className="w-full rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-gray-800 active:scale-98 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SlideOver Form tạo nhân viên */}
      <SlideOver
        open={open}
        onClose={() => {
          setOpen(false);
          setServerMsg(null);
          setServerErr(null);
        }}
        title="Tạo nhân viên mới"
      >
        <EmployeeForm
          submitting={submitting}
          serverMsg={serverMsg}
          serverErr={serverErr}
          stores={stores}
          onSubmit={handleCreateEmployee}
          onCancel={() => {
            setOpen(false);
            setServerMsg(null);
            setServerErr(null);
          }}
        />
      </SlideOver>

      {/* SlideOver Form sửa nhân viên */}
      <SlideOver
        open={editOpen}
        onClose={() => {
          setEditOpen(false);
          setEditServerMsg(null);
          setEditServerErr(null);
          setEditingEmployee(null);
        }}
        title="Sửa thông tin nhân viên"
      >
        {editingEmployee && (
          <EmployeeForm
            mode="edit"
            initial={{
              fullName: editingEmployee.fullName,
              phone: editingEmployee.phone ?? undefined,
              avatar: editingEmployee.avatar ?? undefined,
              gender: editingEmployee.gender,
              birthday: editingEmployee.birthday
                ? new Date(editingEmployee.birthday).toISOString().split("T")[0]
                : undefined,
              status: editingEmployee.status,
              cccd: editingEmployee.cccd ?? undefined,
              role: editingEmployee.role as Role,
              storeId: editingEmployee.storeIds?.[0] ?? undefined,
            }}
            stores={stores}
            submitting={editSubmitting}
            serverMsg={editServerMsg}
            serverErr={editServerErr}
            onSubmit={handleUpdateEmployee}
            onCancel={() => {
              setEditOpen(false);
              setEditServerMsg(null);
              setEditServerErr(null);
              setEditingEmployee(null);
            }}
          />
        )}
      </SlideOver>
    </main>
  );
};

export default AdminEmployeesPage;
