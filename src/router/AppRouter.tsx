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
import AboutPage from "@/pages/AboutPage"
import UserProfile from "@/pages/UserProfile";
import OrderHistory from "@/pages/OrderHistory";
import AddressPage from "@/pages/AddressPage";
import ScrollToTop from "@/components/ScrollToTop";
import { authService } from "@/service/authService";
import { DP } from "./paths";
import RoleRoutes from "./RoleRoutes";
import type { PropsWithChildren } from "react";
import CheckoutPage from "@/pages/CheckoutPage";
import OrderConfirmationPage from "@/pages/OrderConfirmationPage";
import PaymentSuccess from "@/pages/PaymentSuccess";
import BlogPage from "@/pages/BlogPage"
import OwnBlog from "@/pages/OwnBlog";
import ContactPage from "@/pages/ContactPage";
import MyPayment from "@/components/payment/MyPayment";

const RequireAuth = ({ children }: PropsWithChildren) => {
  return authService.isAuthenticated() ? <>{children}</> : <Navigate to="/login" replace />;
};

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/home" element={<Navigate to="/" replace />} />
      <Route path="/cart" element={<Cart />} />
      <Route path="/shop" element={<AllProducts />} />
      <Route path="/product/*" element={<ProductDetail />} />
      <Route path="*" element={<NotFound />} />
      <Route path="/about" element={<AboutPage/>}/>
      <Route path="/checkout" element={<CheckoutPage />} />
      <Route path="/order-confirmation" element={<OrderConfirmationPage />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/user" element={<UserProfile />} />
      <Route path="/addresses" element={<AddressPage />} />
      <Route path="/orders" element={<OrderHistory />} />
      <Route path="/payment-success" element={<PaymentSuccess />} />
      <Route path="/blog" element={<BlogPage />} />
      <Route path="/ownblog" element={<OwnBlog />} />
      <Route path="/contact" element={<ContactPage/>}/>
      <Route path="/mypayment" element={<MyPayment/>}/>
      

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