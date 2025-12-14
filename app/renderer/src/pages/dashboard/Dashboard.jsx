// src/pages/dashboard/Dashboard.jsx
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/useAuthStore";
import { useNotificationStore } from "@/store/useNotificationStore";
import { useHotkeys } from "@/hooks/useHotkeys";
import { useToastStore } from "@/store/useToastStore";
import { ConfirmDialog } from "@/components/feedback";
import {
    Settings,
    FileText,
    Bell,
    Users,
    UserCog,
    ClipboardList,
    Stethoscope,
    AlertTriangle,
    Building2,
} from "lucide-react";

export default function Dashboard() {
    const { user, logout } = useAuthStore();
    const { fetchNotifications } = useNotificationStore();
    const { addToast } = useToastStore();
    const navigate = useNavigate();

    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    // 🔔 Cargar notificaciones al iniciar
    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    /* 🎹 Atajos de teclado */
    useHotkeys(
        {
            f1: () => {
                if (user.permissions?.patients?.read) navigate("/patients");
                return "prevent";
            },
            f2: () => {
                if (user.permissions?.patient_alerts?.read) navigate("/patient-alerts");
                return "prevent";
            },
            f8: () => {
                if (user.permissions?.users?.read) navigate("/users");
                return "prevent";
            },
            f10: () => {
                if (user.permissions?.notifications?.read) navigate("/notifications");
                return "prevent";
            },
            f11: () => {
                if (user.permissions?.settings?.read) navigate("/settings");
                else console.warn("⚠️ No tienes permiso para acceder a Configuración");
                return "prevent";
            },
            escape: () => {
                setShowLogoutConfirm(true);
                return "prevent";
            },
        },
        [user]
    );

    /* 🕒 Cargando usuario */
    if (!user) {
        return (
            <div className="flex h-screen items-center justify-center font-sans text-slate-300">
                <h2>Cargando información del usuario...</h2>
            </div>
        );
    }

    // 🧭 Módulos visibles según permisos
    const MODULE_CONFIG = {
        patients: {
            order: 1,
            label: "Pacientes",
            icon: <Stethoscope size={28} />,
            color: "#0ea5e9",
            path: "/patients",
            key: "F1",
        },
        patient_alerts: {
            order: 2,
            label: "Alertas de Paciente",
            icon: <AlertTriangle size={28} />,
            color: "#f59e0b",
            path: "/patient-alerts",
            key: "F2",
        },
        users: {
            order: 3,
            label: "Usuarios",
            icon: <UserCog size={28} />,
            color: "#0ea5e9",
            path: "/users",
            key: "F8",
        },
        notifications: {
            order: 4,
            label: "Notificaciones",
            icon: <Bell size={28} />,
            color: "#ef4444",
            path: "/notifications",
            key: "F10",
        },
        settings: {
            order: 5,
            label: "Configuración",
            icon: <Settings size={28} />,
            color: "#10b981",
            path: "/settings",
            key: "F11",
        },
        reports: {
            order: 6,
            label: "Reportes",
            icon: <FileText size={28} />,
            color: "#6b7280",
            path: "/reports",
        },
    };

    const shortcuts = (user.modules || [])
        .filter((m) => MODULE_CONFIG[m] && user.permissions[m]?.read)
        .map((m) => MODULE_CONFIG[m])
        .sort((a, b) => a.order - b.order);

    return (
        <>
            <div className="
       flex flex-col items-center justify-center font-sans
    bg-slate-100 dark:bg-dark
    text-slate-900 dark:text-slate-50
    h-full
">




                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6 w-full max-w-5xl px-8 mt-10"
                >
                    {shortcuts.map((item, i) => (
                        <motion.button
                            key={i}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.97 }}
                            className="
flex flex-col items-center justify-center
    bg-slate-100 text-slate-800
    dark:bg-secondary dark:text-slate-50
    rounded-2xl py-4
    shadow-soft hover:shadow-hard transition
border border-transparent
hover:ring-2 hover:ring-cyan-500 hover:ring-offset-2 hover:ring-offset-slate-100
dark:hover:ring-offset-dark
    box-border
"

                            onClick={() => navigate(item.path)}
                        >
                            <div
                                style={{ color: item.color }}
                                className="mb-2 flex items-center justify-center"
                            >
                                {item.icon}
                            </div>
                            <span className="text-base font-semibold">{item.label}</span>
                            <span className="text-[12px] text-slate-400 mt-1">
                                {item.key}
                            </span>
                        </motion.button>
                    ))}
                </motion.div>

                <ConfirmDialog
                    open={showLogoutConfirm}
                    title="¿Cerrar sesión?"
                    message="Tu sesión actual se cerrará y volverás a la pantalla de inicio de sesión."
                    onConfirm={() => {
                        setShowLogoutConfirm(false);
                        logout();
                    }}
                    onCancel={() => setShowLogoutConfirm(false)}
                    confirmLabel="Cerrar sesión"
                    cancelLabel="Cancelar"
                    confirmVariant="error"
                />
            </div>
        </>
    );
}
