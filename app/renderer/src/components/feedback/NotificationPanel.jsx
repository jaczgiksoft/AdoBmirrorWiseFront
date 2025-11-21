import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useHotkeys } from "@/hooks/useHotkeys";
import { useNavigate } from "react-router-dom";

export default function NotificationPanel({ open, notifications, onClose, onMarkAllRead }) {
    const [localNotifications, setLocalNotifications] = useState(notifications);
    const [showFeedback, setShowFeedback] = useState(false);
    const panelRef = useRef(null);
    const navigate = useNavigate();

    // 🔹 Cerrar al hacer clic fuera
    useEffect(() => {
        function handleClickOutside(e) {
            if (panelRef.current && !panelRef.current.contains(e.target)) {
                onClose();
            }
        }
        if (open) document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [open, onClose]);

    useEffect(() => {
        setLocalNotifications(notifications);
    }, [notifications]);

    const unreadCount = localNotifications.filter((n) => !n.read).length;

    // 🔹 Cerrar con tecla ESC
    useHotkeys(
        {
            escape: () => {
                if (open) onClose();
                return "prevent";
            },
        },
        [open],
        open
    );

    return (
        <AnimatePresence>
            {open && (
                <>
                    {/* Overlay */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.3 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
                        onClick={onClose}
                    />

                    {/* Panel */}
                    <motion.div
                        ref={panelRef}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="
                            fixed top-20 right-6 w-80 z-50
                            rounded-2xl shadow-lg border
                            bg-white border-slate-300
                            dark:bg-secondary dark:border-slate-700
                        "
                    >
                        {/* Header */}
                        <div className="
                            px-4 py-3 flex justify-between items-center border-b
                            border-slate-300 dark:border-slate-700
                        ">
                            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                                Notificaciones ({unreadCount})
                            </h3>

                            <button
                                onClick={onClose}
                                className="
                                    text-xs transition
                                    text-slate-500 hover:text-slate-700
                                    dark:text-slate-400 dark:hover:text-white
                                "
                            >
                                ✕
                            </button>
                        </div>

                        {/* Lista */}
                        <div className="
                            max-h-72 overflow-y-auto divide-y
                            divide-slate-200 dark:divide-slate-700
                        ">
                            {localNotifications.length === 0 ? (
                                <p className="text-xs text-slate-500 dark:text-slate-400 text-center py-4">
                                    Sin notificaciones
                                </p>
                            ) : (
                                localNotifications.map((n) => (
                                    <div
                                        key={n.id}
                                        onClick={() => n.link && navigate(n.link)}
                                        className={`
                                            p-3 transition cursor-pointer
                                            ${n.read
                                            ? "bg-slate-100 hover:bg-slate-200 dark:bg-slate-700/30 dark:hover:bg-slate-700/50"
                                            : "bg-cyan-50 hover:bg-cyan-100 dark:bg-slate-700/60 dark:hover:bg-slate-700/70"
                                        }
                                        `}
                                    >
                                        {/* Línea superior */}
                                        <div className="flex items-center justify-between text-[10px] mb-1">
                                            <span
                                                className={`
                                                    ${n.read
                                                    ? "text-slate-500 dark:text-slate-500"
                                                    : "text-emerald-600 dark:text-emerald-400 font-medium"
                                                }
                                                `}
                                            >
                                                {n.read ? "Leído" : "Nuevo"}
                                            </span>

                                            <span className="text-slate-500 dark:text-slate-400">
                                                {new Date(n.created_at).toLocaleString("es-MX", {
                                                    hour: "2-digit",
                                                    minute: "2-digit",
                                                    hour12: true,
                                                    day: "2-digit",
                                                    month: "short",
                                                })}
                                            </span>
                                        </div>

                                        {/* Contenido */}
                                        <p className="text-sm font-semibold text-slate-800 dark:text-white">
                                            {n.title}
                                        </p>
                                        <p className="text-xs text-slate-600 dark:text-slate-400">
                                            {n.message}
                                        </p>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Footer */}
                        <div className="
                            border-t border-slate-300 dark:border-slate-700
                            p-3 flex justify-center
                        ">
                            <button
                                onClick={() => {
                                    setLocalNotifications((prev) =>
                                        prev.map((n) => ({ ...n, read: true }))
                                    );
                                    if (onMarkAllRead) onMarkAllRead();
                                    setShowFeedback(true);
                                    setTimeout(() => setShowFeedback(false), 2000);
                                }}
                                disabled={unreadCount === 0}
                                className={`
                                    text-xs font-medium transition
                                    ${unreadCount === 0
                                    ? "text-slate-400 cursor-not-allowed opacity-60"
                                    : "text-cyan-600 hover:text-cyan-800 dark:text-cyan-400 dark:hover:text-white"
                                }
                                `}
                            >
                                {unreadCount === 0
                                    ? "Todas leídas"
                                    : showFeedback
                                        ? "Marcadas"
                                        : "Marcar todas como leídas"}
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
