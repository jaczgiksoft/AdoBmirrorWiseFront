import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle } from "lucide-react";

export default function PatientAlertsModal({
                                               open,
                                               onClose,
                                               clinicalAlerts = [],
                                               adminAlerts = [],
                                           }) {
    const [showAdmin, setShowAdmin] = useState(false);

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999]"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    <motion.div
                        className="
                            bg-white dark:bg-secondary rounded-2xl shadow-2xl
                            w-full max-w-lg p-6 border border-slate-200 dark:border-slate-700
                        "
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                    >
                        <div className="flex items-center justify-center mb-4">
                            <h2 className="text-xl font-semibold text-red-600 dark:text-red-400 flex items-center gap-2">
                                <AlertTriangle size={22} />
                                Alertas del paciente
                            </h2>
                        </div>

                        {/* Mensaje */}
                        <p className="text-slate-700 dark:text-slate-300 mb-4 text-sm text-center">
                            Este paciente tiene alertas importantes registradas.
                            Debes confirmar que estás enterado antes de continuar.
                        </p>

                        {/* Alerts List */}
                        <div className="space-y-6 max-h-60 overflow-y-auto pr-2">

                            {/* Clínicas */}
                            {clinicalAlerts.length > 0 && (
                                <div>
                                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-2">
                                        Alertas clínicas
                                    </h3>

                                    <div className="grid grid-cols-2 gap-3">
                                        {clinicalAlerts.map(alert => (
                                            <div
                                                key={alert.id}
                                                className="
                                                    bg-red-50 dark:bg-red-900/30 p-3 rounded-lg
                                                    border border-red-200 dark:border-red-800 text-sm
                                                "
                                            >
                                                <p className="font-semibold text-red-700 dark:text-red-300">
                                                    {alert.title}
                                                </p>
                                                <p className="text-slate-700 dark:text-slate-300 text-xs mt-1">
                                                    {alert.description}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Administrativas */}
                            {showAdmin && adminAlerts.length > 0 && (
                                <div>
                                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-2">
                                        Alertas administrativas
                                    </h3>

                                    <div className="grid grid-cols-2 gap-3">
                                        {adminAlerts.map(alert => (
                                            <div
                                                key={alert.id}
                                                className="
                                                    bg-yellow-50 dark:bg-yellow-900/30 p-3 rounded-lg
                                                    border border-yellow-200 dark:border-yellow-800 text-sm
                                                "
                                            >
                                                <p className="font-semibold text-yellow-700 dark:text-yellow-300">
                                                    {alert.title}
                                                </p>
                                                <p className="text-slate-700 dark:text-slate-300 text-xs mt-1">
                                                    {alert.description}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Switch para alertas admin */}
                        <div className="flex items-center justify-between mt-6 mb-6">
                            <span className="text-sm text-slate-700 dark:text-slate-300">
                                Mostrar alertas administrativas
                            </span>

                            {/* Switch */}
                            <button
                                onClick={() => setShowAdmin(s => !s)}
                                className={`
                                    relative inline-flex h-6 w-11 items-center rounded-full transition
                                    ${showAdmin ? "bg-yellow-500/60" : "bg-slate-400 dark:bg-slate-600"}
                                `}
                            >
                                <span
                                    className={`
                                        inline-block h-5 w-5 transform rounded-full bg-white transition
                                        ${showAdmin ? "translate-x-5" : "translate-x-1"}
                                    `}
                                />
                            </button>
                        </div>

                        {/* Confirm button */}
                        <button
                            onClick={onClose}
                            className="
                                w-full bg-red-600 hover:bg-red-700 text-white
                                py-2 rounded-xl font-medium shadow-lg transition
                            "
                        >
                            Estoy enterado
                        </button>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
