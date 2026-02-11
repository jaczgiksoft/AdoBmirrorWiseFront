import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import bracketImg from '@/assets/images/odontogram/bracket.svg';
import tadImg from '@/assets/images/odontogram/tad.svg';
import SingleTooth from '@/components/ExtractionOrders/SingleTooth';
import ConfirmDialog from '@/components/feedback/ConfirmDialog';

// 1. Asset Loading
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

// 2. Data Definition (FDI Notation)
const TEETH_TO_SCALE = [
    18, 17, 16,
    26, 27, 28,
    36, 37, 38,
    46, 47, 48
];

const QUADRANTS = {
    q1: [18, 17, 16, 15, 14, 13, 12, 11], // Upper Right (Screen Left)
    q2: [21, 22, 23, 24, 25, 26, 27, 28], // Upper Left (Screen Right)
    q4: [48, 47, 46, 45, 44, 43, 42, 41], // Lower Right (Screen Left)
    q3: [31, 32, 33, 34, 35, 36, 37, 38]  // Lower Left (Screen Right)
};

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

// Mock data for now (will be dynamic later)


// 3. Components

// Individual Tooth Component (Frontal)
function Tooth({ id, type, hasBracket, isBracketMode, onToothClick, currentClinicalAction }) {
    const src = getToothSrc(id, type || 'original');
    const shouldScale = TEETH_TO_SCALE.includes(id);

    // Check for "Permanent Molar in Deciduous Mode" (Positions 6, 7, 8)
    // Interaction disable depends on the ACTIVE TOOL (currentClinicalAction), not just the current state.
    const isDeciduousMode = currentClinicalAction === 'deciduous' || currentClinicalAction === 'pulpotomy';
    const position = parseInt(id.toString()[1]);
    const isInvalidDeciduous = isDeciduousMode && position > 5;

    // Calculate display number based on type
    let displayNumber = getDisplayNumber(id, type);
    if (isInvalidDeciduous) {
        displayNumber = '–';
    }

    // Arch Detection logic:
    // Maxillary (Upper): 11-18, 21-28 (IDs < 30)
    // Mandibular (Lower): 31-38, 41-48 (IDs >= 30)
    const isMaxillary = id < 30;

    // Dynamic Positioning based on arch
    // Upper teeth: Root is UP, Crown is DOWN. We need to push bracket DOWN > top-[38%]
    // Lower teeth: Root is DOWN, Crown is UP. Bracket stays near TOP > top-[22%]
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
            {/* Tooth Image Container */}
            <div className={`
                    relative h-40
                    flex items-end
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
                                className="w-2.5 h-2.5 md:w-3 md:h-3 object-contain opacity-90 drop-shadow-sm"
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
            {/* Tooth Number Label */}
            <span className={labelClasses}>
                {displayNumber}
            </span>
        </div>
    );
}

// Interproximal Zone Component (for TADs)
function InterproximalZone({ t1, t2, hasTad, isTadMode, onClick }) {
    // Determine order for consistent ID
    // Visual order in quadrant determines position, but logic should be consistent
    // We pass t1 and t2 based on render order.

    // TAD Position Logic:
    // Upper Arch (1x, 2x): Roots are UP. Gum is TOP. TAD goes Top.
    // Lower Arch (3x, 4x): Roots are DOWN. Gum is BOTTOM. TAD goes Bottom.
    // We treat id < 30 as Upper.
    const isUpper = t1 < 30;

    return (
        <div className={`relative flex flex-col justify-end w-px md:w-1 shrink-0 z-30`}>
            {/* Hit box - wider than the visible gap */}
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
    ${isUpper ? 'top-[50%]' : 'bottom-[50%]'}
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

// Quadrant Helper (Frontal)
function Quadrant({ teeth, toothStates, brackets, tads, isBracketMode, isTadMode, onToothClick, onTadClick, currentClinicalAction }) {
    return (
        <div className="flex">
            {teeth.map((id, index) => {
                const isLast = index === teeth.length - 1;
                const nextId = teeth[index + 1];

                // Check for TAD between this tooth and the next
                // Key convention: smaller-larger
                const pairId = [id, nextId].sort((a, b) => a - b).join('-');
                const hasTad = !!tads[pairId];

                return (
                    <React.Fragment key={id}>
                        <Tooth
                            id={id}
                            type={toothStates[id]}
                            hasBracket={!!brackets[id]}
                            isBracketMode={isBracketMode}
                            // If TAD mode is active, disable tooth click unless we want to allow mixed interactions (req says no)
                            onToothClick={isTadMode ? () => { } : onToothClick}
                            currentClinicalAction={currentClinicalAction}
                        // Visual feedback: dim teeth slightly in TAD mode to emphasize gaps? Optional.
                        // keeping standard for now.
                        />
                        {!isLast && (
                            <InterproximalZone
                                t1={id}
                                t2={nextId}
                                hasTad={hasTad}
                                isTadMode={isTadMode}
                                onClick={onTadClick}
                            />
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    );
}

// Occlusal Quadrant Helper
function OcclusalQuadrant({ teeth, surfaceStates, toothStates, onSurfaceClick }) {
    return (
        <div className="flex gap-1 md:gap-0 justify-center">
            {teeth.map(id => {
                const isExtracted = toothStates[id] === 'extraction';
                // If extracted, pass { extraction: true } to override colors
                const status = isExtracted ? { extraction: true } : (surfaceStates[id] || {});

                return (
                    <div key={id} className="relative group scale-[0.65] md:scale-[0.85] origin-center -my-1">
                        <SingleTooth
                            id={id}
                            status={status}
                            selectedMode="treatment" // Always show hover as generic treatment
                            onClick={(toothId, area) => onSurfaceClick(toothId, area)}
                            showLabels={false}
                            strokeColor="stroke-slate-300/80 dark:stroke-slate-600/80"
                        />
                        {/* Extra Visual Overlay for Extraction */}
                        {isExtracted && (
                            <div className="absolute inset-0 bg-slate-100/80 dark:bg-slate-800/80 flex items-center justify-center rounded cursor-not-allowed z-10 backdrop-grayscale pointer-events-none">
                                <span className="text-[8px] font-bold text-red-500 uppercase -rotate-45 border border-red-500 px-0.5 rounded">
                                    Extr.
                                </span>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

function DentalSummary({ toothStates }) {
    const [isExpanded, setIsExpanded] = useState(false);

    // Compute dynamic stats from toothStates
    const stats = DENTAL_TYPES.map(type => {
        const count = Object.values(toothStates).filter(t => t === type.id).length;
        return {
            ...type,
            count
        };
    });

    // Filter: Show only > 0 unless expanded
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
                            <span className="text-2xl font-bold leading-none mb-1">
                                {stat.count}
                            </span>
                            <span className="text-[10px] font-bold uppercase tracking-wider opacity-90 leading-tight">
                                {stat.label}
                            </span>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/50 px-4 py-2 flex justify-center border-t border-slate-100 dark:border-slate-700/50">
                <button
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

// Custom Premium Switch/Checkbox Component
function ModeCheckbox({ checked, onChange, label, color = 'blue' }) {
    const isBlue = color === 'blue';
    const activeColor = isBlue ? 'bg-blue-500 border-blue-500 shadow-blue-500/25' : 'bg-sky-500 border-sky-500 shadow-sky-500/25';
    const activeRing = isBlue ? 'peer-focus:ring-blue-500/30' : 'peer-focus:ring-sky-500/30';

    return (
        <label className="group flex items-center gap-3 cursor-pointer select-none relative px-3 py-2 rounded-xl transition-all duration-300 hover:bg-slate-50 dark:hover:bg-slate-800/50">
            <input
                type="checkbox"
                className="peer sr-only"
                checked={checked}
                onChange={onChange}
            />
            {/* Custom Checkbox Box */}
            <div className={`
                w-5 h-5 md:w-6 md:h-6 rounded-[6px] border-[2px] flex items-center justify-center transition-all duration-300 ease-out shadow-sm
                ${checked
                    ? `${activeColor} scale-100`
                    : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 group-hover:border-slate-400 dark:group-hover:border-slate-500'
                }
            `}>
                <svg
                    className={`w-3.5 h-3.5 md:w-4 md:h-4 text-white transform transition-all duration-300 ease-spring ${checked ? 'scale-100 opacity-100 rotate-0' : 'scale-50 opacity-0 -rotate-90'}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round"
                >
                    <path d="M5 13l4 4L19 7" />
                </svg>
            </div>

            {/* Label Text */}
            <span className={`text-sm font-semibold transition-colors duration-200 ${checked ? 'text-slate-800 dark:text-slate-100' : 'text-slate-600 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-300'}`}>
                {label}
            </span>

            {/* Subtle Active Background Glow */}
            {checked && (
                <div className={`absolute inset-0 rounded-xl opacity-10 pointer-events-none ${isBlue ? 'bg-blue-500' : 'bg-sky-500'}`} />
            )}
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
                <button className="btn btn-primary btn-sm md:btn-md shadow-sm" disabled={isBracketMode || isTadMode}>
                    Aplicar
                </button>
                {/* Reset Button */}
                <button
                    onClick={onReset}
                    className="btn btn-sm md:btn-md bg-white dark:bg-slate-700 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 hover:text-red-600 border border-slate-200 dark:border-slate-600 shadow-sm transition-colors whitespace-nowrap"
                    title="Limpiar todo el odontograma"
                >
                    Limpiar odontograma
                </button>
            </div>

            {/* Divider */}
            <div className="hidden md:block w-px h-8 bg-slate-200 dark:bg-slate-700 mx-1"></div>

            {/* Ortho Controls */}
            <div className="flex items-center gap-2 md:gap-4 w-full md:w-auto justify-between md:justify-end flex-wrap md:flex-nowrap">
                {/* TADs Checkbox */}
                <ModeCheckbox
                    label="Colocar TADs"
                    checked={isTadMode}
                    onChange={(e) => setTadMode(e.target.checked)}
                    color="sky"
                />

                {/* Brackets Checkbox */}
                <ModeCheckbox
                    label="Colocar Brackets"
                    checked={isBracketMode}
                    onChange={(e) => setBracketMode(e.target.checked)}
                    color="blue"
                />

                {/* Confirm Action Button (Only for Bracket Mode) */}
                <AnimatePresence>
                    {isBracketMode && (
                        <motion.button
                            initial={{ opacity: 0, scale: 0.9, width: 0 }}
                            animate={{ opacity: 1, scale: 1, width: 'auto' }}
                            exit={{ opacity: 0, scale: 0.9, width: 0 }}
                            onClick={onApplyAll}
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

// Main Section Component
export default function OdontogramSection() {
    // Initial State: All teeth are 'original'
    const [toothStates, setToothStates] = useState(() => {
        const initial = {};
        Object.values(QUADRANTS).flat().forEach(id => {
            initial[id] = 'original';
        });
        return initial;
    });

    const [brackets, setBrackets] = useState({}); // { 18: true, ... }
    const [tads, setTads] = useState({}); // { "11-12": true, ... }

    // Modes (Mutually Exclusive)
    const [isBracketMode, setIsBracketMode] = useState(false);
    const [isTadMode, setIsTadMode] = useState(false);

    // Handler helpers to ensure exclusivity
    const setBracketMode = (val) => {
        setIsBracketMode(val);
        if (val) setIsTadMode(false);
    };

    const setTadMode = (val) => {
        setIsTadMode(val);
        if (val) setIsBracketMode(false);
    };

    const [selectedToothType, setSelectedToothType] = useState('original');

    // New: Surface States for Occlusal Views
    // New: Surface States for Occlusal Views
    const [surfaceStates, setSurfaceStates] = useState({});

    // New: Modal Selection State
    const [selectedSurface, setSelectedSurface] = useState(null);

    // Reset Confirmation State
    const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);

    // Unified click handler (Frontal)
    const handleToothClick = (id) => {
        if (isBracketMode) {
            // Bracket Mode: Toggle bracket (existing logic)
            setBrackets(prev => ({
                ...prev,
                [id]: !prev[id] // toggle
            }));
        } else {
            // Edit Mode: Change tooth type
            setToothStates(prev => ({
                ...prev,
                [id]: selectedToothType
            }));
        }
    };

    // Surface click handler (Occlusal)
    const handleSurfaceClick = (id, area) => {
        // 1. Check if tooth is extracted (Frontal state drives this)
        if (toothStates[id] === 'extraction') {
            return; // Block interaction on extracted teeth
        }

        // 2. Open Modal for Selection
        setSelectedSurface({ id, area });
    };

    const handleClinicalAction = (action) => {
        if (!selectedSurface) return;
        const { id, area } = selectedSurface;

        setSurfaceStates(prev => {
            const currentToothState = prev[id] || {};

            // 'normal' clears the state, others set it
            const newAreaState = action === 'normal' ? null : action;

            const newToothState = {
                ...currentToothState,
                [area]: newAreaState
            };

            return {
                ...prev,
                [id]: newToothState
            };
        });

        // Close Modal
        setSelectedSurface(null);
    };

    // TAD Click Handler
    const handleTadClick = (t1, t2) => {
        const pairId = [t1, t2].sort((a, b) => a - b).join('-');
        setTads(prev => ({
            ...prev,
            [pairId]: !prev[pairId] // Toggle
        }));
    };

    const handleApplyAllBrackets = () => {
        const newBrackets = { ...brackets };
        const allTeeth = Object.values(QUADRANTS).flat();

        allTeeth.forEach(id => {
            if (!newBrackets[id]) {
                newBrackets[id] = true;
            }
        });
        setBrackets(newBrackets);
    };

    // Reset Handler: Clears everything to initial state
    const handleResetOdontogram = () => {
        // 1. Reset Tooth States to 'original'
        const initialStates = {};
        Object.values(QUADRANTS).flat().forEach(id => {
            initialStates[id] = 'original';
        });
        setToothStates(initialStates);

        // 2. Clear Add-ons
        setBrackets({});
        setTads({});
        setSurfaceStates({});

        // 3. Reset UI Modes
        setIsBracketMode(false);
        setIsTadMode(false);
        setSelectedToothType('original');

        // 4. Close Dialog
        setIsResetDialogOpen(false);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-1 space-y-6"
        >
            {/* 1. Summary Section */}
            <DentalSummary toothStates={toothStates} />

            {/* 2. Odontogram Visualization */}
            <div className={`bg-white dark:bg-[var(--color-secondary)] border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm p-4 flex flex-col items-center relative overflow-hidden transition-colors 
                ${isBracketMode ? 'ring-2 ring-blue-500/20 border-blue-200 dark:border-blue-900/30' : ''}
                ${isTadMode ? 'ring-2 ring-sky-500/20 border-sky-200 dark:border-sky-900/30' : ''}
            `}>

                {/* Header / Title */}
                <div className="w-full mb-4 flex items-center justify-between z-10 relative">
                    <div>
                        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                            Odontograma Actual
                            {isBracketMode && (
                                <span className="badge badge-sm badge-info gap-1 font-normal">
                                    Modo Ortodoncia (Brackets)
                                </span>
                            )}
                            {isTadMode && (
                                <span className="badge badge-sm badge-info gap-1 font-normal">
                                    Modo Ortodoncia (TADs)
                                </span>
                            )}
                        </h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            Vista general del estado dental del paciente.
                        </p>
                    </div>
                </div>

                {/* Decoration Background */}
                <div className="absolute inset-0 pointer-events-none opacity-5 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] dark:bg-[radial-gradient(#475569_1px,transparent_1px)] [background-size:20px_20px]"></div>

                {/* Main Odontogram Layout */}
                <div className="relative z-0 scale-100 xl:scale-110 transition-transform origin-top mt-4 mb-4">

                    {/* Labels */}
                    <div className="text-center mb-2 text-[15px] font-bold tracking-[0.2em] text-slate-300 dark:text-slate-600 uppercase select-none">
                        Superior (Maxilar)
                    </div>

                    {/* === UPPER ARCH WRAPPER === */}
                    <div className="relative flex flex-col w-full">
                        {/* ABSOLUTE CENTER DIVIDER */}
                        <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-px bg-slate-200 dark:bg-slate-700"></div>

                        {/* === ROW 1: UPPER FRONTAL (Anatomical) === */}
                        <div className="flex items-end justify-center gap-8 lg:gap-12 pb-4  dark:border-slate-700/50 w-full z-10">
                            <Quadrant
                                teeth={QUADRANTS.q1}
                                toothStates={toothStates}
                                brackets={brackets}
                                tads={tads}
                                isBracketMode={isBracketMode}
                                isTadMode={isTadMode}
                                onToothClick={handleToothClick}
                                onTadClick={handleTadClick}
                                currentClinicalAction={selectedToothType}
                            />
                            <Quadrant
                                teeth={QUADRANTS.q2}
                                toothStates={toothStates}
                                brackets={brackets}
                                tads={tads}
                                isBracketMode={isBracketMode}
                                isTadMode={isTadMode}
                                onToothClick={handleToothClick}
                                onTadClick={handleTadClick}
                                currentClinicalAction={selectedToothType}
                            />
                        </div>

                        {/* === ROW 2: UPPER OCCLUSAL (Surface) === */}
                        <div className="flex justify-center gap-8 lg:gap-12 pb-8 border-b border-slate-100 dark:border-slate-700/50 w-full z-10">
                            <OcclusalQuadrant
                                teeth={QUADRANTS.q1}
                                surfaceStates={surfaceStates}
                                toothStates={toothStates}
                                onSurfaceClick={handleSurfaceClick}
                            />
                            <OcclusalQuadrant
                                teeth={QUADRANTS.q2}
                                surfaceStates={surfaceStates}
                                toothStates={toothStates}
                                onSurfaceClick={handleSurfaceClick}
                            />
                        </div>
                    </div>

                    {/* === LOWER ARCH WRAPPER === */}
                    <div className="relative flex flex-col w-full">
                        {/* ABSOLUTE CENTER DIVIDER */}
                        <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-px bg-slate-200 dark:bg-slate-700"></div>

                        {/* === ROW 3: LOWER OCCLUSAL (Surface) === */}
                        <div className="flex justify-center gap-8 lg:gap-12  pt-8 w-full z-10">
                            <OcclusalQuadrant
                                teeth={QUADRANTS.q4}
                                surfaceStates={surfaceStates}
                                toothStates={toothStates}
                                onSurfaceClick={handleSurfaceClick}
                            />
                            <OcclusalQuadrant
                                teeth={QUADRANTS.q3}
                                surfaceStates={surfaceStates}
                                toothStates={toothStates}
                                onSurfaceClick={handleSurfaceClick}
                            />
                        </div>

                        {/* === ROW 4: LOWER FRONTAL (Anatomical) === */}
                        <div className="flex items-start justify-center gap-8 lg:gap-12 pt-4 w-full z-10">
                            <Quadrant
                                teeth={QUADRANTS.q4}
                                toothStates={toothStates}
                                brackets={brackets}
                                tads={tads}
                                isBracketMode={isBracketMode}
                                isTadMode={isTadMode}
                                onToothClick={handleToothClick}
                                onTadClick={handleTadClick}
                                currentClinicalAction={selectedToothType}
                            />
                            <Quadrant
                                teeth={QUADRANTS.q3}
                                toothStates={toothStates}
                                brackets={brackets}
                                tads={tads}
                                isBracketMode={isBracketMode}
                                isTadMode={isTadMode}
                                onToothClick={handleToothClick}
                                onTadClick={handleTadClick}
                                currentClinicalAction={selectedToothType}
                            />
                        </div>
                    </div>


                    {/* Labels */}
                    <div className="text-center mt-2 mb-15 text-[15px] font-bold tracking-[0.2em] text-slate-300 dark:text-slate-600 uppercase select-none">
                        Inferior (Mandíbula)
                    </div>

                    {/* ... side labels ... */}
                    <div className="absolute top-1/2 -left-18 -translate-y-8 -rotate-90 text-[15px] font-bold tracking-[0.2em] text-slate-200 dark:text-slate-700 select-none hidden lg:block">
                        DERECHO
                    </div>
                    <div className="absolute top-1/2 -right-20 -translate-y-7 rotate-90 text-[15px] font-bold tracking-[0.2em] text-slate-200 dark:text-slate-700 select-none hidden lg:block">
                        IZQUIERDO
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

            {/* 5. Reset Confirmation Dialog */}
            <ConfirmDialog
                open={isResetDialogOpen}
                title="Limpiar Odontograma"
                message="¿Estás seguro de qe deseas reiniciar el odontograma? Esta acción eliminará todos los brackets, TADs y marcaciones realizadas. No se puede deshacer."
                confirmLabel="Sí, limpiar todo"
                cancelLabel="Cancelar"
                confirmVariant="error"
                onConfirm={handleResetOdontogram}
                onCancel={() => setIsResetDialogOpen(false)}
            />

        </motion.div>
    );
}

// Clinical Action Modal for Occlusal Surfaces
function ClinicalActionModal({ isOpen, onClose, onSelect }) {
    if (!isOpen) return null;

    const actions = [
        { id: 'normal', label: 'Sano / Normal', className: 'bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200', dotClass: 'bg-slate-300 dark:bg-slate-400' },
        { id: 'caries', label: 'Caries', className: 'bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/30 border-amber-200 dark:border-amber-700/50 text-amber-800 dark:text-amber-400', dotClass: 'bg-amber-400' },
        { id: 'fracture', label: 'Fractura', className: 'bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/30 border-orange-200 dark:border-orange-700/50 text-orange-800 dark:text-orange-400', dotClass: 'bg-orange-700' },
        { id: 'restoration', label: 'Restauración', className: 'bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 border-emerald-200 dark:border-emerald-700/50 text-emerald-800 dark:text-emerald-400', dotClass: 'bg-emerald-500' }
    ];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px]" onClick={onClose}>
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-xs overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Condición Oclusal</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                <div className="p-3 grid grid-cols-1 gap-2">
                    {actions.map(action => (
                        <button
                            key={action.id}
                            onClick={() => onSelect(action.id)}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-all text-left ${action.className}`}
                        >
                            <div className={`w-3 h-3 rounded-full shadow-sm ${action.dotClass}`}></div>
                            <span className="text-sm font-medium">{action.label}</span>
                        </button>
                    ))}
                </div>
            </motion.div>
        </div>
    );
}


