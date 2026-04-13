// app/renderer/src/services/position.service.js
import api from "./api";

/**
 * Obtener todos los puestos del tenant actual
 */
export async function getPositions() {
    try {
        const res = await api.get("/positions");
        return res.data.map(pos => ({
            ...pos,
            isAppointmentEligible: !!pos.is_appointment_eligible
        }));
    } catch (err) {
        console.error("❌ Error al obtener puestos:", err);
        throw err.response?.data || err;
    }
}

/**
 * Obtener un puesto específico
 */
export async function getPositionById(id) {
    try {
        const res = await api.get(`/positions/${id}`);
        const pos = res.data;
        return {
            ...pos,
            isAppointmentEligible: !!pos.is_appointment_eligible
        };
    } catch (err) {
        console.error("❌ Error al obtener puesto:", err);
        throw err.response?.data || err;
    }
}

/**
 * Crear nuevo puesto
 * @param {Object} data { name, description, color, isAppointmentEligible }
 */
export async function createPosition(data) {
    try {
        const res = await api.post("/positions", data);
        const pos = res.data;
        return {
            ...pos,
            isAppointmentEligible: !!pos.is_appointment_eligible
        };
    } catch (err) {
        console.error("❌ Error al crear puesto:", err);
        throw err.response?.data || err;
    }
}

/**
 * Actualizar puesto existente
 * @param {string|number} id
 * @param {Object} data { name, description, color, isAppointmentEligible }
 */
export async function updatePosition(id, data) {
    try {
        const res = await api.put(`/positions/${id}`, data);
        const pos = res.data;
        return {
            ...pos,
            isAppointmentEligible: !!pos.is_appointment_eligible
        };
    } catch (err) {
        console.error("❌ Error al actualizar puesto:", err);
        throw err.response?.data || err;
    }
}

/**
 * Eliminar (soft delete) un puesto
 */
export async function deletePosition(id) {
    try {
        const res = await api.delete(`/positions/${id}`);
        return res.data;
    } catch (err) {
        console.error("❌ Error al eliminar puesto:", err);
        throw err.response?.data || err;
    }
}
