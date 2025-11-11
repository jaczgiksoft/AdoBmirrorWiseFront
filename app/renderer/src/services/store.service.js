// src/services/store.service.js
import api from "./api";

/**
 * Obtener todas las tiendas del tenant actual
 */
export async function getStores() {
    try {
        const res = await api.get("/stores");
        return res.data;
    } catch (err) {
        console.error("❌ Error al obtener tiendas:", err);
        throw err.response?.data || err;
    }
}

export async function getStoresPaginated({
                                             start = 0,
                                             length = 20,
                                             searchValue = "",
                                             orderColumn = "name",
                                             orderDir = "ASC",
                                             statusFilter = "",
                                             city = "",
                                             state = "",
                                             currency = "",
                                         } = {}) {
    try {
        const res = await api.post("/stores/datatable", {
            start,
            length,
            searchValue,
            orderColumn,
            orderDir,
            statusFilter,
            city,
            state,
            currency,
        });

        return res.data;
    } catch (err) {
        console.error("❌ Error al obtener tiendas (datatable):", err);
        throw err.response?.data || err;
    }
}

/**
 * Obtener una tienda por ID
 */
export async function getStoreById(id) {
    try {
        const res = await api.get(`/stores/${id}`);
        return res.data;
    } catch (err) {
        console.error("❌ Error al obtener tienda:", err);
        throw err.response?.data || err;
    }
}

/**
 * Crear nueva tienda
 */
export async function createStore(data) {
    try {
        const res = await api.post("/stores", data);
        return res.data;
    } catch (err) {
        console.error("❌ Error al crear tienda:", err);
        throw err.response?.data || err;
    }
}

/**
 * Actualizar tienda existente
 */
export async function updateStore(id, data) {
    try {
        const res = await api.put(`/stores/${id}`, data);
        return res.data;
    } catch (err) {
        console.error("❌ Error al actualizar tienda:", err);
        throw err.response?.data || err;
    }
}

/**
 * Eliminar (soft delete) tienda
 */
export async function deleteStore(id) {
    try {
        const res = await api.delete(`/stores/${id}`);
        return res.data;
    } catch (err) {
        console.error("❌ Error al eliminar tienda:", err);
        throw err.response?.data || err;
    }
}