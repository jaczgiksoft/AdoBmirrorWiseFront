import { useRef, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useHotkeys } from "@/hooks/useHotkeys";
import { useToastStore } from "@/store/useToastStore";
import { ConfirmDialog } from "@/components/feedback";
import { getDatatable, remove } from "@/services/elasticType.service";
import ElasticTypeForm from "./ElasticTypeForm";
import { PlusCircle, ChevronLeft, Search, Home, Activity, Edit2, Trash2 } from "lucide-react";
import { Pagination } from "@/components/ui";

export default function ElasticTypeList() {
    const navigate = useNavigate();
    const [elastics, setElastics] = useState([]);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({ totalPages: 1 });

    const [confirmOpen, setConfirmOpen] = useState(false);
    const [elasticToDelete, setElasticToDelete] = useState(null);

    const [showForm, setShowForm] = useState(false);
    const [elasticToEdit, setElasticToEdit] = useState(null);

    const searchRef = useRef(null);
    const { addToast } = useToastStore();
    const limit = 10;

    useEffect(() => {
        const delay = setTimeout(() => {
            if (searchTerm.length === 0 || searchTerm.length >= 3) {
                setDebouncedSearch(searchTerm);
            }
        }, 400);
        return () => clearTimeout(delay);
    }, [searchTerm]);

    useEffect(() => {
        loadElastics();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, debouncedSearch]);

    async function loadElastics() {
        try {
            setLoading(true);
            const start = (page - 1) * limit;
            const res = await getDatatable({
                start,
                length: limit,
                searchValue: debouncedSearch,
                orderColumn: "name",
                orderDir: "ASC",
            });

            const dataList = res.data || [];
            const totalRecords = res.recordsFiltered || 0;

            setElastics(dataList);
            setPagination({
                total: totalRecords,
                totalPages: Math.ceil(totalRecords / limit) || 1,
            });
            setSelectedIndex(0);
            setError(null);
        } catch (err) {
            console.error("❌ Error al cargar elásticos:", err);
            setError("No se pudieron cargar los tipos de elásticos.");
            addToast({
                type: "error",
                title: "Error de conexión",
                message: "No se pudo obtener la lista de elásticos.",
            });
        } finally {
            setLoading(false);
        }
    }

    useHotkeys(
        {
            escape: () => {
                if (confirmOpen || showForm) return "prevent";
                navigate("/settings", { state: { from: "/settings/patient-elastics" } });
            },
            arrowdown: (e) => {
                if (confirmOpen || showForm) return "prevent";
                e.preventDefault();
                setSelectedIndex((prev) => (prev + 1) % elastics.length);
            },
            arrowup: (e) => {
                if (confirmOpen || showForm) return "prevent";
                e.preventDefault();
                setSelectedIndex((prev) => (prev - 1 + elastics.length) % elastics.length);
            },
            arrowleft: (e) => {
                if (confirmOpen || showForm) return "prevent";
                e.preventDefault();
                if (page > 1) setPage((p) => p - 1);
            },
            arrowright: (e) => {
                if (confirmOpen || showForm) return "prevent";
                e.preventDefault();
                if (page < pagination.totalPages) setPage((p) => p + 1);
            },
            enter: (e) => {
                if (confirmOpen || showForm) return "prevent";
                e.preventDefault();
                const elastic = elastics[selectedIndex];
                if (elastic) handleEditClick(elastic);
            },
            f12: (e) => {
                if (confirmOpen) return "prevent";
                e.preventDefault();
                handleCreateClick();
            },
            delete: (e) => {
                e.preventDefault();
                const elastic = elastics[selectedIndex];
                if (elastic) handleDeleteClick(elastic);
            },
            f1: (e) => {
                if (confirmOpen || showForm) return "prevent";
                e.preventDefault();
                searchRef.current?.focus();
                searchRef.current?.select();
                return "prevent";
            },
        },
        [elastics, selectedIndex, confirmOpen, showForm]
    );

    useEffect(() => {
        document.title = "Tipos de Elásticos | BWISE";
    }, []);

    const handleCreateClick = () => {
        setElasticToEdit(null);
        setShowForm(true);
    };

    const handleEditClick = (elastic) => {
        setElasticToEdit(elastic);
        setShowForm(true);
    };

    const handleDeleteClick = (elastic) => {
        setElasticToDelete(elastic);
        setConfirmOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!elasticToDelete) return;
        try {
            await remove(elasticToDelete.id);
            setElastics((prev) => prev.filter((s) => s.id !== elasticToDelete.id));
            setConfirmOpen(false);
            setElasticToDelete(null);

            addToast({
                type: "success",
                title: "Elástico eliminado",
                message: `"${elasticToDelete.name}" fue eliminado correctamente.`,
            });

            if (elastics.length === 1 && page > 1) {
                setPage(p => p - 1);
            } else if (elastics.length === 1) {
                loadElastics();
            }
        } catch (err) {
            console.error("❌ Error al eliminar elástico:", err);
            addToast({
                type: "error",
                title: "Error al eliminar",
                message: err.message || "No se pudo eliminar el elástico.",
            });
        }
    };

    const handleFormSaved = () => {
        loadElastics();
    };

    if (loading && elastics.length === 0) {
        return (
            <div className="flex h-screen items-center justify-center text-slate-400">
                <p>Cargando catálogo...</p>
            </div>
        );
    }

    return (
        <div className="bg-slate-50 dark:bg-dark flex flex-col font-sans text-slate-900 dark:text-slate-50 h-full">
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="w-full max-w-5xl mx-auto px-6 mt-6 pb-6"
            >
                <div className="flex items-center gap-4 mb-6 flex-wrap">
                    <button
                        onClick={() => navigate("/settings", { state: { from: "/settings/patient-elastics" } })}
                        className="flex items-center gap-1 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition cursor-pointer"
                        title="Ir al panel principal"
                    >
                        <Home size={18} />
                        <ChevronLeft size={16} />
                    </button>

                    <h1 className="text-2xl font-semibold text-primary leading-none flex-1">
                        Catálogo de elásticos
                    </h1>

                    <div className="relative flex items-center bg-white dark:bg-secondary rounded-lg border border-slate-200 dark:border-slate-700 w-64">
                        <Search size={16} className="absolute left-2 text-slate-400" />
                        <input
                            ref={searchRef}
                            type="text"
                            placeholder="Buscar elástico..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-8 pr-3 py-1.5 bg-transparent text-slate-800 dark:text-slate-200 text-sm outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500"
                        />
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={handleCreateClick}
                        className="flex items-center gap-2 bg-primary text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-sky-500 transition shadow-lg shadow-sky-500/20"
                    >
                        <PlusCircle size={18} />
                        <span className="opacity-70 font-mono text-xs">F12</span>
                        <span>Nuevo elástico</span>
                    </motion.button>
                </div>

                {elastics.length === 0 ? (
                    <div className="text-center py-20 bg-white dark:bg-secondary/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                        <Activity className="mx-auto text-slate-600 mb-2" size={40} />
                        <p className="text-slate-400 mb-1">No se encontraron elásticos.</p>
                        <p className="text-xs text-slate-500">Intenta otra búsqueda o agrega uno nuevo.</p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-2">
                        {elastics.map((elastic, index) => {
                            const isSelected = index === selectedIndex;
                            return (
                                <motion.div
                                    key={elastic.id}
                                    layoutId={`elastic-${elastic.id}`}
                                    onClick={() => handleEditClick(elastic)}
                                    className={`relative flex items-center justify-between bg-white dark:bg-secondary rounded-xl px-4 py-3 cursor-pointer border transition-all group overflow-hidden
                                        ${isSelected ? "border-primary ring-1 ring-primary/40" : "border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500"}
                                    `}
                                >
                                    <div
                                        className="absolute left-0 top-0 bottom-0 w-1.5"
                                        style={{ backgroundColor: elastic.color || "#333" }}
                                    />

                                    <div className="flex items-center gap-4 ml-2">
                                        <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-dark/50 flex items-center justify-center text-slate-400 border border-slate-200 dark:border-slate-700">
                                            <Activity size={20} style={{ color: elastic.color }} />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-slate-900 dark:text-slate-100">{elastic.name}</p>
                                            <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                                                <span className="bg-slate-700/50 px-1.5 rounded">
                                                    {elastic.type}
                                                </span>
                                                <span>
                                                    Tamaño: {elastic.size}
                                                </span>
                                                <span>
                                                    Fuerza: {elastic.oz}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <div className={`flex items-center gap-2 transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleEditClick(elastic); }}
                                                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-400 hover:text-slate-800 dark:hover:text-white transition"
                                                title="Editar"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleDeleteClick(elastic); }}
                                                className="p-2 hover:bg-red-500/20 rounded-lg text-slate-400 hover:text-red-400 transition"
                                                title="Eliminar"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}

                {pagination.totalPages > 1 && (
                    <div className="mt-4">
                        <Pagination
                            page={page}
                            totalPages={pagination.totalPages}
                            onPageChange={setPage}
                        />
                    </div>
                )}
            </motion.div>

            <ElasticTypeForm
                open={showForm}
                onClose={() => setShowForm(false)}
                onSaved={handleFormSaved}
                elasticToEdit={elasticToEdit}
            />

            <ConfirmDialog
                open={confirmOpen}
                title="Eliminar tipo de elástico"
                message={
                    elasticToDelete
                        ? `¿Estás seguro de que deseas eliminar el tipo de elástico "${elasticToDelete.name}"?`
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
