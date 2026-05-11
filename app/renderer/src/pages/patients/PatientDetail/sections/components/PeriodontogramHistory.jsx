import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Upload, Trash2, FileX, RefreshCw } from 'lucide-react';

const LS_KEY = 'bwise_periodonto_history';

/**
 * PeriodontogramHistory
 * Lee el historial de periodontogramas guardados en localStorage,
 * filtra por patientId y permite cargar un registro previo.
 *
 * @param {string}   patientId  - ID del paciente activo.
 * @param {function} onLoad     - Callback: recibe el objeto de registro seleccionado.
 */
export default function PeriodontogramHistory({ patientId, onLoad }) {
    const [records, setRecords] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [deleteConfirm, setDeleteConfirm] = useState(null); // id a confirmar eliminación

    const loadHistory = useCallback(() => {
        setIsLoading(true);
        try {
            const raw = localStorage.getItem(LS_KEY);
            const all = raw ? JSON.parse(raw) : [];
            // Filtra solo los del paciente actual; si no hay patientId muestra todos
            const filtered = patientId
                ? all.filter(r => String(r.patientId) === String(patientId))
                : all;
            // Ordena del más reciente al más antiguo
            filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
            setRecords(filtered);
        } catch (err) {
            console.error('[PeriodontogramHistory] Error leyendo localStorage:', err);
            setRecords([]);
        } finally {
            setIsLoading(false);
        }
    }, [patientId]);

    useEffect(() => {
        loadHistory();
    }, [loadHistory]);

    const handleDelete = (id) => {
        try {
            const raw = localStorage.getItem(LS_KEY);
            const all = raw ? JSON.parse(raw) : [];
            const updated = all.filter(r => r.id !== id);
            localStorage.setItem(LS_KEY, JSON.stringify(updated));
            setDeleteConfirm(null);
            loadHistory();
        } catch (err) {
            console.error('[PeriodontogramHistory] Error eliminando registro:', err);
        }
    };

    const formatDate = (isoDate) => {
        try {
            return new Intl.DateTimeFormat('es-MX', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            }).format(new Date(isoDate));
        } catch {
            return isoDate;
        }
    };

    return (
        <motion.div
            key="history-panel"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            className="bg-white dark:bg-secondary border border-slate-200 dark:border-slate-700 rounded-3xl p-6 shadow-sm"
        >
            {/* Encabezado */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-xl">
                        <Clock className="text-primary w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-slate-800 dark:text-white leading-tight">
                            Historial de Periodontogramas
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            {records.length} registro{records.length !== 1 ? 's' : ''} guardado{records.length !== 1 ? 's' : ''} localmente
                        </p>
                    </div>
                </div>

                <button
                    onClick={loadHistory}
                    title="Recargar historial"
                    className="p-2 rounded-xl text-slate-400 hover:text-primary hover:bg-primary/10 transition-all"
                >
                    <RefreshCw size={16} />
                </button>
            </div>

            {/* Estado: cargando */}
            {isLoading && (
                <div className="flex items-center justify-center py-16 text-slate-400">
                    <RefreshCw size={20} className="animate-spin mr-2" />
                    <span className="text-sm">Cargando historial...</span>
                </div>
            )}

            {/* Estado: sin registros */}
            {!isLoading && records.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
                    <FileX size={40} strokeWidth={1.5} />
                    <p className="text-sm font-medium">No hay registros guardados para este paciente.</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 text-center max-w-xs">
                        Captura un periodontograma y presiona "Guardar Periodontograma" para que aparezca aquí.
                    </p>
                </div>
            )}

            {/* Tabla de registros */}
            {!isLoading && records.length > 0 && (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                        <thead>
                            <tr className="border-b border-slate-100 dark:border-slate-700">
                                <th className="text-left text-[10px] font-bold uppercase text-slate-400 pb-3 pr-4 tracking-wider">
                                    #
                                </th>
                                <th className="text-left text-[10px] font-bold uppercase text-slate-400 pb-3 pr-4 tracking-wider">
                                    Fecha y Hora
                                </th>
                                <th className="text-left text-[10px] font-bold uppercase text-slate-400 pb-3 pr-4 tracking-wider">
                                    ID de Registro
                                </th>
                                <th className="text-right text-[10px] font-bold uppercase text-slate-400 pb-3 tracking-wider">
                                    Acciones
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                            <AnimatePresence initial={false}>
                                {records.map((record, idx) => (
                                    <motion.tr
                                        key={record.id}
                                        initial={{ opacity: 0, x: -8 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 8 }}
                                        transition={{ delay: idx * 0.04 }}
                                        className="group hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                                    >
                                        {/* Número */}
                                        <td className="py-3.5 pr-4">
                                            <span className="w-6 h-6 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-black text-slate-500 dark:text-slate-400">
                                                {idx + 1}
                                            </span>
                                        </td>

                                        {/* Fecha */}
                                        <td className="py-3.5 pr-4">
                                            <div className="flex items-center gap-2">
                                                <Clock size={13} className="text-slate-400 flex-shrink-0" />
                                                <span className="text-slate-700 dark:text-slate-200 font-medium text-xs">
                                                    {formatDate(record.date)}
                                                </span>
                                            </div>
                                        </td>

                                        {/* ID corto */}
                                        <td className="py-3.5 pr-4">
                                            <span className="font-mono text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                                                {String(record.id).slice(-12)}
                                            </span>
                                        </td>

                                        {/* Acciones */}
                                        <td className="py-3.5 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {/* Confirmar eliminación */}
                                                {deleteConfirm === record.id ? (
                                                    <>
                                                        <span className="text-[10px] text-red-500 font-bold mr-1">¿Eliminar?</span>
                                                        <button
                                                            onClick={() => handleDelete(record.id)}
                                                            className="px-3 py-1.5 text-xs font-bold bg-red-500 text-white rounded-lg hover:brightness-110 transition-all"
                                                        >
                                                            Sí
                                                        </button>
                                                        <button
                                                            onClick={() => setDeleteConfirm(null)}
                                                            className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-all"
                                                        >
                                                            No
                                                        </button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <button
                                                            onClick={() => setDeleteConfirm(record.id)}
                                                            title="Eliminar registro"
                                                            className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all opacity-0 group-hover:opacity-100"
                                                        >
                                                            <Trash2 size={13} />
                                                        </button>
                                                        <button
                                                            onClick={() => onLoad(record)}
                                                            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold bg-primary text-white rounded-xl shadow-md shadow-primary/20 hover:brightness-110 transition-all"
                                                        >
                                                            <Upload size={12} />
                                                            Cargar
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))}
                            </AnimatePresence>
                        </tbody>
                    </table>
                </div>
            )}
        </motion.div>
    );
}
