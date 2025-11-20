"use client"
import { User, Phone, Calendar, CreditCard } from "lucide-react"
import { motion } from "framer-motion"
import type { UserProfile } from "@/pages/UserProfile"

interface UserInfoSectionProps {
  user: UserProfile
  isEditing: boolean
  editForm: any
  setEditForm: (form: any) => void
  formatDate: (date?: string) => string
  fadeUp: any
}

export default function UserInfoSection({
  user,
  isEditing,
  editForm,
  setEditForm,
  formatDate,
  fadeUp,
}: UserInfoSectionProps) {
  return (
    <motion.div variants={fadeUp} className="space-y-4">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 bg-primary/10 rounded-xl">
          <User className="h-5 w-5 text-primary" />
        </div>
        <h3 className="text-xl font-bold text-foreground">Thông tin cá nhân</h3>
      </div>

      <div className="space-y-4">
        <div className="bg-muted/30 dark:bg-gray-800/50 p-4 rounded-xl border border-border/50 dark:border-gray-700">
          <label className="block text-xs font-semibold text-foreground mb-2 uppercase tracking-wide">
            Họ và tên *
          </label>
          {isEditing ? (
            <input
              type="text"
              value={editForm.fullName}
              onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
              className="w-full px-3 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-card text-foreground placeholder:text-muted-foreground"
              placeholder="Nhập họ và tên"
              required
            />
          ) : (
            <p className="font-medium text-foreground">{user.fullName || "Chưa cập nhật"}</p>
          )}
        </div>

        <div className="bg-muted/30 dark:bg-gray-800/50 p-4 rounded-xl border border-border/50 dark:border-gray-700">
          <label className="text-xs font-semibold text-foreground mb-2 uppercase tracking-wide flex items-center gap-2">
            <Phone className="h-3 w-3" />
            Số điện thoại
          </label>
          {isEditing ? (
            <input
              type="tel"
              value={editForm.phone}
              onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
              className="w-full px-3 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-card text-foreground placeholder:text-muted-foreground"
              placeholder="Nhập số điện thoại"
            />
          ) : (
            <p className="font-medium text-foreground">{user.phone || "Chưa cập nhật"}</p>
          )}
        </div>

        <div className="bg-muted/30 dark:bg-gray-800/50 p-4 rounded-xl border border-border/50 dark:border-gray-700">
          <label className="text-xs font-semibold text-foreground mb-2 uppercase tracking-wide flex items-center gap-2">
            <Calendar className="h-3 w-3" />
            Ngày sinh
          </label>
          {isEditing ? (
            <input
              type="date"
              value={editForm.birthday}
              onChange={(e) => setEditForm({ ...editForm, birthday: e.target.value })}
              className="w-full px-3 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-card text-foreground placeholder:text-muted-foreground"
              aria-label="Ngày sinh"
              title="Chọn ngày sinh"
            />
          ) : (
            <p className="font-medium text-foreground">{formatDate(user.birthday)}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-muted/30 dark:bg-gray-800/50 p-4 rounded-xl border border-border/50 dark:border-gray-700">
            <label className="block text-xs font-semibold text-foreground mb-2 uppercase tracking-wide">
              Giới tính
            </label>
            {isEditing ? (
              <select
                value={editForm.gender ? "true" : "false"}
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    gender: e.target.value === "true",
                  })
                }
                className="w-full px-3 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-card text-foreground [&>option]:bg-card [&>option]:text-foreground"
                aria-label="Giới tính"
                title="Chọn giới tính"
              >
                <option value="false">Nữ</option>
                <option value="true">Nam</option>
              </select>
            ) : (
              <p className="font-medium text-foreground">{user.gender ? "Nam" : "Nữ"}</p>
            )}
          </div>

          <div className="bg-muted/30 dark:bg-gray-800/50 p-4 rounded-xl border border-border/50 dark:border-gray-700">
            <label className="text-xs font-semibold text-foreground mb-2 uppercase tracking-wide flex items-center gap-2">
              <CreditCard className="h-3 w-3" />
              CCCD
            </label>
            {isEditing ? (
              <input
                type="text"
                value={editForm.cccd}
                onChange={(e) => setEditForm({ ...editForm, cccd: e.target.value })}
                className="w-full px-3 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-card text-foreground placeholder:text-muted-foreground"
                placeholder="12 số"
                maxLength={12}
              />
            ) : (
              <p className="font-medium text-foreground">{user.cccd || "Chưa cập nhật"}</p>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
