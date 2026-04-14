// src/services/referral.service.js
import api from "./api";

/**
 * 📋 Obtener todos los referidores del tenant actual
 */
export async function getReferrals() {
    try {
        const res = await api.get("/referrals");
        return res.data;
    } catch (err) {
        console.error("❌ Error al obtener referidores:", err);
        throw err.response?.data || err;
    }
}

/**
 * 🔍 Obtener un referidor por ID
 */
export async function getReferralById(id) {
    try {
        const res = await api.get(`/referrals/${id}`);
        return res.data;
    } catch (err) {
        console.error("❌ Error al obtener referidor:", err);
        throw err.response?.data || err;
    }
}

/**
 * 🟢 Crear un nuevo referidor
 */
export async function createReferral(data) {
    try {
        const res = await api.post("/referrals", data);
        return res.data;
    } catch (err) {
        console.error("❌ Error al crear referidor:", err);
        throw err.response?.data || err;
    }
}

/**
 * 🟡 Actualizar un referidor existente
 */
export async function updateReferral(id, data) {
    try {
        const res = await api.put(`/referrals/${id}`, data);
        return res.data;
    } catch (err) {
        console.error("❌ Error al actualizar referidor:", err);
        throw err.response?.data || err;
    }
}

/**
 * 🔴 Eliminar un referidor (lógico si el backend lo soporta, físico según repo)
 */
export async function deleteReferral(id) {
    try {
        const res = await api.delete(`/referrals/${id}`);
        return res.data;
    } catch (err) {
        console.error("❌ Error al eliminar referidor:", err);
        throw err.response?.data || err;
    }
}
