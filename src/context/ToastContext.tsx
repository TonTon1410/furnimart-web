// src/context/ToastContext.tsx
import { createContext, useContext, useState, type ReactNode } from "react";
import * as Toast from "@radix-ui/react-toast";

type ToastType = "success" | "error" | "warning" | "info";

interface ToastOptions {
  type?: ToastType;
  title: string;
  description?: string;
}

interface ToastContextType {
  showToast: (options: ToastOptions) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [toastData, setToastData] = useState<ToastOptions>({
    type: "info",
    title: "",
    description: "",
  });

  const showToast = (options: ToastOptions) => {
    setToastData(options);
    setOpen(false);
    // Dùng requestAnimationFrame thay vì setTimeout(0) để re-trigger animation
    requestAnimationFrame(() => {
      setOpen(true);
    });
  };

  const colorClass = {
    success: "bg-emerald-50 border-emerald-200 text-emerald-800",
    error: "bg-red-50 border-red-200 text-red-800",
    warning: "bg-yellow-50 border-yellow-200 text-yellow-800",
    info: "bg-blue-50 border-blue-200 text-blue-800",
  }[toastData.type || "info"];

  return (
    // ✅ BƯỚC 1: Bọc MỌI THỨ bằng <Toast.Provider> gốc của Radix
    <Toast.Provider swipeDirection="right">
      
      {/* Provider tùy chỉnh của bạn để truyền hàm showToast */}
      <ToastContext.Provider value={{ showToast }}>
        {children}
      </ToastContext.Provider>
      
      {/* Component Toast.Root hiển thị toast (nằm BÊN TRONG <Toast.Provider>) */}
      <Toast.Root
        open={open}
        onOpenChange={setOpen}
        duration={4000}
        className={`rounded-md px-4 py-3 shadow-md border ${colorClass}`}
      >
        <Toast.Title className="font-semibold">{toastData.title}</Toast.Title>
        {toastData.description && (
          <Toast.Description className="text-sm opacity-90">
            {toastData.description}
          </Toast.Description>
        )}
      </Toast.Root>

      {/* ✅ BƯỚC 2: Thêm Viewport để toast có nơi hiển thị */}
      <Toast.Viewport className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 outline-none" />

    </Toast.Provider>
  );
}

// Hook để các component con sử dụng
// eslint-disable-next-line react-refresh/only-export-components
export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}