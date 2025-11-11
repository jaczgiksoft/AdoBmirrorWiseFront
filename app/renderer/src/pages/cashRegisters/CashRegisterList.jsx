import { useRef, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useHotkeys } from "@/hooks/useHotkeys";
import { useToastStore } from "@/store/useToastStore";
import { ConfirmDialog } from "@/components/feedback";
import { Pagination } from "@/components/ui";
import { getCashRegistersPaginated, deleteCashRegister } from "@/services/cashRegister.service";
import { ChevronLeft, Home, Edit2, Trash2, Search, Printer } from "lucide-react";

export default function CashRegisterList() {
    const navigate = useNavigate();
    const [registers, setRegisters] = useState([]);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({ totalPages: 1 });
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [registerToDelete, setRegisterToDelete] = useState(null);
    const searchRef = useRef(null);
    const { addToast } = useToastStore();
    const limit = 6;

    // 🔹 Debounce de búsqueda
    useEffect(() => {
        const delay = setTimeout(() => setDebouncedSearch(searchTerm), 400);
        return () => clearTimeout(delay);
    }, [searchTerm]);

    // 🔹 Cargar cajas (reutilizable)
    const loadRegisters = async (opts = {}) => {
        try {
            if (registers.length === 0 && page === 1 && !debouncedSearch && !opts.silent) {
                setLoading(true);
            }

            const start = opts.start ?? (page - 1) * limit;
            const res = await getCashRegistersPaginated({
                start,
                length: limit,
                searchValue: debouncedSearch,
                orderColumn: "name",
                orderDir: "ASC",
            });

            const rows = res.rows || res.data || [];
            setRegisters(rows);
            setPagination({
                total: res.recordsFiltered || 0,
                totalPages: Math.ceil((res.recordsFiltered || 0) / limit) || 1,
            });
            setSelectedIndex(0);
        } catch (err) {
            console.error("❌ Error al cargar cajas:", err);
            setError("No se pudieron cargar las cajas.");
            addToast({
                type: "error",
                title: "Error al cargar cajas",
                message: "No se pudieron obtener los datos desde el servidor.",
            });
        } finally {
            setLoading(false);
        }
    };

    // 🔁 Cargar en cambios de búsqueda o paginación
    useEffect(() => {
        loadRegisters();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, debouncedSearch]);

    // 🎹 Atajos
    useHotkeys(
        {
            escape: () => {
                if (confirmOpen) return "prevent";
                navigate("/dashboard");
            },
            arrowdown: (e) => {
                if (confirmOpen) return "prevent";
                e.preventDefault();
                setSelectedIndex((prev) => (prev + 1) % registers.length);
            },
            arrowup: (e) => {
                if (confirmOpen) return "prevent";
                e.preventDefault();
                setSelectedIndex((prev) => (prev - 1 + registers.length) % registers.length);
            },
            arrowleft: (e) => {
                if (confirmOpen) return "prevent";
                e.preventDefault();
                if (page > 1) setPage((p) => p - 1);
            },
            arrowright: (e) => {
                if (confirmOpen) return "prevent";
                e.preventDefault();
                if (page < pagination.totalPages) setPage((p) => p + 1);
            },
            enter: (e) => {
                if (confirmOpen) return "prevent";
                e.preventDefault();
                const reg = registers[selectedIndex];
                if (reg) navigate(`/cash-registers/${reg.id}`);
            },
            delete: (e) => {
                e.preventDefault();
                const reg = registers[selectedIndex];
                if (reg) handleDeleteClick(reg);
            },
            f1: (e) => {
                if (confirmOpen) return "prevent";
                e.preventDefault();
                searchRef.current?.focus();
                searchRef.current?.select();
                return "prevent";
            },
        },
        [registers, selectedIndex, confirmOpen]
    );

    useEffect(() => {
        document.title = "Cajas | Mirai POS";
    }, []);

    // 🗑 Eliminar
    const handleDeleteClick = (reg) => {
        setRegisterToDelete(reg);
        setConfirmOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!registerToDelete) return;
        try {
            await deleteCashRegister(registerToDelete.id);
            setRegisters((prev) => prev.filter((r) => r.id !== registerToDelete.id));
            setConfirmOpen(false);
            setRegisterToDelete(null);

            addToast({
                type: "success",
                title: "Caja eliminada",
                message: `${registerToDelete.name} fue eliminada correctamente.`,
            });
        } catch (err) {
            console.error("❌ Error al eliminar caja:", err);
            addToast({
                type: "error",
                title: "Error al eliminar caja",
                message: err.response?.data?.message || "No se pudo eliminar la caja.",
            });
        }
    };

    // 🌀 Loading / error
    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center text-slate-400">
                <p>Cargando cajas...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex h-screen items-center justify-center text-red-400">
                <p>{error}</p>
            </div>
        );
    }

    // 🧱 Render principal
    return (
        <div className="bg-dark flex flex-col font-sans text-slate-50">
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="w-full max-w-5xl mx-auto px-6 mt-6"
            >
                {/* 🔙 Volver + Buscar */}
                <div className="flex items-center gap-4 mb-6 flex-wrap">
                    <button
                        onClick={() => navigate("/dashboard")}
                        className="relative group flex items-center gap-1 text-slate-400 hover:text-white transition cursor-pointer"
                    >
                        <Home size={18} className="relative top-[1px]" />
                        <ChevronLeft size={16} className="relative top-[1px]" />
                        <span className="absolute left-full ml-3 whitespace-nowrap px-3 py-1.5 text-xs bg-black/85 text-white rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-200">
                            Ir al panel principal del sistema
                        </span>
                    </button>

                    <h1 className="text-2xl font-semibold text-primary leading-none flex-1">
                        Gestión de cajas
                    </h1>

                    {/* 🔍 Buscar */}
                    <div className="relative flex items-center bg-secondary rounded-lg border border-slate-700">
                        <Search size={16} className="absolute left-2 text-slate-400" />
                        <input
                            ref={searchRef}
                            type="text"
                            placeholder="Buscar caja..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-7 pr-3 py-1 bg-transparent text-slate-200 text-sm outline-none placeholder:text-slate-500"
                        />
                    </div>
                </div>

                {/* 📋 Listado */}
                {registers.length === 0 ? (
                    <p className="text-center text-slate-400">No se encontraron cajas.</p>
                ) : (
                    <motion.div
                        key={page}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.25 }}
                        className="flex flex-col gap-3"
                    >
                        {registers.map((reg, index) => {
                            const isSelected = index === selectedIndex;
                            return (
                                <motion.div
                                    key={reg.id}
                                    whileHover={{ scale: 1.02 }}
                                    onClick={() => navigate(`/cash-registers/${reg.id}`)}
                                    className={`flex justify-between items-center bg-secondary rounded-xl px-4 py-3 cursor-pointer border transition-all ${
                                        isSelected
                                            ? "border-primary ring-2 ring-primary/40 shadow-hard"
                                            : "border-slate-700 hover:border-primary"
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <Printer size={22} className="text-primary" />
                                        <div>
                                            <p className="font-semibold">{reg.name}</p>
                                            <p className="text-xs text-slate-400">
                                                Código: {reg.code}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 text-slate-400">
                                        <span
                                            className={`text-xs px-2 py-1 rounded ${
                                                reg.status === "active"
                                                    ? "bg-green-500/20 text-green-400"
                                                    : reg.status === "maintenance"
                                                        ? "bg-yellow-500/20 text-yellow-400"
                                                        : "bg-red-500/20 text-red-400"
                                            }`}
                                        >
                                            {reg.status === "active"
                                                ? "Activa"
                                                : reg.status === "maintenance"
                                                    ? "Mantenimiento"
                                                    : "Inactiva"}
                                        </span>

                                        <Edit2 size={16} className="hover:text-primary" />
                                        <Trash2
                                            size={16}
                                            className="hover:text-error cursor-pointer"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteClick(reg);
                                            }}
                                        />
                                    </div>
                                </motion.div>
                            );
                        })}
                    </motion.div>
                )}

                {/* 📄 Paginación */}
                <Pagination
                    page={page}
                    totalPages={pagination.totalPages}
                    onPageChange={(newPage) => setPage(newPage)}
                />

                <p className="text-center text-xs text-slate-500 mt-6">
                    Usa ↑ ↓ para navegar · Enter para editar · Supr para eliminar
                </p>
            </motion.div>

            {/* 🧱 Confirmación de eliminación */}
            <ConfirmDialog
                open={confirmOpen}
                title="Eliminar caja"
                message={
                    registerToDelete
                        ? `¿Deseas eliminar "${registerToDelete.name}"? Esta acción no eliminará sus datos permanentemente.`
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
