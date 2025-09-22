// src/router/AppRouter.tsx
import Cart from "@/pages/Cart";
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import UserProfile from "@/pages/UserProfile";
import NotFound from "@/pages/NotFound";
import AppLayout from "@/dashboard/AppLayout";
import { Routes, Route, Navigate } from "react-router-dom";
import AllProducts from "@/pages/AllProducts";
import ProductDetail from "@/pages/ProductDetail";


export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/home" element={<Navigate to="/" replace />} />
      <Route path="/profile" element={<UserProfile />} />
      <Route path="/cart" element={<Cart />} />
      <Route path="/shop" element={<AllProducts />} />
      <Route path="/product/*" element={<ProductDetail />} />
      <Route path="*" element={<NotFound />} />

      <Route path="/dashboard" element={<AppLayout />}>
        <Route index element={<Home />} />
        <Route path="cart" element={<Cart />} />
      </Route>
    </Routes>
  );
}
