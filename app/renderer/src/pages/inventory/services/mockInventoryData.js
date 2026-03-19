// app/renderer/src/modules/inventory/services/mockInventoryData.js
export const INITIAL_INVENTORY_DATA = [
    {
        id: 1,
        name: "Composite Resin A2",
        category: "Medical supplies",
        quantity: 10,
        unit: "syringes",
        min_stock: 5,
        notes: "Premium brand",
        status: "active"
    },
    {
        id: 2,
        name: "Lidocaine 2%",
        category: "Medical supplies",
        quantity: 2,
        unit: "boxes",
        min_stock: 5,
        notes: "Expires next month",
        status: "active"
    },
    {
        id: 3,
        name: "Exam Gloves (M)",
        category: "Medical supplies",
        quantity: 50,
        unit: "boxes",
        min_stock: 10,
        notes: "Latex free",
        status: "active"
    },
    {
        id: 4,
        name: "Disinfectant Wipes",
        category: "Cleaning",
        quantity: 2,
        unit: "canisters",
        min_stock: 4,
        notes: "",
        status: "active"
    },
    {
        id: 5,
        name: "Printer Paper",
        category: "Office",
        quantity: 1,
        unit: "reams",
        min_stock: 2,
        notes: "For reception",
        status: "active"
    }
];

export const INVENTORY_CATEGORIES = [
    "Medical supplies",
    "Cleaning",
    "Office",
    "Others"
];
