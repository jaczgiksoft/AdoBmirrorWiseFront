import { Pencil, Trash2, Star } from "lucide-react";

export default function PatientBillingDataList({ list, onEdit, onDelete }) {
    return (
        <div>
            {list.length === 0 && (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                    No hay datos fiscales registrados.
                </p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-3">
                {list.map((item, i) => (
                    <div
                        key={item.temp_id}
                        className="
                            relative p-4 rounded-xl
                            border border-slate-300 dark:border-slate-700
                            bg-slate-100 dark:bg-slate-800/40
                            shadow-sm
                        "
                    >
                        {/* Acciones */}
                        <div className="absolute right-3 top-3 flex gap-2">
                            <button
                                onClick={() => onEdit(i)}
                                className="
                                    p-1 rounded bg-slate-200 hover:bg-slate-300
                                    dark:bg-slate-700 dark:hover:bg-slate-600
                                    text-blue-600 dark:text-blue-300
                                "
                            >
                                <Pencil size={14} />
                            </button>

                            <button
                                onClick={() => onDelete(i)}
                                className="
                                    p-1 rounded bg-slate-200 hover:bg-slate-300
                                    dark:bg-slate-700 dark:hover:bg-slate-600
                                    text-red-600 dark:text-red-300
                                "
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>

                        {/* Contenido */}
                        <div className="mt-6">

                            {item.is_primary && (
                                <div className="flex items-center gap-1 text-xs text-primary mb-2">
                                    <Star size={14} />
                                    Principal
                                </div>
                            )}

                            <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                                {item.business_name}
                            </div>

                            <div className="text-xs text-slate-600 dark:text-slate-400">
                                RFC: {item.rfc}
                            </div>

                            <div className="text-xs text-slate-600 dark:text-slate-400">
                                Régimen: {item.tax_regime}
                            </div>

                            <div className="text-xs text-slate-600 dark:text-slate-400">
                                CP: {item.zip_code}
                            </div>

                            {item.email && (
                                <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                                    ✉️ {item.email}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
