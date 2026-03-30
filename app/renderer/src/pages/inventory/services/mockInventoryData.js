// app/renderer/src/modules/inventory/services/mockInventoryData.js
export const INITIAL_INVENTORY_DATA = [
    {
        id: 1,
        image: null,
        sku: "RES-001",
        name: "Clorhexidina 2%",
        description: "Solución antiséptica para irrigación",
        category: "Medicamentos",
        quantity: 10,
        unit: "Frasco",
        min_stock: 5,
        purchasePrice: 120.50,
        salePrice: 150.00,
        lotNumber: "L-202305A",
        expiryDate: "2027-05-15",
        lastUpdate: new Date().toISOString(),
        notes: "Uso frecuente en endodoncias",
        status: "active"
    },
    {
        id: 2,
        image: null,
        sku: "ANE-002",
        name: "Lidocaína 2% con Epinefrina",
        description: "Anestesia local inyectable",
        category: "Medicamentos",
        quantity: 2,
        unit: "Cajas",
        min_stock: 5,
        purchasePrice: 450.00,
        salePrice: 550.00,
        lotNumber: "L-10293B",
        expiryDate: "2026-11-01",
        lastUpdate: new Date().toISOString(),
        notes: "Próxima a caducar en noviembre",
        status: "active"
    },
    {
        id: 3,
        image: null,
        sku: "GLV-003",
        name: "Guantes de Exploración (M)",
        description: "Guantes de nitrilo sin polvo talla M",
        category: "Material",
        quantity: 50,
        unit: "Cajas",
        min_stock: 10,
        purchasePrice: 180.00,
        salePrice: 200.00,
        lotNumber: "",
        expiryDate: "",
        lastUpdate: new Date().toISOString(),
        notes: "Libre de látex",
        status: "active"
    },
    {
        id: 4,
        image: null,
        sku: "CLN-004",
        name: "Toallas Desinfectantes",
        description: "Para limpieza de superficies clínicas",
        category: "Suministros",
        quantity: 2,
        unit: "Bote",
        min_stock: 4,
        purchasePrice: 85.00,
        salePrice: 110.00,
        lotNumber: "",
        expiryDate: "",
        lastUpdate: new Date().toISOString(),
        notes: "",
        status: "active"
    },
    {
        id: 5,
        image: null,
        sku: "OFC-005",
        name: "Papel Bond Tamaño Carta",
        description: "Paquete de hojas blancas para impresión",
        category: "Otros",
        quantity: 1,
        unit: "Paquete",
        min_stock: 2,
        purchasePrice: 130.00,
        salePrice: 150.00,
        lotNumber: "",
        expiryDate: "",
        lastUpdate: new Date().toISOString(),
        notes: "Para recepción",
        status: "active"
    }
];

export const INVENTORY_CATEGORIES = [
    "Medicamentos",
    "Material",
    "Suministros",
    "Otros"
];

export const UNIT_TYPES = [
    "Pieza", "Cajas", "Sobre", "Frasco", "Tubo", "Rollo", 
    "Blister", "Jeringa", "Bolsa", "Paquete", "Mililitro (ml)", 
    "Gramo (g)", "Porcentaje (%)", "Unidad", "Hora"
];

export const MOVEMENT_TYPES = [
    "Entrada", "Salida", "Merma", "Devolucion", "Caducado"
];

export const INITIAL_MOVEMENTS_DATA = [];