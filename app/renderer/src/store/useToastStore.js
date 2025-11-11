// src/store/useToastStore.js
import { create } from "zustand";
import { useNotificationStore } from "@/store/useNotificationStore";

let toastId = 0;

export const useToastStore = create((set) => ({
    toasts: [],

    addToast: (toast) => {
        const id = ++toastId;
        const newToast = {
            id,
            type: "info",
            duration: 4000,
            ...toast,
        };

        // 🧩 Añadir el nuevo toast
        set((state) => ({
            toasts: [...state.toasts, newToast],
        }));

        // 🔔 Si el toast es de tipo "success" o "info", actualiza las notificaciones globales
        try {
            const { fetchNotifications } = useNotificationStore.getState();
            if (newToast.type === "success" || newToast.type === "info") {
                fetchNotifications();
            }
        } catch (err) {
            console.warn("⚠️ No se pudo actualizar notificaciones desde toast:", err);
        }

        // ⏳ Eliminación automática del toast
        if (newToast.duration > 0) {
            setTimeout(() => {
                set((state) => ({
                    toasts: state.toasts.filter((t) => t.id !== id),
                }));
            }, newToast.duration);
        }
    },

    removeToast: (id) =>
        set((state) => ({
            toasts: state.toasts.filter((t) => t.id !== id),
        })),
}));
