import api from "./api";

/**
 * 👤 Crear un nuevo representante y vincularlo a un paciente
 */
export async function createRepresentative(payload) {
    try {
        const res = await api.post("/patient-representatives", payload);
        return res.data;
    } catch (err) {
        console.error("❌ Error al crear representante:", err);
        throw err.response?.data || err;
    }
}

/**
 * 🟡 Actualizar un representante existente
 */
export async function updateRepresentative(id, payload) {
    try {
        const res = await api.put(`/patient-representatives/${id}`, payload);
        return res.data;
    } catch (err) {
        console.error("❌ Error al actualizar representante:", err);
        throw err.response?.data || err;
    }
}

/**
 * 🔴 Eliminar un representante (soft delete)
 */
export async function deleteRepresentative(id) {
    try {
        const res = await api.delete(`/patient-representatives/${id}`);
        return res.data;
    } catch (err) {
        console.error("❌ Error al eliminar representante:", err);
        throw err.response?.data || err;
    }
}

/**
 * 📋 Obtener todos los representantes (opcional, por si se ocupa lista general)
 */
export async function getRepresentatives() {
    try {
        const res = await api.get("/patient-representatives");
        return res.data;
    } catch (err) {
        console.error("❌ Error al obtener representantes:", err);
        throw err.response?.data || err;
    }
}
