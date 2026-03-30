// app/renderer/src/modules/inventory/components/MovementsTable.jsx
import React from "react";
import { Image as ImageIcon, ArrowDown, ArrowUp, XCircle, AlertTriangle, RefreshCcw } from "lucide-react";

export default function MovementsTable({ movements }) {
    if (!movements || movements.length === 0) {
        return (
            <div className="p-8 text-center text-slate-500 dark:text-slate-400 flex flex-col items-center justify-center min-h-[300px]">
                <RefreshCcw size={48} className="text-slate-300 dark:text-slate-600 mb-4 opacity-50" />
                <p className="font-medium text-lg text-slate-600 dark:text-slate-300">No hay movimientos registrados</p>
                <p className="text-sm mt-1">Ajusta el stock de un artículo para ver movimientos en el periodo seleccionado.</p>
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

    const getTypeConfig = (type) => {
        switch(type) {
            case "Entrada": return { bg: "bg-green-100 dark:bg-green-900/30", text: "text-green-700 dark:text-green-400", icon: <ArrowUp size={14} /> };
            case "Salida": return { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-400", icon: <ArrowDown size={14} /> };
            case "Merma": return { bg: "bg-orange-100 dark:bg-orange-900/30", text: "text-orange-700 dark:text-orange-400", icon: <AlertTriangle size={14} /> };
            case "Devolucion": return { bg: "bg-purple-100 dark:bg-purple-900/30", text: "text-purple-700 dark:text-purple-400", icon: <RefreshCcw size={14} /> };
            case "Caducado": return { bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-700 dark:text-red-400", icon: <XCircle size={14} /> };
            default: return { bg: "bg-slate-100 dark:bg-slate-800", text: "text-slate-700 dark:text-slate-300", icon: null };
        }
    };

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        <th className="px-5 py-4 font-semibold w-16 text-center">Img</th>
                        <th className="px-5 py-4 font-semibold">Producto</th>
                        <th className="px-5 py-4 font-semibold">Tipo</th>
                        <th className="px-5 py-4 font-semibold">Cantidad</th>
                        <th className="px-5 py-4 font-semibold">Precio Unit.</th>
                        <th className="px-5 py-4 font-semibold">Fecha/Hora</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                    {movements.map(mov => {
                        const typeConfig = getTypeConfig(mov.type);

                        return (
                            <tr key={mov.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                                <td className="px-5 py-3">
                                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto border border-slate-200 dark:border-slate-700">
                                        {mov.itemImage ? (
                                            <img src={mov.itemImage} alt={mov.itemName} className="w-full h-full object-cover" />
                                        ) : (
                                            <ImageIcon size={18} className="text-slate-400" />
                                        )}
                                    </div>
                                </td>
                                <td className="px-5 py-3">
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold text-cyan-600 dark:text-cyan-400 font-mono tracking-tight">{mov.itemSku || "N/A"}</span>
                                        <span className="text-sm text-slate-900 dark:text-slate-100 font-bold leading-tight mt-0.5">{mov.itemName}</span>
                                        {mov.reference && (
                                            <span className="text-[11px] text-slate-500 line-clamp-1 mt-0.5" title={mov.reference}>Ref: {mov.reference}</span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-5 py-3">
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold ${typeConfig.bg} ${typeConfig.text}`}>
                                        {typeConfig.icon}
                                        {mov.type}
                                    </span>
                                </td>
                                <td className="px-5 py-3">
                                    <span className={`font-bold text-base ${mov.quantity > 0 ? 'text-green-600 dark:text-green-400' : mov.quantity < 0 ? 'text-red-500' : 'text-slate-900 dark:text-slate-100'}`}>
                                        {mov.quantity > 0 ? `+${mov.quantity}` : mov.quantity}
                                    </span>
                                </td>
                                <td className="px-5 py-3 font-medium text-slate-700 dark:text-slate-300">
                                    ${mov.unitPrice?.toFixed(2) || "0.00"}
                                </td>
                                <td className="px-5 py-3 text-sm text-slate-600 dark:text-slate-400 whitespace-nowrap">
                                    {formatDate(mov.date)}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
