import { motion } from "framer-motion";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { useMemo } from "react";

export default function PatientDashboard({ patients = [] }) {
    const total = patients.length || 0;
    const activos = patients.filter(p => p.type?.name === "En tratamiento").length;
    const fase1 = patients.filter(p => p.status?.name === "Fase I").length;
    const fase2 = patients.filter(p => p.status?.name === "Fase II").length;
    const retenedor = patients.filter(p => p.status?.name === "Retenedor").length;
    const alta = patients.filter(p => p.status?.name === "Alta").length;

    const phaseData = useMemo(() => [
        { name: "Fase I", value: fase1, color: "#F57C00" },
        { name: "Fase II", value: fase2, color: "#FBC02D" },
        { name: "Retenedor", value: retenedor, color: "#7B1FA2" },
        { name: "Alta", value: alta, color: "#388E3C" },
    ], [fase1, fase2, retenedor, alta]);

    const activePct = total > 0 ? Math.round((activos / total) * 100) : 0;

    // Fase ganadora
    const winner = phaseData.reduce(
        (max, item) => (item.value > max.value ? item : max),
        phaseData[0]
    );

    return (
        <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="
                rounded-xl p-3
                bg-white border-slate-300
                dark:bg-secondary dark:border-slate-700
                flex flex-col gap-4
            "
        >
            {/* Título compacto */}
            <h2 className="text-sm font-semibold text-cyan-600 dark:text-primary text-center">
                Resumen de pacientes
            </h2>

            {/* Métricas pequeñas */}
            <div className="flex justify-around text-center">
                <Metric label="Total" value={total} color={winner.color} />
                <Metric label="Tratamiento" value={activos} color="#4CAF50" />
                <Metric label="Activos (%)" value={`${activePct}%`} color="#4CAF50" />
            </div>

            {/* Gráfico más pequeño */}
            <div className="relative h-40 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={phaseData}
                            dataKey="value"
                            innerRadius={45}
                            outerRadius={70}
                            paddingAngle={2}
                            stroke="none"
                        >
                            {phaseData.map((entry, index) => (
                                <Cell key={index} fill={entry.color} />
                            ))}
                        </Pie>
                    </PieChart>
                </ResponsiveContainer>

                {/* Número total */}
                <div className="absolute text-center">
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        Total
                    </p>
                    <p
                        className="text-lg font-bold"
                        style={{ color: winner.color }}
                    >
                        {total}
                    </p>
                </div>
            </div>

            {/* Leyenda mini */}
            <div className="grid grid-cols-2 gap-2">
                {phaseData.map((item) => (
                    <LegendItem
                        key={item.name}
                        label={item.name}
                        value={item.value}
                        color={item.color}
                    />
                ))}
            </div>
        </motion.div>
    );
}

/* ------------------------ MÉTRICAS ------------------------ */
function Metric({ label, value, color }) {
    return (
        <div className="flex flex-col items-center">
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {label}
            </p>
            <p
                className="text-xl font-bold leading-none"
                style={{ color }}
            >
                {value}
            </p>
        </div>
    );
}

/* ------------------------ LEYENDA ------------------------ */
function LegendItem({ label, value, color }) {
    return (
        <div
            className="
                flex items-center justify-between px-2 py-1.5 rounded-lg
                bg-slate-100 border border-slate-300
                dark:bg-dark/40 dark:border-slate-700
                transition
            "
        >
            <div className="flex items-center gap-2">
                <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: color }}
                />
                <span className="text-xs text-slate-700 dark:text-slate-300">
                    {label}
                </span>
            </div>

            <span
                className="text-xs font-semibold"
                style={{ color }}
            >
                {value}
            </span>
        </div>
    );
}
