// src/router/AppRouter.tsx
import { lazy, Suspense, type PropsWithChildren } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { authService } from "@/service/authService";
import { DP } from "./paths";
import type { RoleKey } from "./paths";
import ScrollToTop from "@/components/ScrollToTop";

// Loading component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <p className="text-gray-600">Đang tải...</p>
    </div>
  </div>
);

// Lazy load pages - Customer pages
const Home = lazy(() => import("@/pages/Home"));
const Login = lazy(() => import("@/pages/Login"));
const Cart = lazy(() => import("@/pages/Cart"));
const AllProducts = lazy(() => import("@/pages/AllProducts"));
const ProductDetail = lazy(() => import("@/pages/ProductDetail"));
const AboutPage = lazy(() => import("@/pages/AboutPage"));
const CheckoutPage = lazy(() => import("@/pages/CheckoutPage"));
const OrderConfirmationPage = lazy(
  () => import("@/pages/OrderConfirmationPage")
);
const PaymentSuccess = lazy(() => import("@/pages/PaymentSuccess"));
const ForgotPassword = lazy(() => import("@/pages/ForgotPassword"));
const UserProfile = lazy(() => import("@/pages/UserProfile"));
const AddressPage = lazy(() => import("@/pages/AddressPage"));
const OrderHistory = lazy(() => import("@/pages/OrderHistory"));
const BlogPage = lazy(() => import("@/pages/BlogPage"));
const BlogDetailPage = lazy(() => import("@/pages/BlogDetailPage"));
const ContactPage = lazy(() => import("@/pages/ContactPage"));
const MyWalletPage = lazy(() => import("@/pages/MyWalletPage"));
const NotFound = lazy(() => import("@/pages/NotFound"));

// Lazy load layouts
const AppLayout = lazy(() => import("@/dashboard/AppLayout"));
const DeliveryLayout = lazy(() => import("@/dashboard/DeliveryLayout"));
const RoleRoutes = lazy(() => import("./RoleRoutes"));
const ProtectCustomerRoutes = lazy(() =>
  import("./ProtectCustomerRoutes").then((m) => ({
    default: m.ProtectCustomerRoutes,
  }))
);

const RequireAuth = ({ children }: PropsWithChildren) => {
  return authService.isAuthenticated() ? (
    <>{children}</>
  ) : (
    <Navigate to="/login" replace />
  );
};

const DashboardLayout = () => {
  const role = authService.getRole?.() as RoleKey | null;

  if (role === "delivery") {
    return <DeliveryLayout />;
  }

  return <AppLayout />;
};

export default function AppRouter() {
  return (
    <Suspense fallback={<PageLoader />}>
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
          path="/blog/:id"
          element={
            <ProtectCustomerRoutes>
              <BlogDetailPage />
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
          path="/mywallet"
          element={
            <ProtectCustomerRoutes>
              <MyWalletPage />
            </ProtectCustomerRoutes>
          }
        />

        {/* Dashboard root */}
        <Route
          path={DP("*")}
          element={
            <RequireAuth>
              <ScrollToTop>
                <DashboardLayout />
              </ScrollToTop>
            </RequireAuth>
          }
        >
          {/* Các trang còn lại render theo role */}
          <Route path="*" element={<RoleRoutes />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
