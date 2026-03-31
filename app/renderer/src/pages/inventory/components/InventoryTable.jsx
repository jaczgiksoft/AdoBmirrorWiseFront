// app/renderer/src/modules/inventory/components/InventoryTable.jsx
import React from "react";
import { Edit2, Diff, Trash2, Image as ImageIcon } from "lucide-react";

export default function InventoryTable({ items, onEdit, onAdjust, onDelete }) {
    if (!items || items.length === 0) {
        return (
            <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                <p>No hay artículos en el inventario para mostrar.</p>
            </div>
        );
    }

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        return new Date(dateString).toLocaleDateString("es-MX", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    };

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        <th className="px-5 py-4 font-semibold w-16 text-center">Img</th>
                        <th className="px-5 py-4 font-semibold">Producto</th>
                        <th className="px-5 py-4 font-semibold">Unidad</th>
                        <th className="px-5 py-4 font-semibold">Categoría</th>
                        <th className="px-5 py-4 font-semibold">Stock</th>
                        <th className="px-5 py-4 font-semibold">Última Act.</th>
                        <th className="px-5 py-4 font-semibold text-right">Acciones</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                    {items.map(item => {
                        const isLowStock = item.min_stock !== null && item.quantity <= item.min_stock;

                        return (
                            <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                                <td className="px-5 py-3">
                                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto border border-slate-200 dark:border-slate-700">
                                        {item.image ? (
                                            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <ImageIcon size={18} className="text-slate-400" />
                                        )}
                                    </div>
                                </td>
                                <td className="px-5 py-3">
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold text-cyan-600 dark:text-cyan-400 font-mono tracking-tight">{item.sku || "N/A"}</span>
                                        <span className="text-sm text-slate-900 dark:text-slate-100 font-bold leading-tight mt-0.5">{item.name}</span>
                                        {item.description && (
                                            <span className="text-[11px] text-slate-500 line-clamp-1 mt-0.5" title={item.description}>{item.description}</span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-5 py-3 text-sm text-slate-600 dark:text-slate-300">
                                    {item.unit}
                                </td>
                                <td className="px-5 py-3">
                                    <span className="bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-2 py-1 rounded text-xs font-medium">
                                        {item.category}
                                    </span>
                                </td>
                                <td className="px-5 py-3">
                                    <div className="flex items-center gap-2">
                                        <span className={`font-bold text-base ${isLowStock ? 'text-red-500' : 'text-slate-900 dark:text-slate-100'}`}>
                                            {item.quantity}
                                        </span>
                                        {isLowStock && (
                                            <div className="w-2 h-2 rounded-full bg-red-500 shadow-sm shadow-red-500/50" title={`Bajo stock (mínimo ${item.min_stock})`} />
                                        )}
                                    </div>
                                </td>
                                <td className="px-5 py-3 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                                    {formatDate(item.lastUpdate)}
                                </td>
                                <td className="px-5 py-3 text-right">
                                    <div className="flex items-center justify-end gap-1">
                                        <button 
                                            onClick={() => onAdjust(item)}
                                            className="p-2 text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg transition"
                                            title="Ajustar Stock"
                                        >
                                            <Diff size={18} />
                                        </button>
                                        <button 
                                            onClick={() => onEdit(item)}
                                            className="p-2 text-cyan-600 hover:bg-cyan-50 dark:hover:bg-cyan-500/10 rounded-lg transition"
                                            title="Editar Artículo"
                                        >
                                            <Edit2 size={18} />
                                        </button>
                                        <button 
                                            onClick={() => onDelete(item)}
                                            className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition"
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
