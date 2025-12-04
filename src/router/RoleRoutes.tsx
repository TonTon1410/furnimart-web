// src/router/RoleRoutes.tsx
import { lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import type { RoleKey } from "./paths";
import { authService } from "@/service/authService";
import { DP } from "./paths";

const Placeholder = (t: string) => () => <div className="p-6 text-lg">{t}</div>;

// Lazy load all dashboard pages
const AdminCategoriesPage = lazy(
  () => import("@/dashboard/roles/admin/AdminCategoriesPage")
);
const AdminMaterialsPage = lazy(
  () => import("@/dashboard/roles/admin/AdminMaterialsPage")
);
const AdminUsersPage = lazy(
  () => import("@/dashboard/roles/admin/AdminUsersPage")
);
const AdminEmployeesPage = lazy(
  () => import("@/dashboard/roles/admin/AdminEmployeesPage")
);
const AdminStoresPage = lazy(
  () => import("@/dashboard/roles/admin/AdminStoresPage")
);
const BlogManagement = lazy(
  () => import("@/dashboard/roles/admin/OwnBlog")
);

const UserProfile = lazy(() => import("@/pages/UserProfile"));



const SellerProductsPage = lazy(
  () => import("@/dashboard/roles/seller/SellerProductsPage")
);
const ColorManagementPage = lazy(
  () => import("@/dashboard/roles/seller/ColorManagementPage")
);
const DeliveryManagementPage = lazy(
  () => import("@/dashboard/roles/seller/DeliveryManagementPage")
);

const InventoryManagement = lazy(
  () => import("@/dashboard/roles/manager/InventoryManagement")
);
const CreateInventoryPage = lazy(
  () => import("@/dashboard/roles/manager/CreateInventoryPage")
);
const WarehouseMapNew = lazy(
  () => import("@/dashboard/roles/manager/WarehouseMapNew")
);
const TransferRequestsPage = lazy(
  () => import("@/dashboard/roles/manager/TransferRequestsPage")
);
const OrderManagement = lazy(
  () => import("@/dashboard/roles/manager/OrderManagement")
);

const ManagerEmployeesPage = lazy(
  () => import("@/dashboard/roles/manager/ManagerEmployeesPage")
);

const DeliveryOrdersPage = lazy(
  () => import("@/dashboard/roles/delivery/DeliveryOrdersPage")
);
const DeliveryPickupPage = lazy(
  () => import("@/dashboard/roles/delivery/DeliveryPickupPage")
);
const DeliveryStatusPage = lazy(
  () => import("@/dashboard/roles/delivery/DeliveryStatusPage")
);
const DeliveryPODPage = lazy(
  () => import("@/dashboard/roles/delivery/DeliveryPODPage")
);

//Dashboard
const AdminDashboard = lazy(
  () => import("@/dashboard/pages/AdminDashboard")
);

const ManagerDashboard = lazy(
  () => import("@/dashboard/pages/ManagerDashboard")
);

const StaffDashboard = lazy(
  () => import("@/dashboard/pages/StaffDashboard")
);

// Staff Order Page
const StaffOrderPage = lazy(
  () => import("@/dashboard/roles/seller/OrderOffline/StaffOrderPage")
);

const AdminSettings = Placeholder("Admin • Settings");
const AdminSales = Placeholder("Admin • Sales Report");
const AdminTop = Placeholder("Admin • Top Products");
const AdminDeliveryEff = Placeholder("Admin • Delivery Efficiency");
const AdminWallet = Placeholder("Admin • Wallet");
const AdminDisputes = Placeholder("Admin • Disputes");

const SellerStock = Placeholder("Seller • Branch Stock");
const SellerOrders = Placeholder("Seller • Orders");
const SellerInvoices = Placeholder("Seller • Invoices");
const SellerChat = Placeholder("Seller • Chat");

const ManagerApproval = Placeholder("Manager • Approve Orders");
const ManagerAssign = Placeholder("Manager • Assign Delivery");
const ManagerRevenue = Placeholder("Manager • Revenue Report");
const ManagerPerformance = Placeholder("Manager • Performance Report");
const ManagerDelivery = Placeholder("Manager • Delivery Report");
const ManagerChat = Placeholder("Manager • Chat");

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
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="profile" element={<UserProfile />} />
        <Route path="blog" element={<BlogManagement />} />
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
        <Route path="dashboard" element={<ManagerDashboard />} />
        <Route path="profile" element={<UserProfile />} />
        <Route path="blog" element={<BlogManagement />} />
        <Route path="inventory" element={<InventoryManagement />} />
        <Route path="inventory/create" element={<CreateInventoryPage />} />
        <Route path="warehouse-map" element={<WarehouseMapNew />} />
        <Route path="transfer-requests" element={<TransferRequestsPage />} />
        <Route path="orders" element={<OrderManagement />} />
        <Route path="employees" element={<ManagerEmployeesPage />} />
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
        <Route path="profile" element={<UserProfile />} />
        <Route path="orders" element={<DeliveryOrdersPage />} />
        <Route path="pickup" element={<DeliveryPickupPage />} />
        <Route path="status" element={<DeliveryStatusPage />} />
        <Route path="pod" element={<DeliveryPODPage />} />
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
        <Route path="dashboard" element={<StaffDashboard />} />
        <Route path="staff-order" element={<StaffOrderPage />} />
        <Route path="profile" element={<UserProfile />} />
        <Route path="blog" element={<BlogManagement />} />
        <Route path="products" element={<SellerProductsPage />} />
        <Route path="colors" element={<ColorManagementPage />} />
        <Route path="inventory" element={<InventoryManagement />} />
        <Route path="inventory/create" element={<CreateInventoryPage />} />
        <Route path="warehouse-map" element={<WarehouseMapNew readOnly />} />
        <Route
          path="delivery-management"
          element={<DeliveryManagementPage />}
        />
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
