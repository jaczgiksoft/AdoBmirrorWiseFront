// src/pages/settings/Departments.jsx
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useHotkeys } from "@/hooks/useHotkeys";
import { Layers, ChevronLeft } from "lucide-react";

export default function Departments() {
    const navigate = useNavigate();
    const [selectedIndex, setSelectedIndex] = useState(0);

    const MENU = [
        {
            icon: <Layers size={26} />,
            label: "Gestión de Departamentos",
            description: "Crea, edita y organiza los departamentos del negocio.",
            path: "/settings/departments/list",
        },
    ];

    useHotkeys(
        {
            escape: () => navigate("/settings"),
            enter: (e) => {
                e.preventDefault();
                navigate(MENU[selectedIndex].path);
            },
        },
        [selectedIndex]
    );

    useEffect(() => {
        document.title = "Departamentos | Mirai POS";
    }, []);

    return (
        <div className="bg-dark flex flex-col font-sans text-slate-50">
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="w-full max-w-4xl mx-auto px-6 mt-6"
            >
                <div className="flex items-center gap-4 mb-6">
                    <button
                        onClick={() => navigate("/settings")}
                        className="flex items-center gap-1 text-slate-400 hover:text-white transition text-sm leading-none cursor-pointer"
                    >
                        <ChevronLeft size={16} />
                        <span>Volver a Configuración</span>
                    </button>

                    <h1 className="text-2xl font-semibold text-primary leading-none">
                        Departamentos
                    </h1>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {MENU.map((item, index) => {
                        const isSelected = index === selectedIndex;
                        return (
                            <motion.div
                                key={index}
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.97 }}
                                onClick={() => navigate(item.path)}
                                className={`bg-secondary rounded-2xl p-5 cursor-pointer border transition-all shadow-soft
                                ${isSelected
                                    ? "border-primary shadow-hard ring-2 ring-primary/40"
                                    : "border-slate-700 hover:border-primary"
                                }`}
                            >
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="text-primary">{item.icon}</div>
                                    <h2 className="text-lg font-semibold">{item.label}</h2>
                                </div>
                                <p className="text-sm text-slate-400">{item.description}</p>
                            </motion.div>
                        );
                    })}
                </div>
            </motion.div>
        </div>
    );
}
