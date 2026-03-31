import React, { useMemo } from 'react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
    PieChart,
    Pie,
    Cell
} from 'recharts';
import dayjs from 'dayjs';

const COLORS = {
    "Entrada": "#22c55e",
    "Salida": "#3b82f6",
    "Merma": "#f97316",
    "Devolucion": "#a855f7",
    "Caducado": "#ef4444",
};

// Paleta genérica para gráficas de pastel (PieChart)
const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6', '#14b8a6', '#f97316', '#0ea5e9', '#ec4899', '#64748b'];

const CustomLineTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white dark:bg-slate-800 p-3 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl shadow-slate-200/50 dark:shadow-none min-w-[180px]">
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 border-b border-slate-100 dark:border-slate-700 pb-1">
                    {dayjs(label).format('DD [de] MMMM')}
                </p>
                <div className="space-y-1.5">
                    {payload.map((entry, index) => (
                        <div key={`tooltip-${index}`} className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.stroke }} />
                                <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">{entry.name}:</span>
                            </div>
                            <span className="text-xs font-bold text-slate-900 dark:text-white">
                                {Number(entry.value).toLocaleString('es-MX')}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        );
    }
    return null;
};

const CustomPieTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
        const data = payload[0];
        const isMoney = data.payload.isMoney; // custom flag
        const valueStr = isMoney 
            ? `$${Number(data.value).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`
            : `${Number(data.value).toLocaleString('es-MX')} u.`;

        return (
            <div className="bg-white dark:bg-slate-800 p-3 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl shadow-slate-200/50 dark:shadow-none min-w-[150px]">
                <p className="text-sm font-bold text-slate-900 dark:text-white mb-1">{data.name}</p>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: data.payload.fill || data.color || '#94a3b8' }} />
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{valueStr}</span>
                </div>
            </div>
        );
    }
    return null;
};

// Helper: Custom label para el pie chart
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name }) => {
    const RADIAN = Math.PI / 180;
    // Ajustar el radio para que el texto aparezca justo en el medio del ancho de la dona
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    // No mostrar si el porcentaje es muy pequeño para no encimar textos
    if (percent < 0.05) return null;

    return (
        <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" className="text-[11px] font-bold drop-shadow-sm">
            {`${(percent * 100).toFixed(0)}%`}
        </text>
    );
};

