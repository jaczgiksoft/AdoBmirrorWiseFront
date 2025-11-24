import { Pencil, Trash2, ShieldAlert } from "lucide-react";

export default function PatientAlertList({ alerts, onEdit, onDelete }) {
    return (
        <div>
            {alerts.length === 0 && (
                <div className="text-xs text-slate-500 dark:text-slate-400">
                    No hay alertas registradas.
                </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-2">
                {alerts.map((a, i) => {
                    const isAdmin = a.is_admin_alert;

                    return (
                        <div
                            key={i}
                            className={`
                                relative p-4 rounded-xl border shadow-sm transition
                                ${isAdmin
                                ? "border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-400/50"
                                : "border-red-500 bg-red-50 dark:bg-red-900/20 dark:border-red-400/50"
                            }
                            `}
                        >

                            {/* ICONO ADMIN (izquierda arriba) */}
                            {isAdmin && (
                                <div className="absolute left-3 top-3 group">
                                    <ShieldAlert className="text-yellow-600 dark:text-yellow-400" size={20} />

                                    {/* Tooltip */}
                                    <div
                                        className="
                                            absolute -top-10 left-1/2 -translate-x-1/2
                                            opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100
                                            transition-all duration-200 pointer-events-none
                                            bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900
                                            text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap
                                        "
                                    >
                                        Administrativa

                                        {/* Flechita */}
                                        <div className="
                                            absolute left-1/2 top-full -translate-x-1/2 w-0 h-0
                                            border-l-4 border-r-4 border-t-4 border-transparent
                                            border-t-slate-900 dark:border-t-slate-100
                                        "></div>
                                    </div>
                                </div>
                            )}

                            {/* ACCIONES (derecha arriba) */}
                            <div className="absolute right-3 top-3 flex gap-2">
                                <button
                                    onClick={() => onEdit(i)}
                                    className="
                                        p-1 rounded cursor-pointer
                                        bg-slate-200 hover:bg-slate-300
                                        dark:bg-slate-700 dark:hover:bg-slate-600
                                        text-blue-600 dark:text-blue-300
                                    "
                                >
                                    <Pencil size={14} />
                                </button>

                                <button
                                    onClick={() => onDelete(i)}
                                    className="
                                        p-1 rounded cursor-pointer
                                        bg-slate-200 hover:bg-slate-300
                                        dark:bg-slate-700 dark:hover:bg-slate-600
                                        text-red-600 dark:text-red-300
                                    "
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>

                            {/* CONTENIDO */}
                            <div className="mt-8">
                                <div
                                    className={`
                                        text-sm font-semibold 
                                        ${isAdmin
                                        ? "text-yellow-700 dark:text-yellow-300"
                                        : "text-red-700 dark:text-red-300"
                                    }
                                    `}
                                >
                                    {a.title}
                                </div>

                                {a.description && (
                                    <div className="text-xs text-slate-600 dark:text-slate-400 mt-1 whitespace-pre-line">
                                        {a.description}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
