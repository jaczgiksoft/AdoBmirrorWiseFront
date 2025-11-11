// src/pages/dashboard/Dashboard.jsx
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/useAuthStore";
import { useNotificationStore } from "@/store/useNotificationStore";
import { useHotkeys } from "@/hooks/useHotkeys";
import { getCashRegisterByCode, createCashRegister } from "@/services/cashRegister.service";
import { useToastStore } from "@/store/useToastStore";
import CashRegisterForm from "@/pages/cashRegisters/CashRegisterForm";
import CashSessionModal from "@/components/composite/CashSessionModal";
import { handleApiError } from "@/utils/error.helper";
import {
    Settings,
    FileText,
    ShoppingCart,
    Package,
    Users,
    Printer,
    Bell,
    Building,
    ClipboardList,
    Scissors,
    Truck,
    UserCog,
} from "lucide-react";
import { ConfirmDialog } from "@/components/feedback";

export default function Dashboard() {
    const {
        user,
        currentSession,
        currentRegister,
        setCurrentStore,
        setCurrentRegister,
        setCurrentSession,
        logout,
    } = useAuthStore();

    const { fetchNotifications } = useNotificationStore();
    const { addToast } = useToastStore();
    const navigate = useNavigate();

    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [checkingRegister, setCheckingRegister] = useState(true);
    const [showRegisterModal, setShowRegisterModal] = useState(false);
    const [showSessionModal, setShowSessionModal] = useState(false);

    /* 🔹 Seleccionar automáticamente la sucursal si solo hay una */
    useEffect(() => {
        if (user?.stores?.length === 1) setCurrentStore(user.stores[0]);
        else if (user?.stores?.length === 0) setCurrentStore(null);
    }, [user, setCurrentStore]);

    /* 🔔 Cargar notificaciones iniciales */
    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    /* 🔁 Refrescar caja recién creada */
    const refreshCashRegister = async () => {
        try {
            const pcName = (await window.electronAPI.getPcName())?.toUpperCase();
            const register = await getCashRegisterByCode(pcName);
            setCurrentRegister(register);
            console.log("♻️ Caja sincronizada después del registro:", register);

            // 💵 Si el usuario requiere sesión y no hay una abierta, forzar apertura
            const shouldOpenSession =
                user?.requires_cash_session &&
                !currentSession &&
                register?.id &&
                !register?.current_session_id;

            if (shouldOpenSession) {
                console.log("💰 Forzando apertura de sesión tras sincronizar caja...");
                setShowSessionModal(true);
            }

            return register;
        } catch (err) {
            console.error("❌ No se pudo refrescar la caja:", err);
            handleApiError(err, "No se pudo sincronizar la caja recién creada", addToast);
            return null;
        }
    };

    /* 🧠 Verificar o registrar caja del equipo */
    useEffect(() => {
        if (!user) return;

        const verifyCashRegister = async () => {
            try {
                const pcName = (await window.electronAPI.getPcName())?.toUpperCase();
                console.log("🖥️ Verificando caja para equipo:", pcName);

                const register = await getCashRegisterByCode(pcName);
                console.log("✅ Caja encontrada:", register);
                setCurrentRegister(register);

                // 🧠 Si la caja ya tiene sesión activa, sincronizarla directamente
                if (register.current_session_id) {
                    console.log("💰 Caja ya tiene una sesión abierta:", register.current_session_id);
                    setCurrentSession({
                        id: register.current_session_id,
                        register_id: register.id,
                        store_id: register.store_id,
                        tenant_id: register.tenant_id,
                    });

                    setCheckingRegister(false);
                    return;
                }

                // Caja sin sesión activa, continuar flujo normal
                setCheckingRegister(false);
            } catch (err) {
                const data = err.response?.data;
                const status = err.response?.status;
                const msg = data?.message || err.message;

                console.warn("⚠️ Error al verificar caja:", msg, "| status =", status);

                const isNotFound =
                    msg?.toLowerCase().includes("no encontrada") ||
                    msg?.toLowerCase().includes("not found") ||
                    status === 404;

                if (isNotFound) {
                    console.warn("⚠️ Caja no encontrada. Mostrando formulario o creando nueva...");

                    if (user?.stores?.length === 1) {
                        const store = user.stores[0];
                        try {
                            const pcName = (await window.electronAPI.getPcName())?.toUpperCase();
                            console.log("🧾 Registrando caja automáticamente para tienda:", store.name);

                            const created = await createCashRegister({
                                tenant_id: user.tenant.id,
                                store_id: store.id,
                                code: pcName,
                                name: `Caja ${pcName}`,
                                status: "active",
                                is_main: false,
                            });

                            setCurrentRegister(created);
                            addToast({
                                type: "success",
                                title: "Caja registrada",
                                message: `Caja creada automáticamente para ${pcName}`,
                            });
                            setCheckingRegister(false);
                            return;
                        } catch (createErr) {
                            console.error("❌ Error al crear caja automáticamente:", createErr);
                            handleApiError(
                                createErr,
                                "No se pudo registrar automáticamente. Usa el formulario.",
                                addToast
                            );
                            setShowRegisterModal(true);
                            setCheckingRegister(false);
                            return;
                        }
                    }

                    // 🧾 Varias tiendas: mostrar formulario manual
                    setShowRegisterModal(true);
                    setCheckingRegister(false);
                    return;
                }

                console.error("❌ Error inesperado al verificar caja:", err);
                handleApiError(err, "No se pudo verificar la caja del equipo", addToast);
                setCheckingRegister(false);
            }
        };

        verifyCashRegister();
    }, [user, setCurrentRegister, setCurrentSession, addToast]);

    /* 💵 Verificar si requiere sesión de caja */
    useEffect(() => {
        if (
            !checkingRegister &&
            !showRegisterModal && // 🚫 espera a que el modal de caja se cierre
            user?.requires_cash_session &&
            !currentSession &&
            currentRegister?.id // ✅ asegura que haya caja con id válido
        ) {
            console.log("💰 Mostrando modal de apertura de sesión de caja...");
            setShowSessionModal(true);
        }
    }, [checkingRegister, user, currentSession, currentRegister?.id, showRegisterModal]);

    /* 🎹 Atajos de teclado */
    useHotkeys(
        {
            f4: () => {
                if (user.permissions?.stores?.read) navigate("/stores");
                return "prevent";
            },
            f6: () => {
                if (user.permissions?.cashRegisters?.read) navigate("/cash-registers");
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
            f12: () => navigate("/sales"),
            escape: () => {
                setShowLogoutConfirm(true);
                return "prevent";
            },
        },
        [user]
    );

    /* 🕒 Pantalla de carga mientras se verifica la caja */
    if (!user) {
        return (
            <div className="flex h-screen items-center justify-center font-sans text-slate-300">
                <h2>Cargando información del usuario...</h2>
            </div>
        );
    }

    if (checkingRegister) {
        return (
            <div className="fixed inset-0 bg-black/80 flex flex-col items-center justify-center z-[9999]">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                    className="flex flex-col items-center"
                >
                    <p className="text-white text-lg font-medium animate-pulse mb-2">
                        Verificando caja asignada...
                    </p>
                    <p className="text-slate-400 text-sm">Por favor espera unos segundos</p>
                </motion.div>
            </div>
        );
    }

    /* 💰 Mostrar modal de apertura de sesión antes del dashboard */
    if (showSessionModal) {
        return (
            <CashSessionModal
                open={showSessionModal}
                onSuccess={(session) => {
                    setCurrentSession(session);
                    setShowSessionModal(false);
                    addToast({
                        type: "success",
                        title: "Sesión de caja abierta",
                        message: "Caja abierta correctamente.",
                    });
                }}
            />
        );
    }

    /* 🧭 Configuración del dashboard */
    const MODULE_CONFIG = {
        customers: { order: 1, label: "Clientes", icon: <Users size={28} />, color: "#10b981", path: "/customers", key: "F1" },
        products: { order: 2, label: "Productos", icon: <Package size={28} />, color: "#8b5cf6", path: "/products", key: "F2" },
        suppliers: { order: 3, label: "Proveedores", icon: <Truck size={28} />, color: "#f97316", path: "/suppliers", key: "F3" },
        stores: { order: 4, label: "Sucursales", icon: <Building size={28} />, color: "#06b6d4", path: "/stores", key: "F4" },
        inventory: { order: 5, label: "Inventario", icon: <ClipboardList size={28} />, color: "#a855f7", path: "/inventory", key: "F5" },
        cashRegisters: { order: 6, label: "Cajas", icon: <Printer size={28} />, color: "#f59e0b", path: "/cash-registers", key: "F6" },
        corte: { order: 7, label: "Corte de Caja", icon: <Scissors size={28} />, color: "#eab308", path: "/cash-closing", key: "F7" },
        users: { order: 8, label: "Usuarios", icon: <UserCog size={28} />, color: "#0ea5e9", path: "/users", key: "F8" },
        reports: { order: 9, label: "Reportes", icon: <FileText size={28} />, color: "#6b7280", path: "/reports", key: "F9" },
        notifications: { order: 10, label: "Notificaciones", icon: <Bell size={28} />, color: "#ef4444", path: "/notifications", key: "F10" },
        settings: { order: 11, label: "Configuración", icon: <Settings size={28} />, color: "#0ea5e9", path: "/settings", key: "F11" },
        sales: { order: 0, label: "Ventas", icon: <ShoppingCart size={28} />, color: "#3b82f6", path: "/sales", key: "F12" },
    };

    const shortcuts = user.modules
        .filter((m) => MODULE_CONFIG[m] && user.permissions[m]?.read)
        .map((m) => MODULE_CONFIG[m])
        .sort((a, b) => a.order - b.order);

    return (
        <>
            <div className="bg-dark flex flex-col items-center pb-8 font-sans text-slate-50">
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
                            className="flex flex-col items-center justify-center bg-secondary rounded-2xl py-4 shadow-soft hover:shadow-hard transition"
                            onClick={() => navigate(item.path)}
                        >
                            <div style={{ color: item.color }} className="mb-2 flex items-center justify-center">
                                {item.icon}
                            </div>
                            <span className="text-base font-semibold">{item.label}</span>
                            <span className="text-[12px] text-slate-400 mt-1">{item.key}</span>
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

            {/* 🧾 Modal bloqueante para registrar caja */}
            {showRegisterModal && (
                <CashRegisterForm
                    open={showRegisterModal}
                    onClose={() => {
                        addToast({
                            type: "warning",
                            title: "Caja requerida",
                            message: "Debes registrar una caja para continuar.",
                        });
                        setShowRegisterModal(true);
                    }}
                    onCreated={async (newRegister) => {
                        setShowRegisterModal(false);
                        addToast({
                            type: "success",
                            title: "Caja registrada",
                            message: "La caja se registró correctamente.",
                        });

                        const refreshed = await refreshCashRegister();
                        if (refreshed?.id) {
                            setCurrentRegister(refreshed);
                            if (user?.requires_cash_session && !currentSession) {
                                console.log("💰 Mostrando modal de apertura tras registrar caja...");
                                setShowSessionModal(true);
                            }
                        }
                    }}
                />
            )}
        </>
    );
}
