import { create } from "zustand";
import { getUserChats, getChatHistory, sendMessage, markAsRead } from "@/services/chat.service";
import { getEmployees } from "@/services/employee.service";

export const useChatStore = create((set, get) => ({
    chats: [],
    employees: [],
    selectedChatId: null,
    history: [],
    loading: false,
    historyLoading: false,
    unreadTotal: 0,

    // 🧩 Cargar chats activos
    fetchChats: async () => {
        try {
            set({ loading: true });
            const data = await getUserChats();
            set({
                chats: data,
                unreadTotal: data.reduce((acc, chat) => acc + (chat.unreadCount || 0), 0),
                loading: false
            });
        } catch (err) {
            console.error("Error fetching chats:", err);
            set({ loading: false });
        }
    },

    // 👥 Cargar todos los empleados (para iniciar nuevos chats)
    fetchEmployees: async () => {
        try {
            const data = await getEmployees();
            set({ employees: data });
        } catch (err) {
            console.error("Error fetching employees:", err);
        }
    },

    // 📜 Cargar historial de un chat
    fetchHistory: async (chatId) => {
        try {
            set({ historyLoading: true, selectedChatId: chatId });
            const data = await getChatHistory(chatId);
            set({ history: data.reverse(), historyLoading: false }); // Invertimos para que el más nuevo esté al final

            // Marcar como leído al abrir
            await markAsRead(chatId);
            get().fetchChats(); // Recargar para actualizar contadores
        } catch (err) {
            console.error("Error fetching history:", err);
            set({ historyLoading: false });
        }
    },

    // ✉️ Enviar mensaje
    sendChatMessage: async (receiverId, message) => {
        try {
            const res = await sendMessage({ receiver_id: receiverId, message });
            const newMessage = res.data;

            // Si es un chat nuevo o ya estamos en él, actualizamos localmente
            set((state) => ({
                history: [...state.history, newMessage]
            }));

            // Recargar chats para ver el último mensaje en la lista
            get().fetchChats();
            return newMessage;
        } catch (err) {
            console.error("Error sending message:", err);
            throw err;
        }
    },

    // 🔌 Configurar listeners de Socket.io
    setupSocketListeners: (socket) => {
        if (!socket || !socket.connected) {
            console.warn("⚠️ El socket no está conectado. No se pueden activar los listeners del chat.");
            return;
        }

        console.log("🔌 Configurando listeners de Chat en Socket:", socket.id);

        // Limpiar para evitar duplicidad
        socket.off("chat:new_message");
        socket.off("chat:notification");

        socket.on("chat:new_message", (data) => {
            console.log("📩 Nuevo mensaje recibido:", data);
            const { chatId, message } = data;
            
            if (get().selectedChatId === chatId) {
                set((state) => ({
                    history: [...state.history, message]
                }));
                markAsRead(chatId);
            }
            get().fetchChats();
        });

        socket.on("chat:notification", (data) => {
            console.log("🔔 Notificación de chat:", data);
            get().fetchChats();
        });
    },

    removeSocketListeners: (socket) => {
        if (!socket) return;
        console.log("🧹 Limpiando listeners de Chat");
        socket.off("chat:new_message");
        socket.off("chat:notification");
    },

    // 🧹 Limpiar chat seleccionado
    clearSelectedChat: () => set({ selectedChatId: null, history: [] }),
}));
