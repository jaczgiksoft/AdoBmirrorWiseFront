import { create } from "zustand";
import { getUserChats, getChatHistory, sendMessage, markAsRead, createGroup } from "@/services/chat.service";
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

    // ✉️ Enviar mensaje (soporta receiver_id o chat_id)
    sendChatMessage: async (payload) => {
        try {
            const res = await sendMessage(payload);
            const newMessage = res.data;

            // Si es un chat nuevo o ya estamos en él, actualizamos localmente
            set((state) => {
                // Evitar duplicados si el socket ya lo agregó
                const exists = state.history.some(m => String(m.id) === String(newMessage.id));
                if (exists) return state;

                return {
                    history: [...state.history, newMessage]
                };
            });

            // Recargar chats para ver el último mensaje en la lista
            get().fetchChats();
            return newMessage;
        } catch (err) {
            console.error("Error sending message:", err);
            throw err;
        }
    },

    // 👥 Crear un grupo de chat
    createGroupChat: async (payload) => {
        try {
            await createGroup(payload);
            get().fetchChats();
        } catch (err) {
            console.error("Error creating group:", err);
            throw err;
        }
    },

    // 🔌 Configurar listeners de Socket.io
    setupSocketListeners: (socket) => {
        if (!socket) {
            console.warn("⚠️ [Chat] Socket no disponible al intentar registrar listeners.");
            return;
        }

        if (!socket.connected) {
            console.warn("⚠️ [Chat] El socket existe pero NO está conectado aún. ID:", socket.id);
        } else {
            console.log("🔌 [Chat] Socket conectado y listeners registrados. ID:", socket.id);
        }

        // ✅ Usar handlers nombrados para no eliminar listeners de otros stores
        const onNewMessage = (data) => {
            const { chatId, message } = data;
            console.log("💬 [Chat] Mensaje recibido por socket:", data);

            if (get().selectedChatId === chatId) {
                set((state) => {
                    // Evitar duplicados (por si ya se agregó vía API)
                    const exists = state.history.some(m => String(m.id) === String(message.id));
                    if (exists) return state;

                    return {
                        history: [...state.history, message]
                    };
                });
                markAsRead(chatId);
            }

            get().fetchChats();
        };

        const onNotification = (data) => {
            console.log("🔔 [Chat] Notificación de chat recibida:", data);
            get().fetchChats();
        };

        const onMessagesSeen = (data) => {
            const { chatId, readBy, readAt } = data;
            console.log("👁️ [Chat] Mensajes vistos:", data);

            if (get().selectedChatId === chatId) {
                set((state) => ({
                    history: state.history.map(msg => {
                        // Si el mensaje NO fue enviado por la persona que lo leyó
                        if (msg.sender_id !== readBy) {
                            const hasRead = msg.reads?.some(r => r.user_id === readBy);
                            if (!hasRead) {
                                return {
                                    ...msg,
                                    reads: [...(msg.reads || []), { user_id: readBy, read_at: readAt }]
                                };
                            }
                        }
                        return msg;
                    })
                }));
            }
            get().fetchChats();
        };

        // Limpiar SOLO los listeners propios del chat antes de volver a registrar
        socket.off("chat:new_message", onNewMessage);
        socket.off("chat:notification", onNotification);
        socket.off("messages_seen", onMessagesSeen);

        socket.on("chat:new_message", onNewMessage);
        socket.on("chat:notification", onNotification);
        socket.on("messages_seen", onMessagesSeen);
    },

    // 🧹 Limpiar chat seleccionado
    clearSelectedChat: () => set({ selectedChatId: null, history: [] }),
}));
