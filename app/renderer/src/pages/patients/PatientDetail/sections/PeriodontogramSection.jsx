import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Camera,
    FileText,
    ChevronRight,
    RotateCcw,
    Info,
    ArrowLeftRight,
    History
} from 'lucide-react';
import { usePeriodontogram } from '../hooks/usePeriodontogram';
import * as odontogramService from '@/services/odontogram.service';
import CaptureGrid from './components/CaptureGrid';
import ReportGrid from './components/ReportGrid';
import PeriodontogramHistory from './components/PeriodontogramHistory';

/**
 * PeriodontogramSection - Componente principal para el registro y reporte periodontal.
 */
export default function PeriodontogramSection() {
    const { id: patientId } = useParams();
    const {
        teeth,
        updateMeasurement,
        updateToothGeneral,
        getNivelInsercion,
        resetPeriodontogram
    } = usePeriodontogram();

    const [activeMode, setActiveMode] = useState('capture'); // 'capture' | 'report'
    const [viewMode, setViewMode] = useState('capture');     // 'capture' | 'history'
    const [currentView, setCurrentView] = useState('vestibular'); // 'vestibular' | 'palatino'
    const [odontogramStates, setOdontogramStates] = useState({});
    const [selectedRecord, setSelectedRecord] = useState(null);

    /** Carga un registro del historial y cambia a modo captura */
    const handleLoadRecord = (record) => {
        setSelectedRecord(record);
        setViewMode('capture');
        setActiveMode('capture');
    };

    /** Limpia el registro activo tras guardar un nuevo periodontograma */
    const handleRecordSaved = () => {
        setSelectedRecord(null);
    };

    // Carga de estados del odontograma (diseño de dientes)
    useEffect(() => {
        const loadToothDesigns = async () => {
            if (!patientId) return;
            try {
                const response = await odontogramService.getOdontogramByPatientId(patientId);
                const odontogram = response.data;
                if (odontogram && odontogram.details) {
                    const states = {};
                    odontogram.details.forEach(detail => {
                        let status = detail.status || {};
                        if (typeof status === 'string') {
                            try { status = JSON.parse(status); } catch (e) { status = {}; }
                        }
                        if (status.toothState) {
                            states[detail.tooth_id] = status.toothState;
                        }
                    });
                    setOdontogramStates(states);
                }
            } catch (err) {
                console.error('[PeriodontogramSection] Error loading tooth designs:', err);
            }
        };
        loadToothDesigns();
    }, [patientId]);

    return (
        <div className="flex flex-col gap-6 w-full animate-in fade-in duration-500">

            {/* Header / Menu Superior */}
            <div className="bg-white dark:bg-secondary border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-xl">
                        <FileText className="text-primary w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-slate-800 dark:text-white leading-tight">
                            Periodontograma Clínico
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            Registro de profundidad, margen y salud periodontal
                        </p>
                    </div>
                </div>

                {/* Selector de Modo */}
                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-full md:w-auto gap-1">
                    <button
                        onClick={() => { setActiveMode('capture'); setViewMode('capture'); }}
                        className={`flex-1 md:flex-none px-5 py-2 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                            viewMode === 'capture' && activeMode === 'capture'
                                ? 'bg-white dark:bg-slate-700 text-primary shadow-sm'
                                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                        }`}
                    >
                        <Camera size={16} />
                        Modo Captura
                    </button>
                    <button
                        onClick={() => { setActiveMode('report'); setViewMode('capture'); }}
                        className={`flex-1 md:flex-none px-5 py-2 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                            viewMode === 'capture' && activeMode === 'report'
                                ? 'bg-white dark:bg-slate-700 text-primary shadow-sm'
                                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                        }`}
                    >
                        <FileText size={16} />
                        Modo Reporte
                    </button>
                    <button
                        onClick={() => setViewMode(v => v === 'history' ? 'capture' : 'history')}
                        className={`flex-1 md:flex-none px-5 py-2 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                            viewMode === 'history'
                                ? 'bg-white dark:bg-slate-700 text-primary shadow-sm'
                                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                        }`}
                    >
                        <History size={16} />
                        Ver Historial
                    </button>
                </div>
            </div>

            {/* Controles de Captura (Solo en modo captura normal) */}
            <AnimatePresence mode="wait">
                {viewMode === 'capture' && activeMode === 'capture' && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="flex items-center justify-between px-2"
                    >
                        <div className="flex items-center gap-4">
                            {/* Toggle de Vista */}
                            <div className="flex items-center gap-3 bg-white dark:bg-secondary border border-slate-200 dark:border-slate-700 p-1.5 rounded-2xl shadow-sm">
                                <button
                                    onClick={() => setCurrentView('vestibular')}
                                    className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${currentView === 'vestibular'
                                        ? 'bg-primary text-white shadow-md'
                                        : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                                        }`}
                                >
                                    Frente (Vestibular)
                                </button>
                                <button
                                    onClick={() => setCurrentView('palatino')}
                                    className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${currentView === 'palatino'
                                        ? 'bg-primary text-white shadow-md'
                                        : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                                        }`}
                                >
                                    Atrás (Palatino/Lingual)
                                </button>
                            </div>
                        </div>

                        {/* Botón Reset */}
                        <button
                            onClick={resetPeriodontogram}
                            className="p-2.5 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all group"
                            title="Reiniciar mediciones"
                        >
                            <RotateCcw size={20} className="group-hover:rotate-[-45deg] transition-transform" />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Área de Contenido */}
            <div className="flex-1 min-h-[500px]">
                <AnimatePresence mode="wait">

                    {/* Vista: Historial */}
                    {viewMode === 'history' && (
                        <PeriodontogramHistory
                            key="history-panel"
                            patientId={patientId}
                            onLoad={handleLoadRecord}
                        />
                    )}

                    {/* Vista: Captura o Reporte */}
                    {viewMode === 'capture' && (
                        activeMode === 'capture' ? (
                            <motion.div
                                key="capture-grid"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                            >
                                {/* Banner de registro cargado */}
                                <AnimatePresence>
                                    {selectedRecord && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -6 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -6 }}
                                            className="mb-4 flex items-center justify-between bg-primary/10 border border-primary/20 text-primary rounded-2xl px-5 py-3"
                                        >
                                            <div className="flex items-center gap-2">
                                                <History size={15} />
                                                <span className="text-xs font-bold">
                                                    Editando registro del {new Intl.DateTimeFormat('es-MX', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(selectedRecord.date))}
                                                </span>
                                            </div>
                                            <button
                                                onClick={() => setSelectedRecord(null)}
                                                className="text-xs font-bold text-primary/70 hover:text-primary underline underline-offset-2 transition-all"
                                            >
                                                Limpiar
                                            </button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <CaptureGrid
                                    view={currentView}
                                    teeth={teeth}
                                    odontogramStates={odontogramStates}
                                    onUpdate={updateMeasurement}
                                    onGeneralUpdate={updateToothGeneral}
                                    patientId={patientId}
                                    selectedRecord={selectedRecord}
                                    onRecordSaved={handleRecordSaved}
                                />
                            </motion.div>
                        ) : (
                            <motion.div
                                key="report-grid"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                            >
                                <ReportGrid
                                    teeth={teeth}
                                    odontogramStates={odontogramStates}
                                    getCAL={getNivelInsercion}
                                />
                            </motion.div>
                        )
                    )}

                </AnimatePresence>
            </div>
        </div>
    );
}
