import { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, List as ListIcon, ArrowLeft } from "lucide-react";
import { getClinicAreas } from "@/services/clinic_area.service";
import CalendarMonthView from "./CalendarMonthView";
import CalendarDayView from "./CalendarDayView";

export default function ClinicCalendar({ appointments, onEditAppointment, monthEventContent, onDateClick, onMoreClick, onEventClick, onEventEdit }) {
    const [view, setView] = useState("month"); // 'month' | 'day'
    const [currentDate, setCurrentDate] = useState(new Date());
    const [resources, setResources] = useState([]);
    const calendarRef = useRef(null);

    // Navigation History State
    const [history, setHistory] = useState([]);
    const lastTrackedRef = useRef({ date: currentDate, view });
    const isNavigatingBackRef = useRef(false);

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

    useEffect(() => {
        if (isNavigatingBackRef.current) {
            lastTrackedRef.current = { date: currentDate, view };
            isNavigatingBackRef.current = false;
            return;
        }

        const last = lastTrackedRef.current;
        const newDate = currentDate;
        const newView = view;

        if (last.view === newView && last.date.getTime() === newDate.getTime()) {
            return;
        }

        const getStartOfDayTime = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

        const isViewChange = last.view !== newView;
        const isMonthChange = last.view === 'month' && newView === 'month' && 
            (last.date.getMonth() !== newDate.getMonth() || last.date.getFullYear() !== newDate.getFullYear());
            
        const lastStart = getStartOfDayTime(last.date);
        const newStart = getStartOfDayTime(newDate);
        const diffDays = Math.abs(newStart - lastStart) / (1000 * 60 * 60 * 24);
        
        const isJump = last.view === 'day' && newView === 'day' && diffDays > 1.5;

        if (isViewChange || isMonthChange || isJump) {
            setHistory(prev => {
                const newHist = [...prev];
                const lastHistoryItem = newHist[newHist.length - 1];
                if (!lastHistoryItem || (lastHistoryItem.view !== last.view || lastHistoryItem.date.getTime() !== last.date.getTime())) {
                    newHist.push({ date: last.date, view: last.view });
                }
                return newHist.slice(-5);
            });
        }
        
        lastTrackedRef.current = { date: newDate, view: newView };
    }, [currentDate, view]);

    const handleGoBack = () => {
        if (history.length === 0) return;
        
        const previousState = history[history.length - 1];
        setHistory(prev => prev.slice(0, -1));

        isNavigatingBackRef.current = true;
        setView(previousState.view);
        setCurrentDate(previousState.date);
        
        if (view === previousState.view) {
            const calendarApi = calendarRef.current?.getApi();
            if (calendarApi) calendarApi.gotoDate(previousState.date);
        }
    };

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
                ...appt, // PASS EVERYTHING: services, process_snapshot, steps, etc.
                patient: appt.patient, // Explicit overrides if needed (though ...appt covers it if structure matches)
                employee: appt.employee,
                clinic_area: appt.clinic_area,
                status: appt.status,
                process_name: appt.process?.name,
                primaryServiceColor: primaryServiceColor
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

    // Callback for FullCalendar to notify us when date range changes (nav or view switch)
    const handleDatesSet = (arg) => {
        // arg.view.currentStart is reliable for the visible range
        // For month view, it's start of month. For day view, start of day.
        setCurrentDate(arg.view.currentStart);
    };

    // When view changes, we might need to re-render or notify parent, but actually simpler:
    // Just swap the component. Note: Switching views usually involves the SAME FullCalendar instance 
    // changing its `initialView`. But since we separated them deeply for custom configs, we swap components.
    // We just need to make sure the NEW component starts at `currentDate`.

    useEffect(() => {
        const calendarApi = calendarRef.current?.getApi();
        if (!calendarApi) return;

        calendarApi.gotoDate(currentDate);
    }, [view]); // When swapping view, ref attaches to new instance, we might need to set date.

    // Calculate header title based on view
    const getHeaderTitle = () => {
        if (view === 'day') {
            // "Thursday, January 8, 2026"
            return currentDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
        }
        // "January 2026"
        return currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
    };

    return (
        <div className="flex flex-col h-full bg-white dark:bg-secondary rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            {/* Calendar Toolbar */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                <div className="flex items-center gap-2">
                    {history.length > 0 && (
                        <button 
                            onClick={handleGoBack}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm hover:bg-slate-50 dark:hover:bg-slate-600 transition"
                            title="Atrás"
                        >
                            <ArrowLeft size={14} />
                            <span>Atrás</span>
                        </button>
                    )}
                    <button onClick={handleToday} className="px-3 py-1.5 text-xs font-medium bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm hover:bg-slate-50 dark:hover:bg-slate-600 transition">Hoy</button>
                    <div className="flex items-center bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm">
                        <button onClick={handlePrev} className="p-1.5 hover:bg-slate-50 dark:hover:bg-slate-600 border-r border-slate-300 dark:border-slate-600"><ChevronLeft size={16} /></button>
                        <button onClick={handleNext} className="p-1.5 hover:bg-slate-50 dark:hover:bg-slate-600"><ChevronRight size={16} /></button>
                    </div>
                    <span className="ml-2 text-lg font-semibold text-slate-800 dark:text-white capitalize">
                        {getHeaderTitle()}
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
                        onClick={() => {
                            if (view === 'month') {
                                setCurrentDate(new Date()); // Keep previous 'Hoy' behavior on manual toggle
                            }
                            setView('day');
                        }}
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
                        customEventContent={monthEventContent}
                        datesSet={handleDatesSet}
                        onEventClick={(info) => onEditAppointment({
                            id: parseInt(info.event.id),
                            ...info.event.extendedProps,
                            start_time: info.event.startStr.split('T')[1]?.substring(0, 5),
                            end_time: info.event.endStr.split('T')[1]?.substring(0, 5),
                            date: info.event.startStr.split('T')[0]
                        })}
                        onDateClick={(dateStr) => {
                            onDateClick?.(dateStr);
                        }}
                        onMoreClick={(date) => {
                            setView('day');
                            setCurrentDate(date);
                        }}
                        onEventEdit={(info) => {
                            onEventEdit?.(info);
                        }}
                    />
                ) : (
                    <CalendarDayView
                        events={events}
                        resources={resources}
                        calendarRef={calendarRef}
                        datesSet={handleDatesSet}
                        onEventClick={(info) => onEditAppointment({
                            id: parseInt(info.event.id),
                            ...info.event.extendedProps,
                            start_time: info.event.startStr.split('T')[1]?.substring(0, 5),
                            end_time: info.event.endStr.split('T')[1]?.substring(0, 5),
                            date: info.event.startStr.split('T')[0]
                        })}
                        onEventEdit={(info) => {
                            onEventEdit?.(info);
                        }}
                    />
                )}
            </div>
        </div>
    );
}
