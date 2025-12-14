import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "@/store/useAuthStore";
import mainLogo from "@/assets/images/logo/BWISE-logo.png";

export default function SplashScreen() {
    const navigate = useNavigate();
    const { user, initSession, isAuthenticated, statusMessage } = useAuthStore();
    const SPLASH_DURATION = parseInt(import.meta.env.VITE_SPLASH_TIME || "2000", 10);

    const [visible, setVisible] = useState(true);

    useEffect(() => {
        const init = async () => {
            // Si el mensaje es "Cerrando sesión..." no revalida token
            if (statusMessage === "Cerrando sesión...") {
                setTimeout(() => {
                    setVisible(false);
                    setTimeout(() => navigate("/login"), 400);
                }, 1000);
                return;
            }

            try {
                await initSession();
            } catch (err) {
                console.error("⚠️ Error al inicializar sesión:", err);
            } finally {
                setTimeout(() => {
                    setVisible(false);
                    setTimeout(() => {
                        navigate(isAuthenticated ? "/dashboard" : "/login");
                    }, 400);
                }, SPLASH_DURATION);
            }
        };

        init();
    }, [navigate, isAuthenticated, initSession, statusMessage]);

    const tenantLogo = mainLogo;
    const tenantName = user?.tenant?.name || "Mirai POS";

    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    style={{
                        height: "100vh",
                        width: "100vw",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        alignItems: "center",
                        backgroundColor: "#0f172a",
                        color: "#f8fafc",
                        fontFamily: "system-ui",
                        textAlign: "center",
                    }}
                >
                    <motion.img
                        src={tenantLogo}
                        alt="Logo"
                        style={{
                            width: "140px",
                            height: "140px",
                            borderRadius: "20px",
                            marginBottom: "20px",
                            boxShadow: "0 0 20px rgba(0,0,0,0.3)",
                        }}
                        initial={{ scale: 0.7, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.6 }}
                    />

                    <motion.h1
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        style={{
                            fontSize: "1.8rem",
                            fontWeight: "500",
                            marginBottom: "8px",
                        }}
                    >
                        {tenantName}
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        style={{
                            color: "#94a3b8",
                            marginBottom: "20px",
                            fontSize: "0.95rem",
                        }}
                    >
                        {statusMessage}
                    </motion.p>

                    {/* Barra animada */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6 }}
                        style={{
                            width: "100px",
                            height: "4px",
                            backgroundColor: "#38bdf8",
                            borderRadius: "2px",
                            overflow: "hidden",
                            position: "relative",
                        }}
                    >
                        <motion.div
                            style={{
                                width: "40%",
                                height: "100%",
                                backgroundColor: "#fff",
                                position: "absolute",
                                left: "0",
                                top: "0",
                            }}
                            animate={{
                                x: ["0%", "150%"],
                            }}
                            transition={{
                                duration: 1.2,
                                repeat: Infinity,
                                ease: "easeInOut",
                            }}
                        />
                    </motion.div>

                    <motion.p
                        style={{
                            position: "absolute",
                            bottom: "30px",
                            fontSize: "0.8rem",
                            color: "#64748b",
                        }}
                    >
                        v1.0.0 — {new Date().getFullYear()}
                    </motion.p>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
