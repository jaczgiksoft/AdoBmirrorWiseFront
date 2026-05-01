import { useOutletContext } from "react-router-dom";
import {
    Calendar,
    AlertTriangle,
    FileText,
    UserCircle,
    Activity,
    ClipboardList,
    Clock,
    PackageOpen,
    ChevronRight,
    Smile,
    Meh,
    Cake
} from "lucide-react";
import HeaderInfo from "./components/HeaderInfo";
import { API_BASE } from "@/utils/apiBase";

export default function SummarySection() {
    const { profile } = useOutletContext();

    // Mock data (luego lo conectamos al backend)
    const nextAppointments = [
        { date: "2025-01-20", title: "Consulta de control" },
        { date: "2025-02-05", title: "Ajuste de brackets" },
    ];

    const alerts = profile.alerts || [];

    const timeline = [
        { date: "2025-11-23", text: "Ajuste de brackets" },
        { date: "2025-10-15", text: "Colocación de ligas" },
        { date: "2025-10-01", text: "Limpieza y evaluación inicial" },
    ];
    return (
        <div className="space-y-6 text-slate-800 dark:text-slate-100">

            {/* ============================================================
    HEADER PREMIUM DEL PACIENTE — 2 COLUMNAS
============================================================ */}
            <div className="
    bg-white dark:bg-secondary
    border border-slate-200 dark:border-slate-700
    rounded-2xl p-6 shadow-sm
    grid grid-cols-[0.35fr_0.65fr] gap-8
">
                {/* COLUMNA IZQUIERDA — FOTO + IDENTIDAD */}
                <div className="flex gap-4 items-center">

                    {/* FOTO */}
                    {profile.photo_url ? (
                        <img
                            src={`${API_BASE}/${profile.photo_url}`}
                            className="w-24 h-24 rounded-2xl object-cover border border-slate-300 dark:border-slate-700 shadow bg-slate-100"
                        />
                    ) : (
                        <div className="
                w-24 h-24 rounded-2xl flex items-center justify-center
                bg-slate-200 dark:bg-slate-700 border shadow
            ">
                            <UserCircle size={60} className="text-slate-500" />
                        </div>
                    )}

                    {/* NOMBRE Y DATOS */}
                    <div className="flex flex-col justify-center">

                        {/* EXPEDIENTE */}
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                            Paciente · Expediente{" "}
                            <strong className="text-primary">
                                {profile.medical_record_number}
                            </strong>
                        </p>

                        {/* FAMILIA */}
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            Código familiar:{" "}
                            <strong className="text-primary">{profile.family_code || "—"}</strong>
                        </p>

                        {/* NOMBRE */}
                        <h1 className="text-2xl font-bold text-primary leading-tight">
                            {profile.first_name} {profile.last_name} {profile.middle_name || ""}
                        </h1>

                        {/* ESTADOS Y TIPOS */}
                        <div className="flex gap-2 mt-2 flex-wrap items-center">
                            {/* FACTURACIÓN */}
                            {Array.isArray(profile.billing_data) && profile.billing_data.length > 0 ? (
                                <Meh size={24} className="text-yellow-500" />
                            ) : (
                                <Smile size={24} className="text-green-500" />
                            )}

                            {/* TIPOS (se muestran después) */}
                            {profile.types?.map(t => (
                                <span
                                    key={t.id}
                                    className="px-3 py-1 rounded-full text-xs text-white font-medium shadow"
                                    style={{ background: t.color }}
                                >
                                    {t.name}
                                </span>
                            ))}
                        </div>

                    </div>
                </div>

                {/* COLUMNA DERECHA — DATOS CLAVE */}
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">

                    <HeaderInfo label="Teléfono">
                        {profile.phone_number}
                    </HeaderInfo>

                    <HeaderInfo label="Correo">
                        {profile.email || "—"}
                    </HeaderInfo>

                    <HeaderInfo label="Ciudad">
                        {profile.address_city || "—"}
                    </HeaderInfo>

                    <HeaderInfo label="Estado">
                        {profile.address_state || "—"}
                    </HeaderInfo>

                    <HeaderInfo label="Estado civil">
                        {profile.marital_status
                            ? profile.marital_status.charAt(0).toUpperCase() + profile.marital_status.slice(1)
                            : "—"}
                    </HeaderInfo>

                    <HeaderInfo label="Género">
                        {profile.genre === "male" ? "Masculino" :
                            profile.genre === "female" ? "Femenino" : "Otro"}
                    </HeaderInfo>

                    <HeaderInfo label="Edad">
                        {getReadableAge(profile.birth_date)}
                    </HeaderInfo>

                    <HeaderInfo label="Alta">
                        {new Date(profile.createdAt).toLocaleDateString("es-MX")}
                    </HeaderInfo>

                </div>
            </div>

            {/* ============================================================
                📊 MINI KPIs
            ============================================================ */}
            <div className="grid grid-cols-3 gap-3">
                <KPI
                    icon={Cake}
                    label="Edad"
                    value={getReadableAge(profile.birth_date)}
                />

                <KPI icon={ClipboardList} label="Riesgo clínico" value="Bajo" />

                <KPI icon={Clock} label="Última consulta" value="12 Oct 2025" />
            </div>

            {/* ============================================================
                ALERTAS + CITAS (2 columnas)
            ============================================================ */}
            <div className="grid grid-cols-2 gap-6">

                {/* Alertas */}
                <Section title="Alertas importantes" icon={AlertTriangle}>
                    {alerts.length === 0 ? (
                        <p className="text-sm text-slate-500">No hay alertas.</p>
                    ) : (
                        <div className="grid grid-cols-3 gap-2">
                            {alerts.map(a => (
                                <div
                                    key={a.id}
                                    className={`
                        rounded-xl border shadow-sm p-3
                        flex flex-col gap-1
                        ${a.is_admin_alert
                                            ? "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300"
                                            : "bg-red-50 dark:bg-red-900/20 border-red-300"
                                        }
                    `}
                                >
                                    {/* Título + Badge */}
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-1.5">
                                            <AlertTriangle
                                                size={14}
                                                className={a.is_admin_alert ? "text-yellow-700" : "text-red-700"}
                                            />
                                            <p className="font-semibold text-[13px] leading-tight">
                                                {a.title}
                                            </p>
                                        </div>

                                        <span
                                            className={`
                                text-[9px] px-1.5 py-[1px] rounded-full font-medium
                                ${a.is_admin_alert
                                                    ? "bg-yellow-200/70 text-yellow-800"
                                                    : "bg-red-200/70 text-red-800"
                                                }
                            `}
                                        >
                                            {a.is_admin_alert ? "Admin" : "Clínica"}
                                        </span>
                                    </div>

                                    {/* Descripción */}
                                    <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-tight">
                                        {a.description}
                                    </p>

                                    {/* Fecha */}
                                    <p className="text-[9px] text-slate-400 dark:text-slate-500 mt-1">
                                        {new Date(a.createdAt).toLocaleDateString("es-MX")}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </Section>


                {/* Próximas citas */}
                <Section title="Próximas citas" icon={Calendar}>
                    {nextAppointments.length === 0 ? (
                        <p className="text-sm text-slate-500">No hay citas próximas.</p>
                    ) : (
                        <div className="space-y-3">
                            {nextAppointments.map((a, i) => (
                                <div
                                    key={i}
                                    className="flex items-center justify-between px-4 py-3 border rounded-xl bg-white dark:bg-secondary shadow-sm"
                                >
                                    <div>
                                        <p className="text-sm font-semibold">{a.title}</p>
                                        <p className="text-xs text-slate-500">{a.date}</p>
                                    </div>
                                    <ChevronRight size={18} className="text-slate-400" />
                                </div>
                            ))}
                        </div>
                    )}
                </Section>

            </div>

            {/* ============================================================
                PLAN + PRESUPUESTO + PAGOS (3 columnas)
            ============================================================ */}
            <div className="grid grid-cols-3 gap-6">

                {/* PLAN DE TRATAMIENTO */}
                <Section title="Plan de tratamiento" icon={ClipboardList}>
                    <div className="space-y-4 text-sm">
                        <PlanRow label="Fase actual" value="Alineación dental" />
                        <PlanRow label="Progreso" value="70%" />
                        <PlanRow label="Objetivo siguiente" value="Radiografía panorámica" />

                        <div className="mt-4">
                            <p className="text-xs uppercase text-slate-500 dark:text-slate-400">Avance estimado</p>
                            <div className="mt-1 w-full h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                <div className="h-full bg-primary rounded-full" style={{ width: "70%" }} />
                            </div>
                        </div>
                    </div>
                </Section>

                {/* PRESUPUESTO */}
                <Section
                    title="Resumen de presupuesto"
                    icon={FileText}
                >
                    <div className="space-y-4 text-sm mt-2">
                        <Bar label="Cotización normal" amount="$0" percent={0} color="bg-blue-500" />
                        <Bar label="Cotización extra" amount="$0" percent={0} color="bg-purple-500" />
                        <Bar label="Pago inicial" amount="$0" percent={0} color="bg-green-500" />
                        <Bar label="Total del plan" amount="$0" percent={0} color="bg-primary" />
                    </div>
                </Section>

                {/* PAGOS */}
                <Section title="Resumen de pagos" icon={Activity}>
                    <div className="space-y-4 text-sm">

                        <div className="flex justify-between">
                            <p className="text-xs uppercase text-slate-500">Total del plan</p>
                            <p className="font-semibold">$0</p>
                        </div>

                        <div className="flex justify-between">
                            <p className="text-xs uppercase text-slate-500">Pagado</p>
                            <p className="font-semibold text-green-600">$0</p>
                        </div>

                        <div className="flex justify-between">
                            <p className="text-xs uppercase text-slate-500">Pendiente</p>
                            <p className="font-semibold text-red-600">$0</p>
                        </div>

                        <div className="mt-3">
                            <p className="text-xs text-slate-500 mb-1">Avance del pago</p>
                            <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                <div className="h-full bg-green-500 rounded-full" style={{ width: "30%" }} />
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4 pt-2">
                            <div>
                                <p className="text-xs uppercase text-slate-500">Pagos</p>
                                <p className="font-medium">3 hechos</p>
                            </div>

                            <div>
                                <p className="text-xs uppercase text-slate-500">Restantes</p>
                                <p className="font-medium">8</p>
                            </div>

                            <div>
                                <p className="text-xs uppercase text-slate-500">Próximo pago</p>
                                <p className="font-medium">15 Ene 2025</p>
                            </div>
                        </div>

                    </div>
                </Section>

            </div>

            {/* ============================================================
                TIMELINE + ACTIVIDAD + INDICADORES (3 columnas)
            ============================================================ */}
            <div className="grid grid-cols-3 gap-6">

                {/* Timeline */}
                <Section title="Línea del tiempo clínica" icon={PackageOpen}>
                    <div className="space-y-3">
                        {timeline.map((t, i) => (
                            <div key={i} className="flex gap-4">
                                <div className="w-16 text-xs text-slate-500">{t.date}</div>
                                <div className="flex-1 border-l pl-4 border-slate-300">
                                    <p className="text-sm">{t.text}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </Section>

                {/* Actividad administrativa */}
                <Section title="Actividad administrativa" icon={FileText}>
                    <div className="space-y-3">
                        <AdminItem date="2025-11-10" text="Factura #A-432 generada" />
                        <AdminItem date="2025-10-29" text="Pago recibido — $1,200 MXN" />
                        <AdminItem date="2025-10-28" text="Presupuesto #P-112 autorizado" />
                        <AdminItem date="2025-10-20" text="Contrato firmado" />
                    </div>
                </Section>

                {/* Indicadores clínicos */}
                <Section title="Indicadores clínicos" icon={Activity}>
                    <div className="space-y-3">
                        <HealthItem label="Placa bacteriana" level="Leve" color="bg-green-500" />
                        <HealthItem label="Inflamación gingival" level="Moderada" color="bg-yellow-500" />
                        <HealthItem label="Riesgo de caries" level="Bajo" color="bg-blue-500" />
                        <HealthItem label="Última limpieza" level="Hace 3 meses" color="bg-purple-500" />
                    </div>
                </Section>

            </div>

        </div>
    );
}

/* ============================================================
    COMPONENTES PREMIUM
============================================================ */

function KPI({ icon: Icon, label, value }) {
    return (
        <div className="bg-white dark:bg-secondary p-4 rounded-2xl shadow border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3">
                <Icon size={20} className="text-primary" />
                <div>
                    <p className="text-xs text-slate-500">{label}</p>
                    <p className="font-bold">{value}</p>
                </div>
            </div>
        </div>
    );
}

function Section({ title, icon: Icon, subtitle, children }) {
    // Subtítulos automáticos
    const defaultSubtitles = {
        "Alertas importantes": "Información relevante que requiere atención inmediata.",
        "Próximas citas": "Citas programadas para el seguimiento del paciente.",
        "Plan de tratamiento": "Resumen del proceso clínico actual del paciente.",
        "Resumen de presupuesto": "Distribución del costo total del tratamiento y su proporcionalidad.",
        "Resumen de pagos": "Estado financiero del plan y pagos realizados.",
        "Línea del tiempo clínica": "Eventos recientes y relevantes del tratamiento.",
        "Actividad administrativa": "Movimientos y registros administrativos del paciente.",
        "Indicadores clínicos": "Estado actual y condiciones bucales observadas."
    };

    const finalSubtitle = subtitle || defaultSubtitles[title] || "";

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

                {finalSubtitle && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                        {finalSubtitle}
                    </p>
                )}
            </div>

            <div className="space-y-3">
                {children}
            </div>
        </div>
    );
}

function AdminItem({ date, text }) {
    return (
        <div className="flex gap-4">
            <div className="w-16 text-xs text-slate-500 dark:text-slate-400">
                {date}
            </div>

            <div className="flex-1 border-l pl-4 border-slate-300 dark:border-slate-600">
                <p className="text-sm">{text}</p>
            </div>
        </div>
    );
}

function HealthItem({ label, level, color }) {
    return (
        <div className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-white dark:bg-secondary border border-slate-200 dark:border-slate-700 shadow-sm">
            <div>
                <p className="text-sm font-semibold">{label}</p>
                <p className="text-xs text-slate-500">{level}</p>
            </div>
            <div className={`w-3 h-3 rounded-full ${color}`}></div>
        </div>
    );
}

function PlanRow({ label, value }) {
    return (
        <div className="flex justify-between">
            <p className="text-xs uppercase text-slate-500 dark:text-slate-400">{label}</p>
            <p className="font-medium">{value}</p>
        </div>
    );
}

function Bar({ label, amount, percent, color }) {
    return (
        <div className="space-y-1">
            <div className="flex justify-between items-center">
                <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
                <p className="text-xs font-semibold">{amount}</p>
            </div>

            <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                    className={`${color} h-full rounded-full`}
                    style={{ width: `${percent}%` }}
                />
            </div>
        </div>
    );
}

function getReadableAge(birthDate) {
    if (!birthDate) return "—";

    const birth = new Date(birthDate);
    const today = new Date();

    let years = today.getFullYear() - birth.getFullYear();
    let months = today.getMonth() - birth.getMonth();
    let days = today.getDate() - birth.getDate();

    // Ajustar días
    if (days < 0) {
        const prevMonth = new Date(today.getFullYear(), today.getMonth(), 0).getDate();
        days += prevMonth;
        months--;
    }

    // Ajustar meses
    if (months < 0) {
        months += 12;
        years--;
    }

    const parts = [];
    if (years > 0) parts.push(`${years} año${years === 1 ? "" : "s"}`);
    if (months > 0) parts.push(`${months} mes${months === 1 ? "" : "es"}`);
    if (days > 0) parts.push(`${days} día${days === 1 ? "" : "s"}`);

    return parts.join(", ");
}

