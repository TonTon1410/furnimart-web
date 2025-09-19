// src/router/AppRouter.tsx
import Cart from "@/pages/Cart";
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import NotFound from "@/pages/NotFound";
import AppLayout from "@/dashboard/AppLayout";
import { Routes, Route, Navigate } from "react-router-dom";


export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/home" element={<Navigate to="/" replace />} />
      <Route path="/cart" element={<Cart />} />
      <Route path="*" element={<NotFound />} />

      <Route path="/dashboard" element={<AppLayout />}>
        <Route index element={<Home />} />
        <Route path="cart" element={<Cart />} />
      </Route>
    </Routes>
  );
}
