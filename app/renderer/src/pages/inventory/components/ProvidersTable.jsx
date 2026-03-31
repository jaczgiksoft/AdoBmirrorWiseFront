// app/renderer/src/modules/inventory/components/ProvidersTable.jsx
import React from "react";
import { Edit2, Trash2 } from "lucide-react";

export default function ProvidersTable({ providers, onEdit, onDelete }) {
    if (!providers || providers.length === 0) {
        return (
            <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                <p>No hay proveedores registrados para mostrar.</p>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        <th className="px-5 py-4 font-semibold">Proveedor</th>
                        <th className="px-5 py-4 font-semibold">Contacto</th>
                        <th className="px-5 py-4 font-semibold">Teléfono / Correo</th>
                        <th className="px-5 py-4 font-semibold">RFC</th>
                        <th className="px-5 py-4 font-semibold text-right">Acciones</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                    {providers.map(provider => (
                        <tr key={provider.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                            <td className="px-5 py-3">
                                <div className="flex flex-col">
                                    <span className="text-sm text-slate-900 dark:text-slate-100 font-bold leading-tight">{provider.name}</span>
                                    {provider.notes && (
                                        <span className="text-[11px] text-slate-500 line-clamp-1 mt-0.5" title={provider.notes}>{provider.notes}</span>
                                    )}
                                </div>
                            </td>
                            <td className="px-5 py-3">
                                <span className="text-sm text-slate-700 dark:text-slate-300">{provider.contactName || "-"}</span>
                            </td>
                            <td className="px-5 py-3">
                                <div className="flex flex-col">
                                    <span className="text-sm text-slate-700 dark:text-slate-300 font-medium">{provider.phone || "-"}</span>
                                    <span className="text-xs text-slate-500">{provider.email || "-"}</span>
                                </div>
                            </td>
                            <td className="px-5 py-3">
                                <span className="font-mono text-sm text-slate-600 dark:text-slate-400">{provider.rfc || "-"}</span>
                            </td>
                            <td className="px-5 py-3 text-right">
                                <div className="flex items-center justify-end gap-1">
                                    <button 
                                        onClick={() => onEdit(provider)}
                                        className="p-2 text-cyan-600 hover:bg-cyan-50 dark:hover:bg-cyan-500/10 rounded-lg transition"
                                        title="Editar Proveedor"
                                    >
                                        <Edit2 size={18} />
                                    </button>
                                    <button 
                                        onClick={() => onDelete(provider)}
                                        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition"
                                        title="Eliminar Proveedor"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
