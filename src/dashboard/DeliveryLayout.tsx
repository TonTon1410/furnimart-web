import { useTheme } from "@/hooks/useTheme";
import { useEffect } from "react";
import { Outlet } from "react-router";
import AppHeader from "./AppHeader";
import DeliveryNav from "./DeliveryNav";

const DeliveryLayout: React.FC = () => {
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <AppHeader />
      <DeliveryNav />
      <main className="mx-auto w-full max-w-7xl px-3 py-4 sm:px-4 sm:py-4 lg:px-6 lg:py-6">
        <Outlet />
      </main>
    </div>
  );
};

export default DeliveryLayout;
