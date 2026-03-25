import { Clock } from "lucide-react";
import { API_BASE } from "@/utils/apiBase";

export default function CalendarEventCard({ event }) {
    const { extendedProps } = event;
    const { patient, employee, clinic_area, primaryServiceColor } = extendedProps;

    const accentColor = primaryServiceColor || '#64748B';

    return (
        <div
            className="
                relative w-full h-full rounded-xl px-3 py-2
                flex items-center gap-3
                transition-all duration-200
                hover:scale-[1.01] hover:shadow-lg hover:z-20
                cursor-pointer
            "
            style={{
                backgroundColor: accentColor,
            }}
        >
            {/* Avatar */}
            {patient?.photo_url ? (
                <img
                    src={`${API_BASE}/${patient.photo_url}`}
                    className="w-15 h-15 rounded-full object-cover border border-white/30 shrink-0"
                />
            ) : (
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold text-white shrink-0">
                    {patient?.first_name?.[0] || "?"}
                </div>
            )}

            {/* Info */}
            <div className="flex flex-col min-w-0 text-white">
                <span className="font-semibold text-sm truncate">
                    {patient ? `${patient.first_name} ${patient.last_name}` : "N/A"}
                </span>

                <span className="text-[11px] opacity-80 truncate">
                    {employee ? `${employee.first_name}` : ""}
                </span>

                {clinic_area && (
                    <span className="text-[10px] opacity-60 truncate">
                        {clinic_area.name}
                    </span>
                )}
            </div>

            {/* Time Badge (derecha flotante) */}
            <div className="ml-auto flex items-center gap-1 text-white/90 text-[11px] bg-black/20 px-2 py-0.5 rounded-md">
                <Clock size={10} />
                {new Date(event.start).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                })}
            </div>
        </div>
    );
}