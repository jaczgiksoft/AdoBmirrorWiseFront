// app/renderer/src/modules/inventory/components/InventoryTable.jsx
import React from "react";
import { Edit2, Diff, Trash2, AlertCircle } from "lucide-react";

export default function InventoryTable({ items, onEdit, onAdjust, onDelete }) {
    if (!items || items.length === 0) {
        return (
            <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                <p>No hay artículos en el inventario para mostrar.</p>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 text-sm uppercase text-slate-500 dark:text-slate-400">
                        <th className="px-6 py-4 font-semibold">Nombre</th>
                        <th className="px-6 py-4 font-semibold">Categoría</th>
                        <th className="px-6 py-4 font-semibold">Existencia</th>
                        <th className="px-6 py-4 font-semibold">Unidad</th>
                        <th className="px-6 py-4 font-semibold text-right">Acciones</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                    {items.map(item => {
                        const isLowStock = item.min_stock !== null && item.quantity <= item.min_stock;

                        return (
                            <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                                <td className="px-6 py-4 text-slate-900 dark:text-slate-100 font-medium">
                                    {item.name}
                                    {item.notes && (
                                        <p className="text-xs text-slate-500 italic mt-1">{item.notes}</p>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                                    <span className="bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded text-xs">
                                        {item.category}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <span className={`font-semibold text-lg ${isLowStock ? 'text-red-500' : 'text-slate-900 dark:text-slate-100'}`}>
                                            {item.quantity}
                                        </span>
                                        {isLowStock && (
                                            <div className="w-2 h-2 rounded-full bg-red-500 shadow-sm shadow-red-500/50" title={`Bajo stock (mínimo ${item.min_stock})`} />
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                                    {item.unit}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <button 
                                            onClick={() => onAdjust(item)}
                                            className="p-3 text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg transition"
                                            title="Ajustar Stock"
                                        >
                                            <Diff size={18} />
                                        </button>
                                        <button 
                                            onClick={() => onEdit(item)}
                                            className="p-3 text-cyan-600 hover:bg-cyan-50 dark:hover:bg-cyan-500/10 rounded-lg transition"
                                            title="Editar Artículo"
                                        >
                                            <Edit2 size={18} />
                                        </button>
                                        <button 
                                            onClick={() => onDelete(item)}
                                            className="p-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition"
                                            title="Eliminar"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
