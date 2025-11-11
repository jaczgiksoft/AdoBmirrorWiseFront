// src/services/notification.service.js
import api from "./api";

/**
 * 🧩 Servicio de notificaciones del usuario
 * Conecta el renderer con las rutas del backend:
 *    GET    /notifications
 *    GET    /notifications/unread-count
 *    PUT    /notifications/:id/read
 *    PUT    /notifications/read-all
 */

/**
 * 🔹 Obtener todas las notificaciones del usuario actual
 * @param {Object} [options]
 * @param {number} [options.limit] - Límite opcional de resultados
 * @param {string} [options.type] - Filtro opcional por tipo ('system' | 'admin')
 * @returns {Promise<Array>}
 */
export async function getUserNotifications(options = {}) {
    try {
        const params = {};
        if (options.limit) params.limit = options.limit;
        if (options.type) params.type = options.type;

        const res = await api.get("/notifications", { params });
        return res.data?.notifications || res.data || [];
    } catch (err) {
        console.error("❌ Error al obtener notificaciones:", err);
        throw err.response?.data || err;
    }
}

/**
 * 🔹 Obtener cantidad de notificaciones no leídas
 * @returns {Promise<number>}
 */
export async function getUnreadCount() {
    try {
        const res = await api.get("/notifications/unread-count");
        return res.data?.count ?? 0;
    } catch (err) {
        console.error("❌ Error al obtener conteo de no leídas:", err);
        throw err.response?.data || err;
    }
}

/**
 * 🔹 Marcar una notificación como leída
 * @param {string} id - ID de la notificación
 * @returns {Promise<boolean>}
 */
export async function markAsRead(id) {
    try {
        const res = await api.put(`/notifications/${id}/read`);
        return res.data?.success ?? true;
    } catch (err) {
        console.error(`❌ Error al marcar notificación ${id} como leída:`, err);
        throw err.response?.data || err;
    }
}

/**
 * 🔹 Marcar todas las notificaciones como leídas
 * @returns {Promise<boolean>}
 */
export async function markAllAsRead() {
    try {
        const res = await api.put("/notifications/read-all");
        return res.data?.success ?? true;
    } catch (err) {
        console.error("❌ Error al marcar todas las notificaciones como leídas:", err);
        throw err.response?.data || err;
    }
}
