import React, { useState } from 'react';
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
    X
} from 'lucide-react';

export default function AppointmentsSection() {
    // Mock Data
    const appointments = [
        {
            id: 1,
            date: "2025-11-20",
            start_time: "09:00",
            end_time: "09:45",
            method: "presencial",
            status: "confirmed",
            employee_name: "Dr. Roberto Martínez",
            clinic_area: "Ortodoncia",
            activities: "Ajuste de brackets",
            notes: "Paciente reporta molestia en molar inferior derecho.",
            payment_status: "paid",
            total_amount: "$800.00"
        },
        {
            id: 2,
            date: "2025-12-05",
            start_time: "11:00",
            end_time: "12:00",
            method: "presencial",
            status: "pending",
            employee_name: "Dra. Ana López",
            clinic_area: "Limpieza",
            activities: "Limpieza general y flúor",
            notes: "",
            payment_status: "pending",
            total_amount: "$1,200.00"
        },
        {
            id: 3,
            date: "2025-12-20",
            start_time: "16:30",
            end_time: "17:00",
            method: "remota",
            status: "completed",
            employee_name: "Dr. Roberto Martínez",
            clinic_area: "Seguimiento",
            activities: "Revisión de progreso",
            notes: "Todo avanza según lo planeado.",
            payment_status: "paid",
            total_amount: "$500.00"
        },
        {
            id: 4,
            date: "2025-03-10",
            start_time: "10:00",
            end_time: "11:30",
            method: "presencial",
            status: "cancelled",
            employee_name: "Dr. Carlos Ruiz",
            clinic_area: "Cirugía",
            activities: "Extracción de tercer molar",
            notes: "Cancelada por el paciente (motivos personales).",
            payment_status: "refunded",
            total_amount: "$3,500.00"
        },
        {
            id: 5,
            date: "2025-04-01",
            start_time: "09:00",
            end_time: "09:30",
            method: "presencial",
            status: "no_show",
            employee_name: "Dra. Ana López",
            clinic_area: "Revisión General",
            activities: "Chequeo semestral",
            notes: "Paciente no se presentó.",
            payment_status: "pending",
            total_amount: "$600.00"
        }
    ];

    // --- FILTERS STATE ---
    const [dateRange, setDateRange] = useState({ startDate: null, endDate: null });
    const [statusFilter, setStatusFilter] = useState("all");
    const [typeFilter, setTypeFilter] = useState("all");
    const [exactTimeFilter, setExactTimeFilter] = useState("");
    const [timeRangeFilter, setTimeRangeFilter] = useState({ from: "", to: "" });

    // --- HANDLERS ---
    const handleDateChange = (value) => {
        setDateRange(value);
    };

    const clearFilters = () => {
        setDateRange({ startDate: null, endDate: null });
        setStatusFilter("all");
        setTypeFilter("all");
        setExactTimeFilter("");
        setTimeRangeFilter({ from: "", to: "" });
    };

    // --- FILTERING LOGIC ---
    const filteredAppointments = appointments.filter(app => {
        // 1. Date Range Filter
        if (dateRange?.startDate && dateRange?.endDate) {
            const appDate = new Date(app.date);
            const start = new Date(dateRange.startDate);
            const end = new Date(dateRange.endDate);

            // Normalize to ignore time components
            appDate.setHours(0, 0, 0, 0);
            start.setHours(0, 0, 0, 0);
            end.setHours(0, 0, 0, 0);

            if (appDate < start || appDate > end) {
                return false;
            }
        }

        // 2. Status Filter
        if (statusFilter !== "all") {
            if (app.status !== statusFilter) return false;
        }

        // 3. Type Filter (Clinic Area)
        if (typeFilter !== "all") {
            if (app.clinic_area !== typeFilter) return false;
        }

        // 4. Exact Hour Filter
        if (exactTimeFilter) {
            if (app.start_time !== exactTimeFilter) return false;
        }

        // 5. Hour Range Filter
        if (timeRangeFilter.from && timeRangeFilter.to) {
            // Logic: start_time >= from && end_time <= to
            if (!(app.start_time >= timeRangeFilter.from && app.end_time <= timeRangeFilter.to)) {
                return false;
            }
        }

        return true;
    });

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

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

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

                        {/* 3. Type Filter */}
                        <div>
                            <label className={labelClass}>Tipo de Tratamiento</label>
                            <select
                                value={typeFilter}
                                onChange={(e) => setTypeFilter(e.target.value)}
                                className={inputClass}
                            >
                                <option value="all">Todos</option>
                                <option value="Ortodoncia">Ortodoncia</option>
                                <option value="Limpieza">Limpieza</option>
                                <option value="Seguimiento">Seguimiento</option>
                                <option value="Cirugía">Cirugía</option>
                                <option value="Revisión General">Revisión General</option>
                            </select>
                        </div>

                        {/* 4. Exact Hour Filter */}
                        <div>
                            <label className={labelClass}>Hora Exacta (Inicio)</label>
                            <input
                                type="time"
                                value={exactTimeFilter}
                                onChange={(e) => setExactTimeFilter(e.target.value)}
                                className={inputClass}
                            />
                        </div>

                        {/* 5. Hour Range Filter */}
                        <div className="lg:col-span-2">
                            <label className={labelClass}>Rango de Horas</label>
                            <div className="flex items-center gap-2">
                                <div className="flex-1">
                                    <input
                                        type="time"
                                        placeholder="Desde"
                                        value={timeRangeFilter.from}
                                        onChange={(e) => setTimeRangeFilter(prev => ({ ...prev, from: e.target.value }))}
                                        className={inputClass}
                                    />
                                </div>
                                <span className="text-slate-400">-</span>
                                <div className="flex-1">
                                    <input
                                        type="time"
                                        placeholder="Hasta"
                                        value={timeRangeFilter.to}
                                        onChange={(e) => setTimeRangeFilter(prev => ({ ...prev, to: e.target.value }))}
                                        className={inputClass}
                                    />
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

                {/* --- LIST --- */}
                <div className="space-y-4">
                    {filteredAppointments.length === 0 ? (
                        <div className="text-center py-10 text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                            <Calendar size={40} className="mx-auto mb-2 opacity-50" />
                            <p>No se encontraron citas con los filtros seleccionados.</p>
                        </div>
                    ) : (
                        filteredAppointments.map((appointment) => (
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
        switch (status) {
            case 'paid': return 'text-green-600 dark:text-green-400';
            case 'pending': return 'text-yellow-600 dark:text-yellow-400';
            case 'refunded': return 'text-purple-600 dark:text-purple-400';
            default: return 'text-slate-500';
        }
    };

    const getPaymentStatusLabel = (status) => {
        switch (status) {
            case 'paid': return 'Pagado';
            case 'pending': return 'Pendiente de pago';
            case 'refunded': return 'Reembolsado';
            default: return status;
        }
    };

    return (
        <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden transition-all hover:shadow-md bg-slate-50/50 dark:bg-slate-800/50">
            {/* Header / Resumen */}
            <div
                className="p-4 cursor-pointer flex items-center justify-between"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-4">
                    {/* Fecha Box */}
                    <div className="flex flex-col items-center justify-center bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg w-14 h-14 shadow-sm">
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">
                            {new Date(appointment.date).toLocaleString('es-MX', { month: 'short' }).replace('.', '')}
                        </span>
                        <span className="text-xl font-bold text-slate-800 dark:text-slate-200">
                            {new Date(appointment.date).getDate()}
                        </span>
                    </div>

                    {/* Detalles Principales */}
                    <div>
                        <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-base">
                            {appointment.activities}
                        </h3>
                        <div className="flex items-center gap-3 mt-1 text-sm text-slate-500 dark:text-slate-400">
                            <div className="flex items-center gap-1">
                                <Clock size={14} />
                                <span>{appointment.start_time} - {appointment.end_time}</span>
                            </div>
                            <span className="text-slate-300 dark:text-slate-600">•</span>
                            <div className="flex items-center gap-1">
                                {appointment.method === 'remota' ? <Video size={14} /> : <MapPin size={14} />}
                                <span className="capitalize">{appointment.method}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Status y Toggle */}
                <div className="flex items-center gap-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(appointment.status)}`}>
                        {getStatusLabel(appointment.status)}
                    </span>
                    {isExpanded ? <ChevronUp size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400" />}
                </div>
            </div>

            {/* Detalles Expandidos */}
            {isExpanded && (
                <div className="px-4 pb-4 pt-0 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/30">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">

                        {/* Info Doctor y Area */}
                        <div className="space-y-3">
                            <div className="flex items-start gap-3">
                                <User size={16} className="text-slate-400 mt-0.5" />
                                <div>
                                    <p className="text-xs text-slate-500 uppercase font-semibold">Especialista</p>
                                    <p className="text-sm text-slate-700 dark:text-slate-300">{appointment.employee_name}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <FileText size={16} className="text-slate-400 mt-0.5" />
                                <div>
                                    <p className="text-xs text-slate-500 uppercase font-semibold">Área Clínica</p>
                                    <p className="text-sm text-slate-700 dark:text-slate-300">{appointment.clinic_area}</p>
                                </div>
                            </div>
                        </div>

                        {/* Info Pago y Notas */}
                        <div className="space-y-3">
                            <div className="flex items-start gap-3">
                                <CreditCard size={16} className="text-slate-400 mt-0.5" />
                                <div>
                                    <p className="text-xs text-slate-500 uppercase font-semibold">Pago</p>
                                    <div className="flex items-center gap-2">
                                        <p className={`text-sm font-medium ${getPaymentStatusColor(appointment.payment_status)}`}>
                                            {getPaymentStatusLabel(appointment.payment_status)}
                                        </p>
                                        <span className="text-sm text-slate-400">({appointment.total_amount})</span>
                                    </div>
                                </div>
                            </div>
                            {appointment.notes && (
                                <div className="flex items-start gap-3">
                                    <AlertCircle size={16} className="text-slate-400 mt-0.5" />
                                    <div>
                                        <p className="text-xs text-slate-500 uppercase font-semibold">Notas</p>
                                        <p className="text-sm text-slate-600 dark:text-slate-400 italic">"{appointment.notes}"</p>
                                    </div>
                                </div>
                            )}
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
}
