// app/renderer/src/modules/inventory/components/InventorySummary.jsx
import React, { useMemo } from "react";
import { ShoppingCart, AlertTriangle, TrendingUp, DollarSign, Activity, PieChart, Users, PackageOpen, CreditCard } from "lucide-react";

export default function InventorySummary({ items, movements, allMovements = [], providers = [] }) {

    // Gasto en compras (en el periodo de movements)
    const periodExpenses = useMemo(() => {
        return movements
            .filter(mov => mov.type === "Entrada" || mov.type === "Devolucion")
            .reduce((sum, mov) => sum + (mov.quantity * mov.unitPrice), 0);
    }, [movements]);

    // Productos bajo stock mínimo (Lista completa)
    const lowStockList = useMemo(() => {
        return items.filter(item => item.min_stock !== null && item.quantity <= item.min_stock);
    }, [items]);

    const lowStockCount = lowStockList.length;

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

    // Productos por proveedor
    const productsByProvider = useMemo(() => {
        const map = {};
        items.forEach(item => {
            if (item.providerId) {
                map[item.providerId] = (map[item.providerId] || 0) + 1;
            }
        });
        return map;
    }, [items]);

    // Stock por proveedor (FIFO: primeras entradas, primeras salidas)
    const stockByProvider = useMemo(() => {
        const providerStock = {};

        // 1. Agrupar movimientos por artículo, ordenados desde el más antiguo al más reciente
        const movementsByItem = {};
        // allMovements viene del hook ordenado de más reciente a más antiguo, lo invertimos para FIFO
        const ascendingMovements = [...allMovements].sort((a, b) => new Date(a.date) - new Date(b.date));

        ascendingMovements.forEach(mov => {
            if (!movementsByItem[mov.itemId]) {
                movementsByItem[mov.itemId] = [];
            }
            movementsByItem[mov.itemId].push(mov);
        });

        // 2. Procesar las colas FIFO por cada artículo
        Object.keys(movementsByItem).forEach(itemId => {
            const itemMovs = movementsByItem[itemId];
            const stockQueue = []; // { providerId, quantity }

            itemMovs.forEach(mov => {
                if (mov.quantity > 0) {
                    // Entrada o Devolución suman a la cola
                    stockQueue.push({
                        providerId: mov.providerId || "Sin_Proveedor",
                        quantity: mov.quantity
                    });
                } else if (mov.quantity < 0) {
                    // Salida, Merma, Caducado restan de las entradas más antiguas (FIFO)
                    let remainingToDeduct = Math.abs(mov.quantity);

                    while (remainingToDeduct > 0 && stockQueue.length > 0) {
                        const oldest = stockQueue[0];
                        if (oldest.quantity <= remainingToDeduct) {
                            // Se consume todo este lote
                            remainingToDeduct -= oldest.quantity;
                            stockQueue.shift();
                        } else {
                            // Se consume solo una parte de este lote
                            oldest.quantity -= remainingToDeduct;
                            remainingToDeduct = 0;
                        }
                    }
                }
            });

            // 3. Sumar el stock remanente en la cola al proveedor correspondiente
            stockQueue.forEach(batch => {
                const pid = batch.providerId;
                if (pid && pid !== "Sin_Proveedor") {
                    providerStock[pid] = (providerStock[pid] || 0) + batch.quantity;
                }
            });
        });

        return providerStock;
    }, [allMovements]);

    // Gasto por proveedor (en el periodo de movements)
    const expensesByProviderPeriod = useMemo(() => {
        const map = {};

        movements.forEach(mov => {
            if ((mov.type === "Entrada" || mov.type === "Devolucion") && mov.providerId) {
                map[mov.providerId] = (map[mov.providerId] || 0) + (mov.quantity * (mov.unitPrice || 0));
            }
        });
        return map;
    }, [movements]);

    // Helper to get provider name
    const getProviderName = (id) => {
        const p = providers.find(prov => String(prov.id) === String(id));
        return p ? p.name : "Desconocido";
    };

    // Proveedor más costoso (Gasto del periodo) - NEW
    const mostExpensiveProvider = useMemo(() => {
        const entries = Object.entries(expensesByProviderPeriod);
        if (entries.length === 0) return null;
        const [id, amount] = [...entries].sort((a, b) => b[1] - a[1])[0];
        return { id, name: getProviderName(id), amount };
    }, [expensesByProviderPeriod, providers]);

    // Proveedor con más productos (Stock total) - NEW
    const mostProductProvider = useMemo(() => {
        const entries = Object.entries(stockByProvider);
        if (entries.length === 0) return null;
        const [id, qty] = [...entries].sort((a, b) => b[1] - a[1])[0];
        return { id, name: getProviderName(id), qty };
    }, [stockByProvider, providers]);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* Gasto Periodo */}
                <div className="bg-white dark:bg-secondary border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-soft hover:shadow-lg transition">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Gasto en Compras</p>
                            <h4 className="text-3xl font-black text-slate-900 dark:text-white">${periodExpenses.toFixed(2)}</h4>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 flex items-center justify-center">
                            <DollarSign size={24} />
                        </div>
                    </div>
                </div>

                {/* Proveedor más costoso (Periodo) - NEW */}
                <div className="bg-white dark:bg-secondary border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-soft hover:shadow-lg transition">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Proveedor más costoso</p>
                            <h4 className="text-xl font-black text-slate-900 dark:text-white truncate max-w-[140px]">
                                {mostExpensiveProvider ? mostExpensiveProvider.name : "N/A"}
                            </h4>
                            <p className="text-lg font-bold text-rose-500 mt-1">
                                {mostExpensiveProvider ? `$${mostExpensiveProvider.amount.toFixed(2)}` : "$0.00"}
                            </p>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                            <CreditCard size={24} />
                        </div>
                    </div>
                </div>

                {/* Proveedor con más unidades - NEW */}
                <div className="bg-white dark:bg-secondary border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-soft hover:shadow-lg transition">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Mayor Stock por Proveedor</p>
                            <h4 className="text-xl font-black text-slate-900 dark:text-white truncate max-w-[140px]">
                                {mostProductProvider ? mostProductProvider.name : "N/A"}
                            </h4>
                            <p className="text-lg font-bold text-pink-500 mt-1">
                                {mostProductProvider ? `${mostProductProvider.qty} u.` : "0 u."}
                            </p>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 flex items-center justify-center">
                            <PackageOpen size={24} />
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Bajo Stock */}
                <div className="bg-white dark:bg-secondary border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-soft hover:shadow-lg transition flex flex-col min-h-[250px]">
                    <div className="flex items-start justify-between mb-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                        <div>
                            <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Bajo Stock Mínimo</p>
                            <h4 className="text-2xl font-black text-red-500 dark:text-red-400">{lowStockCount}</h4>
                        </div>
                        <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 flex items-center justify-center">
                            <AlertTriangle size={22} />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar max-h-[160px]">
                        {lowStockCount > 0 ? (
                            <table className="w-full text-left">
                                <thead className="sticky top-0 bg-white dark:bg-secondary">
                                    <tr className="text-[10px] uppercase font-bold text-slate-400 tracking-tighter">
                                        <th className="pb-2">Producto</th>
                                        <th className="pb-2 text-center">Actual</th>
                                        <th className="pb-2 text-right">Mínimo</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {lowStockList.map((item, idx) => (
                                        <tr key={idx} className="text-xs">
                                            <td className="py-2 pr-2 font-medium text-slate-700 dark:text-slate-200 line-clamp-1">{item.name}</td>
                                            <td className="py-2 text-center font-bold text-red-500">{item.quantity}</td>
                                            <td className="py-2 text-right text-slate-500">{item.min_stock}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="h-full flex flex-row items-center justify-center gap-2 opacity-40">
                                <span className="text-xs font-medium text-slate-500">Todo el stock está correcto</span>
                            </div>
                        )}
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

                {/* Productos por Proveedor */}
                <div className="bg-white dark:bg-secondary border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-soft">
                    <div className="flex items-center gap-2 mb-6 text-slate-800 dark:text-slate-100">
                        <Users size={20} className="text-amber-500" />
                        <h4 className="font-bold">Productos por Proveedor</h4>
                    </div>
                    <div className="space-y-4">
                        {Object.entries(productsByProvider).map(([pid, count], idx) => (
                            <div key={idx} className="flex items-center justify-between">
                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{getProviderName(pid)}</span>
                                <span className="text-sm font-bold text-amber-600 dark:text-amber-400">{count} prods.</span>
                            </div>
                        ))}
                        {Object.keys(productsByProvider).length === 0 && (
                            <p className="text-sm text-slate-500 text-center py-4">No hay datos</p>
                        )}
                    </div>
                </div>

                {/* Stock por Proveedor */}
                <div className="bg-white dark:bg-secondary border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-soft">
                    <div className="flex items-center gap-2 mb-6 text-slate-800 dark:text-slate-100">
                        <PackageOpen size={20} className="text-pink-500" />
                        <h4 className="font-bold">Stock Total por Proveedor</h4>
                    </div>
                    <div className="space-y-4">
                        {Object.entries(stockByProvider).map(([pid, qty], idx) => (
                            <div key={idx} className="flex items-center justify-between">
                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{getProviderName(pid)}</span>
                                <span className="text-sm font-bold text-pink-600 dark:text-pink-400">{qty} u.</span>
                            </div>
                        ))}
                        {Object.keys(stockByProvider).length === 0 && (
                            <p className="text-sm text-slate-500 text-center py-4">No hay datos</p>
                        )}
                    </div>
                </div>

                {/* Gasto por Proveedor (Periodo) */}
                <div className="bg-white dark:bg-secondary border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-soft">
                    <div className="flex items-center gap-2 mb-6 text-slate-800 dark:text-slate-100">
                        <CreditCard size={20} className="text-rose-500" />
                        <h4 className="font-bold">Gasto por Proveedor</h4>
                    </div>
                    <div className="space-y-4">
                        {Object.entries(expensesByProviderPeriod).map(([pid, amount], idx) => (
                            <div key={idx} className="flex items-center justify-between">
                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{getProviderName(pid)}</span>
                                <span className="text-sm font-bold text-rose-600 dark:text-rose-400">${amount.toFixed(2)}</span>
                            </div>
                        ))}
                        {Object.keys(expensesByProviderPeriod).length === 0 && (
                            <p className="text-sm text-slate-500 text-center py-4">Sin compras en el periodo</p>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}
