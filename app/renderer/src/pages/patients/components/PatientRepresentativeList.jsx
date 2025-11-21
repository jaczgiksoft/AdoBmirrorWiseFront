import { Pencil, Trash2, BadgeCheck, User } from "lucide-react";

export default function PatientRepresentativeList({ reps, onEdit, onDelete }) {
    return (
        <div>
            {reps.length === 0 && (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                    No hay representantes agregados.
                </p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-3">
                {reps.map((rep, i) => (
                    <div
                        key={rep.temp_id || i}
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
                            <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                                {rep.full_name}
                            </div>

                            {rep.relationship && (
                                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                    {rep.relationship}
                                </div>
                            )}

                            {rep.phone && (
                                <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                                    📞 {rep.phone}
                                </div>
                            )}

                            {rep.email && (
                                <div className="text-xs text-slate-600 dark:text-slate-400">
                                    ✉️ {rep.email}
                                </div>
                            )}

                            {rep.can_login && (
                                <div className="mt-2 flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                                    <BadgeCheck size={14} />
                                    Acceso habilitado
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
