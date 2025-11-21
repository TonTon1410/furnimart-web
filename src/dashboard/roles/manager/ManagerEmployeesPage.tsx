/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Users, Loader2, Trash2, Eye, X, Plus, Edit } from "lucide-react";
import axiosClient from "@/service/axiosClient";
import { authService } from "@/service/authService";
import { DP } from "@/router/paths";
import SlideOver from "@/components/SlideOver";
import CustomDropdown from "@/components/CustomDropdown";
import Pagination from "@/components/Pagination";
import ManagerEmployeeForm, {
  type EmployeeFormValues,
  type Role,
} from "./ManagerEmployeeForm";

// -------- Types ----------
interface Employee {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  gender: boolean; // true: Nam, false: Nữ
  birthday?: string | null; // ISO date hoặc null
  avatar?: string | null;
  role: string; // STAFF, DELIVERY
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

const ManagerEmployeesPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [list, setList] = useState<Employee[]>([]);
  const [store, setStore] = useState<Store | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Lấy storeId từ token
  const storeId = authService.getStoreId();

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
    "ALL" | "STAFF" | "DELIVERY" | "BRANCH_MANAGER"
  >("ALL");
  const [statusFilter, setStatusFilter] = useState<
    "ACTIVE" | "INACTIVE" | "ALL"
  >("ALL");

  // pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // sort mặc định - sắp xếp theo ngày tạo mới nhất
  const [sortKey] = useState<SortKey>("createdAt");
  const [sortDir] = useState<SortDir>("desc");

  // Tải danh sách nhân viên theo store và thông tin cửa hàng
  useEffect(() => {
    if (!storeId) {
      setError("Không tìm thấy thông tin cửa hàng");
      setLoading(false);
      return;
    }

    (async () => {
      try {
        const [empRes, storeRes] = await Promise.all([
          axiosClient.get(`/employees/store/${storeId}`),
          axiosClient.get(`/stores/${storeId}`),
        ]);
        setList(empRes.data?.data ?? []);
        setStore(storeRes.data?.data ?? null);
      } catch (e: any) {
        setError(
          e?.response?.data?.message || e?.message || "Không tải được danh sách"
        );
      } finally {
        setLoading(false);
      }
    })();
  }, [storeId]);

  // Normalize backend role strings to simple keys used for filtering/display
  const normalizeRoleKey = (role?: string) => {
    if (!role) return "";
    const r = role.toUpperCase().replace(/^ROLE_/, "");
    if (r === "STAFF") return "STAFF";
    if (r === "DELIVERY") return "DELIVERY";
    if (r === "BRANCH_MANAGER" || r === "MANAGER") return "BRANCH_MANAGER";
    return r;
  };

