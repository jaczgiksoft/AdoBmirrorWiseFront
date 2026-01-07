import api from "./api";

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
