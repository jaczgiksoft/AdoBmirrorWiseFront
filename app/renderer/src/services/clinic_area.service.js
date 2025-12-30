import api from "./api";

/**
 * Obtener todas las áreas clínicas (sin paginación)
 */
export async function getAll() {
    try {
        const res = await api.get("/clinic-areas");
        return res.data;
    } catch (err) {
        console.error("❌ Error al obtener áreas clínicas:", err);
        throw err.response?.data || err;
    }
}

/**
 * 📊 Obtener áreas clínicas paginados (para DataTable)
 */
export async function getDatatable({
    start = 0,
    length = 20,
    searchValue = "",
    orderColumn = "name",
    orderDir = "ASC",
    statusFilter = "",
} = {}) {
    try {
        // Mapeo de columnas para DataTables
        const columns = [null, 'name', 'status'];
        let colIndex = columns.indexOf(orderColumn);
        if (colIndex === -1) colIndex = 1; // Default: name

        const res = await api.post("/clinic-areas/datatable", {
            start,
            length,
            search: {
                value: searchValue,
                regex: false
            },
            order: [
                {
                    column: colIndex,
                    dir: orderDir
                }
            ],
            statusFilter
        });
        return res.data;
    } catch (err) {
        console.error("❌ Error al obtener áreas clínicas (datatable):", err);
        throw err.response?.data || err;
    }
}

/**
 * Obtener un área clínica por ID
 */
export async function getById(id) {
    try {
        const res = await api.get(`/clinic-areas/${id}`);
        return res.data;
    } catch (err) {
        console.error("❌ Error al obtener área clínica:", err);
        throw err.response?.data || err;
    }
}

/**
 * Crear nueva área clínica
 */
export async function create(data) {
    try {
        const res = await api.post("/clinic-areas", data);
        return res.data;
    } catch (err) {
        console.error("❌ Error al crear área clínica:", err);
        throw err.response?.data || err;
    }
}

/**
 * Actualizar área clínica existente
 */
export async function update(id, data) {
    try {
        const res = await api.put(`/clinic-areas/${id}`, data);
        return res.data;
    } catch (err) {
        console.error("❌ Error al actualizar área clínica:", err);
        throw err.response?.data || err;
    }
}

/**
 * Eliminar área clínica
 */
export async function remove(id) {
    try {
        const res = await api.delete(`/clinic-areas/${id}`);
        return res.data;
    } catch (err) {
        console.error("❌ Error al eliminar área clínica:", err);
        throw err.response?.data || err;
    }
}
