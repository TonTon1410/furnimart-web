// src/components/Sidebar.tsx
import { NavLink } from "react-router-dom";
import { User, ShoppingBag, MapPin } from "lucide-react";

export default function Sidebar() {
  const linkClasses = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200
     ${
       isActive
         ? "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-md"
         : "text-gray-700 hover:bg-gray-100 hover:text-orange-600"
     }`;

  return (
    <aside className="w-64 bg-white border-r border-gray-200 h-screen p-6 flex flex-col shadow-lg">
      {/* Header */}
      <div className="mb-10 text-center">
        <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-orange-100 flex items-center justify-center shadow">
          <User className="h-8 w-8 text-orange-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-800">Tài khoản</h2>
        <p className="text-sm text-gray-500">Quản lý cá nhân</p>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-3">
        <NavLink to="/user/profile" className={linkClasses}>
          <User className="h-5 w-5" />
          <span>Thông tin cá nhân</span>
        </NavLink>
        <NavLink to="/user/orders" className={linkClasses}>
          <ShoppingBag className="h-5 w-5" />
          <span>Lịch sử đơn hàng</span>
        </NavLink>
        <NavLink to="/user/addresses" className={linkClasses}>
          <MapPin className="h-5 w-5" />
          <span>Địa chỉ giao hàng</span>
        </NavLink>
      </nav>

      {/* Footer */}
      <div className="mt-auto pt-6 text-center text-xs text-gray-400 border-t">
        © 2025 FurniMart
      </div>
    </aside>
  );
}