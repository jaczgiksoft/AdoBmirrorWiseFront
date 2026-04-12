import api from './api';

/**
 * Extraction Order Service
 * Handles communication with the /extraction-orders API.
 */

export const createOrder = async (orderData) => {
    // We expect orderData to be an object with:
    // { patient_id, doctor_id, clinical_reason, notes, status, order_date, teeth, files }
    
    // Check if we have files to send via FormData
    const hasFiles = orderData.files && orderData.files.some(f => f.file);
    
    if (hasFiles) {
        const formData = new FormData();
        
        // Prepare data for the backend (it expects a 'data' field or direct fields)
        // Here we'll send it as 'data' stringifier for complex nested objects
        const { files, ...rest } = orderData;
        formData.append('data', JSON.stringify(rest));
        
        files.forEach(fileWrapper => {
            if (fileWrapper.file) {
                formData.append('radiographs', fileWrapper.file);
            }
        });
        
        const response = await api.post('/extraction-orders', formData);
        return response.data;
    } else {
        const response = await api.post('/extraction-orders', orderData);
        return response.data;
    }
};

export const getOrdersByPatient = async (patientId) => {
    const response = await api.get(`/extraction-orders/patient/${patientId}`);
    return response.data;
};

export const getOrderById = async (id) => {
    const response = await api.get(`/extraction-orders/${id}`);
    return response.data;
};

export const updateOrder = async (id, orderData) => {
    const response = await api.put(`/extraction-orders/${id}`, orderData);
    return response.data;
};

export const deleteOrder = async (id) => {
    const response = await api.delete(`/extraction-orders/${id}`);
    return response.data;
};
