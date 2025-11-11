import api from "@/services/api";

export async function fetchCurrentUser() {
    try {
        const res = await api.get("/auth/me");
        return res.data;
    } catch (err) {
        console.error("❌ Error al obtener perfil de usuario:", err);
        throw err;
    }
}

/**
 * Cierra la sesión actual tanto en la API como en el cliente
 */
export async function logoutFromAPI() {
    try {
        await api.post("/auth/logout");
    } catch (err) {
        // Si el token ya está invalidado, ignoramos el error
        if (err.response?.status !== 401) {
            console.error("❌ Error al cerrar sesión en la API:", err.message);
        }
    }
}
