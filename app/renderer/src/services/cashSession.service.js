// src/services/cashSession.service.js
import api from "./api";

/**
 * 🟢 Abrir una nueva sesión de caja
 * @param {Object} data
 * {
 *   tenant_id, store_id, cash_register_id, user_id,
 *   opening_balance, notes?
 * }
 */
export async function openCashSession(data) {
    try {
        const res = await api.post("/cash-sessions", data);
        return res.data;
    } catch (err) {
        console.error("❌ Error al abrir sesión de caja:", err);
        throw err.response?.data || err;
    }
}

/**
 * 🔴 Cerrar una sesión de caja existente
 * @param {Number} id
 * @param {Object} data { closing_balance, notes }
 */
export async function closeCashSession(id, data) {
    try {
        const res = await api.put(`/cash-sessions/${id}/close`, data);
        return res.data;
    } catch (err) {
        console.error("❌ Error al cerrar sesión de caja:", err);
        throw err.response?.data || err;
    }
}

/**
 * 📊 Obtener listado paginado (para reportes)
 */
export async function getCashSessionsPaginated(params) {
    try {
        const res = await api.post("/cash-sessions/datatable", params);
        return res.data;
    } catch (err) {
        console.error("❌ Error al obtener sesiones de caja:", err);
        throw err.response?.data || err;
    }
}
