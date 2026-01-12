import api from "./api";

/**
 * 📚 Obtener catálogo de tratamientos
 */
export async function getTreatmentCatalogs() {
    try {
        const res = await api.get("/treatment-catalogs");
        return res.data;
    } catch (err) {
        console.error("❌ Error al obtener catálogo:", err);
        throw err.response?.data || err;
    }
}

/**
 * 📋 Obtener planes de un paciente
 */
export async function getTreatmentPlans(patientId) {
    try {
        const res = await api.get(`/treatment-plans/patient/${patientId}`);
        return res.data;
    } catch (err) {
        console.error("❌ Error al obtener planes:", err);
        throw err.response?.data || err;
    }
}

/**
 * 🟢 Crear nuevo plan (con items)
 */
export async function createTreatmentPlan(data) {
    try {
        const res = await api.post("/treatment-plans", data);
        return res.data;
    } catch (err) {
        console.error("❌ Error al crear plan:", err);
        throw err.response?.data || err;
    }
}

/**
 * 🔴 Eliminar plan confirmadamente
 */
export async function deleteTreatmentPlan(id) {
    try {
        const res = await api.delete(`/treatment-plans/${id}`);
        return res.data;
    } catch (err) {
        console.error("❌ Error al eliminar plan:", err);
        throw err.response?.data || err;
    }
}
