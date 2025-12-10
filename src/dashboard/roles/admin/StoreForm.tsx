import React, { useState, useEffect, useCallback } from "react";
import axiosClient from "@/service/axiosClient";
import AddressSelector, { type Address } from "@/components/AddressSelector";
import { useToast } from "@/context/ToastContext";

export type Status = "ACTIVE" | "INACTIVE";

export interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: string;
  status: Status;
}

export interface StoreFormValues {
  name: string;
  city: string;
  ward: string;
  street: string;
  addressLine: string;
  latitude: number;
  longitude: number;
  status: Status;
}

type Props = {
  mode: "create" | "edit";
  storeId?: string;
  initial?: StoreFormValues;
  submitting?: boolean;
  serverMsg?: string | null;
  serverErr?: string | null;
  onSubmit: (values: StoreFormValues) => Promise<void> | void;
  onCancel?: () => void;
};

const StoreForm: React.FC<Props> = ({
  mode,
  storeId,
  initial,
  submitting = false,
  serverMsg,
  serverErr,
  onSubmit,
  onCancel,
}) => {
  const [form, setForm] = useState<StoreFormValues>(
    initial ?? {
      name: "",
      city: "",
      ward: "",
      street: "",
      addressLine: "",
      latitude: 0,
      longitude: 0,
      status: "ACTIVE",
    }
  );

  const [users, setUsers] = useState<User[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [adding, setAdding] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (initial) setForm({ ...initial });
  }, [initial]);

  useEffect(() => {
    if (mode === "edit" && storeId) {
      (async () => {
        try {
          const res = await axiosClient.get(`/stores/${storeId}`);
          setUsers(res.data?.data?.users ?? []);
        } catch (e) {
          console.error("Không load được users store", e);
        }
      })();
    }
  }, [mode, storeId]);

  useEffect(() => {
    if (mode === "edit") {
      (async () => {
        try {
          const res = await axiosClient.get("/users");
          setAllUsers(res.data?.data ?? []);
        } catch (e) {
          console.error("Không load được users", e);
        }
      })();
    }
  }, [mode]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setForm((s) => ({
      ...s,
      [name]: type === "number" ? Number(value) : value,
    }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(form);
  };

  // ✅ FIX: useCallback để không đổi tham chiếu mỗi render
  const handleAddressChange = useCallback((val: Address) => {
    setForm((prev) => ({
      ...prev,
      city: val.city,
      street: val.district,
      ward: val.ward,
      latitude: val.latitude ?? prev.latitude,
      longitude: val.longitude ?? prev.longitude,
    }));
  }, []);

  const handleAddUser = async (userId: string) => {
    if (!storeId) return;
    setAdding(true);
    try {
      const res = await axiosClient.post("/stores/users", {
        userId,
        storeId,
      });
      setUsers((prev) => [...prev, res.data.data.user]);
    } catch {
      showToast({
            type: "error",
            title: "Đã Xảy Ra Lỗi",
            description: "Không thể thêm nhân viên",
          });
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveUser = async (userId: string) => {
    if (!storeId) return;
    if (!confirm("Xác nhận xoá nhân viên khỏi cửa hàng?")) return;
    try {
      await axiosClient.delete(`/stores/users/${userId}/stores/${storeId}`);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
    } catch {
      showToast({
            type: "error",
            title: "Lỗi",
            description: "Không thể xoá nhân viên",
          });
    }
  };

  const inputClass =
    "mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm " +
    "text-gray-900 placeholder:text-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200 " +
    "dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100 dark:placeholder:text-gray-500";

  const labelClass = "block text-sm font-medium text-gray-700 dark:text-gray-200";

  return (
    <form onSubmit={submit} className="p-6 space-y-6">
      {/* ==== Thông tin cửa hàng ==== */}
      <div>
        <label htmlFor="name" className={labelClass}>
          Tên cửa hàng
        </label>
        <input
          id="name"
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="Nhập tên cửa hàng"
          className={inputClass}
        />
      </div>

      {/* ==== Address Selector ==== */}
      <div>
        <label className={labelClass}>Địa chỉ</label>
        <AddressSelector
          value={{
            city: form.city,
            district: form.street,
            ward: form.ward,
            latitude: form.latitude,
            longitude: form.longitude,
          }}
          onChange={handleAddressChange}
          className="mt-1"
        />
      </div>

      <div>
        <label htmlFor="addressLine" className={labelClass}>
          Địa chỉ chi tiết
        </label>
        <input
          id="addressLine"
          name="addressLine"
          value={form.addressLine}
          onChange={handleChange}
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="status" className={labelClass}>
          Trạng thái
        </label>
        <select
          id="status"
          name="status"
          value={form.status}
          onChange={handleChange}
          className={inputClass}
        >
          <option value="ACTIVE">ACTIVE</option>
          <option value="INACTIVE">INACTIVE</option>
        </select>
      </div>

      {/* ==== Quản lý nhân viên ==== */}
      {mode === "edit" && (
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-800 dark:text-gray-100">
            Nhân viên cửa hàng
          </h3>

          <ul className="space-y-2">
            {users.length === 0 ? (
              <li className="text-sm text-gray-500 dark:text-gray-400">
                Chưa có nhân viên nào
              </li>
            ) : (
              users.map((u) => (
                <li
                  key={u.id}
                  className="flex items-center justify-between rounded-xl border px-3 py-2 dark:border-gray-700"
                >
                  <div>
                    <p className="font-medium">{u.fullName}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {u.email} - {u.phone}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveUser(u.id)}
                    className="text-red-600 hover:underline text-sm"
                  >
                    Xoá
                  </button>
                </li>
              ))
            )}
          </ul>

          <div>
            <label htmlFor="addUser" className={labelClass}>
              Thêm nhân viên
            </label>
            <select
              id="addUser"
              className={inputClass}
              onChange={({ target }) => {
                const value = target.value;
                if (value) {
                  handleAddUser(value);
                  target.value = "";
                }
              }}
              disabled={adding}
            >
              <option value="">-- Chọn nhân viên --</option>
              {allUsers
                .filter((u) => !users.find((x) => x.id === u.id))
                .map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.fullName} ({u.role})
                  </option>
                ))}
            </select>
          </div>
        </div>
      )}

      {/* Buttons */}
      <div className="flex gap-3 mt-6">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700 dark:hover:bg-emerald-500 disabled:opacity-60"
        >
          {submitting
            ? "Đang lưu..."
            : mode === "edit"
            ? "Lưu thay đổi"
            : "Tạo cửa hàng"}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
          >
            Huỷ
          </button>
        )}
      </div>

      {serverMsg && (
        <p className="mt-2 text-sm font-medium text-emerald-700 dark:text-emerald-400">
          {serverMsg}
        </p>
      )}
      {serverErr && (
        <p className="mt-1 text-sm font-medium text-red-600 dark:text-red-400">
          {serverErr}
        </p>
      )}
    </form>
  );
};

export default StoreForm;
