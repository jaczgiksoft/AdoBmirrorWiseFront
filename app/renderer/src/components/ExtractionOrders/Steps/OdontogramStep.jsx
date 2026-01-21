import React, { useState } from 'react';
import SingleTooth from '../SingleTooth';
import FrontalOdontogram from '../FrontalOdontogram';

const EMPTY_TOOTH_STATE = {
    north: null, south: null, east: null, west: null, center: null, extraction: false
};

const OdontogramStep = ({ teethStatus, onStatusChange, onResetRequest, clinicalMode }) => {
    // We retain strict mode from parents - no internal toggles anymore.
    // clinicalMode is strict: 'extraction' | 'restorative'

    const handleExtractionToggle = (toothId, newStatus) => {
        // FrontalOdontogram sends { extraction: true } or null
        // If getting extraction: true, we must overwrite any previous state (clearing surfaces)
        onStatusChange(toothId, newStatus);
    };

    const handleRestorativeClick = (toothId, area) => {
        // Always start with a valid object, falling back to EMPTY
        const currentToothState = teethStatus[toothId] || { ...EMPTY_TOOTH_STATE };

        // SAFETY RULE: Cannot edit surfaces if marked for extraction
        if (currentToothState.extraction) {
            // Optional: We could trigger a toast here if we had access to addToast
            console.warn("Cannot add restoration to an extracted tooth");
            // Determine how to communicate this feedback?
            // For now, silently block or use a small visual shake (not implemented yet).
            // We'll enforce the rule by just returning early.
            return;
        }

        let newToothState = { ...currentToothState };

        // Toggle logic for areas
        const currentAreaState = newToothState[area];

        // In this simplified wizard, we treat "click" in restorative mode as applying "treatment"
        if (currentAreaState === 'treatment') {
            newToothState[area] = null;
        } else {
            newToothState[area] = 'treatment';
        }

        // Clean up empty objects to null if completely empty
        const isStructureEmpty = !newToothState.extraction &&
            ['north', 'south', 'east', 'west', 'center'].every(k => newToothState[k] === null);

        onStatusChange(toothId, isStructureEmpty ? null : newToothState);
    };


    // FDI Notation for Restorative View
    const quadrants = {
        q1: [18, 17, 16, 15, 14, 13, 12, 11],
        q2: [21, 22, 23, 24, 25, 26, 27, 28],
        q4: [48, 47, 46, 45, 44, 43, 42, 41],
        q3: [31, 32, 33, 34, 35, 36, 37, 38]
    };

    const renderRestorativeQuadrant = (teethIds) => (
        <div className="flex gap-1 md:gap-1.5 justify-center">
            {teethIds.map(id => (
                <div key={id} className="relative group">
                    <SingleTooth
                        id={id}
                        status={teethStatus[id] || EMPTY_TOOTH_STATE}
                        selectedMode="treatment" // Always treatment in this mode
                        onClick={handleRestorativeClick}
                    />
                    {/* Overlay for Extracted Teeth in Restorative Mode */}
                    {teethStatus[id]?.extraction && (
                        <div className="absolute inset-0 bg-slate-100/80 dark:bg-slate-800/80 flex items-center justify-center rounded cursor-not-allowed z-10 backdrop-grayscale">
                            <span className="text-[10px] font-bold text-red-500 uppercase -rotate-45 border border-red-500 px-1 rounded">
                                Extr.
                            </span>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );

    // Calculate stats
    const totalTeethAffected = Object.values(teethStatus).filter(t => t && (t.extraction || Object.values(t).some(v => v !== null && v !== false))).length;
    // Area calc logic
    const totalAreasAffected = Object.values(teethStatus).reduce((acc, tooth) => {
        if (!tooth) return acc;
        if (tooth.extraction) return acc + 1; // Count extraction as 1 major event? Or 5? Let's treat it as 1 unit for "Areas" count is weird.
        // If extraction mode, maybe we just show "Teeth selected".
        return acc + Object.values(tooth).filter(v => v === 'treatment').length;
    }, 0);

    return (
        <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900/50 rounded-xl">
            {/* Controls Header */}
            <div className="flex flex-col md:flex-row justify-between items-center bg-white dark:bg-slate-800 p-4 rounded-t-xl border-b border-gray-200 dark:border-slate-700 shadow-sm z-10">
                {/* Clinical Mode Indicator */}
                <div className="flex gap-3 mb-4 md:mb-0">
                    <div className={`px-4 py-2 rounded-lg font-bold border flex items-center gap-2 
                        ${clinicalMode === 'extraction'
                            ? 'bg-red-50 text-red-600 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/50'
                            : 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-900/50'
                        }`}
                    >
                        <div className={`w-3 h-3 rounded-full ${clinicalMode === 'extraction' ? 'bg-red-500' : 'bg-emerald-500'}`} />
                        {clinicalMode === 'extraction' ? 'Modo: Extracción (Quirúrgico)' : 'Modo: Restauración (Operativo)'}
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <div className="text-right flex flex-col items-end">
                        <span className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wider font-semibold">Resumen</span>
                        <div className="text-slate-700 dark:text-slate-200 font-medium flex items-baseline gap-1">
                            <span className="text-primary font-bold text-lg">{totalTeethAffected}</span> <span className="text-xs">dientes</span>
                            {clinicalMode === 'restorative' && (
                                <>
                                    <span className="text-slate-300 dark:text-slate-600 mx-1">/</span>
                                    <span className="text-primary font-bold text-lg">{totalAreasAffected}</span> <span className="text-xs">áreas</span>
                                </>
                            )}
                        </div>
                    </div>

                    {totalTeethAffected > 0 && (
                        <button
                            onClick={onResetRequest}
                            className="text-slate-400 hover:text-red-500 dark:text-slate-500 dark:hover:text-red-400 transition-colors p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20"
                            title="Limpiar selección"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
                        </button>
                    )}
                </div>
            </div>

            {/* Visualization Area */}
            <div className="flex-1 flex flex-col items-center justify-center relative w-full overflow-hidden">

                {clinicalMode === 'extraction' ? (
                    // === EXTRACTION VIEW (Frontal) ===
                    <FrontalOdontogram
                        teethStatus={teethStatus}
                        onStatusChange={handleExtractionToggle}
                    />
                ) : (
                    // === RESTORATIVE VIEW (Occlusal) ===
                    <>
                        <div className="absolute inset-0 pointer-events-none opacity-5 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] dark:bg-[radial-gradient(#475569_1px,transparent_1px)] [background-size:20px_20px]"></div>

                        <div className="relative z-0 scale-90 lg:scale-[0.95] xl:scale-100 transition-transform origin-center">
                            {/* Orientation Indicators */}
                            <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-bold tracking-[0.2em] text-slate-300 dark:text-slate-600 select-none">SUPERIOR</div>
                            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-bold tracking-[0.2em] text-slate-300 dark:text-slate-600 select-none">INFERIOR</div>
                            <div className="absolute top-1/2 -left-12 -translate-y-1/2 -rotate-90 text-[10px] font-bold tracking-[0.2em] text-slate-300 dark:text-slate-600 select-none">DERECHO</div>
                            <div className="absolute top-1/2 -right-12 -translate-y-1/2 rotate-90 text-[10px] font-bold tracking-[0.2em] text-slate-300 dark:text-slate-600 select-none">IZQUIERDO</div>

                            {/* Upper Arch */}
                            <div className="flex justify-center gap-2 lg:gap-4 pb-6 border-b-2 border-slate-200 dark:border-slate-700/50">
                                {renderRestorativeQuadrant(quadrants.q1)}
                                <div className="w-px bg-slate-300 dark:bg-slate-700 mx-1 md:mx-2 h-20 md:h-24 self-center"></div>
                                {renderRestorativeQuadrant(quadrants.q2)}
                            </div>
                            {/* Lower Arch */}
                            <div className="flex justify-center gap-2 lg:gap-4 pt-6">
                                {renderRestorativeQuadrant(quadrants.q4)}
                                <div className="w-px bg-slate-300 dark:bg-slate-700 mx-1 md:mx-2 h-20 md:h-24 self-center"></div>
                                {renderRestorativeQuadrant(quadrants.q3)}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default OdontogramStep;
