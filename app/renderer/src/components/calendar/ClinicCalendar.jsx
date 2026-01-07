import { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, List as ListIcon } from "lucide-react";
import { getClinicAreas } from "@/services/clinic_area.service";
import CalendarMonthView from "./CalendarMonthView";
import CalendarDayView from "./CalendarDayView";

export default function ClinicCalendar({ appointments, onEditAppointment }) {
    const [view, setView] = useState("month"); // 'month' | 'day'
    const [currentDate, setCurrentDate] = useState(new Date());
    const [resources, setResources] = useState([]);
    const calendarRef = useRef(null);

    useEffect(() => {
        async function loadResources() {
            try {
                const res = await getClinicAreas();
                const areas = Array.isArray(res) ? res : res.data || [];
                setResources(areas.map(a => ({ id: a.id.toString(), title: a.name })));
            } catch (e) { console.error("Failed to load calendar resources", e); }
        }
        loadResources();
    }, []);

    // Filter appointments for the view if needed? FullCalendar handles it if we pass all.
    // We map appointments to FullCalendar event format
    const events = appointments.map(appt => {
        const primaryServiceColor = appt.services?.[0]?.color ?? '#64748B'; // Fallback neutral

        return {
            id: appt.id,
            // Map resourceId for Day View columns
            resourceId: appt.clinic_area_id?.toString(),
            title: `${appt.patient?.first_name} ${appt.patient?.last_name}`,
            start: `${appt.date}T${appt.start_time}`,
            end: `${appt.date}T${appt.end_time}`,
            backgroundColor: primaryServiceColor, // Use service color
            borderColor: primaryServiceColor,
            extendedProps: {
                patient: appt.patient,
                employee: appt.employee,
                clinic_area: appt.clinic_area,
                status: appt.status,
                process_name: appt.process?.name, // Mock or real data structure
                primaryServiceColor: primaryServiceColor // Pass explicitly
            }
        };
    });

    const handleNext = () => {
        const calendarApi = calendarRef.current?.getApi();
        if (calendarApi) {
            calendarApi.next();
            setCurrentDate(calendarApi.getDate());
        }
    };

    const handlePrev = () => {
        const calendarApi = calendarRef.current?.getApi();
        if (calendarApi) {
            calendarApi.prev();
            setCurrentDate(calendarApi.getDate());
        }
    };

    const handleToday = () => {
        const calendarApi = calendarRef.current?.getApi();
        if (calendarApi) {
            calendarApi.today();
            setCurrentDate(calendarApi.getDate());
        }
    };

    // When view changes, we might need to re-render or notify parent, but actually simpler:
    // Just swap the component. Note: Switching views usually involves the SAME FullCalendar instance 
    // changing its `initialView`. But since we separated them deeply for custom configs, we swap components.
    // We just need to make sure the NEW component starts at `currentDate`.

    useEffect(() => {
        const calendarApi = calendarRef.current?.getApi();
        if (calendarApi) {
            calendarApi.gotoDate(currentDate);
        }
    }, [view]); // When swapping view, ref attaches to new instance, we might need to set date.

    return (
        <div className="flex flex-col h-full bg-white dark:bg-secondary rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            {/* Calendar Toolbar */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                <div className="flex items-center gap-2">
                    <button onClick={handleToday} className="px-3 py-1.5 text-xs font-medium bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm hover:bg-slate-50 dark:hover:bg-slate-600 transition">Hoy</button>
                    <div className="flex items-center bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm">
                        <button onClick={handlePrev} className="p-1.5 hover:bg-slate-50 dark:hover:bg-slate-600 border-r border-slate-300 dark:border-slate-600"><ChevronLeft size={16} /></button>
                        <button onClick={handleNext} className="p-1.5 hover:bg-slate-50 dark:hover:bg-slate-600"><ChevronRight size={16} /></button>
                    </div>
                    <span className="ml-2 text-lg font-semibold text-slate-800 dark:text-white capitalize">
                        {currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                    </span>
                </div>

                <div className="flex bg-slate-200 dark:bg-slate-700 p-1 rounded-lg">
                    <button
                        onClick={() => setView('month')}
                        className={`px-3 py-1 text-xs font-medium rounded-md transition ${view === 'month' ? 'bg-white dark:bg-slate-600 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}
                    >
                        Mes
                    </button>
                    <button
                        onClick={() => setView('day')}
                        className={`px-3 py-1 text-xs font-medium rounded-md transition ${view === 'day' ? 'bg-white dark:bg-slate-600 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}
                    >
                        Día
                    </button>
                </div>
            </div>

            {/* Calendar Body */}
            <div className="flex-1 overflow-hidden p-2 relative">
                {view === 'month' ? (
                    <CalendarMonthView
                        events={events}
                        calendarRef={calendarRef}
                        onEventClick={(info) => onEditAppointment({
                            id: parseInt(info.event.id),
                            ...info.event.extendedProps,
                            start_time: info.event.startStr.split('T')[1]?.substring(0, 5),
                            end_time: info.event.endStr.split('T')[1]?.substring(0, 5),
                            date: info.event.startStr.split('T')[0]
                        })}
                    />
                ) : (
                    <CalendarDayView
                        events={events}
                        resources={resources}
                        calendarRef={calendarRef}
                        onEventClick={(info) => onEditAppointment({
                            id: parseInt(info.event.id),
                            ...info.event.extendedProps,
                            start_time: info.event.startStr.split('T')[1]?.substring(0, 5),
                            end_time: info.event.endStr.split('T')[1]?.substring(0, 5),
                            date: info.event.startStr.split('T')[0]
                        })}
                    />
                )}
            </div>
        </div>
    );
}
