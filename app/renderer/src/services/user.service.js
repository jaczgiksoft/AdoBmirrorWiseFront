// src/services/user.service.js
import api from "./api";

/**
 * Obtener todos los usuarios del tenant actual
 */
export async function getUsers() {
    try {
        const res = await api.get("/users");
        return res.data;
    } catch (err) {
        console.error("❌ Error al obtener usuarios:", err);
        throw err.response?.data || err;
    }
}

/**
 * Obtener usuarios paginados (DataTable)
 */
export async function getUsersPaginated({
                                            start = 0,
                                            length = 20,
                                            searchValue = "",
                                            orderColumn = "first_name",
                                            orderDir = "ASC",
                                            statusFilter = "",
                                            role = "",
                                            store = "",
                                        } = {}) {
    try {
        const res = await api.post("/users/datatable", {
            start,
            length,
            searchValue,
            orderColumn,
            orderDir,
            statusFilter,
            role,
            store,
        });

        return res.data;
    } catch (err) {
        console.error("❌ Error al obtener usuarios (datatable):", err);
        throw err.response?.data || err;
    }
}

/**
 * Crear nuevo usuario
 */
export async function createUser(data) {
    try {
        const res = await api.post("/users", data);
        return res.data;
    } catch (err) {
        console.error("❌ Error al crear usuario:", err);
        throw err.response?.data || err;
    }
}

/**
 * Actualizar usuario existente
 */
export async function updateUser(id, data) {
    try {
        const res = await api.put(`/users/${id}`, data);
        return res.data;
    } catch (err) {
        console.error("❌ Error al actualizar usuario:", err);
        throw err.response?.data || err;
    }
}

/**
 * Eliminar (soft delete) usuario
 */
export async function deleteUser(id) {
    try {
        const res = await api.delete(`/users/${id}`);
        return res.data;
    } catch (err) {
        console.error("❌ Error al eliminar usuario:", err);
        throw err.response?.data || err;
    }
}
