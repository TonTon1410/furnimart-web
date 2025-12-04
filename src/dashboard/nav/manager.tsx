// src/config/nav/manager.tsx
import {
  BarChart3,
  MessageSquare,
  Warehouse,
  Package,
  ShoppingCart,
  Users,
  Clock,
  FilePlus,
  LayoutDashboard,
} from "lucide-react";
import type { RoleNav } from "./types";
import { DP } from "../../router/paths";
import inventoryService from "../../service/inventoryService";
import warehousesService from "../../service/warehousesService";
import { authService } from "../../service/authService";

/**
 * 🌐 Manager Navigation
 * - Quản lý kho, tồn kho, điều phối, báo cáo
 */
export const managerNav = async (): Promise<RoleNav> => {
  let pendingCount = 0;

  try {
    const storeId = authService.getStoreId();
    if (storeId) {
      const warehouseRes = await warehousesService.getWarehouseByStore(storeId);
      const warehouseData = warehouseRes.data?.data || warehouseRes.data;

      if (warehouseData?.id) {
        const transferRes = await inventoryService.getPendingTransfers(
          warehouseData.id
        );
        const transferData = transferRes.data?.data || transferRes.data || [];
        const transfers = Array.isArray(transferData) ? transferData : [];
        pendingCount = transfers.filter(
          (t: { transferStatus: string }) => t.transferStatus === "PENDING"
        ).length;
      }
    }
  } catch (error) {
    console.error("Error fetching pending transfers count:", error);
  }

  return {
    main: [
      { icon: <LayoutDashboard />, name: "Dashboard", path: DP("dashboard") },
      {
        icon: <Package />,
        name: "Quản lí xuất nhập kho",
        path: DP("inventory"),
      },
      {
        icon: <Warehouse />,
        name: "Sơ đồ kho hàng (Mới)",
        path: DP("warehouse-map"),
      },
      {
        icon: <Clock />,
        name: "Yêu cầu chuyển kho",
        path: DP("transfer-requests"),
        badge: pendingCount > 0 ? pendingCount : undefined,
      },
      { icon: <ShoppingCart />, name: "Quản lí đơn hàng", path: DP("orders") },
      { icon: <Users />, name: "Quản lí nhân viên", path: DP("employees") },
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
  };
};
