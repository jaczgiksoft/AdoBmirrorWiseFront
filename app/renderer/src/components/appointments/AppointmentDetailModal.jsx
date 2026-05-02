import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
    X, Calendar, Clock, User, Stethoscope, FileText, Edit2, ArrowRight,
    AlertCircle, CheckCircle, Activity, Lock, Phone, Mail, CreditCard,
    History, MapPin, Star, Receipt, BadgeCheck, Loader2, Info
} from "lucide-react";
import { API_BASE } from "@/utils/apiBase";
import PatientEvaluationModal from "./PatientEvaluationModal";
import AppointmentCheckoutModal from "./AppointmentCheckoutModal";
import ChargeBreakdown from "./checkout/ChargeBreakdown";
import { getStatusConfig } from "@/utils/statusConfig";
import { updateAppointment } from "@/services/appointment.service";
import { useToastStore } from "@/store/useToastStore";

export default function AppointmentDetailModal({ appointment, open, onClose, onEdit, onSuccess }) {
    // 1. Hooks (MUST be top level and unconditional)
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('details');
    const [evaluations, setEvaluations] = useState([]);
    const [showEvaluationModal, setShowEvaluationModal] = useState(false);
    const [loadingStatus, setLoadingStatus] = useState(false);

    // Checkout state
    const [showCheckout, setShowCheckout] = useState(false);
    const [checkoutResult, setCheckoutResult] = useState(null);

    const { addToast } = useToastStore();
    const hasEvaluation = evaluations.some(e => e.appointmentId === appointment?.id);

    const isEditable = useMemo(() => {
        if (!appointment) return false;

        const { status, date, start_time } = appointment;

        if (['en_espera', 'en_tratamiento', 'finalizada', 'cancelada'].includes(status)) return false;
        if (status === 'pendiente') return true;
        if (status === 'confirmada') {
            try {
                const apptDateTime = new Date(`${date}T${start_time}`);
                const now = new Date();
                const diffMs = apptDateTime - now;
                return (diffMs / (1000 * 60 * 60)) >= 24;
            } catch (e) {
                return false;
            }
        }
        return true;
    }, [appointment]);

    // 2. Early Return
    if (!open || !appointment) return null;

    // 3. Status Change Handler
    const handleStatusChange = async (newStatus) => {
        if (loadingStatus) return;
        setLoadingStatus(true);
        try {
            await updateAppointment(appointment.id, { status: newStatus });
            const statusLabels = {
                en_tratamiento: 'Tratamiento iniciado',
                finalizada: 'Cita finalizada',
            };
            addToast({
                type: 'success',
                title: statusLabels[newStatus] || 'Estado actualizado',
                message: `La cita pasó a: ${getStatusConfig(newStatus).label}`,
            });
            onSuccess?.();
            onClose();
        } catch (err) {
            addToast({
                type: 'error',
                title: 'Error al actualizar',
                message: err?.message || 'No se pudo cambiar el estado de la cita.',
            });
        } finally {
            setLoadingStatus(false);
        }
    };

    // 3. Logic & Helpers (Post-check)
    const statusConfig = getStatusConfig(appointment.status);
    const StatusIcon = statusConfig.icon;

    // Formatting
    const formatTime = (timeStr) => timeStr?.substring(0, 5) || "--:--";
    const getPatientName = () => {
        if (!appointment.patient) return "Sin Paciente";
        return `${appointment.patient.first_name} ${appointment.patient.last_name}`;
    };

    const debugMode = true;

    const patientNotes =
        appointment.patient?.notes ??
        (debugMode && {
            content: "Paciente con alta sensibilidad dental. Usar anestesia.",
            type: "alert"
        });
    const patientNoteContent =
        typeof patientNotes === "string"
            ? patientNotes
            : patientNotes?.content;
    const hasPatientNotes = !!patientNotes;

    const getDoctorName = () => {
        if (!appointment.employee) return "Sin Doctor";
        return `Dr. ${appointment.employee.first_name} ${appointment.employee.last_name}`;
    };

    const calculateAge = (birthDate) => {
        if (!birthDate) return null;
        const today = new Date();
        const birth = new Date(birthDate);
        let age = today.getFullYear() - birth.getFullYear();
        const m = today.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        return age;
    };

    const getPatientAddress = () => {
        const p = appointment.patient;
        if (!p) return "Sin registrar";

        const streetParts = [
            p.address_street_name,
            p.address_street_number,
            p.address_apartment_number ? `Int ${p.address_apartment_number}` : ''
        ].filter(Boolean).join(" ");

        const addressParts = [
            streetParts,
            p.address_neighborhood,
            p.address_zip_code,
            p.address_city,
            p.address_state,
            p.address_country
        ].filter(Boolean);

        if (addressParts.length === 0) return "Sin registrar";
        return addressParts.join(", ");
    };

    // Calculate Totals from Services (informational only — does NOT drive checkout cost)
    const services = appointment.services || [];
    const totalServiceCost = services.reduce((acc, s) => acc + (parseFloat(s.price) || 0), 0);

    // Base amount for checkout comes from appointment.base_amount (patient budget/monthly payment)
    // Falls back to total_amount from the form, then services total as last resort
    const checkoutBaseAmount = parseFloat(appointment.base_amount)
        || parseFloat(appointment.total_amount)
        || totalServiceCost
        || 0;

    // Payment status helpers
    const isPaid = checkoutResult?.payment_status === 'paid' || checkoutResult?.payment_status === 'credited';
    const isPartiallyPaid = checkoutResult?.payment_status === 'partial';
    const canCheckout = ['en_tratamiento', 'finalizada'].includes(appointment.status);

    // Process Snapshot Logic
    const snapshot = appointment.process_snapshot;
    const processName = snapshot?.process_name || appointment.process?.name || "Sin Proceso";

    const steps = snapshot?.steps || [];
    const totalProcessDuration = steps.reduce((acc, s) => acc + (parseInt(s.duration_minutes) || 0), 0);

    return (
        <>
            <AnimatePresence>
                {open && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="relative bg-white dark:bg-secondary w-full max-w-6xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col h-[85vh]"
                        >
                            {/* 🟢 STATUS STRIP */}
                            <div
                                className="absolute left-0 top-0 bottom-0 w-1.5 z-30"
                                style={{
                                    backgroundColor: statusConfig.stripe,
                                    boxShadow: `0 0 8px ${statusConfig.stripe}`
                                }}
                            />
                            {/* Header */}
                            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 shrink-0">
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${statusConfig.bg} ${statusConfig.color} border ${statusConfig.border}`}>
                                        <StatusIcon size={24} />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                            Detalles de la Cita
                                        </h2>
                                        <div className="flex items-center gap-3 mt-1">
                                            <span className={`text-xs font-bold px-2 py-0.5 rounded-md uppercase tracking-wide border ${statusConfig.bg} ${statusConfig.color} ${statusConfig.border}`}>
                                                {statusConfig.label}
                                            </span>
                                            <span className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                                <Calendar size={14} /> {appointment.date}
                                            </span>
                                            <span className="text-slate-300 dark:text-slate-600">|</span>
                                            <span className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                                <Clock size={14} /> {formatTime(appointment.start_time)} - {formatTime(appointment.end_time)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Status Stepper (Horizontal Timeline) */}
                            <div className="bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800 px-8 py-4 shrink-0">
                                <StatusStepper appointment={appointment} />
                            </div>

                            {/* Body - split Layout */}
                            <div className="flex-1 flex overflow-hidden">

                                {/* Left Column: Patient Info (30%) - ALWAYS VISIBLE */}
                                <div className="w-[30%] bg-slate-50 dark:bg-slate-800/30 border-r border-slate-100 dark:border-slate-800 px-6 py-4 overflow-y-auto shrink-0 z-10">
                                    <div className="text-center mb-8">
                                        <div className="w-28 h-28 mx-auto bg-white dark:bg-slate-700 rounded-full flex items-center justify-center text-slate-400 mb-4 shadow-sm border border-slate-100 dark:border-slate-600 overflow-hidden relative group">
                                            {appointment.patient?.photo_url ? (
                                                <img src={`${API_BASE}/${appointment.patient.photo_url}`} alt="Patient" className="w-full h-full object-cover" />
                                            ) : (
                                                <User size={48} />
                                            )}
                                        </div>
                                        <h3 className="font-bold text-slate-800 dark:text-white text-xl">{getPatientName()}</h3>
                                        <div className="flex justify-center gap-2 mt-2">
                                            {appointment.patient?.medical_record_number && (
                                                <span className="px-3 py-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-full text-xs font-bold text-slate-500 dark:text-slate-300">
                                                    EXP: {appointment.patient.medical_record_number}
                                                </span>
                                            )}
                                            {calculateAge(appointment.patient?.birth_date) !== null && (
                                                <span className="px-3 py-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-full text-xs font-bold text-slate-500 dark:text-slate-300">
                                                    {calculateAge(appointment.patient?.birth_date)} Años
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-start gap-3">
                                            <div className="mt-0.5 text-slate-400"><Mail size={16} /></div>
                                            <div className="overflow-hidden">
                                                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Email</div>
                                                <div className="text-slate-700 dark:text-slate-300 truncate text-sm" title={appointment.patient?.email}>{appointment.patient?.email || "No registrado"}</div>
                                            </div>
                                        </div>
                                        <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-start gap-3">
                                            <div className="mt-0.5 text-slate-400"><Phone size={16} /></div>
                                            <div>
                                                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Teléfono</div>
                                                <div className="text-slate-700 dark:text-slate-300 text-sm">{appointment.patient?.phone_number || "No registrado"}</div>
                                            </div>
                                        </div>
                                        <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-start gap-3">
                                            <div className="mt-0.5 text-slate-400"><MapPin size={16} /></div>
                                            <div>
                                                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Dirección</div>
                                                <div className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed translate-y-[-1px]">{getPatientAddress()}</div>
                                            </div>
                                        </div>
                                        {hasPatientNotes && (
                                            <div className="sticky top-0 z-20 bg-slate-50 dark:bg-slate-800/30 pb-4">

                                                <div className="bg-red-50 dark:bg-red-900/10 p-4 rounded-xl border border-red-100 dark:border-red-900/20 shadow-sm">

                                                    <div className="flex items-center gap-2 mb-2">
                                                        <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
                                                        <span className="text-xs font-bold text-red-500 uppercase tracking-wider">
                                                            Nota del paciente
                                                        </span>
                                                    </div>

                                                    <p className="text-sm text-slate-700 dark:text-red-100/90 leading-relaxed max-h-32 overflow-y-auto pr-2">
                                                        {patientNoteContent}
                                                    </p>

                                                </div>

                                            </div>
                                        )}

                                    </div>
                                </div>

                                {/* Right Column: TABS & CONTENT (70%) */}
                                <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-secondary">
                                    {/* TABS HEADER */}
                                    <div className="flex items-center gap-1 p-2 border-b border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800/80 sticky top-0 z-20">
                                        <TabButton active={activeTab === 'details'} onClick={() => setActiveTab('details')} icon={Stethoscope} label="Detalles de la Cita" />
                                        <TabButton active={activeTab === 'activity'} onClick={() => setActiveTab('activity')} icon={History} label="Actividad" />
                                        <TabButton active={activeTab === 'payments'} onClick={() => setActiveTab('payments')} icon={CreditCard} label="Pagos" />
                                    </div>

                                    {/* TAB CONTENT SCROLLABLE AREA */}
                                    <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                                        {activeTab === 'details' && (
                                            <div className="space-y-8 animate-in fade-in zoom-in-95 duration-200">
                                                {/* Info Grid */}
                                                <div className="grid grid-cols-2 gap-6">
                                                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-5 border border-slate-100 dark:border-slate-700">
                                                        <div className="flex items-start gap-4">
                                                            <div className="p-3 bg-white dark:bg-slate-700 rounded-xl shadow-sm text-primary"><Clock size={20} /></div>
                                                            <div>
                                                                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Fecha y Hora</div>
                                                                <div className="font-semibold text-slate-800 dark:text-slate-200 text-lg">{appointment.date}</div>
                                                                <div className="text-primary font-bold">
                                                                    {formatTime(appointment.start_time)} - {formatTime(appointment.end_time)}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-5 border border-slate-100 dark:border-slate-700">
                                                        <div className="flex items-start gap-4">
                                                            <div className="p-3 bg-white dark:bg-slate-700 rounded-xl shadow-sm text-emerald-500"><Stethoscope size={20} /></div>
                                                            <div>
                                                                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Profesional Asignado</div>
                                                                <div className="font-semibold text-slate-800 dark:text-slate-200 text-lg">{getDoctorName()}</div>
                                                                <div className="text-sm text-slate-500 dark:text-slate-400">{appointment.clinic_area?.name || "Sin Área"}</div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Services */}
                                                <div>
                                                    <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2 uppercase tracking-wide opacity-80">
                                                        <Stethoscope size={16} /> Servicios Seleccionados
                                                    </h3>
                                                    <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
                                                        {services.length > 0 ? (
                                                            <div className="divide-y divide-slate-100 dark:divide-slate-700">
                                                                {services.map((svc, idx) => (
                                                                    <div key={idx} className="p-4 flex justify-between items-center group hover:bg-white dark:hover:bg-slate-700/50 transition">
                                                                        <div className="flex items-center gap-3">
                                                                            <div className="w-2 h-8 rounded-full" style={{ backgroundColor: svc.color || '#cbd5e1' }}></div>
                                                                            <div>
                                                                                <span className="font-bold text-slate-700 dark:text-slate-200 block text-base">{svc.name}</span>
                                                                                <span className="text-xs text-slate-500 font-medium">{svc.duration_minutes} min • {svc.suggested_units} unidades • ${parseFloat(svc.price).toFixed(2)}</span>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                                <div className="p-4 bg-white dark:bg-slate-900/50 flex justify-between items-center border-t border-slate-200 dark:border-slate-700">
                                                                    <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Costo Total</span>
                                                                    <span className="text-2xl font-bold text-slate-800 dark:text-white">$ {totalServiceCost.toFixed(2)}</span>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="p-8 text-center text-slate-400 italic">No hay servicios seleccionados.</div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Process */}
                                                <div>
                                                    <div className="flex items-center justify-between mb-4">
                                                        <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2 uppercase tracking-wide opacity-80">
                                                            <FileText size={16} /> Proceso Operativo
                                                        </h3>
                                                        {snapshot && (
                                                            <span className="text-[10px] font-bold px-2 py-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-full uppercase tracking-wider border border-emerald-200 dark:border-emerald-800">
                                                                Snapshot Version
                                                            </span>
                                                        )}
                                                    </div>

                                                    <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
                                                        <div className="p-4 bg-white dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                                                            <span className="font-semibold text-slate-700 dark:text-slate-200 text-lg">{processName}</span>
                                                        </div>
                                                        {steps.length > 0 ? (
                                                            <div className="relative">
                                                                {/* Connecting Line */}
                                                                <div className="absolute left-8 top-6 bottom-6 w-0.5 bg-slate-200 dark:bg-slate-600"></div>

                                                                <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
                                                                    {steps.map((step, idx) => (
                                                                        <div key={idx} className="p-4 pl-16 relative flex justify-between items-center group hover:bg-white dark:hover:bg-slate-700/30 transition">
                                                                            {/* Number Badge */}
                                                                            <div className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-600 flex items-center justify-center z-10 text-xs font-bold text-slate-400 group-hover:border-primary group-hover:text-primary transition">
                                                                                {idx + 1}
                                                                            </div>

                                                                            <div>
                                                                                <span className="text-slate-700 dark:text-slate-300 font-medium">{step.name_snapshot || step.name || "Paso"}</span>
                                                                                {step.description && <p className="text-xs text-slate-400 mt-0.5 max-w-md truncate">{step.description}</p>}
                                                                            </div>
                                                                            <span className="text-xs font-bold bg-white dark:bg-slate-700 px-2.5 py-1 rounded text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-slate-600">
                                                                                {step.duration_minutes} min
                                                                            </span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                                <div className="p-4 bg-white dark:bg-slate-900/50 flex justify-between items-center border-t border-slate-200 dark:border-slate-700">
                                                                    <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Duración Total</span>
                                                                    <span className="text-lg font-bold text-slate-800 dark:text-white">{totalProcessDuration} <span className="text-sm font-normal text-slate-500">min</span></span>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="p-8 text-center text-slate-400 italic">Sin pasos definidos.</div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Notes */}
                                                {appointment.notes && (
                                                    <div className="bg-amber-50 dark:bg-amber-900/10 p-6 rounded-2xl border border-amber-100 dark:border-amber-900/20">
                                                        <div className="text-xs font-bold text-amber-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                                                            <Edit2 size={12} /> Notas Adicionales
                                                        </div>
                                                        <p className="text-slate-700 dark:text-amber-100/90 italic text-lg leading-relaxed">
                                                            "{appointment.notes}"
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {activeTab === 'activity' && (
                                            <div className="space-y-8 animate-in fade-in zoom-in-95 duration-200">

                                                {/* Current Appointment Activity */}
                                                <div>
                                                    <div className="flex items-center gap-2 mb-4">
                                                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                                        <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wide opacity-80">
                                                            Bitácora Actual
                                                        </h3>
                                                    </div>
                                                    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
                                                        <div className="relative pl-6 space-y-8 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100 dark:before:bg-slate-700">
                                                            <TimelineItem date="Hace 5 min" title="Aplicación de Anestesia" desc="Se aplicó lidocaína al 2% con epinefrina en cuadrante superior." icon={Activity} color="blue" isCurrent={true} />
                                                            <TimelineItem date="Hace 15 min" title="Toma de Radiografía" desc="Radiografía periapical pieza #24 para verificar raíz." icon={FileText} color="emerald" />
                                                            <TimelineItem date="Hace 20 min" title="Higiene Inicial" desc="Limpieza de área y preparación del paciente." icon={CheckCircle} color="slate" />
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Historical Clinical Context */}
                                                <div className="opacity-80">
                                                    <div className="flex items-center gap-2 mb-4">
                                                        <History size={16} className="text-slate-400" />
                                                        <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                                                            Historial Clínico
                                                        </h3>
                                                    </div>

                                                    <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-700 p-6">
                                                        <div className="relative pl-6 space-y-8 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-700">
                                                            <TimelineItem date="05 Ene, 10:00 AM" title="Ajuste de Brackets" desc="Cambio de ligas y ajuste de arco superior." icon={Stethoscope} color="slate" />
                                                            <TimelineItem date="20 Dic, 04:30 PM" title="Consulta de Valoración" desc="Evaluación inicial y creación de plan de tratamiento." icon={FileText} color="slate" />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {activeTab === 'payments' && (
                                            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
                                                {!checkoutResult ? (
                                                    /* ── No payment yet ── */
                                                    <div className="flex flex-col items-center justify-center py-16 gap-4">
                                                        <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                                            <Receipt className="text-slate-300 dark:text-slate-600" size={36} />
                                                        </div>
                                                        <div className="text-center">
                                                            <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-1">Pendiente de cobro</h3>
                                                            <p className="text-sm text-slate-400">No se ha registrado ningún pago para esta cita.</p>
                                                        </div>
                                                        {canCheckout && (
                                                            <button
                                                                onClick={() => setShowCheckout(true)}
                                                                className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-700 transition active:scale-95"
                                                            >
                                                                <Receipt size={18} />
                                                                Ir a Checkout
                                                            </button>
                                                        )}
                                                    </div>
                                                ) : (
                                                    /* ── Payment registered ── */
                                                    <div className="space-y-5">
                                                        {/* Status badge */}
                                                        <div className={`flex items-center gap-3 p-4 rounded-2xl border ${isPaid
                                                            ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
                                                            : isPartiallyPaid
                                                                ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
                                                                : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                                                            }`}>
                                                            {isPaid
                                                                ? <BadgeCheck className="text-emerald-500" size={24} />
                                                                : <AlertCircle className="text-amber-500" size={24} />
                                                            }
                                                            <div>
                                                                <p className={`font-bold ${isPaid ? 'text-emerald-700 dark:text-emerald-300' : 'text-amber-700 dark:text-amber-300'}`}>
                                                                    {isPaid ? 'Pago completo' : isPartiallyPaid ? 'Pago parcial' : 'Sin pago'}
                                                                </p>
                                                                <p className="text-xs text-slate-400 mt-0.5">
                                                                    {checkoutResult.paid_at
                                                                        ? `Registrado el ${new Date(checkoutResult.paid_at).toLocaleString('es-MX')}`
                                                                        : ''}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        {/* Charge breakdown (read-only) */}
                                                        <ChargeBreakdown
                                                            baseAmount={checkoutResult.base_amount}
                                                            includedServices={services}
                                                            extras={checkoutResult.extras}
                                                            patientBalance={checkoutResult.patient_balance_included}
                                                            compact={true}
                                                        />

                                                        {/* Payment history row */}
                                                        <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                                                            <table className="w-full text-sm text-left">
                                                                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-medium border-b border-slate-200 dark:border-slate-700">
                                                                    <tr>
                                                                        <th className="p-3">Concepto</th>
                                                                        <th className="p-3">Método</th>
                                                                        <th className="p-3 text-right">Monto</th>
                                                                        <th className="p-3 text-center">Estado</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                                                    <tr>
                                                                        <td className="p-3 text-slate-700 dark:text-slate-300">Pago de cita</td>
                                                                        <td className="p-3 text-slate-500 capitalize">{checkoutResult.payment_method}</td>
                                                                        <td className="p-3 text-right font-bold text-slate-800 dark:text-white">
                                                                            ${parseFloat(checkoutResult.paid_amount).toFixed(2)}
                                                                        </td>
                                                                        <td className="p-3 text-center">
                                                                            <span className={`text-xs font-bold px-2 py-1 rounded-full ${isPaid
                                                                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                                                                : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                                                                }`}>
                                                                                {isPaid ? 'Pagado' : 'Parcial'}
                                                                            </span>
                                                                        </td>
                                                                    </tr>
                                                                    {checkoutResult.remaining_debt > 0 && (
                                                                        <tr className="bg-red-50 dark:bg-red-900/10">
                                                                            <td className="p-3 text-red-600 dark:text-red-400 font-medium" colSpan={2}>
                                                                                Saldo pendiente
                                                                            </td>
                                                                            <td className="p-3 text-right font-bold text-red-700 dark:text-red-400">
                                                                                ${parseFloat(checkoutResult.remaining_debt).toFixed(2)}
                                                                            </td>
                                                                            <td className="p-3 text-center">
                                                                                <span className="text-xs font-bold px-2 py-1 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                                                                                    Pendiente
                                                                                </span>
                                                                            </td>
                                                                        </tr>
                                                                    )}
                                                                    {checkoutResult.credit_applied > 0 && (
                                                                        <tr className="bg-sky-50 dark:bg-sky-900/10">
                                                                            <td className="p-3 text-sky-600 dark:text-sky-400 font-medium" colSpan={2}>
                                                                                Crédito aplicado a cuenta
                                                                            </td>
                                                                            <td className="p-3 text-right font-bold text-sky-700 dark:text-sky-400">
                                                                                +${parseFloat(checkoutResult.credit_applied).toFixed(2)}
                                                                            </td>
                                                                            <td className="p-3 text-center">
                                                                                <span className="text-xs font-bold px-2 py-1 rounded-full bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400">
                                                                                    Crédito
                                                                                </span>
                                                                            </td>
                                                                        </tr>
                                                                    )}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Footer Actions */}
                            <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-secondary flex justify-between items-center shrink-0 z-20 relative shadow-[0_-5px_20px_rgba(0,0,0,0.02)]">
                                <div>
                                    <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">Monto Total Estimado</div>
                                    <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">$ {(parseFloat(appointment.total_amount) || 0).toFixed(2)}</div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => setShowEvaluationModal(true)}
                                        disabled={hasEvaluation}
                                        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition active:scale-95 ${hasEvaluation
                                            ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-slate-200 dark:border-slate-700'
                                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-sm'
                                            }`}
                                    >
                                        <Star size={18} className={hasEvaluation ? "" : "text-amber-400"} />
                                        {hasEvaluation ? "Paciente calificado" : "Calificar px"}
                                    </button>

                                    <button
                                        onClick={() => {
                                            onClose();
                                            navigate(`/patients/${appointment.patient?.id}`);
                                        }}
                                        className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-sm transition active:scale-95"
                                    >
                                        <Info size={18} className="text-primary" />
                                        Más información
                                    </button>

                                    {isEditable ? (
                                        <button
                                            onClick={() => onEdit(appointment)}
                                            className="flex items-center gap-2 bg-primary text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-sky-500/20 hover:bg-sky-600 transition hover:shadow-sky-500/30 active:scale-95"
                                        >
                                            <Edit2 size={18} />
                                            Editar Cita
                                        </button>
                                    ) : (
                                        <>
                                            {/* Status Specific Actions */}
                                            {appointment.status === 'en_espera' && (
                                                <button
                                                    onClick={() => handleStatusChange('en_tratamiento')}
                                                    disabled={loadingStatus}
                                                    className="flex items-center gap-2 bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 transition active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100"
                                                >
                                                    {loadingStatus
                                                        ? <><Loader2 size={18} className="animate-spin" /> Procesando...</>
                                                        : <><ArrowRight size={18} /> Iniciar Tratamiento</>
                                                    }
                                                </button>
                                            )}
                                            {appointment.status === 'en_tratamiento' && (
                                                <button
                                                    onClick={() => handleStatusChange('finalizada')}
                                                    disabled={loadingStatus}
                                                    className="flex items-center gap-2 bg-emerald-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-emerald-500/20 hover:bg-emerald-700 transition active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100"
                                                >
                                                    {loadingStatus
                                                        ? <><Loader2 size={18} className="animate-spin" /> Procesando...</>
                                                        : <><CheckCircle size={18} /> Finalizar Cita</>
                                                    }
                                                </button>
                                            )}

                                            {/* Checkout / Cobrar Button */}
                                            {canCheckout && (
                                                <button
                                                    onClick={() => {
                                                        setShowCheckout(true);
                                                        setActiveTab('payments');
                                                    }}
                                                    disabled={isPaid}
                                                    className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold shadow-lg transition active:scale-95 ${isPaid
                                                        ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 cursor-default border border-emerald-200 dark:border-emerald-800 shadow-none'
                                                        : 'bg-emerald-600 text-white shadow-emerald-500/20 hover:bg-emerald-700'
                                                        }`}
                                                >
                                                    {isPaid
                                                        ? <><BadgeCheck size={18} /> Cita completada</>
                                                        : <><Receipt size={18} /> Completar cita</>
                                                    }
                                                </button>
                                            )}

                                            {appointment.status === 'confirmada' && !isEditable && (
                                                <div className="flex items-center gap-2 text-slate-400 text-sm font-medium bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700">
                                                    <Lock size={16} />
                                                    Edición bloqueada
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <PatientEvaluationModal
                open={showEvaluationModal}
                onClose={() => setShowEvaluationModal(false)}
                appointment={appointment}
                onSave={(evaluation) => setEvaluations(prev => [...prev, evaluation])}
            />

            <AppointmentCheckoutModal
                open={showCheckout}
                appointment={{
                    ...appointment,
                    base_amount: checkoutBaseAmount,
                }}
                onClose={() => setShowCheckout(false)}
                onComplete={(result) => {
                    setCheckoutResult(result);
                    setShowCheckout(false);
                    setActiveTab('payments');
                }}
                onScheduleNext={() => {
                    // Placeholder: caller (AppointmentList) can handle via an onScheduleNext prop if needed
                    setShowCheckout(false);
                }}
            />
        </>
    );
}

// --- Sub-components ---

function TabButton({ active, onClick, icon: Icon, label }) {
    return (
        <button
            onClick={onClick}
            className={`
                flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all relative
                ${active ? 'text-primary bg-sky-50 dark:bg-sky-900/20' : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'}
            `}
        >
            <Icon size={16} className={active ? "text-primary" : ""} />
            {label}
            {active && (
                <motion.div
                    layoutId="activeTabIndicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full"
                />
            )}
        </button>
    );
}



function StatusStepper({ appointment }) {
    const { status, checkin_at, treatment_started_at, treatment_finished_at, paid_at } = appointment;

    // Status Config
    const statusConfig = getStatusConfig(status);

    // Journey Steps Definition
    const journeySteps = [
        { id: 'check_in', label: 'Check-in', icon: User },
        { id: 'waiting_room', label: 'Sala de Espera', icon: Clock },
        { id: 'treatment', label: 'Tratamiento', icon: Activity },
        { id: 'finished', label: 'Finalizada', icon: CheckCircle },
    ];

    // Determine Journey State
    const journeyState = {};

    // Logic for Pre-Arrival or Inactive states
    const isPreArrival = ['pendiente', 'confirmada'].includes(status);

    if (isPreArrival) {
        journeyState.check_in = 'pending';
        journeyState.waiting_room = 'pending';
        journeyState.treatment = 'pending';
        journeyState.finished = 'pending';
    } else {
        // Helper flags for Active/Completed journey
        const hasArrival = checkin_at || ['en_espera', 'en_tratamiento', 'finalizada'].includes(status);
        const hasStartedTreatment = treatment_started_at || ['en_tratamiento', 'finalizada'].includes(status);
        const isFinished = status === 'finalizada' || paid_at;

        // 1. Check-in
        journeyState.check_in = hasArrival ? 'completed' : 'pending';

        // 2. Waiting Room
        if (hasStartedTreatment) {
            journeyState.waiting_room = 'completed';
        } else if (status === 'en_espera' || hasArrival) {
            journeyState.waiting_room = 'active';
        } else {
            journeyState.waiting_room = 'pending';
        }

        // 3. Treatment
        if (isFinished) {
            journeyState.treatment = 'completed';
        } else if (status === 'en_tratamiento' || hasStartedTreatment) {
            journeyState.treatment = 'active';
        } else {
            journeyState.treatment = 'pending';
        }

        // 4. Finished
        journeyState.finished = isFinished ? 'completed' : 'pending';
    }

    // Override: Cancelled
    if (status === 'cancelada') {
        Object.keys(journeyState).forEach(k => journeyState[k] = 'disabled');
    }

    // Unified Timeline Nodes
    const timelineNodes = journeySteps.map(step => ({
        ...step,
        state: journeyState[step.id]
    }));

    return (
        <div className="flex items-center w-full max-w-5xl mx-auto px-4">
            <div className="flex-1 flex items-center justify-between relative">
                {timelineNodes.map((node, idx) => {
                    const isLast = idx === timelineNodes.length - 1;
                    const Icon = node.icon;

                    // Determine styling based on state
                    let nodeClass = "";
                    let textClass = "";
                    let isCompleted = false;
                    let showRipple = false;

                    // Styling Strategy & Active Node Detection
                    if (node.state === 'completed') {
                        nodeClass = "bg-primary border-primary text-white";
                        textClass = "text-primary font-medium";
                        isCompleted = true;

                    } else if (node.state === 'active') {
                        nodeClass = "bg-white dark:bg-slate-800 border-primary text-primary shadow-md shadow-primary/20";
                        textClass = "text-primary font-bold";
                        showRipple = true;

                    } else if (node.state === 'disabled') {
                        nodeClass = "bg-slate-50 dark:bg-slate-900 border-slate-200 text-slate-300";
                        textClass = "text-slate-300 dark:text-slate-600";

                    } else {
                        nodeClass = "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-300 dark:text-slate-600";
                        textClass = "text-slate-400 dark:text-slate-600";
                    }

                    // Line Logic (look ahead)
                    const nextNode = !isLast ? timelineNodes[idx + 1] : null;
                    const isNextCompletedOrActive = nextNode && (nextNode.state === 'completed' || nextNode.state === 'active' || nextNode.state === 'status_active');
                    // Use Primary color for the line
                    const isLineColored = isCompleted && isNextCompletedOrActive;

                    return (
                        <div key={node.id} className="relative flex-1 flex flex-col items-center group">
                            {/* Connecting Line (Right side only, unless last) */}
                            {!isLast && (
                                <div className={`
                                    absolute top-4 left-[50%] right-[-50%] h-0.5 transition-colors duration-500
                                    ${isLineColored ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-700'}
                                `} />
                            )}

                            {/* Ripple Effect (Active Node Only) */}
                            {showRipple && (
                                <div className="absolute top-0 w-8 h-8 rounded-full bg-primary/30 animate-ping z-0" />
                            )}

                            {/* Node Circle */}
                            <div className={`
                                relative z-10 w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300
                                ${nodeClass}
                            `}>
                                <Icon size={14} strokeWidth={2.5} />
                            </div>

                            {/* Label */}
                            <span className={`
                                mt-2 text-xs uppercase tracking-wide transition-colors duration-300 text-center
                                ${textClass}
                            `}>
                                {node.label}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function TimelineItem({ date, title, desc, icon: Icon, color, isCurrent }) {
    const colorClasses = {
        emerald: 'bg-emerald-500 text-white',
        blue: 'bg-blue-500 text-white',
        orange: 'bg-orange-500 text-white',
        slate: 'bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400',
    }[color] || 'bg-slate-500 text-white';

    return (
        <div className={`relative pl-8 ${isCurrent ? 'opacity-100' : 'opacity-90'}`}>
            <div className={`
                absolute left-0 top-1 w-6 h-6 rounded-full flex items-center justify-center border-2 border-white dark:border-secondary shadow-sm z-10 
                ${colorClasses}
            `}>
                <Icon size={12} />
            </div>
            <div>
                <div className="flex items-center justify-between mb-0.5">
                    <div className={`font-bold text-sm ${isCurrent ? 'text-slate-800 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}>{title}</div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{date}</div>
                </div>
                <div className="text-sm text-slate-500 leading-snug">{desc}</div>
            </div>
        </div>
    );
}
