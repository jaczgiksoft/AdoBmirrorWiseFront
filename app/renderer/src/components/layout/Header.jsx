import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, LogOut, User } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { useNotificationStore } from "@/store/useNotificationStore";
import { NotificationPanel, ConfirmDialog } from "@/components/feedback";
import { useToastStore } from "@/store/useToastStore";
import { API_BASE } from "@/utils/apiBase";
export default function Header() {
    const {
        user,
        currentStore,
        currentRegister, // 🆕 Caja activa
        setCurrentStore,
        logout,
    } = useAuthStore();

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

    // 🧠 Cargar notificaciones iniciales y conectar al WebSocket
    useEffect(() => {
        if (!user?.id) return;
        fetchNotifications(); // carga inicial desde la API
        connectSocket(); // 🔌 conexión WebSocket
        return () => disconnectSocket(); // limpieza al salir o cerrar sesión
    }, [user]);

    // 🔔 Detectar nuevas notificaciones y mostrar toast
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

    // 🕒 Actualizar hora cada segundo
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

    // 🧹 Logout
    const handleLogout = () => {
        clear();
        logout();
    };

    return (
        <div className="w-full flex flex-col border-b border-slate-700/40 shadow-sm z-20">
            {/* 🔹 Header principal */}
            <header className="bg-secondary/70 backdrop-blur-md flex flex-col md:flex-row md:items-center md:justify-between gap-3 px-6 py-3">
                {/* Logo y tenant */}
                <div className="flex items-center gap-3">
                    {tenant?.logo_url && (
                        <img
                            src={tenant.logo_url}
                            alt="Logo"
                            className="w-10 h-10 rounded-lg object-cover"
                        />
                    )}
                    <div className="flex flex-col leading-tight">
                        <span className="text-sm text-slate-300 font-medium">
                            {tenant?.name}
                        </span>

                        {currentStore && (
                            <span className="text-xs text-slate-500">
                                {currentStore.code} — {currentStore.name}
                            </span>
                        )}

                        {/* 🆕 Mostrar caja activa */}
                        {currentRegister && (
                            <span className="text-[11px] text-slate-500">
                                {currentRegister.code} · {currentRegister.name}
                            </span>
                        )}
                    </div>
                </div>

                {/* Selector de sucursal */}
                {user?.stores?.length > 1 && (
                    <select
                        value={currentStore?.id || ""}
                        onChange={(e) => {
                            const selected = user.stores.find(
                                (s) => s.id === +e.target.value
                            );
                            setCurrentStore(selected);
                        }}
                        className="bg-slate-800 text-white text-sm rounded-lg px-2 py-1 border border-slate-700 focus:outline-none"
                    >
                        {user.stores.map((store) => (
                            <option key={store.id} value={store.id}>
                                {store.name}
                            </option>
                        ))}
                    </select>
                )}

                {/* Bienvenida + acciones */}
                <div className="flex items-center md:gap-6 gap-3 justify-between md:justify-end w-full md:w-auto">
                    {/* 👋 Bienvenida y foto */}
                    <div className="flex items-center gap-3">
                        <div className="flex flex-col text-right">
                            <p className="text-sm text-slate-300">
                                Bienvenido,{" "}
                                <span className="font-semibold">{user.full_name}</span>
                            </p>
                            <p className="text-xs text-slate-500">Rol: {user.role}</p>
                        </div>
                        {/* 🧑 Foto o ícono */}
                        {user?.profile_image ? (
                            <img
                                src={`${API_BASE}${user.profile_image}`}
                                alt="Foto de perfil"
                                className="w-9 h-9 rounded-lg object-cover border border-slate-700 shadow-sm"
                                onError={(e) => (e.target.style.display = 'none')}
                            />
                        ) : (
                            <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center">
                                <User size={18} className="text-slate-400" />
                            </div>
                        )}
                    </div>


                    {/* Botón de notificaciones */}
                    <div className="relative">
                        <button
                            onMouseEnter={() => setHovered(true)}
                            onMouseLeave={() => setHovered(false)}
                            onClick={() => setShowNotifications(true)}
                            className="relative text-slate-400 hover:text-white transition cursor-pointer"
                        >
                            <motion.div
                                whileHover={{
                                    scale: [1, 1.2, 1],
                                    transition: {
                                        duration: 1,
                                        repeat: Infinity,
                                        repeatType: "loop",
                                    },
                                }}
                            >
                                <Bell size={20} />
                            </motion.div>

                            {unreadCount > 0 && (
                                <span className="absolute -top-1 -right-1 bg-red-500 text-[10px] px-1 rounded-full text-white shadow-md">
                                    {unreadCount}
                                </span>
                            )}

                            <AnimatePresence>
                                {hovered && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 5 }}
                                        transition={{ duration: 0.15 }}
                                        className="absolute right-8 top-1/2 -translate-y-1/2 bg-slate-800 text-white text-[10px] px-2 py-1 rounded-lg shadow-lg whitespace-nowrap z-50"
                                    >
                                        Ver notificaciones
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </button>
                    </div>

                    {/* Logout */}
                    <button
                        onClick={() => setShowLogoutConfirm(true)}
                        className="flex items-center gap-1 text-slate-400 hover:text-red-400 transition"
                    >
                        <LogOut size={16} />
                        <span className="text-xs">Salir</span>
                    </button>
                </div>
            </header>

            {/* 🔸 Segundo header fijo */}
            <div className="bg-slate-800/80 backdrop-blur-sm px-6 py-2 flex items-center justify-between border-t border-slate-700/50">
                <span className="text-xs text-slate-400">
                    {currentStore?.city || "Ubicación desconocida"} ·{" "}
                    {user?.config?.currency || "MXN"} ·{" "}
                    {user?.config?.exchange_rate
                        ? `TC: ${user.config.exchange_rate}`
                        : "Sin tipo de cambio"}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                    {clock},{" "}
                    {new Date().toLocaleDateString("es-MX", {
                        weekday: "long",
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                    })}
                </span>
            </div>

            {/* Panel de notificaciones */}
            <NotificationPanel
                open={showNotifications}
                notifications={notifications}
                onClose={() => setShowNotifications(false)}
                onMarkAllRead={async () => {
                    await markAllRead();
                    fetchNotifications();
                }}
            />

            {/* Confirmar logout */}
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
