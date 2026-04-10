import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
    Activity,
    BarChart2,
    TrendingUp,
    Filter,
    LayoutDashboard,
    Stethoscope,
    Package,
    Clock,
    Users,
    UserPlus,
    Calendar,
    CalendarX,
    AlertTriangle,
    ArrowUpRight,
    ArrowDownRight,
    Zap,
    ClipboardList,
    RotateCcw,
    Trash2,
    Archive
} from "lucide-react";
import { PageHeader } from "@/components/layout";
import { useFiltroData } from "./hooks/useFiltroData";

export default function FiltroList() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState("clinica");
    const { clinicaStats, inventarioStats } = useFiltroData();

    return (
        <div className="bg-slate-50 dark:bg-dark min-h-screen flex flex-col font-sans text-slate-900 dark:text-slate-50">
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="w-full max-w-7xl mx-auto px-6 mt-6 pb-20"
            >
                <div className="flex items-center justify-between gap-4 mb-8 flex-wrap">
                    <PageHeader
                        title="Filtro"
                        subtitle="Análisis de rendimiento y métricas de la clínica"
                        onBack={() => navigate("/dashboard")}
                    />

                    <div className="flex bg-white dark:bg-secondary p-1 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                        <TabButton
                            active={activeTab === "clinica"}
                            onClick={() => setActiveTab("clinica")}
                            icon={Stethoscope}
                            label="Clínica"
                        />
                        <TabButton
                            active={activeTab === "inventario"}
                            onClick={() => setActiveTab("inventario")}
                            icon={Package}
                            label="Inventario"
                        />
                    </div>
                </div>

                <AnimatePresence mode="wait">
                    {activeTab === "clinica" ? (
                        <motion.div
                            key="clinica"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ duration: 0.2 }}
                            className="space-y-8"
                        >
                            {/* KPI Cards */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                {clinicaStats.kpis.map((stat, i) => (
                                    <KPICard key={i} {...stat} />
                                ))}
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                {/* Estado de Rendimiento */}
                                <div className="lg:col-span-2 space-y-6">
                                    <div className="bg-white dark:bg-secondary rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
                                        <div className="flex items-center justify-between mb-6">
                                            <h3 className="text-lg font-bold flex items-center gap-2">
                                                <Activity className="text-blue-500" size={20} />
                                                Estado de Rendimiento
                                            </h3>
                                            <span className="text-xs font-bold bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 px-3 py-1 rounded-full uppercase tracking-wider">
                                                Actualizado hoy
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            {/* Duración Promedio */}
                                            <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                                                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mb-1">Duración promedio por cita</p>
                                                <p className="text-3xl font-black text-slate-900 dark:text-slate-100">{clinicaStats.rendimiento.duracionPromedio}</p>
                                                <div className="mt-4 flex items-center gap-2 text-xs font-bold text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-1 rounded w-fit">
                                                    <ArrowDownRight size={14} /> -8% vs mes anterior
                                                </div>
                                            </div>

                                            {/* Ortodoncia General */}
                                            <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
                                                <div className="flex items-center gap-2 mb-3">
                                                    <div className="w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]"></div>
                                                    <p className="text-sm font-bold uppercase tracking-wide text-slate-600 dark:text-slate-400">{clinicaStats.rendimiento.ortodoncia.label}</p>
                                                </div>
                                                <div className="space-y-3">
                                                    <div className="flex justify-between items-center text-sm">
                                                        <span className="text-slate-500">Duración del servicio</span>
                                                        <span className="font-bold">{clinicaStats.rendimiento.ortodoncia.duracion}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center text-sm">
                                                        <span className="text-slate-500">Tiempo de espera</span>
                                                        <span className="font-bold">{clinicaStats.rendimiento.ortodoncia.espera}</span>
                                                    </div>
                                                    <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
                                                        <span className="text-sm font-medium">Total pacientes</span>
                                                        <span className="text-lg font-black text-purple-600 dark:text-purple-400">{clinicaStats.rendimiento.ortodoncia.totalPacientes}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Tiempos de Espera Proyectados */}
                                        <div className="mt-8 border-t border-slate-100 dark:border-slate-800 pt-8">
                                            <div className="flex items-center justify-between mb-6">
                                                <p className="font-bold text-slate-700 dark:text-slate-300">Espera entre agendar y atender</p>
                                                <div className="flex gap-4">
                                                    <div className="flex flex-col items-end">
                                                        <span className="text-xs text-slate-400">Espera promedio</span>
                                                        <span className="text-xl font-bold text-slate-900 dark:text-slate-100">{clinicaStats.rendimiento.espera.promedio}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                <EsperaMetric label="+30 min" value={clinicaStats.rendimiento.espera.critico} color="text-red-500" icon={AlertTriangle} />
                                                <EsperaMetric label="Día crítico" value={clinicaStats.rendimiento.espera.diaCritico} color="text-amber-500" icon={Calendar} />
                                                <EsperaMetric label="Sin espera" value={clinicaStats.rendimiento.espera.sinEspera} color="text-emerald-500" icon={TrendingUp} />
                                                <EsperaMetric label="Tendencia" value="Excelente" color="text-blue-500" icon={Zap} />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Servicios más solicitados */}
                                <div className="bg-white dark:bg-secondary rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
                                    <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                                        <TrendingUp className="text-emerald-500" size={20} />
                                        Servicios Solicitados
                                    </h3>
                                    <div className="space-y-5">
                                        {clinicaStats.rendimiento.solicitados.map((item, i) => (
                                            <div key={i} className="group cursor-default">
                                                <div className="flex justify-between items-center mb-1.5">
                                                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{item.name}</span>
                                                    <span className="text-xs font-bold text-slate-400">{item.count} citas</span>
                                                </div>
                                                <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${(item.count / 42) * 100}%` }}
                                                        transition={{ duration: 1, delay: 0.1 * i }}
                                                        className={`h-full ${item.color} rounded-full`}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-10 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                                        <p className="text-xs text-slate-400 font-medium leading-relaxed">
                                            Los servicios de estética y prevención representan el 64% de la demanda semanal.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="inventario"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.2 }}
                            className="space-y-8"
                        >
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                {/* Alertas de Stock */}
                                <div className="bg-white dark:bg-secondary rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm flex flex-col">
                                    <div className="flex items-center gap-2 mb-8">
                                        <div className="p-2 bg-red-500/10 text-red-500 rounded-lg">
                                            <AlertTriangle size={20} />
                                        </div>
                                        <h3 className="font-bold text-lg">Stock Mínimo</h3>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 flex-1">
                                        <StockCircle label="En Alerta" value={inventarioStats.stock.alerta} color="text-amber-500" borderColor="border-amber-200" />
                                        <StockCircle label="Críticos" value={inventarioStats.stock.criticos} color="text-rose-500" borderColor="border-rose-200" />
                                        <StockCircle label="Total" value={inventarioStats.stock.total} color="text-blue-500" borderColor="border-blue-200" />
                                        <StockCircle label="Reponer" value={inventarioStats.stock.reponer} color="text-emerald-500" borderColor="border-emerald-200" />
                                    </div>
                                </div>

                                {/* Movimientos */}
                                <div className="bg-white dark:bg-secondary rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm flex flex-col">
                                    <h3 className="text-lg font-bold mb-8 flex items-center gap-2">
                                        <ClipboardList className="text-blue-500" size={20} />
                                        Movimientos
                                    </h3>
                                    <div className="space-y-4 flex-1 flex flex-col justify-center">
                                        <MovimientoRow
                                            label="Entrada"
                                            value={inventarioStats.movimientos.entrada}
                                            icon={ArrowUpRight}
                                            color="emerald"
                                        />
                                        <MovimientoRow
                                            label="Salida"
                                            value={inventarioStats.movimientos.salida}
                                            icon={ArrowDownRight}
                                            color="rose"
                                        />
                                        <MovimientoRow
                                            label="Devolución"
                                            value={inventarioStats.movimientos.devolucion}
                                            icon={RotateCcw}
                                            color="blue"
                                        />
                                        <MovimientoRow
                                            label="Merma"
                                            value={inventarioStats.movimientos.merma}
                                            icon={Trash2}
                                            color="amber"
                                        />
                                        <MovimientoRow
                                            label="Caducado"
                                            value={inventarioStats.movimientos.caducado}
                                            icon={CalendarX}
                                            color="red"
                                        />
                                    </div>
                                </div>

                                {/* Más Utilizados */}
                                <div className="bg-white dark:bg-secondary rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm flex flex-col">
                                    <h3 className="text-lg font-bold mb-8 flex items-center gap-2">
                                        <Zap className="text-amber-500" size={20} />
                                        Más Utilizados
                                    </h3>

                                    <div className="flex-1 space-y-8">
                                        <div>
                                            <p className="text-2xl font-black text-slate-800 dark:text-slate-100 leading-tight">
                                                {inventarioStats.masUtilizados.top}
                                            </p>
                                            <p className="text-sm text-slate-500 mt-2">
                                                Han sido repuestos <span className="text-emerald-500 font-bold">{inventarioStats.masUtilizados.repuestos}</span>
                                            </p>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                                                <p className="text-xs text-slate-400 font-bold uppercase mb-1">Usos esta semana</p>
                                                <p className="text-2xl font-black text-slate-900 dark:text-white">{inventarioStats.masUtilizados.usos}</p>
                                            </div>
                                            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                                                <p className="text-xs text-slate-400 font-bold uppercase mb-1">Proveedor</p>
                                                <p className="text-2xl font-black text-slate-900 dark:text-white">{inventarioStats.masUtilizados.provedor}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
                                        <button className="w-full py-2.5 rounded-xl bg-primary/10 text-primary text-sm font-bold hover:bg-primary hover:text-white transition-all">
                                            Ver detalle de inventario
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
}

// --- Sub-components ---

function TabButton({ active, onClick, icon: Icon, label }) {
    return (
        <button
            onClick={onClick}
            className={`
                flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-bold transition-all relative z-10
                ${active ? 'text-white' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}
            `}
        >
            <Icon size={16} />
            {label}
            {active && (
                <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-primary rounded-lg -z-10 shadow-lg shadow-sky-500/25"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
            )}
        </button>
    );
}

function KPICard({ label, value, icon: Icon, color, bg }) {
    return (
        <motion.div
            whileHover={{ y: -5 }}
            className="bg-white dark:bg-secondary p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm transition-shadow hover:shadow-md"
        >
            <div className="flex items-center gap-4">
                <div className={`p-4 rounded-xl ${bg} ${color}`}>
                    <Icon size={24} />
                </div>
                <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-0.5">{label}</p>
                    <p className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">{value}</p>
                </div>
            </div>
        </motion.div>
    );
}

function EsperaMetric({ label, value, color, icon: Icon }) {
    return (
        <div className="flex flex-col items-center p-3 rounded-xl bg-white dark:bg-secondary border border-slate-100 dark:border-slate-700 shadow-sm">
            <div className={`mb-2 ${color}`}>
                <Icon size={18} />
            </div>
            <p className="text-lg font-black">{value}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase">{label}</p>
        </div>
    );
}

function StockCircle({ label, value, color, borderColor }) {
    return (
        <div className={`flex flex-col items-center justify-center p-4 rounded-3xl border-2 ${borderColor} bg-slate-50 dark:bg-slate-800/30`}>
            <span className={`text-3xl font-black ${color}`}>{value}</span>
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase mt-1">{label}</span>
        </div>
    );
}

function MovimientoRow({ label, value, icon: Icon, color }) {
    const colorClasses = {
        emerald: "bg-emerald-500/10 text-emerald-500",
        amber: "bg-amber-500/10 text-amber-500",
        rose: "bg-rose-500/10 text-rose-500",
        blue: "bg-blue-500/10 text-blue-500",
        red: "bg-red-500/10 text-red-500",
    };

    return (
        <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
                    <Icon size={18} />
                </div>
                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">{label}</span>
            </div>
            <span className="text-xl font-black">{value}</span>
        </div>
    );
}
