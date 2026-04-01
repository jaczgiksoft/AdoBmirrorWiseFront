// src/pages/Settings.jsx
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useHotkeys } from "@/hooks/useHotkeys";
import { useAuthStore } from "@/store/useAuthStore";
import { Wrench, UserCog, UserCircle2, Activity, Box, Share2, Database, Shield, Bell, ChevronLeft, Briefcase, Layout, Building2 } from "lucide-react";

export default function Settings() {
    const navigate = useNavigate();
    const { user } = useAuthStore();

    const TABS = ["Generales", "Tenant", "Usuarios", "Pacientes"];
    const [activeTab, setActiveTab] = useState("Generales");

    const SETTINGS_MENU = [
        {
            icon: <UserCog size={28} />,
            label: "Roles",
            description: "Gestiona roles y permisos del sistema.",
            path: "/settings/roles",
            category: "Usuarios",
        },
        {
            icon: <UserCog size={28} />,
            label: "Puestos de Trabajo",
            description: "Define los cargos y responsabilidades del personal.",
            path: "/settings/positions",
            category: "Usuarios",
        },
        {
            icon: <Database size={28} />,
            label: "Departamentos",
            description: "Gestiona los departamentos y sus márgenes por tienda.",
            path: "/settings/departments",
            category: "Tenant",
        },
        {
            icon: <Database size={28} />,
            label: "Base de Datos",
            description: "Respaldo, restauración y mantenimiento de datos.",
            path: "/configuracion/database",
            category: "Generales",
        },
        {
            icon: <Bell size={28} />,
            label: "Notificaciones",
            description: "Personaliza alertas y sonidos del sistema.",
            path: "/configuracion/notificaciones",
            category: "Generales",
        },
        {
            icon: <Shield size={28} />,
            label: "Seguridad",
            description: "Opciones de bloqueo, auditoría y privacidad.",
            path: "/configuracion/seguridad",
            category: "Generales",
        },
        {
            icon: <Wrench size={28} />,
            label: "Preferencias del Sistema",
            description: "Tema, idioma, formato de fecha y apariencia.",
            path: "/configuracion/preferencias",
            category: "Generales",
        },
        {
            icon: <Briefcase size={28} />,
            label: "Servicios",
            description: "Gestiona los servicios y tratamientos ofrecidos.",
            path: "/services",
            category: "Pacientes",
        },
        {
            icon: <UserCircle2 size={28} />,
            label: "Tipo de Pacientes",
            description: "Clasifica a tus pacientes por categorías y colores.",
            path: "/settings/patient-types",
            category: "Pacientes",
        },
        {
            icon: <Activity size={28} />,
            label: "Estados de Pacientes",
            description: "Define estados operativos para el seguimiento de pacientes.",
            path: "/settings/patient-statuses",
            category: "Pacientes",
        },
        {
            icon: <Box size={28} />,
            label: "Brackets de Pacientes",
            description: "Catálogo de marcas y tipos de brackets utilizados.",
            path: "/settings/patient-brackets",
            category: "Pacientes",
        },
        {
            icon: <Briefcase size={28} />,
            label: "Ocupaciones de Pacientes",
            description: "Gestiona los tipos de ocupaciones para perfiles de pacientes.",
            path: "/settings/occupations",
            category: "Pacientes",
        },
        {
            icon: <Share2 size={28} />,
            label: "Referidos de Pacientes",
            description: "Gestiona las fuentes de origen de tus pacientes.",
            path: "/settings/referrals",
            category: "Pacientes",
        },
        {
            icon: <Layout size={28} />,
            label: "Áreas Clínicas",
            description: "Configura los consultorios y áreas de atención.",
            path: "/clinic-areas",
            category: "Tenant",
        },
        {
            icon: <Building2 size={28} />,
            label: "Información de la Clínica",
            description: "Configura la identidad, datos fiscales y de contacto.",
            path: "/settings/tenant",
            category: "Tenant",
        },
    ];

    const filteredMenu = SETTINGS_MENU.filter(item => item.category === activeTab);

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
                    prev + 1 < filteredMenu.length ? prev + 1 : 0
                );
            },

            // Flecha izquierda
            arrowleft: (e) => {
                e.preventDefault();
                setSelectedIndex((prev) =>
                    prev - 1 >= 0 ? prev - 1 : filteredMenu.length - 1
                );
            },

            // Flecha abajo → baja una fila
            arrowdown: (e) => {
                e.preventDefault();
                setSelectedIndex((prev) => {
                    const next = prev + COLUMNS;
                    return next < filteredMenu.length ? next : prev;
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

            // Tab keys (1, 2, 3, 4)
            1: (e) => { console.log("Tab 1 - Generales"); e.preventDefault(); setActiveTab("Generales"); setSelectedIndex(0); },
            2: (e) => { console.log("Tab 2 - Tenant"); e.preventDefault(); setActiveTab("Tenant"); setSelectedIndex(0); },
            3: (e) => { console.log("Tab 3 - Usuarios"); e.preventDefault(); setActiveTab("Usuarios"); setSelectedIndex(0); },
            4: (e) => { console.log("Tab 4 - Pacientes"); e.preventDefault(); setActiveTab("Pacientes"); setSelectedIndex(0); },

            // Enter → abrir el módulo seleccionado
            enter: (e) => {
                e.preventDefault();
                if (filteredMenu[selectedIndex]) {
                    navigate(filteredMenu[selectedIndex].path);
                }
            },
        },
        [selectedIndex, filteredMenu, activeTab]
    );

    useEffect(() => {
        document.title = "Configuración | Mirai POS";
    }, []);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-dark flex flex-col font-sans text-slate-900 dark:text-slate-50">
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="w-full max-w-5xl mx-auto px-6 mt-6"
            >
                <div className="flex items-center gap-4 mb-6">
                    <button
                        onClick={() => navigate("/dashboard")}
                        className="flex items-center gap-1 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition text-sm leading-none mt-[2px] cursor-pointer"
                    >
                        <ChevronLeft size={16} className="relative top-[1px]" />
                        <span>Volver al Dashboard</span>
                    </button>

                    <h1 className="text-2xl font-semibold text-primary leading-none">
                        Configuración del Sistema
                    </h1>
                </div>

                {/* TAB NAVIGATION */}
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/50 p-1 rounded-xl border border-slate-200 dark:border-slate-700 w-fit mb-8">
                    {TABS.map((tab) => (
                        <button
                            key={tab}
                            onClick={() => {
                                setActiveTab(tab);
                                setSelectedIndex(0);
                            }}
                            className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === tab
                                ? "bg-white dark:bg-slate-700 text-primary shadow-sm"
                                : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredMenu.length > 0 ? (
                        filteredMenu.map((item, index) => {
                            const isSelected = index === selectedIndex;
                            return (
                                <motion.div
                                    key={item.label}
                                    layout
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    whileHover={{ scale: 1.03 }}
                                    whileTap={{ scale: 0.97 }}
                                    onClick={() => navigate(item.path)}
                                    className={`bg-white dark:bg-secondary rounded-2xl p-5 cursor-pointer border transition-all shadow-soft
                                        ${isSelected
                                            ? "border-primary shadow-hard ring-2 ring-primary/40"
                                            : "border-slate-200 hover:border-primary dark:border-slate-700"
                                        }`}
                                >
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="text-primary">{item.icon}</div>
                                        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-50">{item.label}</h2>
                                    </div>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">{item.description}</p>
                                </motion.div>
                            );
                        })
                    ) : (
                        <div className="col-span-full py-12 text-center text-slate-400 dark:text-slate-600 font-medium italic">
                            No hay configuraciones en esta categoría todavía.
                        </div>
                    )}
                </div>

                <p className="text-center text-xs text-slate-400 dark:text-slate-500 mt-8">
                    Usa las flechas ← → ↑ ↓ para moverte y Enter para abrir. Atajos: 1-Generales, 2-Tenat, 3-Usuarios, 4-Pacientes.
                </p>
            </motion.div>
        </div>
    );
}
