import api from "./api";

export const getConversationsByPatientId = async (patientId) => {
    try {
        const response = await api.get(`/patient-conversations/patient/${patientId}`);
        return response.data;  // <-- FIX
    } catch (error) {
        console.error('Error fetching conversations:', error);
        throw error.response?.data || error;
    }
};

export const createConversation = async (data) => {
    try {
        const response = await api.post('/patient-conversations', data);
        return response.data;  // <-- FIX
    } catch (error) {
        console.error('Error creating conversation:', error);
        throw error.response?.data || error;
    }
};

export const updateConversation = async (id, data) => {
    try {
        const response = await api.put(`/patient-conversations/${id}`, data);
        return response.data;  // <-- FIX
    } catch (error) {
        console.error('Error updating conversation:', error);
        throw error.response?.data || error;
    }
};

export const deleteConversation = async (id) => {
    try {
        const response = await api.delete(`/patient-conversations/${id}`);
        return response.data;  // <-- FIX
    } catch (error) {
        console.error('Error deleting conversation:', error);
        throw error.response?.data || error;
    }
};
