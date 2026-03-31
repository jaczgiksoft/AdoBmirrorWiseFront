import api from "./api";

// Obtener todos los productos (Mocked or API)
export async function getProducts() {
    // Cuando la API esté lista, usaremos: const res = await api.get("/products");
    // Por ahora, retornamos una promesa que resuelve los datos mock
    return api.get("/products").then(res => res.data).catch(() => {
        // Fallback a localStorage si la API falla o no existe
        const saved = localStorage.getItem("bwise_products");
        return saved ? JSON.parse(saved) : [];
    });
}

// Registro de movimiento de inventario
export async function createMovement(payload) {
    // Payload: { product_id, type, quantity, unit_cost, reference, user_id }
    const res = await api.post("/inventory-movements", payload);
    return res.data;
}