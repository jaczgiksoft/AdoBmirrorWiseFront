// src/services/role.service.js
import api from "./api";

/**
 * Obtener todos los roles del tenant actual
 */
export async function getRoles() {
    try {
        const res = await api.get("/roles");
        return res.data;
    } catch (err) {
        console.error("❌ Error al obtener roles:", err);
        throw err.response?.data || err;
    }
}

/**
 * Obtener todos los módulos disponibles (permisos)
 */
export async function getPermissions() {
    try {
        const res = await api.get("/permissions");
        return res.data;
    } catch (err) {
        console.error("❌ Error al obtener módulos de permisos:", err);
        throw err.response?.data || err;
    }
}

/**
 * Obtener un rol específico
 */
export async function getRoleById(id) {
    try {
        const res = await api.get(`/roles/${id}`);
        return res.data;
    } catch (err) {
        console.error("❌ Error al obtener rol:", err);
        throw err.response?.data || err;
    }
}

/**
 * Crear nuevo rol
 */
export async function createRole(data) {
    try {
        const res = await api.post("/roles", data);
        return res.data;
    } catch (err) {
        console.error("❌ Error al crear rol:", err);
        throw err.response?.data || err;
    }
}

/**
 * Actualizar rol existente
 */
export async function updateRole(id, data) {
    try {
        const res = await api.put(`/roles/${id}`, data);
        return res.data;
    } catch (err) {
        console.error("❌ Error al actualizar rol:", err);
        throw err.response?.data || err;
    }
}

/**
 * Eliminar (soft delete) un rol
 */
export async function deleteRole(id) {
    try {
        const res = await api.delete(`/roles/${id}`);
        return res.data;
    } catch (err) {
        console.error("❌ Error al eliminar rol:", err);
        throw err.response?.data || err;
    }
}
