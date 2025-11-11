import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";

export default function FilterDropdown({ filters, onApply }) {
    const [open, setOpen] = useState(false);
    const [local, setLocal] = useState(filters);
    const ref = useRef(null);

    // Cerrar al hacer clic fuera
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleChange = (e) => {
        setLocal({ ...local, [e.target.name]: e.target.value });
    };

    const handleApply = () => {
        onApply(local);
        setOpen(false);
    };

    const handleClear = () => {
        const empty = { city: "", state: "", statusFilter: "", currency: "" };
        setLocal(empty);
        onApply(empty);
        setOpen(false);
    };

    return (
        <div className="relative" ref={ref}>
            {/* Botón principal */}
            <button
                onClick={() => setOpen((o) => !o)}
                className="filter-toggle-btn flex items-center gap-1 px-2 text-slate-400 hover:text-primary transition text-sm cursor-pointer"
            >
                Filtros
                {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {/* Dropdown */}
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        transition={{ duration: 0.15 }}
                        className="absolute top-full right-[-7px] mt-2 w-64 bg-secondary border border-slate-700 rounded-xl shadow-xl z-50 p-4 flex flex-col gap-3 text-sm text-slate-200"
                        style={{ transformOrigin: "top right" }}
                    >

                    {/* Ciudad */}
                        <div>
                            <label className="block text-xs mb-1 text-slate-400">Ciudad</label>
                            <input
                                name="city"
                                value={local.city}
                                onChange={handleChange}
                                placeholder="Ej. Hermosillo"
                                className="w-full bg-dark border border-slate-700 rounded-md px-2 py-1 text-xs text-slate-200 focus:border-primary outline-none"
                            />
                        </div>

                        {/* Estado */}
                        <div>
                            <label className="block text-xs mb-1 text-slate-400">Estado</label>
                            <input
                                name="state"
                                value={local.state}
                                onChange={handleChange}
                                placeholder="Ej. Sonora"
                                className="w-full bg-dark border border-slate-700 rounded-md px-2 py-1 text-xs text-slate-200 focus:border-primary outline-none"
                            />
                        </div>

                        {/* Estatus */}
                        <div>
                            <label className="block text-xs mb-1 text-slate-400">Estatus</label>
                            <select
                                name="statusFilter"
                                value={local.statusFilter}
                                onChange={handleChange}
                                className="w-full bg-dark border border-slate-700 rounded-md px-2 py-1 text-xs text-slate-200 focus:border-primary outline-none"
                            >
                                <option value="">Todos</option>
                                <option value="active">Activa</option>
                                <option value="inactive">Inactiva</option>
                                <option value="suspended">Suspendida</option>
                            </select>
                        </div>

                        {/* Moneda */}
                        <div>
                            <label className="block text-xs mb-1 text-slate-400">Moneda</label>
                            <select
                                name="currency"
                                value={local.currency}
                                onChange={handleChange}
                                className="w-full bg-dark border border-slate-700 rounded-md px-2 py-1 text-xs text-slate-200 focus:border-primary outline-none"
                            >
                                <option value="">Todas</option>
                                <option value="MXN">MXN</option>
                                <option value="USD">USD</option>
                            </select>
                        </div>

                        {/* Botones */}
                        <div className="flex justify-end gap-2 pt-2 border-t border-slate-700 mt-2">
                            <button
                                onClick={handleClear}
                                className="px-2 py-1 rounded-md bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs"
                            >
                                Limpiar
                            </button>
                            <button
                                onClick={handleApply}
                                className="px-2 py-1 rounded-md bg-primary hover:bg-sky-500 text-white text-xs font-medium"
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
