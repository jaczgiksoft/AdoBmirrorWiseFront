import api from './api';

// Providers
export const getProviders = async () => {
    const { data } = await api.get('/inventory-providers');
    return data;
};

export const getProviderById = async (id) => {
    const { data } = await api.get(`/inventory-providers/${id}`);
    return data;
};

export const createProvider = async (providerData) => {
    const { data } = await api.post('/inventory-providers', providerData);
    return data;
};

export const updateProvider = async (id, providerData) => {
    const { data } = await api.put(`/inventory-providers/${id}`, providerData);
    return data;
};

export const deleteProvider = async (id) => {
    const { data } = await api.delete(`/inventory-providers/${id}`);
    return data;
};

// Items
export const getItems = async () => {
    const { data } = await api.get('/inventory-items');
    return data;
};

export const getItemById = async (id) => {
    const { data } = await api.get(`/inventory-items/${id}`);
    return data;
};

export const createItem = async (itemData) => {
    const { data } = await api.post('/inventory-items', itemData);
    return data;
};

export const updateItem = async (id, itemData) => {
    const { data } = await api.put(`/inventory-items/${id}`, itemData);
    return data;
};

export const deleteItem = async (id) => {
    const { data } = await api.delete(`/inventory-items/${id}`);
    return data;
};

// Movements
export const getMovements = async () => {
    const { data } = await api.get('/inventory-movements');
    return data;
};

export const createMovement = async (movementData) => {
    const { data } = await api.post('/inventory-movements', movementData);
    return data;
};
