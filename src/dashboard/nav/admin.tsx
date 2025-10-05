// src/config/nav/admin.tsx
import { Users, Building2, Tags, Settings, BarChart3, Wallet, LifeBuoy } from "lucide-react";
import type { RoleNav } from "./types";
import { DP } from "../../router/paths";

export const adminNav = (): RoleNav => ({
  main: [
    { icon: <Users/>,     name: "Quản lí tài khoản", path: DP("users") },
    { icon: <Building2/>, name: "Chất liệu",   path: DP("Materials") },
    { icon: <Tags/>,      name: "Danh mục", path: DP("categories") },
    { icon: <Settings/>,  name: "Settings",   path: DP("settings") },
  ],
  others: [
    { icon: <BarChart3/>, name: "Analytics",  subItems: [
      { name: "Sales by branch", path: DP("reports/sales") },
      { name: "Top products",    path: DP("reports/top-products") },
      { name: "Delivery eff.",   path: DP("reports/delivery") },
    ]},
    { icon: <Wallet/>,    name: "Wallet",     path: DP("wallet") },
    { icon: <LifeBuoy/>,  name: "Disputes",   path: DP("disputes") },
  ],
});
