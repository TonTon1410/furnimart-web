// src/config/nav/seller.tsx  (Store Staff)
import {
  Package,
  ClipboardList,
  FileText,
  MessageCircle,
  Palette,
  Truck,
} from "lucide-react";
import type { RoleNav } from "./types";
import { DP } from "../../router/paths";

export const sellerNav = (): RoleNav => ({
  main: [
    { icon: <Package />, name: "Quản lí sản phẩm", path: DP("products") },
    { icon: <Palette />, name: "Quản lí màu sắc", path: DP("colors") },
    {
      icon: <Truck />,
      name: "Quản lý giao hàng",
      path: DP("delivery-management"),
    },
    { icon: <ClipboardList />, name: "Orders", path: DP("orders") },
    { icon: <FileText />, name: "Invoices", path: DP("invoices") },
  ],
  others: [{ icon: <MessageCircle />, name: "Chat", path: DP("chat") }],
});
