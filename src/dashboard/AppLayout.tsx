import { SidebarProvider, useSidebar } from "@/context/SidebarContext";
import { useTheme } from "@/hooks/useTheme";
import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom"; // Nhớ import useLocation
import AppHeader from "./AppHeader";
import AppSidebar from "./AppSidebar";

const LayoutContent: React.FC = () => {
  const context = useSidebar();
  const { theme } = useTheme();
  const location = useLocation(); // Lấy đường dẫn hiện tại

  const isExpanded = context?.isExpanded ?? true;
  const isHovered = context?.isHovered ?? false;
  const isMobileOpen = context?.isMobileOpen ?? false;

  // Logic kiểm tra: Nếu đường dẫn chứa '/chat' thì bật chế độ "Full Viewport"
  const isChatPage = location.pathname.includes("/chat");

  // Apply dark class
  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    return () => {
      document.documentElement.classList.remove("dark");
    };
  }, [theme]);

  return (
    // THAY ĐỔI 1: Dùng h-screen và overflow-hidden để khóa chiều cao màn hình
    <div className="h-screen w-full flex bg-gray-50 dark:bg-gray-900 transition-colors overflow-hidden">
      
      {/* Sidebar - Giữ nguyên */}
      <AppSidebar />

      {/* Wrapper cho Header + Main Content */}
      <div
        className={`flex-1 flex flex-col h-full min-w-0 transition-all duration-300 ease-in-out
          ${isExpanded || isHovered || isMobileOpen ? "lg:ml-[290px]" : "lg:ml-[90px]"}`}
      >
        {/* Header - Luôn cố định ở trên cùng, không bị cuộn đi mất */}
        <div className="flex-none z-20">
            <AppHeader />
        </div>

        {/* THAY ĐỔI 2: Main Content Area
            - flex-1: Chiếm hết không gian còn lại
            - min-h-0: Bắt buộc để scroll hoạt động trong flex
            - isChatPage ? : Nếu là chat thì không padding, không scroll (để con lo), ngược lại thì padding và scroll
        */}
        <main 
            className={`flex-1 min-h-0 relative w-full max-w-none 
            ${isChatPage 
                ? 'p-0 overflow-hidden' 
                : 'p-4 lg:p-6 overflow-y-auto scroll-smooth'
            }`}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
};

const AppLayout: React.FC = () => (
  <SidebarProvider>
    <LayoutContent />
  </SidebarProvider>
);

export default AppLayout;