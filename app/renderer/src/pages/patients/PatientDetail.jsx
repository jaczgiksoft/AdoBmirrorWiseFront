import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
    X,
    Edit2,
    Trash2,
    Star,
    AlertTriangle,
    UserPlus,
} from "lucide-react";

import { getPatientProfile } from "@/services/patient.service";
import api from "@/services/api";
import { API_BASE } from "@/utils/apiBase";
import { useToastStore } from "@/store/useToastStore";
import { useHotkeys } from "@/hooks/useHotkeys";
import PatientForm from "./PatientForm";

/* ==================================================================================
   PATIENT DETAIL — PREMIUM + CLINICAL DASHBOARD STYLE
   - Header premium tipo ficha clínica
   - Mini dashboard clínico
   - Tabs modernos con barra animada
   - Cards Premium
   - Alertas y Representantes reales por paciente
================================================================================== */

export default function PatientDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { addToast } = useToastStore();

    const [profile, setProfile] = useState(null);
    const [alerts, setAlerts] = useState([]);
    const [representatives, setRepresentatives] = useState([]);

    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("general");
    const [showEdit, setShowEdit] = useState(false);

    /* -------------------------------------------------------------------------- */
    /* Loaders                                                                   */
    /* -------------------------------------------------------------------------- */
    const loadProfile = async () => {
        try {
            const data = await getPatientProfile(id);
            setProfile(data);
        } catch (err) {
            addToast({ type: "error", title: "Error al cargar", message: err.message });
        }
    };

    const loadAlerts = async () => {
        try {
            const res = await api.get(`/patient-alerts/patient/${id}`);
            setAlerts(res.data || []);
        } catch (err) {
            console.error("Error cargando alertas", err);
        }
    };

    const loadRepresentatives = async () => {
        try {
            const res = await api.get(`/patient-representative-links/patient/${id}`);
            setRepresentatives(res.data || []);
        } catch (err) {
            console.error("Error cargando representantes", err);
        }
    };

    useEffect(() => {
        Promise.all([loadProfile(), loadAlerts(), loadRepresentatives()]).finally(
            () => setLoading(false)
        );
    }, [id]);

    /* -------------------------------------------------------------------------- */
    /* Hotkeys                                                                   */
    /* -------------------------------------------------------------------------- */
    useHotkeys({
        escape: () => navigate("/patients"),
        enter: () => setShowEdit(true),
        a: () => setActiveTab("alerts"),
        r: () => setActiveTab("representatives"),
    });

    /* -------------------------------------------------------------------------- */
    /* LOADING                                                                    */
    /* -------------------------------------------------------------------------- */
    if (loading || !profile) {
        return (
            <div className="flex h-screen items-center justify-center text-slate-500">
                Cargando expediente...
            </div>
        );
    }

    /* ==================================================================================
       HEADER PREMIUM — FICHA CLÍNICA
    ================================================================================== */
    const HeaderCard = () => (
        <div className="bg-white dark:bg-secondary shadow-lg rounded-2xl p-6 mb-6 border border-slate-200 dark:border-slate-700 flex gap-6 items-center">
            <img
                src={profile.photo_url ? `${API_BASE}/${profile.photo_url}` : "/placeholder-user.png"}
                className="w-28 h-28 rounded-2xl object-cover shadow-md border border-slate-300"
            />

            <div className="flex-1">
                <h1 className="text-3xl font-bold text-primary mb-1">
                    {profile.first_name} {profile.last_name}
                </h1>

                <div className="flex gap-2 flex-wrap text-sm">
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full font-semibold shadow-sm">
                        Expediente: {profile.medical_record_number}
                    </span>

                    {profile.family_code && (
                        <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full font-semibold shadow-sm">
                            Familia: {profile.family_code}
                        </span>
                    )}

                    {profile.status?.name && (
                        <span
                            className="px-3 py-1 rounded-full font-semibold shadow-sm text-white"
                            style={{ background: profile.status.color }}
                        >
                            {profile.status.name}
                        </span>
                    )}

                    {profile.types?.map((t) => (
                        <span
                            key={t.id}
                            className="px-3 py-1 rounded-full text-white font-semibold shadow-sm"
                            style={{ background: t.color }}
                        >
                            {t.name}
                        </span>
                    ))}
                </div>
            </div>

            <button
                onClick={() => setShowEdit(true)}
                className="px-4 py-2 rounded-xl bg-primary text-white hover:bg-primary/80 flex items-center gap-2 shadow-lg"
            >
                <Edit2 size={18} /> Editar
            </button>
        </div>
    );

    /* ==================================================================================
       MINI DASHBOARD CLÍNICO — PREMIUM
    ================================================================================== */
    const ClinicalMiniDashboard = () => {
        const age = profile.birth_date
            ? Math.floor((Date.now() - new Date(profile.birth_date)) / 31557600000)
            : "—";

        const risk = (() => {
            if (profile.has_heart_conditions || profile.has_diabetes) return "Alto";
            if (profile.is_under_medical_treatment) return "Medio";
            return "Bajo";
        })();

        return (
            <div className="grid grid-cols-3 gap-4 mb-6">
                {[{
                    label: "Edad",
                    value: `${age} años`,
                }, {
                    label: "Riesgo clínico",
                    value: risk,
                }, {
                    label: "Último estudio",
                    value: profile.last_radiograph_date || "Sin registros",
                }].map((item, i) => (
                    <div
                        key={i}
                        className="p-4 rounded-xl bg-white dark:bg-secondary shadow border border-slate-200 dark:border-slate-700"
                    >
                        <p className="text-xs uppercase text-slate-500 font-semibold">{item.label}</p>
                        <p className="mt-1 text-lg font-bold">{item.value}</p>
                    </div>
                ))}
            </div>
        );
    };

    /* ==================================================================================
       SECCIONES (CARDS)
    ================================================================================== */

    const SectionCard = ({ title, children }) => (
        <div className="bg-white dark:bg-secondary p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm mb-6">
            <h3 className="text-lg font-bold mb-4 text-primary flex items-center gap-2">
                {title}
            </h3>
            {children}
        </div>
    );

    /* ---------- GENERAL ---------- */
    const GeneralSection = () => (
        <SectionCard title="Información General">
            <div className="grid grid-cols-2 gap-4 text-sm">
                <p><strong>Género:</strong> {profile.genre}</p>
                <p><strong>Nacimiento:</strong> {profile.birth_date}</p>
                <p><strong>Teléfono:</strong> {profile.phone_number}</p>
                <p><strong>Correo:</strong> {profile.email || "—"}</p>
                <p><strong>Ocupación:</strong> {profile.occupation?.name || "—"}</p>
                <p><strong>Referido por:</strong> {profile.referral?.name || "—"}</p>
            </div>
        </SectionCard>
    );

    /* ---------- DIRECCIÓN ---------- */
    const AddressSection = () => (
        <SectionCard title="Dirección">
            <div className="grid grid-cols-2 gap-4 text-sm">
                <p><strong>Calle:</strong> {profile.address_street_name || "—"}</p>
                <p><strong>Número:</strong> {profile.address_street_number || "—"}</p>
                <p><strong>Interior:</strong> {profile.address_apartment_number || "—"}</p>
                <p><strong>Colonia:</strong> {profile.address_neighborhood || "—"}</p>
                <p><strong>Ciudad:</strong> {profile.address_city || "—"}</p>
                <p><strong>Estado:</strong> {profile.address_state || "—"}</p>
                <p><strong>País:</strong> {profile.address_country || "—"}</p>
                <p><strong>Código postal:</strong> {profile.address_zip_code || "—"}</p>
            </div>
        </SectionCard>
    );

    /* ---------- CLÍNICO ---------- */
    const ClinicalSection = () => (
        <SectionCard title="Información Clínica">
            <div className="grid grid-cols-2 gap-4 text-sm">
                <p><strong>Tratamiento médico:</strong> {profile.is_under_medical_treatment ? "Sí" : "No"}</p>
                <p><strong>Medicamentos:</strong> {profile.current_medications || "—"}</p>
                <p><strong>Alergias:</strong> {profile.allergies_description || "—"}</p>
                <p><strong>Hepatitis:</strong> {profile.has_hepatitis ? "Sí" : "No"}</p>
                <p><strong>Diabetes:</strong> {profile.has_diabetes ? "Sí" : "No"}</p>
                <p><strong>Problemas respiratorios:</strong> {profile.has_lung_conditions ? "Sí" : "No"}</p>
                <p><strong>Migrañas:</strong> {profile.has_migraines ? "Sí" : "No"}</p>
                <p><strong>Ortodoncia previa:</strong> {profile.had_previous_orthodontics ? "Sí" : "No"}</p>
                <p><strong>Última radiografía:</strong> {profile.last_radiograph_date || "—"}</p>
                <p><strong>Último examen dental:</strong> {profile.last_dental_exam_date || "—"}</p>
            </div>
        </SectionCard>
    );

    /* ---------- ALERTAS ---------- */
    const AlertsSection = () => (
        <SectionCard title={`Alertas (${alerts.length})`}>
            {!alerts.length ? (
                <p className="text-sm text-slate-500">No hay alertas registradas.</p>
            ) : (
                <div className="flex flex-col gap-3">
                    {alerts.map((a) => (
                        <motion.div
                            key={a.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`p-4 rounded-xl border flex gap-3 shadow-sm ${
                                a.is_admin_alert
                                    ? "border-yellow-400 bg-yellow-50"
                                    : "border-red-400 bg-red-50"
                            }`}
                        >
                            <AlertTriangle
                                className={`mt-1 ${
                                    a.is_admin_alert ? "text-yellow-600" : "text-red-600"
                                }`}
                                size={20}
                            />
                            <div>
                                <p className="font-semibold text-sm">{a.title}</p>
                                <p className="text-xs text-slate-600 whitespace-pre-line mt-1">
                                    {a.description || "Sin descripción"}
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </SectionCard>
    );

    /* ---------- REPRESENTANTES ---------- */
    const RepresentativesSection = () => (
        <SectionCard title={`Representantes (${representatives.length})`}>
            {!representatives.length ? (
                <p className="text-sm text-slate-500">Este paciente no tiene representantes asignados.</p>
            ) : (
                <div className="flex flex-col gap-4">
                    {representatives.map((r) => (
                        <motion.div
                            key={r.id}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="p-4 rounded-xl bg-white dark:bg-dark/40 border border-slate-200 dark:border-slate-700 shadow flex justify-between items-center"
                        >
                            <div>
                                <p className="font-semibold text-sm">{r.representative_name}</p>
                                <p className="text-xs text-slate-500">{r.relationship || "Relación no especificada"}</p>

                                {r.is_primary && (
                                    <span className="text-xs text-green-600 font-semibold flex items-center gap-1 mt-1">
                                        <Star size={12} /> Principal
                                    </span>
                                )}
                            </div>

                            <div className="flex gap-3">
                                <Star
                                    size={20}
                                    className="text-yellow-500 cursor-pointer hover:scale-110 transition"
                                    onMouseDown={() => setPrimary(r.id)}
                                />
                                <Trash2
                                    size={20}
                                    className="text-red-500 cursor-pointer hover:scale-110 transition"
                                    onMouseDown={() => removeRepresentative(r.id)}
                                />
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </SectionCard>
    );

    /* ==================================================================================
       ACCIONES REPRESENTANTES
    ================================================================================== */
    const setPrimary = async (representativeLinkId) => {
        try {
            await api.put(`/patient-representative-links/set-primary/${representativeLinkId}`);
            addToast({ type: "success", title: "Actualizado", message: "Representante marcado como principal" });
            loadRepresentatives();
        } catch (err) {
            addToast({ type: "error", title: "Error", message: "No se pudo cambiar el principal" });
        }
    };

    const removeRepresentative = async (representativeLinkId) => {
        try {
            await api.delete(`/patient-representative-links/${representativeLinkId}`);
            addToast({ type: "success", title: "Eliminado", message: "Representante eliminado" });
            loadRepresentatives();
        } catch (err) {
            addToast({ type: "error", title: "Error", message: "No se pudo eliminar" });
        }
    };

    /* ==================================================================================
       TABS PREMIUM
    ================================================================================== */
    const tabs = [
        { id: "general", label: "General" },
        { id: "address", label: "Dirección" },
        { id: "clinical", label: "Clínico" },
        { id: "alerts", label: "Alertas" },
        { id: "representatives", label: "Representantes" },
    ];

    const PremiumTabs = () => (
        <div className="flex border-b border-slate-300 dark:border-slate-700 mb-6 relative">
            {tabs.map((t) => (
                <button
                    key={t.id}
                    onClick={() => setActiveTab(t.id)}
                    className={`flex-1 py-3 text-sm font-semibold transition relative ${
                        activeTab === t.id
                            ? "text-primary"
                            : "text-slate-500 dark:text-slate-400"
                    }`}
                >
                    {t.label}
                    {activeTab === t.id && (
                        <motion.div
                            layoutId="tab-indicator"
                            className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                        />
                    )}
                </button>
            ))}
        </div>
    );

    const contentMap = {
        general: <GeneralSection />,
        address: <AddressSection />,
        clinical: <ClinicalSection />,
        alerts: <AlertsSection />,
        representatives: <RepresentativesSection />,
    };

    /* ==================================================================================
       FINAL RENDER
    ================================================================================== */
    return (
        <div className="bg-slate-100 dark:bg-dark min-h-screen text-slate-900 dark:text-slate-100">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-5xl mx-auto px-6 py-10">

                {/* Volver */}
                <button
                    onClick={() => navigate("/patients")}
                    className="text-slate-500 hover:text-slate-800 dark:hover:text-white flex items-center gap-1 mb-4"
                >
                    <X size={16} /> Volver
                </button>

                {/* Header */}
                <HeaderCard />
                <ClinicalMiniDashboard />

                {/* Tabs */}
                <PremiumTabs />

                {/* Contenido dinámico */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ duration: 0.25 }}
                    >
                        {contentMap[activeTab]}
                    </motion.div>
                </AnimatePresence>

                {/* Modal Editar */}
                <PatientForm
                    open={showEdit}
                    onClose={() => setShowEdit(false)}
                    onCreated={() => {
                        setShowEdit(false);
                        loadProfile();
                    }}
                    existingPatient={profile}
                />
            </motion.div>
        </div>
    );
}
