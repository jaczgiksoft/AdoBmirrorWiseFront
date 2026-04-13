import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';

// Centralized helpers for SVG generation
import { getToothSrc, generateCombinedSvgDataUrl } from '@/pages/patients/PatientDetail/sections/components/toothSvgHelpers';
import * as odontogramService from '@/services/odontogram.service';

// Assets for brackets and TADs
import bracketImg from '@/assets/images/odontogram/bracket.svg';
import bracketGanchoImg from '@/assets/images/odontogram/bracket-gancho.svg';
import tadImg from '@/assets/images/odontogram/tad.svg';

const QUADRANTS = {
    q1: [18, 17, 16, 15, 14, 13, 12, 11], // Upper Right
    q2: [21, 22, 23, 24, 25, 26, 27, 28], // Upper Left
    q4: [48, 47, 46, 45, 44, 43, 42, 41], // Lower Right
    q3: [31, 32, 33, 34, 35, 36, 37, 38]  // Lower Left
};

const TEETH_TO_SCALE = [18, 17, 16, 26, 27, 28, 36, 37, 38, 46, 47, 48];
const BRACKET_HOOK_IDS = [16, 17, 18, 26, 27, 28, 36, 37, 38, 46, 47, 48];

const INACTIVE_TYPES = ['extraction', 'missing', 'unerupted'];

