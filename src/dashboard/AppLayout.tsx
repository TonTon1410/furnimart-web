import { SidebarProvider, useSidebar } from "@/context/SidebarContext";
import { useToastRadix } from "@/context/useToastRadix";
import { Outlet } from "react-router";
import AppHeader from "./AppHeader";
import AppSidebar from "./AppSidebar";

const LayoutContent: React.FC = () => {
  const { isExpanded, isHovered } = useSidebar();
  const { ToastComponent } = useToastRadix();

  return (
    <div className="min-h-screen xl:flex">
      <AppSidebar />
      <div
        className={`flex-1 transition-all duration-300 ease-in-out
          ${isExpanded || isHovered ? "lg:ml-[290px]" : "lg:ml-[90px]"}`}
      >
        <AppHeader />
        <main className="mx-auto w-full max-w-none ">
          <Outlet />
        </main>
      </div>
      <ToastComponent />
    </div>
  );
};

const AppLayout: React.FC = () => (
  <SidebarProvider>
    <LayoutContent />
  </SidebarProvider>
);

export default AppLayout;
