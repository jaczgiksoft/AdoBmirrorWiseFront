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

    // Datos para el gráfico de anillo
    const phaseData = useMemo(() => [
        { name: "Fase I", value: fase1, color: "#F57C00" },
        { name: "Fase II", value: fase2, color: "#FBC02D" },
        { name: "Retenedor", value: retenedor, color: "#7B1FA2" },
        { name: "Alta", value: alta, color: "#388E3C" },
    ], [fase1, fase2, retenedor, alta]);

    const activePct = total > 0 ? Math.round((activos / total) * 100) : 0;

    return (
        <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            className="bg-secondary rounded-2xl p-2 border border-slate-700 flex flex-col gap-6 shadow-inner mb-3"
        >
            {/* 🔹 Título */}
            <h2 className="text-lg font-semibold text-primary text-center tracking-wide">
                Resumen de pacientes
            </h2>

            {/* 🔸 Métricas principales */}
            <div className="flex justify-around text-center">
                <Metric label="Total pacientes" value={total} color="#60A5FA" />
                <Metric label="En tratamiento" value={activos} color="#4CAF50" />
                <Metric label="Activos (%)" value={`${activePct}%`} color="#4CAF50" />
            </div>

            {/* 🔵 Gráfico de anillo */}
            <div className="relative h-56 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={phaseData}
                            dataKey="value"
                            innerRadius={60}
                            outerRadius={90}
                            paddingAngle={3}
                            stroke="none"
                        >
                            {phaseData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                    </PieChart>
                </ResponsiveContainer>
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3, duration: 0.4 }}
                    className="absolute text-center"
                >
                    <p className="text-slate-400 text-xs">Pacientes</p>
                    <p className="text-xl font-bold text-primary">{total}</p>
                </motion.div>
            </div>

            {/* 🧩 Leyenda */}
            <div className="grid grid-cols-2 gap-3 mt-2">
                {phaseData.map((item) => (
                    <LegendItem key={item.name} label={item.name} value={item.value} color={item.color} />
                ))}
            </div>
        </motion.div>
    );
}

function Metric({ label, value, color }) {
    return (
        <div className="flex flex-col items-center">
            <p className="text-slate-400 text-sm">{label}</p>
            <p className="text-2xl font-bold" style={{ color }}>{value}</p>
        </div>
    );
}

function LegendItem({ label, value, color }) {
    return (
        <div className="flex items-center justify-between px-3 py-2 rounded-lg border border-slate-700 bg-dark/40 hover:bg-dark/60 transition">
            <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                <span className="text-sm text-slate-300">{label}</span>
            </div>
            <span className="text-sm font-semibold" style={{ color }}>{value}</span>
        </div>
    );
}
