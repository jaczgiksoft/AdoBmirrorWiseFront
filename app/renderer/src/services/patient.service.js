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
    orderColumn = "created_at",
    orderDir = "DESC",
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
export async function createPatient(payload) {
    try {
        const formData = new FormData();

        for (const key in payload) {
            const value = payload[key];

            // 🔹 ARCHIVO
            if (key === "photo_file" && value instanceof File) {
                formData.append("photo", value);
                continue;
            }

            // 🔹 FECHA — SIEMPRE YYYY-MM-DD
            if (key === "birth_date" && value) {
                const dateOnly = new Date(value).toISOString().split("T")[0];
                formData.append("birth_date", dateOnly);
                continue;
            }

            // 🔹 CAMPOS JSON
            if (
                key === "patient_type_ids" ||
                key === "alerts" ||
                key === "billing_data" ||
                key === "legal_representatives"
            ) {
                formData.append(key, JSON.stringify(value || []));
                continue;
            }

            // 🔹 NO ENVIAR photo_url VACÍA
            if (key === "photo_url") {
                continue;
            }

            // 🔹 VALORES NORMALES
            formData.append(key, value ?? "");
        }

        const res = await api.post("/patients", formData);
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

export async function getNextMedicalRecord() {
    return api.get("/patients/next-medical-record")
        .then(res => res.data);
}
