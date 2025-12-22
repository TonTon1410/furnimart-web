// src/config/nav/seller.tsx  (Store Staff)
import {
  Package,
  FileText,
  // Palette,
  Truck,
  Warehouse,
  LayoutDashboard,
  ShoppingCart,
  Shield,
} from "lucide-react";
import type { RoleNav } from "./types";
import { DP } from "../../router/paths";

export const sellerNav = (): RoleNav => ({
  main: [
    {
      icon: <ShoppingCart />,
      name: "Bán hàng tại quầy",
      path: DP("staff-order"),
    },
    { icon: <Package />, name: "Quản lí sản phẩm", path: DP("products") },
    // { icon: <Palette />, name: "Quản lí màu sắc", path: DP("colors") },
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
    {
      icon: <Shield />,
      name: "Quản lý bảo hành",
      path: DP("warranty-management"),
    },
    { icon: <FileText />, name: "Bài viết", path: DP("blog") },
    {
      icon: <LayoutDashboard />,
      name: "Thống kê & Báo cáo",
      path: DP("dashboard"),
    }
  ]
});
