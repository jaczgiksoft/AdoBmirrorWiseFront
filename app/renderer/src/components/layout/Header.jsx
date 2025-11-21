import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, LogOut, User, Sun, Moon } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { useNotificationStore } from "@/store/useNotificationStore";
import { NotificationPanel, ConfirmDialog } from "@/components/feedback";
import { useToastStore } from "@/store/useToastStore";
import { API_BASE } from "@/utils/apiBase";

export default function Header() {
    const { user, logout } = useAuthStore();
    const tenant = user?.tenant;

    const {
        notifications,
        unreadCount,
        fetchNotifications,
        markAllRead,
        connectSocket,
        disconnectSocket,
        clear,
    } = useNotificationStore();

    const { addToast } = useToastStore();

    const [showNotifications, setShowNotifications] = useState(false);
    const [hovered, setHovered] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [prevCount, setPrevCount] = useState(0);
    const [clock, setClock] = useState("");

    const [theme, setTheme] = useState(() =>
        document.documentElement.classList.contains("dark") ? "dark" : "light"
    );
    const [hoverTheme, setHoverTheme] = useState(false);

    /* 📡 Cargar notificaciones + WebSocket */
    useEffect(() => {
        if (!user?.id) return;
        fetchNotifications();
        connectSocket();
        return () => disconnectSocket();
    }, [user]);

    /* 🔔 Detectar nuevas notificaciones */
    useEffect(() => {
        if (notifications.length > prevCount && prevCount !== 0) {
            addToast({
                title: "Nueva notificación",
                message: "Tienes nuevas notificaciones del sistema.",
                type: "info",
            });
        }
        setPrevCount(notifications.length);
    }, [notifications]);

    /* 🕒 Reloj */
    useEffect(() => {
        const updateClock = () => {
            const now = new Date();
            const time = now.toLocaleTimeString("es-MX", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hour12: true,
            });
            setClock(time.toLowerCase());
        };
        updateClock();
        const timer = setInterval(updateClock, 1000);
        return () => clearInterval(timer);
    }, []);

    /* 🌗 Cambiar tema */
    useEffect(() => {
        if (theme === "dark") {
            document.documentElement.classList.add("dark");
        } else {
            document.documentElement.classList.remove("dark");
        }
    }, [theme]);

    const toggleTheme = () => setTheme(prev => (prev === "dark" ? "light" : "dark"));

    const handleLogout = () => {
        clear();
        logout();
    };

    return (
        <div className="w-full flex flex-col border-b border-slate-300 dark:border-slate-700 shadow-sm z-20">

            {/* 🔹 HEADER PRINCIPAL */}
            <header className="
                backdrop-blur-md
                bg-white/70 text-slate-800
                dark:bg-secondary/70 dark:text-slate-200
                flex flex-col md:flex-row md:items-center md:justify-between
                gap-3 px-6 py-3
            ">

                {/* LOGO + INFO TENANT */}
                <div className="flex items-center gap-3">
                    {tenant?.logo_url && (
                        <img
                            src={tenant.logo_url}
                            alt="Logo"
                            className="w-10 h-10 rounded-lg object-cover"
                        />
                    )}

                    <div className="flex flex-col leading-tight">
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            {tenant?.name}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                            {tenant?.city}, {tenant?.state}
                        </span>
                    </div>
                </div>

                {/* BIENVENIDA + ACCIONES */}
                <div className="flex items-center md:gap-6 gap-3 justify-between md:justify-end w-full md:w-auto">

                    {/* DATOS DE USUARIO */}
                    <div className="flex items-center gap-3">

                        <div className="flex flex-col text-right">
                            <p className="text-sm text-slate-700 dark:text-slate-300">
                                Bienvenida,{" "}
                                <span className="font-semibold">{user.full_name}</span>
                            </p>

                            {user?.roles?.length > 0 ? (
                                <div className="flex flex-wrap gap-1 mt-[2px] justify-end">
                                    {user.roles.map((role) => (
                                        <span
                                            key={role.id}
                                            className="
                                                px-2 py-[1px] rounded-full text-[10px]
                                                bg-slate-200 text-slate-700
                                                dark:bg-slate-700 dark:text-slate-300
                                            "
                                        >
                                            {role.name}
                                        </span>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-[2px]">
                                    Sin roles asignados
                                </p>
                            )}
                        </div>

                        {/* AVATAR */}
                        {user?.profile_image ? (
                            <img
                                src={`${API_BASE}${user.profile_image}`}
                                alt="Foto de perfil"
                                className="w-9 h-9 rounded-lg object-cover border border-slate-300 dark:border-slate-700 shadow-sm"
                                onError={(e) => (e.target.style.display = "none")}
                            />
                        ) : (
                            <div className="
                                w-9 h-9 rounded-lg flex items-center justify-center
                                bg-slate-200 border border-slate-300 text-slate-600
                                dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400
                            ">
                                <User size={18} />
                            </div>
                        )}
                    </div>

                    {/* NOTIFICACIONES */}
                    <div className="relative">
                        <button
                            onMouseEnter={() => setHovered(true)}
                            onMouseLeave={() => setHovered(false)}
                            onClick={() => setShowNotifications(true)}
                            className="
                                relative transition cursor-pointer
                                text-slate-600 hover:text-slate-800
                                dark:text-slate-400 dark:hover:text-white
                            "
                        >
                            <motion.div
                                whileHover={{
                                    scale: [1, 1.2, 1],
                                    transition: { duration: 1, repeat: Infinity, repeatType: "loop" },
                                }}
                            >
                                <Bell size={20} />
                            </motion.div>

                            {unreadCount > 0 && (
                                <span className="absolute -top-1 -right-1 bg-red-500 text-[10px] px-1 rounded-full text-white shadow-md">
                                    {unreadCount}
                                </span>
                            )}

                            {/* TOOLTIP */}
                            <AnimatePresence>
                                {hovered && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 5 }}
                                        transition={{ duration: 0.15 }}
                                        className="
                                            absolute right-8 top-1/2 -translate-y-1/2
                                            bg-white text-slate-700
                                            dark:bg-slate-800 dark:text-white
                                            text-[10px] px-2 py-1 rounded-lg shadow-lg
                                            whitespace-nowrap z-50
                                        "
                                    >
                                        Ver notificaciones
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </button>
                    </div>

                    {/* THEME SWITCH */}
                    <div className="relative">
                        <button
                            onMouseEnter={() => setHoverTheme(true)}
                            onMouseLeave={() => setHoverTheme(false)}
                            onClick={toggleTheme}
                            className="
                                relative transition cursor-pointer p-[2px]
                                text-slate-600 hover:text-slate-800
                                dark:text-slate-400 dark:hover:text-white
                            "
                        >
                            <motion.div
                                whileHover={{
                                    scale: [1, 1.2, 1],
                                    transition: { duration: 1, repeat: Infinity, repeatType: "loop" },
                                }}
                            >
                                {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
                            </motion.div>

                            {/* TOOLTIP */}
                            <AnimatePresence>
                                {hoverTheme && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 5 }}
                                        transition={{ duration: 0.15 }}
                                        className="
                                            absolute right-8 top-1/2 -translate-y-1/2
                                            bg-white text-slate-700
                                            dark:bg-slate-800 dark:text-white
                                            text-[10px] px-2 py-1 rounded-lg shadow-lg
                                            whitespace-nowrap z-50
                                        "
                                    >
                                        {theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </button>
                    </div>

                    {/* LOGOUT */}
                    <button
                        onClick={() => setShowLogoutConfirm(true)}
                        className="
                            flex items-center gap-1 transition
                            text-slate-600 hover:text-red-500
                            dark:text-slate-400 dark:hover:text-red-400
                        "
                    >
                        <LogOut size={16} />
                        <span className="text-xs">Salir</span>
                    </button>
                </div>
            </header>

            {/* 🔸 SEGUNDA BARRA INFORMACIÓN */}
            <div className="
                bg-white/80 text-slate-600
                dark:bg-slate-800/80 dark:text-slate-400
                backdrop-blur-sm px-6 py-2 flex items-center justify-between
                border-t border-slate-300 dark:border-slate-700/50
            ">
                <span className="text-xs flex items-center gap-1">
                    {tenant?.code && <span>{tenant.code}</span>}
                    <span>•</span>
                    <span>{tenant?.currency || "MXN"}</span>
                    <span>•</span>

                    <span
                        className={
                            tenant?.exchange_rate
                                ? "text-green-600 dark:text-green-400 font-medium"
                                : "text-red-500 italic"
                        }
                    >
                        {tenant?.exchange_rate
                            ? `TC: ${Number(tenant.exchange_rate).toFixed(2)}`
                            : "Sin tipo de cambio"}
                    </span>

                    <span>•</span>
                    <span>{tenant?.tax_id ? `RFC: ${tenant.tax_id}` : "Sin RFC"}</span>
                </span>

                <span className="text-xs font-mono text-slate-600 dark:text-slate-400">
                    {clock},{" "}
                    {new Date().toLocaleDateString("es-MX", {
                        weekday: "long",
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                    })}
                </span>
            </div>

            {/* PANEL DE NOTIFICACIONES */}
            <NotificationPanel
                open={showNotifications}
                notifications={notifications}
                onClose={() => setShowNotifications(false)}
                onMarkAllRead={async () => {
                    await markAllRead();
                    fetchNotifications();
                }}
            />

            {/* CONFIRM LOGOUT */}
            <ConfirmDialog
                open={showLogoutConfirm}
                title="¿Cerrar sesión?"
                message="Se cerrará tu sesión actual y volverás a la pantalla de acceso."
                onConfirm={() => {
                    setShowLogoutConfirm(false);
                    handleLogout();
                }}
                onCancel={() => setShowLogoutConfirm(false)}
                confirmLabel="Cerrar sesión"
                cancelLabel="Cancelar"
                confirmVariant="error"
            />
        </div>
    );
}
