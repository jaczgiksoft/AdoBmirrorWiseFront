import api from "./api";

/**
 * Obtener lista completa de empleados
 * Endpoint: /employees
 */
export async function getEmployees() {
    try {
        const res = await api.get("/employees");
        return res.data;
    } catch (err) {
        console.error("❌ Error al obtener empleados:", err);
        throw err.response?.data || err;
    }
}

/**
 * Obtener listado para tabla con búsqueda/paginación
 * Endpoint: /employees/datatable
 */
export async function getEmployeesDatatable(params) {
    try {
        const res = await api.post("/employees/datatable", params);
        return res.data;
    } catch (err) {
        console.error("❌ Error al cargar datatable de empleados:", err);
        throw err.response?.data || err;
    }
}

/**
 * Obtener un empleado por ID
 */
export async function getEmployee(id) {
    try {
        const res = await api.get(`/employees/${id}`);
        return res.data;
    } catch (err) {
        console.error(`❌ Error al obtener empleado ${id}:`, err);
        throw err.response?.data || err;
    }
}

/**
 * Crear un nuevo empleado
 */
export async function createEmployee(data) {
    try {
        const res = await api.post("/employees", data);
        return res.data;
    } catch (err) {
        console.error("❌ Error al crear empleado:", err);
        throw err.response?.data || err;
    }
}

/**
 * Actualizar un empleado existente
 */
export async function updateEmployee(id, data) {
    try {
        const res = await api.put(`/employees/${id}`, data);
        return res.data;
    } catch (err) {
        console.error(`❌ Error al actualizar empleado ${id}:`, err);
        throw err.response?.data || err;
    }
}

/**
 * Eliminar (borrado lógico) un empleado
 */
export async function deleteEmployee(id) {
    try {
        const res = await api.delete(`/employees/${id}`);
        return res.data;
    } catch (err) {
        console.error(`❌ Error al eliminar empleado ${id}:`, err);
        throw err.response?.data || err;
    }
}

/**
 * Obtener lista de doctores (empleados elegibles)
 * Endpoint: /employees/options/doctors
 */
export async function getDoctors() {
    try {
        const res = await api.get("/employees/options/doctors");
        return res.data;
    } catch (err) {
        console.error("❌ Error al obtener doctores:", err);
        throw err.response?.data || err;
    }
}
