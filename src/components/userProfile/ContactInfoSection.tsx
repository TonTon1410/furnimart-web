"use client"
import { Mail, MapPin, Shield } from "lucide-react"
import { motion } from "framer-motion"
import type { UserProfile } from "@/pages/UserProfile"
import { addressService, type Address } from "@/service/addressService"

interface ContactInfoSectionProps {
  user: UserProfile
  defaultAddress: Address | null
  isEditing: boolean
  formatDate: (date?: string) => string
  fadeUp: any
}

export default function ContactInfoSection({
  user,
  defaultAddress,
  isEditing,
  formatDate,
  fadeUp,
}: ContactInfoSectionProps) {
  return (
    <motion.div variants={fadeUp} className="space-y-4">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 bg-secondary/10 rounded-xl">
          <Mail className="h-5 w-5 text-secondary" />
        </div>
        <h3 className="text-xl font-bold text-foreground">Thông tin liên hệ</h3>
      </div>

      <div className="space-y-4">
        <div className="bg-muted/30 dark:bg-gray-800/50 p-4 rounded-xl border border-border/50 dark:border-gray-700">
          <label className="block text-xs font-semibold text-foreground mb-2 uppercase tracking-wide">Email</label>
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-primary" />
            <span className="font-medium text-foreground">{user.email}</span>
            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">Không thể thay đổi</span>
          </div>
        </div>

        <div className="bg-muted/30 dark:bg-gray-800/50 p-4 rounded-xl border border-border/50 dark:border-gray-700">
          <label className="text-xs font-semibold text-foreground mb-2 uppercase tracking-wide flex items-center gap-2">
            <MapPin className="h-3 w-3" />
            Địa chỉ
          </label>
          <p className="font-medium text-foreground whitespace-pre-wrap min-h-[60px] leading-relaxed">
            {defaultAddress ? addressService.formatAddress(defaultAddress) : user.address || "Chưa cập nhật"}
          </p>
          {!isEditing && <p className="text-xs text-muted-foreground mt-2 italic">Quản lý địa chỉ tại trang Địa chỉ</p>}
        </div>

        <div className="bg-primary/5 border border-primary/20 p-4 rounded-xl">
          <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            Thông tin tài khoản
          </h4>
          <div className="space-y-1 text-sm">
            <p className="text-muted-foreground">
              <span className="font-medium">Cập nhật lần cuối:</span> {formatDate(user.updatedAt)}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
