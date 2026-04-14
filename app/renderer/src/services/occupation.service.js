// src/services/occupation.service.js
import api from "./api";

/**
 * 📋 Obtener todas las ocupaciones del tenant actual
 */
export async function getOccupations() {
    try {
        const res = await api.get("/occupations");
        return res.data;
    } catch (err) {
        console.error("❌ Error al obtener ocupaciones:", err);
        throw err.response?.data || err;
    }
}

/**
 * 🔍 Obtener una ocupación por ID
 */
export async function getOccupationById(id) {
    try {
        const res = await api.get(`/occupations/${id}`);
        return res.data;
    } catch (err) {
        console.error("❌ Error al obtener ocupación:", err);
        throw err.response?.data || err;
    }
}

/**
 * 🟢 Crear una nueva ocupación
 */
export async function createOccupation(data) {
    try {
        const res = await api.post("/occupations", data);
        return res.data;
    } catch (err) {
        console.error("❌ Error al crear ocupación:", err);
        throw err.response?.data || err;
    }
}

/**
 * 🟡 Actualizar una ocupación existente
 */
export async function updateOccupation(id, data) {
    try {
        const res = await api.put(`/occupations/${id}`, data);
        return res.data;
    } catch (err) {
        console.error("❌ Error al actualizar ocupación:", err);
        throw err.response?.data || err;
    }
}

/**
 * 🔴 Eliminar una ocupación (Borrado lógico)
 */
export async function deleteOccupation(id) {
    try {
        const res = await api.delete(`/occupations/${id}`);
        return res.data;
    } catch (err) {
        console.error("❌ Error al eliminar ocupación:", err);
        throw err.response?.data || err;
    }
}
