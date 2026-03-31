import { useState, useEffect } from "react";
import { useParams, Outlet } from "react-router-dom";
import { motion } from "framer-motion";
import { getPatientProfile } from "@/services/patient.service";

import PatientDetailLayout from "./PatientDetailLayout";
import PatientSidebar from "./PatientSidebar";

// Nuevo modal
import PatientAlertsModal from "./components/PatientAlertsModal";

export default function PatientDetail() {
    const { id } = useParams();

    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    // Modal logic
    const [showAlertsModal, setShowAlertsModal] = useState(false);

    const loadProfile = async () => {
        try {
            const data = await getPatientProfile(id);
            setProfile(data);
            console.log("Información del paciente:", data);

            const clinical = data.alerts?.filter(a => !a.is_admin_alert) || [];
            const admin = data.alerts?.filter(a => a.is_admin_alert) || [];

            if (clinical.length > 0 || admin.length > 0) {
                setTimeout(() => {
                    setShowAlertsModal(true);
                }, 400);
            }

        } catch (e) {
            console.error("Error cargando perfil:", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadProfile();
    }, [id]);

    // ---------- SPLASH PREMIUM ----------
    if (loading || !profile) {
        return (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 dark:from-dark dark:via-slate-900 dark:to-slate-950 font-sans">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    className="
                        relative flex flex-col items-center gap-6 px-12 py-10 rounded-2xl
                        bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl
                        border border-white/50 dark:border-slate-800
                        shadow-[0_8px_32px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)]
                        ring-1 ring-primary/20 dark:ring-primary/10
                    "
                >
                    {/* Decorative Top Line */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />

                    {/* ==== SYNCHRONIZED DUAL RIPPLE WITH CENTRAL PULSE ==== */}
                    <div className="absolute inset-0 pointer-events-none rounded-2xl overflow-visible">

                        {/* Soft glow blending with top decorative line */}
                        <div
                            className="
            absolute top-0 left-1/2 -translate-x-1/2 
            w-1/3 h-[2px]
            bg-primary/25 blur-[4px]
        "
                        />

                        {/* Ripple Layer 1 — EXACT sync with center dot */}
                        <motion.div
                            className="
            absolute inset-0 rounded-2xl
            border border-primary/22
            shadow-[0_0_10px_rgba(0,184,219,0.20)]
        "
                            animate={{
                                scale: [1, 1.045, 1],          // sutil pero visible
                                opacity: [0.40, 0.20, 0.40],  // en el mismo ritmo que el dot
                            }}
                            transition={{
                                duration: 2,                  // EXACT MATCH to the dot
                                repeat: Infinity,
                                ease: "easeInOut",
                            }}
                        />

                        {/* Ripple Layer 2 — synced but with slight delay (depth effect) */}
                        <motion.div
                            className="
            absolute inset-0 rounded-2xl
            border border-primary/14
            shadow-[0_0_18px_rgba(0,184,219,0.12)]
        "
                            animate={{
                                scale: [1, 1.08, 1],          // un poquito más grande
                                opacity: [0.22, 0.10, 0.22],
                            }}
                            transition={{
                                duration: 2,
                                repeat: Infinity,
                                ease: "easeInOut",
                                delay: 0.20                   // desfase sutil y elegante
                            }}
                        />
                    </div>



                    {/* Loader */}
                    <div className="relative w-20 h-20 flex items-center justify-center">
                        {/* Outer Pulse */}
                        <motion.div
                            animate={{ scale: [1, 1.3], opacity: [0.2, 0] }}
                            transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
                            className="absolute inset-0 rounded-full bg-primary/30 blur-md hidden dark:block"
                        />

                        {/* Spinning Arc */}
                        <motion.div
                            className="w-16 h-16 rounded-full border-[3px] border-slate-200 dark:border-slate-800 border-t-primary border-r-transparent"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                        />

                        {/* Inner Dot Pulse */}
                        <motion.div
                            className="absolute w-2.5 h-2.5 bg-primary rounded-full shadow-[0_0_12px_currentColor]"
                            animate={{ scale: [1, 1.5, 1], opacity: [0.7, 1, 0.7] }}
                            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        />
                    </div>

                    {/* Text Content */}
                    <div className="text-center space-y-1 z-10">
                        <p className="text-lg font-medium text-slate-600 dark:text-slate-300 tracking-tight">
                            Cargando expediente del paciente…
                        </p>
                        <motion.div
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3, duration: 0.5 }}
                            className="flex items-center justify-center gap-2"
                        >
                            <span className="h-[1px] w-6 bg-slate-300 dark:bg-slate-700" />
                            <span className="text-[10px] font-bold text-primary tracking-[0.2em] uppercase">
                                BWISE DENTAL
                            </span>
                            <span className="h-[1px] w-6 bg-slate-300 dark:bg-slate-700" />
                        </motion.div>
                    </div>
                </motion.div>
            </div>
        );
    }


    const clinicalAlerts = profile.alerts.filter(a => !a.is_admin_alert);
    const adminAlerts = profile.alerts.filter(a => a.is_admin_alert);

    return (
        <>
            <PatientDetailLayout sidebar={<PatientSidebar id={id} profile={profile} />}>
                <Outlet context={{ profile, refreshProfile: loadProfile }} />
            </PatientDetailLayout>

            <PatientAlertsModal
                open={showAlertsModal}
                onClose={() => setShowAlertsModal(false)}
                clinicalAlerts={clinicalAlerts}
                adminAlerts={adminAlerts}
            />
        </>
    );
}
