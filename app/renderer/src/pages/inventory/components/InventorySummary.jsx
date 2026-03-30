// app/renderer/src/modules/inventory/components/InventorySummary.jsx
import React, { useMemo } from "react";
import { ShoppingCart, AlertTriangle, TrendingUp, DollarSign, Activity, PieChart } from "lucide-react";

export default function InventorySummary({ items, movements }) {
    
    // Gasto en compras (mes actual)
    const currentMonthExpenses = useMemo(() => {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        return movements
            .filter(mov => {
                const date = new Date(mov.date);
                return mov.type === "Entrada" && date.getMonth() === currentMonth && date.getFullYear() === currentYear;
            })
            .reduce((sum, mov) => sum + (mov.quantity * mov.unitPrice), 0);
    }, [movements]);

    // Productos bajo stock mínimo
    const lowStockItems = useMemo(() => {
        return items.filter(item => item.min_stock !== null && item.quantity <= item.min_stock).length;
    }, [items]);

    // Productos más utilizados (mayores Salidas/Mermas en cantidad)
    const topUsedItems = useMemo(() => {
        const usageMap = {};
        movements.forEach(mov => {
            if (mov.type === "Salida" || mov.type === "Merma") {
                usageMap[mov.itemName] = (usageMap[mov.itemName] || 0) + Math.abs(mov.quantity);
            }
        });
        
        return Object.entries(usageMap)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 4)
            .map(([name, qty]) => ({ name, qty }));
    }, [movements]);

    // Movimientos por tipo
    const movementsByType = useMemo(() => {
        const map = {};
        movements.forEach(mov => {
            map[mov.type] = (map[mov.type] || 0) + 1; // Contamos cantidad de transacciones
        });
        return map;
    }, [movements]);

    // Stock por categoría
    const stockByCategory = useMemo(() => {
        const map = {};
        items.forEach(item => {
            map[item.category] = (map[item.category] || 0) + item.quantity;
        });
        return map;
    }, [items]);

    // Costo promedio por categoría
    const avgCostByCategory = useMemo(() => {
        const map = {};
        const countMap = {};
        items.forEach(item => {
            if (item.purchasePrice > 0) {
                map[item.category] = (map[item.category] || 0) + item.purchasePrice;
                countMap[item.category] = (countMap[item.category] || 0) + 1;
            }
        });
        
        const avgMap = {};
        Object.keys(map).forEach(cat => {
            avgMap[cat] = map[cat] / countMap[cat];
        });
        return avgMap;
    }, [items]);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                
                {/* Gasto Mes */}
                <div className="bg-white dark:bg-secondary border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-soft hover:shadow-lg transition">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Gasto en Compras (Mes)</p>
                            <h4 className="text-3xl font-black text-slate-900 dark:text-white">${currentMonthExpenses.toFixed(2)}</h4>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 flex items-center justify-center">
                            <DollarSign size={24} />
                        </div>
                    </div>
                </div>

                {/* Bajo Stock */}
                <div className="bg-white dark:bg-secondary border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-soft hover:shadow-lg transition">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Bajo Stock Mínimo</p>
                            <h4 className="text-3xl font-black text-slate-900 dark:text-white">{lowStockItems}</h4>
                            <p className="text-xs text-slate-400 mt-1">Artículos requieren atención</p>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 flex items-center justify-center">
                            <AlertTriangle size={24} />
                        </div>
                    </div>
                </div>

                {/* Movimientos */}
                <div className="bg-white dark:bg-secondary border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-soft hover:shadow-lg transition">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Total Movimientos</p>
                            <h4 className="text-3xl font-black text-slate-900 dark:text-white">{movements.length}</h4>
                            <p className="text-xs text-slate-400 mt-1">En el historial</p>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                            <Activity size={24} />
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Productos Más utilizados */}
                <div className="bg-white dark:bg-secondary border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-soft">
                    <div className="flex items-center gap-2 mb-6 text-slate-800 dark:text-slate-100">
                        <TrendingUp size={20} className="text-cyan-500" />
                        <h4 className="font-bold">Artículos con Mayor Salida</h4>
                    </div>
                    {topUsedItems.length > 0 ? (
                        <div className="space-y-4">
                            {topUsedItems.map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{item.name}</span>
                                    <span className="text-sm font-bold text-cyan-600 dark:text-cyan-400">{item.qty} u.</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-slate-500 text-center py-4">No hay datos suficientes</p>
                    )}
                </div>

                {/* Stock por Categoría */}
                <div className="bg-white dark:bg-secondary border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-soft">
                    <div className="flex items-center gap-2 mb-6 text-slate-800 dark:text-slate-100">
                        <PieChart size={20} className="text-purple-500" />
                        <h4 className="font-bold">Stock por Categoría</h4>
                    </div>
                    <div className="space-y-4">
                        {Object.entries(stockByCategory).map(([cat, qty], idx) => (
                            <div key={idx} className="flex items-center justify-between">
                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{cat}</span>
                                <span className="text-sm font-bold text-purple-600 dark:text-purple-400">{qty} u.</span>
                            </div>
                        ))}
                        {Object.keys(stockByCategory).length === 0 && (
                            <p className="text-sm text-slate-500 text-center py-4">No hay datos</p>
                        )}
                    </div>
                </div>

                {/* Movimientos por Tipo */}
                <div className="bg-white dark:bg-secondary border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-soft">
                    <div className="flex items-center gap-2 mb-6 text-slate-800 dark:text-slate-100">
                        <Activity size={20} className="text-blue-500" />
                        <h4 className="font-bold">Tipos de Movimiento (Transacciones)</h4>
                    </div>
                    <div className="space-y-4">
                        {Object.entries(movementsByType).map(([type, qty], idx) => (
                            <div key={idx} className="flex items-center justify-between">
                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{type}</span>
                                <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{qty} transacciones</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Costo Promedio por Categoría */}
                <div className="bg-white dark:bg-secondary border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-soft">
                    <div className="flex items-center gap-2 mb-6 text-slate-800 dark:text-slate-100">
                        <ShoppingCart size={20} className="text-emerald-500" />
                        <h4 className="font-bold">Costo Promedio Unitario por Categoría</h4>
                    </div>
                    <div className="space-y-4">
                        {Object.entries(avgCostByCategory).map(([cat, cost], idx) => (
                            <div key={idx} className="flex items-center justify-between">
                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{cat}</span>
                                <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">${cost.toFixed(2)}</span>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
}
