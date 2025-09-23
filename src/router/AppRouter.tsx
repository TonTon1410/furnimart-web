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
import AboutPage from "@/pages/AboutPage"
import ScrollToTop from "@/components/ScrollToTop";
import { authService } from "@/service/authService";
import { DP } from "./paths";
import RoleRoutes from "./RoleRoutes";
import type { PropsWithChildren } from "react";

const RequireAuth = ({ children }: PropsWithChildren) => {
  return authService.isAuthenticated() ? <>{children}</> : <Navigate to="/login" replace />;
};

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
      <Route path="/about" element={<AboutPage/>}/>

      {/* Dashboard root */}
      <Route
        path={DP("*")}
        element={
          <RequireAuth>
            <ScrollToTop>
              <AppLayout />
            </ScrollToTop>
          </RequireAuth>
        }
      >
        {/* Trang dùng chung cho mọi role */}
        <Route path="profile" element={<UserProfile />} />
        {/* Các trang còn lại render theo role */}
        <Route path="*" element={<RoleRoutes />} />
      </Route>
    </Routes>
  );
}
