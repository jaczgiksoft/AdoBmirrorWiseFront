import api from "./api";

/**
 * Obtener todos los servicios (sin paginación)
 */
export async function getAll() {
    try {
        const res = await api.get("/services");
        return res.data;
    } catch (err) {
        console.error("❌ Error al obtener servicios:", err);
        throw err.response?.data || err;
    }
}

/**
 * Obtener servicios paginados (para la tabla)
 */
/**
 * 📊 Obtener servicios paginados (para DataTable)
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
        const columns = [null, 'name', 'duration_minutes', 'price'];
        let colIndex = columns.indexOf(orderColumn);
        if (colIndex === -1) colIndex = 1; // Default: name

        const res = await api.post("/services/datatable", {
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
        console.error("❌ Error al obtener servicios (datatable):", err);
        throw err.response?.data || err;
    }
}

/**
 * Obtener un servicio por ID
 */
export async function getById(id) {
    try {
        const res = await api.get(`/services/${id}`);
        return res.data;
    } catch (err) {
        console.error("❌ Error al obtener servicio:", err);
        throw err.response?.data || err;
    }
}

/**
 * Crear nuevo servicio
 */
export async function create(data) {
    try {
        const res = await api.post("/services", data);
        return res.data;
    } catch (err) {
        console.error("❌ Error al crear servicio:", err);
        throw err.response?.data || err;
    }
}

/**
 * Actualizar servicio existente
 */
export async function update(id, data) {
    try {
        const res = await api.put(`/services/${id}`, data);
        return res.data;
    } catch (err) {
        console.error("❌ Error al actualizar servicio:", err);
        throw err.response?.data || err;
    }
}

/**
 * Eliminar servicio
 */
export async function remove(id) {
    try {
        const res = await api.delete(`/services/${id}`);
        return res.data;
    } catch (err) {
        console.error("❌ Error al eliminar servicio:", err);
        throw err.response?.data || err;
    }
}
