// src/config/nav/seller.tsx  (Store Staff)
import {
  Package,
  MessageCircle,
  Palette,
  Truck,
  Warehouse,
  LayoutDashboard
} from "lucide-react";
import type { RoleNav } from "./types";
import { DP } from "../../router/paths";

export const sellerNav = (): RoleNav => ({
  main: [
    { icon: <LayoutDashboard />, name: "Dashboard", path: DP("dashboard") },
    { icon: <Package />, name: "Quản lí sản phẩm", path: DP("products") },
    { icon: <Palette />, name: "Quản lí màu sắc", path: DP("colors") },
    { icon: <Package />, name: "Quản lí xuất nhập kho", path: DP("inventory") },
    {
      icon: <Warehouse />,
      name: "Sơ đồ kho hàng",
      path: DP("warehouse-map"),
    },
    {
      icon: <Truck />,
      name: "Quản lý giao hàng",
      path: DP("delivery-management"),
    },
  ],
  others: [{ icon: <MessageCircle />, name: "Chat", path: DP("chat") }],
});
