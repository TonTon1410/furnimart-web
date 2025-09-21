// src/config/nav/delivery.tsx  (Delivery Staff)
import { ClipboardList, ScanBarcode, Truck, Image as ImageIcon, History } from "lucide-react";
import type { RoleNav } from "./types";
import { DP } from "../../router/paths";

export const deliveryNav = (): RoleNav => ({
  main: [
    { icon: <ClipboardList/>, name: "My Orders",       path: DP("orders") },
    { icon: <ScanBarcode/>,   name: "Pickup Confirm",  path: DP("pickup") },
    { icon: <Truck/>,         name: "Update Status",   path: DP("status") },
    { icon: <ImageIcon/>,     name: "Proof of Delivery", path: DP("pod") },
  ],
  others: [
    { icon: <History/>,       name: "History",         path: DP("history") },
  ],
});
