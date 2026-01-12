import api from "./api";

/**
 * Obtener todos los pasos disponibles
 */
export async function getAllSteps() {
    try {
        const res = await api.get("/steps");
        return res.data;
    } catch (err) {
        console.error("❌ Error al obtener pasos:", err);
        throw err.response?.data || err;
    }
}

/**
 * Crear nuevo paso
 */
export async function createStep(data) {
    try {
        const res = await api.post("/steps", data);
        return res.data.step;
    } catch (err) {
        console.error("❌ Error al crear paso:", err);
        throw err.response?.data || err;
    }
}

/**
 * Actualizar paso
 */
export async function updateStep(id, data) {
    try {
        const res = await api.put(`/steps/${id}`, data);
        return res.data.step;
    } catch (err) {
        console.error("❌ Error al actualizar paso:", err);
        throw err.response?.data || err;
    }
}

/**
 * Eliminar paso (soft delete)
 */
export async function deleteStep(id) {
    try {
        const res = await api.delete(`/steps/${id}`);
        return res.data;
    } catch (err) {
        console.error("❌ Error al eliminar paso:", err);
        throw err.response?.data || err;
    }
}
