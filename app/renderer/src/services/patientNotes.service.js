import api from "./api";

/**
 * 📋 Obtener todas las notas de un paciente
 */
export async function getNotesByPatientId(patientId) {
    try {
        const res = await api.get(`/patient-notes/patient/${patientId}`);
        console.log("datos", res.data);
        return res.data;
    } catch (err) {
        console.error("❌ Error al obtener notas:", err);
        throw err.response?.data || err;
    }
}

/**
 * 🟢 Crear nueva nota
 */
export async function createNote(data) {
    try {
        const res = await api.post("/patient-notes", data);
        return res.data;
    } catch (err) {
        console.error("❌ Error al crear nota:", err);
        throw err.response?.data || err;
    }
}

/**
 * 🟡 Actualizar nota
 */
export async function updateNote(id, data) {
    try {
        const res = await api.put(`/patient-notes/${id}`, data);
        return res.data;
    } catch (err) {
        console.error("❌ Error al actualizar nota:", err);
        throw err.response?.data || err;
    }
}

/**
 * 🔴 Eliminar nota
 */
export async function deleteNote(id) {
    try {
        const res = await api.delete(`/patient-notes/${id}`);
        return res.data;
    } catch (err) {
        console.error("❌ Error al eliminar nota:", err);
        throw err.response?.data || err;
    }
}
