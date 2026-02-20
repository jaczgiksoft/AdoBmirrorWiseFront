import React, { useState, useRef, useLayoutEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import bracketImg from '@/assets/images/odontogram/bracket.svg';
import tadImg from '@/assets/images/odontogram/tad.svg';
import SingleTooth from '@/components/ExtractionOrders/SingleTooth';
import ConfirmDialog from '@/components/feedback/ConfirmDialog';

// ==========================================
// 1. Asset Loading & Helpers
// ==========================================

// Load all tooth SVGs from all subfolders (original, root-canal, etc.)
const toothImages = import.meta.glob('@/assets/images/odontogram/*/*.svg', {
    eager: true,
    as: 'url'
});

// Helper to get image src by Tooth ID and Type
const getToothSrc = (id, type) => {
    // Try to find the specific type first
    const specificTypeEntry = Object.entries(toothImages).find(([path]) =>
        path.includes(`/odontogram/${type}/tooth-${id}.svg`)
    );

    if (specificTypeEntry) return specificTypeEntry[1];

    // Fallback to original if not found
    const originalEntry = Object.entries(toothImages).find(([path]) =>
        path.includes(`/odontogram/original/tooth-${id}.svg`)
    );

    return originalEntry ? originalEntry[1] : null;
};

// Helper to get display number (Permanent vs Deciduous)
const getDisplayNumber = (id, type) => {
    // Only 'deciduous' and 'pulpotomy' types trigger deciduous numbering
    if (type !== 'deciduous' && type !== 'pulpotomy') return id;

    const idStr = id.toString();
    const quadrant = parseInt(idStr[0]);
    const position = parseInt(idStr[1]);

    // Deciduous teeth only go up to 5
    if (position > 5) return id;

    let newQuadrant;
    switch (quadrant) {
        case 1: newQuadrant = 5; break;
        case 2: newQuadrant = 6; break;
        case 3: newQuadrant = 7; break;
        case 4: newQuadrant = 8; break;
        default: return id;
    }

    return parseInt(`${newQuadrant}${position}`);
};

// Helper to compute Pediatric ID for label display
const getPediatricId = (permanentId) => {
    const pid = String(permanentId);
    const quadrant = parseInt(pid[0]);
    const tooth = parseInt(pid[1]);

    // Molars 6, 7, 8 have no pediatric replacement in this slot position
    if (tooth > 5) return '–';

    // Quadrant mapping: 1->5, 2->6, 3->7, 4->8
    const pediatricQuadrant = quadrant + 4;
    return `${pediatricQuadrant}${tooth}`;
};

// ==========================================
// 2. Constants & Data Definition
// ==========================================

const TEETH_TO_SCALE = [
    18, 17, 16,
    26, 27, 28,
    36, 37, 38,
    46, 47, 48
];

const DENTAL_TYPES = [
    { id: 'original', label: 'Diente Base', color: 'text-emerald-700 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400' },
    { id: 'root-canal', label: 'Tratamiento de Endodoncia', color: 'text-pink-700 bg-pink-50 dark:bg-pink-900/20 dark:text-pink-400' },
    { id: 'extraction', label: 'Extracción Dental', color: 'text-slate-700 bg-slate-100 dark:bg-slate-800 dark:text-slate-400' },
    { id: 'missing', label: 'Diente Ausente', color: 'text-gray-600 bg-gray-50 dark:bg-gray-800 dark:text-gray-400' },
    { id: 'unerupted', label: 'Diente no erupcionado', color: 'text-purple-700 bg-purple-50 dark:bg-purple-900/20 dark:text-purple-400' },
    { id: 'implant', label: 'Implante Dental', color: 'text-blue-700 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400' },
    { id: 'crown', label: 'Corona Dental', color: 'text-amber-700 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400' },
    { id: 'fissure-full', label: 'Fisura Completa', color: 'text-red-700 bg-red-50 dark:bg-red-900/20 dark:text-red-400' },
    { id: 'fissure-crown', label: 'Fisura Corona', color: 'text-orange-700 bg-orange-50 dark:bg-orange-900/20 dark:text-orange-400' },
    { id: 'fissure-root', label: 'Fisura Raíz', color: 'text-rose-700 bg-rose-50 dark:bg-rose-900/20 dark:text-rose-400' },
    { id: 'deciduous', label: 'Diente Deciduo', color: 'text-cyan-700 bg-cyan-50 dark:bg-cyan-900/20 dark:text-cyan-400' },
    { id: 'pulpotomy', label: 'Pulpotomía', color: 'text-indigo-700 bg-indigo-50 dark:bg-indigo-900/20 dark:text-indigo-400' },
];

/**
 * FIXED FDI COORDINATE MAP
 * Defines the exact X offset (in pixels) from the center (0) for each tooth.
 * Negative values = Left of center (Patient Right)
 * Positive values = Right of center (Patient Left)
 */
const TOOTH_COORDINATES = {
    // Upper Right (Q1) - Compact Clinical Spacing (Touching)
    11: -25, 12: -64, 13: -105, 14: -147, 15: -189, 16: -239, 17: -295, 18: -350,
    // Upper Left (Q2)
    21: 25, 22: 64, 23: 105, 24: 147, 25: 189, 26: 239, 27: 295, 28: 350,
    // Lower Left (Q3)
    31: 19, 32: 63, 33: 105, 34: 148, 35: 191, 36: 242, 37: 293, 38: 344,
    // Lower Right (Q4)
    41: -19, 42: -63, 43: -105, 44: -148, 45: -191, 46: -242, 47: -293, 48: -344,
    // Note: Adjusted for visual contact. Anteriors ~42px, Premolars ~43px, Molars ~51px spacing.
};

/**
 * ANATOMICAL MICRO-ADJUSTMENTS
 * Additive pixel offsets to fine-tune specific tooth positions.
 * Used to create slightly more natural separation or tightness where needed without breaking the base grid.
 */
const MICRO_ADJUSTMENTS = {
    // UPPER ARCH
    // Increase separation 11-12 (Move 12...18 Left/Out)
    12: -3, 13: -3, 14: -3, 15: -3, 16: -3, 17: -6, 18: -6, // 17,18 extra lateral
    // Increase separation 21-22 (Move 22...28 Right/Out)
    22: 3, 23: 3, 24: 3, 25: 3, 26: 3, 27: 6, 28: 6, // 27,28 extra lateral

    // LOWER ARCH
    // Decrease separation 41-42 (Move 42...48 Right/In)
    // Base 42 is -63. Target closer to 41 (-21). Move right (+)
    42: 9, 43: 10, 44: 10, 45: 9, 46: 6, 47: -3, 48: -8, // 47,48 slight lateral output relative to the shift

    // Decrease separation 31-32 (Move 32...38 Left/In)
    // Base 32 is 63. Target closer to 31 (21). Move left (-)
    32: -9, 33: -10, 34: -10, 35: -9, 36: -6, 37: 3, 38: 8 // 37,38 slight lateral output relative to the shift
};

// Define quadrants purely for iteration purposes (rendering order doesn't matter for layout now, but good for data)
const QUADRANTS = {
    q1: [18, 17, 16, 15, 14, 13, 12, 11],
    q2: [21, 22, 23, 24, 25, 26, 27, 28],
    q3: [31, 32, 33, 34, 35, 36, 37, 38],
    q4: [48, 47, 46, 45, 44, 43, 42, 41]
};

// Helpers for Arch Groups
const UPPER_ARCH_IDS = [...QUADRANTS.q1, ...QUADRANTS.q2]; // 18...28
const LOWER_ARCH_IDS = [...QUADRANTS.q4, ...QUADRANTS.q3]; // 48...38

// ==========================================
// 3. Components
// ==========================================

// Individual Tooth Component (Frontal) - Unchanged visuals
function Tooth({ id, type, hasBracket, isBracketMode, onToothClick, currentClinicalAction, onResize }) {
    const src = getToothSrc(id, type || 'original');
    const containerRef = useRef(null);

    // Measure width on mount/update
    useLayoutEffect(() => {
        if (containerRef.current && onResize) {
            const { offsetWidth } = containerRef.current;
            onResize(id, offsetWidth);
        }
    }, [id, onResize, src]); // Re-measure if src changes (loading different tooth)

    const shouldScale = TEETH_TO_SCALE.includes(id);

    // Check for "Permanent Molar in Deciduous Mode" (Positions 6, 7, 8)
    const isDeciduousMode = currentClinicalAction === 'deciduous' || currentClinicalAction === 'pulpotomy';
    const position = parseInt(id.toString()[1]);
    const isInvalidDeciduous = isDeciduousMode && position > 5;

    // Calculate display number based on type
    let displayNumber = getDisplayNumber(id, type);
    if (isInvalidDeciduous) {
        displayNumber = '–';
    }

    const isMaxillary = id < 30;
    const bracketPositionClass = isMaxillary ? 'top-[75%]' : 'top-[15%]';

    if (!src) {
        return (
            <div className="w-11 h-16 md:w-14 md:h-20 flex items-center justify-center bg-red-100 text-red-500 text-xs rounded border border-red-200">
                {id}?
            </div>
        );
    }

    const wrapperClasses = `flex flex-col items-center gap-2 group relative -mx-[2px] transition-all 
        ${isInvalidDeciduous
            ? 'opacity-20 grayscale cursor-not-allowed'
            : `hover:z-20 ${isBracketMode ? 'cursor-pointer' : 'cursor-pointer'}`}`;

    const labelClasses = `text-[10px] md:text-xs font-bold transition-colors${isInvalidDeciduous
        ? 'text-slate-200 dark:text-slate-700'
        : (hasBracket ? 'text-blue-600 dark:text-blue-400' : 'text-slate-300 group-hover:text-slate-600 dark:group-hover:text-slate-200')
        }`;

    return (
        <div
            className={wrapperClasses}
            onClick={() => !isInvalidDeciduous && onToothClick(id)}
        >
            {/* Tooth Image Container - Reverted to auto width for natural aspect ratio centering */}
            <div
                ref={containerRef}
                className={`
                    relative h-40
                    flex items-end justify-center
                    transition-transform duration-300
                    ${!isInvalidDeciduous && (isBracketMode ? 'hover:scale-105' : 'hover:scale-105')}
                    z-10
                `}>
                <img
                    src={src}
                    alt={`Tooth ${id}`}
                    draggable={false}
                    className={`
    w-full h-full object-contain
    drop-shadow-sm transition-transform
    ${shouldScale ? 'scale-x-95' : ''}
  `}
                />

                {/* Bracket Overlay */}
                <AnimatePresence>
                    {hasBracket && !isInvalidDeciduous && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.5, y: -5 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.5 }}
                            className={`absolute ${bracketPositionClass} left-1/2 -translate-x-1/2 z-20 pointer-events-none`}
                        >
                            <img
                                src={bracketImg}
                                alt="Bracket"
                                className="w-2.5 h-2.5 md:w-5 md:h-5 object-contain opacity-90 drop-shadow-sm"
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
            {/* Tooth Number Label */}
            <div className="flex flex-col items-center leading-none select-none">
                <span className={labelClasses}>
                    {displayNumber}
                </span>
            </div>
        </div >
    );
}

