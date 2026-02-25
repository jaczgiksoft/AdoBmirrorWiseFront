import React, { useState, useMemo } from 'react';
import { Layers, Plus, X, Calendar, Clock, Smile } from 'lucide-react';
import bracketImg from '@/assets/images/odontogram/bracket.svg';

// 1. Asset Loading (Copied from OdontogramSection)
const toothImages = import.meta.glob('@/assets/images/odontogram/original/*.svg', {
    eager: true,
    as: 'url'
});

const getToothSrc = (id) => {
    const entry = Object.entries(toothImages).find(([path]) =>
        path.includes(`/tooth-${id}.svg`)
    );
    return entry ? entry[1] : null;
};

// 2. Constants & Helper Data - DYNAMIC LAYOUT CONFIG
const TOOTH_CONFIG = {
    // Standard tooth dimensions
    base: { width: 70, height: 250 },
    // Molar dimensions (~15% larger)
    molar: { width: 90, height: 240 },
    gap: 1,            // Very tight spacing
    midlineGap: 40     // Gap between quadrants
};

// Molar IDs
const MOLARS = [18, 17, 16, 26, 27, 28, 48, 47, 46, 36, 37, 38];

const getToothDimensions = (id) => {
    return MOLARS.includes(id) ? TOOTH_CONFIG.molar : TOOTH_CONFIG.base;
};

const ELASTIC_TYPES = [
    { id: 'standard', label: 'Estándar (Azul)', color: '#3b82f6', strokeWidth: '4' },
    { id: 'heavy', label: 'Heavy (Rojo)', color: '#ef4444', strokeWidth: '5' },
    { id: 'light', label: 'Ligero (Verde)', color: '#22c55e', strokeWidth: '3' },
    { id: 'chain', label: 'Cadena (Púrpura)', color: '#a855f7', strokeWidth: '4' },
    { id: 'rubber', label: 'Goma (Naranja)', color: '#f97316', strokeWidth: '4' },
];

// Organize IDs in display order (Left to Right on screen)
// Upper: 18..11 | 21..28
// Lower: 48..41 | 31..38
const UPPER_RIGHT = [18, 17, 16, 15, 14, 13, 12, 11];
const UPPER_LEFT = [21, 22, 23, 24, 25, 26, 27, 28];
const LOWER_RIGHT = [48, 47, 46, 45, 44, 43, 42, 41];
const LOWER_LEFT = [31, 32, 33, 34, 35, 36, 37, 38];

const MOCK_INSTRUCTIONS = [
    {
        id: 1,
        startDate: '2025-10-01',
        endDate: '2025-10-15',
        type: 'Clase II Cortos (3/16" Heavy)',
        hours: '24 horas'
    },
    {
        id: 2,
        startDate: '2025-10-16',
        endDate: null,
        type: 'Triangulares (1/4" Medium)',
        hours: 'Solo noches (12 horas)'
    }
];

