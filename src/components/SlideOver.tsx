// src/components/SlideOver.tsx
import React, { useEffect } from "react";
import { X } from "lucide-react";

type Props = {
  title?: string;
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  widthClass?: string; // ví dụ: "max-w-xl"
};

const SlideOver = React.memo<Props>(
  ({ title, open, onClose, children, widthClass = "max-w-2xl" }) => {
    // khoá scroll nền khi mở
    useEffect(() => {
      if (!open) return;
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }, [open]);

    return (
      <>
        {/* Overlay */}
        <div
          className={`fixed inset-0 z-70 bg-black/40 backdrop-blur-sm transition-opacity
                    ${
                      open
                        ? "opacity-100 pointer-events-auto"
                        : "opacity-0 pointer-events-none"
                    }`}
          onClick={onClose}
        />
        {/* Panel */}
        <aside
          className={`fixed top-0 right-0 z-80 h-screen w-full ${widthClass}
                    bg-white dark:bg-gray-900 shadow-xl
                    transform-gpu transition-transform duration-300
                    ${open ? "translate-x-0" : "translate-x-full"}`}
          role="dialog"
          aria-modal="true"
        >
          <div className="flex items-center justify-between border-b border-gray-200 p-4 dark:border-gray-800">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {title}
            </h3>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
              aria-label="Đóng"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="h-[calc(100vh-57px)] overflow-y-auto p-4">
            {children}
          </div>
        </aside>
      </>
    );
  }
);

export default SlideOver;
