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
