// src/router/ProtectCustomerRoutes.tsx
import { Navigate } from "react-router-dom";
import { authService } from "@/service/authService";
import type { PropsWithChildren } from "react";

/**
 * Component bảo vệ routes chỉ dành cho CUSTOMER
 * Nếu user có role khác (admin, manager, seller, delivery) → redirect về dashboard
 */
export const ProtectCustomerRoutes = ({ children }: PropsWithChildren) => {
  const role = authService.getRole();

  // Nếu có role và role KHÔNG phải customer → redirect về dashboard
  if (role && role !== "customer") {
    return <Navigate to="/dashboard" replace />;
  }

  // CUSTOMER hoặc không đăng nhập → cho phép truy cập
  return <>{children}</>;
};
