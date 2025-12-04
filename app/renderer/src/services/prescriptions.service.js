import api from "./api";

/**
 * 📋 Obtener todas las prescripciones de un paciente
 */
export async function getPrescriptionsByPatient(patientId) {
    try {
        const res = await api.get(`/patient-prescriptions/patient/${patientId}`);
        return res.data;
    } catch (err) {
        console.error("❌ Error al obtener prescripciones:", err);
        throw err.response?.data || err;
    }
}

/**
 * 🟢 Crear nueva prescripción
 */
export async function createPrescription(patientId, data) {
    try {
        const payload = {
            patient_id: patientId,
            ...data
        };
        const res = await api.post("/patient-prescriptions", payload);
        return res.data;
    } catch (err) {
        console.error("❌ Error al crear prescripción:", err);
        throw err.response?.data || err;
    }
}

/**
 * 🟡 Actualizar prescripción
 */
export async function updatePrescription(id, data) {
    try {
        const res = await api.put(`/patient-prescriptions/${id}`, data);
        return res.data;
    } catch (err) {
        console.error("❌ Error al actualizar prescripción:", err);
        throw err.response?.data || err;
    }
}

/**
 * 🔴 Eliminar prescripción
 */
export async function deletePrescription(id) {
    try {
        const res = await api.delete(`/patient-prescriptions/${id}`);
        return res.data;
    } catch (err) {
        console.error("❌ Error al eliminar prescripción:", err);
        throw err.response?.data || err;
    }
}
