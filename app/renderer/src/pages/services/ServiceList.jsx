import { useRef, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useHotkeys } from "@/hooks/useHotkeys";
import { useToastStore } from "@/store/useToastStore";
import { ConfirmDialog } from "@/components/feedback";
import { getDatatable, remove } from "@/services/service.service"; // Asegúrate que path es correcto, el servicio se llama service.service.js
import ServiceForm from "./ServiceForm";
import { PlusCircle, ChevronLeft, Search, Home, Stethoscope, Edit2, Trash2, Clock, DollarSign } from "lucide-react";
import { Pagination } from "@/components/ui";

export default function ServiceList() {
    const navigate = useNavigate();
    const [services, setServices] = useState([]);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({ totalPages: 1 });

    // Estados para modales
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [serviceToDelete, setServiceToDelete] = useState(null);

    const [showForm, setShowForm] = useState(false);
    const [serviceToEdit, setServiceToEdit] = useState(null);

    const searchRef = useRef(null);
    const { addToast } = useToastStore();
    const limit = 10; // Muestro más items porque la fila es más delgada

    // 🔹 Debounce de búsqueda
    useEffect(() => {
        const delay = setTimeout(() => {
            if (searchTerm.length === 0 || searchTerm.length >= 3) {
                setDebouncedSearch(searchTerm);
            }
        }, 400);
        return () => clearTimeout(delay);
    }, [searchTerm]);

    // 🔹 Cargar servicios paginados
    useEffect(() => {
        loadServices();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, debouncedSearch]);

    async function loadServices() {
        try {
            if (services.length === 0 && page === 1 && !debouncedSearch) {
                setLoading(true);
            }

            const start = (page - 1) * limit;
            const res = await getDatatable({
                start,
                length: limit,
                searchValue: debouncedSearch,
                orderColumn: "name",
                orderDir: "ASC",
            });

            // Soporte flexible para respuesta estándar o tipo datatable
            const dataList = res.data || [];
            const totalRecords = res.recordsFiltered || 0;

            setServices(dataList);
            setPagination({
                total: totalRecords,
                totalPages: Math.ceil(totalRecords / limit) || 1,
            });
            setSelectedIndex(0);
            setError(null);
        } catch (err) {
            console.error("❌ Error al cargar servicios:", err);
            setError("No se pudieron cargar los servicios.");
            addToast({
                type: "error",
                title: "Error de conexión",
                message: "No se pudo obtener la lista de servicios.",
            });
        } finally {
            setLoading(false);
        }
    }

    // 🎹 Atajos de teclado
    useHotkeys(
        {
            escape: () => {
                if (confirmOpen || showForm) return "prevent";
                navigate("/settings", { state: { from: "/services" } });
            },
            arrowdown: (e) => {
                if (confirmOpen || showForm) return "prevent";
                e.preventDefault();
                setSelectedIndex((prev) => (prev + 1) % services.length);
            },
            arrowup: (e) => {
                if (confirmOpen || showForm) return "prevent";
                e.preventDefault();
                setSelectedIndex((prev) => (prev - 1 + services.length) % services.length);
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
                const service = services[selectedIndex];
                if (service) handleEditClick(service);
            },
            f12: (e) => {
                if (confirmOpen) return "prevent";
                e.preventDefault();
                handleCreateClick();
            },
            delete: (e) => {
                e.preventDefault();
                const service = services[selectedIndex];
                if (service) handleDeleteClick(service);
            },
            f1: (e) => {
                if (confirmOpen || showForm) return "prevent";
                e.preventDefault();
                searchRef.current?.focus();
                searchRef.current?.select();
                return "prevent";
            },
        },
        [services, selectedIndex, confirmOpen, showForm]
    );

    useEffect(() => {
        document.title = "Servicios | Mirai POS";
    }, []);

    // 🛠 Handlers
    const handleCreateClick = () => {
        setServiceToEdit(null);
        setShowForm(true);
    };

    const handleEditClick = (service) => {
        setServiceToEdit(service);
        setShowForm(true);
    };

    const handleDeleteClick = (service) => {
        setServiceToDelete(service);
        setConfirmOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!serviceToDelete) return;
        try {
            await remove(serviceToDelete.id);
            setServices((prev) => prev.filter((s) => s.id !== serviceToDelete.id));
            setConfirmOpen(false);
            setServiceToDelete(null);

            addToast({
                type: "success",
                title: "Servicio eliminado",
                message: `"${serviceToDelete.name}" fue eliminado correctamente.`,
            });

            // Recargar si la página quedó vacía
            if (services.length === 1 && page > 1) {
                setPage(p => p - 1);
            } else if (services.length === 1) {
                loadServices();
            }
        } catch (err) {
            console.error("❌ Error al eliminar servicio:", err);
            addToast({
                type: "error",
                title: "Error al eliminar",
                message: err.message || "No se pudo eliminar el servicio.",
            });
        }
    };

    const handleFormSaved = (savedService) => {
        // En lugar de recargar todo, podríamos optimizar actualizando el estado local
        // pero para asegurar consistencia con filtros/orden, recargamos la página actual.
        loadServices();
    };

    // 🌀 Render
    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center text-slate-400">
                <p>Cargando catálogo...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex h-screen items-center justify-center text-red-400 gap-2">
                <p>{error}</p>
                <button onClick={loadServices} className="text-primary hover:underline">Reintentar</button>
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
                {/* 🔙 Header + Buscador */}
                <div className="flex items-center gap-4 mb-6 flex-wrap">
                    <button
                        onClick={() => navigate("/settings", { state: { from: "/services" } })}
                        className="flex items-center gap-1 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition cursor-pointer"
                        title="Ir al panel principal"
                    >
                        <Home size={18} />
                        <ChevronLeft size={16} />
                    </button>

                    <h1 className="text-2xl font-semibold text-primary leading-none flex-1">
                        Catálogo de servicios
                    </h1>

                    {/* 🔍 Buscar */}
                    <div className="relative flex items-center bg-white dark:bg-secondary rounded-lg border border-slate-200 dark:border-slate-700 w-64">
                        <Search size={16} className="absolute left-2 text-slate-400" />
                        <input
                            ref={searchRef}
                            type="text"
                            placeholder="Buscar servicio..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-8 pr-3 py-1.5 bg-transparent text-slate-800 dark:text-slate-200 text-sm outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500"
                        />
                    </div>

                    {/* ➕ Crear */}
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={handleCreateClick}
                        className="flex items-center gap-2 bg-primary text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-sky-500 transition shadow-lg shadow-sky-500/20"
                    >
                        <PlusCircle size={18} />
                        <span className="opacity-70 font-mono text-xs">F12</span>
                        <span>Nuevo servicio</span>
                    </motion.button>
                </div>

                {/* 📋 Tabla / Lista */}
                {services.length === 0 ? (
                    <div className="text-center py-20 bg-white dark:bg-secondary/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                        <Stethoscope className="mx-auto text-slate-600 mb-2" size={40} />
                        <p className="text-slate-400 mb-1">No se encontraron servicios.</p>
                        <p className="text-xs text-slate-500">Intenta otra búsqueda o agrega uno nuevo.</p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-2">
                        {services.map((service, index) => {
                            const isSelected = index === selectedIndex;
                            return (
                                <motion.div
                                    key={service.id}
                                    layoutId={`service-${service.id}`}
                                    onClick={() => handleEditClick(service)}
                                    // Borde condicional
                                    className={`relative flex items-center justify-between bg-white dark:bg-secondary rounded-xl px-4 py-3 cursor-pointer border transition-all group overflow-hidden
                                        ${isSelected ? "border-primary ring-1 ring-primary/40" : "border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500"}
                                    `}
                                >
                                    {/* Indicador de color lateral */}
                                    <div
                                        className="absolute left-0 top-0 bottom-0 w-1.5"
                                        style={{ backgroundColor: service.color || "#333" }}
                                    />

                                    <div className="flex items-center gap-4 ml-2">
                                        <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-dark/50 flex items-center justify-center text-slate-400 border border-slate-200 dark:border-slate-700">
                                            <Stethoscope size={20} style={{ color: service.color }} />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-slate-900 dark:text-slate-100">{service.name}</p>
                                            <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                                                <span className="flex items-center gap-1">
                                                    <Clock size={12} />
                                                    {service.duration_minutes} min
                                                </span>
                                                {service.suggested_units > 0 && (
                                                    <span className="bg-slate-700/50 px-1.5 rounded">
                                                        {service.suggested_units} uds
                                                    </span>
                                                )}
                                                {service.requires_inventory && (
                                                    <span className="text-amber-500/80">
                                                        • Inventario
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-6">
                                        <div className="text-right">
                                            <p className="font-bold text-slate-900 dark:text-slate-200 flex items-center justify-end gap-0.5">
                                                <span className="text-slate-500 text-xs font-normal">$</span>
                                                {Number(service.price).toFixed(2)}
                                            </p>
                                            {service.deductible && (
                                                <p className="text-[10px] text-green-500/70 uppercase font-medium tracking-wide">
                                                    Deducible
                                                </p>
                                            )}
                                        </div>

                                        {/* Acciones (visibles en hover o seleccionado) */}
                                        <div className={`flex items-center gap-2 transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleEditClick(service); }}
                                                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-400 hover:text-slate-800 dark:hover:text-white transition"
                                                title="Editar"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleDeleteClick(service); }}
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

                {/* 📄 Paginación */}
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

            {/* Modal Formulario */}
            <ServiceForm
                open={showForm}
                onClose={() => setShowForm(false)}
                onSaved={handleFormSaved}
                serviceToEdit={serviceToEdit}
            />

            {/* Modal Confirmación Delete */}
            <ConfirmDialog
                open={confirmOpen}
                title="Dar de baja servicio"
                message={
                    serviceToDelete
                        ? `¿Estás seguro de que deseas dar de baja el servicio "${serviceToDelete.name}"? 
El servicio quedará inactivo y no podrá usarse en nuevas citas.`
                        : ""
                }
                onConfirm={handleConfirmDelete}
                onCancel={() => setConfirmOpen(false)}
                confirmLabel="Dar de baja"
                cancelLabel="Cancelar"
                confirmVariant="error"
            />

        </div>
    );
}
