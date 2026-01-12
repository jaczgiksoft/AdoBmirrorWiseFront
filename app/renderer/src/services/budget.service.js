import api from "./api";

/**
 * 💰 Obtener presupuestos de un paciente
 */
export async function getBudgets(patientId) {
    try {
        const res = await api.get(`/budgets/patient/${patientId}`);
        return res.data;
    } catch (err) {
        console.error("❌ Error al obtener presupuestos:", err);
        throw err.response?.data || err;
    }
}

/**
 * 📝 Crear nuevo presupuesto
 */
export async function createBudget(data) {
    try {
        const res = await api.post("/budgets", data);
        return res.data;
    } catch (err) {
        console.error("❌ Error al crear presupuesto:", err);
        throw err.response?.data || err;
    }
}

/**
 * 🔄 Actualizar presupuesto existente
 */
export async function updateBudget(id, data) {
    try {
        const res = await api.put(`/budgets/${id}`, data);
        return res.data;
    } catch (err) {
        console.error("❌ Error al actualizar presupuesto:", err);
        throw err.response?.data || err;
    }
}

/**
 * 🗑️ Eliminar presupuesto
 */
export async function deleteBudget(id) {
    try {
        const res = await api.delete(`/budgets/${id}`);
        return res.data;
    } catch (err) {
        console.error("❌ Error al eliminar presupuesto:", err);
        throw err.response?.data || err;
    }
}
