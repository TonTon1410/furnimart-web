// src/router/AppRouter.tsx
import Cart from "@/pages/Cart";
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import ForgotPassword from "@/pages/ForgotPassword";
// import ResetPassword from "@/pages/ResetPassword"
import NotFound from "@/pages/NotFound";
import AppLayout from "@/dashboard/AppLayout";
import { Routes, Route, Navigate } from "react-router-dom";
import AllProducts from "@/pages/AllProducts";
import ProductDetail from "@/pages/ProductDetail";
import AboutPage from "@/pages/AboutPage";
import UserProfile from "@/pages/UserProfile";
import OrderHistory from "@/pages/OrderHistory";
import AddressPage from "@/pages/AddressPage";
import ScrollToTop from "@/components/ScrollToTop";
import { authService } from "@/service/authService";
import { DP } from "./paths";
import RoleRoutes from "./RoleRoutes";
import { ProtectCustomerRoutes } from "./ProtectCustomerRoutes";
import type { PropsWithChildren } from "react";
import CheckoutPage from "@/pages/CheckoutPage";
import OrderConfirmationPage from "@/pages/OrderConfirmationPage";
import PaymentSuccess from "@/pages/PaymentSuccess";
import BlogPage from "@/pages/BlogPage";
import OwnBlog from "@/pages/OwnBlog";
import ContactPage from "@/pages/ContactPage";
import MyPaymentPage from "@/pages/MyPayment";

const RequireAuth = ({ children }: PropsWithChildren) => {
  return authService.isAuthenticated() ? (
    <>{children}</>
  ) : (
    <Navigate to="/login" replace />
  );
};

export default function AppRouter() {
  return (
    <Routes>
      {/* Trang công khai - Chỉ cho CUSTOMER, role khác redirect về dashboard */}
      <Route
        path="/"
        element={
          <ProtectCustomerRoutes>
            <Home />
          </ProtectCustomerRoutes>
        }
      />
      <Route path="/login" element={<Login />} />
      <Route path="/home" element={<Navigate to="/" replace />} />
      <Route
        path="/cart"
        element={
          <ProtectCustomerRoutes>
            <Cart />
          </ProtectCustomerRoutes>
        }
      />
      <Route
        path="/shop"
        element={
          <ProtectCustomerRoutes>
            <AllProducts />
          </ProtectCustomerRoutes>
        }
      />
      <Route
        path="/product/*"
        element={
          <ProtectCustomerRoutes>
            <ProductDetail />
          </ProtectCustomerRoutes>
        }
      />
      <Route path="*" element={<NotFound />} />
      <Route
        path="/about"
        element={
          <ProtectCustomerRoutes>
            <AboutPage />
          </ProtectCustomerRoutes>
        }
      />
      <Route
        path="/checkout"
        element={
          <ProtectCustomerRoutes>
            <CheckoutPage />
          </ProtectCustomerRoutes>
        }
      />
      <Route
        path="/order-confirmation"
        element={
          <ProtectCustomerRoutes>
            <OrderConfirmationPage />
          </ProtectCustomerRoutes>
        }
      />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route
        path="/user"
        element={
          <ProtectCustomerRoutes>
            <UserProfile />
          </ProtectCustomerRoutes>
        }
      />
      <Route
        path="/addresses"
        element={
          <ProtectCustomerRoutes>
            <AddressPage />
          </ProtectCustomerRoutes>
        }
      />
      <Route
        path="/orders"
        element={
          <ProtectCustomerRoutes>
            <OrderHistory />
          </ProtectCustomerRoutes>
        }
      />
      <Route
        path="/payment-success"
        element={
          <ProtectCustomerRoutes>
            <PaymentSuccess />
          </ProtectCustomerRoutes>
        }
      />
      <Route
        path="/blog"
        element={
          <ProtectCustomerRoutes>
            <BlogPage />
          </ProtectCustomerRoutes>
        }
      />
      <Route
        path="/ownblog"
        element={
          <ProtectCustomerRoutes>
            <OwnBlog />
          </ProtectCustomerRoutes>
        }
      />
      <Route
        path="/contact"
        element={
          <ProtectCustomerRoutes>
            <ContactPage />
          </ProtectCustomerRoutes>
        }
      />
      <Route
        path="/mypayment"
        element={
          <ProtectCustomerRoutes>
            <MyPaymentPage />
          </ProtectCustomerRoutes>
        }
      />

      {/* Layout dành cho User */}

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
        {/* Các trang còn lại render theo role */}
        <Route path="*" element={<RoleRoutes />} />
      </Route>
    </Routes>
  );
}
