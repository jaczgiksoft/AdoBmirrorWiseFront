import React from 'react';
import { Trash2 } from 'lucide-react';
import SingleTooth from '../SingleTooth';
import FrontalOdontogram from '../FrontalOdontogram';

/* ============================================================
   🔹 CONSTANTS
============================================================ */

const EMPTY_TOOTH_STATE = {
    north: null,
    south: null,
    east: null,
    west: null,
    center: null,
    extraction: false
};

/* ============================================================
   🔹 HELPERS
============================================================ */

/**
 * 🔥 Detecta dientes que YA venían ausentes (antes del wizard)
 */
const getInitialMissingTeeth = (teethStatus) => {
    return Object.entries(teethStatus)
        .filter(([_, t]) => t?.extraction)
        .map(([id]) => id);
};

/**
 * 🔥 Normaliza el modelo separando:
 * - missing → ya no existe
 * - plannedExtraction → seleccionado en el wizard
 */
const normalizeTeeth = (teethStatus, clinicalMode, initialMissingTeeth) => {
    return Object.entries(teethStatus).reduce((acc, [id, tooth]) => {
        if (!tooth) return acc;

        const wasMissing = initialMissingTeeth.includes(id);
        const isExtraction = tooth.extraction === true;

        acc[id] = {
            missing: wasMissing,
            plannedExtraction:
                clinicalMode === 'extraction' &&
                isExtraction &&
                !wasMissing,
            areas: {
                north: tooth.north,
                south: tooth.south,
                east: tooth.east,
                west: tooth.west,
                center: tooth.center
            }
        };

        return acc;
    }, {});
};

const toggleArea = (state) => (state === 'treatment' ? null : 'treatment');

const isEmptyTooth = (tooth) => {
    return !tooth.extraction &&
        ['north', 'south', 'east', 'west', 'center']
            .every(k => tooth[k] === null);
};

/* ============================================================
   🔹 COMPONENT
============================================================ */

