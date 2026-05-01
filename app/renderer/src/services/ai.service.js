import api from "./api";

/**
 * AI Service - Maneja las comunicaciones con el Asistente IA de Bwise.
 */
const aiService = {
    /**
     * Envía una consulta al asistente de chat.
     * @param {string} message - El mensaje del usuario.
     * @param {Array} chatHistory - Historial de la conversación previa.
     * @returns {Promise<Object>} - La respuesta del asistente y el historial actualizado.
     */
    ask: async (message, chatHistory = []) => {
        try {
            const response = await api.post("/chat-assistant/ask", {
                message,
                chat_history: chatHistory,
            });

            if (response.data?.success) {
                return response.data.data;
            } else {
                throw new Error(response.data?.message || "Error en la respuesta de la IA");
            }
        } catch (error) {
            console.error("AI Service Error:", error);
            throw error;
        }
    },
};

export default aiService;
