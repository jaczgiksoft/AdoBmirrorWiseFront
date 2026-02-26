import React, { useState, useRef, useLayoutEffect, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import bracketImg from '@/assets/images/odontogram/bracket.svg';
import tadImg from '@/assets/images/odontogram/tad.svg';
import SingleTooth from '@/components/ExtractionOrders/SingleTooth';
import ConfirmDialog from '@/components/feedback/ConfirmDialog';
import RadialMenu from '@/components/odontogram/RadialMenu';

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
const INACTIVE_TYPES = ['extraction', 'missing', 'unerupted'];
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

const OCCLUSAL_TYPES = [
    { id: 'normal', label: 'Limpiar / Normal', color: 'bg-white' },

    // Caries → café
    {
        id: 'caries',
        label: 'Carie',
        color: 'bg-amber-100 border-amber-300 text-amber-800'
    },

    // Restauración → azul
    {
        id: 'restoration',
        label: 'Restauración',
        color: 'bg-slate-100 border-sky-300 text-sky-700'
    },

    // Fractura → amarillo
    // {
    //     id: 'fracture',
    //     label: 'Fractura',
    //     color: 'bg-yellow-100 border-yellow-300 text-yellow-700'
    // }
];

/**
 * FIXED FDI COORDINATE MAP
 * Defines the exact X offset (in pixels) from the center (0) for each tooth.
 * Negative values = Left of center (Patient Right)
 * Positive values = Right of center (Patient Left)
 */
const TOOTH_COORDINATES = {
    // Upper Right (Q1) - Compact Clinical Spacing (Touching)
    11: -30, 12: -70, 13: -110, 14: -153, 15: -195, 16: -245, 17: -300, 18: -358,
    // Upper Left (Q2)
    21: 30, 22: 70, 23: 110, 24: 153, 25: 195, 26: 245, 27: 300, 28: 358,
    // Lower Left (Q3)
    31: 23, 32: 68, 33: 108, 34: 151, 35: 195, 36: 246, 37: 297, 38: 349,
    // Lower Right (Q4)
    41: -23, 42: -68, 43: -108, 44: -151, 45: -195, 46: -246, 47: -297, 48: -349,
    // Note: Adjusted for visual contact. Anteriors ~42px, Premolars ~43px, Molars ~51px spacing.
};

/**
 * ANATOMICAL MICRO-ADJUSTMENTS
 * Additive pixel offsets to fine-tune specific tooth positions.
 * Used to create slightly more natural separation or tightness where needed without breaking the base grid.
 */
const MICRO_ADJUSTMENTS_PERMANENT = {
    // UPPER ARCH
    12: -3, 13: -3, 14: -3, 15: -5, 16: -3, 17: -6, 18: -6,
    22: 3, 23: 3, 24: 3, 25: 5, 26: 3, 27: 6, 28: 6,

    // LOWER ARCH
    42: 9, 43: 10, 44: 10, 45: 9, 46: 6, 47: -3, 48: -8,
    32: -9, 33: -10, 34: -10, 35: -9, 36: -6, 37: 3, 38: 8
};

const MICRO_ADJUSTMENTS_DECIDUOUS = {
    // UPPER RIGHT (Q1)
    11: -0,
    12: -3,
    13: -4,
    14: -12,
    15: -16,

    // UPPER LEFT (Q2)
    21: 0,
    22: 3,
    23: 4,
    24: 12,
    25: 16,

    // LOWER LEFT (Q3)
    31: -3,
    32: -10,
    33: -12,
    34: -0,
    35: 5,

    // LOWER RIGHT (Q4)
    41: 3,
    42: 10,
    43: 12,
    44: 0,
    45: -5,
};

const TAD_MICRO_ADJUSTMENTS = {
    // UPPER RIGHT (Q1)
    "16-17": -2,
    "15-16": 6,
    "14-15": -2,
    "13-14": -2,
    "12-13": 2,
    "11-12": -1,

    // UPPER LEFT (Q2)
    "21-22": 0,
    "22-23": -2,
    "23-24": 1,
    "24-25": 2,
    "25-26": -6,
    "26-27": 2,

    // LOWER RIGHT (Q4)
    "46-47": -5,
    "45-46": 4.5,
    "44-45": -1,
    "43-44": -1,
    "42-43": 2,
    "41-42": 0,

    // LOWER LEFT (Q3)
    "31-32": -1,
    "32-33": -2,
    "33-34": 1,
    "34-35": 0,
    "35-36": -5,
    "36-37": 3.5,
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

// Derived Initial State Generator (Factory Function)
const buildInitialToothStates = () => {
    const initial = {};
    Object.values(QUADRANTS).flat().forEach(id => {
        initial[id] = 'original';
    });
    return initial;
};

// ==========================================
// 3. Components
// ==========================================

// Individual Tooth Component (Frontal) - Unchanged visuals
function Tooth({ id, type, hasBracket, isBracketMode, onToothClick, onToothRightClick, currentClinicalAction, onResize }) {
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
    const bracketPositionClass = isMaxillary ? 'top-[75%]' : 'top-[12%]';

    if (!src) {
        return (
            <div className="w-11 h-16 md:w-14 md:h-20 flex items-center justify-center bg-red-100 text-red-500 text-xs rounded border border-red-200">
                {id}?
            </div>
        );
    }

    const wrapperClasses = `flex flex-col items-center gap-2 group relative -mx-[2px] transition-all transform-gpu will-change-transform
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
            onContextMenu={(e) => {
                e.preventDefault();
                if (isInvalidDeciduous || !onToothRightClick) return;
                const rect = e.currentTarget.getBoundingClientRect();
                const x = rect.left + rect.width / 2;
                const y = rect.top + rect.height / 2;
                onToothRightClick(id, x, y);
            }}
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
                            ${isUpper ? 'top-[35%]' : 'bottom-[45%]'}
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

const getDynamicOffset = (
    id,
    toothStates,
    toothWidths,
    baseToothWidths
) => {
    if (TOOTH_COORDINATES[id] === undefined) return undefined;

    const type = toothStates[id];

    const adjustmentMap =
        type === 'deciduous' || type === 'pulpotomy'
            ? MICRO_ADJUSTMENTS_DECIDUOUS
            : MICRO_ADJUSTMENTS_PERMANENT;

    let base = TOOTH_COORDINATES[id] + (adjustmentMap[id] || 0);

    const quadrant = parseInt(String(id)[0], 10);
    const targetCoord = TOOTH_COORDINATES[id];

    let accumulatedDelta = 0;

    for (let i = 1; i <= 8; i++) {
        const currentId = parseInt(`${quadrant}${i}`, 10);
        const currentType = toothStates[currentId];

        if (currentType !== 'deciduous' && currentType !== 'pulpotomy') continue;

        const permanentWidth = baseToothWidths[currentId];
        const deciduousWidth = toothWidths[currentId] || permanentWidth;

        if (!permanentWidth) continue;

        const delta = deciduousWidth - permanentWidth;
        if (delta <= 0) continue;

        const currentCoord = TOOTH_COORDINATES[currentId];

        const isMesial =
            (quadrant === 1 || quadrant === 4)
                ? currentCoord > targetCoord
                : currentCoord < targetCoord;

        if (isMesial) {
            accumulatedDelta += delta;
        }
    }

    if (accumulatedDelta !== 0) {
        if (quadrant === 1 || quadrant === 4) {
            base -= accumulatedDelta;
        } else {
            base += accumulatedDelta;
        }
    }

    return base;
};

function ArchRow({ teethIds, toothStates, brackets, tads, isBracketMode, isTadMode, onToothClick, onToothRightClick, onTadClick, currentClinicalAction, onToothResize, toothWidths, baseToothWidths, isUpper }) {
    // Generate TAD slots based on teeth list
    // Iterate through pairable teeth (e.g. 18-17, 17-16...)
    // Since teethIds includes both Left and Right, we need to be careful not to create a TAD across the midline (11-21) if not desired.
    // Usually TADs are interproximal within a quadrant.
    // We will assume TADs exist between any adjacent indices in the provided list, EXCEPT if gap is too large (like midline).
    // Actually, midline TADS are possible.

    const renderTads = () => {
        const tadElements = [];

        for (let i = 0; i < teethIds.length - 1; i++) {
            const t1 = teethIds[i];
            const t2 = teethIds[i + 1];

            const quadrant1 = parseInt(String(t1)[0]);
            const quadrant2 = parseInt(String(t2)[0]);

            const pos1 = parseInt(String(t1)[1]);
            const pos2 = parseInt(String(t2)[1]);

            // -----------------------------
            // 1️⃣ Deben ser del mismo cuadrante
            // -----------------------------
            if (quadrant1 !== quadrant2) continue;

            // -----------------------------
            // 2️⃣ No permitir línea media
            // (11-21 y 31-41)
            // -----------------------------
            const pairKey = `${t1}-${t2}`;
            if (pairKey === "11-21" || pairKey === "21-11" ||
                pairKey === "31-41" || pairKey === "41-31") {
                continue;
            }

            // -----------------------------
            // 3️⃣ Ambos deben ser permanentes
            // -----------------------------
            if (
                toothStates[t1] === 'deciduous' ||
                toothStates[t1] === 'pulpotomy' ||
                toothStates[t2] === 'deciduous' ||
                toothStates[t2] === 'pulpotomy'
            ) continue;

            // -----------------------------
            // 4️⃣ No después del tercer molar
            // (si alguno es posición 8)
            // -----------------------------
            if (pos1 === 8 || pos2 === 8) continue;

            // -----------------------------
            // Si pasó todas las reglas → permitido
            // -----------------------------

            const pairId = [t1, t2].sort((a, b) => a - b).join('-');
            const hasTad = !!tads[pairId];

            const x1 = getDynamicOffset(t1, toothStates, toothWidths, baseToothWidths);
            const x2 = getDynamicOffset(t2, toothStates, toothWidths, baseToothWidths);

            if (x1 === undefined || x2 === undefined) continue;

            const baseMidX = (x1 + x2) / 2;

            const adjustment = TAD_MICRO_ADJUSTMENTS[pairId] || 0;

            const midX = baseMidX + adjustment;

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
                let xPos = getDynamicOffset(
                    id,
                    toothStates,
                    toothWidths,
                    baseToothWidths
                );
                if (xPos === undefined) return null; // Should not happen

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
                            onToothRightClick={isTadMode ? undefined : onToothRightClick}
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

function OcclusalArchRow({
    teethIds,
    surfaceStates,
    toothStates,
    onSurfaceClick,
    toothWidths,
    baseToothWidths,
    isUpper
}) {
    return (
        <div className="relative w-full h-12 mb-0">
            {teethIds.map(id => {

                const xPos = getDynamicOffset(
                    id,
                    toothStates,
                    toothWidths,
                    baseToothWidths
                );

                if (xPos === undefined) return null;

                const isInactiveTooth = INACTIVE_TYPES.includes(toothStates[id]);
                const status = isInactiveTooth
                    ? null
                    : (surfaceStates[id] || {});

                let colorScheme = 'neutral';
                const currentStatus = surfaceStates[id];

                if (currentStatus) {
                    const states = Object.values(currentStatus);
                    if (states.includes('restoration')) colorScheme = 'green';
                    else if (states.includes('caries')) colorScheme = 'brown';
                    else if (states.includes('fracture')) colorScheme = 'yellow';
                }

                const OCCLUSAL_FIXED_SIZE = 35; // Ajusta visualmente si quieres
                const occlusalSize = OCCLUSAL_FIXED_SIZE;
                const isCrown = toothStates[id] === 'crown';

                return (
                    <div
                        key={id}
                        className="absolute origin-center"
                        style={{
                            left: `calc(50% + ${xPos}px)`,
                            transform: 'translateX(-50%)',
                            top: isUpper ? '10px' : 'auto',
                            bottom: isUpper ? 'auto' : '10px'
                        }}
                    >
                        <div className={`relative ${isInactiveTooth ? 'pointer-events-none opacity-90' : ''}`}>
                            <SingleTooth
                                id={id}
                                pediatricId={getPediatricId(id)}
                                status={status}
                                selectedMode="treatment"
                                onClick={(toothId, area) => {
                                    if (isInactiveTooth || isCrown) return;
                                    onSurfaceClick(toothId, area);
                                }}
                                showLabels={false}
                                strokeColor="#000000"
                                size={occlusalSize}
                                colorScheme={colorScheme}
                                paintMode="clinical"
                                isCrown={isCrown}
                            />

                            {isInactiveTooth && (
                                <div className="absolute inset-0 flex items-center justify-center bg-slate-500/80 dark:bg-slate-900/80 rounded-full z-20 select-none">
                                    <span className="text-[10px] font-bold text-red-500 uppercase tracking-wide rotate-[-30deg]">
                                        {toothStates[id] === 'extraction' && 'EXT'}
                                        {toothStates[id] === 'missing' && 'MISS'}
                                        {toothStates[id] === 'unerupted' && 'UNER'}
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
                    {/* Render Occlusal Types */}
                    {OCCLUSAL_TYPES.map(type => (
                        <button
                            key={type.id}
                            onClick={() => onSelect(type.id)}
                            className={`p-3 rounded-lg border hover:shadow-md transition-all text-sm flex items-center gap-2 font-medium 
                                ${type.id === 'normal'
                                    ? 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-400'
                                    : `${type.color} hover:brightness-95`
                                }`}
                        >
                            <div className={`w-3 h-3 rounded-full ${type.id === 'normal' ? 'bg-slate-400' : 'bg-current opacity-50'}`}></div>
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
            </motion.div >
        </div >
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
                <AnimatePresence initial={false}>
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
                    onClick={() => {
                        console.log("[DEBUG] Reset button clicked");
                        onReset();
                    }}
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
    const [toothStates, setToothStates] = useState(buildInitialToothStates);
    const [radialState, setRadialState] = useState(null);

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

    useEffect(() => {
        console.log("[DEBUG] isResetDialogOpen changed:", isResetDialogOpen);
    }, [isResetDialogOpen]);

    // Store measured widths of frontal teeth
    const [toothWidths, setToothWidths] = useState({});
    const [baseToothWidths, setBaseToothWidths] = useState({});
    const handleToothResize = useCallback((id, width) => {
        setToothWidths(prev => {
            if (prev[id] === width) return prev;
            return { ...prev, [id]: width };
        });

        // Guardar ancho base SOLO si el diente es original
        setBaseToothWidths(prev => {
            if (toothStates[id] === 'original' && !prev[id]) {
                return { ...prev, [id]: width };
            }
            return prev;
        });
    }, [toothStates]);

    const handleToothRightClick = (id, x, y) => {
        if (isBracketMode || isTadMode) return;
        setRadialState({ toothId: id, x, y });
    };

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
        // 1. Reset Teeth to Initial State (all 'original')
        setToothStates(buildInitialToothStates());

        // 2. Clear all clinical overlays
        setBrackets({});
        setTads({});
        setSurfaceStates({});
        setToothWidths({});

        // 3. Reset UI Modes
        setIsBracketMode(false);
        setIsTadMode(false);
        setSelectedToothType('original');
        setSelectedSurface(null); // Ensure no surface is selected
        // 4. Close Dialog
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
                    <div className="relative min-w-[1000px] pb-4 isolate select-none">

                        {/* Labels */}
                        <div className="text-center mb-2 text-[15px] font-bold tracking-[0.2em] text-slate-600 dark:text-white uppercase select-none">
                            Superior (Maxilar)
                        </div>

                        {/* === UPPER ARCH === */}
                        <div className="relative flex flex-col w-full isolate">
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
                                onToothRightClick={handleToothRightClick}
                                onTadClick={handleTadClick}
                                currentClinicalAction={selectedToothType}
                                onToothResize={handleToothResize}
                                toothWidths={toothWidths}
                                baseToothWidths={baseToothWidths}
                                isUpper={true}
                            />

                            {/* ROW 2: OCCLUSAL */}
                            <div className="border-b border-slate-400 dark:border-slate-700/50 w-full mb-0 pb-1">
                                <OcclusalArchRow
                                    teethIds={UPPER_ARCH_IDS}
                                    surfaceStates={surfaceStates}
                                    toothStates={toothStates}
                                    onSurfaceClick={handleSurfaceClick}
                                    toothWidths={toothWidths}
                                    baseToothWidths={baseToothWidths}
                                    isUpper={true}
                                />
                            </div>
                        </div>

                        {/* === LOWER ARCH === */}
                        <div className="relative flex flex-col w-full isolate">
                            {/* CENTER DIVIDER */}
                            <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-px bg-slate-400 dark:bg-slate-700 z-0"></div>

                            {/* ROW 3: OCCLUSAL */}
                            <div className="w-full mt-0 pt-1">
                                <OcclusalArchRow
                                    teethIds={LOWER_ARCH_IDS}
                                    surfaceStates={surfaceStates}
                                    toothStates={toothStates}
                                    onSurfaceClick={handleSurfaceClick}
                                    toothWidths={toothWidths}
                                    baseToothWidths={baseToothWidths}
                                    isUpper={false}
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
                                onToothRightClick={handleToothRightClick}
                                onTadClick={handleTadClick}
                                currentClinicalAction={selectedToothType}
                                onToothResize={handleToothResize}
                                toothWidths={toothWidths}
                                baseToothWidths={baseToothWidths}
                                isUpper={false}
                            />
                        </div>

                        {/* Labels */}
                        <div className="text-center mt-2 mb-15 text-[15px] font-bold tracking-[0.2em] text-slate-600 dark:text-white uppercase select-none">
                            Inferior (Mandíbula)
                        </div>

                        {/* Side Labels */}
                        <div className="absolute top-[50%] left-4 -translate-y-[220%] -rotate-90 text-[15px] font-bold tracking-[0.2em] text-slate-600 dark:text-white select-none transform-gpu">
                            DERECHO
                        </div>
                        <div className="absolute top-[50%] right-4 -translate-y-[200%] rotate-90 text-[15px] font-bold tracking-[0.2em] text-slate-600 dark:text-white select-none transform-gpu">
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
                onReset={() => {
                    console.log("[DEBUG] onReset triggered");
                    setIsResetDialogOpen(true);
                }}
            />

            <ClinicalActionModal
                isOpen={!!selectedSurface}
                onClose={() => setSelectedSurface(null)}
                onSelect={handleClinicalAction}
            />

            {console.log("[DEBUG] ConfirmDialog render check:", isResetDialogOpen)}
            <ConfirmDialog
                open={isResetDialogOpen}
                title="Limpiar Odontograma"
                message="¿Estás seguro de que deseas limpiar todo el odontograma? Esta acción no se puede deshacer."
                confirmLabel="Sí, limpiar todo"
                cancelLabel="Cancelar"
                requiresDoubleConfirm={true}
                secondTitle="Confirmar limpieza"
                secondMessage="¿Estás completamente seguro de que deseas limpiar todo el odontograma? Esta acción no se puede deshacer."
                secondConfirmLabel="Sí, confirmo"
                onConfirm={handleResetOdontogram}
                onCancel={() => setIsResetDialogOpen(false)}
                variant="danger"
            />

            <AnimatePresence>
                {radialState && (
                    <RadialMenu
                        x={radialState.x}
                        y={radialState.y}
                        options={[
                            { id: 'crown', label: 'Crown', color: 'bg-amber-500 text-white border-amber-600' },
                            { id: 'implant', label: 'Implant', color: 'bg-blue-500 text-white border-blue-600' },
                            { id: 'root-canal', label: 'Endodontics', color: 'bg-pink-500 text-white border-pink-600' },
                            { id: 'extraction', label: 'Extraction', color: 'bg-slate-700 text-white border-slate-800' }
                        ]}
                        onSelect={(option) => {
                            setToothStates(prev => ({ ...prev, [radialState.toothId]: option.id }));
                        }}
                        onClose={() => setRadialState(null)}
                    />
                )}
            </AnimatePresence>
        </motion.div>
    );
}
