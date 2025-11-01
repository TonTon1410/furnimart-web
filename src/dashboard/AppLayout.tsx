import { SidebarProvider, useSidebar } from "@/context/SidebarContext";
import { useTheme } from "@/hooks/useTheme";
import { useEffect } from "react";
import { Outlet } from "react-router";
import AppHeader from "./AppHeader";
import AppSidebar from "./AppSidebar";

const LayoutContent: React.FC = () => {
  const { isExpanded, isHovered } = useSidebar();
  const { theme } = useTheme();

  // Apply dark class only to dashboard
  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    // Cleanup: remove dark class when leaving dashboard
    return () => {
      document.documentElement.classList.remove("dark");
    };
  }, [theme]);

  return (
    <div className="min-h-screen xl:flex bg-gray-50 dark:bg-gray-900 transition-colors">
      <AppSidebar />
      <div
        className={`flex-1 transition-all duration-300 ease-in-out
          ${isExpanded || isHovered ? "lg:ml-[290px]" : "lg:ml-[90px]"}`}
      >
        <AppHeader />
        <main className="mx-auto w-full max-w-none p-4 lg:p-6">
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
