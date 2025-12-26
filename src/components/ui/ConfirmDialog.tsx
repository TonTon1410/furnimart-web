import React, { useEffect } from "react";
import { AlertTriangle, X, CheckCircle2, Info, AlertCircle } from "lucide-react";

export type ConfirmVariant = "danger" | "success" | "warning" | "info";

interface ConfirmDialogProps {
    open: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: ConfirmVariant;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
    open,
    title,
    message,
    onConfirm,
    onCancel,
    confirmLabel = "Xác nhận",
    cancelLabel = "Hủy bỏ",
    variant = "danger",
}) => {
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === "Escape") onCancel();
        };
        if (open) window.addEventListener("keydown", handleEsc);
        return () => window.removeEventListener("keydown", handleEsc);
    }, [open, onCancel]);

    useEffect(() => {
        if (open) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [open]);

    if (!open) return null;

    const styles = {
        danger: {
            icon: <AlertTriangle className="h-6 w-6 text-red-600" />,
            iconBg: "bg-red-100 dark:bg-red-900/30",
            buttonBtn: "bg-red-600 hover:bg-red-700 focus:ring-red-500 shadow-red-200",
        },
        success: {
            icon: <CheckCircle2 className="h-6 w-6 text-emerald-600" />,
            iconBg: "bg-emerald-100 dark:bg-emerald-900/30",
            buttonBtn: "bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500 shadow-emerald-200",
        },
        warning: {
            icon: <AlertCircle className="h-6 w-6 text-amber-600" />,
            iconBg: "bg-amber-100 dark:bg-amber-900/30",
            buttonBtn: "bg-amber-600 hover:bg-amber-700 focus:ring-amber-500 shadow-amber-200",
        },
        info: {
            icon: <Info className="h-6 w-6 text-blue-600" />,
            iconBg: "bg-blue-100 dark:bg-blue-900/30",
            buttonBtn: "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 shadow-blue-200",
        },
    };

    const currentStyle = styles[variant];

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-0">
            <div
                className="fixed inset-0 bg-gray-900/40 dark:bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
                onClick={onCancel}
            />

            <div className="relative w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 text-left shadow-2xl transition-all animate-in zoom-in-95 duration-200 border border-gray-100 dark:border-gray-700">
                <button
                    onClick={onCancel}
                    className="absolute right-4 top-4 rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-500 dark:hover:bg-gray-700 transition-colors focus:outline-none"
                    aria-label="Đóng"
                >
                    <X className="h-5 w-5" />
                </button>

                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                    <div
                        className={`mx-auto flex h-12 w-12 shrink-0 items-center justify-center rounded-full sm:mx-0 sm:h-10 sm:w-10 ${currentStyle.iconBg}`}
                    >
                        {currentStyle.icon}
                    </div>

                    <div className="mt-3 text-center sm:ml-2 sm:mt-0 sm:text-left w-full">
                        <h3 className="text-lg font-semibold leading-6 text-gray-900 dark:text-white">
                            {title}
                        </h3>

                        <div className="mt-2">
                            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                                {message}
                            </p>
                        </div>

                        <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
                            <button
                                type="button"
                                className="inline-flex w-full justify-center items-center rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600 transition-all focus:outline-none focus:ring-2 focus:ring-gray-200"
                                onClick={onCancel}
                            >
                                {cancelLabel}
                            </button>
                            <button
                                type="button"
                                className={`inline-flex w-full justify-center items-center rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition-all transform active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 ${currentStyle.buttonBtn}`}
                                onClick={onConfirm}
                            >
                                {confirmLabel}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConfirmDialog;