function FrontalTooth({ id, isPendingExtraction, globalState, hasBracket, hasTad, onClick, isUpper }) {
    const isImplantCrown = globalState === 'implant-crown';
    const activeTypes = isImplantCrown ? ['implant', 'crown'] : (globalState ? globalState.split('+') : ['original']);
    const isCombined = activeTypes.length > 1 || isImplantCrown;
    const baseType = activeTypes[0] || 'original';

    // Prioritize the 'extraction' asset if it's pending in this order
    // OR if it's already extracted/missing in global state
    const isActuallyExtracted = isPendingExtraction || INACTIVE_TYPES.includes(baseType);
    
    const src = useMemo(() => {
        if (isPendingExtraction) return getToothSrc(id, 'extraction');
        if (isCombined) return generateCombinedSvgDataUrl(id, activeTypes);
        return getToothSrc(id, baseType);
    }, [id, isPendingExtraction, isCombined, baseType, activeTypes]);

    const shouldScale = TEETH_TO_SCALE.includes(id);

    if (!src) return <div className="w-10 h-14 bg-red-100 text-xs flex items-center justify-center">{id}</div>;

    const NumberLabel = (
        <span className={`text-[10px] md:text-xs font-black transition-colors z-20 ${isActuallyExtracted ? 'text-red-600' : 'text-slate-400 group-hover:text-slate-600 dark:text-slate-500'}`}>
            {id}
        </span>
    );

    const isBracketHook = BRACKET_HOOK_IDS.includes(id);

    return (
        <div
            onClick={() => !INACTIVE_TYPES.includes(baseType) && onClick(id)}
            className={`flex flex-col items-center group relative mx-0 transition-all hover:z-20 ${INACTIVE_TYPES.includes(baseType) ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
        >
            {/* Number ABOVE for Upper Arch */}
            {isUpper && NumberLabel}

            <div className={`relative h-14 md:h-38 transition-all duration-200 
                ${isActuallyExtracted ? '' : 'hover:scale-110 drop-shadow-lg'}`}
            >
                <img
                    src={src}
                    alt={`Tooth ${id}`}
                    className="w-full h-full object-contain pointer-events-none"
                    draggable="false"
                />

                {/* Brackets Overlay (Contextual) */}
                {hasBracket && !isActuallyExtracted && (
                    <div className={`absolute ${isUpper ? 'top-[70%]' : 'top-[15%]'} left-1/2 -translate-x-1/2 w-4 h-4 md:w-8 md:h-8 pointer-events-none opacity-80`}>
                        <img 
                            src={isBracketHook ? bracketGanchoImg : bracketImg} 
                            className="w-full h-full object-contain" 
                            style={{ 
                                transform: isUpper && isBracketHook ? 'rotate(180deg)' : 'none' 
                            }}
                        />
                    </div>
                )}

                {/* TAD Indicator (Contextual) */}
                {hasTad && !isActuallyExtracted && (
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 md:w-6 md:h-6 pointer-events-none opacity-90 brightness-110">
                        <img src={tadImg} className="w-full h-full object-contain" />
                    </div>
                )}
            </div>

            {/* Number BELOW for Lower Arch */}
            {!isUpper && NumberLabel}
        </div>
    );
}

function Quadrant({ teeth, teethStatus, globalToothStates, globalBrackets, globalTads, onToothClick, isUpper }) {
    return (
        <div className="flex items-end justify-center">
            {teeth.map(id => {
                const status = teethStatus[id];
                const isPendingExtraction = status && status.extraction === true;
                return (
                    <FrontalTooth
                        key={id}
                        id={id}
                        isPendingExtraction={isPendingExtraction}
                        globalState={globalToothStates[id]}
                        hasBracket={globalBrackets[id]}
                        hasTad={globalTads[id] || Object.keys(globalTads).some(k => k.includes(String(id)))}
                        onClick={onToothClick}
                        isUpper={isUpper}
                    />
                );
            })}
        </div>
    );
}

export default function FrontalOdontogram({ teethStatus, onStatusChange }) {
    const { id: patientId } = useParams();

    // Global Registry States (Loaded from LocalStorage)
    const [globalToothStates, setGlobalToothStates] = useState({});
    const [globalBrackets, setGlobalBrackets] = useState({});
    const [globalTads, setGlobalTads] = useState({});

    const loadGlobalOdontogram = useCallback(async () => {
        if (!patientId) return;
        try {
            const response = await odontogramService.getOdontogramByPatientId(patientId);
            const odontogram = response.data;
            if (!odontogram) return;

            // Mapear datos globales
            let global = odontogram.global_data || {};
            if (typeof global === 'string') {
                try { global = JSON.parse(global); } catch (e) { global = {}; }
            }

            if (global.brackets) setGlobalBrackets(global.brackets);
            if (global.tads) setGlobalTads(global.tads);

            // Mapear detalles por diente
            const newToothStates = {};
            const newBrackets = {};

            if (odontogram.details && Array.isArray(odontogram.details)) {
                odontogram.details.forEach(detail => {
                    const tid = detail.tooth_id;
                    let status = detail.status || {};
                    if (typeof status === 'string') {
                        try { status = JSON.parse(status); } catch (e) { status = {}; }
                    }

                    if (status.toothState) newToothStates[tid] = status.toothState;
                    if (status.brackets) newBrackets[tid] = status.brackets;
                });
            }

            // Sincronizar brackets (priorizar los del master si existen)
            setGlobalBrackets(prev => ({ ...prev, ...newBrackets }));
            setGlobalToothStates(newToothStates);

        } catch (err) {
            console.error('[FrontalOdontogram] Error loading global data from backend:', err);
        }
    }, [patientId]);

    useEffect(() => {
        loadGlobalOdontogram();
    }, [loadGlobalOdontogram]);

    const handleToothClick = (id) => {
        const currentStatus = teethStatus[id];
        const isExtracted = currentStatus && currentStatus.extraction === true;

        if (isExtracted) {
            onStatusChange(id, null);
        } else {
            onStatusChange(id, { extraction: true });
        }
    };

    return (
        <div className="flex flex-col items-center justify-center p-4 relative select-none">
            <div className="absolute inset-0 pointer-events-none opacity-5 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] dark:bg-[radial-gradient(#475569_1px,transparent_1px)] [background-size:20px_20px]"></div>

            <div className="relative z-0 scale-90 md:scale-100 transition-transform">
                <div className="text-center mb-6 text-xs font-bold tracking-[0.2em] text-slate-400 dark:text-slate-500 uppercase">
                    Superior (Maxilar)
                </div>

                <div className="flex items-end justify-center gap-1 md:gap-4 pb-6 border-b border-slate-200 dark:border-slate-700/50">
                    <Quadrant 
                        teeth={QUADRANTS.q1} 
                        teethStatus={teethStatus} 
                        globalToothStates={globalToothStates}
                        globalBrackets={globalBrackets}
                        globalTads={globalTads}
                        onToothClick={handleToothClick} 
                        isUpper={true} 
                    />
                    <div className="w-px h-20 bg-slate-200 dark:bg-slate-700 mx-1"></div>
                    <Quadrant 
                        teeth={QUADRANTS.q2} 
                        teethStatus={teethStatus} 
                        globalToothStates={globalToothStates}
                        globalBrackets={globalBrackets}
                        globalTads={globalTads}
                        onToothClick={handleToothClick} 
                        isUpper={true} 
                    />
                </div>

                <div className="flex items-start justify-center gap-1 md:gap-4 pt-6">
                    <Quadrant 
                        teeth={QUADRANTS.q4} 
                        teethStatus={teethStatus} 
                        globalToothStates={globalToothStates}
                        globalBrackets={globalBrackets}
                        globalTads={globalTads}
                        onToothClick={handleToothClick} 
                        isUpper={false} 
                    />
                    <div className="w-px h-20 bg-slate-200 dark:bg-slate-700 mx-1"></div>
                    <Quadrant 
                        teeth={QUADRANTS.q3} 
                        teethStatus={teethStatus} 
                        globalToothStates={globalToothStates}
                        globalBrackets={globalBrackets}
                        globalTads={globalTads}
                        onToothClick={handleToothClick} 
                        isUpper={false} 
                    />
                </div>

                <div className="text-center mt-6 text-xs font-bold tracking-[0.2em] text-slate-400 dark:text-slate-500 uppercase">
                    Inferior (Mandíbula)
                </div>
            </div>

            <div className="mt-6 flex items-center gap-2 text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/50 px-3 py-1.5 rounded-full border border-slate-100 dark:border-slate-800">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                <span>Seleccione los dientes a extraer</span>
            </div>
        </div>
    );
}

