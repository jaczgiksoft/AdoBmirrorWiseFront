import { API_BASE } from "@/utils/apiBase";
import {
    UserCheck,
    Clock3,
    Activity,
    CheckCircle2
} from "lucide-react";

export default function CalendarEventCard({ event }) {
    const { extendedProps } = event;
    const { patient, employee, clinic_area, primaryServiceColor } = extendedProps;

    const accentColor = primaryServiceColor || "#64748B";

    const durationMinutes =
        (new Date(event.end) - new Date(event.start)) / 60000;

    const isMicro = durationMinutes <= 5;
    const isTiny = durationMinutes <= 16;
    const isCompact = durationMinutes > 16 && durationMinutes < 30;
    const isFull = durationMinutes >= 30;

    const status = extendedProps.status;

    // 🎯 STATUS COLOR (barra lateral)
    const statusColorMap = {
        pendiente: "#FACC15",
        confirmada: "#22C55E",
        en_espera: "#22C55E",
        en_tratamiento: "#22C55E",
        finalizada: "#3B82F6",
        cancelada: "#EF4444"
    };

    const statusColor = statusColorMap[status] || "#64748B";

    // 🧭 FLOW
    const statusFlow = [
        "checkin",
        "en_espera",
        "en_tratamiento",
        "finalizada"
    ];

    const normalizedStatus =
        status === "pendiente" ? "checkin" : status;

    const safeIndex = statusFlow.indexOf(normalizedStatus);
    const currentStatusIndex = safeIndex === -1 ? 0 : safeIndex;

    // 🧠 CONFIG
    const statusConfig = {
        checkin: {
            label: "Check-in",
            icon: UserCheck
        },
        en_espera: {
            label: "Espera",
            icon: Clock3
        },
        en_tratamiento: {
            label: "Tratamiento",
            icon: Activity
        },
        finalizada: {
            label: "Finalizada",
            icon: CheckCircle2
        }
    };

    // ⚡ Active (para compact mode)
    const activeConfig = statusConfig[normalizedStatus] || statusConfig["checkin"];
    const ActiveIcon = activeConfig.icon;

    if (isMicro) {
        return (
            <div
                className="
                w-full h-full px-2
                flex items-center
                text-[11px] font-medium text-white
                truncate
            "
                style={{
                    backgroundColor: accentColor,
                    borderLeft: `3px solid ${statusColor}`
                }}
            >
                {patient.first_name} {patient.last_name}
            </div>
        );
    }

    return (
        <div
            className="
                relative w-full h-full rounded-xl overflow-hidden
                flex flex-col justify-between
                px-3 py-2
                transition-all duration-200
                hover:shadow-2xl hover:z-20
                cursor-pointer
            "
            style={{
                background: `linear-gradient(135deg, ${accentColor}, ${accentColor}CC)`
            }}
        >
            {/* 🔵 STATUS STRIP */}
            <div
                className="absolute left-0 top-0 h-full w-1.5"
                style={{ backgroundColor: statusColor }}
            />

            {/* 🧾 HEADER */}
            <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">

                    {!isTiny && (
                        patient?.photo_url ? (
                            <img
                                src={`${API_BASE}/${patient.photo_url}`}
                                className="w-12 h-12 rounded-full object-cover border-2 border-white/40"
                            />
                        ) : (
                            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold text-white">
                                {patient?.first_name?.[0] || "?"}
                            </div>
                        )
                    )}

                    <div className="min-w-0">
                        <p className="text-sm font-semibold text-white truncate">
                            {patient.first_name} {patient.last_name}
                        </p>

                        <p className="text-[11px] text-white/80 truncate">
                            {extendedProps.services?.[0]?.name}
                        </p>
                    </div>
                </div>

                {!isTiny && (
                    <div className="flex flex-col items-end gap-1">

                        {/* Hora */}
                        <span className="text-[10px] bg-black/20 px-2 py-0.5 rounded text-white/90">
                            {new Date(event.start).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit"
                            })}
                        </span>

                        {/* Estado SOLO en COMPACT */}
                        {isCompact && (
                            <span
                                className="text-[10px] bg-black/20 px-2 py-0.5 rounded text-white/90 flex items-center gap-1"
                                style={{
                                    backgroundColor: accentColor + "33",
                                    backdropFilter: "blur(4px)"
                                }}
                            >
                                <ActiveIcon size={10} />
                                {activeConfig.label}
                            </span>
                        )}
                    </div>
                )}
            </div>

            {/* 🧭 STATUS TIMELINE INTELIGENTE */}
            <div className="mt-3 flex justify-center">

                {/* 🔴 TINY MODE */}
                {isTiny && (
                    <div className="flex items-center gap-2 text-[11px] text-white">

                        <div
                            className="w-5 h-5 rounded-full flex items-center justify-center text-white calendar-active-glow"
                            style={{ backgroundColor: accentColor }}
                        >
                            <ActiveIcon size={10} />
                        </div>

                        <span className="opacity-90">
                            {activeConfig.label}
                        </span>
                    </div>
                )}

                {/* 🟢 FULL MODE */}
                {isFull && (
                    <div className="flex items-center gap-4">

                        {statusFlow.map((s, index) => {
                            const config = statusConfig[s];
                            const Icon = config.icon;

                            const isActive = index === currentStatusIndex;
                            const isCompleted = index < currentStatusIndex;

                            return (
                                <div key={s} className="flex flex-col items-center relative">

                                    <div className="relative flex items-center justify-center">

                                        {isActive && status !== "finalizada" && (
                                            <span
                                                className="calendar-ripple"
                                                style={{
                                                    color: accentColor,
                                                    animationDuration:
                                                        status === "en_tratamiento" ? "0.9s" :
                                                            status === "en_espera" ? "2.8s" :
                                                                status === "confirmada" ? "2s" :
                                                                    "0s"
                                                }}
                                            />
                                        )}

                                        <div
                                            className={`
                                                w-7 h-7 rounded-full flex items-center justify-center
                                                transition-all duration-300
                                                ${isActive
                                                    ? "text-white calendar-active-glow"
                                                    : isCompleted
                                                        ? "bg-white/90 text-black"
                                                        : "bg-white/20 text-white/60"}
                                            `}
                                            style={isActive ? { backgroundColor: accentColor } : {}}
                                        >
                                            <Icon size={14} />
                                        </div>
                                    </div>

                                    <span
                                        className={`
                                            mt-1 text-[9px] text-center
                                            ${isActive
                                                ? "text-white font-semibold"
                                                : "text-white/60"}
                                        `}
                                    >
                                        {config.label}
                                    </span>

                                    {index < statusFlow.length - 1 && (
                                        <div className="absolute top-3 left-full flex items-center">
                                            <div
                                                className={`
                                                    calendar-line w-6
                                                    ${isCompleted
                                                        ? "bg-white/80"
                                                        : "bg-white/20"}
                                                `}
                                            />
                                        </div>
                                    )}
                                </div>
                            );
                        })}

                    </div>
                )}
            </div>

            {/* 👇 FOOTER */}
            <div className="flex items-center justify-between mt-2">
                <span className="text-[10px] text-white/80 truncate">
                    Dr. {employee.first_name}
                </span>

                <span className="text-[10px] text-white/60 truncate">
                    {clinic_area.name}
                </span>
            </div>
        </div>
    );
}