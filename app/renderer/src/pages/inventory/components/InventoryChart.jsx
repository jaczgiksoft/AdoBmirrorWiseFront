import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';

const COLORS = {
    "Entrada": "#22c55e",
    "Salida": "#3b82f6",
    "Merma": "#f97316",
    "Devolucion": "#a855f7",
    "Caducado": "#ef4444",
};

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white dark:bg-slate-800 p-3 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl shadow-slate-200/50 dark:shadow-none min-w-[150px]">
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Tipo de Movimiento</p>
                <p className="text-sm font-bold text-slate-900 dark:text-white mb-2">{label}</p>
                <div className="flex items-center justify-between gap-4 pt-2 border-t border-slate-100 dark:border-slate-700">
                    <span className="text-xs text-slate-500 dark:text-slate-400">Total:</span>
                    <span className="text-sm font-bold text-cyan-600 dark:text-cyan-400">{payload[0].value} transacciones</span>
                </div>
            </div>
        );
    }
    return null;
};

export default function InventoryChart({ movements }) {
    const data = useMemo(() => {
        const counts = {
            "Entrada": 0,
            "Salida": 0,
            "Merma": 0,
            "Devolucion": 0,
            "Caducado": 0,
        };

        if (movements) {
            movements.forEach(m => {
                if (counts[m.type] !== undefined) {
                    counts[m.type] += 1;
                }
            });
        }

        return Object.entries(counts).map(([name, count]) => ({
            name,
            count
        })).filter(d => d.count > 0);
    }, [movements]);

    if (!data || data.length === 0) {
        return (
            <div className="h-64 flex items-center justify-center bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                <p className="text-slate-500 dark:text-slate-400">No hay movimientos en este periodo para graficar</p>
            </div>
        );
    }

    return (
        <div className="w-full h-[300px] mt-4">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart
                    data={data}
                    margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
                >
                    <CartesianGrid 
                        strokeDasharray="3 3" 
                        vertical={false} 
                        stroke="#e2e8f0" 
                        className="dark:stroke-slate-700/50"
                    />
                    <XAxis 
                        dataKey="name" 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12, fill: '#64748b', fontWeight: 600 }}
                        dy={10}
                    />
                    <YAxis 
                        allowDecimals={false}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12, fill: '#64748b' }}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(148, 163, 184, 0.1)' }} />
                    <Bar 
                        dataKey="count" 
                        radius={[6, 6, 0, 0]}
                        animationDuration={1500}
                        maxBarSize={60}
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[entry.name] || "#0891b2"} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
