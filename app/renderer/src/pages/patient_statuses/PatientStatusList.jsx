import { useRef, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useHotkeys } from "@/hooks/useHotkeys";
import { useToastStore } from "@/store/useToastStore";
import { ConfirmDialog } from "@/components/feedback";
import PatientStatusForm from "./PatientStatusForm";
import { PlusCircle, Search, Activity, Edit2, Trash2, ChevronLeft } from "lucide-react";
import { Pagination } from "@/components/ui";

const STORAGE_KEY = "bwise_patient_statuses_mock_data";

const DEFAULT_STATUSES = [
    { id: 1, name: "Activo", color: "#10b981" },
    { id: 2, name: "Inactivo", color: "#64748b" },
    { id: 3, name: "Pendiente", color: "#f59e0b" },
    { id: 4, name: "Finalizado", color: "#3b82f6" },
    { id: 5, name: "Moroso", color: "#ef4444" }
];

export default function PatientStatusList() {
    const navigate = useNavigate();
    const [items, setItems] = useState([]);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [searchTerm, setSearchTerm] = useState("");
    const [page, setPage] = useState(1);
    const limit = 10;

    // Estados para modales
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [itemToEdit, setItemToEdit] = useState(null);

    const searchRef = useRef(null);
    const { addToast } = useToastStore();

    // 🔹 Cargar datos desde localStorage
    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            setItems(JSON.parse(stored));
        } else {
            setItems(DEFAULT_STATUSES);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_STATUSES));
        }
        document.title = "Estados de Pacientes | BWISE Dental";
    }, []);

    // 🔹 Filtrado y Paginación
    const filteredItems = items.filter(status => 
        status.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalPages = Math.ceil(filteredItems.length / limit) || 1;
    const paginatedItems = filteredItems.slice((page - 1) * limit, page * limit);

    // 🎹 Atajos de teclado
    useHotkeys(
        {
            escape: () => {
                if (confirmOpen || showForm) return "prevent";
                navigate("/settings");
            },
            arrowdown: (e) => {
                if (confirmOpen || showForm) return "prevent";
                e.preventDefault();
                setSelectedIndex((prev) => (prev + 1) % paginatedItems.length);
            },
            arrowup: (e) => {
                if (confirmOpen || showForm) return "prevent";
                e.preventDefault();
                setSelectedIndex((prev) => (prev - 1 + paginatedItems.length) % paginatedItems.length);
            },
            enter: (e) => {
                if (confirmOpen || showForm) return "prevent";
                e.preventDefault();
                const item = paginatedItems[selectedIndex];
                if (item) handleEditClick(item);
            },
            f12: (e) => {
                if (confirmOpen || showForm) return "prevent";
                e.preventDefault();
                handleCreateClick();
            },
            delete: (e) => {
                if (confirmOpen || showForm) return "prevent";
                e.preventDefault();
                const item = paginatedItems[selectedIndex];
                if (item) handleDeleteClick(item);
            },
            f1: (e) => {
                if (confirmOpen || showForm) return "prevent";
                e.preventDefault();
                searchRef.current?.focus();
                searchRef.current?.select();
                return "prevent";
            },
        },
        [paginatedItems, selectedIndex, confirmOpen, showForm]
    );

    // 🛠 Handlers
    const handleCreateClick = () => {
        setItemToEdit(null);
        setShowForm(true);
    };

    const handleEditClick = (item) => {
        setItemToEdit(item);
        setShowForm(true);
    };

    const handleDeleteClick = (item) => {
        setItemToDelete(item);
        setConfirmOpen(true);
    };

    const handleConfirmDelete = () => {
        if (!itemToDelete) return;
        const newItems = items.filter(i => i.id !== itemToDelete.id);
        setItems(newItems);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newItems));
        
        setConfirmOpen(false);
        setItemToDelete(null);

        addToast({
            type: "success",
            title: "Estado eliminado",
            message: `"${itemToDelete.name}" fue eliminado correctamente.`,
        });
    };

    const handleFormSaved = (savedItem) => {
        let newItems;
        if (itemToEdit) {
            newItems = items.map(i => i.id === savedItem.id ? savedItem : i);
        } else {
            newItems = [...items, savedItem];
        }
        
        setItems(newItems);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newItems));
        setShowForm(false);
    };

    return (
        <div className="bg-slate-50 dark:bg-dark flex flex-col font-sans text-slate-900 dark:text-slate-50 h-full">
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="w-full max-w-5xl mx-auto px-6 mt-6 pb-6"
            >
                {/* 🔙 Header + Buscador */}
                <div className="flex items-center gap-4 mb-6 flex-wrap">
                    <button
                        onClick={() => navigate("/settings")}
                        className="flex items-center gap-1 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition cursor-pointer"
                    >
                        <ChevronLeft size={20} />
                        <span className="text-sm font-medium">Volver a Ajustes</span>
                    </button>

                    <h1 className="text-2xl font-bold text-primary leading-none flex-1">
                        Estados de Pacientes
                    </h1>

                    {/* 🔍 Buscar */}
                    <div className="relative flex items-center bg-white dark:bg-secondary rounded-lg border border-slate-200 dark:border-slate-700 w-64 shadow-sm">
                        <Search size={16} className="absolute left-2 text-slate-400" />
                        <input
                            ref={searchRef}
                            type="text"
                            placeholder="Buscar estado..."
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setPage(1);
                                setSelectedIndex(0);
                            }}
                            className="w-full pl-8 pr-3 py-2 bg-transparent text-slate-800 dark:text-slate-200 text-sm outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500"
                        />
                    </div>

                    {/* ➕ Crear */}
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={handleCreateClick}
                        className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-sky-500 transition shadow-lg shadow-sky-500/20"
                    >
                        <PlusCircle size={18} />
                        <span>Nuevo Estado</span>
                        <span className="opacity-50 font-mono text-[10px] bg-white/20 px-1 rounded ml-1">F12</span>
                    </motion.button>
                </div>

                {/* 📋 Lista de Tarjetas */}
                {paginatedItems.length === 0 ? (
                    <div className="text-center py-20 bg-white dark:bg-secondary/30 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
                        <Activity className="mx-auto text-slate-300 dark:text-slate-600 mb-4" size={56} />
                        <p className="text-slate-500 dark:text-slate-400 font-medium">No se encontraron estados configurados.</p>
                        <p className="text-xs text-slate-400 mt-1">Registra un nuevo estado para clasificar a los pacientes.</p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-3">
                        {paginatedItems.map((item, index) => {
                            const isSelected = index === selectedIndex;

                            return (
                                <motion.div
                                    key={item.id}
                                    layoutId={`patient-status-${item.id}`}
                                    onClick={() => handleEditClick(item)}
                                    style={{ borderLeftColor: item.color, borderLeftWidth: '6px' }}
                                    className={`relative flex items-center justify-between bg-white dark:bg-secondary rounded-xl px-5 py-4 cursor-pointer border-y border-r transition-all group overflow-hidden shadow-sm
                                        ${isSelected 
                                            ? "ring-2 ring-primary/20 border-slate-300 dark:border-slate-600 shadow-md" 
                                            : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"}
                                    `}
                                >
                                    <div className="flex items-center gap-5">
                                        <div 
                                            className="w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-md transition-transform group-hover:scale-105"
                                            style={{ backgroundColor: item.color }}
                                        >
                                            <Activity size={24} />
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-900 dark:text-slate-50 text-lg uppercase tracking-tight">{item.name}</p>
                                            <p className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">{item.color}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <div className={`flex items-center gap-2 transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleEditClick(item); }}
                                                className="p-2.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl text-slate-400 hover:text-slate-800 dark:hover:text-white transition"
                                                title="Editar"
                                            >
                                                <Edit2 size={18} />
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleDeleteClick(item); }}
                                                className="p-2.5 hover:bg-red-500/10 rounded-xl text-slate-400 hover:text-red-500 transition"
                                                title="Eliminar"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}

                {/* 📄 Paginación */}
                {totalPages > 1 && (
                    <div className="mt-6">
                        <Pagination
                            page={page}
                            totalPages={totalPages}
                            onPageChange={setPage}
                        />
                    </div>
                )}
            </motion.div>

            {/* Modal Formulario */}
            <PatientStatusForm
                open={showForm}
                onClose={() => setShowForm(false)}
                onSaved={handleFormSaved}
                itemToEdit={itemToEdit}
            />

            {/* Modal Confirmación Delete */}
            <ConfirmDialog
                open={confirmOpen}
                title="Eliminar Estado"
                message={
                    itemToDelete
                        ? `¿Estás seguro de que deseas eliminar el estado "${itemToDelete.name}"?`
                        : ""
                }
                onConfirm={handleConfirmDelete}
                onCancel={() => setConfirmOpen(false)}
                confirmLabel="Eliminar"
                cancelLabel="Cancelar"
                confirmVariant="error"
            />
        </div>
    );
}
