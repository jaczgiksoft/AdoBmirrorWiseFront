import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp } from 'lucide-react';

export default function ConversationsFilterPopover({ filters, onApply }) {
    const [open, setOpen] = useState(false);
    const [local, setLocal] = useState(filters);
    const ref = useRef(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (ref.current && !ref.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Close on ESC
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape') {
                setOpen(false);
            }
        };
        document.addEventListener("keydown", handleEsc);
        return () => document.removeEventListener("keydown", handleEsc);
    }, []);

    // Update local state when prop changes
    useEffect(() => {
        setLocal(filters);
    }, [filters]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setLocal(prev => ({ ...prev, [name]: value }));
    };

    const handleApply = () => {
        onApply(local);
        setOpen(false);
    };

    const handleClear = () => {
        const empty = {
            sort: 'newest'
        };
        setLocal(empty);
        onApply(empty);
        setOpen(false);
    };

    return (
        <div className="relative" ref={ref}>
            {/* Trigger Button */}
            <button
                onClick={() => setOpen(!open)}
                className="flex items-center gap-1 px-2 text-slate-400 hover:text-primary transition text-sm cursor-pointer"
            >
                <span>Filtros</span>
                {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {/* Popover Content */}
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: 4, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 4, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="
                            absolute top-full right-0 mt-2 w-72 
                            bg-white dark:bg-secondary 
                            border border-slate-200 dark:border-slate-700 
                            rounded-xl shadow-xl z-50 p-4 
                            flex flex-col gap-4
                        "
                        style={{ transformOrigin: "top right" }}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-700/50">
                            <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                                Filtros avanzados
                            </h4>
                        </div>

                        {/* Filters */}
                        <div className="space-y-3">
                            {/* Sort Filter */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                    Orden
                                </label>
                                <select
                                    name="sort"
                                    value={local.sort || 'newest'}
                                    onChange={handleChange}
                                    className="
                                        w-full px-3 py-2 
                                        bg-slate-50 dark:bg-slate-800/50 
                                        border border-slate-200 dark:border-slate-700 
                                        rounded-lg text-sm text-slate-700 dark:text-slate-200 
                                        focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary
                                        transition-all
                                    "
                                >
                                    <option value="newest">Más recientes</option>
                                    <option value="oldest">Más antiguas</option>
                                </select>
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-700/50">
                            <button
                                onClick={handleClear}
                                className="
                                    px-3 py-1.5 rounded-lg 
                                    text-xs font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200
                                    hover:bg-slate-100 dark:hover:bg-slate-800
                                    transition-colors
                                "
                            >
                                Limpiar
                            </button>
                            <button
                                onClick={handleApply}
                                className="
                                    px-3 py-1.5 rounded-lg 
                                    text-xs font-medium text-white 
                                    bg-primary hover:bg-primary/90 
                                    shadow-sm shadow-primary/20
                                    transition-all
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
