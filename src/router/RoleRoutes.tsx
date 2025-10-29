// src/router/RoleRoutes.tsx
import { Routes, Route, Navigate } from "react-router-dom";
import type { RoleKey } from "./paths";
import { authService } from "@/service/authService";
import { DP } from "./paths";

import AdminCategoriesPage from "@/dashboard/roles/admin/AdminCategoriesPage";
import AdminMaterialsPage from "@/dashboard/roles/admin/AdminMaterialsPage";
const Placeholder = (t: string) => () => <div className="p-6 text-lg">{t}</div>;

const AdminSettings = Placeholder("Admin • Settings");
const AdminSales = Placeholder("Admin • Sales Report");
const AdminTop = Placeholder("Admin • Top Products");
const AdminDeliveryEff = Placeholder("Admin • Delivery Efficiency");
const AdminWallet = Placeholder("Admin • Wallet");
const AdminDisputes = Placeholder("Admin • Disputes");

import SellerProductsPage from "@/dashboard/roles/seller/SellerProductsPage";
import ColorManagementPage from "@/dashboard/roles/seller/ColorManagementPage";
import AdminUsersPage from "@/dashboard/roles/admin/AdminUsersPage";
import AdminEmployeesPage from "@/dashboard/roles/admin/AdminEmployeesPage";
import AdminStoresPage from "@/dashboard/roles/admin/AdminStoresPage";
const SellerStock = Placeholder("Seller • Branch Stock");
const SellerOrders = Placeholder("Seller • Orders");
const SellerInvoices = Placeholder("Seller • Invoices");
const SellerChat = Placeholder("Seller • Chat");

const ManagerInventory = Placeholder("Manager • Inventory");
const ManagerApproval = Placeholder("Manager • Approve Orders");
const ManagerAssign = Placeholder("Manager • Assign Delivery");
const ManagerRevenue = Placeholder("Manager • Revenue Report");
const ManagerPerformance = Placeholder("Manager • Performance Report");
const ManagerDelivery = Placeholder("Manager • Delivery Report");
const ManagerChat = Placeholder("Manager • Chat");

const DeliveryOrders = Placeholder("Delivery • My Orders");
const DeliveryPickup = Placeholder("Delivery • Pickup Confirm");
const DeliveryStatus = Placeholder("Delivery • Update Status");
const DeliveryPOD = Placeholder("Delivery • Proof of Delivery");
const DeliveryHistory = Placeholder("Delivery • History");

export default function RoleRoutes() {
  const role = authService.getRole?.() as RoleKey | null;
  if (!authService.isAuthenticated() || !role) {
    return <Navigate to="/" replace />;
  }

  // ADMIN
  if (role === "admin") {
    return (
      <Routes>
        {/* index → chọn trang mặc định cho admin */}
        <Route index element={<Navigate to={DP("users")} replace />} />
        <Route path="users" element={<AdminUsersPage />} />
        <Route path="employees" element={<AdminEmployeesPage />} />
        <Route path="stores" element={<AdminStoresPage />} />
        <Route path="materials" element={<AdminMaterialsPage />} />
        <Route path="categories" element={<AdminCategoriesPage />} />
        <Route path="settings" element={<AdminSettings />} />
        <Route path="reports/sales" element={<AdminSales />} />
        <Route path="reports/top-products" element={<AdminTop />} />
        <Route path="reports/delivery" element={<AdminDeliveryEff />} />
        <Route path="wallet" element={<AdminWallet />} />
        <Route path="disputes" element={<AdminDisputes />} />
        <Route path="*" element={<Navigate to={DP()} replace />} />
      </Routes>
    );
  }

  // MANAGER
  if (role === "manager") {
    return (
      <Routes>
        <Route index element={<Navigate to={DP("inventory")} replace />} />
        {/* <Route path="warehouses" element={<WarehousesPage />} />
        <Route path="zones" element={<ZonePage/>} />
        <Route path="locations" element={<LocationItemPage />} />
        <Route path="inventory" element={<InventoryPage />} /> */}
        <Route path="inventory" element={<ManagerInventory />} />
        <Route path="orders/approval" element={<ManagerApproval />} />
        <Route path="deliveries/assign" element={<ManagerAssign />} />
        <Route path="reports/revenue" element={<ManagerRevenue />} />
        <Route path="reports/performance" element={<ManagerPerformance />} />
        <Route path="reports/delivery" element={<ManagerDelivery />} />
        <Route path="chat" element={<ManagerChat />} />
        <Route path="*" element={<Navigate to={DP()} replace />} />
      </Routes>
    );
  }

  // DELIVERY
  if (role === "delivery") {
    return (
      <Routes>
        <Route index element={<Navigate to={DP("orders")} replace />} />
        <Route path="orders" element={<DeliveryOrders />} />
        <Route path="pickup" element={<DeliveryPickup />} />
        <Route path="status" element={<DeliveryStatus />} />
        <Route path="pod" element={<DeliveryPOD />} />
        <Route path="history" element={<DeliveryHistory />} />
        <Route path="*" element={<Navigate to={DP()} replace />} />
      </Routes>
    );
  }

  // SELLER
  if (role === "seller") {
    return (
      <Routes>
        <Route index element={<Navigate to={DP("products")} replace />} />
        <Route path="products" element={<SellerProductsPage />} />
        <Route path="colors" element={<ColorManagementPage />} />
        <Route path="stock" element={<SellerStock />} />
        <Route path="orders" element={<SellerOrders />} />
        <Route path="invoices" element={<SellerInvoices />} />
        <Route path="chat" element={<SellerChat />} />
        <Route path="*" element={<Navigate to={DP()} replace />} />
      </Routes>
    );
  }

  // role không có dashboard (ví dụ CUSTOMER) → ra trang chủ hoặc 403
  return <Navigate to="/" replace />;
}
