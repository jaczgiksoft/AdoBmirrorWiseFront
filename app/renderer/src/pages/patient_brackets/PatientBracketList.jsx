import { useRef, useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useHotkeys } from "@/hooks/useHotkeys";
import { useToastStore } from "@/store/useToastStore";
import { ConfirmDialog } from "@/components/feedback";
import PatientBracketForm from "./PatientBracketForm";
import { PlusCircle, Search, Edit2, Trash2, Box, ChevronLeft, Loader2, RefreshCw, AlertCircle } from "lucide-react";
import { Pagination } from "@/components/ui";
import bracketTypeService from "@/services/bracket_type.service";

export default function PatientBracketList() {
    const navigate = useNavigate();
    const [items, setItems] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
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

    // 🔹 Cargar datos desde API
    const loadBrackets = useCallback(async (isRefreshing = false) => {
        if (!isRefreshing) setIsLoading(true);
        setError(null);
        try {
            const data = await bracketTypeService.getAll();
            setItems(data);
        } catch (err) {
            console.error("❌ Error al cargar brackets:", err);
            setError("No se pudieron cargar los tipos de brackets. Por favor, reintenta.");
            addToast({
                type: "error",
                title: "Error de conexión",
                message: "No se pudo obtener la información desde el servidor.",
            });
        } finally {
            setIsLoading(false);
        }
    }, [addToast]);

    useEffect(() => {
        loadBrackets();
        document.title = "Brackets de Pacientes | BWISE Dental";
    }, [loadBrackets]);

    // 🔹 Filtrado y Paginación
    const filteredItems = items.filter(bracket =>
        bracket.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (bracket.description && bracket.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const totalPages = Math.ceil(filteredItems.length / limit) || 1;
    const paginatedItems = filteredItems.slice((page - 1) * limit, page * limit);

    // 🎹 Atajos de teclado
    useHotkeys(
        {
            escape: () => {
                if (confirmOpen || showForm) return "prevent";
                navigate("/settings", { state: { from: "/settings/patient-brackets" } });
            },
            arrowdown: (e) => {
                if (confirmOpen || showForm || isLoading) return "prevent";
                e.preventDefault();
                setSelectedIndex((prev) => (prev + 1) % paginatedItems.length);
            },
            arrowup: (e) => {
                if (confirmOpen || showForm || isLoading) return "prevent";
                e.preventDefault();
                setSelectedIndex((prev) => (prev - 1 + paginatedItems.length) % paginatedItems.length);
            },
            enter: (e) => {
                if (confirmOpen || showForm || isLoading) return "prevent";
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
                if (confirmOpen || showForm || isLoading) return "prevent";
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
            f5: (e) => {
                e.preventDefault();
                loadBrackets(true);
            }
        },
        [paginatedItems, selectedIndex, confirmOpen, showForm, isLoading]
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

    const handleConfirmDelete = async () => {
        if (!itemToDelete) return;

        try {
            await bracketTypeService.delete(itemToDelete.id);
            
            addToast({
                type: "success",
                title: "Bracket eliminado",
                message: `"${itemToDelete.name}" fue eliminado correctamente.`,
            });
            
            // Recargar lista
            loadBrackets(true);
        } catch (err) {
            console.error("❌ Error al eliminar bracket:", err);
            addToast({
                type: "error",
                title: "Error al eliminar",
                message: "No se pudo eliminar el bracket. Intenta de nuevo.",
            });
        } finally {
            setConfirmOpen(false);
            setItemToDelete(null);
        }
    };

    const handleFormSaved = () => {
        setShowForm(false);
        loadBrackets(true);
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
                        onClick={() => navigate("/settings", { state: { from: "/settings/patient-brackets" } })}
                        className="flex items-center gap-1 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition cursor-pointer"
                        title="Ir al panel principal"
                    >
                        <ChevronLeft size={20} />
                        <span className="text-sm font-medium">Volver a Ajustes</span>
                    </button>

                    <h1 className="text-2xl font-bold text-primary leading-none flex-1">
                        Brackets de Pacientes
                    </h1>

                    {/* 🔍 Buscar */}
                    <div className="relative flex items-center bg-white dark:bg-secondary rounded-lg border border-slate-200 dark:border-slate-700 w-64 shadow-sm">
                        <Search size={16} className="absolute left-2 text-slate-400" />
                        <input
                            ref={searchRef}
                            type="text"
                            placeholder="Buscar bracket..."
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
                        <span>Nuevo Bracket</span>
                        <span className="opacity-50 font-mono text-[10px] bg-white/20 px-1 rounded ml-1">F12</span>
                    </motion.button>
                </div>

                {/* 📋 Tabla (Lista de Tarjetas) */}
                {isLoading && items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-secondary/30 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
                        <Loader2 className="animate-spin text-primary mb-4" size={40} />
                        <p className="text-slate-500 dark:text-slate-400 font-medium">Cargando catálogo de brackets...</p>
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-secondary/30 rounded-2xl border border-dashed border-red-300 dark:border-red-900/30">
                        <AlertCircle className="text-red-500 mb-4" size={48} />
                        <p className="text-red-600 dark:text-red-400 font-bold">{error}</p>
                        <button
                            onClick={() => loadBrackets()}
                            className="mt-6 flex items-center gap-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 px-4 py-2 rounded-lg transition text-sm font-semibold"
                        >
                            <RefreshCw size={16} />
                            Reintentar Carga
                        </button>
                    </div>
                ) : paginatedItems.length === 0 ? (
                    <div className="text-center py-20 bg-white dark:bg-secondary/30 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
                        <Box className="mx-auto text-slate-300 dark:text-slate-600 mb-4" size={56} />
                        <p className="text-slate-500 dark:text-slate-400 font-medium">No se encontraron brackets registrados.</p>
                        <p className="text-xs text-slate-400 mt-1 italic">Agrega una nueva marca o tipo de bracket.</p>
                    </div>
                ) : (
                    <div className="relative flex flex-col gap-3">
                        {/* Overlay de recarga sutil */}
                        <AnimatePresence>
                            {isLoading && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="absolute inset-0 bg-white/40 dark:bg-dark/40 backdrop-blur-[1px] z-10 flex items-start justify-center pt-10 rounded-xl"
                                >
                                    <div className="bg-white dark:bg-secondary px-4 py-2 rounded-full shadow-lg border border-slate-200 dark:border-slate-700 flex items-center gap-2">
                                        <Loader2 className="animate-spin text-primary" size={16} />
                                        <span className="text-xs font-bold text-primary">Actualizando...</span>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {paginatedItems.map((item, index) => {
                            const isSelected = index === selectedIndex;

                            return (
                                <motion.div
                                    key={item.id}
                                    layoutId={`patient-bracket-${item.id}`}
                                    onClick={() => handleEditClick(item)}
                                    // Borde con color dinámico
                                    style={{ borderLeftColor: item.color, borderLeftWidth: '6px' }}
                                    className={`relative flex items-center justify-between bg-white dark:bg-secondary rounded-xl px-5 py-4 cursor-pointer border-y border-r transition-all group overflow-hidden shadow-sm
                                        ${isSelected
                                            ? "ring-2 ring-primary/20 border-slate-300 dark:border-slate-600 scale-[1.01]"
                                            : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"}
                                    `}
                                >
                                    <div className="flex items-center gap-5">
                                        <div
                                            className="w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-md transition-all group-hover:shadow-lg"
                                            style={{ backgroundColor: item.color }}
                                        >
                                            <Box size={24} />
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-900 dark:text-slate-50 text-lg">{item.name}</p>
                                            <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-1 max-w-md">
                                                {item.description || "Sin descripción técnica."}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <div className={`flex items-center gap-2 transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleEditClick(item); }}
                                                className="p-2.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl text-slate-400 hover:text-slate-800 dark:hover:text-white transition"
                                                title="Ver especificaciones"
                                            >
                                                <Edit2 size={18} />
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleDeleteClick(item); }}
                                                className="p-2.5 hover:bg-red-500/10 rounded-xl text-slate-400 hover:text-red-500 transition"
                                                title="Eliminar del catálogo"
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
            <PatientBracketForm
                open={showForm}
                onClose={() => setShowForm(false)}
                onSaved={handleFormSaved}
                itemToEdit={itemToEdit}
            />

            {/* Modal Confirmación Delete */}
            <ConfirmDialog
                open={confirmOpen}
                title="Eliminar bracket"
                message={
                    itemToDelete
                        ? `¿Estás seguro de que deseas eliminar el bracket "${itemToDelete.name}" del catálogo?`
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
