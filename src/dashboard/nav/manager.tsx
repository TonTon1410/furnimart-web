// src/config/nav/manager.tsx
import {
  ClipboardCheck,
  Truck,
  BarChart3,
  MessageSquare,
  Warehouse,
  Package,
  ShoppingCart,
  Users,
  Clock,
} from "lucide-react";
import type { RoleNav } from "./types";
import { DP } from "../../router/paths";

/**
 * 🌐 Manager Navigation
 * - Quản lý kho, tồn kho, điều phối, báo cáo
 */
export const managerNav = (): RoleNav => ({
  main: [
    { icon: <Package />, name: "Quản lí xuất nhập kho", path: DP("inventory") },
    {
      icon: <Warehouse />,
      name: "Sơ đồ kho hàng (Mới)",
      path: DP("warehouse-map"),
    },
    {
      icon: <Clock />,
      name: "Yêu cầu chuyển kho",
      path: DP("transfer-requests"),
    },
    { icon: <ShoppingCart />, name: "Quản lí đơn hàng", path: DP("orders") },
    { icon: <Users />, name: "Quản lí nhân viên", path: DP("employees") },
    {
      icon: <ClipboardCheck />,
      name: "Orders",
      subItems: [{ name: "Approve Orders", path: DP("orders/approval") }],
    },
    {
      icon: <Truck />,
      name: "Deliveries",
      subItems: [{ name: "Assign Delivery", path: DP("deliveries/assign") }],
    },
  ],
  others: [
    {
      icon: <BarChart3 />,
      name: "Reports",
      subItems: [
        { name: "Revenue", path: DP("reports/revenue") },
        { name: "Performance", path: DP("reports/performance") },
        { name: "Delivery", path: DP("reports/delivery") },
      ],
    },
    {
      icon: <MessageSquare />,
      name: "Chat",
      path: DP("chat"),
    },
  ],
});
