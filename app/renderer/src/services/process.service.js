import api from "./api";

/**
 * Obtener todos los procesos (resumen)
 */
export async function getAllProcesses() {
    try {
        const res = await api.get("/processes");
        return res.data;
    } catch (err) {
        console.error("❌ Error al obtener procesos:", err);
        throw err.response?.data || err;
    }
}

/**
 * Obtener un proceso por ID (incluye pasos y overrides)
 */
export async function getProcessById(id) {
    try {
        const res = await api.get(`/processes/${id}`);
        return res.data;
    } catch (err) {
        console.error("❌ Error al obtener proceso:", err);
        throw err.response?.data || err;
    }
}

/**
 * Crear nuevo proceso
 */
export async function createProcess(data) {
    try {
        const res = await api.post("/processes", data);
        return res.data.process;
    } catch (err) {
        console.error("❌ Error al crear proceso:", err);
        throw err.response?.data || err;
    }
}

/**
 * Actualizar proceso (nombre, descripción, y pasos)
 */
export async function updateProcess(id, data) {
    try {
        const res = await api.put(`/processes/${id}`, data);
        return res.data.process;
    } catch (err) {
        console.error("❌ Error al actualizar proceso:", err);
        throw err.response?.data || err;
    }
}

/**
 * Eliminar proceso (soft delete)
 */
export async function deleteProcess(id) {
    try {
        const res = await api.delete(`/processes/${id}`);
        return res.data;
    } catch (err) {
        console.error("❌ Error al eliminar proceso:", err);
        throw err.response?.data || err;
    }
}
