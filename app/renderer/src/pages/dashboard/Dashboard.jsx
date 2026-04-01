// src/pages/dashboard/Dashboard.jsx
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/useAuthStore";
import { useNotificationStore } from "@/store/useNotificationStore";
import { useHotkeys } from "@/hooks/useHotkeys";
import { useToastStore } from "@/store/useToastStore";
import { ConfirmDialog } from "@/components/feedback";
import { MODULE_CONFIG } from "@/config/modules.config";

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

            // 🔥 NUEVOS
            f3: () => {
                if (user.permissions?.inventory?.read) navigate("/inventory");
                return "prevent";
            },
            f7: () => {
                if (user.permissions?.employees?.read) navigate("/employees");
                return "prevent";
            },
            f8: () => {
                if (user.permissions?.patient_alerts?.read) navigate("/patient-alerts");
                return "prevent";
            },
            f9: () => {
                if (user.permissions?.attendance?.read || user.is_superadmin) navigate("/attendance");
                return "prevent";
            },
            f12: () => {
                if (user.permissions?.appointments?.read) navigate("/appointments");
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

    // 🧭 Módulos visibles según permisos y configuración global
    // 💡 NOTA: Agregamos "employees" y "appointments" manualmente
    const userModules = [...new Set([...(user.modules || []), "employees", "inventory", "payments", "attendance"])];

    const shortcuts = userModules
        .filter((m) => MODULE_CONFIG[m]) // Existe en config
        .filter((m) => user.is_superadmin || user.permissions[m]?.read || m === "employees" || m === "inventory" || m === "payments") // Tiene permiso
        .map((m) => MODULE_CONFIG[m]) // Mapear a objeto config
        .sort((a, b) => a.order - b.order); // Ordenar

    return (
        <div className="
            flex flex-col items-center justify-center font-sans
            bg-slate-100 dark:bg-dark
            text-slate-900 dark:text-slate-50
            h-full overflow-y-auto py-12
        ">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="grid grid-cols-3 sm:grid-cols-4 gap-4 md:gap-6 w-full max-w-6xl px-8"
            >
                {shortcuts.map((item, i) => {
                    const Icon = item.icon;
                    return (
                        <motion.button
                            key={i}
                            whileHover="hovered"
                            whileTap={{ scale: 0.98 }}
                            variants={{
                                hovered: { scale: 1.03 }
                            }}
                            className="
                                flex flex-col items-center justify-center
                                bg-white dark:bg-slate-800/50
                                rounded-xl p-4 md:p-3
                                shadow-sm hover:shadow-lg transition-all duration-200
                                border border-slate-200/50 dark:border-slate-700/50
                                relative group cursor-pointer
                            "
                            onClick={() => navigate(item.path)}
                        >
                            <motion.div
                                style={{ color: item.color }}
                                className="mb-3 md:mb-4 p-2 md:p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/50 transition-colors group-hover:bg-white dark:group-hover:bg-slate-800"
                                variants={{
                                    hovered: {
                                        scale: [1, 1.1, 1],
                                        transition: {
                                            repeat: Infinity,
                                            duration: 1,
                                            ease: "easeInOut"
                                        }
                                    }
                                }}
                            >
                                <Icon className="w-8 h-8 md:w-10 md:h-10" />
                            </motion.div>
                            <span className="text-sm md:text-base font-semibold md:font-bold text-slate-800 dark:text-slate-100">{item.label}</span>

                            {item.key && (
                                <span className="mt-2 px-2 py-0.5 rounded text-[9px] md:text-[10px] font-bold bg-slate-100 dark:bg-slate-700/50 text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                                    {item.key}
                                </span>
                            )}
                        </motion.button>
                    );
                })}
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
    );
}
