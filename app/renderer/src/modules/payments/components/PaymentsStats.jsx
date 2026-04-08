import React from "react";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from "recharts";
import { formatCurrency } from "../utils/formatCurrency";

// ── Static mock data — defined outside component to prevent recreation ───────

const BY_DAY = [
    { day: "Lun", total: 12000 },
    { day: "Mar", total: 18000 },
    { day: "Mié", total: 9000 },
    { day: "Jue", total: 15000 },
    { day: "Vie", total: 22000 },
];

const BY_METHOD = [
    { method: "Efectivo", total: 25000 },
    { method: "Tarjeta", total: 18000 },
    { method: "Transferencia", total: 12000 },
];

const PIE_COLORS = ["#10b981", "#38bdf8", "#a78bfa"];

// ── Custom tooltip for BarChart ───────────────────────────────────────────────

function BarTooltip({ active, payload, label }) {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-white dark:bg-secondary border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs shadow-xl">
            <p className="text-slate-700 dark:text-slate-300 mb-1 font-semibold">{label}</p>
            <p className="text-emerald-400 font-bold">{formatCurrency(payload[0].value)}</p>
        </div>
    );
}

// ── Custom tooltip for PieChart ───────────────────────────────────────────────

function PieTooltip({ active, payload }) {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-white dark:bg-secondary border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs shadow-xl">
            <p className="text-slate-700 dark:text-slate-300 mb-1 font-semibold">{payload[0].name}</p>
            <p className="font-bold" style={{ color: payload[0].payload.fill }}>{formatCurrency(payload[0].value)}</p>
        </div>
    );
}

// ── Custom legend for PieChart ────────────────────────────────────────────────

function PieLegend({ payload }) {
    return (
        <ul className="flex flex-col gap-2 mt-2">
            {payload.map((entry, i) => (
                <li key={i} className="flex items-center justify-between gap-4 text-xs">
                    <span className="flex items-center gap-1.5">
                        <span className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color }}></span>
                        <span className="text-slate-700 dark:text-slate-300">{entry.value}</span>
                    </span>
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                        {formatCurrency(BY_METHOD.find(d => d.method === entry.value)?.total ?? 0)}
                    </span>
                </li>
            ))}
        </ul>
    );
}

// ── Stat summary row above charts ─────────────────────────────────────────────

function SummaryRow() {
    const totalWeek = BY_DAY.reduce((s, d) => s + d.total, 0);
    const totalMethods = BY_METHOD.reduce((s, d) => s + d.total, 0);
    const topDay = [...BY_DAY].sort((a, b) => b.total - a.total)[0];

    const items = [
        { label: "Total semana", value: formatCurrency(totalWeek), color: "text-emerald-400" },
        { label: "Día más alto", value: topDay.day, color: "text-sky-400" },
        { label: "Mejor ingreso", value: formatCurrency(topDay.total), color: "text-sky-400" },
        { label: "Total métodos", value: formatCurrency(totalMethods), color: "text-purple-400" },
    ];

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            {items.map(item => (
                <div
                    key={item.label}
                    className="bg-white dark:bg-secondary border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-3 flex flex-col"
                >
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 mb-1">{item.label}</span>
                    <span className={`text-base font-bold ${item.color}`}>{item.value}</span>
                </div>
            ))}
        </div>
    );
}

// ── Main export ───────────────────────────────────────────────────────────────

export default function PaymentsStats() {
    return (
        <div className="flex-1 overflow-auto space-y-4 pb-4">

            {/* Summary Row */}
            <SummaryRow />

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

                {/* Bar Chart — Ingresos por día (2/3 width) */}
                <div className="lg:col-span-2 bg-white dark:bg-secondary border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-0.5">Ingresos por día</h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-4">Semana actual</p>
                    <ResponsiveContainer width="100%" height={230}>
                        <BarChart data={BY_DAY} barSize={36} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                            <XAxis
                                dataKey="day"
                                tick={{ fill: "#94a3b8", fontSize: 12 }}
                                axisLine={false}
                                tickLine={false}
                            />
                            <YAxis
                                tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                                tick={{ fill: "#94a3b8", fontSize: 11 }}
                                axisLine={false}
                                tickLine={false}
                                width={42}
                            />
                            <Tooltip
                                content={<BarTooltip />}
                                cursor={{ fill: "rgba(148,163,184,0.07)" }}
                                isAnimationActive={false}
                            />
                            <Bar
                                dataKey="total"
                                fill="#10b981"
                                radius={[6, 6, 0, 0]}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Pie Chart — Pagos por método (1/3 width) */}
                <div className="bg-white dark:bg-secondary border border-slate-200 dark:border-slate-700 rounded-lg p-4 flex flex-col">
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-0.5">Por método de pago</h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2">Distribución acumulada</p>
                    <div className="flex-1 flex items-center justify-center">
                        <ResponsiveContainer width="100%" height={160}>
                            <PieChart>
                                <Pie
                                    data={BY_METHOD}
                                    dataKey="total"
                                    nameKey="method"
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={48}
                                    outerRadius={72}
                                    paddingAngle={3}
                                >
                                    {BY_METHOD.map((_, i) => (
                                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    content={<PieTooltip />}
                                    isAnimationActive={false}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <PieLegend payload={BY_METHOD.map((d, i) => ({ value: d.method, color: PIE_COLORS[i] }))} />
                </div>

            </div>

        </div>
    );
}