export default function InventoryChart({ movements = [], allMovements = [], items = [], providers = [], chartType = "Movimientos por Tipo" }) {

    // 1. LineChart: Frecuencia de movimientos
    const renderMovimientosPorTipo = () => {
        if (!movements.length) return renderEmpty();

        const groups = {};
        movements.forEach(m => {
            const dateKey = dayjs(m.date).format('YYYY-MM-DD');
            if (!groups[dateKey]) {
                groups[dateKey] = { date: dateKey, Entrada: 0, Salida: 0, Merma: 0, Devolucion: 0, Caducado: 0 };
            }
            if (groups[dateKey][m.type] !== undefined) {
                groups[dateKey][m.type] += 1; // Frecuencia
            }
        });

        const data = Object.values(groups).sort((a, b) => dayjs(a.date).diff(dayjs(b.date)));

        return (
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 20, right: 30, left: -20, bottom: 20 }}>
                    <defs>
                        {Object.entries(COLORS).map(([type, color]) => (
                            <linearGradient key={`gradient-${type}`} id={`color-${type}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                                <stop offset="95%" stopColor={color} stopOpacity={0} />
                            </linearGradient>
                        ))}
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-700/50" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 500 }} tickFormatter={(str) => dayjs(str).format('DD MMM')} dy={10} />
                    <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} dx={-10} />
                    <Tooltip content={<CustomLineTooltip />} />
                    <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} formatter={(value) => <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight">{value}</span>} />
                    {Object.entries(COLORS).map(([type, color]) => (
                        <Area 
                            key={type} 
                            type="monotone" 
                            dataKey={type} 
                            name={type} 
                            stroke={color} 
                            fillOpacity={1} 
                            fill={`url(#color-${type})`} 
                            strokeWidth={3} 
                            dot={{ r: 4, fill: '#fff', stroke: color, strokeWidth: 2 }} 
                            activeDot={{ r: 6, strokeWidth: 0, fill: color }} 
                            animationDuration={1500} 
                        />
                    ))}
                </AreaChart>
            </ResponsiveContainer>
        );
    };

    // 2. LineChart: Suma de cantidades (Entradas vs Salidas)
    const renderEntradasVsSalidas = () => {
        if (!movements.length) return renderEmpty();

        const groups = {};
        movements.forEach(m => {
            if (m.type !== "Entrada" && m.type !== "Salida") return;

            const dateKey = dayjs(m.date).format('YYYY-MM-DD');
            if (!groups[dateKey]) {
                groups[dateKey] = { date: dateKey, Entrada: 0, Salida: 0 };
            }
            groups[dateKey][m.type] += Math.abs(m.quantity); // Suma de cantidades
        });

        const data = Object.values(groups).sort((a, b) => dayjs(a.date).diff(dayjs(b.date)));

        return (
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 20, right: 30, left: -20, bottom: 20 }}>
                    <defs>
                        <linearGradient id="colorEntrada" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={COLORS["Entrada"]} stopOpacity={0.3} />
                            <stop offset="95%" stopColor={COLORS["Entrada"]} stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorSalida" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={COLORS["Salida"]} stopOpacity={0.3} />
                            <stop offset="95%" stopColor={COLORS["Salida"]} stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-700/50" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 500 }} tickFormatter={(str) => dayjs(str).format('DD MMM')} dy={10} />
                    <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} dx={-10} />
                    <Tooltip content={<CustomLineTooltip />} />
                    <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} formatter={(value) => <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight">{value}</span>} />
                    <Area 
                        type="monotone" 
                        dataKey="Entrada" 
                        name="Entrada" 
                        stroke={COLORS["Entrada"]} 
                        strokeWidth={3} 
                        fillOpacity={1} 
                        fill="url(#colorEntrada)" 
                        dot={{ r: 4, fill: '#fff', stroke: COLORS["Entrada"], strokeWidth: 2 }} 
                        activeDot={{ r: 6, strokeWidth: 0, fill: COLORS["Entrada"] }} 
                        animationDuration={1500} 
                    />
                    <Area 
                        type="monotone" 
                        dataKey="Salida" 
                        name="Salida" 
                        stroke={COLORS["Salida"]} 
                        strokeWidth={3} 
                        fillOpacity={1} 
                        fill="url(#colorSalida)" 
                        dot={{ r: 4, fill: '#fff', stroke: COLORS["Salida"], strokeWidth: 2 }} 
                        activeDot={{ r: 6, strokeWidth: 0, fill: COLORS["Salida"] }} 
                        animationDuration={1500} 
                    />
                </AreaChart>
            </ResponsiveContainer>
        );
    };

    // 3. PieChart: Stock agrupado por categoría (Global actual)
    const renderStockPorCategoria = () => {
        if (!items.length) return renderEmpty();

        const groups = {};
        items.forEach(item => {
            const cat = item.category || "General";
            if (!groups[cat]) groups[cat] = 0;
            groups[cat] += Math.max(0, item.quantity); // Asegurar valores no negativos
        });

        const data = Object.entries(groups)
            .map(([name, value]) => ({ name, value }))
            .filter(d => d.value > 0)
            .sort((a, b) => b.value - a.value);

        if (!data.length) return renderEmpty("No hay stock disponible");

        return (
            <ResponsiveContainer width="100%" height="100%">
                <PieChart margin={{ top: 10, right: 20, left: 20, bottom: 10 }}>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={renderCustomizedLabel}
                        outerRadius={120}
                        innerRadius={50}
                        fill="#8884d8"
                        dataKey="value"
                        animationDuration={1500}
                        stroke="none"
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip content={<CustomPieTooltip />} />
                    <Legend iconType="circle" layout="horizontal" verticalAlign="bottom" wrapperStyle={{ paddingTop: '10px' }} formatter={(value) => <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 tracking-tight truncate max-w-[120px] inline-flex align-bottom mr-2">{value}</span>} />
                </PieChart>
            </ResponsiveContainer>
        );
    };

    const getProviderName = (id) => {
        const p = providers.find(prov => String(prov.id) === String(id));
        return p ? p.name : (id === "Sin_Proveedor" ? "Sin Proveedor" : "Desconocido");
    };

    // 4. PieChart: Stock agrupado por proveedor (Lógica FIFO basada en ALL movements)
    const renderStockPorProveedor = () => {
        if (!allMovements.length) return renderEmpty();

        const providerStock = {};
        const movementsByItem = {};
        
        // Orden cronológico (FIFO)
        const ascendingMovements = [...allMovements].sort((a, b) => new Date(a.date) - new Date(b.date));

        ascendingMovements.forEach(mov => {
            if (!movementsByItem[mov.itemId]) movementsByItem[mov.itemId] = [];
            movementsByItem[mov.itemId].push(mov);
        });

        Object.keys(movementsByItem).forEach(itemId => {
            const itemMovs = movementsByItem[itemId];
            const stockQueue = [];

            itemMovs.forEach(mov => {
                if (mov.quantity > 0) {
                    stockQueue.push({ providerId: mov.providerId || "Sin_Proveedor", quantity: mov.quantity });
                } else if (mov.quantity < 0) {
                    let remainingToDeduct = Math.abs(mov.quantity);
                    while (remainingToDeduct > 0 && stockQueue.length > 0) {
                        const oldest = stockQueue[0];
                        if (oldest.quantity <= remainingToDeduct) {
                            remainingToDeduct -= oldest.quantity;
                            stockQueue.shift();
                        } else {
                            oldest.quantity -= remainingToDeduct;
                            remainingToDeduct = 0;
                        }
                    }
                }
            });

            stockQueue.forEach(batch => {
                const pid = batch.providerId;
                providerStock[pid] = (providerStock[pid] || 0) + batch.quantity;
            });
        });

        const data = Object.entries(providerStock)
            .map(([id, value]) => ({ name: getProviderName(id), value }))
            .filter(d => d.value > 0)
            .sort((a, b) => b.value - a.value);

        if (!data.length) return renderEmpty("No hay stock disponible");

        return (
            <ResponsiveContainer width="100%" height="100%">
                <PieChart margin={{ top: 10, right: 20, left: 20, bottom: 10 }}>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={renderCustomizedLabel}
                        outerRadius={120}
                        innerRadius={50}
                        fill="#8884d8"
                        dataKey="value"
                        animationDuration={1500}
                        stroke="none"
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip content={<CustomPieTooltip />} />
                    <Legend iconType="circle" layout="horizontal" verticalAlign="bottom" wrapperStyle={{ paddingTop: '10px' }} formatter={(value) => <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 tracking-tight truncate max-w-[120px] inline-flex align-bottom mr-2">{value}</span>} />
                </PieChart>
            </ResponsiveContainer>
        );
    };

    // 5. PieChart: Gasto por proveedor dentro del rango de fecha seleccionado (movements prop)
    const renderGastoPorProveedor = () => {
        if (!movements.length) return renderEmpty();

        const map = {};
        movements.forEach(mov => {
            if (mov.type === "Entrada" || mov.type === "Devolucion") {
                const pid = mov.providerId || "Sin_Proveedor";
                map[pid] = (map[pid] || 0) + (mov.quantity * (mov.unitPrice || 0));
            }
        });

        const data = Object.entries(map)
            .map(([id, value]) => ({ name: getProviderName(id), value, isMoney: true }))
            .filter(d => d.value > 0)
            .sort((a, b) => b.value - a.value);

        if (!data.length) return renderEmpty("No hay gastos registrados en este periodo");

        return (
            <ResponsiveContainer width="100%" height="100%">
                <PieChart margin={{ top: 10, right: 20, left: 20, bottom: 10 }}>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={renderCustomizedLabel}
                        outerRadius={120}
                        innerRadius={50}
                        fill="#8884d8"
                        dataKey="value"
                        animationDuration={1500}
                        stroke="none"
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip content={<CustomPieTooltip />} />
                    <Legend iconType="circle" layout="horizontal" verticalAlign="bottom" wrapperStyle={{ paddingTop: '10px' }} formatter={(value) => <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 tracking-tight truncate max-w-[120px] inline-flex align-bottom mr-2">{value}</span>} />
                </PieChart>
            </ResponsiveContainer>
        );
    };

    const renderEmpty = (message = "No hay datos en este periodo para graficar") => (
        <div className="h-full flex items-center justify-center bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
            <p className="text-slate-500 dark:text-slate-400 font-medium">{message}</p>
        </div>
    );

    const renderChart = () => {
        switch (chartType) {
            case "Entradas vs Salidas":
                return renderEntradasVsSalidas();
            case "Stock por Categoría":
                return renderStockPorCategoria();
            case "Stock por Proveedor":
                return renderStockPorProveedor();
            case "Gasto por Proveedor":
                return renderGastoPorProveedor();
            case "Movimientos por Tipo":
            default:
                return renderMovimientosPorTipo();
        }
    };

    return (
        <div className="w-full h-[350px] mt-4">
            {renderChart()}
        </div>
    );
}
