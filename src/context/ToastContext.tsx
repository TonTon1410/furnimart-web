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
    <Toast.Provider swipeDirection="right">
      <ToastContext.Provider value={{ showToast }}>
        {children}
      </ToastContext.Provider>

      <Toast.Root
        open={open}
        onOpenChange={setOpen}
        duration={3000}
        // 👇 THAY ĐỔI 1: Thêm 'relative' để làm điểm neo cho nút đóng
        className={`relative rounded-xl max-w-md w-full px-8 py-5 shadow-2xl border ${colorClass} data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:slide-out-to-right-100 data-[state=open]:slide-in-from-right-100`}
      >
        <div className="flex flex-col gap-1">
          <Toast.Title className="font-bold text-xl pr-6">
            {toastData.title}
          </Toast.Title>
          {toastData.description && (
            <Toast.Description className="text-lg opacity-95">
              {toastData.description}
            </Toast.Description>
          )}
        </div>

        {/* 👇 THAY ĐỔI 2: Thêm nút Close (dùng Toast.Close của Radix để tự động xử lý đóng) */}
        <Toast.Close 
          className="absolute top-3 right-3 p-1 rounded-full opacity-60 hover:opacity-100 hover:bg-black/5 transition-all outline-none focus:ring-2 focus:ring-black/20"
          aria-label="Close"
        >
          {/* Icon X (SVG) */}
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="20" 
            height="20" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2.5" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <path d="M18 6 6 18"/>
            <path d="m6 6 12 12"/>
          </svg>
        </Toast.Close>

      </Toast.Root>

      {/* Góc dưới bên phải */}
      {/* <Toast.Viewport className="fixed bottom-4 right-4 z-50 flex flex-col gap-4 outline-none w-[400px] p-4" /> */}
      {/* Góc trên bên phải */}
      <Toast.Viewport className="fixed top-4 right-4 z-50 flex flex-col gap-4 outline-none w-[400px] p-4" />
      {/* Góc trên ở giữa */}
      {/* <Toast.Viewport className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-4 outline-none w-[400px] p-4" /> */}
    </Toast.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}