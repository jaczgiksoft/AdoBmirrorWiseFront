import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import api from "@/services/api";
import { fetchCurrentUser } from "@/services/auth.service";
import { verifyTenantCode } from "@/services/tenant.service";
import { useAuthStore } from "@/store/useAuthStore";
import { Loader2, LogIn, Eye, EyeOff, ScreenShare } from "lucide-react";
import { useHotkeys } from "@/hooks/useHotkeys";
import { ConfirmDialog } from "@/components/feedback";
import mainLogo from "@/assets/images/logo/BWISE-logo.png";

export default function LoginPage() {
    const [tenant, setTenant] = useState("");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showExitDialog, setShowExitDialog] = useState(false);

    const { isAuthenticated, setSession } = useAuthStore();
    const navigate = useNavigate();
    const usernameRef = useRef(null);

    // 🧭 Redirigir si ya está autenticado (antes de cualquier return condicional)
    useEffect(() => {
        if (isAuthenticated) {
            navigate("/dashboard", { replace: true });
        }
    }, [isAuthenticated, navigate]);

    // 🔸 Foco inicial en campo de usuario
    useEffect(() => {
        setTimeout(() => {
            usernameRef.current?.focus();
        }, 100);
    }, []);

    // 🔸 Cargar tenant guardado (si existe)
    useEffect(() => {
        const savedTenant = localStorage.getItem("tenantCode");
        if (savedTenant) setTenant(savedTenant);
    }, []);

    // 🔹 Atajo global ESC → abrir diálogo de salida
    useHotkeys(
        {
            escape: () => {
                if (!isAuthenticated) {
                    setShowExitDialog(true);
                    return "prevent";
                }
            },
        },
        [isAuthenticated]
    );

    // 📺 Abrir Kiosko con validación de Tenant
    const handleOpenKiosk = async () => {
        if (!tenant) {
            setMessage("Falta el dato de código de cliente en login");
            return;
        }

        if (loading) return;
        setLoading(true);
        setMessage("🔍 Verificando código de cliente...");

        try {
            const tenantData = await verifyTenantCode(tenant);
            console.log("✅ Tenant verificado para Kiosko:", tenantData);
            
            // Guardar para uso en la ventana del Kiosko
            localStorage.setItem("verifiedTenant", JSON.stringify(tenantData));
            
            setMessage("");
            window.electronAPI.openKiosk();
        } catch (err) {
            setMessage(err || "❌ Error al verificar código de cliente");
        } finally {
            setLoading(false);
        }
    };

    // 🔐 Envío de credenciales
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (loading) return;
        setLoading(true);
        setMessage("🔄 Iniciando sesión...");

        try {
            const res = await api.post("/auth/login", { tenant, username, password });
            console.log("🔐 Respuesta de /auth/login:", res.data);

            const token = res.data.token;
            await window.electronAPI.saveToken(token);

            // Guardar tenant para próximas sesiones
            localStorage.setItem("tenantCode", tenant);

            const userData = await fetchCurrentUser();
            console.log("👤 Datos del usuario autenticado (/auth/me):", userData);

            setSession(userData);
            setMessage("🔄 Cargando entorno POS...");
            await new Promise((r) => setTimeout(r, 1200));
            navigate("/dashboard");
        } catch (err) {
            const errorMsg =
                err.response?.data?.message ||
                "❌ Credenciales incorrectas o error de conexión";
            setMessage(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    // =====================================================
    // 🔒 Vista principal de Login (cuando no está autenticado)
    // =====================================================
    if (!isAuthenticated) {
        return (
            <div className="h-screen w-screen bg-dark/80 backdrop-blur-sm flex items-center justify-center font-sans">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4 }}
                    className="bg-secondary/90 rounded-2xl shadow-hard p-8 w-[340px] text-center border border-white/10 relative overflow-hidden"
                >
                    {/* 📺 Kiosk Trigger Button */}
                    <button
                        type="button"
                        onClick={handleOpenKiosk}
                        disabled={loading}
                        className="absolute top-4 right-4 p-2 rounded-lg text-slate-500 hover:text-sky-400 hover:bg-sky-500/10 hover:shadow-[0_0_15px_rgba(56,189,248,0.3)] transition-all duration-300 group disabled:opacity-50"
                        title="Abrir Kiosko de Auto-confirmación"
                    >
                        {loading ? (
                            <Loader2 size={20} className="animate-spin" />
                        ) : (
                            <ScreenShare size={20} className="group-hover:scale-110 transition-transform" />
                        )}
                    </button>
                    <div className="flex flex-col items-center mb-6">
                        <motion.img
                            src={mainLogo}
                            alt="Logo"
                            className="w-24 h-24 rounded-xl shadow-soft mb-4 object-cover"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.6 }}
                        />
                        <h1 className="text-2xl font-semibold text-primary">BWISE Dental</h1>
                        <p className="text-slate-400 text-sm mt-1">
                            Accede a tu plataforma operativa de manera segura
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                        <input
                            type="text"
                            placeholder="Código de cliente"
                            value={tenant}
                            onChange={(e) => {
                                const value = e.target.value;
                                setTenant(value);
                                localStorage.setItem("tenantCode", value);
                            }}
                            disabled={loading}
                            className="input"
                        />
                        <input
                            ref={usernameRef}
                            type="text"
                            placeholder="Usuario"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            disabled={loading}
                            className="input"
                        />
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="Contraseña"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={loading}
                                className="input pr-10"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition"
                                tabIndex={-1}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>

                        <div className="flex flex-col gap-3 mt-3">
                            {/* 🔹 Botón principal de ingreso */}
                            <motion.button
                                type="submit"
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.97 }}
                                disabled={loading}
                                className="flex items-center justify-center gap-2 py-2.5 rounded-lg bg-sky-500 text-white font-medium hover:bg-sky-400 transition disabled:opacity-50"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="animate-spin" size={18} />
                                        Iniciando sesión...
                                    </>
                                ) : (
                                    <>
                                        <LogIn size={18} />
                                        Ingresar
                                    </>
                                )}
                            </motion.button>

                            {/* 🔻 Botón para salir */}
                            <motion.button
                                type="button"
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.97 }}
                                onClick={() => setShowExitDialog(true)}
                                className="flex items-center justify-center gap-2 py-2.5 rounded-lg bg-error text-white font-medium hover:bg-red-500 transition"
                            >
                                Cerrar aplicación
                            </motion.button>
                        </div>
                    </form>

                    {message && (
                        <p className="mt-4 text-center text-sm text-slate-300">{message}</p>
                    )}

                    <p className="text-xs text-center text-slate-500 mt-8">
                        v1.0.0 — {new Date().getFullYear()}
                    </p>
                </motion.div>

                {/* 🪟 Modal de confirmación */}
                <ConfirmDialog
                    open={showExitDialog}
                    title="Cerrar aplicación"
                    message="¿Seguro que deseas salir de BWISE Dental?"
                    onCancel={() => {
                        setShowExitDialog(false);
                        setTimeout(() => {
                            usernameRef.current?.focus();
                        }, 100);
                    }}
                    onConfirm={() => {
                        setShowExitDialog(false);
                        window.electronAPI.exitApp();
                    }}
                />
            </div>
        );
    }

    // Si llega aquí, ya está autenticado y se está redirigiendo
    return null;
}