// Interproximal Zone Component (Absolute Positioned)
function InterproximalZone({ t1, t2, hasTad, isTadMode, onClick, xPos, isUpper }) {
    return (
        <div
            className="absolute z-30 flex flex-col items-center justify-end"
            style={{
                left: `calc(50% + ${xPos}px)`,
                transform: 'translateX(-50%)',
                bottom: 0,
                top: 0, // Fill height
                width: '2px'
            }}
        >
            {/* Hit box */}
            <div
                className={`absolute inset-y-0 -left-1.5 -right-1.5 z-40 transition-colors duration-200 
                ${isTadMode
                        ? 'cursor-pointer hover:bg-blue-400/30'
                        : 'pointer-events-none'
                    }
                `}
                onClick={() => isTadMode && onClick(t1, t2)}
                title={isTadMode ? `Colocar TAD entre ${t1} y ${t2}` : ''}
            />

            {/* TAD Visualization */}
            <AnimatePresence>
                {hasTad && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0 }}
                        className={`
                            absolute left-1/2 -translate-x-1/2 -translate-y-1/2
                            pointer-events-none flex items-center justify-center
                            w-3 md:w-2.5
                            ${isUpper ? 'top-[35%]' : 'bottom-[50%]'}
                        `}
                    >
                        <img
                            src={tadImg}
                            alt="TAD"
                            className={`w-full h-auto drop-shadow-md opacity-90 ${!isUpper ? 'rotate-180' : ''}`}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// ==========================================
// 4. Layout Components (New Coordinate System)
// ==========================================

function ArchRow({ teethIds, toothStates, brackets, tads, isBracketMode, isTadMode, onToothClick, onTadClick, currentClinicalAction, onToothResize, isUpper }) {
    // Generate TAD slots based on teeth list
    // Iterate through pairable teeth (e.g. 18-17, 17-16...)
    // Since teethIds includes both Left and Right, we need to be careful not to create a TAD across the midline (11-21) if not desired.
    // Usually TADs are interproximal within a quadrant.
    // We will assume TADs exist between any adjacent indices in the provided list, EXCEPT if gap is too large (like midline).
    // Actually, midline TADS are possible.

    const renderTads = () => {
        const tadElements = [];
        // We iterate and look at current + next
        // Use tooth index to find neighbors in the list
        // Note: the list is [18, 17... 11, 21 ... 28] for upper
        for (let i = 0; i < teethIds.length - 1; i++) {
            const t1 = teethIds[i];
            const t2 = teethIds[i + 1];

            // Gap check: Midline (11-21) or (41-31)
            // If we want to allow midline TADs, we keep this.
            // If not, we skip. Let's allow valid pairs.
            // Key convention: smaller-larger
            const pairId = [t1, t2].sort((a, b) => a - b).join('-');
            const hasTad = !!tads[pairId];

            // Calculate Position with Micro-Adjustments
            let x1 = TOOTH_COORDINATES[t1];
            let x2 = TOOTH_COORDINATES[t2];

            // If coordinates missing, skip
            if (x1 === undefined || x2 === undefined) continue;

            // Apply Micro Adjustments
            x1 += (MICRO_ADJUSTMENTS[t1] || 0);
            x2 += (MICRO_ADJUSTMENTS[t2] || 0);

            const midX = (x1 + x2) / 2;

            tadElements.push(
                <InterproximalZone
                    key={`tad-${pairId}`}
                    t1={t1}
                    t2={t2}
                    hasTad={hasTad}
                    isTadMode={isTadMode}
                    onClick={onTadClick}
                    xPos={midX}
                    isUpper={isUpper}
                />
            );
        }
        return tadElements;
    };

    return (
        <div className={`relative w-full ${isUpper ? 'h-48 flex items-end' : 'h-48 flex items-start'} mb-1`}>
            {/* Render Tooth Slots */}
            {teethIds.map(id => {
                let xPos = TOOTH_COORDINATES[id];
                if (xPos === undefined) return null; // Should not happen

                // Apply Micro-Adjustment
                xPos += (MICRO_ADJUSTMENTS[id] || 0);

                return (
                    <div
                        key={id}
                        className="absolute"
                        style={{
                            left: `calc(50% + ${xPos}px)`,
                            transform: 'translateX(-50%)',
                            bottom: isUpper ? 0 : 'auto',
                            top: isUpper ? 'auto' : 0,
                        }}
                    >
                        <Tooth
                            id={id}
                            type={toothStates[id]}
                            hasBracket={!!brackets[id]}
                            isBracketMode={isBracketMode}
                            onToothClick={isTadMode ? () => { } : onToothClick}
                            currentClinicalAction={currentClinicalAction}
                            onResize={onToothResize}
                        />
                    </div>
                );
            })}

            {/* Render TADs */}
            {renderTads()}
        </div>
    );
}

function OcclusalArchRow({ teethIds, surfaceStates, toothStates, onSurfaceClick, toothWidths }) {
    return (
        <div className="relative w-full h-12 mb-0">
            {teethIds.map(id => {
                let xPos = TOOTH_COORDINATES[id];
                if (xPos === undefined) return null;

                // Apply Micro-Adjustment
                xPos += (MICRO_ADJUSTMENTS[id] || 0);

                const isExtracted = toothStates[id] === 'extraction';
                const status = isExtracted ? { extraction: true } : (surfaceStates[id] || {});

                // Calculate Dynamic Size based on Frontal Width
                // Use default if not yet measured (e.g. 45px)
                const frontalWidth = toothWidths[id] || 45;
                const occlusalSize = frontalWidth * 0.65; // 65% of frontal width

                return (
                    <div
                        key={id}
                        className="absolute origin-center"
                        style={{
                            left: `calc(50% + ${xPos}px)`,
                            transform: 'translateX(-50%)', // Removed scale(0.85) to rely on explicit size
                            top: '10px'
                        }}
                    >
                        <div className="relative group -my-1">
                            <SingleTooth
                                pediatricId={getPediatricId(id)}
                                status={status}
                                selectedMode="treatment"
                                onClick={(toothId, area) => onSurfaceClick(toothId, area)}
                                showLabels={false}
                                strokeColor="stroke-black"
                                size={occlusalSize}
                                colorScheme="neutral"
                            />
                            {isExtracted && (
                                <div className="absolute inset-0 bg-slate-100/80 dark:bg-slate-800/80 flex items-center justify-center rounded cursor-not-allowed z-10 backdrop-grayscale pointer-events-none">
                                    <span className="text-[8px] font-bold text-red-500 uppercase -rotate-45 border border-red-500 px-0.5 rounded">
                                        Extr.
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}


// ==========================================
// 5. Support Components (Summary, Actions, Modal)
// ==========================================

function ClinicalActionModal({ isOpen, onClose, onSelect }) {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-lg w-full p-6"
            >
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">
                    Seleccionar Tratamiento
                </h3>

                <div className="grid grid-cols-2 gap-3 mb-6">
                    {/* Normal / Base Option */}
                    <button
                        onClick={() => onSelect('normal')}
                        className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-slate-600 dark:text-slate-300 font-medium transition-all text-sm flex items-center gap-2"
                    >
                        <div className="w-3 h-3 rounded-full bg-slate-300"></div>
                        Limpiar / Normal
                    </button>

                    {/* Dynamic Options */}
                    {DENTAL_TYPES.filter(t => t.id !== 'original' && t.id !== 'deciduous' && t.id !== 'pulpotomy').map(type => (
                        <button
                            key={type.id}
                            onClick={() => onSelect(type.id)}
                            className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-slate-600 dark:text-slate-300 font-medium transition-all text-sm flex items-center gap-2"
                        >
                            <div className={`w-3 h-3 rounded-full ${type.color.replace('text-', 'bg-').split(' ')[0]}`}></div>
                            {type.label}
                        </button>
                    ))}
                </div>

                <div className="flex justify-end">
                    <button
                        type="button"
                        onClick={onClose}
                        className="btn btn-sm btn-ghost"
                    >
                        Cancelar
                    </button>
                </div>
            </motion.div>
        </div>
    );
}

function DentalSummary({ toothStates }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const stats = DENTAL_TYPES.map(type => {
        const count = Object.values(toothStates).filter(t => t === type.id).length;
        return { ...type, count };
    });
    const visibleStats = isExpanded ? stats : stats.filter(s => s.count > 0);

    return (
        <div className="bg-white dark:bg-[var(--color-secondary)] rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden transition-all duration-300">
            <div className="p-4 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                <AnimatePresence initial={false} mode='wait'>
                    {visibleStats.map(stat => (
                        <motion.div
                            key={stat.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            layout
                            className={`p-3 rounded-lg border border-transparent ${stat.color} flex flex-col items-center justify-center text-center`}
                        >
                            <span className="text-2xl font-bold leading-none mb-1">{stat.count}</span>
                            <span className="text-[10px] font-bold uppercase tracking-wider opacity-90 leading-tight">{stat.label}</span>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/50 px-4 py-2 flex justify-center border-t border-slate-100 dark:border-slate-700/50">
                <button
                    type="button"
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="text-xs font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors flex items-center gap-1 focus:outline-none"
                >
                    {isExpanded ? 'Ver menos' : 'Ver resumen completo'}
                    <svg className={`w-3 h-3 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </button>
            </div>
        </div>
    );
}

function ModeCheckbox({ checked, onChange, label, color = 'blue' }) {
    const isBlue = color === 'blue';
    const activeColor = isBlue ? 'bg-blue-500 border-blue-500 shadow-blue-500/25' : 'bg-sky-500 border-sky-500 shadow-sky-500/25';

    return (
        <label className="group flex items-center gap-3 cursor-pointer select-none relative px-3 py-2 rounded-xl transition-all duration-300 hover:bg-slate-50 dark:hover:bg-slate-800/50">
            <input type="checkbox" className="peer sr-only" checked={checked} onChange={onChange} />
            <div className={`
                w-5 h-5 md:w-6 md:h-6 rounded-[6px] border-[2px] flex items-center justify-center transition-all duration-300 ease-out shadow-sm
                ${checked
                    ? `${activeColor} scale-100`
                    : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 group-hover:border-slate-400 dark:group-hover:border-slate-500'
                }
            `}>
                <svg className={`w-3.5 h-3.5 md:w-4 md:h-4 text-white transform transition-all duration-300 ease-spring ${checked ? 'scale-100 opacity-100 rotate-0' : 'scale-50 opacity-0 -rotate-90'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 13l4 4L19 7" />
                </svg>
            </div>
            <span className={`text-sm font-semibold transition-colors duration-200 ${checked ? 'text-slate-800 dark:text-slate-100' : 'text-slate-600 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-300'}`}>
                {label}
            </span>
            {checked && (<div className={`absolute inset-0 rounded-xl opacity-10 pointer-events-none ${isBlue ? 'bg-blue-500' : 'bg-sky-500'}`} />)}
        </label>
    );
}

function ActionPanel({ isBracketMode, setBracketMode, isTadMode, setTadMode, onApplyAll, selectedToothType, setSelectedToothType, onReset }) {
    return (
        <div className="bg-white dark:bg-[var(--color-secondary)] p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm mt-6 flex flex-col md:flex-row items-center justify-between gap-4">
            {/* General Actions */}
            <div className="flex items-center gap-4 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
                <label className="text-sm font-medium text-slate-600 dark:text-slate-300 whitespace-nowrap hidden md:block">
                    Acción Clínica:
                </label>
                <select
                    className="input input-sm md:input-md w-full md:w-48 border-slate-300 dark:border-slate-600"
                    disabled={isBracketMode || isTadMode}
                    value={selectedToothType}
                    onChange={(e) => setSelectedToothType(e.target.value)}
                >
                    {DENTAL_TYPES.map(t => (
                        <option key={t.id} value={t.id}>{t.label}</option>
                    ))}
                </select>
                <button
                    type="button"
                    className="btn btn-primary btn-sm md:btn-md shadow-sm"
                    disabled={isBracketMode || isTadMode}
                >
                    Aplicar
                </button>
                <button
                    type="button"
                    onClick={onReset}
                    className="btn btn-sm md:btn-md bg-white dark:bg-slate-700 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 hover:text-red-600 border border-slate-200 dark:border-slate-600 shadow-sm transition-colors whitespace-nowrap"
                    title="Limpiar todo el odontograma"
                >
                    Limpiar odontograma
                </button>
            </div>
            <div className="hidden md:block w-px h-8 bg-slate-400 dark:bg-slate-700 mx-1"></div>
            <div className="flex items-center gap-2 md:gap-4 w-full md:w-auto justify-between md:justify-end flex-wrap md:flex-nowrap">
                <ModeCheckbox label="Colocar TADs" checked={isTadMode} onChange={(e) => setTadMode(e.target.checked)} color="sky" />
                <ModeCheckbox label="Colocar Brackets" checked={isBracketMode} onChange={(e) => setBracketMode(e.target.checked)} color="blue" />
                <AnimatePresence>
                    {isBracketMode && (
                        <motion.button
                            initial={{ opacity: 0, scale: 0.9, width: 0 }}
                            animate={{ opacity: 1, scale: 1, width: 'auto' }}
                            exit={{ opacity: 0, scale: 0.9, width: 0 }}
                            onClick={onApplyAll}
                            type="button"
                            className="btn btn-sm btn-secondary shadow-sm ml-2 overflow-hidden whitespace-nowrap"
                        >
                            Aplicar a todos
                        </motion.button>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

// ==========================================
// 6. Main Component
// ==========================================

export default function OdontogramSection() {
    // Initial State: All teeth are 'original'
    const [toothStates, setToothStates] = useState(() => {
        const initial = {};
        Object.values(QUADRANTS).flat().forEach(id => {
            initial[id] = 'original';
        });
        return initial;
    });

    const [brackets, setBrackets] = useState({});
    const [tads, setTads] = useState({});
    const [isBracketMode, setIsBracketMode] = useState(false);
    const [isTadMode, setIsTadMode] = useState(false);

    const setBracketMode = (val) => {
        setIsBracketMode(val);
        if (val) setIsTadMode(false);
    };

    const setTadMode = (val) => {
        setIsTadMode(val);
        if (val) setIsBracketMode(false);
    };

    const [selectedToothType, setSelectedToothType] = useState('original');
    const [surfaceStates, setSurfaceStates] = useState({});
    const [selectedSurface, setSelectedSurface] = useState(null);
    const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);

    // Store measured widths of frontal teeth
    const [toothWidths, setToothWidths] = useState({});

    const handleToothResize = useCallback((id, width) => {
        setToothWidths(prev => {
            if (prev[id] === width) return prev; // No change
            return { ...prev, [id]: width };
        });
    }, []);

    const handleToothClick = (id) => {
        if (isBracketMode) {
            setBrackets(prev => ({ ...prev, [id]: !prev[id] }));
        } else {
            setToothStates(prev => ({ ...prev, [id]: selectedToothType }));
        }
    };

    const handleSurfaceClick = (id, area) => {
        if (toothStates[id] === 'extraction') return;
        setSelectedSurface({ id, area });
    };

    const handleClinicalAction = (action) => {
        if (!selectedSurface) return;
        const { id, area } = selectedSurface;
        setSurfaceStates(prev => {
            const currentToothState = prev[id] || {};
            const newAreaState = action === 'normal' ? null : action;
            const newToothState = { ...currentToothState, [area]: newAreaState };
            return { ...prev, [id]: newToothState };
        });
        setSelectedSurface(null);
    };

    const handleTadClick = (t1, t2) => {
        const pairId = [t1, t2].sort((a, b) => a - b).join('-');
        setTads(prev => ({ ...prev, [pairId]: !prev[pairId] }));
    };

    const handleApplyAllBrackets = () => {
        const newBrackets = { ...brackets };
        Object.values(QUADRANTS).flat().forEach(id => {
            if (!newBrackets[id]) newBrackets[id] = true;
        });
        setBrackets(newBrackets);
    };

    const handleResetOdontogram = () => {
        const initialStates = {};
        Object.values(QUADRANTS).flat().forEach(id => {
            initialStates[id] = 'original';
        });
        setToothStates(initialStates);
        setBrackets({});
        setTads({});
        setSurfaceStates({});
        setIsBracketMode(false);
        setIsTadMode(false);
        setSelectedToothType('original');
        setIsResetDialogOpen(false);
    };

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-1 space-y-6">
            {/* 1. Summary Section */}
            <DentalSummary toothStates={toothStates} />

            {/* 2. Odontogram Visualization */}
            <div className={`bg-white dark:bg-[var(--color-secondary)] border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm p-4 flex flex-col items-center relative overflow-hidden transition-colors 
                ${isBracketMode ? 'ring-2 ring-blue-500/20 border-blue-200 dark:border-blue-900/30' : ''}
                ${isTadMode ? 'ring-2 ring-sky-500/20 border-sky-200 dark:border-sky-900/30' : ''}
            `}>
                <div className="w-full mb-4 flex items-center justify-between z-10 relative">
                    <div>
                        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                            Odontograma Actual
                            {isBracketMode && <span className="badge badge-sm badge-info gap-1 font-normal">Modo Ortodoncia (Brackets)</span>}
                            {isTadMode && <span className="badge badge-sm badge-info gap-1 font-normal">Modo Ortodoncia (TADs)</span>}
                        </h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Vista general del estado dental del paciente.</p>
                    </div>
                </div>

                <div className="absolute inset-0 pointer-events-none opacity-5 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] dark:bg-[radial-gradient(#475569_1px,transparent_1px)] [background-size:20px_20px]"></div>

                {/* COORDINATE BASED LAYOUT CONTAINER */}
                {/* We use min-w-[950px] to ensure the fixed coordinates fit without wrapping, adding x-scroll if needed on small screens */}
                <div className="relative z-0 scale-100 xl:scale-110 transition-transform origin-top mt-4 mb-4 overflow-x-auto w-full flex justify-center">
                    <div className="relative min-w-[1000px] pb-4">

                        {/* Labels */}
                        <div className="text-center mb-2 text-[15px] font-bold tracking-[0.2em] text-slate-600 dark:text-white uppercase select-none">
                            Superior (Maxilar)
                        </div>

                        {/* === UPPER ARCH === */}
                        <div className="relative flex flex-col w-full">
                            {/* CENTER DIVIDER */}
                            <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-px bg-slate-400 dark:bg-slate-700 z-0"></div>

                            {/* ROW 1: FRONTAL */}
                            <ArchRow
                                teethIds={UPPER_ARCH_IDS}
                                toothStates={toothStates}
                                brackets={brackets}
                                tads={tads}
                                isBracketMode={isBracketMode}
                                isTadMode={isTadMode}
                                onToothClick={handleToothClick}
                                onTadClick={handleTadClick}
                                currentClinicalAction={selectedToothType}
                                onToothResize={handleToothResize}
                                isUpper={true}
                            />

                            {/* ROW 2: OCCLUSAL */}
                            <div className="border-b border-slate-400 dark:border-slate-700/50 w-full mb-0">
                                <OcclusalArchRow
                                    teethIds={UPPER_ARCH_IDS}
                                    surfaceStates={surfaceStates}
                                    toothStates={toothStates}
                                    onSurfaceClick={handleSurfaceClick}
                                    toothWidths={toothWidths}
                                />
                            </div>
                        </div>

                        {/* === LOWER ARCH === */}
                        <div className="relative flex flex-col w-full">
                            {/* CENTER DIVIDER */}
                            <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-px bg-slate-400 dark:bg-slate-700 z-0"></div>

                            {/* ROW 3: OCCLUSAL */}
                            <div className="w-full mt-0">
                                <OcclusalArchRow
                                    teethIds={LOWER_ARCH_IDS}
                                    surfaceStates={surfaceStates}
                                    toothStates={toothStates}
                                    onSurfaceClick={handleSurfaceClick}
                                    toothWidths={toothWidths}
                                />
                            </div>

                            {/* ROW 4: FRONTAL */}
                            <ArchRow
                                teethIds={LOWER_ARCH_IDS}
                                toothStates={toothStates}
                                brackets={brackets}
                                tads={tads}
                                isBracketMode={isBracketMode}
                                isTadMode={isTadMode}
                                onToothClick={handleToothClick}
                                onTadClick={handleTadClick}
                                currentClinicalAction={selectedToothType}
                                onToothResize={handleToothResize}
                                isUpper={false}
                            />
                        </div>

                        {/* Labels */}
                        <div className="text-center mt-2 mb-15 text-[15px] font-bold tracking-[0.2em] text-slate-600 dark:text-white uppercase select-none">
                            Inferior (Mandíbula)
                        </div>

                        {/* Side Labels */}
                        <div className="absolute top-1/2 left-4 -translate-y-1/2 -rotate-90 text-[15px] font-bold tracking-[0.2em] text-slate-600 dark:text-white select-none">
                            DERECHO
                        </div>
                        <div className="absolute top-1/2 right-4 -translate-y-1/2 rotate-90 text-[15px] font-bold tracking-[0.2em] text-slate-600 dark:text-white select-none">
                            IZQUIERDO
                        </div>

                    </div>
                </div>
            </div>

            {/* 3. Actions Section */}
            <ActionPanel
                isBracketMode={isBracketMode}
                setBracketMode={setBracketMode}
                isTadMode={isTadMode}
                setTadMode={setTadMode}
                onApplyAll={handleApplyAllBrackets}
                selectedToothType={selectedToothType}
                setSelectedToothType={setSelectedToothType}
                onReset={() => setIsResetDialogOpen(true)}
            />

            {/* 4. Clinical Action Modal */}
            <ClinicalActionModal
                isOpen={!!selectedSurface}
                onClose={() => setSelectedSurface(null)}
                onSelect={handleClinicalAction}
            />

            <ConfirmDialog
                isOpen={isResetDialogOpen}
                title="Limpiar Odontograma"
                message="¿Estás seguro de que deseas limpiar todo el odontograma? Esta acción no se puede deshacer."
                confirmText="Sí, limpiar todo"
                cancelText="Cancelar"
                onConfirm={handleResetOdontogram}
                onCancel={() => setIsResetDialogOpen(false)}
                variant="danger"
            />
        </motion.div>
    );
}
