// src/components/layout/QuickAccessBar.jsx
import { motion, AnimatePresence } from "framer-motion";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

export default function QuickAccessBar({ items = [], onAdd }) {
    const navigate = useNavigate();
    const [hoveredIndex, setHoveredIndex] = useState(null);

    return (
        <div className="fixed left-0 top-0 h-full w-[60px] bg-slate-900 border-r border-slate-800 flex flex-col items-center py-4 gap-3 z-[60]">
            {items.map((item, idx) => (
                <div key={idx} className="relative">
                    <motion.button
                        onClick={() => item.path && navigate(item.path)}
                        onMouseEnter={() => setHoveredIndex(idx)}
                        onMouseLeave={() => setHoveredIndex(null)}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        className="w-10 h-10 rounded-lg flex items-center justify-center shadow-sm text-sm font-semibold transition-colors"
                        style={{
                            backgroundColor: item.bg || "#1e293b",
                            color: item.color || "#fff",
                        }}
                    >
                        {item.label}
                    </motion.button>

                    {/* Tooltip con nombre completo */}
                    <AnimatePresence>
                        {hoveredIndex === idx && (
                            <motion.div
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 10 }}
                                transition={{ duration: 0.15 }}
                                className="absolute left-full top-1/2 -translate-y-1/2 ml-3 bg-slate-800 text-white text-xs px-2 py-1 rounded-md shadow-lg whitespace-nowrap"
                            >
                                {item.name}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            ))}

            {/* Botón agregar acceso */}
            <motion.button
                onClick={onAdd}
                whileHover={{ rotate: 90 }}
                transition={{ type: "spring", stiffness: 200, damping: 10 }}
                className="w-10 h-10 mt-auto mb-2 rounded-lg flex items-center justify-center text-slate-400 bg-slate-800 hover:text-white hover:bg-slate-700 transition"
            >
                <Plus size={20} />
            </motion.button>
        </div>
    );
}
