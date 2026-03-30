import { useState, useEffect } from "react";
import { 
    INITIAL_INVENTORY_DATA, 
    INVENTORY_CATEGORIES, 
    UNIT_TYPES, 
    MOVEMENT_TYPES, 
    INITIAL_MOVEMENTS_DATA 
} from "../services/mockInventoryData";

const STORAGE_KEY = "bwise_inventory_data";
const MOVEMENTS_STORAGE_KEY = "bwise_inventory_movements";

export function useInventory() {
    const [items, setItems] = useState(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        try {
            return saved ? JSON.parse(saved) : INITIAL_INVENTORY_DATA;
        } catch (e) {
            console.error("Error parsing inventory storage:", e);
            return INITIAL_INVENTORY_DATA;
        }
    });

    const [movements, setMovements] = useState(() => {
        const saved = localStorage.getItem(MOVEMENTS_STORAGE_KEY);
        try {
            return saved ? JSON.parse(saved) : INITIAL_MOVEMENTS_DATA;
        } catch (e) {
            console.error("Error parsing movements storage:", e);
            return INITIAL_MOVEMENTS_DATA;
        }
    });

    // Categories available
    const categories = INVENTORY_CATEGORIES;

    // Persist changes to localStorage
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    }, [items]);

    useEffect(() => {
        localStorage.setItem(MOVEMENTS_STORAGE_KEY, JSON.stringify(movements));
    }, [movements]);

    // Create a new item
    const addItem = (newItem) => {
        const id = Math.max(0, ...items.map(i => i.id)) + 1;
        setItems(prev => [...prev, { ...newItem, id, status: "active", lastUpdate: new Date().toISOString() }]);
    };

    // Update an existing item
    const updateItem = (id, updatedData) => {
        setItems(prev => prev.map(item => 
            item.id === id ? { ...item, ...updatedData, lastUpdate: new Date().toISOString() } : item
        ));
    };

    // Explicit function to modify only stock
    const adjustStock = (id, amount, reason, reference) => {
        const now = new Date().toISOString();
        
        setItems(prev => prev.map(item => {
            if (item.id === id) {
                // Register movement
                const newMovement = {
                    id: Math.random().toString(36).substr(2, 9),
                    itemId: item.id,
                    itemName: item.name,
                    itemSku: item.sku,
                    itemImage: item.image,
                    type: reason, // Tipo de movimiento (Entrada, Salida, etc.)
                    quantity: amount,
                    unitPrice: item.purchasePrice || 0,
                    reference: reference || "",
                    date: now
                };
                
                setMovements(prevMoves => [newMovement, ...prevMoves]);
                
                return { 
                    ...item, 
                    quantity: item.quantity + Number(amount),
                    lastUpdate: now 
                };
            }
            return item;
        }));
    };

    // Delete item
    const deleteItem = (id) => {
        setItems(prev => prev.filter(item => item.id !== id));
    };

    return {
        items,
        movements,
        categories,
        unitTypes: UNIT_TYPES,
        movementTypes: MOVEMENT_TYPES,
        addItem,
        updateItem,
        adjustStock,
        deleteItem
    };
}
