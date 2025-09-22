import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";

type HeaderMode = "sticky" | "fixed";

interface ScrollToTopProps {
  headerSelector?: string;
  headerMode?: HeaderMode;       // "sticky" (mặc định) hoặc "fixed"
  mainClassName?: string;
  children?: React.ReactNode;
}

export default function ScrollToTop({
  headerSelector = "header",
  headerMode = "sticky",
  mainClassName = "",
  children,
}: ScrollToTopProps) {
  const { pathname, hash } = useLocation();
  const [headerHeight, setHeaderHeight] = useState(0);
  const observerRef = useRef<ResizeObserver | null>(null);

  // Cuộn lên đầu khi đổi route
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [pathname]);

  // Theo dõi chiều cao header và set CSS var --header-h
  useEffect(() => {
    const el = document.querySelector(headerSelector) as HTMLElement | null;

    const update = () => {
      const h = el?.offsetHeight ?? 0;
      setHeaderHeight(h);
      document.documentElement.style.setProperty("--header-h", `${h}px`);
    };

    if (!el) {
      setHeaderHeight(0);
      document.documentElement.style.setProperty("--header-h", "0px");
      return;
    }

    update();

    if (typeof ResizeObserver !== "undefined") {
      observerRef.current = new ResizeObserver(update);
      observerRef.current.observe(el);
    }

    return () => {
      observerRef.current?.disconnect();
      observerRef.current = null;
    };
  }, [headerSelector]);

  // Stable helper: cuộn đến id, trừ chiều cao header
  const scrollToId = useCallback(
    (id: string, behavior: ScrollBehavior = "smooth") => {
      const target = document.getElementById(id);
      if (!target) return;
      const top =
        target.getBoundingClientRect().top +
        window.scrollY -
        (headerHeight || 0);
      window.scrollTo({ top, behavior });
    },
    [headerHeight]
  );

  // Bắt click anchor nội bộ (#id) để cuộn mượt và trừ header
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      const a = (e.target as Element | null)?.closest(
        'a[href^="#"]'
      ) as HTMLAnchorElement | null;
      if (!a) return;

      const href = a.getAttribute("href") || "";
      const id = href.slice(1);
      if (!id) return;

      e.preventDefault();
      scrollToId(id, "smooth");
    };

    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, [scrollToId]);

  // Nếu URL có hash, cuộn đến đó sau render
  useEffect(() => {
    if (hash && hash.length > 1) {
      const id = hash.slice(1);
      const t = setTimeout(() => scrollToId(id, "auto"), 0);
      return () => clearTimeout(t);
    }
  }, [hash, scrollToId]);

  // sticky: không bù pt; fixed: bù pt = --header-h
  const mainPT = headerMode === "fixed" ? "pt-[var(--header-h)]" : "";
  const mainClasses = `${mainPT} ${mainClassName}`.trim();

  return <main className={mainClasses}>{children}</main>;
}
