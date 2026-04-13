import api from "./api";

/**
 * Obtiene el registro clínico de un paciente por su ID.
 * @param {number} patientId
 * @returns {Promise<Object|null>}
 */
export const getRecordByPatientId = async (patientId) => {
    try {
        const response = await api.get(`/patient-clinical/patient/${patientId}`);
        return response.data.data;
    } catch (error) {
        console.error(`Error al obtener historia clínica para paciente ${patientId}:`, error);
        throw error;
    }
};

/**
 * Crea o actualiza el registro clínico de un paciente.
 * @param {Object} data - { patientId, clinicalData }
 * @returns {Promise<Object>}
 */
export const upsertRecord = async (data) => {
    try {
        const response = await api.post("/patient-clinical/upsert", data);
        return response.data;
    } catch (error) {
        console.error("Error al guardar historia clínica:", error);
        throw error;
    }
};
