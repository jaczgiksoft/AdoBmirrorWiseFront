// src/services/patient.service.js
import api from "./api";

/**
 * 🧾 Obtener todos los pacientes del tenant actual
 */
export async function getPatients() {
    try {
        const res = await api.get("/patients");
        return res.data;
    } catch (err) {
        console.error("❌ Error al obtener pacientes:", err);
        throw err.response?.data || err;
    }
}

/**
 * 📊 Obtener pacientes paginados (para DataTable)
 */
export async function getPatientsPaginated({
                                               start = 0,
                                               length = 20,
                                               searchValue = "",
                                               orderColumn = "last_name",
                                               orderDir = "ASC",
                                               gender = "",
                                               city = "",
                                               state = "",
                                               statusFilter = "",
                                           } = {}) {
    try {
        const res = await api.post("/patients/datatable", {
            start,
            length,
            searchValue,
            orderColumn,
            orderDir,
            gender,        // Filtro adicional posible
            city,
            state,
            statusFilter,  // Ej. activo/inactivo
        });

        return res.data;
    } catch (err) {
        console.error("❌ Error al obtener pacientes (datatable):", err);
        throw err.response?.data || err;
    }
}

/**
 * 🔍 Obtener un paciente por ID
 */
export async function getPatientById(id) {
    try {
        const res = await api.get(`/patients/${id}`);
        return res.data;
    } catch (err) {
        console.error("❌ Error al obtener paciente:", err);
        throw err.response?.data || err;
    }
}

/**
 * 🟢 Crear nuevo paciente
 */
export async function createPatient(data) {
    try {
        const res = await api.post("/patients", data);
        return res.data;
    } catch (err) {
        console.error("❌ Error al crear paciente:", err);
        throw err.response?.data || err;
    }
}

/**
 * 🟡 Actualizar paciente existente
 */
export async function updatePatient(id, data) {
    try {
        const res = await api.put(`/patients/${id}`, data);
        return res.data;
    } catch (err) {
        console.error("❌ Error al actualizar paciente:", err);
        throw err.response?.data || err;
    }
}

/**
 * 🔴 Eliminar paciente (soft delete)
 */
export async function deletePatient(id) {
    try {
        const res = await api.delete(`/patients/${id}`);
        return res.data;
    } catch (err) {
        console.error("❌ Error al eliminar paciente:", err);
        throw err.response?.data || err;
    }
}

/**
 * ⚙️ Obtener perfil completo del paciente (expediente clínico)
 */
export async function getPatientProfile(id) {
    try {
        const res = await api.get(`/patients/profile/${id}`);
        return res.data;
    } catch (err) {
        console.error("❌ Error al obtener perfil del paciente:", err);
        throw err.response?.data || err;
    }
}
