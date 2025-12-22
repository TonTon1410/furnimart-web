// src/config/nav/admin.tsx
import {
  Users,
  Building2,
  Tags,
  UserCog,
  LayoutDashboard, Ticket
} from "lucide-react";
import type { RoleNav } from "./types";
import { DP } from "../../router/paths";

export const adminNav = (): RoleNav => ({
  main: [
    { icon: <Users />, name: "Quản lí tài khoản", path: DP("users") },
    { icon: <UserCog />, name: "Quản lý nhân viên", path: DP("employees") },
    { icon: <Users />, name: "Quản lí cửa hàng", path: DP("stores") },
    { icon: <Building2 />, name: "Chất liệu", path: DP("Materials") },
    { icon: <Tags />, name: "Danh mục", path: DP("categories") },
    { icon: <Ticket />, name: "Quản lý Voucher", path: DP("vouchers") },
    { icon: <LayoutDashboard />, name: "Thống kê & Báo cáo", path: DP("dashboard") },
  ]
});
