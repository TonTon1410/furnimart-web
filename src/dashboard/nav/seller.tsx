// src/config/nav/seller.tsx  (Store Staff)
import { Package, Boxes, ClipboardList, FileText, MessageCircle } from "lucide-react";
import type { RoleNav } from "./types";
import { DP } from "../../router/paths";

export const sellerNav = (): RoleNav => ({
  main: [
    { icon: <Package/>,       name: "Products", subItems: [
      { name: "All products", path: DP("products") },
      { name: "Create new",   path: DP("products/new") },
    ]},
    { icon: <Boxes/>,         name: "Branch Stock", path: DP("stock") },
    { icon: <ClipboardList/>, name: "Orders",       path: DP("orders") },
    { icon: <FileText/>,      name: "Invoices",     path: DP("invoices") },
  ],
  others: [
    { icon: <MessageCircle/>, name: "Chat",         path: DP("chat") },
  ],
});
