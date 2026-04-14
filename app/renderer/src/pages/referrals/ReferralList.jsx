import { useRef, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useHotkeys } from "@/hooks/useHotkeys";
import { useToastStore } from "@/store/useToastStore";
import { ConfirmDialog } from "@/components/feedback";
import ReferralForm from "./ReferralForm";
import { getReferrals, deleteReferral as apiDeleteReferral } from "@/services/referral.service";
import { PlusCircle, Search, Share2, Edit2, Trash2, ChevronLeft, Loader2, AlertCircle } from "lucide-react";
import { Pagination } from "@/components/ui";

export default function ReferralList() {
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

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const searchRef = useRef(null);
    const { addToast } = useToastStore();

    // 🔹 Cargar datos desde la API
    const fetchReferrals = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getReferrals();
            setItems(data);
        } catch (err) {
            console.error("❌ Error al obtener fuentes:", err);
            setError("No se pudieron cargar las fuentes de referido.");
            addToast({
                type: "error",
                title: "Error de carga",
                message: "Ocurrido un problema al obtener los datos.",
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReferrals();
        document.title = "Fuentes de Referido | BWISE Dental";
    }, []);

    // 🔹 Filtrado y Paginación
    const filteredItems = items.filter(ref =>
        ref.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalPages = Math.ceil(filteredItems.length / limit) || 1;
    const paginatedItems = filteredItems.slice((page - 1) * limit, page * limit);

    // 🎹 Atajos de teclado
    useHotkeys(
        {
            escape: () => {
                if (confirmOpen || showForm) return "prevent";
                navigate("/settings", { state: { from: "/settings/referrals" } });
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

    const handleConfirmDelete = async () => {
        if (!itemToDelete) return;
        
        try {
            await apiDeleteReferral(itemToDelete.id);
            setItems(prev => prev.filter(i => i.id !== itemToDelete.id));

            addToast({
                type: "success",
                title: "Fuente eliminada",
                message: `"${itemToDelete.name}" fue eliminada correctamente.`,
            });
        } catch (err) {
            addToast({
                type: "error",
                title: "Error al eliminar",
                message: err.message || "No se pudo eliminar la fuente.",
            });
        } finally {
            setConfirmOpen(false);
            setItemToDelete(null);
        }
    };

    const handleFormSaved = () => {
        fetchReferrals();
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
                        onClick={() => navigate("/settings", { state: { from: "/settings/referrals" } })}
                        className="flex items-center gap-1 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition cursor-pointer"
                    >
                        <ChevronLeft size={20} />
                        <span className="text-sm font-medium">Volver a Ajustes</span>
                    </button>

                    <h1 className="text-2xl font-bold text-primary leading-none flex-1">
                        Fuentes de Referido
                    </h1>

                    {/* 🔍 Buscar */}
                    <div className="relative flex items-center bg-white dark:bg-secondary rounded-lg border border-slate-200 dark:border-slate-700 w-64 shadow-sm">
                        <Search size={16} className="absolute left-2 text-slate-400" />
                        <input
                            ref={searchRef}
                            type="text"
                            placeholder="Buscar fuente..."
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
                        <span>Nueva Fuente</span>
                        <span className="opacity-50 font-mono text-[10px] bg-white/20 px-1 rounded ml-1">F12</span>
                    </motion.button>
                </div>

                {/* 📋 Lista de Referidos */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-secondary/30 rounded-2xl border border-slate-200 dark:border-slate-700">
                        <Loader2 className="animate-spin text-primary mb-4" size={40} />
                        <p className="text-slate-500 dark:text-slate-400 animate-pulse">Cargando fuentes de referido...</p>
                    </div>
                ) : error ? (
                    <div className="text-center py-20 bg-red-50 dark:bg-red-950/20 rounded-2xl border border-dashed border-red-300 dark:border-red-800">
                        <AlertCircle className="mx-auto text-red-500 mb-4" size={56} />
                        <p className="text-red-800 dark:text-red-400 font-medium">{error}</p>
                        <button 
                            onClick={fetchReferrals}
                            className="mt-4 text-sm font-semibold text-primary hover:underline"
                        >
                            Reintentar cargar
                        </button>
                    </div>
                ) : paginatedItems.length === 0 ? (
                    <div className="text-center py-20 bg-white dark:bg-secondary/30 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
                        <Share2 className="mx-auto text-slate-300 dark:text-slate-600 mb-4" size={56} />
                        <p className="text-slate-500 dark:text-slate-400 font-medium">No se encontraron fuentes de referido.</p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-3">
                        {paginatedItems.map((item, index) => {
                            const isSelected = index === selectedIndex;

                            return (
                                <motion.div
                                    key={item.id}
                                    layoutId={`referral-${item.id}`}
                                    onClick={() => handleEditClick(item)}
                                    className={`relative flex items-center justify-between bg-white dark:bg-secondary rounded-xl px-5 py-4 cursor-pointer border-l-4 transition-all group overflow-hidden shadow-sm
                                        ${isSelected
                                            ? "ring-2 ring-primary/20 border-slate-300 dark:border-slate-600 shadow-md border-l-primary"
                                            : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 border-l-slate-300 dark:border-l-slate-600"}
                                    `}
                                >
                                    <div className="flex items-center gap-5">
                                        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-md transition-all group-hover:shadow-lg bg-primary/10 text-primary">
                                            <Share2 size={24} />
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-900 dark:text-slate-50 text-lg uppercase tracking-tight">{item.name}</p>
                                            <p className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">
                                                {item.contact_email || "Sin correo"} • {item.contact_phone || "Sin teléfono"}
                                            </p>
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
            <ReferralForm
                open={showForm}
                onClose={() => setShowForm(false)}
                onSaved={handleFormSaved}
                itemToEdit={itemToEdit}
            />

            {/* Modal Confirmación Delete */}
            <ConfirmDialog
                open={confirmOpen}
                title="Eliminar Fuente"
                message={
                    itemToDelete
                        ? `¿Estás seguro de que deseas eliminar la fuente "${itemToDelete.name}"?`
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
