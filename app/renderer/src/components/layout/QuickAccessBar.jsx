import { motion, AnimatePresence } from "framer-motion";
import { Plus, Home } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useMemo } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { generateHarmoniousBlue } from "@/utils/helpers";

export default function QuickAccessBar({ onAdd }) {
    const navigate = useNavigate();
    const [hoveredIndex, setHoveredIndex] = useState(null);
    const { user } = useAuthStore();

    // 🚫 Módulos que NO deben aparecer en la barra
    const BLACKLIST = [
        "auth",
        "logs",
        "permissions",
        "roles",
        "billing",
        "patient_alerts",
        "bracket_types",
    ];

    // 🧠 Construir módulos dinámicamente
    const items = useMemo(() => {
        if (!user?.modules?.length || !user?.permissions) return [];

        const dynamicModules = user.modules
            // 1️⃣ Filtrar módulos donde el usuario tiene permiso read
            .filter((m) => user.permissions[m]?.read)
            // 2️⃣ Excluir módulos no permitidos
            .filter((m) => !BLACKLIST.includes(m))
            // 3️⃣ Construir configuración visual
            .map((m) => {
                const colors = generateHarmoniousBlue();
                return {
                    name: m
                        .replace(/_/g, " ")
                        .replace(/\b\w/g, (l) => l.toUpperCase()),
                    label: m[0].toUpperCase(),
                    path: `/${m}`,
                    bg: colors.bg,
                    color: colors.color,
                };
            });

        return [
            {
                name: "Inicio",
                label: <Home size={18} />,
                path: "/dashboard",
                bg: "hsl(220, 45%, 20%)",
                color: "hsl(220, 90%, 70%)",
            },
            ...dynamicModules,
        ];
    }, [user]);

    return (
        <div
            className="
    fixed left-0 top-0 h-full w-[60px]
    flex flex-col items-center py-4 gap-3 z-50
    border-r
    bg-slate-200 border-slate-300
    dark:bg-slate-900 dark:border-slate-800
            "
        >
            {/* 🔹 Módulos dinámicos */}
            {items.map((item, idx) => (
                <div key={idx} className="relative">
                    <motion.button
                        onClick={() => item.path && navigate(item.path)}
                        onMouseEnter={() => setHoveredIndex(idx)}
                        onMouseLeave={() => setHoveredIndex(null)}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        className="
                            w-10 h-10 rounded-lg flex items-center justify-center
                            shadow-sm text-sm font-semibold transition-colors
                            dark:shadow-none
                        "
                        style={{
                            backgroundColor: item.bg || "#1e293b",
                            color: item.color || "#fff",
                        }}
                    >
                        {item.label}
                    </motion.button>

                    {/* Tooltip */}
                    <AnimatePresence>
                        {hoveredIndex === idx && (
                            <motion.div
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 10 }}
                                transition={{ duration: 0.15 }}
                                className="
                                    absolute left-full top-1/2 -translate-y-1/2 ml-3
                                    text-xs px-2 py-1 rounded-md shadow-lg whitespace-nowrap
                                    bg-white text-slate-700
                                    dark:bg-slate-800 dark:text-white
                                "
                            >
                                {item.name}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            ))}

            {/* ➕ Botón agregar acceso */}
            <motion.button
                onClick={onAdd}
                whileHover={{ rotate: 90 }}
                transition={{ type: "spring", stiffness: 200, damping: 10 }}
                className="
                    w-10 h-10 mt-auto mb-2 rounded-lg flex items-center justify-center
                    transition
                    bg-slate-200 text-slate-600 hover:bg-slate-300 hover:text-slate-800
                    dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-white
                "
            >
                <Plus size={20} />
            </motion.button>
        </div>
    );
}
