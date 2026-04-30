import api from "./api";

/**
 * Obtener todos los tipos de elásticos
 */
export async function getAll() {
    try {
        const res = await api.get("/elastic-types");
        return res.data;
    } catch (err) {
        console.error("❌ Error al obtener tipos de elásticos:", err);
        throw err.response?.data || err;
    }
}

/**
 * 📊 Obtener tipos de elásticos paginados (para DataTable)
 */
export async function getDatatable({
    start = 0,
    length = 20,
    searchValue = "",
    orderColumn = "name",
    orderDir = "ASC",
} = {}) {
    try {
        const columns = [null, 'name', 'type', 'size', 'oz'];
        let colIndex = columns.indexOf(orderColumn);
        if (colIndex === -1) colIndex = 1;

        const res = await api.post("/elastic-types/datatable", {
            start,
            length,
            search: { value: searchValue },
            order: [{ column: colIndex, dir: orderDir }],
        });
        return res.data;
    } catch (err) {
        console.error("❌ Error al obtener tipos de elásticos (datatable):", err);
        throw err.response?.data || err;
    }
}

/**
 * Obtener por ID
 */
export async function getById(id) {
    try {
        const res = await api.get(`/elastic-types/${id}`);
        return res.data;
    } catch (err) {
        console.error("❌ Error al obtener tipo de elástico:", err);
        throw err.response?.data || err;
    }
}

/**
 * Crear
 */
export async function create(data) {
    try {
        const res = await api.post("/elastic-types", data);
        return res.data;
    } catch (err) {
        console.error("❌ Error al crear tipo de elástico:", err);
        throw err.response?.data || err;
    }
}

/**
 * Actualizar
 */
export async function update(id, data) {
    try {
        const res = await api.put(`/elastic-types/${id}`, data);
        return res.data;
    } catch (err) {
        console.error("❌ Error al actualizar tipo de elástico:", err);
        throw err.response?.data || err;
    }
}

/**
 * Eliminar
 */
export async function remove(id) {
    try {
        const res = await api.delete(`/elastic-types/${id}`);
        return res.data;
    } catch (err) {
        console.error("❌ Error al eliminar tipo de elástico:", err);
        throw err.response?.data || err;
    }
}
