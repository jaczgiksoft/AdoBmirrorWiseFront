// src/services/cashRegister.service.js
import api from "./api";

/**
 * Obtener todas las cajas del tenant actual
 */
export async function getCashRegisters() {
    try {
        const res = await api.get("/cash-registers");
        return res.data;
    } catch (err) {
        console.error("❌ Error al obtener cajas:", err);
        throw err.response?.data || err;
    }
}

/**
 * Obtener cajas con paginación (DataTable compatible)
 */
export async function getCashRegistersPaginated({
                                                    start = 0,
                                                    length = 20,
                                                    searchValue = "",
                                                    orderColumn = "name",
                                                    orderDir = "ASC",
                                                    statusFilter = "",
                                                } = {}) {
    try {
        const res = await api.post("/cash-registers/datatable", {
            start,
            length,
            searchValue,
            orderColumn,
            orderDir,
            statusFilter,
        });

        return res.data;
    } catch (err) {
        console.error("❌ Error al obtener cajas (datatable):", err);
        throw err.response?.data || err;
    }
}

/**
 * Obtener una caja por ID
 */
export async function getCashRegisterById(id) {
    try {
        const res = await api.get(`/cash-registers/${id}`);
        return res.data;
    } catch (err) {
        console.error("❌ Error al obtener caja:", err);
        throw err.response?.data || err;
    }
}

/**
 * Obtener una caja por código (PC name)
 */
export async function getCashRegisterByCode(code) {
    try {
        const res = await api.get(`/cash-registers/by-code/${code}`);
        return res.data;
    } catch (err) {
        console.error("❌ Error al obtener caja por código:", err);
        throw err.response?.data || err;
    }
}

/**
 * Crear nueva caja
 */
export async function createCashRegister(data) {
    try {
        const res = await api.post("/cash-registers", data);
        return res.data;
    } catch (err) {
        console.error("❌ Error al crear caja:", err);
        throw err.response?.data || err;
    }
}

/**
 * Actualizar caja existente
 */
export async function updateCashRegister(id, data) {
    try {
        const res = await api.put(`/cash-registers/${id}`, data);
        return res.data;
    } catch (err) {
        console.error("❌ Error al actualizar caja:", err);
        throw err.response?.data || err;
    }
}

/**
 * Eliminar (soft delete) caja
 */
export async function deleteCashRegister(id) {
    try {
        const res = await api.delete(`/cash-registers/${id}`);
        return res.data;
    } catch (err) {
        console.error("❌ Error al eliminar caja:", err);
        throw err.response?.data || err;
    }
}
