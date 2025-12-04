import api from "./api";

/**
 * 📋 Obtener todos los pasatiempos de un paciente
 */
export async function getHobbiesByPatient(patientId) {
    try {
        const res = await api.get(`/patient-hobbies/patient/${patientId}`);
        return res.data;
    } catch (err) {
        console.error("❌ Error al obtener pasatiempos:", err);
        throw err.response?.data || err;
    }
}

/**
 * 🟢 Crear nuevo pasatiempo
 */
export async function createHobby(patientId, data) {
    try {
        const payload = {
            patient_id: patientId,
            ...data
        };
        const res = await api.post("/patient-hobbies", payload);
        return res.data;
    } catch (err) {
        console.error("❌ Error al crear pasatiempo:", err);
        throw err.response?.data || err;
    }
}

/**
 * 🟡 Actualizar pasatiempo
 */
export async function updateHobby(id, data) {
    try {
        const res = await api.put(`/patient-hobbies/${id}`, data);
        return res.data;
    } catch (err) {
        console.error("❌ Error al actualizar pasatiempo:", err);
        throw err.response?.data || err;
    }
}

/**
 * 🔴 Eliminar pasatiempo
 */
export async function deleteHobby(id) {
    try {
        const res = await api.delete(`/patient-hobbies/${id}`);
        return res.data;
    } catch (err) {
        console.error("❌ Error al eliminar pasatiempo:", err);
        throw err.response?.data || err;
    }
}
