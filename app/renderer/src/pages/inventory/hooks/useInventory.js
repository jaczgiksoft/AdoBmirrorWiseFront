// app/renderer/src/modules/inventory/hooks/useInventory.js
import { useState } from "react";
import { INITIAL_INVENTORY_DATA, INVENTORY_CATEGORIES } from "../services/mockInventoryData";

export function useInventory() {
    const [items, setItems] = useState(INITIAL_INVENTORY_DATA);

    // Categories available
    const categories = INVENTORY_CATEGORIES;

    // Create a new item
    const addItem = (newItem) => {
        const id = Math.max(0, ...items.map(i => i.id)) + 1;
        setItems(prev => [...prev, { ...newItem, id, status: "active" }]);
    };

    // Update an existing item
    const updateItem = (id, updatedData) => {
        setItems(prev => prev.map(item => 
            item.id === id ? { ...item, ...updatedData } : item
        ));
    };

    // Explicit function to modify only stock
    const adjustStock = (id, amount, reason) => {
        setItems(prev => prev.map(item => {
            if (item.id === id) {
                // Here we would normally validate and hit API to log the reason
                // console.log(`Adjusted by ${amount}. Reason: ${reason}`);
                return { ...item, quantity: item.quantity + Number(amount) };
            }
            return item;
        }));
    };

    // Delete item (using state filter instead of soft delete for simplicity)
    const deleteItem = (id) => {
        setItems(prev => prev.filter(item => item.id !== id));
    };

    return {
        items,
        categories,
        addItem,
        updateItem,
        adjustStock,
        deleteItem
    };
}
