import { API_BASE } from "@/utils/apiBase";
import {
    UserCheck,
    Clock3,
    Activity,
    CheckCircle2,
    XCircle,
    CalendarClock,
    Timer, Eye
} from "lucide-react";
export default function CalendarEventCard({ event }) {
    const { extendedProps } = event;
    const { patient, employee, clinic_area, primaryServiceColor } = extendedProps;

    const accentColor = primaryServiceColor || "#64748B";

    const durationMinutes =
        (new Date(event.end) - new Date(event.start)) / 60000;

    const isMicro = durationMinutes <= 5;
    const isTiny = durationMinutes > 5 && durationMinutes <= 10;
    const isCompact = durationMinutes > 10 && durationMinutes < 30;
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
    let statusFlow;

    if (status === "cancelada") {
        statusFlow = ["cancelada"];
    } else {
        const baseFlow = [
            "en_espera",
            "en_tratamiento",
            "finalizada"
        ];

        if (status === "pendiente" || status === "confirmada") {
            statusFlow = [status, ...baseFlow];
        } else {
            statusFlow = baseFlow;
        }
    }

    const currentStatusIndex = statusFlow.indexOf(status);

    // 🧠 CONFIG
    const statusConfig = {
        pendiente: {
            label: "Pendiente",
            icon: CalendarClock // 🗓 cita futura
        },
        confirmada: {
            label: "Confirmada",
            icon: UserCheck // 👤 confirmación
        },
        cancelada: {
            label: "Cancelada",
            icon: XCircle // ❌ cancelado
        },
        en_espera: {
            label: "Espera",
            icon: Timer // ⏳ esperando turno
        },
        en_tratamiento: {
            label: "Tratamiento",
            icon: Activity // ❤️ en proceso
        },
        finalizada: {
            label: "Finalizada",
            icon: CheckCircle2 // ✅ completado
        }
    };

    // ⚡ Active (para compact mode)
    const activeConfig = statusConfig[status] || statusConfig["pendiente"];
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

                        {/* 🕒 Hora + 👁 */}
                        <div className="flex items-center gap-1">
                            <span className="text-[10px] bg-black/20 px-2 py-0.5 rounded text-white/90">
                                {new Date(event.start).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit"
                                })}
                            </span>

                            {/* 👁 Indicador de notas */}
                            <div className="flex items-center bg-black/20 px-1.5 py-0.5 rounded">
                                <Eye size={14} className="text-yellow-300 drop-shadow-[0_0_4px_rgba(253,224,71,0.8)]" />
                            </div>
                        </div>

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
                    <div className="flex items-center gap-6">

                        {statusFlow.map((s, index) => {
                            const config = statusConfig[s];
                            const Icon = config.icon;

                            const isActive = index === currentStatusIndex;
                            const isCompleted = index < currentStatusIndex;

                            return (
                                <div key={s} className="relative flex flex-col items-center group">

                                    {/* 🔵 CIRCLE */}
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

                                    {/* 🟢 LABEL ACTIVO */}
                                    {isActive && (
                                        <span className="absolute -bottom-5 text-[9px] font-semibold text-white whitespace-nowrap">
                                            {config.label}
                                        </span>
                                    )}

                                    {/* 💬 TOOLTIP (hover en TODO el step) */}
                                    {!isActive && (
                                        <div
                                            className="
                    absolute -top-7 left-1/2 -translate-x-1/2
                    px-2 py-1 rounded-md text-[10px]
                    bg-black/80 text-white whitespace-nowrap
                    opacity-0 group-hover:opacity-100
                    transition-all duration-200
                    scale-95 group-hover:scale-100
                    pointer-events-none
                "
                                        >
                                            {config.label}
                                        </div>
                                    )}

                                    {/* ➖ LINE */}
                                    {index < statusFlow.length - 1 && (
                                        <div className="absolute top-1/2 -translate-y-1/2 left-full flex items-center">
                                            <div
                                                className={`
                        calendar-line ${isCompact ? "w-3" : "w-6"}
                        ${isCompleted
                                                        ? "bg-white"
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