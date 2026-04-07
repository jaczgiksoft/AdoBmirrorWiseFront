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
