import api from "./api";

// 📋 Obtener datos de facturación de un paciente
export const getBillingForPatient = async (patientId) => {
    const { data } = await api.get(`/patient-billing-data/patient/${patientId}`);
    return data;
};

// 🟢 Asignar dato fiscal existente (NO RECOMENDADO USAR DIRECTO, MEJOR LINK-OR-CREATE)
export const addBillingToPatient = async (patientId, billingDataId) => {
    const { data } = await api.post("/patient-billing-data", {
        patient_id: patientId,
        billing_data_id: billingDataId
    });
    return data;
};

// ⭐ Buscar o Crear dato fiscal unificado
export const linkOrCreateBillingData = async (payload) => {
    const { data } = await api.post("/patient-billing-data/link-or-create", payload);
    return data;
};

// 🟠 Actualizar dato fiscal unificado
export const updateLinkOrCreateBillingData = async (id, payload) => {
    const { data } = await api.put(`/patient-billing-data/link-or-create/${id}`, payload);
    return data;
};

// 🔴 Eliminar relación
export const removeBillingFromPatient = async (id) => {
    const { data } = await api.delete(`/patient-billing-data/${id}`);
    return data;
};

// ⭐ Marcar como principal
export const setPrimaryBillingData = async (id) => {
    const { data } = await api.put(`/patient-billing-data/set-primary/${id}`);
    return data;
};
