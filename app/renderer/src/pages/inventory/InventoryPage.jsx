// app/renderer/src/modules/inventory/pages/InventoryPage.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Package, PlusCircle, Search } from "lucide-react";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/layout";
import { ConfirmDialog } from "@/components/feedback";
import { useInventory } from "./hooks/useInventory";
import InventoryTable from "./components/InventoryTable";
import CreateEditItemModal from "./components/CreateEditItemModal";
import AdjustStockModal from "./components/AdjustStockModal";
import InventoryChart from "./components/InventoryChart";
import InventoryFilterDropdown from "./components/InventoryFilterDropdown";
import MovementsTable from "./components/MovementsTable";
import InventorySummary from "./components/InventorySummary";

export default function InventoryPage() {
    const navigate = useNavigate();
    const { items, movements, categories, unitTypes, movementTypes, addItem, updateItem, deleteItem, adjustStock } = useInventory();

    const [selectedCategory, setSelectedCategory] = useState("All");
    const [searchTerm, setSearchTerm] = useState("");

    // Modal states
    const [isCreateEditModalOpen, setCreateEditModalOpen] = useState(false);
    const [isAdjustModalOpen, setAdjustModalOpen] = useState(false);

    // TAB STATE
    const [activeTab, setActiveTab] = useState("table"); // "table", "movements", "summary", "chart"

    // MOVEMENTS FILTER STATE
    const [movementsTimeFilter, setMovementsTimeFilter] = useState("24h"); // "24h", "all"

    // Selected item for edits/adjustments
    const [selectedItem, setSelectedItem] = useState(null);

    // Delete confirmation state
    const [itemToDelete, setItemToDelete] = useState(null);

    // Derived filtered items (Search + Category)
    const filteredItems = items.filter(item => {
        const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;
        const searchLow = searchTerm.toLowerCase();
        const matchesSearch = item.name.toLowerCase().includes(searchLow) ||
            item.category.toLowerCase().includes(searchLow) ||
            (item.notes && item.notes.toLowerCase().includes(searchLow));

        return matchesCategory && matchesSearch;
    });

    // Derived filtered movements (Search + Time Filter)
    const filteredMovements = movements.filter(mov => {
        // Time filter
        let matchesTime = true;
        if (movementsTimeFilter === "24h") {
            const yesterday = new Date();
            yesterday.setHours(yesterday.getHours() - 24);
            matchesTime = new Date(mov.date) >= yesterday;
        }

        // Search filter
        const searchLow = searchTerm.toLowerCase();
        const matchesSearch =
            mov.itemName.toLowerCase().includes(searchLow) ||
            (mov.itemSku && mov.itemSku.toLowerCase().includes(searchLow)) ||
            mov.type.toLowerCase().includes(searchLow);

        return matchesTime && matchesSearch;
    });

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

    const handleSaveAdjustment = (id, amount, reason, reference) => {
        adjustStock(id, amount, reason, reference);
        setAdjustModalOpen(false);
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <PageHeader
                icon={Package}
                title="Inventario"
                subtitle="Gestión de suministros e insumos del consultorio"
                onBack={() => navigate("/dashboard")}
            />

            {/* TAB NAVIGATION */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/50 p-1 rounded-xl border border-slate-200 dark:border-slate-700 w-fit">
                <button
                    onClick={() => setActiveTab("table")}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === "table"
                        ? "bg-white dark:bg-slate-700 text-cyan-600 dark:text-cyan-400 shadow-sm"
                        : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                        }`}
                >
                    Lista de Artículos
                </button>
                <button
                    onClick={() => setActiveTab("movements")}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === "movements"
                        ? "bg-white dark:bg-slate-700 text-cyan-600 dark:text-cyan-400 shadow-sm"
                        : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                        }`}
                >
                    Movimientos
                </button>
                <button
                    onClick={() => setActiveTab("summary")}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === "summary"
                        ? "bg-white dark:bg-slate-700 text-cyan-600 dark:text-cyan-400 shadow-sm"
                        : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                        }`}
                >
                    Resumen
                </button>
                <button
                    onClick={() => setActiveTab("chart")}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === "chart"
                        ? "bg-white dark:bg-slate-700 text-cyan-600 dark:text-cyan-400 shadow-sm"
                        : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                        }`}
                >
                    Análisis de Existencias
                </button>
            </div>

            {/* Filters */}
            <div className="flex items-center justify-between gap-4 bg-white dark:bg-secondary p-4 rounded-xl shadow-soft">
                <div className="flex items-center gap-3">
                    {/* 🔍 Search + Filter Group */}
                    <div className="relative flex items-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-dark transition-all focus-within:ring-2 focus-within:ring-cyan-500/50">
                        <Search
                            size={16}
                            className="absolute left-3 text-slate-400 dark:text-slate-500"
                        />
                        <input
                            type="text"
                            placeholder="Buscar artículo..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-20 py-2.5 bg-transparent text-sm outline-none text-slate-700 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 w-64 md:w-80"
                        />
                        <div className="absolute right-1">
                            {activeTab === "movements" ? (
                                <select
                                    className="bg-slate-100 dark:bg-slate-700/50 text-slate-700 dark:text-slate-300 text-xs font-bold py-1.5 px-3 rounded cursor-pointer border-none outline-none appearance-none text-center"
                                    value={movementsTimeFilter}
                                    onChange={(e) => setMovementsTimeFilter(e.target.value)}
                                >
                                    <option value="24h">Últimas 24h</option>
                                    <option value="all">Todas las fechas</option>
                                </select>
                            ) : (
                                <InventoryFilterDropdown
                                    categories={categories}
                                    selectedCategory={selectedCategory}
                                    onApply={setSelectedCategory}
                                />
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex flex-col justify-end">
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={handleCreateNew}
                        className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-sky-500 transition shadow-lg shadow-primary/20 cursor-pointer"
                    >
                        <PlusCircle size={18} />
                        <span>Registrar Artículo</span>
                    </motion.button>
                </div>
            </div>

            {/* Main Content (Conditional Rendering) */}
            <div className="transition-all duration-300">
                {activeTab === "chart" ? (
                    <div className="bg-white dark:bg-secondary p-6 rounded-xl shadow-soft border border-slate-200 dark:border-slate-700">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider">
                                    Análisis de Movimientos
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                    Visualización de transacciones por tipo
                                </p>
                            </div>
                            <span className="text-[10px] bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400 font-bold px-2 py-0.5 rounded-full">
                                {filteredMovements.length} Registros
                            </span>
                        </div>
                        <InventoryChart movements={filteredMovements} />
                    </div>
                ) : activeTab === "movements" ? (
                    <div className="bg-white dark:bg-secondary rounded-xl shadow-soft overflow-hidden border border-slate-200 dark:border-slate-700">
                        <MovementsTable movements={filteredMovements} />
                    </div>
                ) : activeTab === "summary" ? (
                    <div className="bg-white dark:bg-secondary p-6 rounded-xl shadow-soft border border-slate-200 dark:border-slate-700">
                        <InventorySummary items={filteredItems} movements={filteredMovements} />
                    </div>
                ) : (
                    <div className="bg-white dark:bg-secondary rounded-xl shadow-soft overflow-hidden border border-slate-200 dark:border-slate-700">
                        <InventoryTable
                            items={filteredItems}
                            onEdit={handleEdit}
                            onAdjust={handleAdjust}
                            onDelete={handleDelete}
                        />
                    </div>
                )}
            </div>

            {/* Modals */}
            {isCreateEditModalOpen && (
                <CreateEditItemModal
                    item={selectedItem}
                    categories={categories}
                    unitTypes={unitTypes}
                    onClose={() => setCreateEditModalOpen(false)}
                    onSave={handleSaveItem}
                />
            )}

            {isAdjustModalOpen && selectedItem && (
                <AdjustStockModal
                    item={selectedItem}
                    movementTypes={movementTypes}
                    onClose={() => setAdjustModalOpen(false)}
                    onSave={(amount, reason, reference) => handleSaveAdjustment(selectedItem.id, amount, reason, reference)}
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
