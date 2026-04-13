import api from './api';

/**
 * Get the elastics instructions for a specific patient.
 * @param {number|string} patientId 
 * @returns {Promise<Object>}
 */
export const getElasticsByPatientId = async (patientId) => {
    try {
        const response = await api.get(`/patient-elastics/patient/${patientId}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

/**
 * Save a new elastic instruction for a specific patient.
 * @param {Object} data - Elastic instruction data
 * @returns {Promise<Object>}
 */
export const createElastic = async (data) => {
    try {
        const response = await api.post('/patient-elastics', data);
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

/**
 * Delete an elastic instruction.
 * @param {string} id - Instruction UUID
 * @returns {Promise<Object>}
 */
export const deleteElastic = async (id) => {
    try {
        const response = await api.delete(`/patient-elastics/${id}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};