export default function ElasticsSection() {
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Sequential Selection State
    // Segment-based State
    // activeChain: { typeId: string, segments: Array<{from, to, config}>, lastPoint: number | null, startPoint: number | null }
    const [activeChain, setActiveChain] = useState({ segments: [], lastPoint: null, startPoint: null });

    // completedChains: Array<{ typeId: string, segments: Array<{from, to, config}> }>
    const [completedChains, setCompletedChains] = useState([]);
    const [selectedElasticTypeId, setSelectedElasticTypeId] = useState(ELASTIC_TYPES[0].id);

    // Routing Configuration State (Replaces Modal)
    const [elasticRouting, setElasticRouting] = useState('external');

    // Calculate Teeth Coordinates - FLOW LAYOUT
    const teethData = useMemo(() => {
        const teeth = [];
        const SVG_WIDTH = 1400;

        // Helper: Calculate total width of a list of teeth
        const calculateSegmentWidth = (ids) => {
            return ids.reduce((total, id) => {
                const dim = getToothDimensions(id);
                return total + dim.width + TOOTH_CONFIG.gap;
            }, 0) - TOOTH_CONFIG.gap; // Remove last gap
        };

        // 1. Calculate Total Widths per Arch to Center them
        const upperRightWidth = calculateSegmentWidth(UPPER_RIGHT);
        const upperLeftWidth = calculateSegmentWidth(UPPER_LEFT);
        const totalUpperWidth = upperRightWidth + TOOTH_CONFIG.midlineGap + upperLeftWidth;

        const lowerRightWidth = calculateSegmentWidth(LOWER_RIGHT);
        const lowerLeftWidth = calculateSegmentWidth(LOWER_LEFT);
        const totalLowerWidth = lowerRightWidth + TOOTH_CONFIG.midlineGap + lowerLeftWidth;

        // 2. Determine Start X for centering
        const upperStartX = (SVG_WIDTH - totalUpperWidth) / 2;
        const lowerStartX = (SVG_WIDTH - totalLowerWidth) / 2;

        const UPPER_Y = 10;
        const LOWER_Y = 320; // 50(top) + ~250(height) + gap

        // Helper to position a segment
        const positionSegment = (ids, startX, startY, isUpper) => {
            let currentX = startX;
            ids.forEach(id => {
                const dim = getToothDimensions(id);
                teeth.push({
                    id,
                    x: currentX,
                    y: startY,
                    width: dim.width,
                    height: dim.height,
                    isUpper,
                    src: getToothSrc(id)
                });
                currentX += dim.width + TOOTH_CONFIG.gap;
            });
            return currentX; // Return next X
        };

        // 3. Generate Coordinates
        // Upper Arch
        let nextX = positionSegment(UPPER_RIGHT, upperStartX, UPPER_Y, true);
        positionSegment(UPPER_LEFT, nextX + TOOTH_CONFIG.midlineGap, UPPER_Y, true);

        // Lower Arch
        nextX = positionSegment(LOWER_RIGHT, lowerStartX, LOWER_Y, false);
        positionSegment(LOWER_LEFT, nextX + TOOTH_CONFIG.midlineGap, LOWER_Y, false);

        return teeth;
    }, []);

    // Map for fast coordinate lookup
    const toothMap = useMemo(() => {
        const map = {};
        teethData.forEach(t => map[t.id] = t);
        return map;
    }, [teethData]);

    const getBracketCenter = (id) => {
        const tooth = toothMap[id];
        if (!tooth) return { x: 0, y: 0 };

        // Dynamic Calculation based on THIS tooth's dimensions
        const bracketYOffset = tooth.isUpper ? (tooth.height * 0.75) : (tooth.height * 0.15);

        // Center horizontally in the tooth's specific width
        const bracketXOffset = (tooth.width - 20) / 2;

        // Center of the 20x20 bracket is +10
        return {
            x: tooth.x + bracketXOffset + 10,
            y: tooth.y + bracketYOffset + 10
        };
    };

    // Updated Renderer for Chains of Segments
    const renderElasticChain = (chain, isCompleted = false) => {
        if (!chain || !chain.segments || chain.segments.length === 0) return null;

        const type = ELASTIC_TYPES.find(t => t.id === chain.typeId) || ELASTIC_TYPES.find(t => t.id === selectedElasticTypeId);
        const color = type?.color || "#3b82f6";
        const strokeWidth = type?.strokeWidth || "3";
        const opacity = isCompleted ? 0.8 : 1;

        return (
            <g>
                {chain.segments.map((segment, idx) => {
                    const start = getBracketCenter(segment.from);
                    const end = getBracketCenter(segment.to);
                    // Internal = dashed, External = solid
                    const strokeDasharray = segment.config === 'internal' ? "6, 8" : "none";

                    return (
                        <line
                            key={`seg-${idx}`}
                            x1={start.x} y1={start.y}
                            x2={end.x} y2={end.y}
                            stroke={color}
                            strokeWidth={strokeWidth}
                            strokeLinecap="round"
                            strokeDasharray={strokeDasharray}
                            opacity={opacity}
                            className="transition-all duration-300 drop-shadow-md"
                        />
                    );
                })}
            </g>
        );
    };

    const handleBracketClick = (id) => {
        setActiveChain((prev) => {
            // 1. Start new chain if empty
            if (prev.segments.length === 0 && !prev.lastPoint) {
                return {
                    typeId: selectedElasticTypeId,
                    segments: [],
                    lastPoint: id,
                    startPoint: id
                };
            }

            const last = prev.lastPoint;

            // 2. Prevent immediate backtrack/double-click on same bracket
            if (id === last) {
                return prev;
            }

            // 3. Create New Segment directly using current routing selection
            const newSegment = {
                from: last,
                to: id,
                config: elasticRouting
            };

            const updatedChain = {
                ...prev,
                lastPoint: id,
                segments: [...prev.segments, newSegment]
            };

            // 4. Check if this segment closes the loop
            if (id === prev.startPoint) {
                // If it closes, commit to completed chains
                setCompletedChains(chains => [...chains, updatedChain]);
                // Reset active chain
                return { segments: [], lastPoint: null, startPoint: null };
            }

            // 5. Otherwise, just update active chain
            return updatedChain;
        });
    };

    const handleRightClickRouting = (e) => {
        e.preventDefault();
        setElasticRouting(prev => prev === 'external' ? 'internal' : 'external');
    };

    return (
        <div className="space-y-6 text-slate-800 dark:text-slate-100">
            {/* Main Section Container */}
            <div className="
                bg-white dark:bg-secondary
                border border-slate-200 dark:border-slate-700
                rounded-2xl p-5 shadow-sm
                space-y-4
            ">
                {/* Header */}
                <div className="flex items-start justify-between">
                    <div>
                        <h2 className="text-lg font-bold flex items-center gap-2 text-primary">
                            <Layers size={20} className="opacity-80" />
                            Instrucciones de Elásticos
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                            Historial y registro de uso de elásticos.
                        </p>
                    </div>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="
                            flex items-center gap-1.5 px-3 py-1.5
                            btn-primary-soft
                            rounded-lg text-xs font-semibold transition-all cursor-pointer
                            hover:bg-primary/10 dark:hover:bg-primary/20
                            active:scale-95
                        "
                    >
                        <Plus size={14} />
                        Nueva Instrucción
                    </button>
                </div>

                {/* List of Instructions */}
                <div className="mt-4 space-y-3">
                    {MOCK_INSTRUCTIONS.length === 0 ? (
                        <div className="text-center py-8 border border-dashed border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-800/30">
                            <p className="text-sm text-slate-400 dark:text-slate-500 italic">
                                No se han registrado instrucciones de elásticos aún.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-3">
                            {MOCK_INSTRUCTIONS.map((instruction) => (
                                <div
                                    key={instruction.id}
                                    className="
                                        flex flex-col md:flex-row md:items-center justify-between gap-4
                                        p-4 rounded-xl
                                        bg-slate-50 dark:bg-slate-800/50
                                        border border-slate-100 dark:border-slate-700/50
                                        hover:border-slate-200 dark:hover:border-slate-600
                                        transition-colors
                                    "
                                >
                                    {/* Left Info */}
                                    <div className="flex-1 space-y-2">
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold text-sm text-slate-700 dark:text-slate-200">
                                                {instruction.type}
                                            </span>
                                            {!instruction.endDate && (
                                                <span className="
                                                    px-1.5 py-0.5 rounded text-[10px] font-bold
                                                    bg-emerald-100 text-emerald-700
                                                    dark:bg-emerald-900/30 dark:text-emerald-400
                                                ">
                                                    ACTIVO
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                                            <div className="flex items-center gap-1.5">
                                                <Calendar size={12} />
                                                <span>
                                                    {instruction.startDate}
                                                    {instruction.endDate ? ` - ${instruction.endDate}` : ' - Presente'}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <Clock size={12} />
                                                <span>{instruction.hours}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* FULL UI Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="
                        w-full max-w-4xl bg-white dark:bg-secondary
                        rounded-2xl shadow-xl
                        border border-slate-200 dark:border-slate-700
                        animate-in zoom-in-95 duration-200
                        flex flex-col max-h-[90vh]
                    ">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-700 shrink-0">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                                Registrar Nueva Instrucción
                            </h3>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Body - Scrollable */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-8">

                            {/* 1. Odontogram Base */}
                            <div className="space-y-3">
                                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                    Odontograma de Elásticos
                                </label>

                                <div
                                    className="
                                        w-full overflow-x-auto
                                        bg-slate-50 dark:bg-slate-800/30
                                        rounded-xl border border-slate-200 dark:border-slate-600
                                        px-2 py-0 flex flex-col items-center relative
                                    "
                                    onContextMenu={handleRightClickRouting}
                                >


                                    {/* SVG Container - Compact ViewBox */}
                                    <svg
                                        width="1400"
                                        height="500"
                                        viewBox="0 0 1400 500"
                                        className="max-w-full select-none"
                                    >
                                        <rect width="1400" height="500" fill="transparent" />

                                        {/* BACKGROUND LAYER: Labels & Grid */}
                                        <g id="background-layer" className="pointer-events-none select-none">
                                            {/* Labels */}
                                            <text x="700" y="-50" textAnchor="middle" className="fill-slate-500 dark:fill-slate-400 text-xl font-bold tracking-[0.2em] uppercase">
                                                Superior (Maxilar)
                                            </text>
                                            <text x="700" y="640" textAnchor="middle" className="fill-slate-500 dark:fill-slate-400 text-xl font-bold tracking-[0.2em] uppercase">
                                                Inferior (Mandíbula)
                                            </text>
                                            <text x="20" y="220" textAnchor="middle" transform="rotate(-90, 20, 220)" className="fill-slate-500 dark:fill-slate-400 text-xl font-bold tracking-[0.2em] uppercase">
                                                Derecho
                                            </text>
                                            <text x="1380" y="220" textAnchor="middle" transform="rotate(90, 1380, 220)" className="fill-slate-500 dark:fill-slate-400 text-xl font-bold tracking-[0.2em] uppercase">
                                                Izquierdo
                                            </text>

                                            {/* Midline / Center Lines */}
                                            <line x1="700" y1="50" x2="700" y2="200" stroke="currentColor" strokeOpacity="0.1" strokeDasharray="4" className="text-slate-400" />
                                            <line x1="700" y1="230" x2="700" y2="380" stroke="currentColor" strokeOpacity="0.1" strokeDasharray="4" className="text-slate-400" />
                                        </g>

                                        {/* LAYER 1: Teeth (Base) */}
                                        <g id="teeth-layer">
                                            {teethData.map((tooth) => (
                                                <g key={`tooth-${tooth.id}`} transform={`translate(${tooth.x}, ${tooth.y})`}>
                                                    {tooth.src ? (
                                                        <image
                                                            href={tooth.src}
                                                            width={tooth.width}
                                                            height={tooth.height}
                                                            className="transition-opacity"
                                                        />
                                                    ) : (
                                                        <rect width={tooth.width} height={tooth.height} fill="#ccc" rx="4" />
                                                    )}
                                                    <text
                                                        x={tooth.width / 2}
                                                        y={tooth.isUpper ? -15 : tooth.height + 25}
                                                        textAnchor="middle"
                                                        className="fill-slate-500 text-xl font-sans font-bold"
                                                    >
                                                        {tooth.id}
                                                    </text>
                                                </g>
                                            ))}
                                        </g>

                                        {/* LAYER 2: Elastics (Middle) */}
                                        <g id="elastic-layer" className="pointer-events-none">
                                            {completedChains.map((chain, idx) => (
                                                <g key={`completed-chain-${idx}`}>
                                                    {renderElasticChain(chain, true)}
                                                </g>
                                            ))}
                                            {/* Render Active Chain */}
                                            {renderElasticChain(activeChain, false)}
                                        </g>

                                        {/* LAYER 3: Brackets & Interactivity (Top) */}
                                        <g id="bracket-layer">
                                            {teethData.map((tooth) => {
                                                // Dynamic positioning relative to tooth size
                                                const bracketYOffset = tooth.isUpper ? (tooth.height * 0.75) : (tooth.height * 0.15);
                                                const bracketXOffset = (tooth.width - 20) / 2;
                                                const activeIndex = activeChain.lastPoint === tooth.id || activeChain.startPoint === tooth.id || activeChain.segments.some(s => s.from === tooth.id || s.to === tooth.id);
                                                const isActive = activeIndex;
                                                const isOrigin = activeChain.startPoint === tooth.id;
                                                const isCompleted = completedChains.some(chain => chain.segments.some(s => s.from === tooth.id || s.to === tooth.id));

                                                return (
                                                    <g key={`bracket-${tooth.id}`} transform={`translate(${tooth.x}, ${tooth.y})`}>
                                                        <g transform={`translate(${bracketXOffset}, ${bracketYOffset})`} className="cursor-pointer" onClick={() => handleBracketClick(tooth.id)}>
                                                            <rect x="-6" y="-6" width="32" height="32" fill="transparent" />
                                                            <image
                                                                href={bracketImg}
                                                                width={28}
                                                                height={28}
                                                                className={`transition-all duration-200 ${isOrigin ? 'drop-shadow-[0_0_8px_rgba(34,197,94,0.9)] brightness-125 scale-125' : isActive ? 'drop-shadow-[0_0_5px_rgba(59,130,246,0.9)] brightness-125 scale-110' : isCompleted ? 'opacity-100 drop-shadow-sm brightness-90' : 'opacity-80 hover:opacity-100 hover:scale-105'}`}
                                                            />
                                                        </g>
                                                    </g>
                                                );
                                            })}
                                        </g>
                                    </svg>

                                    <p className="text-base font-light text-slate-600 dark:text-slate-300 text-center mt-5 max-w-lg">
                                        Seleccione un bracket para iniciar o gestionar la instrucción de elásticos.
                                    </p>
                                </div>
                            </div>

                            {/* 2. Actions Section */}
                            <div className="space-y-3">
                                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                    Acción a realizar
                                </label>
                                <div className="flex flex-wrap items-center gap-4">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="radio" name="actionType" value="bracket" className="w-4 h-4 text-primary focus:ring-primary" />
                                        <span className="text-sm text-slate-700 dark:text-slate-300">Colocar Bracket</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-not-allowed opacity-50">
                                        <input type="radio" name="actionType" value="tad" disabled className="w-4 h-4 text-primary focus:ring-primary" />
                                        <span className="text-sm text-slate-700 dark:text-slate-300">Colocar Microimplant</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer pr-4 border-r border-slate-200 dark:border-slate-700">
                                        <input type="radio" name="actionType" value="elastics" defaultChecked className="w-4 h-4 text-primary focus:ring-primary" />
                                        <span className="text-sm text-slate-700 dark:text-slate-300">Colocar Elásticos</span>
                                    </label>

                                    {/* Configuración de Ruta (Interno/Externo) */}
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => setElasticRouting('external')}
                                            className={`
                                                relative flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-semibold transition-all duration-300
                                                ${elasticRouting === 'external'
                                                    ? 'bg-primary text-white shadow-[0_0_12px_rgba(59,130,246,0.6)] scale-[1.02] border-transparent'
                                                    : 'bg-slate-50 dark:bg-slate-800 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-700'
                                                }
                                            `}
                                        >
                                            <div className={`w-4 h-[2px] ${elasticRouting === 'external' ? 'bg-white' : 'bg-slate-400 dark:bg-slate-500'}`} />
                                            Externo
                                            {elasticRouting === 'external' && (
                                                <span className="absolute inset-0 rounded-lg ring-2 ring-primary dark:ring-primary animate-pulse opacity-20 pointer-events-none" />
                                            )}
                                        </button>

                                        <button
                                            onClick={() => setElasticRouting('internal')}
                                            className={`
                                                relative flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-semibold transition-all duration-300
                                                ${elasticRouting === 'internal'
                                                    ? 'bg-primary text-white shadow-[0_0_12px_rgba(59,130,246,0.6)] scale-[1.02] border-transparent'
                                                    : 'bg-slate-50 dark:bg-slate-800 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-700'
                                                }
                                            `}
                                        >
                                            <div className={`w-4 h-[2px] border-t-2 border-dotted ${elasticRouting === 'internal' ? 'border-white' : 'border-slate-400 dark:border-slate-500'}`} />
                                            Interno
                                            {elasticRouting === 'internal' && (
                                                <span className="absolute inset-0 rounded-lg ring-2 ring-primary dark:ring-primary animate-pulse opacity-20 pointer-events-none" />
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* 3. Instructions Form */}
                            <div className="space-y-4">
                                <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 border-b border-slate-100 dark:border-slate-700 pb-2">
                                    Detalles de la Instrucción
                                </h4>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                            Fecha de Inicio
                                        </label>
                                        <input
                                            type="date"
                                            className="
                                                w-full px-3 py-2 rounded-lg text-sm
                                                bg-slate-50 dark:bg-slate-800
                                                border border-slate-200 dark:border-slate-700
                                                focus:ring-2 focus:ring-primary/20 focus:border-primary
                                                outline-none transition-all
                                                text-slate-700 dark:text-slate-200
                                            "
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                            Fecha de Fin (Opcional)
                                        </label>
                                        <input
                                            type="date"
                                            className="
                                                w-full px-3 py-2 rounded-lg text-sm
                                                bg-slate-50 dark:bg-slate-800
                                                border border-slate-200 dark:border-slate-700
                                                focus:ring-2 focus:ring-primary/20 focus:border-primary
                                                outline-none transition-all
                                                text-slate-700 dark:text-slate-200
                                            "
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                            Tipo de Elástico
                                        </label>
                                        <select
                                            value={selectedElasticTypeId}
                                            onChange={(e) => setSelectedElasticTypeId(e.target.value)}
                                            className="
                                                w-full px-3 py-2 rounded-lg text-sm
                                                bg-slate-50 dark:bg-slate-800
                                                border border-slate-200 dark:border-slate-700
                                                focus:ring-2 focus:ring-primary/20 focus:border-primary
                                                outline-none transition-all
                                                text-slate-700 dark:text-slate-200
                                                appearance-none cursor-pointer
                                            "
                                        >
                                            {ELASTIC_TYPES.map(type => (
                                                <option key={type.id} value={type.id}>
                                                    {type.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                            Horas de uso por día
                                        </label>
                                        <input
                                            type="number"
                                            placeholder="Ej. 24"
                                            className="
                                                w-full px-3 py-2 rounded-lg text-sm
                                                bg-slate-50 dark:bg-slate-800
                                                border border-slate-200 dark:border-slate-700
                                                focus:ring-2 focus:ring-primary/20 focus:border-primary
                                                outline-none transition-all
                                                text-slate-700 dark:text-slate-200
                                            "
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                        Instrucciones Adicionales
                                    </label>
                                    <textarea
                                        rows={3}
                                        placeholder="Notas o indicaciones especiales para el paciente..."
                                        className="
                                            w-full px-3 py-2 rounded-lg text-sm
                                            bg-slate-50 dark:bg-slate-800
                                            border border-slate-200 dark:border-slate-700
                                            focus:ring-2 focus:ring-primary/20 focus:border-primary
                                            outline-none transition-all resize-none
                                            text-slate-700 dark:text-slate-200
                                        "
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="flex items-center justify-end gap-3 p-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 rounded-b-2xl shrink-0">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="
                                    px-4 py-2 rounded-lg text-sm font-medium
                                    text-slate-600 dark:text-slate-300
                                    hover:bg-slate-100 dark:hover:bg-slate-700
                                    transition-colors
                                "
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="
                                    px-4 py-2 rounded-lg text-sm font-medium
                                    bg-primary text-white 
                                    hover:brightness-110 active:scale-95
                                    transition-all shadow-sm
                                "
                            >
                                Guardar Instrucción
                            </button>
                        </div>
                    </div>
                </div>
            )
            }
        </div >
    );
}
