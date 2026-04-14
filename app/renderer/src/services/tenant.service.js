import api from "./api";

/**
 * Verifica si un código de tenant es válido en el backend.
 * @param {string} code 
 * @returns {Promise<Object>} Datos del tenant si es válido.
 */
export const verifyTenantCode = async (code) => {
    try {
        const response = await api.get(`/tenants/verify/${code}`);
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || "Código de cliente no válido";
    }
};
