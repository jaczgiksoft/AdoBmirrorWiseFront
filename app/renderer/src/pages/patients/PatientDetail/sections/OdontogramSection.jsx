import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import bracketImg from '@/assets/images/odontogram/bracket.svg';

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

// Individual Tooth Component
function Tooth({ id, type, hasBracket, isBracketMode, onToothClick }) {
    const src = getToothSrc(id, type || 'original');
    const shouldScale = TEETH_TO_SCALE.includes(id);

    // Arch Detection logic:
    // Maxillary (Upper): 11-18, 21-28 (IDs < 30)
    // Mandibular (Lower): 31-38, 41-48 (IDs >= 30)
    const isMaxillary = id < 30;

    // Dynamic Positioning based on arch
    // Upper teeth: Root is UP, Crown is DOWN. We need to push bracket DOWN > top-[38%]
    // Lower teeth: Root is DOWN, Crown is UP. Bracket stays near TOP > top-[22%]
    const bracketPositionClass = isMaxillary ? 'top-[70%]' : 'top-[15%]';

    if (!src) {
        return (
            <div className="w-11 h-16 md:w-14 md:h-20 flex items-center justify-center bg-red-100 text-red-500 text-xs rounded border border-red-200">
                {id}?
            </div>
        );
    }

    return (
        <div
            className={`flex flex-col items-center gap-0.5 group relative ${isBracketMode ? 'cursor-pointer' : 'cursor-pointer'}`}
            onClick={() => onToothClick(id)}
        >
            {/* Tooth Image Container */}
            <div className={`relative w-11 h-16 md:w-14 md:h-20 transition-transform duration-300 ${isBracketMode ? 'hover:scale-105' : 'hover:scale-110'} z-10 ${shouldScale ? 'scale-y-[0.85] origin-bottom' : ''}`}>
                <img
                    src={src}
                    alt={`Tooth ${id}`}
                    className="w-full h-full object-contain drop-shadow-sm filter hover:drop-shadow-md transition-all"
                    draggable={false}
                />

                {/* Bracket Overlay */}
                <AnimatePresence>
                    {hasBracket && (
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
            <span className={`text-[10px] md:text-xs font-bold transition-colors ${hasBracket ? 'text-blue-600 dark:text-blue-400' : 'text-slate-300 group-hover:text-slate-600 dark:group-hover:text-slate-200'}`}>
                {id}
            </span>
        </div>
    );
}

// Quadrant Helper
function Quadrant({ teeth, toothStates, brackets, isBracketMode, onToothClick }) {
    return (
        <div className="flex gap-px md:gap-1">
            {teeth.map(id => (
                <Tooth
                    key={id}
                    id={id}
                    type={toothStates[id]}
                    hasBracket={!!brackets[id]}
                    isBracketMode={isBracketMode}
                    onToothClick={onToothClick}
                />
            ))}
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

function ActionPanel({ isBracketMode, setBracketMode, onApplyAll, selectedToothType, setSelectedToothType }) {
    return (
        <div className="bg-white dark:bg-[var(--color-secondary)] p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm mt-6 flex flex-col md:flex-row items-center justify-between gap-4">
            {/* General Actions */}
            <div className="flex items-center gap-4 w-full md:w-auto">
                <label className="text-sm font-medium text-slate-600 dark:text-slate-300 whitespace-nowrap hidden md:block">
                    Acción Clínica:
                </label>
                <select
                    className="input input-sm md:input-md w-full md:w-48 border-slate-300 dark:border-slate-600"
                    disabled={isBracketMode}
                    value={selectedToothType}
                    onChange={(e) => setSelectedToothType(e.target.value)}
                >
                    {DENTAL_TYPES.map(t => (
                        <option key={t.id} value={t.id}>{t.label}</option>
                    ))}
                </select>
                <button className="btn btn-primary btn-sm md:btn-md shadow-sm" disabled={isBracketMode}>
                    Aplicar
                </button>
            </div>

            {/* Divider */}
            <div className="hidden md:block w-px h-8 bg-slate-200 dark:bg-slate-700 mx-1"></div>

            {/* Bracket Controls */}
            <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                <label className="flex items-center gap-2 cursor-pointer select-none ring-offset-2 ring-primary/20 rounded hover:bg-slate-50 dark:hover:bg-slate-800/50 p-2 transition-colors">
                    <input
                        type="checkbox"
                        className="checkbox checkbox-primary checkbox-sm"
                        checked={isBracketMode}
                        onChange={(e) => setBracketMode(e.target.checked)}
                    />
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                        Colocar brackets
                    </span>
                </label>

                {isBracketMode && (
                    <button
                        onClick={onApplyAll}
                        className="btn btn-sm btn-secondary animate-fade-in shadow-sm"
                    >
                        Aplicar a todos
                    </button>
                )}
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
    const [isBracketMode, setBracketMode] = useState(false);
    const [selectedToothType, setSelectedToothType] = useState('original');

    // Unified click handler
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

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-1 space-y-6"
        >
            {/* 1. Summary Section */}
            <DentalSummary toothStates={toothStates} />

            {/* 2. Odontogram Visualization */}
            <div className={`bg-white dark:bg-[var(--color-secondary)] border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm p-4 flex flex-col items-center relative overflow-hidden transition-colors ${isBracketMode ? 'ring-2 ring-blue-500/20 border-blue-200 dark:border-blue-900/30' : ''}`}>

                {/* Header / Title */}
                <div className="w-full mb-4 flex items-center justify-between z-10 relative">
                    <div>
                        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                            Odontograma Actual
                            {isBracketMode && (
                                <span className="badge badge-sm badge-info gap-1 font-normal">
                                    Modo Ortodoncia
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
                <div className="relative z-0 scale-100 xl:scale-110 transition-transform origin-top mt-8 mb-4">

                    {/* Labels */}
                    <div className="text-center mb-2 text-[10px] font-bold tracking-[0.2em] text-slate-300 dark:text-slate-600 uppercase select-none">
                        Superior (Maxilar)
                    </div>

                    {/* Upper Arch */}
                    <div className="flex items-end justify-center gap-2 md:gap-4 pb-8 border-b border-slate-100 dark:border-slate-700/50">
                        {/* Right Quadrant (Screen Left) */}
                        <Quadrant
                            teeth={QUADRANTS.q1}
                            toothStates={toothStates}
                            brackets={brackets}
                            isBracketMode={isBracketMode}
                            onToothClick={handleToothClick}
                        />

                        {/* Midline Divider */}
                        <div className="w-px h-20 bg-slate-200 dark:bg-slate-700 self-end mx-1"></div>

                        {/* Left Quadrant (Screen Right) */}
                        <Quadrant
                            teeth={QUADRANTS.q2}
                            toothStates={toothStates}
                            brackets={brackets}
                            isBracketMode={isBracketMode}
                            onToothClick={handleToothClick}
                        />
                    </div>

                    {/* Lower Arch */}
                    <div className="flex items-start justify-center gap-2 md:gap-4 pt-8">
                        {/* Right Quadrant (Screen Left) */}
                        <Quadrant
                            teeth={QUADRANTS.q4}
                            toothStates={toothStates}
                            brackets={brackets}
                            isBracketMode={isBracketMode}
                            onToothClick={handleToothClick}
                        />

                        {/* Midline Divider */}
                        <div className="w-px h-20 bg-slate-200 dark:bg-slate-700 self-start mx-1"></div>

                        {/* Left Quadrant (Screen Right) */}
                        <Quadrant
                            teeth={QUADRANTS.q3}
                            toothStates={toothStates}
                            brackets={brackets}
                            isBracketMode={isBracketMode}
                            onToothClick={handleToothClick}
                        />
                    </div>

                    {/* Labels */}
                    <div className="text-center mt-6 text-[10px] font-bold tracking-[0.2em] text-slate-300 dark:text-slate-600 uppercase select-none">
                        Inferior (Mandíbula)
                    </div>

                    {/* ... side labels ... */}
                    <div className="absolute top-1/2 -left-12 -translate-y-1/2 -rotate-90 text-[10px] font-bold tracking-[0.2em] text-slate-200 dark:text-slate-700 select-none hidden lg:block">
                        DERECHO
                    </div>
                    <div className="absolute top-1/2 -right-12 -translate-y-1/2 rotate-90 text-[10px] font-bold tracking-[0.2em] text-slate-200 dark:text-slate-700 select-none hidden lg:block">
                        IZQUIERDO
                    </div>
                </div>
            </div>

            {/* 3. Actions Section */}
            <ActionPanel
                isBracketMode={isBracketMode}
                setBracketMode={setBracketMode}
                onApplyAll={handleApplyAllBrackets}
                selectedToothType={selectedToothType}
                setSelectedToothType={setSelectedToothType}
            />

        </motion.div>
    );
}
