import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";

interface ScrollToTopProps {
  headerSelector?: string; // CSS selector cho Navbar, mặc định "header"
  children?: React.ReactNode;
}

export default function ScrollToTop({
  headerSelector = "header",
  children,
}: ScrollToTopProps) {
  const { pathname } = useLocation();
  const [headerHeight, setHeaderHeight] = useState(0);
  const observerRef = useRef<ResizeObserver | null>(null); // ✅ có initial value

  // Scroll lên đầu khi đổi route
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [pathname]);

  // Tự động lấy chiều cao Navbar và set CSS variable --header-h
  useEffect(() => {
    const header = document.querySelector(headerSelector) as HTMLElement | null;
    if (!header) {
      setHeaderHeight(0);
      document.documentElement.style.setProperty("--header-h", "0px");
      return;
    }

    const updateHeight = () => {
      const h = header.offsetHeight || 0;
      setHeaderHeight(h);
      document.documentElement.style.setProperty("--header-h", `${h}px`);
    };

    // Khởi tạo observer
    observerRef.current = new ResizeObserver(updateHeight);
    observerRef.current.observe(header);

    // Set lần đầu
    updateHeight();

    // Cleanup
    return () => {
      observerRef.current?.disconnect();
      observerRef.current = null;
    };
  }, [headerSelector]);

  // Smooth scroll cho anchor links, chừa khoảng trống Navbar
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      const target = e.target as Element | null;
      if (!target) return;

      // Tìm thẻ <a> gần nhất có href="#..."
      const anchor = target.closest('a[href^="#"]') as HTMLAnchorElement | null;
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href || href.length <= 1) return;

      const id = href.slice(1);
      const el = document.getElementById(id);
      if (!el) return;

      e.preventDefault();
      const top =
        el.getBoundingClientRect().top + window.scrollY - (headerHeight || 0);
      window.scrollTo({ top, behavior: "smooth" });
    };

    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, [headerHeight]);

  // Home: giữ hiệu ứng cũ => không chừa khoảng trống
  const isHome = pathname === "/";
  const mainClass = isHome ? "" : "pt-[var(--header-h)]"; // ✅ không dùng inline style

  return <main className={mainClass}>{children}</main>;
}