const OdontogramStep = ({ teethStatus, onStatusChange, onResetRequest, clinicalMode }) => {

    /* ============================
       🔹 INITIAL STATE SNAPSHOT
    ============================ */

    // ⚠️ importante: solo se calcula una vez
    const initialMissingTeeth = React.useMemo(() => {
        return getInitialMissingTeeth(teethStatus);
    }, []);

    /* ============================
       🔹 NORMALIZED MODEL
    ============================ */

    const normalizedTeeth = normalizeTeeth(
        teethStatus,
        clinicalMode,
        initialMissingTeeth
    );

    /* ============================
       🔹 COUNTERS
    ============================ */

    const totalMissing = Object.values(normalizedTeeth)
        .filter(t => t.missing)
        .length;

    const totalPlannedExtractions = Object.values(normalizedTeeth)
        .filter(t => t.plannedExtraction)
        .length;

    const totalTeethWithTreatment = Object.values(normalizedTeeth)
        .filter(t =>
            !t.missing &&
            !t.plannedExtraction &&
            Object.values(t.areas).some(v => v === 'treatment')
        )
        .length;

    const totalAreasAffected = Object.values(normalizedTeeth)
        .reduce((acc, t) => {
            if (t.missing || t.plannedExtraction) return acc;

            return acc + Object.values(t.areas)
                .filter(v => v === 'treatment')
                .length;
        }, 0);

    /* ============================
       🔹 HANDLERS
    ============================ */

    const handleExtractionToggle = (toothId, newStatus) => {
        onStatusChange(toothId, newStatus);
    };

    const handleRestorativeClick = (toothId, area) => {
        const current = teethStatus[toothId] ?? EMPTY_TOOTH_STATE;

        if (current.extraction) return;

        const updated = { ...current };
        updated[area] = toggleArea(updated[area]);

        onStatusChange(
            toothId,
            isEmptyTooth(updated) ? null : updated
        );
    };

    /* ============================
       🔹 RENDER HELPERS
    ============================ */

    const quadrants = {
        q1: [18, 17, 16, 15, 14, 13, 12, 11],
        q2: [21, 22, 23, 24, 25, 26, 27, 28],
        q4: [48, 47, 46, 45, 44, 43, 42, 41],
        q3: [31, 32, 33, 34, 35, 36, 37, 38]
    };

    const renderQuadrant = (teethIds) => (
        <div className="flex gap-1 md:gap-1.5 justify-center">
            {teethIds.map(id => (
                <div key={id} className="relative group">
                    <SingleTooth
                        id={id}
                        status={teethStatus[id] || EMPTY_TOOTH_STATE}
                        selectedMode="treatment"
                        onClick={handleRestorativeClick}
                        colorScheme="emerald"
                    />

                    {teethStatus[id]?.extraction && (
                        <div className="absolute inset-0 bg-slate-100/80 dark:bg-slate-800/80 flex items-center justify-center rounded cursor-not-allowed z-10 backdrop-grayscale">
                            <span className="text-[10px] font-bold text-red-500 uppercase -rotate-45 border px-1 rounded">
                                Extr.
                            </span>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );

    /* ============================
       🔹 UI
    ============================ */

    return (
        <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900/50 rounded-xl">

            {/* HEADER */}
            <div className="flex flex-col md:flex-row justify-between items-center bg-white dark:bg-slate-800 p-4 rounded-t-xl border-b border-gray-200 dark:border-slate-700 shadow-sm">

                {/* Mode */}
                <div className="flex gap-3 mb-2 md:mb-0">
                    <div className={`px-3 py-1.5 rounded-md text-xs font-semibold border flex items-center gap-1.5
                        ${clinicalMode === 'extraction'
                            ? 'bg-red-50 text-red-600 border-red-200 dark:bg-red-900/20 dark:text-red-400'
                            : 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400'
                        }`}
                    >
                        <div className={`w-2 h-2 rounded-full ${clinicalMode === 'extraction' ? 'bg-red-500' : 'bg-emerald-500'}`} />
                        {clinicalMode === 'extraction' ? 'Extracción' : 'Obturación'}
                    </div>
                </div>

                {/* Summary */}
                <div className="flex items-center gap-6">
                    <div className="flex flex-col items-end">
                        <span className="text-xs text-slate-400 uppercase font-semibold">
                            Resumen
                        </span>

                        <div className="flex items-center gap-4 text-xs">

                            {totalMissing > 0 && (
                                <div className="flex gap-1 text-red-500">
                                    <span>Ausentes:</span>
                                    <span className="font-bold">{totalMissing}</span>
                                </div>
                            )}

                            <div className="flex gap-1">
                                <span className="text-slate-500">
                                    {clinicalMode === 'extraction' ? 'A extraer:' : 'Dientes:'}
                                </span>
                                <span className="text-primary font-bold">
                                    {clinicalMode === 'extraction'
                                        ? totalPlannedExtractions
                                        : totalTeethWithTreatment}
                                </span>
                            </div>

                            {clinicalMode === 'restorative' && (
                                <div className="flex gap-1">
                                    <span className="text-slate-500">Áreas:</span>
                                    <span className="text-primary font-bold">{totalAreasAffected}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Reset */}
                    {(clinicalMode === 'extraction'
                        ? totalPlannedExtractions > 0
                        : totalTeethWithTreatment > 0) && (
                            <button
                                onClick={onResetRequest}
                                className="text-slate-400 hover:text-red-500 p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20"
                            >
                                <Trash2 size={18} />
                            </button>
                        )}
                </div>
            </div>

            {/* CONTENT */}
            <div className="flex-1 flex items-center justify-center relative overflow-hidden">

                {clinicalMode === 'extraction' ? (
                    <FrontalOdontogram
                        teethStatus={teethStatus}
                        onStatusChange={handleExtractionToggle}
                    />
                ) : (
                    <div className="relative scale-95">

                        <div className="flex justify-center gap-4 pb-6 border-b">
                            {renderQuadrant(quadrants.q1)}
                            {renderQuadrant(quadrants.q2)}
                        </div>

                        <div className="flex justify-center gap-4 pt-6">
                            {renderQuadrant(quadrants.q4)}
                            {renderQuadrant(quadrants.q3)}
                        </div>

                    </div>
                )}
            </div>
        </div>
    );
};

export default OdontogramStep;