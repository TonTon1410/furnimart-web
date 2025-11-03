// src/context/useToastRadix.ts
import { useState } from "react";
import * as Toast from "@radix-ui/react-toast";

type ToastType = "success" | "error" | "warning" | "info";

interface ToastOptions {
  type?: ToastType;
  title: string;
  description?: string;
}

export function useToastRadix() {
  const [open, setOpen] = useState(false);
  const [toastData, setToastData] = useState<ToastOptions>({
    type: "info",
    title: "",
    description: "",
  });

  const showToast = (options: ToastOptions) => {
    setToastData(options);
    setOpen(false);
    setTimeout(() => setOpen(true), 0);
  };

  const ToastComponent = () => {
    const colorClass = {
      success: "bg-emerald-50 border-emerald-200 text-emerald-800",
      error: "bg-red-50 border-red-200 text-red-800",
      warning: "bg-yellow-50 border-yellow-200 text-yellow-800",
      info: "bg-blue-50 border-blue-200 text-blue-800",
    }[toastData.type || "info"];

    return (
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
    );
  };

  return { showToast, ToastComponent };
}
