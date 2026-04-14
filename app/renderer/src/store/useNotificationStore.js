// src/store/useNotificationStore.js
import { create } from "zustand";
import { io } from "socket.io-client";
import {
    getUserNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
} from "@/services/notification.service";

export const useNotificationStore = create((set, get) => ({
    notifications: [],
    unreadCount: 0,
    loading: false,
    error: null,
    socket: null, // 🔌 conexión WebSocket

    // 🧩 Cargar notificaciones iniciales desde la API
    fetchNotifications: async () => {
        try {
            set({ loading: true, error: null });
            const data = await getUserNotifications();
            const list = Array.isArray(data.notifications) ? data.notifications : data;

            set({
                notifications: list,
                unreadCount: list.filter((n) => !n.read).length,
                loading: false,
            });
        } catch (err) {
            console.error("❌ Error al obtener notificaciones:", err);
            set({
                error: err?.message || "Error al conectar con el servidor",
                loading: false,
            });
        }
    },

    // 🔹 Contar no leídas
    fetchUnreadCount: async () => {
        try {
            const data = await getUnreadCount();
            set({ unreadCount: data.count || 0 });
        } catch (err) {
            console.error("❌ Error al obtener conteo de no leídas:", err);
        }
    },

    // 🔹 Marcar una como leída
    markOneAsRead: async (id) => {
        try {
            await markAsRead(id);
            set((state) => {
                const updated = state.notifications.map((n) =>
                    n.id === id || n._id === id ? { ...n, read: true } : n
                );
                return {
                    notifications: updated,
                    unreadCount: updated.filter((n) => !n.read).length,
                };
            });
        } catch (err) {
            console.error(`❌ Error al marcar notificación ${id} como leída:`, err);
        }
    },

    // 🔹 Marcar todas como leídas
    markAllRead: async () => {
        try {
            await markAllAsRead();
            set((state) => ({
                notifications: state.notifications.map((n) => ({ ...n, read: true })),
                unreadCount: 0,
            }));
        } catch (err) {
            console.error("❌ Error al marcar todas las notificaciones:", err);
        }
    },

    // 🔹 Conectar al WebSocket del backend (con autenticación)
    connectSocket: async () => {
        const { socket } = get();

        // 🚫 Evita reconexión si ya existe y sigue vivo
        if (socket && socket.connected) {
            console.log("⚠️ Socket ya activo, evitando reconexión");
            return;
        }

        // 🕓 Bloquea reconexiones simultáneas
        if (get()._connecting) {
            console.log("⏳ Esperando conexión WebSocket previa...");
            return;
        }

        set({ _connecting: true });

        try {
            const apiBase = process.env.VITE_API_URL || import.meta.env.VITE_API_URL;
            const socketURL = apiBase?.replace("/api", "") || "http://localhost:3000";

            console.log("🌐 Intentando conectar Socket.IO a:", socketURL);

            const token = await window.electronAPI.getToken();

            const socketInstance = io(socketURL, {
                transports: ["websocket"],
                auth: { token }, // ✅ enviar JWT al backend
                reconnection: true, // 🔄 Habilitar reconexión para pruebas
                reconnectionAttempts: 5,
            });

            socketInstance.on("connect", () => {
                console.log("📡 ✅ Socket conectado satisfactoriamente:", socketInstance.id);
                set({ _connecting: false });
            });

            socketInstance.on("connect_error", (err) => {
                console.error("❌ 🛑 Error de conexión Socket.IO:", err.message);
                set({ _connecting: false });
            });

            // 🧩 Escucha de nuevas notificaciones en tiempo real
            socketInstance.on("notification:new", async (notification) => {
                console.log("🔔 Nueva notificación:", notification);

                // ✅ Previene duplicados y recarga lista real
                await get().fetchNotifications();
            });

            socketInstance.on("disconnect", (reason) => {
                console.log("🔌 Socket desconectado del servidor:", reason);
            });

            set({ socket: socketInstance });
        } catch (err) {
            console.error("❌ Error al conectar con el WebSocket:", err);
            set({ _connecting: false });
        }
    },

    // 🔹 Desconectar socket manualmente
    disconnectSocket: () => {
        const { socket } = get();
        if (socket) {
            socket.disconnect();
            console.log("🧹 Socket cerrado manualmente");
        }
        set({ socket: null });
    },

    // 🔹 Limpiar store
    clear: () =>
        set({
            notifications: [],
            unreadCount: 0,
            loading: false,
            error: null,
            socket: null,
        }),
}));
