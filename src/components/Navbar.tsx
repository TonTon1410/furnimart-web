import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import {
  ShoppingCart,
  User as Menu,
  X,
  ChevronDown,
  LogOut,
} from "lucide-react";
import { useCartStore, selectCartCount } from "@/store/cart";
import CartDrawer from "./cart/CartDrawer";
import { authService } from "@/service/authService";

// Kiểu giống trang UserProfile
interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  address?: string;
  dateOfBirth?: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

const navClass = ({ isActive }: { isActive: boolean }) =>
  `relative text-sm font-medium transition-colors duration-200
   ${isActive ? "text-white" : "text-gray-200 hover:text-white"}
   after:absolute after:-bottom-1 after:left-0 after:h-0.5 after:w-0 after:bg-yellow-400 after:transition-all after:duration-300
   hover:after:w-full ${isActive ? "after:w-full" : ""}`;

export default function Navbar() {
  const count = useCartStore(selectCartCount);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const ticking = useRef(false);
  const { pathname } = useLocation();
  const isHome = pathname === "/";

  // Lấy hồ sơ y hệt trang UserProfile
  const fetchProfile = async () => {
    if (!authService.isAuthenticated()) {
      setUser(null);
      return;
    }
    try {
      const profile = await authService.getProfile();
      if (profile) {
        setUser(profile as UserProfile);
      } else {
        // no profile returned (could be 404 or fallback) — keep user null but don't force logout here
        setUser(null);
      }
    } catch (err) {
      setUser(null);
    }
  };

  // Bootstrap lần đầu (và khi vào trang bất kỳ)
  useEffect(() => {
    fetchProfile();
  }, []);

  // Nghe sự kiện profile:updated từ trang UserProfile để cập nhật ngay
  useEffect(() => {
    const onProfileUpdated = (e: Event) => {
      const detail = (e as CustomEvent).detail as
        | Partial<UserProfile>
        | undefined;
      if (!detail) return;
      setUser((prev) =>
        prev ? { ...prev, ...detail } : (detail as UserProfile)
      );
    };
    window.addEventListener("profile:updated", onProfileUpdated);
    return () =>
      window.removeEventListener("profile:updated", onProfileUpdated);
  }, []);

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  // Theo dõi scroll để đổi nền header
  useEffect(() => {
    const onScroll = () => {
      if (!ticking.current) {
        window.requestAnimationFrame(() => {
          setScrolled(window.scrollY > 50);
          ticking.current = false;
        });
        ticking.current = true;
      }
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const headerClass = "fixed top-0 z-40 w-full transition-colors duration-300";
  const bgClass =
    isHome && !scrolled ? "bg-transparent" : "bg-[#095544] shadow-md";

  const getAvatarUrl = (u?: UserProfile | null) => {
    if (u?.avatar) {
      return u.avatar.startsWith("http")
        ? u.avatar
        : `http://localhost:8080${u.avatar}`;
    }
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(
      u?.fullName || "User"
    )}&background=0ea5e9&color=fff&size=128`;
  };

  const handleLogout = () => {
    authService.logout(true); // true = xóa cả remember me khi user tự logout
    setUser(null);
    setUserMenuOpen(false);
  };

  const handleLogoClick = (
    e: React.MouseEvent<HTMLAnchorElement, MouseEvent>
  ) => {
    if (pathname === "/") {
      e.preventDefault(); // ngăn react-router đổi route lại chính nó
      window.scrollTo({ top: 0, behavior: "smooth" }); // cuộn mượt về đầu
    }
  };

  return (
    <header className={`${headerClass} ${bgClass}`}>
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 py-4 sm:py-5">
        {/* Logo */}
        <Link
          to="/"
          onClick={handleLogoClick}
          className="text-xl font-extrabold text-white cursor-pointer"
        >
          Furni<span className="text-yellow-400">.</span>
        </Link>

        {/* Menu desktop */}
        <nav className="hidden items-center gap-8 md:flex">
          <NavLink to="/" className={navClass}>
            Trang chủ
          </NavLink>
          <NavLink to="/shop" className={navClass}>
            Sản phẩm
          </NavLink>
          <NavLink to="/about" className={navClass}>
            Giới thiệu
          </NavLink>
          <NavLink to="/services" className={navClass}>
            Dịch vụ
          </NavLink>
          <NavLink to="/blog" className={navClass}>
            Tin tức
          </NavLink>
          <NavLink to="/contact" className={navClass}>
            Liên hệ
          </NavLink>
        </nav>

        {/* Action (desktop) */}
        <div className="hidden items-center gap-6 text-white md:flex">
          {/* Cart */}
          <button
            onClick={() => setDrawerOpen(true)}
            className="relative flex items-center gap-2 transition-colors hover:text-yellow-400"
            aria-label="Mở giỏ hàng"
          >
            <ShoppingCart className="h-5 w-5" />
            <span>Giỏ hàng</span>
            {count > 0 && (
              <span className="absolute -right-2 -top-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-yellow-400 px-1 text-xs font-bold text-gray-900">
                {count}
              </span>
            )}
          </button>

          {/* Account */}
          {!user ? (
            <Link
              to="/login"
              className="px-4 py-2 bg-yellow-400 text-gray-900 rounded-lg font-semibold hover:bg-yellow-300 transition-colors"
            >
              Đăng nhập
            </Link>
          ) : (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setUserMenuOpen((v) => !v)}
                className="flex items-center gap-2 rounded-full border border-white/20 pl-1 pr-2 py-1 hover:bg-white/10"
                aria-label="Mở menu người dùng"
              >
                <img
                  src={getAvatarUrl(user)}
                  alt={user.fullName}
                  className="h-8 w-8 rounded-full object-cover"
                />
                <span className="max-w-[180px] truncate">{user.fullName}</span>
                <ChevronDown className="h-4 w-4 opacity-80" />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-lg bg-white text-gray-700 shadow-lg overflow-hidden">
                  <Link
                    to="/user"
                    className="block px-4 py-2 text-sm hover:bg-gray-50"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    Hồ sơ của tôi
                  </Link>

                  <Link
                    to="/mywallet"
                    className="block px-4 py-2 text-sm hover:bg-gray-50"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    Ví Của tôi{" "}
                  </Link>
                  <Link
                    to="/orders"
                    className="block px-4 py-2 text-sm hover:bg-gray-50"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    Lịch sử đơn hàng
                  </Link>
                  <Link
                    to="/addresses"
                    className="block px-4 py-2 text-sm hover:bg-gray-50"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    Địa chỉ giao hàng
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm hover:bg-gray-50"
                  >
                    <LogOut className="h-4 w-4" />
                    Đăng xuất
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="text-white md:hidden rounded-lg border border-white/30 p-2"
          aria-label="Mở menu"
        >
          {mobileOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Menu mobile */}
      {mobileOpen && (
        <div className="md:hidden border-t border-white/20 bg-[#2f4f4f] px-6 py-4 space-y-3">
          {[
            { to: "/", label: "Trang chủ" },
            { to: "/shop", label: "Sản phẩm" },
            { to: "/about", label: "Giới thiệu" },
            { to: "/services", label: "Dịch vụ" },
            { to: "/blog", label: "Tin tức" },
            { to: "/contact", label: "Liên hệ" },
          ].map((i) => (
            <NavLink
              key={i.to}
              to={i.to}
              onClick={() => setMobileOpen(false)}
              className="block text-gray-200 hover:text-white"
            >
              {i.label}
            </NavLink>
          ))}

          {/* Khu chức năng */}
          <div className="pt-3 mt-3 border-t border-white/10 flex items-center justify-between">
            {/* Giỏ hàng: icon + chữ */}
            <button
              onClick={() => {
                setDrawerOpen(true);
                setMobileOpen(false);
              }}
              className="relative flex items-center gap-2 text-white hover:text-yellow-300"
              aria-label="Mở giỏ hàng"
            >
              <ShoppingCart className="h-5 w-5" />
              <span className="text-sm font-medium">Giỏ hàng</span>
              {count > 0 && (
                <span className="absolute -right-2 -top-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-yellow-400 px-1 text-xs font-bold text-gray-900">
                  {count}
                </span>
              )}
            </button>

            {/* Tài khoản */}
            {!user ? (
              <Link
                to="/login"
                onClick={() => setMobileOpen(false)}
                className="px-3 py-1.5 bg-yellow-400 text-gray-900 rounded-lg text-sm font-semibold hover:bg-yellow-300 transition-colors"
                aria-label="Đi tới đăng nhập"
              >
                Đăng nhập
              </Link>
            ) : (
              <button
                onClick={() => setUserMenuOpen((v) => !v)}
                className="flex items-center gap-2 text-white hover:text-yellow-300"
                aria-label="Menu tài khoản"
              >
                <img
                  src={getAvatarUrl(user)}
                  alt={user.fullName}
                  className="h-8 w-8 rounded-full object-cover"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (
                      e.target as HTMLImageElement
                    ).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                      user.fullName
                    )}&background=0ea5e9&color=fff&size=128`;
                  }}
                />
                <span className="truncate max-w-[100px] text-sm font-medium">
                  {user.fullName}
                </span>
                <ChevronDown className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Mobile User Menu Dropdown */}
          {user && userMenuOpen && (
            <div className="pt-3 border-t border-white/10 space-y-2">
              <Link
                to="/user"
                className="block text-gray-200 hover:text-white text-sm py-2"
                onClick={() => {
                  setUserMenuOpen(false);
                  setMobileOpen(false);
                }}
              >
                👤 Hồ sơ của tôi
              </Link>
              <Link
                to="/mywallet"
                className="block text-gray-200 hover:text-white text-sm py-2"
                onClick={() => {
                  setUserMenuOpen(false);
                  setMobileOpen(false);
                }}
              >
                💳 My Wallet
              </Link>
              <Link
                to="/orders"
                className="block text-gray-200 hover:text-white text-sm py-2"
                onClick={() => {
                  setUserMenuOpen(false);
                  setMobileOpen(false);
                }}
              >
                📦 Lịch sử đơn hàng
              </Link>
              <Link
                to="/addresses"
                className="block text-gray-200 hover:text-white text-sm py-2"
                onClick={() => {
                  setUserMenuOpen(false);
                  setMobileOpen(false);
                }}
              >
                📍 Địa chỉ giao hàng
              </Link>
              <button
                onClick={() => {
                  handleLogout();
                  setUserMenuOpen(false);
                  setMobileOpen(false);
                }}
                className="flex items-center gap-2 text-red-300 hover:text-red-200 text-sm py-2 w-full"
              >
                <LogOut className="h-4 w-4" />
                Đăng xuất
              </button>
            </div>
          )}
        </div>
      )}

      {/* Drawer giỏ hàng */}
      <CartDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </header>
  );
}
