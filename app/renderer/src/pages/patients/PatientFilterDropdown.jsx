import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";

export default function PatientFilterDropdown({ filters, onApply }) {
    const [open, setOpen] = useState(false);
    const [local, setLocal] = useState(filters);
    const ref = useRef(null);

    // Cerrar al hacer clic fuera
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (ref.current && !ref.current.contains(e.target)) {
                setOpen(false);
            }
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
        const empty = {
            genre: "",
            address_city: "",
            address_state: "",
            marital_status: "",
            statusFilter: "",
        };
        setLocal(empty);
        onApply(empty);
        setOpen(false);
    };

    return (
        <div className="relative" ref={ref}>
            {/* 🔘 Botón principal */}
            <button
                onClick={() => setOpen((o) => !o)}
                className="
                    filter-toggle-btn flex items-center gap-1 px-2 text-sm cursor-pointer transition
                    text-slate-500 dark:text-slate-400
                    hover:text-primary
                "
            >
                Filtros
                {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {/* 📦 Dropdown */}
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        transition={{ duration: 0.15 }}
                        style={{ transformOrigin: "top right" }}
                        className="
                            absolute top-full right-[-5px] mt-3 w-63 z-50
                            rounded-xl p-4 flex flex-col gap-3 text-sm shadow-xl

                            bg-white dark:bg-secondary
                            border border-slate-200 dark:border-slate-700
                            text-slate-700 dark:text-slate-200
                        "
                    >
                        {/* 👤 Género */}
                        <div>
                            <label className="block text-xs mb-1 text-slate-500 dark:text-slate-400">
                                Género
                            </label>
                            <select
                                name="genre"
                                value={local.genre}
                                onChange={handleChange}
                                className="
                                    w-full rounded-md px-2 py-1 text-xs outline-none transition
                                    bg-white dark:bg-dark
                                    border border-slate-300 dark:border-slate-700
                                    text-slate-700 dark:text-slate-200
                                    focus:border-primary
                                "
                            >
                                <option value="">Todos</option>
                                <option value="male">Masculino</option>
                                <option value="female">Femenino</option>
                                <option value="other">Otro</option>
                            </select>
                        </div>

                        {/* 🏙️ Ciudad */}
                        <div>
                            <label className="block text-xs mb-1 text-slate-500 dark:text-slate-400">
                                Ciudad
                            </label>
                            <input
                                name="address_city"
                                value={local.address_city}
                                onChange={handleChange}
                                placeholder="Ej. Hermosillo"
                                className="
                                    w-full rounded-md px-2 py-1 text-xs outline-none transition
                                    bg-white dark:bg-dark
                                    border border-slate-300 dark:border-slate-700
                                    text-slate-700 dark:text-slate-200
                                    placeholder:text-slate-400
                                    focus:border-primary
                                "
                            />
                        </div>

                        {/* 🗺️ Estado */}
                        <div>
                            <label className="block text-xs mb-1 text-slate-500 dark:text-slate-400">
                                Estado
                            </label>
                            <input
                                name="address_state"
                                value={local.address_state}
                                onChange={handleChange}
                                placeholder="Ej. Sonora"
                                className="
                                    w-full rounded-md px-2 py-1 text-xs outline-none transition
                                    bg-white dark:bg-dark
                                    border border-slate-300 dark:border-slate-700
                                    text-slate-700 dark:text-slate-200
                                    placeholder:text-slate-400
                                    focus:border-primary
                                "
                            />
                        </div>

                        {/* 💍 Estado civil */}
                        <div>
                            <label className="block text-xs mb-1 text-slate-500 dark:text-slate-400">
                                Estado civil
                            </label>
                            <select
                                name="marital_status"
                                value={local.marital_status}
                                onChange={handleChange}
                                className="
                                    w-full rounded-md px-2 py-1 text-xs outline-none transition
                                    bg-white dark:bg-dark
                                    border border-slate-300 dark:border-slate-700
                                    text-slate-700 dark:text-slate-200
                                    focus:border-primary
                                "
                            >
                                <option value="">Todos</option>
                                <option value="soltero">Soltero/a</option>
                                <option value="casado">Casado/a</option>
                                <option value="divorciado">Divorciado/a</option>
                                <option value="viudo">Viudo/a</option>
                                <option value="union libre">Unión libre</option>
                            </select>
                        </div>

                        {/* 🔘 Estatus */}
                        <div>
                            <label className="block text-xs mb-1 text-slate-500 dark:text-slate-400">
                                Estatus
                            </label>
                            <select
                                name="statusFilter"
                                value={local.statusFilter}
                                onChange={handleChange}
                                className="
                                    w-full rounded-md px-2 py-1 text-xs outline-none transition
                                    bg-white dark:bg-dark
                                    border border-slate-300 dark:border-slate-700
                                    text-slate-700 dark:text-slate-200
                                    focus:border-primary
                                "
                            >
                                <option value="">Todos</option>
                                <option value="active">Activo</option>
                                <option value="inactive">Inactivo</option>
                            </select>
                        </div>

                        {/* 🔘 Botones */}
                        <div className="flex justify-end gap-2 pt-2 mt-2 border-t border-slate-200 dark:border-slate-700">
                            <button
                                onClick={handleClear}
                                className="
                                    px-2 py-1 rounded-md text-xs transition
                                    bg-slate-100 dark:bg-slate-700
                                    text-slate-600 dark:text-slate-200
                                    hover:bg-slate-200 dark:hover:bg-slate-600
                                "
                            >
                                Limpiar
                            </button>

                            <button
                                onClick={handleApply}
                                className="
                                    px-2 py-1 rounded-md text-xs font-medium transition
                                    bg-primary text-white
                                    hover:bg-sky-500
                                "
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
