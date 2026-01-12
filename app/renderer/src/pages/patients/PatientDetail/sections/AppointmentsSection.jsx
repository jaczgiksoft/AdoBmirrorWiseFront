import React, { useState, useEffect, useCallback } from 'react';
import Datepicker from "react-tailwindcss-datepicker";
import {
    Calendar,
    Clock,
    MapPin,
    User,
    FileText,
    CreditCard,
    AlertCircle,
    Video,
    ChevronDown,
    ChevronUp,
    Filter,
    X,
    Loader2
} from 'lucide-react';
import { getAppointments } from '../../../../services/appointment.service';
import { useOutletContext } from 'react-router-dom';

export default function AppointmentsSection() {
    const { profile } = useOutletContext();
    const patientId = profile?.id;
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(false);

    // --- FILTERS STATE ---
    const [dateRange, setDateRange] = useState({ startDate: null, endDate: null });
    const [statusFilter, setStatusFilter] = useState("all");

    // --- DATA FETCHING ---
    const fetchAppointments = useCallback(async () => {
        if (!patientId) return;
        setLoading(true);
        try {
            const params = {
                patient_id: patientId,
            };

            // Dates
            if (dateRange?.startDate) params.date_from = dateRange.startDate;
            if (dateRange?.endDate) params.date_to = dateRange.endDate;

            // Status
            if (statusFilter !== "all") params.status = statusFilter;

            const data = await getAppointments(params);
            console.log("data", data);
            setAppointments(data);
        } catch (error) {
            console.error("Error fetching patient appointments:", error);
        } finally {
            setLoading(false);
        }
    }, [patientId, dateRange, statusFilter]);

    useEffect(() => {
        console.log("patientId", patientId);
        fetchAppointments();
    }, [fetchAppointments]);


    // --- HANDLERS ---
    const handleDateChange = (value) => {
        setDateRange(value);
    };

    const clearFilters = () => {
        setDateRange({ startDate: null, endDate: null });
        setStatusFilter("all");
    };

    // Common input styles
    const inputClass = "w-full px-3 py-2 text-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors";
    const labelClass = "block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1";

    return (
        <div className="space-y-6 text-slate-800 dark:text-slate-100">
            <Section
                title="Historial de Citas"
                icon={Calendar}
                subtitle="Registro completo de citas pasadas y futuras del paciente."
            >
                {/* --- FILTERS UI --- */}
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700 mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-semibold flex items-center gap-2 text-slate-700 dark:text-slate-200">
                            <Filter size={16} />
                            Filtros de búsqueda
                        </h3>
                        <button
                            onClick={clearFilters}
                            className="text-xs text-primary hover:underline flex items-center gap-1"
                        >
                            <X size={12} />
                            Limpiar filtros
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                        {/* 1. Date Range Filter */}
                        <div>
                            <label className={labelClass}>Rango de Fechas</label>
                            <div className="relative z-20">
                                <Datepicker
                                    i18n={"es"}
                                    showFooter={true}
                                    showShortcuts={true}
                                    displayFormat={"YYYY-MM-DD"}
                                    configs={{
                                        shortcuts: {
                                            today: "Hoy",
                                            yesterday: "Ayer",
                                            past: (period) => `Últimos ${period} días`,
                                            currentMonth: "Este mes",
                                            pastMonth: "Mes anterior"
                                        },
                                        footer: {
                                            cancel: "Salir",
                                            apply: "Aplicar"
                                        }
                                    }}
                                    value={dateRange}
                                    onChange={handleDateChange}
                                    inputClassName={inputClass}
                                    containerClassName="relative"
                                    toggleClassName="absolute right-0 h-full px-3 text-slate-400 focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed"
                                />
                            </div>
                        </div>

                        {/* 2. Status Filter */}
                        <div>
                            <label className={labelClass}>Estado</label>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className={inputClass}
                            >
                                <option value="all">Todos</option>
                                <option value="pending">Pendiente</option>
                                <option value="confirmed">Confirmada</option>
                                <option value="completed">Completada</option>
                                <option value="cancelled">Cancelada</option>
                                <option value="no_show">No asistió</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* --- LIST --- */}
                <div className="space-y-4">
                    {loading ? (
                        <div className="text-center py-10">
                            <Loader2 className="animate-spin mx-auto text-primary" size={32} />
                            <p className="mt-2 text-slate-500">Cargando citas...</p>
                        </div>
                    ) : appointments.length === 0 ? (
                        <div className="text-center py-10 text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                            <Calendar size={40} className="mx-auto mb-2 opacity-50" />
                            <p>No se encontraron citas con los filtros seleccionados.</p>
                        </div>
                    ) : (
                        appointments.map((appointment) => (
                            <AppointmentCard key={appointment.id} appointment={appointment} />
                        ))
                    )}
                </div>
            </Section>
        </div>
    );
}