  const roleLabel = (role?: string) => {
    const key = normalizeRoleKey(role);
    switch (key) {
      case "STAFF":
        return "Nhân viên bán hàng";
      case "DELIVERY":
        return "Nhân viên giao hàng";
      case "BRANCH_MANAGER":
        return "Quản lí cửa hàng";
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
  }, [list, q, roleFilter, statusFilter, sortKey, sortDir]);

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
  }, [q, roleFilter, statusFilter]);

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
    if (!storeId) {
      setServerErr("Không tìm thấy thông tin cửa hàng");
      return;
    }

    setSubmitting(true);
    setServerMsg(null);
    setServerErr(null);

    try {
      // Loại bỏ các field empty string, chỉ giữ giá trị thực sự
      const payload: Record<string, any> = {
        storeId, // Luôn gán storeId hiện tại
      };
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
    if (!storeId) {
      setEditServerErr("Không tìm thấy thông tin cửa hàng");
      return;
    }

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
        storeId, // Luôn gán storeId hiện tại
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

      {/* Thông tin cửa hàng */}
      {store && (
        <div className="mt-4 rounded-2xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950/20">
          <div className="flex items-center gap-2 text-blue-900 dark:text-blue-100">
            <Users className="h-5 w-5" />
            <span className="font-semibold">Cửa hàng: {store.name}</span>
          </div>
          <p className="mt-1 text-sm text-blue-700 dark:text-blue-300">
            {store.addressLine}, {store.ward}, {store.city}
          </p>
        </div>
      )}

      {/* toolbar: search + filter */}
      <div className="mt-4 flex flex-wrap items-end gap-3 rounded-2xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
        {/* Filter Vai trò */}
        <CustomDropdown
          id="roleFilter"
          label="Vai trò"
          value={roleFilter}
          onChange={(val) => setRoleFilter(val as any)}
          options={[
            { value: "ALL", label: "Tất cả nhân viên" },
            { value: "STAFF", label: "Nhân viên bán hàng" },
            { value: "BRANCH_MANAGER", label: "Quản lí cửa hàng" },
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
              <thead className="bg-linear-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-800/50">
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
                  <th className="px-4 py-4 text-center font-semibold text-gray-900 dark:text-gray-100">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {paginatedList.map((emp, idx) => {
                  const isDeleting = deletingIds.has(emp.id);
                  return (
                    <tr
                      key={emp.id}
                      className={`${
                        idx % 2 === 0
                          ? "bg-white dark:bg-gray-900"
                          : "bg-gray-50/50 dark:bg-gray-900/50"
                      } hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 transition-colors ${
                        isDeleting ? "opacity-40" : ""
                      }`}
                    >
                      <td className="px-4 py-3">
                        <Avatar name={emp.fullName} src={emp.avatar ?? ""} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-gray-900 dark:text-gray-100">
                          {emp.fullName || "—"}
                        </div>
                        <div className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                          {emp.gender ? "Nam" : "Nữ"}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-medium ring-1 ${
                            normalizeRoleKey(emp.role) === "STAFF"
                              ? "bg-blue-50 text-blue-700 ring-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:ring-blue-800"
                              : normalizeRoleKey(emp.role) === "BRANCH_MANAGER"
                              ? "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:ring-amber-800"
                              : "bg-purple-50 text-purple-700 ring-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:ring-purple-800"
                          }`}
                        >
                          {roleLabel(emp.role)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium ring-1 ${
                            emp.status === "ACTIVE"
                              ? "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:ring-emerald-800"
                              : "bg-gray-100 text-gray-700 ring-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:ring-gray-700"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              emp.status === "ACTIVE"
                                ? "bg-emerald-500"
                                : "bg-gray-400"
                            }`}
                          />
                          {emp.status === "ACTIVE"
                            ? "Hoạt động"
                            : "Không hoạt động"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                        {emp.email || "—"}
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                        {emp.phone || "—"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => setDetailEmployee(emp)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-white px-3 py-1.5 text-xs font-medium text-blue-600 transition-all hover:bg-blue-50 active:scale-95 dark:border-blue-800 dark:bg-gray-900 dark:text-blue-300 dark:hover:bg-blue-900/20"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            Chi tiết
                          </button>
                          <button
                            onClick={() => {
                              setEditingEmployee(emp);
                              setEditOpen(true);
                            }}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-white px-3 py-1.5 text-xs font-medium text-emerald-600 transition-all hover:bg-emerald-50 active:scale-95 dark:border-emerald-800 dark:bg-gray-900 dark:text-emerald-300 dark:hover:bg-emerald-900/20"
                          >
                            <Edit className="h-3.5 w-3.5" />
                            Sửa
                          </button>
                          <button
                            onClick={() => handleDelete(emp.id)}
                            disabled={isDeleting}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-600 transition-all hover:bg-red-50 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-800 dark:bg-gray-900 dark:text-red-300 dark:hover:bg-red-900/20"
                          >
                            {isDeleting ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="h-3.5 w-3.5" />
                            )}
                            Xoá
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
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
      </section>

      {/* Modal chi tiết nhân viên */}
      {detailEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-gray-200 bg-white shadow-2xl dark:border-gray-800 dark:bg-gray-900">
            {/* Header */}
            <div className="sticky top-0 flex items-center justify-between border-b border-gray-200 bg-white/80 px-6 py-4 backdrop-blur-sm dark:border-gray-800 dark:bg-gray-900/80">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Chi tiết nhân viên
              </h3>
              <button
                onClick={() => setDetailEmployee(null)}
                className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-200"
                title="Đóng"
                aria-label="Đóng chi tiết nhân viên"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6">
              <div className="space-y-4">
                {/* Avatar + Tên */}
                <div className="flex items-center gap-4">
                  <Avatar
                    name={detailEmployee.fullName}
                    src={detailEmployee.avatar ?? ""}
                    size={80}
                  />
                  <div>
                    <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                      {detailEmployee.fullName}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {roleLabel(detailEmployee.role)}
                    </p>
                  </div>
                </div>

                {/* Thông tin cơ bản */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800/50">
                    <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
                      Email
                    </div>
                    <div className="mt-1 text-sm font-medium text-gray-900 dark:text-gray-100">
                      {detailEmployee.email || "—"}
                    </div>
                  </div>

                  <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800/50">
                    <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
                      Số điện thoại
                    </div>
                    <div className="mt-1 text-sm font-medium text-gray-900 dark:text-gray-100">
                      {detailEmployee.phone || "—"}
                    </div>
                  </div>

                  <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800/50">
                    <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
                      Giới tính
                    </div>
                    <div className="mt-1 text-sm font-medium text-gray-900 dark:text-gray-100">
                      {detailEmployee.gender ? "Nam" : "Nữ"}
                    </div>
                  </div>

                  <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800/50">
                    <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
                      Ngày sinh
                    </div>
                    <div className="mt-1 text-sm font-medium text-gray-900 dark:text-gray-100">
                      {detailEmployee.birthday
                        ? new Date(detailEmployee.birthday).toLocaleDateString(
                            "vi-VN"
                          )
                        : "—"}
                    </div>
                  </div>

                  <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800/50">
                    <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
                      CCCD
                    </div>
                    <div className="mt-1 text-sm font-medium text-gray-900 dark:text-gray-100">
                      {detailEmployee.cccd || "—"}
                    </div>
                  </div>

                  <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800/50">
                    <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
                      Trạng thái
                    </div>
                    <div className="mt-1">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium ring-1 ${
                          detailEmployee.status === "ACTIVE"
                            ? "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:ring-emerald-800"
                            : "bg-gray-100 text-gray-700 ring-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:ring-gray-700"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            detailEmployee.status === "ACTIVE"
                              ? "bg-emerald-500"
                              : "bg-gray-400"
                          }`}
                        />
                        {detailEmployee.status === "ACTIVE"
                          ? "Hoạt động"
                          : "Không hoạt động"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Ngày tạo và cập nhật */}
                {(detailEmployee.createdAt || detailEmployee.updatedAt) && (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {detailEmployee.createdAt && (
                      <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800/50">
                        <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
                          Ngày tạo
                        </div>
                        <div className="mt-1 text-sm font-medium text-gray-900 dark:text-gray-100">
                          {new Date(detailEmployee.createdAt).toLocaleString(
                            "vi-VN"
                          )}
                        </div>
                      </div>
                    )}

                    {detailEmployee.updatedAt && (
                      <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800/50">
                        <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
                          Cập nhật lần cuối
                        </div>
                        <div className="mt-1 text-sm font-medium text-gray-900 dark:text-gray-100">
                          {new Date(detailEmployee.updatedAt).toLocaleString(
                            "vi-VN"
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
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
        <ManagerEmployeeForm
          submitting={submitting}
          serverMsg={serverMsg}
          serverErr={serverErr}
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
          <ManagerEmployeeForm
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
            }}
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

export default ManagerEmployeesPage;
