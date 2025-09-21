// src/router/RoleRoutes.tsx
import { Routes, Route, Navigate } from "react-router-dom";
import type { RoleKey } from "./paths";
import { authService } from "@/service/authService";
import { DP } from "./paths";

// 👉 Các trang placeholder (bạn tạo file thật sau)
const Placeholder = (t: string) => () => <div className="p-6 text-lg">{t}</div>;

const AdminUsers = Placeholder("Admin • Users");
const AdminBranches = Placeholder("Admin • Branches");
const AdminCategories = Placeholder("Admin • Categories");
const AdminSettings = Placeholder("Admin • Settings");
const AdminSales = Placeholder("Admin • Sales Report");
const AdminTop = Placeholder("Admin • Top Products");
const AdminDeliveryEff = Placeholder("Admin • Delivery Efficiency");
const AdminWallet = Placeholder("Admin • Wallet");
const AdminDisputes = Placeholder("Admin • Disputes");

const SellerProducts = Placeholder("Seller • Products");
const SellerNewProduct = Placeholder("Seller • New Product");
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
  const role = (authService.getRole?.() as RoleKey) || "seller";

  // một cây route/role, tất cả nằm dưới /dashboard/*
  if (role === "admin") {
    return (
      <Routes>
        <Route index element={<AdminUsers />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="branches" element={<AdminBranches />} />
        <Route path="categories" element={<AdminCategories />} />
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

  if (role === "manager") {
    return (
      <Routes>
        <Route index element={<ManagerInventory />} />
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

  if (role === "delivery") {
    return (
      <Routes>
        <Route index element={<DeliveryOrders />} />
        <Route path="orders" element={<DeliveryOrders />} />
        <Route path="pickup" element={<DeliveryPickup />} />
        <Route path="status" element={<DeliveryStatus />} />
        <Route path="pod" element={<DeliveryPOD />} />
        <Route path="history" element={<DeliveryHistory />} />
        <Route path="*" element={<Navigate to={DP()} replace />} />
      </Routes>
    );
  }

  // default: seller
  return (
    <Routes>
      <Route index element={<SellerProducts />} />
      <Route path="products" element={<SellerProducts />} />
      <Route path="products/new" element={<SellerNewProduct />} />
      <Route path="stock" element={<SellerStock />} />
      <Route path="orders" element={<SellerOrders />} />
      <Route path="invoices" element={<SellerInvoices />} />
      <Route path="chat" element={<SellerChat />} />
      <Route path="*" element={<Navigate to={DP()} replace />} />
    </Routes>
  );
}
