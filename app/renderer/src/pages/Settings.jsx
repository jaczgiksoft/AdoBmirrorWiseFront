// src/pages/Settings.jsx
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useHotkeys } from "@/hooks/useHotkeys";
import { useAuthStore } from "@/store/useAuthStore";
import { Wrench, UserCog, Database, Shield, Bell, ChevronLeft, Briefcase, Layout } from "lucide-react";

export default function Settings() {
    const navigate = useNavigate();
    const { user } = useAuthStore();

    const SETTINGS_MENU = [
        {
            icon: <UserCog size={28} />,
            label: "Usuarios y Roles",
            description: "Gestiona usuarios, permisos y roles del sistema.",
            path: "/configuracion/usuarios",
        },
        {
            icon: <Database size={28} />,
            label: "Departamentos",
            description: "Gestiona los departamentos y sus márgenes por tienda.",
            path: "/settings/departments",
        },
        {
            icon: <Database size={28} />,
            label: "Base de Datos",
            description: "Respaldo, restauración y mantenimiento de datos.",
            path: "/configuracion/database",
        },
        {
            icon: <Bell size={28} />,
            label: "Notificaciones",
            description: "Personaliza alertas y sonidos del sistema.",
            path: "/configuracion/notificaciones",
        },
        {
            icon: <Shield size={28} />,
            label: "Seguridad",
            description: "Opciones de bloqueo, auditoría y privacidad.",
            path: "/configuracion/seguridad",
        },
        {
            icon: <Wrench size={28} />,
            label: "Preferencias del Sistema",
            description: "Tema, idioma, formato de fecha y apariencia.",
            path: "/configuracion/preferencias",
        },
        {
            icon: <Briefcase size={28} />,
            label: "Servicios",
            description: "Gestiona los servicios y tratamientos ofrecidos.",
            path: "/services",
        },
        {
            icon: <Layout size={28} />,
            label: "Áreas Clínicas",
            description: "Configura los consultorios y áreas de atención.",
            path: "/clinic-areas",
        },
    ];

    const [selectedIndex, setSelectedIndex] = useState(0);

    // 🔢 Definimos el número de columnas (por ahora 3, como en el grid tailwind)
    const COLUMNS = 3;

    useHotkeys(
        {
            escape: () => navigate("/dashboard"),

            // Flecha derecha
            arrowright: (e) => {
                e.preventDefault();
                setSelectedIndex((prev) =>
                    prev + 1 < SETTINGS_MENU.length ? prev + 1 : 0
                );
            },

            // Flecha izquierda
            arrowleft: (e) => {
                e.preventDefault();
                setSelectedIndex((prev) =>
                    prev - 1 >= 0 ? prev - 1 : SETTINGS_MENU.length - 1
                );
            },

            // Flecha abajo → baja una fila
            arrowdown: (e) => {
                e.preventDefault();
                setSelectedIndex((prev) => {
                    const next = prev + COLUMNS;
                    return next < SETTINGS_MENU.length ? next : prev;
                });
            },

            // Flecha arriba → sube una fila
            arrowup: (e) => {
                e.preventDefault();
                setSelectedIndex((prev) => {
                    const next = prev - COLUMNS;
                    return next >= 0 ? next : prev;
                });
            },

            // Enter → abrir el módulo seleccionado
            enter: (e) => {
                e.preventDefault();
                navigate(SETTINGS_MENU[selectedIndex].path);
            },
        },
        [selectedIndex]
    );

    useEffect(() => {
        document.title = "Configuración | Mirai POS";
    }, []);

    return (
        <div className="min-h-screen bg-dark flex flex-col font-sans text-slate-50">
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="w-full max-w-5xl mx-auto px-6 mt-6"
            >
                <div className="flex items-center gap-4 mb-6">
                    <button
                        onClick={() => navigate("/dashboard")}
                        className="flex items-center gap-1 text-slate-400 hover:text-white transition text-sm leading-none mt-[2px] cursor-pointer"
                    >
                        <ChevronLeft size={16} className="relative top-[1px]" />
                        <span>Volver al Dashboard</span>
                    </button>

                    <h1 className="text-2xl font-semibold text-primary leading-none">
                        Configuración del Sistema
                    </h1>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {SETTINGS_MENU.map((item, index) => {
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

                <p className="text-center text-xs text-slate-500 mt-6">
                    Usa las flechas ← → ↑ ↓ para moverte y Enter para abrir
                </p>
            </motion.div>
        </div>
    );
}
