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
        if (!socket) return;

        // Limpiar previos si los hay (opcional)
        socket.off("chat:new_message");
        socket.off("chat:notification");

        // Nuevo mensaje en un chat
        socket.on("chat:new_message", (data) => {
            const { chatId, message } = data;
            
            // Si el mensaje es para el chat que tengo abierto, lo agrego al historial
            if (get().selectedChatId === chatId) {
                set((state) => ({
                    history: [...state.history, message]
                }));
                // Marcar como leído automáticamente si está abierto
                markAsRead(chatId);
            }

            // Recargar lista de chats para actualizar último mensaje y unread counts
            get().fetchChats();
        });

        // Notificación de chat (si no estamos en ese chat específicamente)
        socket.on("chat:notification", (data) => {
            // Esto se puede usar para mostrar un toast o similar si se desea
            console.log("Chat Notification:", data);
            get().fetchChats();
        });
    },

    // 🧹 Limpiar chat seleccionado
    clearSelectedChat: () => set({ selectedChatId: null, history: [] }),
}));
