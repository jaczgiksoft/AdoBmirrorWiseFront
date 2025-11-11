// src/services/department.service.js
import api from "./api";

/**
 * Obtener todos los departamentos del tenant actual
 */
export async function getDepartments() {
    try {
        const res = await api.get("/departments");
        return res.data;
    } catch (err) {
        console.error("❌ Error al obtener departamentos:", err);
        throw err.response?.data || err;
    }
}

/**
 * Obtener departamentos con paginación (DataTable compatible)
 */
export async function getDepartmentsPaginated({
                                                  start = 0,
                                                  length = 20,
                                                  searchValue = "",
                                                  orderColumn = "name",
                                                  orderDir = "ASC",
                                                  statusFilter = "",
                                              } = {}) {
    try {
        const res = await api.post("/departments/datatable", {
            start,
            length,
            searchValue,
            orderColumn,
            orderDir,
            statusFilter,
        });
        return res.data;
    } catch (err) {
        console.error("❌ Error al obtener departamentos (datatable):", err);
        throw err.response?.data || err;
    }
}

/**
 * Obtener un departamento por ID
 */
export async function getDepartmentById(id) {
    try {
        const res = await api.get(`/departments/${id}`);
        return res.data;
    } catch (err) {
        console.error("❌ Error al obtener departamento:", err);
        throw err.response?.data || err;
    }
}

/**
 * Crear nuevo departamento
 */
export async function createDepartment(data) {
    try {
        const res = await api.post("/departments", data);
        return res.data;
    } catch (err) {
        console.error("❌ Error al crear departamento:", err);
        throw err.response?.data || err;
    }
}

/**
 * Actualizar departamento existente
 */
export async function updateDepartment(id, data) {
    try {
        const res = await api.put(`/departments/${id}`, data);
        return res.data;
    } catch (err) {
        console.error("❌ Error al actualizar departamento:", err);
        throw err.response?.data || err;
    }
}

/**
 * Eliminar (soft delete) departamento
 */
export async function deleteDepartment(id) {
    try {
        const res = await api.delete(`/departments/${id}`);
        return res.data;
    } catch (err) {
        console.error("❌ Error al eliminar departamento:", err);
        throw err.response?.data || err;
    }
}