/* ============================================================
    COMPONENTES INTERNOS
============================================================ */

function Section({ title, icon: Icon, subtitle, children }) {
    return (
        <div
            className="
                bg-white dark:bg-secondary
                border border-slate-200 dark:border-slate-700
                rounded-2xl p-5 shadow-sm
                space-y-4
            "
        >
            <div>
                <h2 className="text-lg font-bold flex items-center gap-2 text-primary">
                    <Icon size={20} className="opacity-80" />
                    {title}
                </h2>

                {subtitle && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                        {subtitle}
                    </p>
                )}
            </div>

            <div className="mt-2">
                {children}
            </div>
        </div>
    );
}

function AppointmentCard({ appointment }) {
    const [isExpanded, setIsExpanded] = useState(false);

    const getStatusColor = (status) => {
        switch (status) {
            case 'confirmed': return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800';
            case 'completed': return 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800';
            case 'pending': return 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800';
            case 'cancelled': return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800';
            case 'no_show': return 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600';
            default: return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case 'confirmed': return 'Confirmada';
            case 'completed': return 'Completada';
            case 'pending': return 'Pendiente';
            case 'cancelled': return 'Cancelada';
            case 'no_show': return 'No asistió';
            default: return status;
        }
    };

    const getPaymentStatusColor = (status) => {
        // Mocked logic - simplified since we want visual enrichment mostly
        return 'text-slate-500';
    };

    // Helper to calculate total effective duration or use API field
    const effectiveMinutes = appointment.effective_minutes ||
        (appointment.services?.reduce((acc, s) => acc + (s.duration_minutes || 0), 0)) ||
        0;

    return (
        <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden transition-all hover:shadow-md bg-slate-50/50 dark:bg-slate-800/50">
            {/* Header / Resumen */}
            <div
                className="p-4 cursor-pointer flex items-center justify-between gap-4"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-start gap-4 flex-1">
                    {/* Fecha Box */}
                    <div className="flex flex-col items-center justify-center bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg w-14 h-14 shadow-sm shrink-0">
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">
                            {new Date(appointment.date).toLocaleString('es-MX', { month: 'short' }).replace('.', '')}
                        </span>
                        <span className="text-xl font-bold text-slate-800 dark:text-slate-200">
                            {new Date(appointment.date).getDate() + 1}
                        </span>
                    </div>

                    {/* Detalles Principales */}
                    <div className="flex-1 min-w-0">
                        {/* Row 1: Services Chips (High Priority) */}
                        <div className="flex flex-wrap gap-2 mb-2">
                            {appointment.services && appointment.services.length > 0 ? (
                                appointment.services.map((svc, idx) => (
                                    <span
                                        key={idx}
                                        className="px-2 py-0.5 rounded-md text-xs font-semibold border truncate max-w-[200px]"
                                        style={{
                                            backgroundColor: svc.color ? `${svc.color}15` : '#f1f5f9', // 15 = ~8% opacity
                                            color: svc.color || '#475569',
                                            borderColor: svc.color ? `${svc.color}40` : '#cbd5e1'
                                        }}
                                    >
                                        {svc.name}
                                    </span>
                                ))
                            ) : (
                                <span className="text-base font-semibold text-slate-800 dark:text-slate-100">
                                    {appointment.activities || 'Sin servicios especificados'}
                                </span>
                            )}
                        </div>

                        {/* Row 2: Metadata (Time, Duration, Method) */}
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500 dark:text-slate-400">
                            <div className="flex items-center gap-1.5">
                                <Clock size={14} className="text-slate-400" />
                                <span className="font-medium text-slate-700 dark:text-slate-300">
                                    {appointment.start_time?.slice(0, 5)} - {appointment.end_time?.slice(0, 5)}
                                </span>
                            </div>

                            {effectiveMinutes > 0 && (
                                <div className="flex items-center gap-1.5 text-xs bg-slate-100 dark:bg-slate-700/50 px-2 py-0.5 rounded-full">
                                    <span>{effectiveMinutes} min</span>
                                </div>
                            )}

                            {appointment.method && (
                                <div className="flex items-center gap-1.5">
                                    <span className="text-slate-300 dark:text-slate-600">•</span>
                                    {appointment.method === 'remota' ? <Video size={14} /> : <MapPin size={14} />}
                                    <span className="capitalize text-xs">{appointment.method}</span>
                                </div>
                            )}
                        </div>

                        {/* Row 3: Compact Context (Doctor & Area) */}
                        <div className="mt-2 flex items-center gap-3 text-xs text-slate-500 dark:text-slate-500">
                            {appointment.employee && (
                                <span className="flex items-center gap-1">
                                    <User size={12} />
                                    {appointment.employee.first_name} {appointment.employee.last_name}
                                </span>
                            )}
                            {appointment.clinic_area && (
                                <span className="flex items-center gap-1">
                                    <FileText size={12} />
                                    {appointment.clinic_area.name}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column: Status & Price */}
                <div className="flex flex-col items-end gap-2 shrink-0">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${getStatusColor(appointment.status)}`}>
                        {getStatusLabel(appointment.status)}
                    </span>

                    {/* Financial Context */}
                    {appointment.total_amount && (
                        <div className="text-right">
                            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                                ${appointment.total_amount}
                            </p>
                        </div>
                    )}

                    <div className="mt-1">
                        {isExpanded ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
                    </div>
                </div>
            </div>

            {/* Detalles Expandidos */}
            {isExpanded && (
                <div className="px-4 pb-4 pt-0 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/30">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4">

                        {/* Col 1: Detalles Básicos (Doctor, Area, Payment) */}
                        <div className="space-y-4 lg:col-span-1">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Detalles Generales</h4>

                            <div className="space-y-3">
                                <InfoItem icon={User} label="Especialista" value={appointment.employee ? `${appointment.employee.first_name} ${appointment.employee.last_name}` : 'No asignado'} />
                                <InfoItem icon={FileText} label="Área Clínica" value={appointment.clinic_area ? appointment.clinic_area.name : 'General'} />
                                <InfoItem icon={CreditCard} label="Total Estimado" value={appointment.total_amount ? `$${appointment.total_amount}` : '$0.00'} highlighted />
                            </div>

                            {appointment.notes && (
                                <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-100 dark:border-yellow-900/30 rounded-lg">
                                    <div className="flex items-start gap-2">
                                        <AlertCircle size={14} className="text-yellow-600 dark:text-yellow-500 mt-0.5" />
                                        <div>
                                            <p className="text-xs font-bold text-yellow-700 dark:text-yellow-500 uppercase mb-1">Notas</p>
                                            <p className="text-sm text-slate-700 dark:text-slate-300 italic leading-relaxed">"{appointment.notes}"</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Col 2: Servicios Detallados */}
                        <div className="lg:col-span-1">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Servicios Incluidos</h4>

                            {appointment.services && appointment.services.length > 0 ? (
                                <div className="space-y-2">
                                    {appointment.services.map((svc, i) => (
                                        <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700/50">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: svc.color || '#cbd5e1' }} />
                                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{svc.name}</span>
                                            </div>
                                            <div className="text-xs text-slate-500">
                                                {svc.price && <span>${svc.price}</span>}
                                                {svc.duration_minutes && <span> • {svc.duration_minutes}m</span>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-slate-500 italic">No hay detalle de servicios.</p>
                            )}
                        </div>

                        {/* Col 3: Process Timeline (If present) */}
                        <div className="lg:col-span-1 border-l border-slate-200 dark:border-slate-700 pl-0 lg:pl-6 border-t lg:border-t-0 pt-4 lg:pt-0">
                            {appointment.process_snapshot && appointment.process_snapshot.steps && appointment.process_snapshot.steps.length > 0 ? (
                                <>
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                                        Seguimiento del Proceso
                                    </h4>
                                    <div className="relative space-y-0 ml-2">
                                        {/* Line */}
                                        <div className="absolute top-2 bottom-2 left-[5px] w-0.5 bg-slate-200 dark:bg-slate-700" />

                                        {appointment.process_snapshot.steps.map((step, idx) => (
                                            <div key={idx} className="relative pl-6 pb-4 last:pb-0">
                                                <div className="absolute left-0 top-1.5 w-3 h-3 rounded-full border-2 border-white dark:border-slate-800 bg-primary shadow-sm z-10" />
                                                <p className="text-sm font-medium text-slate-800 dark:text-slate-200 leading-none mb-1">
                                                    {step.name_snapshot}
                                                </p>
                                                {step.duration_minutes > 0 && (
                                                    <p className="text-xs text-slate-400">
                                                        Duración: {step.duration_minutes} min
                                                    </p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <div className="h-full flex items-center justify-center text-center p-4 text-slate-400 border border-dashed border-slate-200 dark:border-slate-700 rounded-lg">
                                    <p className="text-xs">Este procedimiento no tiene seguimiento detallado.</p>
                                </div>
                            )}
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
}

// Mini Helper Component
function InfoItem({ icon: Icon, label, value, highlighted }) {
    return (
        <div className="flex items-start gap-3">
            <Icon size={16} className={`mt-0.5 ${highlighted ? 'text-green-500' : 'text-slate-400'}`} />
            <div>
                <p className="text-xs text-slate-500 uppercase font-semibold">{label}</p>
                <p className={`text-sm ${highlighted ? 'font-bold text-slate-800 dark:text-slate-100' : 'text-slate-700 dark:text-slate-300'}`}>
                    {value}
                </p>
            </div>
        </div>
    );
}
