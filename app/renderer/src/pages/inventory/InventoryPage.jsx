import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Package, PlusCircle, Search, Edit2, Diff, Trash2, Image as ImageIcon, ArrowDown, ArrowUp, XCircle, AlertTriangle, RefreshCcw } from "lucide-react";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/layout";
import { ConfirmDialog } from "@/components/feedback";
import { Table, Pagination } from "@/components/ui";
import { useInventory } from "./hooks/useInventory";
import CreateEditItemModal from "./components/CreateEditItemModal";
import AdjustStockModal from "./components/AdjustStockModal";
import InventoryChart from "./components/InventoryChart";
import InventoryFilterDropdown from "./components/InventoryFilterDropdown";
import InventorySummary from "./components/InventorySummary";
import CreateEditProviderModal from "./components/CreateEditProviderModal";
import Datepicker from "react-tailwindcss-datepicker";
import { API_BASE } from "@/utils/apiBase";


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
    const [activeTab, setActiveTab] = useState("table"); // "table", "movements", "summary", "chart", "providers"

    // DATE RANGE FILTER STATE
    const [dateRange, setDateRange] = useState({
        startDate: null,
        endDate: null
    });

    // CHART STATE
    const [chartType, setChartType] = useState("Movimientos por Tipo");

    // Pagination & Sorting States
    const ITEMS_PER_PAGE = 10;
    const [currentPage, setCurrentPage] = useState(1);
    const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

    // Selected item for edits/adjustments
    const [selectedItem, setSelectedItem] = useState(null);
    const [selectedProvider, setSelectedProvider] = useState(null);

    // Delete confirmation state
    const [itemToDelete, setItemToDelete] = useState(null);
    const [providerToDelete, setProviderToDelete] = useState(null);

    // Reset pagination when tab or filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [activeTab, searchTerm, selectedCategory, dateRange]);

    // Helpers
    const formatDate = (dateString, showTime = true) => {
        if (!dateString) return "N/A";
        const options = {
            day: "2-digit",
            month: "short",
            year: "numeric",
        };
        if (showTime) {
            options.hour = "2-digit";
            options.minute = "2-digit";
        }
        return new Date(dateString).toLocaleDateString("es-MX", options);
    };

    const handleSort = (key) => {
        let direction = "asc";
        if (sortConfig.key === key && sortConfig.direction === "asc") {
            direction = "desc";
        }
        setSortConfig({ key, direction });
    };

    const applySorting = (data, config) => {
        if (!config.key) return data;
        return [...data].sort((a, b) => {
            const aValue = (a[config.key] || "").toString().toLowerCase();
            const bValue = (b[config.key] || "").toString().toLowerCase();
            if (aValue < bValue) return config.direction === "asc" ? -1 : 1;
            if (aValue > bValue) return config.direction === "asc" ? 1 : -1;
            return 0;
        });
    };

    // --- Tab-specific configurations ---

    // 1. ITEMS VIEW
    const filteredItems = items.filter(item => {
        const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;
        const searchLow = searchTerm.toLowerCase();
        const matchesSearch =
            (item.name?.toLowerCase().includes(searchLow)) ||
            (item.category?.toLowerCase().includes(searchLow)) ||
            (item.sku?.toLowerCase().includes(searchLow));
        return matchesCategory && matchesSearch;
    });

    const sortedItems = applySorting(filteredItems, sortConfig.key ? sortConfig : { key: "name", direction: "asc" });
    const paginatedItems = sortedItems.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    const itemColumns = [
        {
            header: "Img",
            accessor: "image",
            render: (row) => (
                <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700">
                    {row.image ? <img src={row.image.startsWith('http') ? row.image : `${API_BASE}/${row.image}`} alt="" className="w-full h-full object-cover" /> : <ImageIcon size={18} className="text-slate-400" />}

                </div>
            )
        },
        {
            header: "Producto",
            accessor: "name",
            sortable: true,
            render: (row) => (
                <div className="flex flex-col">
                    <span className="text-xs font-bold text-cyan-600 dark:text-cyan-400 font-mono tracking-tight">{row.sku || "N/A"}</span>
                    <span className="font-bold text-slate-800 dark:text-slate-100">{row.name}</span>
                </div>
            )
        },
        { header: "Unidad", accessor: "unit", sortable: true },
        {
            header: "Categoría",
            accessor: "category",
            sortable: true,
            render: (row) => <span className="px-2 py-0.5 rounded text-xs bg-slate-100 dark:bg-slate-700">{row.category}</span>
        },
        {
            header: "Stock",
            accessor: "quantity",
            sortable: true,
            render: (row) => {
                const isLowStock = row.min_stock !== null && row.quantity <= row.min_stock;
                return (
                    <div className="flex items-center gap-2">
                        <span className={`font-bold ${isLowStock ? 'text-red-500' : ''}`}>{row.quantity}</span>
                        {isLowStock && <div className="w-2 h-2 rounded-full bg-red-500" title={`Bajo stock (min: ${row.min_stock})`} />}
                    </div>
                );
            }
        },
        {
            header: "Última Act.",
            accessor: "lastUpdate",
            sortable: true,
            render: (row) => <span className="text-xs text-slate-500">{formatDate(row.lastUpdate)}</span>
        },
        {
            header: "Acciones",
            accessor: "actions",
            render: (row) => (
                <div className="flex items-center gap-2">
                    <button onClick={() => handleAdjust(row)} className="p-1.5 text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded" title="Ajustar Stock"><Diff size={18} /></button>
                    <button onClick={() => handleEdit(row)} className="p-1.5 text-cyan-600 hover:bg-cyan-50 dark:hover:bg-cyan-500/10 rounded" title="Editar"><Edit2 size={18} /></button>
                    <button onClick={() => handleDelete(row)} className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded" title="Eliminar"><Trash2 size={18} /></button>
                </div>
            )
        }
    ];

    // 2. MOVEMENTS VIEW
    const filteredMovements = movements.filter(mov => {
        const searchLow = searchTerm.toLowerCase();
        const matchesSearch =
            (mov.itemName?.toLowerCase().includes(searchLow)) ||
            (mov.itemSku?.toLowerCase().includes(searchLow)) ||
            (mov.type?.toLowerCase().includes(searchLow));

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

    const sortedMovements = applySorting(filteredMovements, sortConfig.key ? sortConfig : { key: "date", direction: "desc" });
    const paginatedMovements = sortedMovements.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    const getTypeConfig = (type) => {
        switch (type) {
            case "Entrada": return { bg: "bg-green-100 dark:bg-green-900/30", text: "text-green-700 dark:text-green-400", icon: <ArrowUp size={14} /> };
            case "Salida": return { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-400", icon: <ArrowDown size={14} /> };
            case "Merma": return { bg: "bg-orange-100 dark:bg-orange-900/30", text: "text-orange-700 dark:text-orange-400", icon: <AlertTriangle size={14} /> };
            case "Devolucion": return { bg: "bg-purple-100 dark:bg-purple-900/30", text: "text-purple-700 dark:text-purple-400", icon: <RefreshCcw size={14} /> };
            case "Caducado": return { bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-700 dark:text-red-400", icon: <XCircle size={14} /> };
            default: return { bg: "bg-slate-100 dark:bg-slate-800", text: "text-slate-700 dark:text-slate-300", icon: null };
        }
    };

    const movementColumns = [
        {
            header: "Producto",
            accessor: "itemName",
            sortable: true,
            render: (row) => (
                <div className="flex flex-col">
                    <span className="text-xs font-bold text-cyan-600 dark:text-cyan-400 font-mono tracking-tight">{row.itemSku || "N/A"}</span>
                    <span className="font-bold text-slate-800 dark:text-slate-100">{row.itemName}</span>
                </div>
            )
        },
        {
            header: "Tipo",
            accessor: "type",
            sortable: true,
            render: (row) => {
                const config = getTypeConfig(row.type);
                return (
                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-bold ${config.bg} ${config.text}`}>
                        {config.icon} {row.type}
                    </span>
                );
            }
        },
        { header: "Proveedor", accessor: "providerName", sortable: true },
        {
            header: "Cantidad",
            accessor: "quantity",
            sortable: true,
            render: (row) => (
                <span className={`font-bold ${row.quantity > 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {row.quantity > 0 ? `+${row.quantity}` : row.quantity}
                </span>
            )
        },
        {
            header: "Precio Unit.",
            accessor: "unitPrice",
            sortable: true,
            render: (row) => <span>${row.unitPrice?.toFixed(2) || "0.00"}</span>
        },
        {
            header: "Fecha",
            accessor: "date",
            sortable: true,
            render: (row) => <span className="text-xs text-slate-500">{formatDate(row.date)}</span>
        }
    ];

    // 3. PROVIDERS VIEW
    const filteredProviders = providers.filter(prov => {
        const searchLow = searchTerm.toLowerCase();
        return (prov.name?.toLowerCase().includes(searchLow)) ||
            (prov.rfc?.toLowerCase().includes(searchLow)) ||
            (prov.contactName?.toLowerCase().includes(searchLow));
    });

    const sortedProviders = applySorting(filteredProviders, sortConfig.key ? sortConfig : { key: "name", direction: "asc" });
    const paginatedProviders = sortedProviders.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    const providerColumns = [
        {
            header: "Proveedor",
            accessor: "name",
            sortable: true,
            render: (row) => (
                <div className="flex flex-col">
                    <span className="font-bold text-slate-800 dark:text-slate-100">{row.name}</span>
                    <span className="text-[10px] text-slate-500 line-clamp-1">{row.notes}</span>
                </div>
            )
        },
        { header: "Contacto", accessor: "contactName", sortable: true },
        {
            header: "Teléfono / Correo",
            accessor: "email",
            render: (row) => (
                <div className="flex flex-col">
                    <span className="text-xs font-medium">{row.phone || "-"}</span>
                    <span className="text-[10px] text-slate-500">{row.email || "-"}</span>
                </div>
            )
        },
        { header: "RFC", accessor: "rfc", sortable: true },
        {
            header: "Acciones",
            accessor: "actions",
            render: (row) => (
                <div className="flex items-center gap-2">
                    <button onClick={() => handleEditProvider(row)} className="p-1.5 text-cyan-600 hover:bg-cyan-50 dark:hover:bg-cyan-500/10 rounded" title="Editar"><Edit2 size={18} /></button>
                    <button onClick={() => handleDeleteProvider(row)} className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded" title="Eliminar"><Trash2 size={18} /></button>
                </div>
            )
        }
    ];

    // Handlers
    const handleCreateNew = () => { setSelectedItem(null); setCreateEditModalOpen(true); };
    const handleEdit = (item) => { setSelectedItem(item); setCreateEditModalOpen(true); };
    const handleAdjust = (item) => { setSelectedItem(item); setAdjustModalOpen(true); };
    const handleDelete = (item) => setItemToDelete(item);
    const confirmDelete = () => { if (itemToDelete) { deleteItem(itemToDelete.id); setItemToDelete(null); } };
    const handleSaveItem = (data) => { if (selectedItem) updateItem(selectedItem.id, data); else addItem(data); setCreateEditModalOpen(false); };
    const handleSaveAdjustment = (id, amount, reason, reference, providerId, unitCost) => { adjustStock(id, amount, reason, reference, providerId, unitCost); setAdjustModalOpen(false); };
    const handleCreateProvider = () => { setSelectedProvider(null); setProviderModalOpen(true); };
    const handleEditProvider = (provider) => { setSelectedProvider(provider); setProviderModalOpen(true); };
    const handleDeleteProvider = (provider) => setProviderToDelete(provider);
    const confirmDeleteProvider = () => { if (providerToDelete) { deleteProvider(providerToDelete.id); setProviderToDelete(null); } };
    const handleSaveProvider = (data) => { if (selectedProvider) updateProvider(selectedProvider.id, data); else addProvider(data); setProviderModalOpen(false); };

    return (
        <div className="bg-slate-50 dark:bg-dark min-h-screen flex flex-col font-sans text-slate-900 dark:text-slate-50 p-6 max-w-7xl mx-auto space-y-6">
            <PageHeader
                icon={Package}
                title="Inventario"
                subtitle="Gestión de suministros e insumos del consultorio"
                onBack={() => navigate("/dashboard")}
            />

            {/* TAB NAVIGATION */}
            <div className="flex items-center gap-1 bg-white dark:bg-secondary p-1 rounded-xl border border-slate-200 dark:border-slate-700 w-fit shadow-sm">
                {[
                    { id: "table", label: "Artículos" },
                    { id: "movements", label: "Movimientos" },
                    { id: "summary", label: "Resumen" },
                    { id: "chart", label: "Análisis" },
                    { id: "providers", label: "Proveedores" }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === tab.id
                            ? "bg-primary text-white shadow-md"
                            : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Filters & Search */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                    <div className="relative flex items-center bg-white dark:bg-secondary rounded-lg border border-slate-200 dark:border-slate-700 transition-all focus-within:ring-2 focus-within:ring-primary/50 shadow-sm">
                        <Search size={16} className="absolute left-3 text-slate-500" />
                        <input
                            type="text"
                            placeholder={`Buscar ${activeTab === "providers" ? "proveedor" : "artículo"}...`}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-20 py-2.5 bg-transparent text-slate-800 dark:text-slate-200 text-sm outline-none placeholder:text-slate-500 w-64 md:w-80"
                        />
                        <div className="absolute right-1">
                            {activeTab === "table" && (
                                <InventoryFilterDropdown
                                    categories={categories}
                                    selectedCategory={selectedCategory}
                                    onApply={setSelectedCategory}
                                />
                            )}
                        </div>
                    </div>

                    {(activeTab === "chart" || activeTab === "summary" || activeTab === "movements") && (
                        <div className="w-64 z-50 shadow-sm">
                            <Datepicker
                                value={dateRange}
                                onChange={setDateRange}
                                showShortcuts={true}
                                useRange={true}
                                displayFormat={"DD/MM/YYYY"}
                                i18n={"es"}
                                inputClassName="w-full pl-4 pr-10 py-2.5 bg-white dark:bg-dark border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-primary/50"
                                placeholder="Rango de fechas..."
                            />
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-3">
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

            {/* Main Content Areas */}
            <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="flex-1"
            >
                {activeTab === "table" ? (
                    <div className="space-y-4">
                        <Table
                            columns={itemColumns}
                            data={paginatedItems}
                            sortConfig={sortConfig}
                            onSort={handleSort}
                            emptyMessage="No se encontraron artículos que coincidan con la búsqueda."
                        />
                        <Pagination
                            page={currentPage}
                            totalPages={Math.ceil(filteredItems.length / ITEMS_PER_PAGE)}
                            onPageChange={setCurrentPage}
                        />
                    </div>
                ) : activeTab === "movements" ? (
                    <div className="space-y-4">
                        <Table
                            columns={movementColumns}
                            data={paginatedMovements}
                            sortConfig={sortConfig}
                            onSort={handleSort}
                            emptyMessage="No hay movimientos registrados en este periodo."
                        />
                        <Pagination
                            page={currentPage}
                            totalPages={Math.ceil(filteredMovements.length / ITEMS_PER_PAGE)}
                            onPageChange={setCurrentPage}
                        />
                    </div>
                ) : activeTab === "providers" ? (
                    <div className="space-y-4">
                        <Table
                            columns={providerColumns}
                            data={paginatedProviders}
                            sortConfig={sortConfig}
                            onSort={handleSort}
                            emptyMessage="No hay proveedores registrados."
                        />
                        <Pagination
                            page={currentPage}
                            totalPages={Math.ceil(filteredProviders.length / ITEMS_PER_PAGE)}
                            onPageChange={setCurrentPage}
                        />
                    </div>
                ) : activeTab === "summary" ? (
                    <InventorySummary items={filteredItems} movements={filteredMovements} allMovements={movements} providers={providers} />
                ) : activeTab === "chart" ? (
                    <div className="bg-white dark:bg-secondary p-6 rounded-xl shadow-soft border border-slate-200 dark:border-slate-700">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider">Análisis de Inventario</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Visualización de datos y tendencias</p>
                            </div>
                            <div className="relative">
                                <select
                                    value={chartType}
                                    onChange={(e) => setChartType(e.target.value)}
                                    className="pl-4 pr-10 py-2 bg-slate-50 dark:bg-dark border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/50 appearance-none cursor-pointer"
                                >
                                    <option value="Movimientos por Tipo">Movimientos por Tipo</option>
                                    <option value="Entradas vs Salidas">Entradas vs Salidas</option>
                                    <option value="Stock por Categoría">Stock por Categoría</option>
                                    <option value="Stock por Proveedor">Stock por Proveedor</option>
                                    <option value="Gasto por Proveedor">Gasto por Proveedor</option>
                                </select>
                            </div>
                        </div>
                        <InventoryChart movements={filteredMovements} allMovements={movements} items={filteredItems} providers={providers} chartType={chartType} />
                    </div>
                ) : null}
            </motion.div>

            {/* Modals */}
            {isCreateEditModalOpen && <CreateEditItemModal item={selectedItem} categories={categories} unitTypes={unitTypes} onClose={() => setCreateEditModalOpen(false)} onSave={handleSaveItem} />}
            {isAdjustModalOpen && selectedItem && <AdjustStockModal item={selectedItem} movementTypes={movementTypes} providers={providers} onClose={() => setAdjustModalOpen(false)} onSave={(amount, reason, reference, providerId, unitCost) => handleSaveAdjustment(selectedItem.id, amount, reason, reference, providerId, unitCost)} />}
            {isProviderModalOpen && <CreateEditProviderModal provider={selectedProvider} onClose={() => setProviderModalOpen(false)} onSave={handleSaveProvider} />}

            <ConfirmDialog open={!!itemToDelete} title="Eliminar artículo" message={`¿Seguro que deseas eliminar '${itemToDelete?.name}'?`} onConfirm={confirmDelete} onCancel={() => setItemToDelete(null)} confirmLabel="Eliminar" cancelLabel="Cancelar" confirmVariant="error" />
            <ConfirmDialog open={!!providerToDelete} title="Eliminar proveedor" message={`¿Seguro que deseas eliminar el proveedor '${providerToDelete?.name}'?`} onConfirm={confirmDeleteProvider} onCancel={() => setProviderToDelete(null)} confirmLabel="Eliminar" cancelLabel="Cancelar" confirmVariant="error" />
        </div>
    );
}
