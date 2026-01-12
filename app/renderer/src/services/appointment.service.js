import api from "./api";

/**
 * 🧾 Obtener todas las citas del tenant actual (con filtros opcionales)
 */
export async function getAppointments(params = {}) {
    try {
        const res = await api.get("/appointments", { params });
        return res.data;
    } catch (err) {
        console.error("❌ Error al obtener citas:", err);
        throw err.response?.data || err;
    }
}

/**
 * 📊 Obtener citas paginadas (para DataTable)
 */
export async function getAppointmentsPaginated({
    start = 0,
    length = 20,
    searchValue = "",
    orderColumn = "date",
    orderDir = "DESC",
    // Filtros adicionales si se necesitan
} = {}) {
    try {
        const res = await api.post("/appointments/datatable", {
            start,
            length,
            searchValue,
            orderColumn,
            orderDir,
        });

        return res.data;
    } catch (err) {
        console.error("❌ Error al obtener citas (datatable):", err);
        throw err.response?.data || err;
    }
}

/**
 * 🔍 Obtener una cita por ID
 */
export async function getAppointmentById(id) {
    try {
        const res = await api.get(`/appointments/${id}`);
        return res.data;
    } catch (err) {
        console.error("❌ Error al obtener cita:", err);
        throw err.response?.data || err;
    }
}

/**
 * 🟢 Crear nueva cita
 */
export async function createAppointment(payload) {
    try {
        const res = await api.post("/appointments", payload);
        return res.data;
    } catch (err) {
        console.error("❌ Error al crear cita:", err);
        throw err.response?.data || err;
    }
}

/**
 * 🟡 Actualizar cita existente
 */
export async function updateAppointment(id, data) {
    try {
        const res = await api.put(`/appointments/${id}`, data);
        return res.data;
    } catch (err) {
        console.error("❌ Error al actualizar cita:", err);
        throw err.response?.data || err;
    }
}

/**
 * 🔴 Eliminar cita (soft delete)
 */
export async function deleteAppointment(id) {
    try {
        const res = await api.delete(`/appointments/${id}`);
        return res.data;
    } catch (err) {
        console.error("❌ Error al eliminar cita:", err);
        throw err.response?.data || err;
    }
}
