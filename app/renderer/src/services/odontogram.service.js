import api from './api';

/**
 * Get the odontogram for a specific patient.
 * @param {number|string} patientId 
 * @returns {Promise<Object>}
 */
export const getOdontogramByPatientId = async (patientId) => {
    try {
        const response = await api.get(`/odontograms/patient/${patientId}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

/**
 * Save the odontogram data for a specific patient.
 * @param {Object} data - Full odontogram data including patientId
 * @returns {Promise<Object>}
 */
export const saveOdontogram = async (data) => {
    try {
        const response = await api.post('/odontograms', data);
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};
