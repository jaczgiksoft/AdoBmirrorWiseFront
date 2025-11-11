import { useState, useCallback } from "react";

let toastId = 0;

export function useToast() {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback((toast) => {
        const id = ++toastId;
        const newToast = { id, type: "info", duration: 4000, ...toast };
        setToasts((prev) => [...prev, newToast]);

        // Auto eliminar tras duración
        if (newToast.duration > 0) {
            setTimeout(() => removeToast(id), newToast.duration);
        }
    }, []);

    const removeToast = useCallback((id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    return { toasts, addToast, removeToast };
}
