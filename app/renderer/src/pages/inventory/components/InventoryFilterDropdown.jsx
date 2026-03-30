import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";

export default function InventoryFilterDropdown({ categories, selectedCategory, onApply }) {
    const [open, setOpen] = useState(false);
    const [localCategory, setLocalCategory] = useState(selectedCategory);
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

    // Sync local state with prop when it changes or when dropdown opens
    useEffect(() => {
        if (open) {
            setLocalCategory(selectedCategory);
        }
    }, [open, selectedCategory]);

    const handleApply = () => {
        onApply(localCategory);
        setOpen(false);
    };

    const handleClear = () => {
        setLocalCategory("All");
        onApply("All");
        setOpen(false);
    };

    return (
        <div className="relative" ref={ref}>
            {/* 🔘 Main Button */}
            <button
                onClick={() => setOpen((o) => !o)}
                className="
                    flex items-center gap-1 px-3 py-1.5 text-xs font-bold transition rounded-lg
                    text-slate-500 dark:text-slate-400
                    hover:text-cyan-600 dark:hover:text-cyan-400
                    hover:bg-slate-100 dark:hover:bg-slate-800/50
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
                            absolute top-full right-[-5px] mt-2 w-56 z-50
                            rounded-xl p-4 flex flex-col gap-3 text-sm shadow-xl
                            bg-white dark:bg-slate-800
                            border border-slate-200 dark:border-slate-700
                            text-slate-700 dark:text-slate-200
                        "
                    >
                        {/* 📁 Category */}
                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider mb-2 text-slate-500 dark:text-slate-400 px-1">
                                Categoría
                            </label>
                            <div className="flex flex-col gap-1 max-h-48 overflow-y-auto pr-1">
                                <button
                                    onClick={() => setLocalCategory("All")}
                                    className={`text-left px-3 py-2 rounded-lg text-xs transition-colors ${
                                        localCategory === "All"
                                            ? "bg-cyan-50 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400 font-bold"
                                            : "hover:bg-slate-100 dark:hover:bg-slate-700/50"
                                    }`}
                                >
                                    Todas las categorías
                                </button>
                                {categories.map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => setLocalCategory(cat)}
                                        className={`text-left px-3 py-2 rounded-lg text-xs transition-colors ${
                                            localCategory === cat
                                                ? "bg-cyan-50 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400 font-bold"
                                                : "hover:bg-slate-100 dark:hover:bg-slate-700/50"
                                    }`}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* 🔘 Buttons */}
                        <div className="flex justify-end gap-2 pt-3 mt-1 border-t border-slate-100 dark:border-slate-700">
                            <button
                                onClick={handleClear}
                                className="
                                    px-3 py-1.5 rounded-lg text-xs transition-colors
                                    text-slate-500 dark:text-slate-400
                                    hover:bg-slate-100 dark:hover:bg-slate-700/50
                                "
                            >
                                Limpiar
                            </button>

                            <button
                                onClick={handleApply}
                                className="
                                    px-3 py-1.5 rounded-lg text-xs font-bold transition
                                    bg-cyan-600 text-white
                                    hover:bg-cyan-700 shadow-md shadow-cyan-600/20
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
