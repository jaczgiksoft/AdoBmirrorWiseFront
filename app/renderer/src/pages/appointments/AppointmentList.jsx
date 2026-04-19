import { useRef, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useHotkeys } from "@/hooks/useHotkeys";
import { useToastStore } from "@/store/useToastStore";
import { useNotificationStore } from "@/store/useNotificationStore";
import { ConfirmDialog } from "@/components/feedback";
import { getAppointmentsPaginated, deleteAppointment, getAppointments } from "@/services/appointment.service";
import AppointmentForm from "./AppointmentForm";
import ClinicCalendar from "@/components/calendar/ClinicCalendar";
import { PageHeader } from "@/components/layout";
import {
    Plus,
    Edit2,
    Trash2,
    Search,
    Calendar,
    Clock,
    User,
    Stethoscope,
    List as ListIcon,
    LayoutGrid,
    X
} from "lucide-react";
import { Pagination } from "@/components/ui";
import AppointmentDetailModal from "@/components/appointments/AppointmentDetailModal";

export default function AppointmentList() {
    const navigate = useNavigate();
    const [viewMode, setViewMode] = useState("calendar"); // 'list' | 'calendar'

    // List Mode State
    const [appointments, setAppointments] = useState([]);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({ totalPages: 1 });

    // Calendar Mode State
    const [calendarAppointments, setCalendarAppointments] = useState([]);

    const [confirmOpen, setConfirmOpen] = useState(false);
    const [appointmentToDelete, setAppointmentToDelete] = useState(null);

    // Edit / Create Form State
    const [showForm, setShowForm] = useState(false);
    const [appointmentToEdit, setAppointmentToEdit] = useState(null);

    // Detail Modal State
    const [showDetail, setShowDetail] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState(null);

    const searchRef = useRef(null);
    const { addToast } = useToastStore();
    const socket = useNotificationStore(state => state.socket);
    const limit = 10;

    const [filters, setFilters] = useState({
        doctor: [],
        area: [],
        status: []
    });

    useEffect(() => {
        const delay = setTimeout(() => setDebouncedSearch(searchTerm), 400);
        return () => clearTimeout(delay);
    }, [searchTerm]);

    // Load Data
    useEffect(() => {
        if (viewMode === "list") {
            loadListAppointments();
        } else {
            loadCalendarAppointments();
        }
    }, [page, debouncedSearch, viewMode]);

    async function loadListAppointments() {
        try {
            if (appointments.length === 0 && page === 1 && !debouncedSearch) setLoading(true);
            const start = (page - 1) * limit;
            const res = await getAppointmentsPaginated({ start, length: limit, searchValue: debouncedSearch, orderColumn: "date", orderDir: "DESC" });
            setAppointments(res.data || res.rows || []);
            setPagination({ total: res.recordsFiltered || 0, totalPages: Math.ceil((res.recordsFiltered || 0) / limit) || 1 });
            setSelectedIndex(0);
        } catch (err) {
            setError("No se pudieron cargar las citas.");
            addToast({ type: "error", title: "Error", message: "No se pudieron obtener las citas." });
        } finally {
            setLoading(false);
        }
    }

    async function loadCalendarAppointments() {
        try {
            setLoading(true);
            // Fetch ALL appointments for calendar (or you could filter by current month range ideally)
            // For now assuming getAppointments fetches a reasonable amount or all future
            const res = await getAppointments();
            // Ensure response is array
            setCalendarAppointments(Array.isArray(res) ? res : res.data || []);
        } catch (err) {
            addToast({ type: "error", title: "Error", message: "No se pudieron cargar los datos del calendario." });
        } finally {
            setLoading(false);
        }
    }

    // Hotkeys
    useHotkeys(
        {
            arrowdown: (e) => {
                if (showForm || confirmOpen || viewMode === 'calendar' || showDetail) return;
                e.preventDefault();
                setSelectedIndex((prev) => (prev + 1 < appointments.length ? prev + 1 : prev));
            },
            arrowup: (e) => {
                if (showForm || confirmOpen || viewMode === 'calendar' || showDetail) return;
                e.preventDefault();
                setSelectedIndex((prev) => (prev - 1 >= 0 ? prev - 1 : 0));
            },
            enter: (e) => {
                if (showForm || confirmOpen || showDetail) return;
                e.preventDefault();
                if (viewMode === 'list') {
                    const appt = appointments[selectedIndex];
                    if (appt) handleViewDetail(appt);
                }
            },
            delete: (e) => {
                if (showForm || confirmOpen || viewMode === 'calendar' || showDetail) return;
                e.preventDefault();
                const appt = appointments[selectedIndex];
                if (appt) handleDeleteClick(appt);
            },
            f12: (e) => {
                if (showForm || confirmOpen || showDetail) return;
                e.preventDefault();
                handleCreate();
            }
        },
        [appointments, selectedIndex, showForm, confirmOpen, viewMode, showDetail]
    );

    const handleCreate = () => {
        setAppointmentToEdit(null);
        setShowForm(true);
    };

    // Called when clicking a card or calendar event -> Opens Detail Modal (Read-only)
    const handleViewDetail = (appt) => {
        setSelectedAppointment(appt);
        setShowDetail(true);
    };

    // Called from Detail Modal -> Opens Edit Form
    const handleEditFromDetail = (appt) => {
        setShowDetail(false); // Close detail
        setAppointmentToEdit(appt);
        setShowForm(true); // Open form
    };

    const handleDeleteClick = (appt) => {
        setAppointmentToDelete(appt);
        setConfirmOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!appointmentToDelete) return;
        try {
            await deleteAppointment(appointmentToDelete.id);
            if (viewMode === 'list') setAppointments((prev) => prev.filter((a) => a.id !== appointmentToDelete.id));
            else setCalendarAppointments((prev) => prev.filter((a) => a.id !== appointmentToDelete.id));

            setConfirmOpen(false);
            setAppointmentToDelete(null);
            addToast({ type: 'success', title: 'Cita eliminada', message: 'La cita se eliminó correctamente' });
        } catch (err) {
            addToast({ type: "error", title: "Error", message: err.message || "No se pudo eliminar la cita." });
        }
    };

    const refreshAppointments = async () => {
        const promises = [loadCalendarAppointments()];
        if (viewMode === 'list') {
            promises.push(loadListAppointments());
        } else {
            promises.push(loadListAppointments());
        }
        await Promise.all(promises);
    };

    // WebSocket Listener
    useEffect(() => {
        console.log("🔌 [AppointmentList] Hook de socket disparado. Estado:", { 
            existe: !!socket, 
            conectado: socket?.connected, 
            id: socket?.id 
        });

        if (!socket) {
            console.log("⚠️ [AppointmentList] No hay instancia de socket en este momento.");
            return;
        }

        const handleStatusUpdate = (data) => {
            console.log("📡 [WebSocket] MENSAJE RECIBIDO CORRECTAMENTE:", data);
            refreshAppointments();
            if (data?.appointment?.status === 'en_espera') {
                addToast({
                    type: 'success',
                    title: 'Check-In Kiosco',
                    message: `El paciente ha llegado y está En Espera`
                });
            } else {
                addToast({
                    type: 'info',
                    title: 'Cita Actualizada',
                    message: `Una cita cambió a estado: ${data?.appointment?.status}`
                });
            }
        };

        socket.on('APPOINTMENT_STATUS_UPDATED', handleStatusUpdate);

        return () => {
            socket.off('APPOINTMENT_STATUS_UPDATED', handleStatusUpdate);
        };
    }, [socket, viewMode, page, debouncedSearch]);

    const handleSaved = async () => {
        // 1. Close modal first for snappiness
        setShowForm(false);
        // 2. Trigger robust refresh
        await refreshAppointments();
    };

    // --- Month View Custom Rendering ---
    const getReadableTextColor = (hex) => {
        if (!hex) return '#000000';
        const c = hex.substring(1); // strip #
        const rgb = parseInt(c, 16); // convert rrggbb to decimal
        const r = (rgb >> 16) & 0xff; // extract red
        const g = (rgb >> 8) & 0xff; // extract green
        const b = (rgb >> 0) & 0xff; // extract blue
        const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b; // per ITU-R BT.709
        return luma < 128 ? "#ffffff" : "#000000";
    };

    const renderMonthEvent = (eventInfo) => {
        const { event } = eventInfo;
        const patientName = event.extendedProps.patient
            ? `${event.extendedProps.patient.first_name} ${event.extendedProps.patient.last_name}`.trim()
            : "Sin Paciente";

        // ClinicCalendar already sets backgroundColor in the event object based on service
        // We use that, or fallback
        const bgColor = event.backgroundColor || 'var(--fc-event-bg-default, #3788d8)';
        const textColor = getReadableTextColor(bgColor);

        const start = new Date(event.start);
        const end = new Date(event.end);

        const durationMinutes = (end - start) / 60000;

        const durationText =
            durationMinutes >= 60
                ? `${Math.floor(durationMinutes / 60)}h ${durationMinutes % 60}m`
                : `${durationMinutes} min`;

        return (
            <div className="relative group w-full h-full">
                {/* EVENTO */}
                <div
                    className="flex items-center gap-1.5 px-1.5 py-0.5 w-full h-full overflow-hidden text-xs rounded-sm shadow-sm"
                    style={{ backgroundColor: bgColor, borderColor: bgColor, color: textColor }}
                >
                    <span className="font-semibold whitespace-nowrap">
                        {event.startStr.split('T')[1].substring(0, 5)}
                    </span>
                    <span className="truncate font-medium">{patientName}</span>
                </div>

                {/* TOOLTIP */}
                <div className="
        pointer-events-none absolute z-50 left-1/2 -translate-x-1/2 bottom-full mb-2
        opacity-0 group-hover:opacity-100 transition duration-200
    ">
                    <div className="
            bg-white dark:bg-slate-800
            text-slate-800 dark:text-slate-100
            text-xs rounded-lg shadow-xl border border-slate-200 dark:border-slate-700
            p-3 min-w-[180px]
        ">
                        <div className="font-semibold mb-1">{patientName}</div>

                        <div className="text-slate-500 dark:text-slate-400">
                            🕒 {event.startStr.split('T')[1].substring(0, 5)}
                        </div>

                        <div className="text-slate-500 dark:text-slate-400">
                            ⏱ {durationText}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const doctors = [...new Map(
        calendarAppointments
            .filter(a => a.employee)
            .map(a => [a.employee.id, a.employee])
    ).values()];

    const areas = [...new Map(
        calendarAppointments
            .filter(a => a.clinic_area)
            .map(a => [a.clinic_area.id, a.clinic_area])
    ).values()];

    const filteredCalendarAppointments = calendarAppointments.filter((appt) => {
        if (filters.doctor.length && !filters.doctor.includes(String(appt.employee?.id))) return false;
        if (filters.area.length && !filters.area.includes(String(appt.clinic_area?.id))) return false;
        if (filters.status.length && !filters.status.includes(appt.status)) return false;
        return true;
    });

    const hasActiveFilters = Object.values(filters).some(arr => arr.length > 0);

    const handleClearFilters = () => {
        setFilters({ doctor: [], area: [], status: [] });
    };

    const removeFilter = (key, value) => {
        setFilters(prev => ({
            ...prev,
            [key]: prev[key].filter(v => v !== value)
        }));
    };

    const getDoctorName = (id) => {
        const doc = doctors.find(d => String(d.id) === String(id));
        return doc ? `Dr. ${doc.first_name} ${doc.last_name}` : 'Doctor';
    };

    const getAreaName = (id) => {
        const area = areas.find(a => String(a.id) === String(id));
        return area ? area.name || `Área` : 'Área';
    };

    const getStatusName = (status) => {
        const statusMap = {
            'confirmed': 'Confirmada',
            'confirmada': 'Confirmada',
            'pendiente': 'Pendiente',
            'pending': 'Pendiente',
            'cancelled': 'Cancelada',
            'cancelada': 'Cancelada',
            'completed': 'Completada',
            'en_espera': 'En Espera',
            'en_tratamiento': 'En Tratamiento',
            'finalizada': 'Finalizada',
        };
        return statusMap[status?.toLowerCase()] || status;
    };

    return (
        <div className="bg-slate-100 dark:bg-dark flex flex-col font-sans text-slate-900 dark:text-slate-50 h-full overflow-hidden">
            {/* Header */}
            <div className="w-full max-w-[110rem] mx-auto px-10 flex items-center justify-between mt-6 mb-4 gap-4 flex-wrap shrink-0">
                <PageHeader
                    title="Gestión de Citas"
                    subtitle="Administra las citas de la clínica"
                    onBack={() => navigate("/dashboard")}
                />



                <div className="flex items-center gap-3">
                    {/* View Toggle */}
                    <div className="flex bg-white dark:bg-secondary border border-slate-200 dark:border-slate-700 rounded-lg p-1">
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-2 rounded transition ${viewMode === 'list' ? 'bg-slate-100 dark:bg-slate-700 text-primary' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
                            title="Vista de Lista"
                        >
                            <ListIcon size={18} />
                        </button>
                        <button
                            onClick={() => setViewMode('calendar')}
                            className={`p-2 rounded transition ${viewMode === 'calendar' ? 'bg-slate-100 dark:bg-slate-700 text-primary' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
                            title="Vista de Calendario"
                        >
                            <LayoutGrid size={18} />
                        </button>
                    </div>

                    {/* Search (only for list view mainly, but we can keep it visible) */}
                    {viewMode === 'list' && (
                        <div className="relative flex items-center rounded-lg border bg-white dark:bg-secondary border-slate-200 dark:border-slate-700">
                            <Search size={16} className="absolute left-2 text-slate-400" />
                            <input
                                ref={searchRef}
                                type="text"
                                placeholder="Buscar..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-7 pr-4 py-2 bg-transparent text-sm outline-none text-slate-700 dark:text-slate-200 placeholder:text-slate-400 w-48"
                            />
                        </div>
                    )}

                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={handleCreate}
                        className="flex items-center gap-2 bg-primary text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-sky-500 transition shadow-lg shadow-sky-500/20"
                    >
                        <Plus size={18} />
                        <span>Nueva Cita</span>
                    </motion.button>
                </div>
            </div>

            {/* Filters Section (Only Calendar for now) */}
            {viewMode === 'calendar' && (
                <div className="w-full max-w-[110rem] mx-auto px-10 mb-5 shrink-0 transition-all duration-300">
                    <div className="bg-white dark:bg-secondary p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col gap-3">
                        <div className="flex items-center gap-4 flex-wrap">
                            <div className="flex items-center gap-2.5">
                                <Stethoscope size={18} className="text-slate-400" />
                                <select
                                    className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-sm rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary block p-2.5 outline-none min-w-[180px] transition-all cursor-pointer"
                                    value=""
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        if (!value) return;

                                        setFilters(prev => {
                                            const exists = prev.doctor.includes(value);

                                            return {
                                                ...prev,
                                                doctor: exists
                                                    ? prev.doctor.filter(v => v !== value)
                                                    : [...prev.doctor, value]
                                            };
                                        });
                                    }}
                                >
                                    <option value="">Todos los Doctores</option>
                                    {doctors.map(doc => (
                                        <option key={doc.id} value={doc.id}>Dr. {doc.first_name} {doc.last_name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex items-center gap-2.5">
                                <LayoutGrid size={18} className="text-slate-400" />
                                <select
                                    className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-sm rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary block p-2.5 outline-none min-w-[180px] transition-all cursor-pointer"
                                    value=""
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        if (!value) return;

                                        setFilters(prev => {
                                            const exists = prev.area.includes(value);

                                            return {
                                                ...prev,
                                                area: exists
                                                    ? prev.area.filter(v => v !== value)
                                                    : [...prev.area, value]
                                            };
                                        });
                                    }}
                                >
                                    <option value="">Todas las Áreas</option>
                                    {areas.map(area => (
                                        <option key={area.id} value={area.id}>{area.name || `Área ${area.id}`}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex items-center gap-2.5">
                                <Calendar size={18} className="text-slate-400" />
                                <select
                                    className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-sm rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary block p-2.5 outline-none min-w-[180px] transition-all cursor-pointer"
                                    value=""
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        if (!value) return;

                                        setFilters(prev => {
                                            const exists = prev.status.includes(value);

                                            return {
                                                ...prev,
                                                status: exists
                                                    ? prev.status.filter(v => v !== value)
                                                    : [...prev.status, value]
                                            };
                                        });
                                    }}
                                >
                                    <option value="">Todos los Estados</option>
                                    <option value="confirmed">Confirmada</option>
                                    <option value="pending">Pendiente</option>
                                    <option value="cancelled">Cancelada</option>
                                    <option value="completed">Completada</option>
                                </select>
                            </div>
                        </div>

                        {/* Active Filters Chips */}
                        {hasActiveFilters && (
                            <div className="flex items-center gap-2 pt-3 border-t border-slate-100 dark:border-slate-800 flex-wrap animate-in fade-in duration-200">
                                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium mr-1">
                                    Filtros activos:
                                </span>

                                {/* DOCTORES */}
                                {filters.doctor.map(id => (
                                    <div
                                        key={id}
                                        className="inline-flex items-center gap-1.5 bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-500/20 px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm"
                                    >
                                        {getDoctorName(id).replace('Dr. ', '')}
                                        <button
                                            onClick={() => removeFilter('doctor', id)}
                                            className="hover:text-sky-800 dark:hover:text-sky-200 ml-1.5 transition-colors"
                                        >
                                            <X size={14} strokeWidth={2.5} />
                                        </button>
                                    </div>
                                ))}

                                {/* AREAS */}
                                {filters.area.map(id => (
                                    <div
                                        key={id}
                                        className="inline-flex items-center gap-1.5 bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-500/20 px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm"
                                    >
                                        {getAreaName(id)}
                                        <button
                                            onClick={() => removeFilter('area', id)}
                                            className="hover:text-purple-800 dark:hover:text-purple-200 ml-1.5 transition-colors"
                                        >
                                            <X size={14} strokeWidth={2.5} />
                                        </button>
                                    </div>
                                ))}

                                {/* STATUS */}
                                {filters.status.map(status => (
                                    <div
                                        key={status}
                                        className="inline-flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm"
                                    >
                                        {getStatusName(status)}
                                        <button
                                            onClick={() => removeFilter('status', status)}
                                            className="hover:text-emerald-800 dark:hover:text-emerald-200 ml-1.5 transition-colors"
                                        >
                                            <X size={14} strokeWidth={2.5} />
                                        </button>
                                    </div>
                                ))}

                                {/* CLEAR ALL */}
                                <button
                                    onClick={handleClearFilters}
                                    className="text-xs text-slate-500 hover:text-red-500 dark:text-slate-400 dark:hover:text-red-400 ml-2 transition-colors font-semibold px-2 py-1 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-md"
                                >
                                    Limpiar todos
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Content Body */}
            <div className="flex-1 w-full max-w-[110rem] mx-auto px-10 pb-6 overflow-hidden flex flex-col">
                {viewMode === 'calendar' ? (
                    <div className="flex-1 overflow-hidden h-full relative">
                        <ClinicCalendar
                            appointments={filteredCalendarAppointments}
                            onEditAppointment={handleViewDetail}
                            monthEventContent={renderMonthEvent}
                            onDateClick={(date) => {
                                setAppointmentToEdit({
                                    date,
                                    start_time: "09:00",
                                    end_time: "09:30"
                                });
                                setShowForm(true);
                            }}
                            onEventEdit={(info) => {
                                const appt = {
                                    id: parseInt(info.event.id),
                                    ...info.event.extendedProps,
                                    start_time: info.event.startStr.split('T')[1]?.substring(0, 5),
                                    end_time: info.event.endStr.split('T')[1]?.substring(0, 5),
                                    date: info.event.startStr.split('T')[0]
                                };

                                setAppointmentToEdit(appt);
                                setShowForm(true);
                            }}
                        />
                        {loading && (
                            <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/60 dark:bg-black/40 backdrop-blur-[2px]">
                                <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white dark:bg-slate-800 shadow-md border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-300">
                                    <div className="w-4 h-4 border-2 border-slate-300 border-t-primary rounded-full animate-spin"></div>
                                    <span>Cargando citas...</span>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex-1 overflow-y-auto p-1">
                        {loading ? (
                            <div className="flex h-64 items-center justify-center text-slate-500">Cargando citas...</div>
                        ) : error ? (
                            <div className="flex h-64 items-center justify-center text-red-500">{error}</div>
                        ) : appointments.length === 0 ? (
                            <p className="text-center text-slate-500 dark:text-slate-400 mt-10">No se encontraron citas.</p>
                        ) : (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                    {appointments.map((appt, index) => {
                                        const isSelected = index === selectedIndex;
                                        return (
                                            <motion.div
                                                key={appt.id}
                                                whileHover={{ scale: 1.02 }}
                                                onClick={() => handleViewDetail(appt)}
                                                className={`
                                                    relative rounded-2xl p-6 cursor-pointer border flex flex-col justify-between
                                                    bg-white border-slate-300 text-slate-800 shadow-sm
                                                    dark:bg-secondary dark:border-slate-700 dark:text-slate-50
                                                    ${isSelected ? "ring-2 ring-cyan-500 ring-offset-2 dark:ring-offset-dark" : "hover:border-cyan-500"}
                                                `}
                                            >
                                                {/* Header Card */}
                                                <div className="flex justify-between items-start mb-4">
                                                    <div className="flex items-center gap-2">
                                                        <Calendar size={18} className="text-primary" />
                                                        <span className="font-semibold text-lg">{appt.date}</span>
                                                    </div>
                                                    <span className={`text-xs px-2 py-1 rounded-md border capitalize ${appt.status === 'confirmed' || appt.status === 'confirmada' ? 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 border-green-200' :
                                                        appt.status === 'en_espera' ? 'bg-yellow-50 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 border-yellow-200 font-bold' :
                                                            appt.status === 'en_tratamiento' ? 'bg-sky-50 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400 border-sky-200 font-bold' :
                                                                'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 dark:border-slate-600'
                                                        }`}>
                                                        {getStatusName(appt.status)}
                                                    </span>
                                                </div>

                                                {/* Info */}
                                                <div className="space-y-2 mb-4">
                                                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                                                        <Clock size={16} />
                                                        <span>{appt.start_time} - {appt.end_time}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-sm font-medium text-slate-800 dark:text-slate-100">
                                                        <User size={16} />
                                                        <span className="truncate">{appt.patient?.first_name} {appt.patient?.last_name}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                                                        <Stethoscope size={14} />
                                                        <span className="truncate">Dr. {appt.employee?.first_name} {appt.employee?.last_name}</span>
                                                    </div>
                                                </div>

                                                {/* Actions */}
                                                <div className="flex justify-end gap-2 mt-auto">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleViewDetail(appt); }}
                                                        className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-cyan-600 transition"
                                                    >
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleDeleteClick(appt); }}
                                                        className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-red-500 transition"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                                <div className="mt-6">
                                    <Pagination page={page} totalPages={pagination.totalPages} onPageChange={setPage} />
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>

            <ConfirmDialog
                open={confirmOpen}
                title="Eliminar Cita"
                message="¿Estás seguro de que deseas eliminar esta cita?"
                onConfirm={handleConfirmDelete}
                onCancel={() => setConfirmOpen(false)}
                confirmLabel="Eliminar"
                cancelLabel="Cancelar"
                confirmVariant="error"
            />

            {/* DETAIL MODAL */}
            <AppointmentDetailModal
                open={showDetail}
                appointment={selectedAppointment}
                onClose={() => setShowDetail(false)}
                onEdit={handleEditFromDetail}
                onSuccess={refreshAppointments}
            />

            <AppointmentForm
                open={showForm}
                itemToEdit={appointmentToEdit}
                onClose={() => setShowForm(false)}
                onSaved={handleSaved}
            />
        </div>
    );
}

