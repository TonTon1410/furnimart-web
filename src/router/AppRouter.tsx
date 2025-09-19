// src/router/AppRouter.tsx
import Cart from "@/pages/Cart";
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import UserProfile from "@/pages/UserProfile";
import NotFound from "@/pages/NotFound";
import { Routes, Route, Navigate } from "react-router-dom";
import AllProducts from "@/pages/AllProducts";


export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/home" element={<Navigate to="/" replace />} />
      <Route path="/profile" element={<UserProfile />} />
      <Route path="/cart" element={<Cart />} />
      <Route path="/shop" element={<AllProducts />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
