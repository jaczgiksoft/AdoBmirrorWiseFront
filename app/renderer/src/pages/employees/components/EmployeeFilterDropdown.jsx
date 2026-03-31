import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";

export default function EmployeeFilterDropdown({ filters, onApply }) {
    const [open, setOpen] = useState(false);
    const [local, setLocal] = useState(filters);
    const ref = useRef(null);

    // Close when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (ref.current && !ref.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Sync local state when dropdown opens
    useEffect(() => {
        if (open) {
            setLocal(filters);
        }
    }, [open, filters]);

    const handleChange = (e) => {
        setLocal({ ...local, [e.target.name]: e.target.value });
    };

    const handleApply = () => {
        onApply(local);
        setOpen(false);
    };

    const handleClear = () => {
        const cleared = { statusFilter: "all", userFilter: "all" };
        setLocal(cleared);
        onApply(cleared);
        setOpen(false);
    };

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={() => setOpen((o) => !o)}
                className="
                    flex items-center gap-1 px-3 py-1.5 text-xs font-bold transition rounded-lg
                    text-slate-500 dark:text-slate-400 hover:text-primary
                    hover:bg-slate-100 dark:hover:bg-slate-800/50
                "
            >
                Filtros
                {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        transition={{ duration: 0.15 }}
                        style={{ transformOrigin: "top right" }}
                        className="
                            absolute top-full right-[-5px] mt-2 w-64 z-50
                            rounded-xl p-4 flex flex-col gap-4 text-sm shadow-xl
                            bg-white dark:bg-secondary border border-slate-200 dark:border-slate-700
                            text-slate-700 dark:text-slate-200
                        "
                    >
                        {/* 🔘 Estatus */}
                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider mb-2 text-slate-500 px-1">
                                Estado del Empleado
                            </label>
                            <select
                                name="statusFilter"
                                value={local.statusFilter}
                                onChange={handleChange}
                                className="w-full bg-slate-50 dark:bg-dark text-slate-700 dark:text-slate-200 text-xs border border-slate-200 dark:border-slate-700 rounded-lg py-2 px-3 outline-none focus:border-primary transition"
                            >
                                <option value="all">Todos los estados</option>
                                <option value="active">Activos</option>
                                <option value="inactive">Inactivos</option>
                            </select>
                        </div>

                        {/* 👤 Cuenta de Usuario */}
                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider mb-2 text-slate-500 px-1">
                                Cuenta de Usuario
                            </label>
                            <select
                                name="userFilter"
                                value={local.userFilter}
                                onChange={handleChange}
                                className="w-full bg-slate-50 dark:bg-dark text-slate-700 dark:text-slate-200 text-xs border border-slate-200 dark:border-slate-700 rounded-lg py-2 px-3 outline-none focus:border-primary transition"
                            >
                                <option value="all">Filtro de usuario</option>
                                <option value="with_user">Con usuario</option>
                                <option value="without_user">Sin usuario</option>
                            </select>
                        </div>

                        {/* 🔘 Botones */}
                        <div className="flex justify-end gap-2 pt-3 mt-1 border-t border-slate-100 dark:border-slate-700">
                            <button
                                onClick={handleClear}
                                className="px-3 py-1.5 rounded-lg text-xs transition-colors text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                            >
                                Limpiar
                            </button>
                            <button
                                onClick={handleApply}
                                className="px-3 py-1.5 rounded-lg text-xs font-bold transition bg-primary text-white hover:bg-sky-500 shadow-lg shadow-primary/20"
                            >
                                Aplicar
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
