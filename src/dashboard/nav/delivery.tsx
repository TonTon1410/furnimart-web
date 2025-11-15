// src/config/nav/delivery.tsx  (Delivery Staff)
import { ClipboardList, ScanBarcode, Truck, Image as ImageIcon, History } from "lucide-react";
import type { RoleNav } from "./types";
import { DP } from "../../router/paths";

export const deliveryNav = (): RoleNav => ({
  main: [
    { icon: <ClipboardList/>, name: "Đơn hàng",       path: DP("orders") },
    { icon: <ScanBarcode/>,   name: "Xác nhận lấy hàng",  path: DP("pickup") },
    { icon: <Truck/>,         name: "Cập nhật",   path: DP("status") },
    { icon: <ImageIcon/>,     name: "Chứng từ", path: DP("pod") },
  ],
  others: [
    { icon: <History/>,       name: "Lịch sử",         path: DP("history") },
  ],
});
