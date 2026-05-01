import { useState, useEffect } from "react";
import * as inventoryService from "../../../services/inventory.service";
import { 
    INVENTORY_CATEGORIES, 
    UNIT_TYPES, 
    MOVEMENT_TYPES 
} from "../services/mockInventoryData";
import { useToastStore } from "@/store/useToastStore";

export function useInventory() {
    const [items, setItems] = useState([]);
    const [movements, setMovements] = useState([]);
    const [providers, setProviders] = useState([]);
    const [loading, setLoading] = useState(true);
    const { addToast } = useToastStore();

    const categories = INVENTORY_CATEGORIES;

    const fetchData = async () => {
        setLoading(true);
        try {
            const [fetchedItems, fetchedMovements, fetchedProviders] = await Promise.all([
                inventoryService.getItems(),
                inventoryService.getMovements(),
                inventoryService.getProviders()
            ]);
            
            // Map API structure to Component structure to prevent huge refactoring
            setItems(fetchedItems.map(item => ({
                ...item,
                quantity: item.current_stock,
                lastUpdate: item.updated_at,
                purchasePrice: parseFloat(item.purchase_price) || 0,
                salePrice: parseFloat(item.sale_price) || 0,
                lotNumber: item.lot_number || '',
                expiryDate: item.expiry_date || ''
            })));
            
            setMovements(fetchedMovements.map(mov => ({
                ...mov,
                itemName: mov.item?.name,
                itemSku: mov.item?.sku,
                providerName: mov.provider?.name,
                unitPrice: parseFloat(mov.unit_price) || 0
            })));

            setProviders(fetchedProviders.map(prov => ({
                ...prov,
                contactName: prov.contact_name
            })));

        } catch (error) {
            console.error("Error fetching inventory data:", error);
            addToast({ type: "error", title: "Error", message: "Error al cargar los datos de inventario." });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Create a new item
    const addItem = async (newItem) => {
        try {
            const formData = new FormData();
            
            // Backend fields mapping
            formData.append('name', newItem.name);
            formData.append('sku', newItem.sku || '');
            formData.append('description', newItem.description || '');
            formData.append('category', newItem.category || '');
            formData.append('unit', newItem.unit || '');
            formData.append('min_stock', newItem.min_stock || 0);
            formData.append('current_stock', newItem.quantity || 0);
            formData.append('purchase_price', newItem.purchasePrice || 0);
            formData.append('sale_price', newItem.salePrice || 0);
            if (newItem.lotNumber) formData.append('lot_number', newItem.lotNumber);
            if (newItem.expiryDate) formData.append('expiry_date', newItem.expiryDate);
            
            if (newItem.image instanceof File) {
                formData.append('image', newItem.image);
            }

            await inventoryService.createItem(formData);
            addToast({ type: "success", title: "Éxito", message: "Artículo creado correctamente" });
            fetchData();
        } catch (error) {
            console.error(error);
            addToast({ type: "error", title: "Error", message: error.response?.data?.message || "Error al crear artículo" });
        }
    };

    // Update an existing item
    const updateItem = async (id, updatedData) => {
        try {
            const formData = new FormData();
            
            formData.append('name', updatedData.name);
            formData.append('sku', updatedData.sku || '');
            formData.append('description', updatedData.description || '');
            formData.append('category', updatedData.category || '');
            formData.append('unit', updatedData.unit || '');
            formData.append('min_stock', updatedData.min_stock || 0);
            formData.append('current_stock', updatedData.quantity || 0);
            formData.append('purchase_price', updatedData.purchasePrice || 0);
            formData.append('sale_price', updatedData.salePrice || 0);
            if (updatedData.lotNumber) formData.append('lot_number', updatedData.lotNumber);
            if (updatedData.expiryDate) formData.append('expiry_date', updatedData.expiryDate);
            
            if (updatedData.image instanceof File) {
                formData.append('image', updatedData.image);
            }

            await inventoryService.updateItem(id, formData);
            addToast({ type: "success", title: "Éxito", message: "Artículo actualizado correctamente" });
            fetchData();
        } catch (error) {
            console.error(error);
            addToast({ type: "error", title: "Error", message: error.response?.data?.message || "Error al actualizar artículo" });
        }
    };

    // Explicit function to modify stock
    const adjustStock = async (id, amount, reason, reference, providerId, unitCost) => {
        try {
            const movementData = {
                item_id: id,
                type: reason, // "Entrada", "Salida", "Ajuste", etc.
                quantity: amount,
                reference: reference || "",
                provider_id: providerId || null,
                unit_price: unitCost !== undefined ? unitCost : null
            };
            await inventoryService.createMovement(movementData);
            addToast({ type: "success", title: "Éxito", message: "Stock ajustado correctamente" });
            fetchData(); // Refresh everything to get new stock and new movement log
        } catch (error) {
            console.error(error);
            addToast({ type: "error", title: "Error", message: error.response?.data?.message || "Error al ajustar stock" });
        }
    };

    // Delete item
    const deleteItem = async (id) => {
        try {
            await inventoryService.deleteItem(id);
            addToast({ type: "success", title: "Éxito", message: "Artículo eliminado" });
            fetchData();
        } catch (error) {
            console.error(error);
            addToast({ type: "error", title: "Error", message: error.response?.data?.message || "Error al eliminar artículo" });
        }
    };

    // --- Providers Actions ---
    const addProvider = async (newProvider) => {
        try {
            await inventoryService.createProvider(newProvider);
            addToast({ type: "success", title: "Éxito", message: "Proveedor creado" });
            fetchData();
        } catch (error) {
            console.error(error);
            addToast({ type: "error", title: "Error", message: error.response?.data?.message || "Error al crear proveedor" });
        }
    };

    const updateProvider = async (id, updatedData) => {
        try {
            await inventoryService.updateProvider(id, updatedData);
            addToast({ type: "success", title: "Éxito", message: "Proveedor actualizado" });
            fetchData();
        } catch (error) {
            console.error(error);
            addToast({ type: "error", title: "Error", message: error.response?.data?.message || "Error al actualizar proveedor" });
        }
    };

    const deleteProvider = async (id) => {
        try {
            await inventoryService.deleteProvider(id);
            addToast({ type: "success", title: "Éxito", message: "Proveedor eliminado" });
            fetchData();
        } catch (error) {
            console.error(error);
            addToast({ type: "error", title: "Error", message: error.response?.data?.message || "Error al eliminar proveedor" });
        }
    };

    return {
        items,
        movements,
        categories,
        unitTypes: UNIT_TYPES,
        movementTypes: MOVEMENT_TYPES,
        loading,
        addItem,
        updateItem,
        adjustStock,
        deleteItem,
        providers,
        addProvider,
        updateProvider,
        deleteProvider,
        refresh: fetchData
    };
}
