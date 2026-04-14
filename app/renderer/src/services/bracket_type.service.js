import api from "./api";

/**
 * Servicio para la gestión de tipos de brackets (Patient Brackets)
 */
class BracketTypeService {
    /**
     * Obtiene todos los tipos de brackets del tenant actual
     * @returns {Promise<Array>} Lista de brackets
     */
    async getAll() {
        const response = await api.get("/bracket-types");
        return response.data;
    }

    /**
     * Obtiene un tipo de bracket por su ID
     * @param {number|string} id 
     * @returns {Promise<Object>} Datos del bracket
     */
    async getById(id) {
        const response = await api.get(`/bracket-types/${id}`);
        return response.data;
    }

    /**
     * Crea un nuevo tipo de bracket
     * @param {Object} data - { name, description, color, material, manufacturer }
     * @returns {Promise<Object>} Bracket creado
     */
    async create(data) {
        const response = await api.post("/bracket-types", data);
        return response.data.bracket_type;
    }

    /**
     * Actualiza un tipo de bracket existente
     * @param {number|string} id 
     * @param {Object} data - Campos a actualizar
     * @returns {Promise<Object>} Bracket actualizado
     */
    async update(id, data) {
        const response = await api.put(`/bracket-types/${id}`, data);
        return response.data.bracket_type;
    }

    /**
     * Elimina (soft delete) un tipo de bracket
     * @param {number|string} id 
     * @returns {Promise<boolean>}
     */
    async delete(id) {
        const response = await api.delete(`/bracket-types/${id}`);
        return response.status === 200;
    }
}

export default new BracketTypeService();
