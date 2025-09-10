import React, { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { ShoppingCart, User, Menu, X } from "lucide-react";
import { useCartStore, selectCartCount } from "@/store/cart";
import CartDrawer from "./cart/CartDrawer";

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
  const ticking = useRef(false);
  const { pathname } = useLocation();

  const isHome = pathname === "/";

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

  const headerClass =
    "fixed top-0 z-40 w-full transition-colors duration-300";
  const bgClass =
    isHome && !scrolled ? "bg-transparent" : "bg-[#095544] shadow-md";

  return (
    <header className={`${headerClass} ${bgClass}`}>
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
        {/* Logo */}
        <Link to="/" className="text-xl font-extrabold text-white">
          Furni<span className="text-yellow-400">.</span>
        </Link>

        {/* Menu desktop */}
        <nav className="hidden items-center gap-8 md:flex">
          <NavLink to="/" className={navClass}>Trang chủ</NavLink>
          <NavLink to="/shop" className={navClass}>Sản phẩm</NavLink>
          <NavLink to="/about" className={navClass}>Giới thiệu</NavLink>
          <NavLink to="/services" className={navClass}>Dịch vụ</NavLink>
          <NavLink to="/blog" className={navClass}>Tin tức</NavLink>
          <NavLink to="/contact" className={navClass}>Liên hệ</NavLink>
        </nav>

        {/* Action */}
        <div className="hidden items-center gap-5 text-white md:flex">
          <Link to="/login" className="transition-colors hover:text-yellow-400" aria-label="Tài khoản">
            <User className="h-5 w-5" />
          </Link>
          <button
            onClick={() => setDrawerOpen(true)}
            className="relative transition-colors hover:text-yellow-400"
            aria-label="Mở giỏ hàng"
          >
            <ShoppingCart className="h-5 w-5" />
            {count > 0 && (
              <span className="absolute -right-2 -top-2 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-yellow-400 px-1 text-xs font-bold text-gray-900">
                {count}
              </span>
            )}
          </button>
        </div>

        {/* Mobile */}
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
        </div>
      )}

      {/* Drawer giỏ hàng */}
      <CartDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </header>
  );
}
