import { useState, useEffect } from "react";
import { useParams, Outlet } from "react-router-dom";
import { motion } from "framer-motion";
import { getPatientProfile } from "@/services/patient.service";

import PatientDetailLayout from "./PatientDetailLayout";
import PatientSidebar from "./PatientSidebar";

// Nuevo modal
import PatientAlertsModal from "./components/PatientAlertsModal";
import splashWaiting from "@/assets/images/splash/splash-waiting.png";

export default function PatientDetail() {
    const { id } = useParams();

    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    // Modal logic
    const [showAlertsModal, setShowAlertsModal] = useState(false);

    const loadProfile = async () => {
        try {
            // 👇 Espera forzada (solo para pruebas)
            await new Promise(resolve => setTimeout(resolve, 4500));

            const data = await getPatientProfile(id);
            setProfile(data);
            console.log(data);

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
            <motion.div
                className="flex h-full items-center justify-center bg-slate-100 dark:bg-dark"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
            >
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className="
                    text-center bg-white dark:bg-secondary px-10 py-6 rounded-2xl
                    shadow-xl border border-slate-200 dark:border-slate-700 flex flex-col items-center gap-4
                "
                >
                    {/* Imagen del splash */}
                    <img
                        src={splashWaiting}
                        alt="Loading..."
                        className="w-60 h-60 object-contain animate-pulse"
                    />

                    {/* Texto */}
                    <p className="text-lg font-medium text-slate-600 dark:text-slate-300">
                        Cargando expediente del paciente…
                    </p>
                </motion.div>
            </motion.div>
        );
    }


    const clinicalAlerts = profile.alerts.filter(a => !a.is_admin_alert);
    const adminAlerts = profile.alerts.filter(a => a.is_admin_alert);

    return (
        <>
            <PatientDetailLayout sidebar={<PatientSidebar id={id} profile={profile} />}>
                <Outlet context={{ profile }} />
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
