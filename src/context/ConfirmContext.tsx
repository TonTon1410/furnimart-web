import React, { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import ConfirmDialog, { type ConfirmVariant } from "@/components/ui/ConfirmDialog";

interface ConfirmOptions {
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: ConfirmVariant;
}

interface ConfirmContextType {
    confirm: (options: ConfirmOptions) => Promise<boolean>;
    alert: (options: Omit<ConfirmOptions, "cancelLabel">) => Promise<void>;
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

export const ConfirmProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [open, setOpen] = useState(false);
    const [options, setOptions] = useState<ConfirmOptions>({
        title: "",
        message: "",
    });
    const [resolveCallback, setResolveCallback] = useState<((value: boolean) => void) | null>(null);
    const [isAlert, setIsAlert] = useState(false);

    const confirm = useCallback((confirmOptions: ConfirmOptions) => {
        return new Promise<boolean>((resolve) => {
            setOptions(confirmOptions);
            setOpen(true);
            setIsAlert(false);
            setResolveCallback(() => resolve);
        });
    }, []);

    const alert = useCallback((alertOptions: Omit<ConfirmOptions, "cancelLabel">) => {
        return new Promise<void>((resolve) => {
            setOptions({ ...alertOptions, cancelLabel: "" }); // Empty cancelLabel for alert mode
            setOpen(true);
            setIsAlert(true);
            setResolveCallback(() => () => resolve());
        });
    }, []);

    const handleConfirm = useCallback(() => {
        setOpen(false);
        resolveCallback?.(true);
    }, [resolveCallback]);

    const handleCancel = useCallback(() => {
        setOpen(false);
        resolveCallback?.(false);
    }, [resolveCallback]);

    return (
        <ConfirmContext.Provider value={{ confirm, alert }}>
            {children}
            <ConfirmDialog
                open={open}
                {...options}
                cancelLabel={isAlert ? "" : options.cancelLabel}
                onConfirm={handleConfirm}
                onCancel={handleCancel}
            />
        </ConfirmContext.Provider>
    );
};

export const useConfirm = () => {
    const context = useContext(ConfirmContext);
    if (!context) {
        throw new Error("useConfirm must be used within a ConfirmProvider");
    }
    return context.confirm;
};

export const useAlert = () => {
    const context = useContext(ConfirmContext);
    if (!context) {
        throw new Error("useAlert must be used within a ConfirmProvider");
    }
    return context.alert;
};
