import React, { useState } from 'react';
import SingleTooth from '../SingleTooth';

const EMPTY_TOOTH_STATE = {
    north: null, south: null, east: null, west: null, center: null, extraction: false
};

const OdontogramStep = ({ teethStatus, onStatusChange, onResetRequest }) => {
    const [selectedMode, setSelectedMode] = useState('extraction'); // 'extraction' | 'treatment'

    // FDI Notation
    const quadrants = {
        // Upper Right (18-11)
        q1: [18, 17, 16, 15, 14, 13, 12, 11],
        // Upper Left (21-28)
        q2: [21, 22, 23, 24, 25, 26, 27, 28],
        // Lower Right (48-41)
        q4: [48, 47, 46, 45, 44, 43, 42, 41],
        // Lower Left (31-38)
        q3: [31, 32, 33, 34, 35, 36, 37, 38]
    };

    const handleToothClick = (toothId, area) => {
        // Always start with a valid object, falling back to EMPTY
        const currentToothState = teethStatus[toothId] || { ...EMPTY_TOOTH_STATE };
        let newToothState = { ...currentToothState };

        if (selectedMode === 'extraction') {
            // Toggle FULL tooth extraction
            if (newToothState.extraction) {
                // Was extracted -> Deselect fully
                newToothState = { ...EMPTY_TOOTH_STATE };
            } else {
                // Was not extracted -> Extract fully (clears granular treatments)
                newToothState = { ...EMPTY_TOOTH_STATE, extraction: true };
            }
        } else {
            // TREATMENT MODE
            // If it was fully extracted, clicking an area for treatment should probably
            // clear the full extraction and apply treatment to just that area?
            // "Extraction always wins... A tooth cannot have mixed section states"
            if (newToothState.extraction) {
                newToothState.extraction = false;
                // We also clear any old hidden states effectively by resetting others to null (via ...EMPTY)
                // BUT we want to keep the one we just clicked as treatment.
                // Reset everything else is correct.
            }

            const currentAreaState = newToothState[area];
            if (currentAreaState === 'treatment') {
                newToothState[area] = null;
            } else {
                newToothState[area] = 'treatment';
            }
        }

        // Check if tooth is effectively empty -> Set to null or keep explicit empty?
        // To be safe and keep logic simple, we can send null if it matches EMPTY
        const isStructureEmpty = !newToothState.extraction &&
            ['north', 'south', 'east', 'west', 'center'].every(k => newToothState[k] === null);

        onStatusChange(toothId, isStructureEmpty ? null : newToothState);
    };

    const handleReset = () => {
        // Trigger parent confirmation dialog
        if (onResetRequest) onResetRequest();
    };

    const renderQuadrant = (teethIds) => (
        <div className="flex gap-1 md:gap-1.5 justify-center">
            {teethIds.map(id => (
                <SingleTooth
                    key={id}
                    id={id}
                    status={teethStatus[id] || EMPTY_TOOTH_STATE}
                    selectedMode={selectedMode}
                    onClick={handleToothClick}
                />
            ))}
        </div>
    );

    // Calculate stats
    const totalTeethAffected = Object.values(teethStatus).filter(t => t && (t.extraction || Object.values(t).some(v => v !== null && v !== false))).length;
    const totalAreasAffected = Object.values(teethStatus).reduce((acc, tooth) => {
        if (!tooth) return acc;
        if (tooth.extraction) return acc + 5; // Full tooth counts as 5 areas? Or just 1 tooth? Let's count 5 for impact.
        return acc + Object.values(tooth).filter(v => v === 'treatment' || v === 'extraction').length;
    }, 0);

    return (
        <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900/50 rounded-xl">
            {/* Controls Header */}
            <div className="flex flex-col md:flex-row justify-between items-center bg-white dark:bg-slate-800 p-4 rounded-t-xl border-b border-gray-200 dark:border-slate-700 shadow-sm z-10">
                <div className="flex gap-3 mb-4 md:mb-0">
                    <button
                        onClick={() => setSelectedMode('extraction')}
                        className={`px-5 py-2 rounded-lg font-bold transition-all flex items-center gap-2 border ${selectedMode === 'extraction'
                            ? 'bg-red-50 text-red-600 border-red-200 shadow-sm ring-1 ring-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/50 dark:ring-red-900/30'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-600 dark:hover:bg-slate-700'
                            }`}
                    >
                        <div className={`w-3 h-3 rounded-full ${selectedMode === 'extraction' ? 'bg-red-500' : 'bg-red-200 dark:bg-red-800'}`} />
                        Extracción
                    </button>
                    <button
                        onClick={() => setSelectedMode('treatment')}
                        className={`px-5 py-2 rounded-lg font-bold transition-all flex items-center gap-2 border ${selectedMode === 'treatment'
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-200 shadow-sm ring-1 ring-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-900/50 dark:ring-emerald-900/30'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-600 dark:hover:bg-slate-700'
                            }`}
                    >
                        <div className={`w-3 h-3 rounded-full ${selectedMode === 'treatment' ? 'bg-emerald-500' : 'bg-emerald-200 dark:bg-emerald-800'}`} />
                        Tratamiento
                    </button>
                </div>

                <div className="flex items-center gap-6">
                    <div className="text-right flex flex-col items-end">
                        <span className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wider font-semibold">Selección</span>
                        <div className="text-slate-700 dark:text-slate-200 font-medium flex items-baseline gap-1">
                            <span className="text-primary font-bold text-lg">{totalTeethAffected}</span> <span className="text-xs">dientes</span>
                            <span className="text-slate-300 dark:text-slate-600 mx-1">/</span>
                            <span className="text-primary font-bold text-lg">{totalAreasAffected}</span> <span className="text-xs">áreas</span>
                        </div>
                    </div>

                    {totalTeethAffected > 0 && (
                        <button
                            onClick={handleReset}
                            className="text-slate-400 hover:text-red-500 dark:text-slate-500 dark:hover:text-red-400 transition-colors p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20"
                            title="Limpiar odontograma"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
                        </button>
                    )}
                </div>
            </div>

            {/* Grid Container */}
            <div className="flex-1 flex flex-col items-center justify-center relative w-full overflow-hidden">

                <div className="absolute inset-0 pointer-events-none opacity-5 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] dark:bg-[radial-gradient(#475569_1px,transparent_1px)] [background-size:20px_20px]"></div>

                <div className="relative z-0 scale-90 lg:scale-[0.95] xl:scale-100 transition-transform origin-center">

                    {/* Orientation Indicators */}
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-bold tracking-[0.2em] text-slate-300 dark:text-slate-600 select-none">
                        SUPERIOR
                    </div>
                    <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-bold tracking-[0.2em] text-slate-300 dark:text-slate-600 select-none">
                        INFERIOR
                    </div>
                    <div className="absolute top-1/2 -left-12 -translate-y-1/2 -rotate-90 text-[10px] font-bold tracking-[0.2em] text-slate-300 dark:text-slate-600 select-none">
                        DERECHO
                    </div>
                    <div className="absolute top-1/2 -right-12 -translate-y-1/2 rotate-90 text-[10px] font-bold tracking-[0.2em] text-slate-300 dark:text-slate-600 select-none">
                        IZQUIERDO
                    </div>

                    {/* Upper Arch */}
                    <div className="flex justify-center gap-2 lg:gap-4 pb-6 border-b-2 border-slate-200 dark:border-slate-700/50">
                        {renderQuadrant(quadrants.q1)}
                        <div className="w-px bg-slate-300 dark:bg-slate-700 mx-1 md:mx-2 h-20 md:h-24 self-center"></div>
                        {renderQuadrant(quadrants.q2)}
                    </div>
                    {/* Lower Arch */}
                    <div className="flex justify-center gap-2 lg:gap-4 pt-6">
                        {renderQuadrant(quadrants.q4)}
                        <div className="w-px bg-slate-300 dark:bg-slate-700 mx-1 md:mx-2 h-20 md:h-24 self-center"></div>
                        {renderQuadrant(quadrants.q3)}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OdontogramStep;
