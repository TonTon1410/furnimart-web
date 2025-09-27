// src/components/Sidebar.tsx
import { NavLink } from "react-router-dom";
import { User, ShoppingBag, MapPin } from "lucide-react";

export default function Sidebar() {
  const linkClasses = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
      isActive
        ? "bg-orange-500 text-white"
        : "text-gray-800 hover:bg-gray-100"
    }`;

  return (
    <aside className="w-56 bg-white border border-gray-200 rounded-xl p-4 sticky top-0 h-fit">
      <nav className="flex flex-col gap-2">
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
    </aside>
  );
}
