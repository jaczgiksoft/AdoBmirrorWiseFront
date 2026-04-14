import api from "./api";

/**
 * 🧾 Listar todos los tipos de pacientes
 */
export async function getAllPatientTypes() {
    try {
        const res = await api.get("/patient-types");
        return res.data;
    } catch (err) {
        console.error("❌ Error al obtener tipos de pacientes:", err);
        throw err.response?.data || err;
    }
}

/**
 * 🔍 Obtener un tipo de paciente por ID
 */
export async function getPatientTypeById(id) {
    try {
        const res = await api.get(`/patient-types/${id}`);
        return res.data;
    } catch (err) {
        console.error("❌ Error al obtener tipo de paciente:", err);
        throw err.response?.data || err;
    }
}

/**
 * 🟢 Crear nuevo tipo de paciente
 */
export async function createPatientType(payload) {
    try {
        const res = await api.post("/patient-types", payload);
        return res.data;
    } catch (err) {
        console.error("❌ Error al crear tipo de paciente:", err);
        throw err.response?.data || err;
    }
}

/**
 * 🟡 Actualizar un tipo de paciente existente
 */
export async function updatePatientType(id, payload) {
    try {
        const res = await api.put(`/patient-types/${id}`, payload);
        return res.data;
    } catch (err) {
        console.error("❌ Error al actualizar tipo de paciente:", err);
        throw err.response?.data || err;
    }
}

/**
 * 🔴 Eliminar un tipo de paciente (hard delete por ahora)
 */
export async function deletePatientType(id) {
    try {
        const res = await api.delete(`/patient-types/${id}`);
        return res.data;
    } catch (err) {
        console.error("❌ Error al eliminar tipo de paciente:", err);
        throw err.response?.data || err;
    }
}
