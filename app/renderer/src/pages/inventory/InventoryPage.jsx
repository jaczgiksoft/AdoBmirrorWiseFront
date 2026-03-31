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
import ProvidersTable from "./components/ProvidersTable";
import CreateEditProviderModal from "./components/CreateEditProviderModal";
import Datepicker from "react-tailwindcss-datepicker";

export default function InventoryPage() {
    const navigate = useNavigate();
    const {
        items, movements, categories, unitTypes, movementTypes,
        addItem, updateItem, deleteItem, adjustStock,
        providers, addProvider, updateProvider, deleteProvider
    } = useInventory();

    const [selectedCategory, setSelectedCategory] = useState("All");
    const [searchTerm, setSearchTerm] = useState("");

    // Modal states
    const [isCreateEditModalOpen, setCreateEditModalOpen] = useState(false);
    const [isAdjustModalOpen, setAdjustModalOpen] = useState(false);
    const [isProviderModalOpen, setProviderModalOpen] = useState(false);

    // TAB STATE
    const [activeTab, setActiveTab] = useState("table"); // "table", "movements", "summary", "chart"

    // DATE RANGE FILTER STATE
    const [dateRange, setDateRange] = useState({
        startDate: null,
        endDate: null
    });

    // CHART STATE
    const [chartType, setChartType] = useState("Movimientos por Tipo");

    // Selected item for edits/adjustments
    const [selectedItem, setSelectedItem] = useState(null);
    const [selectedProvider, setSelectedProvider] = useState(null);

    // Delete confirmation state
    const [itemToDelete, setItemToDelete] = useState(null);
    const [providerToDelete, setProviderToDelete] = useState(null);

    // Derived filtered items (Search + Category)
    const filteredItems = items.filter(item => {
        const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;
        const searchLow = searchTerm.toLowerCase();
        const matchesSearch = item.name.toLowerCase().includes(searchLow) ||
            item.category.toLowerCase().includes(searchLow) ||
            (item.notes && item.notes.toLowerCase().includes(searchLow));

        return matchesCategory && matchesSearch;
    });

    // Derived filtered movements (Search + Date Range)
    const filteredMovements = movements.filter(mov => {
        // Search filter
        const searchLow = searchTerm.toLowerCase();
        const matchesSearch =
            mov.itemName.toLowerCase().includes(searchLow) ||
            (mov.itemSku && mov.itemSku.toLowerCase().includes(searchLow)) ||
            mov.type.toLowerCase().includes(searchLow);

        // Date range filter
        let matchesDate = true;
        if (dateRange.startDate && dateRange.endDate) {
            const movDate = new Date(mov.date);
            const start = new Date(dateRange.startDate);
            const end = new Date(dateRange.endDate);
            end.setHours(23, 59, 59, 999);
            matchesDate = movDate >= start && movDate <= end;
        }

        return matchesSearch && matchesDate;
    });

    // Derived filtered providers (Search)
    const filteredProviders = providers.filter(prov => {
        const searchLow = searchTerm.toLowerCase();
        return prov.name.toLowerCase().includes(searchLow) ||
            (prov.rfc && prov.rfc.toLowerCase().includes(searchLow)) ||
            (prov.contactName && prov.contactName.toLowerCase().includes(searchLow)) ||
            (prov.notes && prov.notes.toLowerCase().includes(searchLow));
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

    const handleSaveAdjustment = (id, amount, reason, reference, providerId, unitCost) => {
        adjustStock(id, amount, reason, reference, providerId, unitCost);
        setAdjustModalOpen(false);
    };

    // --- Provider Handlers ---
    const handleCreateProvider = () => {
        setSelectedProvider(null);
        setProviderModalOpen(true);
    };

    const handleEditProvider = (provider) => {
        setSelectedProvider(provider);
        setProviderModalOpen(true);
    };

    const handleDeleteProvider = (provider) => {
        setProviderToDelete(provider);
    };

    const confirmDeleteProvider = () => {
        if (providerToDelete) {
            deleteProvider(providerToDelete.id);
            setProviderToDelete(null);
        }
    };

    const handleSaveProvider = (data) => {
        if (selectedProvider) {
            updateProvider(selectedProvider.id, data);
        } else {
            addProvider(data);
        }
        setProviderModalOpen(false);
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
                <button
                    onClick={() => setActiveTab("providers")}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === "providers"
                        ? "bg-white dark:bg-slate-700 text-cyan-600 dark:text-cyan-400 shadow-sm"
                        : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                        }`}
                >
                    Proveedores
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
                            placeholder={activeTab === "providers" ? "Buscar proveedor..." : "Buscar artículo..."}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-20 py-2.5 bg-transparent text-sm outline-none text-slate-700 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 w-64 md:w-80"
                        />
                        <div className="absolute right-1">
                            {activeTab === "providers" || activeTab === "chart" || activeTab === "summary" || activeTab === "movements" ? null : (
                                <InventoryFilterDropdown
                                    categories={categories}
                                    selectedCategory={selectedCategory}
                                    onApply={setSelectedCategory}
                                />
                            )}
                        </div>
                    </div>

                    {/* 📅 Date & Chart Extra Filters */}
                    {(activeTab === "chart" || activeTab === "summary" || activeTab === "movements") && (
                        <>
                            <div className="w-64 z-50">
                                <Datepicker
                                    value={dateRange}
                                    onChange={setDateRange}
                                    showShortcuts={true}
                                    useRange={true}
                                    displayFormat={"DD/MM/YYYY"}
                                    i18n={"es"}
                                    inputClassName="w-full pl-4 pr-10 py-2.5 bg-white dark:bg-dark border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-cyan-500/50"
                                    placeholder="Rango de fechas..."
                                />
                            </div>
                            {activeTab === "chart" && (
                                <div className="relative z-40">
                                    <select
                                        value={chartType}
                                        onChange={(e) => setChartType(e.target.value)}
                                        className="w-full pl-4 pr-10 py-2.5 bg-white dark:bg-dark border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-cyan-500/50 appearance-none cursor-pointer font-medium"
                                    >
                                        <option value="Movimientos por Tipo">Movimientos por Tipo</option>
                                        <option value="Entradas vs Salidas">Entradas vs Salidas</option>
                                        <option value="Stock por Categoría">Stock por Categoría</option>
                                        <option value="Stock por Proveedor">Stock por Proveedor</option>
                                        <option value="Gasto por Proveedor">Gasto por Proveedor</option>
                                    </select>
                                    <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-slate-500">
                                        <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd"></path></svg>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                <div className="flex flex-col justify-end">
                    {activeTab === "providers" ? (
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={handleCreateProvider}
                            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-sky-500 transition shadow-lg shadow-primary/20 cursor-pointer"
                        >
                            <PlusCircle size={18} />
                            <span>Registrar Proveedor</span>
                        </motion.button>
                    ) : (
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={handleCreateNew}
                            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-sky-500 transition shadow-lg shadow-primary/20 cursor-pointer"
                        >
                            <PlusCircle size={18} />
                            <span>Registrar Artículo</span>
                        </motion.button>
                    )}
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
                        <InventoryChart
                            movements={filteredMovements}
                            allMovements={movements}
                            items={filteredItems}
                            providers={providers}
                            chartType={chartType}
                        />
                    </div>
                ) : activeTab === "movements" ? (
                    <div className="bg-white dark:bg-secondary rounded-xl shadow-soft overflow-hidden border border-slate-200 dark:border-slate-700">
                        <MovementsTable movements={filteredMovements} />
                    </div>
                ) : activeTab === "summary" ? (
                    <div className="bg-white dark:bg-secondary p-6 rounded-xl shadow-soft border border-slate-200 dark:border-slate-700">
                        <InventorySummary
                            items={filteredItems}
                            movements={filteredMovements}
                            allMovements={movements}
                            providers={providers}
                        />
                    </div>
                ) : activeTab === "providers" ? (
                    <div className="bg-white dark:bg-secondary rounded-xl shadow-soft overflow-hidden border border-slate-200 dark:border-slate-700">
                        <ProvidersTable
                            providers={filteredProviders}
                            onEdit={handleEditProvider}
                            onDelete={handleDeleteProvider}
                        />
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
                    providers={providers}
                    onClose={() => setAdjustModalOpen(false)}
                    onSave={(amount, reason, reference, providerId, unitCost) => handleSaveAdjustment(selectedItem.id, amount, reason, reference, providerId, unitCost)}
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

            <ConfirmDialog
                open={!!providerToDelete}
                title="Eliminar proveedor"
                message={`¿Seguro que deseas eliminar el proveedor '${providerToDelete?.name}'?`}
                onConfirm={confirmDeleteProvider}
                onCancel={() => setProviderToDelete(null)}
                confirmLabel="Eliminar"
                cancelLabel="Cancelar"
                confirmVariant="error"
            />

            {isProviderModalOpen && (
                <CreateEditProviderModal
                    provider={selectedProvider}
                    onClose={() => setProviderModalOpen(false)}
                    onSave={handleSaveProvider}
                />
            )}
        </div>
    );
}
