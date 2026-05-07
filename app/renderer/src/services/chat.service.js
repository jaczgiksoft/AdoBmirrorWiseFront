import api from "./api";

/**
 * Obtener lista de chats del usuario con el último mensaje
 * Endpoint: /chats
 */
export async function getUserChats() {
    try {
        const res = await api.get("/chats");
        return res.data;
    } catch (err) {
        console.error("❌ Error al obtener chats:", err);
        throw err.response?.data || err;
    }
}

/**
 * Obtener historial de mensajes de un chat
 * Endpoint: /chats/:id/history
 */
export async function getChatHistory(chatId, params = { start: 0, length: 50 }) {
    try {
        const res = await api.get(`/chats/${chatId}/history`, { params });
        return res.data;
    } catch (err) {
        console.error(`❌ Error al obtener historial del chat ${chatId}:`, err);
        throw err.response?.data || err;
    }
}

/**
 * Enviar un mensaje (Crea el chat si no existe)
 * Endpoint: /chats/send
 * @param {Object} payload { receiver_id, message }
 */
export async function sendMessage(payload) {
    try {
        const res = await api.post("/chats/send", payload);
        return res.data;
    } catch (err) {
        console.error("❌ Error al enviar mensaje:", err);
        throw err.response?.data || err;
    }
}

/**
 * Marcar mensajes como leídos
 * Endpoint: /chats/:id/read
 */
export async function markAsRead(chatId) {
    try {
        const res = await api.put(`/chats/${chatId}/read`);
        return res.data;
    } catch (err) {
        console.error(`❌ Error al marcar chat ${chatId} como leído:`, err);
        throw err.response?.data || err;
    }
}
