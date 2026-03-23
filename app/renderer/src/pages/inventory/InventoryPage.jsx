// app/renderer/src/modules/inventory/pages/InventoryPage.jsx
import React, { useState } from "react";
import { Plus, Package } from "lucide-react";
import { PageHeader } from "@/components/layout";
import { ConfirmDialog } from "@/components/feedback";
import { useInventory } from "./hooks/useInventory";
import InventoryTable from "./components/InventoryTable";
import CreateEditItemModal from "./components/CreateEditItemModal";
import AdjustStockModal from "./components/AdjustStockModal";

export default function InventoryPage() {
    const { items, categories, addItem, updateItem, deleteItem, adjustStock } = useInventory();
    
    const [selectedCategory, setSelectedCategory] = useState("All");
    
    // Modal states
    const [isCreateEditModalOpen, setCreateEditModalOpen] = useState(false);
    const [isAdjustModalOpen, setAdjustModalOpen] = useState(false);
    
    // Selected item for edits/adjustments
    const [selectedItem, setSelectedItem] = useState(null);

    // Delete confirmation state
    const [itemToDelete, setItemToDelete] = useState(null);

    // Derived filtered items
    const filteredItems = selectedCategory === "All" 
        ? items 
        : items.filter(i => i.category === selectedCategory);

    // Handlers
    const handleCreateNew = () => {
        setSelectedItem(null);
        setCreateEditModalOpen(true);
    };

    const handleEdit = (item) => {
        setSelectedItem(item);
        setCreateEditModalOpen(true);
    };

    const handleAdjust = (item) => {
        setSelectedItem(item);
        setAdjustModalOpen(true);
    };

    const handleDelete = (item) => {
        setItemToDelete(item);
    };

    const confirmDelete = () => {
        if (itemToDelete) {
            deleteItem(itemToDelete.id);
            setItemToDelete(null);
        }
    };

    const handleSaveItem = (data) => {
        if (selectedItem) {
            updateItem(selectedItem.id, data);
        } else {
            addItem(data);
        }
        setCreateEditModalOpen(false);
    };

    const handleSaveAdjustment = (id, amount, reason) => {
        adjustStock(id, amount, reason);
        setAdjustModalOpen(false);
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <PageHeader 
                icon={Package}
                title="Inventario"
                description="Gestión de suministros e insumos del consultorio"
                actions={
                    <button 
                        onClick={handleCreateNew}
                        className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition"
                    >
                        <Plus size={18} />
                        Nuevo artículo
                    </button>
                }
            />

            {/* Filters */}
            <div className="flex items-center gap-4 bg-white dark:bg-secondary p-4 rounded-xl shadow-soft">
                <div className="flex flex-col">
                    <label className="text-sm text-slate-500 dark:text-slate-400 mb-1 font-medium">Categoría</label>
                    <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="border border-slate-300 dark:border-slate-600 bg-transparent rounded-lg px-3 py-2 text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-cyan-500 transition"
                    >
                        <option value="All">Todas</option>
                        {categories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Main Table */}
            <div className="bg-white dark:bg-secondary rounded-xl shadow-soft overflow-hidden border border-slate-200 dark:border-slate-700">
                <InventoryTable 
                    items={filteredItems}
                    onEdit={handleEdit}
                    onAdjust={handleAdjust}
                    onDelete={handleDelete}
                />
            </div>

            {/* Modals */}
            {isCreateEditModalOpen && (
                <CreateEditItemModal 
                    item={selectedItem}
                    categories={categories}
                    onClose={() => setCreateEditModalOpen(false)}
                    onSave={handleSaveItem}
                />
            )}

            {isAdjustModalOpen && selectedItem && (
                <AdjustStockModal
                    item={selectedItem}
                    onClose={() => setAdjustModalOpen(false)}
                    onSave={(amount, reason) => handleSaveAdjustment(selectedItem.id, amount, reason)}
                />
            )}

            <ConfirmDialog 
                open={!!itemToDelete}
                title="Eliminar artículo"
                message={`¿Seguro que deseas eliminar '${itemToDelete?.name}'?`}
                onConfirm={confirmDelete}
                onCancel={() => setItemToDelete(null)}
                confirmLabel="Eliminar"
                cancelLabel="Cancelar"
                confirmVariant="error"
            />
        </div>
    );
}
