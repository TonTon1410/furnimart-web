// src/config/nav/manager.tsx
import {
  ClipboardCheck,
  Truck,
  BarChart3,
  MessageSquare,
  Warehouse,
} from "lucide-react";
import type { RoleNav } from "./types";
import { DP } from "../../router/paths";

/**
 * 🌐 Manager Navigation
 * - Quản lý kho, tồn kho, điều phối, báo cáo
 */
export const managerNav = (): RoleNav => ({
  main: [
    {
      icon: <Warehouse />,
      name: "Warehouse",
      subItems: [
        { name: "Warehouses", path: DP("warehouses") },
        { name: "Zones", path: DP("zones") },
        { name: "Locations", path: DP("locations") },
        { name: "Inventory", path: DP("inventory") },
      ],
    },
    {
      icon: <ClipboardCheck />,
      name: "Orders",
      subItems: [
        { name: "Approve Orders", path: DP("orders/approval") },
      ],
    },
    {
      icon: <Truck />,
      name: "Deliveries",
      subItems: [
        { name: "Assign Delivery", path: DP("deliveries/assign") },
      ],
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

// // src/config/nav/manager.tsx  (Branch Manager)
// import { Boxes, ClipboardCheck, Truck, BarChart3, MessageSquare } from "lucide-react";
// import type { RoleNav } from "./types";
// import { DP } from "../../router/paths";

// export const managerNav = (): RoleNav => ({
//   main: [
//     { icon: <Boxes/>,          name: "Inventory",       path: DP("inventory") },
//     { icon: <ClipboardCheck/>, name: "Approve Orders",  path: DP("orders/approval") },
//     { icon: <Truck/>,          name: "Assign Delivery", path: DP("deliveries/assign") },
//   ],
//   others: [
//     { icon: <BarChart3/>,      name: "Reports", subItems: [
//       { name: "Revenue",     path: DP("reports/revenue") },
//       { name: "Performance", path: DP("reports/performance") },
//       { name: "Delivery",    path: DP("reports/delivery") },
//     ]},
//     { icon: <MessageSquare/>,  name: "Chat",            path: DP("chat") },
//   ],
// });
