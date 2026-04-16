import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
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
    Archive,
    Search,
    UserCheck,
    Briefcase
} from "lucide-react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area,
    PieChart,
    Pie,
    Cell,
    Legend
} from 'recharts';

import { PageHeader } from "@/components/layout";
import DateInput from "@/components/inputs/DateInput";
import { useFiltroData } from "./hooks/useFiltroData";
import { useClinicalPerformance } from "./hooks/useClinicalPerformance";

const COLORS = ['#22c55e', '#ef4444', '#3b82f6', '#f59e0b', '#a855f7'];

export default function FiltroList() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState("clinica");
    
    // Filtros para Desempeño Clínico
    const [filters, setFilters] = useState({
        startDate: dayjs().subtract(30, 'day').format('YYYY-MM-DD'),
        endDate: dayjs().format('YYYY-MM-DD'),
        doctorId: "all",
        serviceId: "all"
    });

    const { inventarioStats } = useFiltroData();
    const { loading, employees, services, dashboardData } = useClinicalPerformance(filters);

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    return (
        <div className="bg-slate-50 dark:bg-dark min-h-screen flex flex-col font-sans text-slate-900 dark:text-slate-50">
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="w-full max-w-7xl mx-auto px-6 mt-6 pb-20"
            >
                {/* Header Section */}
                <div className="flex items-center justify-between gap-4 mb-8 flex-wrap">
                    <PageHeader
                        title="Dashboard de Desempeño"
                        subtitle="Análisis de rendimiento clínico e inventario"
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
                            {/* Filtros Superiores */}
                            <div className="bg-white dark:bg-secondary p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                                <DateInput 
                                    label="Desde" 
                                    value={filters.startDate} 
                                    onChange={(val) => handleFilterChange('startDate', val)} 
                                />
                                <DateInput 
                                    label="Hasta" 
                                    value={filters.endDate} 
                                    onChange={(val) => handleFilterChange('endDate', val)} 
                                />
                                
                                <div className="space-y-1">
                                    <label className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400 ml-1">Personal / Doctor</label>
                                    <select 
                                        className="w-full px-3 py-2.5 rounded-lg border bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border-slate-300 dark:border-slate-700 text-sm focus:ring-2 focus:ring-primary/50"
                                        value={filters.doctorId}
                                        onChange={(e) => handleFilterChange('doctorId', e.target.value)}
                                    >
                                        <option value="all">Todos los empleados</option>
                                        {employees.map(emp => (
                                            <option key={emp.id} value={emp.id}>{emp.name || `${emp.first_name} ${emp.last_name}`}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400 ml-1">Tipo de Servicio</label>
                                    <select 
                                        className="w-full px-3 py-2.5 rounded-lg border bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border-slate-300 dark:border-slate-700 text-sm focus:ring-2 focus:ring-primary/50"
                                        value={filters.serviceId}
                                        onChange={(e) => handleFilterChange('serviceId', e.target.value)}
                                    >
                                        <option value="all">Todos los servicios</option>
                                        {services.map(ser => (
                                            <option key={ser.id} value={ser.id}>{ser.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {loading ? (
                                <div className="h-64 flex items-center justify-center">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                                </div>
                            ) : dashboardData ? (
                                <>
                                    {/* KPI Cards */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                        <KPICard 
                                            label="% Citas Bien" 
                                            value={`${dashboardData.kpis.successRate}%`} 
                                            icon={UserCheck} 
                                            color="text-emerald-500" 
                                            bg="bg-emerald-500/10" 
                                        />
                                        <KPICard 
                                            label="Total de Retrasos" 
                                            value={dashboardData.kpis.totalDelays} 
                                            icon={Clock} 
                                            color="text-rose-500" 
                                            bg="bg-rose-500/10" 
                                        />
                                        <KPICard 
                                            label="Doctor del Mes" 
                                            value={dashboardData.kpis.topDoctor} 
                                            icon={Zap} 
                                            color="text-amber-500" 
                                            bg="bg-amber-500/10" 
                                        />
                                        <KPICard 
                                            label="vs. Mes Anterior" 
                                            value={`+${dashboardData.kpis.comparison}%`} 
                                            icon={TrendingUp} 
                                            color="text-blue-500" 
                                            bg="bg-blue-500/10" 
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                        {/* Chart: Desempeño Individual */}
                                        <ChartContainer title="Desempeño Individual por Empleado" icon={BarChart2}>
                                            <ResponsiveContainer width="100%" height={300}>
                                                <BarChart data={dashboardData.charts.barData}>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                                    <XAxis dataKey="name" fontSize={12} />
                                                    <YAxis fontSize={12} />
                                                    <Tooltip 
                                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                                    />
                                                    <Legend />
                                                    <Bar dataKey="Bien" fill="#22c55e" radius={[4, 4, 0, 0]} />
                                                    <Bar dataKey="Retraso" fill="#ef4444" radius={[4, 4, 0, 0]} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </ChartContainer>

                                        {/* Chart: Evolución General */}
                                        <ChartContainer title="Evolución del Desempeño (% Éxito)" icon={Activity}>
                                            <ResponsiveContainer width="100%" height={300}>
                                                <AreaChart data={dashboardData.charts.areaData}>
                                                    <defs>
                                                        <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                                        </linearGradient>
                                                    </defs>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                                    <XAxis dataKey="date" fontSize={10} />
                                                    <YAxis fontSize={12} unit="%" />
                                                    <Tooltip />
                                                    <Area type="monotone" dataKey="rate" stroke="#3b82f6" fillOpacity={1} fill="url(#colorRate)" strokeWidth={3} />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        </ChartContainer>

                                        {/* Chart: Distribución de Servicios del Top Performer */}
                                        <div className="lg:col-span-2">
                                            <ChartContainer title={`Servicios más realizados: ${dashboardData.kpis.topDoctor}`} icon={Briefcase}>
                                                <div className="flex flex-col md:flex-row items-center">
                                                    <div className="w-full md:w-1/2 h-[300px]">
                                                        <ResponsiveContainer width="100%" height="100%">
                                                            <PieChart>
                                                                <Pie
                                                                    data={dashboardData.charts.pieData}
                                                                    innerRadius={60}
                                                                    outerRadius={100}
                                                                    paddingAngle={5}
                                                                    dataKey="value"
                                                                >
                                                                    {dashboardData.charts.pieData.map((entry, index) => (
                                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                                    ))}
                                                                </Pie>
                                                                <Tooltip />
                                                            </PieChart>
                                                        </ResponsiveContainer>
                                                    </div>
                                                    <div className="w-full md:w-1/2 space-y-4">
                                                        {dashboardData.charts.pieData.map((entry, index) => (
                                                            <div key={index} className="flex justify-between items-center p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                                                                    <span className="text-sm font-medium">{entry.name}</span>
                                                                </div>
                                                                <span className="font-bold">{entry.value} serv.</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </ChartContainer>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="p-20 text-center bg-white dark:bg-secondary rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700">
                                    <AlertTriangle className="mx-auto text-slate-400 mb-4" size={48} />
                                    <p className="text-slate-500 font-medium">No hay datos disponibles para los filtros seleccionados.</p>
                                </div>
                            )}
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
                    <p className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">{value}</p>
                </div>
            </div>
        </motion.div>
    );
}

function ChartContainer({ title, icon: Icon, children }) {
    return (
        <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-secondary rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm"
        >
            <div className="flex items-center gap-2 mb-6">
                <Icon className="text-primary" size={20} />
                <h3 className="font-bold text-slate-800 dark:text-slate-100">{title}</h3>
            </div>
            {children}
        </motion.div>
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
