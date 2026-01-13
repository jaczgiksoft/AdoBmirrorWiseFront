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

// 2. Constants & Helper Data - FINAL SCALE ADJUSTMENT
const TOOTH_WIDTH = 70;   // Increased from 55 (+27%)
const TOOTH_HEIGHT = 150; // Increased from 80 (+25%)
const GAP = 8;            // Increased from 6
const MIDLINE_GAP = 60;   // Increased from 40

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
    const [activeSequence, setActiveSequence] = useState([]); // Array of tooth IDs: [18, 17, 16...]
    const [completedLoops, setCompletedLoops] = useState([]); // Array of arrays: [[18, 17, 16, 18], ...]

    // Calculate Teeth Coordinates
    const teethData = useMemo(() => {
        const teeth = [];

        // Horizontal centering calculations
        // 8 teeth * 70 + 7 * 8 = 560 + 56 = 616 px per quadrant
        // Total teeth width = 616 * 2 + 60 (midline) = 1292 px
        // SVG ViewBox Width = 1400 px
        const startX_Left = (1400 - 1292) / 2; // ~54px margin

        // Helper to add a quadrant
        const addQuadrant = (ids, startX, y, isUpper) => {
            ids.forEach((id, index) => {
                teeth.push({
                    id,
                    x: startX + (index * (TOOTH_WIDTH + GAP)),
                    y: y,
                    isUpper,
                    src: getToothSrc(id)
                });
            });
        };

        // Upper Arch (Y=50) - Moved up to reduce top space
        addQuadrant(UPPER_RIGHT, startX_Left, 50, true);
        addQuadrant(UPPER_LEFT, startX_Left + (8 * (TOOTH_WIDTH + GAP)) + MIDLINE_GAP, 50, true);

        // Lower Arch (Y=230) - Moved up to close gap and reduce bottom space
        // 50 (top) + 150 (tooth) + 30 (gap) = 230
        addQuadrant(LOWER_RIGHT, startX_Left, 230, false);
        addQuadrant(LOWER_LEFT, startX_Left + (8 * (TOOTH_WIDTH + GAP)) + MIDLINE_GAP, 230, false);

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

        // Constants from render loop
        const bracketYOffset = tooth.isUpper ? (TOOTH_HEIGHT * 0.75) : (TOOTH_HEIGHT * 0.15);
        const bracketXOffset = (TOOTH_WIDTH - 20) / 2; // = 25

        // Center of the 20x20 bracket is +10
        return {
            x: tooth.x + bracketXOffset + 10,
            y: tooth.y + bracketYOffset + 10
        };
    };

    const renderElasticPath = (sequence, isCompleted = false) => {
        if (!sequence || sequence.length < 2) return null;

        const points = sequence.map(id => {
            const pos = getBracketCenter(id);
            return `${pos.x},${pos.y}`;
        }).join(' ');

        return (
            <polyline
                points={points}
                fill="none"
                stroke={isCompleted ? "#64748b" : "#3b82f6"} // slate-500 vs blue-500
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`transition-all duration-300 ${isCompleted ? 'opacity-80' : 'drop-shadow-md'}`}
            />
        );
    };

    const handleBracketClick = (id) => {
        setActiveSequence((prev) => {
            // 1. Start new sequence if empty
            if (prev.length === 0) {
                return [id];
            }

            const origin = prev[0];

            // 2. Check if clicking the origin relative to current sequence (Close Loop)
            if (id === origin) {
                // Determine if loop is valid (min 2 points? usually elastics need at least 2)
                if (prev.length < 2) {
                    // Clicking origin immediately again - maybe cancel? or just ignore
                    return prev;
                }

                // Close the loop
                const newLoop = [...prev, id]; // e.g. [18, 17] -> [18, 17, 18]
                setCompletedLoops((loops) => [...loops, newLoop]);
                return []; // Reset active sequence
            }

            // 3. Add to sequence (if not immediately clicking the last one, to avoid double clicks)
            if (prev[prev.length - 1] === id) {
                return prev;
            }

            // Append
            return [...prev, id];
        });
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

                                <div className="
                                    w-full overflow-x-auto
                                    bg-slate-50 dark:bg-slate-800/30
                                    rounded-xl border border-slate-200 dark:border-slate-600
                                    px-2 py-0 flex flex-col items-center
                                ">
                                    {/* SVG Container - Compact ViewBox */}
                                    <svg
                                        width="1400"
                                        height="440"
                                        viewBox="0 0 1400 440"
                                        className="max-w-full select-none"
                                    >
                                        <rect width="1400" height="440" fill="transparent" />

                                        {/* Clinical Labels - Larger & Higher Contrast */}
                                        {/* Top */}
                                        <text x="700" y="0" textAnchor="middle" className="fill-slate-500 dark:fill-slate-400 text-sm font-bold tracking-[0.2em] uppercase">
                                            Superior (Maxilar)
                                        </text>

                                        {/* Bottom */}
                                        <text x="700" y="450" textAnchor="middle" className="fill-slate-500 dark:fill-slate-400 text-sm font-bold tracking-[0.2em] uppercase">
                                            Inferior (Mandíbula)
                                        </text>

                                        {/* Right (Visual Left) */}
                                        <text
                                            x="20" y="220"
                                            textAnchor="middle"
                                            transform="rotate(-90, 20, 220)"
                                            className="fill-slate-500 dark:fill-slate-400 text-sm font-bold tracking-[0.2em] uppercase"
                                        >
                                            Derecho
                                        </text>

                                        {/* Left (Visual Right) */}
                                        <text
                                            x="1380" y="220"
                                            textAnchor="middle"
                                            transform="rotate(90, 1380, 220)"
                                            className="fill-slate-500 dark:fill-slate-400 text-sm font-bold tracking-[0.2em] uppercase"
                                        >
                                            Izquierdo
                                        </text>

                                        {/* Render Completed Loops (Under active) */}
                                        {completedLoops.map((loop, idx) => (
                                            <g key={`loop-${idx}`}>
                                                {renderElasticPath(loop, true)}
                                            </g>
                                        ))}

                                        {/* Render Active Sequence */}
                                        {renderElasticPath(activeSequence, false)}

                                        {/* Render Teeth & Brackets */}
                                        {teethData.map((tooth) => {
                                            // Bracket Position - Scaled for 150px height:
                                            // Upper (isUpper=true): 75% from top
                                            // Lower (isUpper=false): 15% from top
                                            const bracketYOffset = tooth.isUpper ? (TOOTH_HEIGHT * 0.75) : (TOOTH_HEIGHT * 0.15);
                                            // Center bracket (width 20)
                                            const bracketXOffset = (TOOTH_WIDTH - 20) / 2;

                                            // Determine interaction state
                                            const activeIndex = activeSequence.indexOf(tooth.id);
                                            const isActive = activeIndex !== -1;
                                            const isOrigin = activeIndex === 0;
                                            const isCompleted = completedLoops.some(loop => loop.includes(tooth.id));

                                            return (
                                                <g key={tooth.id} transform={`translate(${tooth.x}, ${tooth.y})`}>
                                                    {/* Tooth Image */}
                                                    {tooth.src ? (
                                                        <image
                                                            href={tooth.src}
                                                            width={TOOTH_WIDTH}
                                                            height={TOOTH_HEIGHT}
                                                            className="opacity-90 hover:opacity-100 transition-opacity"
                                                        />
                                                    ) : (
                                                        <rect width={TOOTH_WIDTH} height={TOOTH_HEIGHT} fill="#ccc" rx="4" />
                                                    )}

                                                    {/* Tooth Number Label - Larger */}
                                                    <text
                                                        x={TOOTH_WIDTH / 2}
                                                        y={tooth.isUpper ? -15 : TOOTH_HEIGHT + 25}
                                                        textAnchor="middle"
                                                        className="fill-slate-500 text-sm font-sans font-bold"
                                                    >
                                                        {tooth.id}
                                                    </text>

                                                    {/* Clickable Bracket Area */}
                                                    <g
                                                        transform={`translate(${bracketXOffset}, ${bracketYOffset})`}
                                                        className="cursor-pointer"
                                                        onClick={() => handleBracketClick(tooth.id)}
                                                    >
                                                        {/* Hitbox (larger transparent rect for easier clicking) */}
                                                        <rect
                                                            x="-6" y="-6" width="32" height="32"
                                                            fill="transparent"
                                                        />

                                                        {/* SVG Bracket Image (20px) */}
                                                        {/* Visual Feedback Logic */}
                                                        <image
                                                            href={bracketImg}
                                                            width={20}
                                                            height={20}
                                                            className={`
                                                                transition-all duration-200
                                                                ${isOrigin
                                                                    ? 'drop-shadow-[0_0_8px_rgba(34,197,94,0.9)] brightness-125 scale-125' // Green Origin
                                                                    : isActive
                                                                        ? 'drop-shadow-[0_0_5px_rgba(59,130,246,0.9)] brightness-125 scale-110' // Blue Sequence
                                                                        : isCompleted
                                                                            ? 'opacity-100 drop-shadow-sm brightness-90' // Completed (static)
                                                                            : 'opacity-80 hover:opacity-100 hover:scale-105'} // Default
                                                            `}
                                                        />
                                                    </g>
                                                </g>
                                            );
                                        })}

                                        {/* Midline / Center Lines */}
                                        <line
                                            x1="700" y1="50" x2="700" y2="200"
                                            stroke="currentColor"
                                            strokeOpacity="0.1"
                                            strokeDasharray="4"
                                            className="text-slate-400"
                                        />
                                        <line
                                            x1="700" y1="230" x2="700" y2="380"
                                            stroke="currentColor"
                                            strokeOpacity="0.1"
                                            strokeDasharray="4"
                                            className="text-slate-400"
                                        />
                                    </svg>

                                    <p className="text-base font-light text-slate-600 dark:text-slate-300 text-center mt-0 max-w-lg">
                                        Seleccione un bracket para iniciar o gestionar la instrucción de elásticos.
                                    </p>
                                </div>
                            </div>

                            {/* 2. Actions Section */}
                            <div className="space-y-3">
                                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                    Acción a realizar
                                </label>
                                <div className="flex flex-wrap gap-4">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="radio" name="actionType" value="bracket" className="w-4 h-4 text-primary focus:ring-primary" />
                                        <span className="text-sm text-slate-700 dark:text-slate-300">Colocar Bracket</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-not-allowed opacity-50">
                                        <input type="radio" name="actionType" value="tad" disabled className="w-4 h-4 text-primary focus:ring-primary" />
                                        <span className="text-sm text-slate-700 dark:text-slate-300">Colocar Microimplant</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="radio" name="actionType" value="elastics" defaultChecked className="w-4 h-4 text-primary focus:ring-primary" />
                                        <span className="text-sm text-slate-700 dark:text-slate-300">Colocar Elásticos</span>
                                    </label>
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
                                        <input
                                            type="text"
                                            placeholder="Ej. Clase II, Triangulares, 1/4 Heavy..."
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
            )}
        </div>
    );
}
