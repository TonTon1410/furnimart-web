// src/components/Sidebar.tsx
import { NavLink } from "react-router-dom";
import { User, ShoppingBag } from "lucide-react";

export default function Sidebar() {
 const linkClasses = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
    isActive
      ? "bg-orange-500 text-white" // Active rõ ràng
      : "text-gray-800 hover:bg-gray-100" // Chữ đen dễ đọc
  }`

  return (
    <aside className="w-64 bg-white border-r border-gray-200 h-screen p-4 text-gray-800">
      <h2 className="text-lg font-bold mb-6">Tài khoản</h2>
      <nav className="flex flex-col gap-2">
        <NavLink to="/user/profile" className={linkClasses}>
  <User className="h-5 w-5" />
  <span>Thông tin cá nhân</span>
</NavLink>

      <NavLink to="/user/orders" className={linkClasses}>
        <ShoppingBag className="h-5 w-5" />
        <span>Lịch sử đơn hàng</span>
      </NavLink>
      </nav>
    </aside>
  );
}
