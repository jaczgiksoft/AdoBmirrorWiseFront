import { Clock, User, Stethoscope } from "lucide-react";

export default function CalendarEventCard({ event }) {
    const { extendedProps } = event;
    const { patient, employee, status, clinic_area, process_name, primaryServiceColor } = extendedProps;

    // Use service color for border and accent
    // Fallback if not mapped for some reason (though ClinicCalendar guarantees it)
    const accentColor = primaryServiceColor || '#64748B';

    return (
        <div
            className="w-full h-full p-2 rounded-lg  shadow-sm overflow-hidden flex flex-col gap-1 transition-all hover:brightness-95"
            style={{
                borderLeftColor: accentColor,
                // Optional: tint background slightly with the accent color or keep it clean white/dark
                backgroundColor: 'var(--event-card-bg)', // See style below or inline
            }}
        >
            <style>{`
                .fc-event-main { overflow: visible !important; } /* Fix FC clipping */
             `}</style>
            {/* Header: Time & Status */}
            <div className="flex justify-between items-start text-xs font-semibold opacity-90">
                <div className="flex items-center gap-1">
                    <Clock size={10} />
                    <span>{new Date(event.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
            </div>

            {/* Patient Name */}
            <div className="font-bold text-xs truncate flex items-center gap-1" title={patient ? `${patient.first_name} ${patient.last_name}` : "Sin paciente"}>
                <User size={10} className="shrink-0" />
                <span>{patient ? `${patient.first_name} ${patient.last_name}` : "N/A"}</span>
            </div>

            {/* Doctor / Area */}
            <div className="text-[10px] opacity-80 truncate flex flex-col leading-tight">
                <span className="flex items-center gap-1">
                    <Stethoscope size={10} className="shrink-0" />
                    {employee ? `${employee.first_name} ${employee.last_name}` : "N/A"}
                </span>
                {clinic_area && <span className="pl-3.5 italic">{clinic_area.name}</span>}
            </div>

            {/* Process Indicator if exists */}
            {process_name && (
                <div className="mt-auto pt-1 border-t border-black/5 dark:border-white/10">
                    <span className="text-[10px] font-medium opacity-75 truncate block">{process_name}</span>
                </div>
            )}
        </div>
    );
}
