import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Layers, Plus, X, Calendar, Clock, Undo2, Redo2, Trash2, Loader2, LayoutGrid, XCircle } from 'lucide-react';
import { DateInput } from '@/components/inputs';
import { ConfirmDialog } from '@/components/feedback';
import bracketImg from '@/assets/images/odontogram/bracket.svg';
import bracketGanchoImg from '@/assets/images/odontogram/bracket-gancho.svg';
import tadImg from '@/assets/images/odontogram/tad.svg';

import { getToothSrc, generateCombinedSvgDataUrl } from './components/toothSvgHelpers';
import * as odontogramService from '@/services/odontogram.service';

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

// =========================================================================
// MICRO-AJUSTES PARA BRACKETS DE GANCHO (TAMAÑO, POSICIÓN Y ROTACIÓN)
// =========================================================================
export const HOOK_BRACKET_CONFIG = {
    // Cuadrante Superior Derecho (Rotación base 0 si quieres que bajen igual)
    18: { scale: 1.45, offsetX: 0, offsetY: -8, rotate: 180, flipX: false },
    17: { scale: 1.45, offsetX: 0, offsetY: -10, rotate: 180, flipX: false },
    16: { scale: 1.45, offsetX: 0, offsetY: -11, rotate: 180, flipX: false },

    // Cuadrante Superior Izquierdo
    26: { scale: 1.45, offsetX: 0, offsetY: -11, rotate: 180, flipX: true },
    27: { scale: 1.45, offsetX: 0, offsetY: -10, rotate: 180, flipX: true },
    28: { scale: 1.45, offsetX: 0, offsetY: -8, rotate: 180, flipX: true },

    // Cuadrante Inferior Derecho (A los de abajo a veces se les invierte el gancho)
    48: { scale: 1.45, offsetX: 0, offsetY: -3, rotate: 0, flipX: true },
    47: { scale: 1.45, offsetX: 0, offsetY: 4, rotate: 0, flipX: true },
    46: { scale: 1.45, offsetX: 0, offsetY: 8, rotate: 0, flipX: true },

    // Cuadrante Inferior Izquierdo
    36: { scale: 1.45, offsetX: 0, offsetY: 8, rotate: 0, flipX: false },
    37: { scale: 1.45, offsetX: 0, offsetY: 4, rotate: 0, flipX: false },
    38: { scale: 1.45, offsetX: 0, offsetY: -3, rotate: 0, flipX: false },
};

// =========================================================================
// MICRO-AJUSTES PARA BRACKETS NORMALES (POSICIÓN X e Y)
// =========================================================================
export const NORMAL_BRACKET_CONFIG = {
    // Brackets dentales superiores
    11: { offsetX: 0, offsetY: 0 },
    12: { offsetX: 0, offsetY: 0 },
    13: { offsetX: 0, offsetY: 0 },
    14: { offsetX: 0, offsetY: 0 },
    15: { offsetX: 0, offsetY: 0 },

    21: { offsetX: 0, offsetY: 0 },
    22: { offsetX: 0, offsetY: 0 },
    23: { offsetX: 0, offsetY: 0 },
    24: { offsetX: 0, offsetY: 0 },
    25: { offsetX: 0, offsetY: 0 },

    // Brackets dentales inferiores
    31: { offsetX: 0, offsetY: 0 },
    32: { offsetX: 0, offsetY: 0 },
    33: { offsetX: 0, offsetY: 0 },
    34: { offsetX: 0, offsetY: 0 },
    35: { offsetX: 0, offsetY: 0 },

    41: { offsetX: 0, offsetY: 0 },
    42: { offsetX: 0, offsetY: 0 },
    43: { offsetX: 0, offsetY: 0 },
    44: { offsetX: 0, offsetY: 0 },
    45: { offsetX: 0, offsetY: 0 },
};

// Configuración base de la línea Y para TADs (separada por maxilar y mandíbula)
export const TAD_BASE_Y_CONFIG = {
    upperY: 60,   // Sube o baja toda la fila superior
    lowerY: -90   // Sube o baja toda la fila inferior
};

// CONFIGURACIÓN GLOBAL DE TAMAÑO PARA TADs
export const TAD_GLOBAL_CONFIG = {
    size: 27   // Tamaño base (ancho y alto)
};

export const TAD_MICRO_ADJUSTMENTS = {
    // UPPER RIGHT (Q1)
    "16-17": { offsetX: -2, offsetY: 0 },
    "15-16": { offsetX: 6, offsetY: 0 },
    "14-15": { offsetX: -2, offsetY: 0 },
    "13-14": { offsetX: -2, offsetY: 0 },
    "12-13": { offsetX: 2, offsetY: 0 },
    "11-12": { offsetX: -1, offsetY: 0 },

    // UPPER LEFT (Q2)
    "21-22": { offsetX: 0, offsetY: 0 },
    "22-23": { offsetX: -2, offsetY: 0 },
    "23-24": { offsetX: 1, offsetY: 0 },
    "24-25": { offsetX: 2, offsetY: 0 },
    "25-26": { offsetX: -6, offsetY: 0 },
    "26-27": { offsetX: 2, offsetY: 0 },

    // LOWER RIGHT (Q4)
    "46-47": { offsetX: -7.5, offsetY: 10 },
    "45-46": { offsetX: 4.5, offsetY: 10 },
    "44-45": { offsetX: -1, offsetY: 0 },
    "43-44": { offsetX: -1, offsetY: 0 },
    "42-43": { offsetX: 2, offsetY: 0 },
    "41-42": { offsetX: 0, offsetY: 0 },

    // LOWER LEFT (Q3)
    "31-32": { offsetX: -1, offsetY: 0 },
    "32-33": { offsetX: -2, offsetY: 0 },
    "33-34": { offsetX: 1, offsetY: 0 },
    "34-35": { offsetX: 0, offsetY: 0 },
    "35-36": { offsetX: -1, offsetY: 0 },
    "36-37": { offsetX: 7.5, offsetY: 10 }, // Ajustado para que quede a -80 (-90 + 10)
};

// =========================================================================
// MICRO-AJUSTES PARA IMÁGENES DE DIENTES (POSICIÓN X)
// =========================================================================
export const TOOTH_IMAGE_MICRO_ADJUSTMENTS = {
    // Ejemplo: 16: { offsetX: 5 },
    // Añade aquí los ajustes por ID de diente si es necesario
    48: { offsetX: 16 },
    47: { offsetX: 16 },
    46: { offsetX: 16 },
    45: { offsetX: 16 },
    44: { offsetX: 16 },
    43: { offsetX: 16 },
    42: { offsetX: 16 },
    41: { offsetX: 16 },

    31: { offsetX: -16 },
    32: { offsetX: -16 },
    33: { offsetX: -16 },
    34: { offsetX: -16 },
    35: { offsetX: -16 },
    36: { offsetX: -16 },
    37: { offsetX: -16 },
    38: { offsetX: -16 },
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

// No more mock instructions here, we use the hook
const INACTIVE_TYPES = ['extraction', 'missing', 'unerupted'];

import { usePatientElasticsData } from '@/hooks/usePatientElasticsData';

export default function ElasticsSection() {
    // Leer el ID del paciente de la URL para aislar datos en localStorage
    const { id: patientId } = useParams();
    const svgRef = useRef(null);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isReadOnly, setIsReadOnly] = useState(false);

    // Form states
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState('');
    const [hours, setHours] = useState('');
    const [notes, setNotes] = useState('');

    const { instructions, saveInstruction, deleteInstruction, isLoading: isInstructionsLoading } = usePatientElasticsData(patientId);

    // Sequential Selection State
    // Segment-based State
    // activeChain: { typeId: string, segments: Array<{from, to, config}>, lastPoint: number | null, startPoint: number | null }
    const [actionType, setActionType] = useState('elastics');
    const [showConfirmClear, setShowConfirmClear] = useState(false);
    const [tads, setTads] = useState({});
    const [brackets, setBrackets] = useState({}); // New state for brackets
    const [activeChain, setActiveChain] = useState({ segments: [], lastPoint: null, startPoint: null });
    const [instructionToDelete, setInstructionToDelete] = useState(null);

    // Estado de dientes cargado desde el odontograma (para reflejar dientes inactivos)
    const [toothStates, setToothStates] = useState({});

    // completedChains: Array<{ typeId: string, segments: Array<{from, to, config}> }>
    const [completedChains, setCompletedChains] = useState([]);
    const [selectedElasticTypeId, setSelectedElasticTypeId] = useState(ELASTIC_TYPES[0].id);

    // History System for Undo/Redo
    const [history, setHistory] = useState([{ activeChain: { segments: [], lastPoint: null, startPoint: null }, completedChains: [] }]);
    const [historyIndex, setHistoryIndex] = useState(0);

    // Routing Configuration State (Replaces Modal)
    const [elasticRouting, setElasticRouting] = useState('external');

    // Preview state for hovering
    const [previewBracket, setPreviewBracket] = useState(null);

    // ==========================================
    // Cargar datos guardados desde el Odontograma (localStorage)
    // Se ejecuta al montar el componente y cada vez que cambia el patientId
    // ==========================================
    // ==========================================
    // Cargar datos guardados desde el Odontograma (Backend)
    // Se ejecuta al montar el componente y cada vez que cambia el patientId
    // ==========================================
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

            if (Object.keys(newBrackets).length > 0) setBrackets(newBrackets);
            if (global.tads && typeof global.tads === 'object') setTads(global.tads);
            if (Object.keys(newToothStates).length > 0) setToothStates(newToothStates);

        } catch (err) {
            console.error('[ElasticsSection] Error al cargar datos del odontograma desde backend:', err);
        }
    }, [patientId]);

    // Cargar inicialmente
    useEffect(() => {
        loadGlobalOdontogram();
    }, [loadGlobalOdontogram]);



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
                const toothAdj = TOOTH_IMAGE_MICRO_ADJUSTMENTS[id] || { offsetX: 0 };

                const currentType = toothStates[id] || 'original';
                const isImplantCrown = currentType === 'implant-crown';
                const activeTypes = isImplantCrown ? ['implant', 'crown'] : currentType.split('+');
                const isCombined = activeTypes.length > 1 || isImplantCrown;
                const baseType = activeTypes[0] || 'original';

                let src = null;
                // Obtenemos el SVG exacto (simple o combinado)
                src = !isCombined ? getToothSrc(id, baseType) : generateCombinedSvgDataUrl(id, activeTypes);

                teeth.push({
                    id,
                    x: currentX + (toothAdj.offsetX || 0),
                    y: startY,
                    width: dim.width,
                    height: dim.height,
                    isUpper,
                    src
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
    }, [toothStates]);

    // Efecto para precargar las imágenes SVG y manejar el estado de carga
    useEffect(() => {
        let isMounted = true;

        const preloadImages = async () => {
            if (!teethData || teethData.length === 0) {
                if (isMounted) setIsLoading(false);
                return;
            }

            try {
                const imagePromises = teethData
                    .filter(tooth => tooth.src)
                    .map(tooth => {
                        return new Promise((resolve) => {
                            const img = new Image();
                            img.src = tooth.src;
                            img.onload = resolve;
                            img.onerror = resolve; // Continuar, para no quedar en loading infinito
                        });
                    });

                await Promise.all(imagePromises);
            } catch (error) {
                console.error("Error al cargar las imágenes de los dientes:", error);
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };

        setIsLoading(true);
        preloadImages();

        return () => {
            isMounted = false;
        };
    }, [teethData]);

    // Map for fast coordinate lookup
    const toothMap = useMemo(() => {
        const map = {};
        teethData.forEach(t => map[t.id] = t);
        return map;
    }, [teethData]);

    const getBracketCenter = (id) => {
        // Is it a TAD?
        if (typeof id === 'string' && id.includes('-')) {
            const [t1, t2] = id.split('-').map(Number);
            const tooth1 = toothMap[t1];
            const tooth2 = toothMap[t2];
            if (!tooth1 || !tooth2) return { x: 0, y: 0 };

            const baseMidX = (tooth1.x + tooth1.width + tooth2.x) / 2;
            const config = TAD_MICRO_ADJUSTMENTS[id] || { offsetX: 0, offsetY: 0 };
            const offsetX = typeof config === 'number' ? config : (config.offsetX || 0);
            const offsetY = typeof config === 'number' ? 0 : (config.offsetY || 0);

            const archBaseY = tooth1.isUpper ? TAD_BASE_Y_CONFIG.upperY : TAD_BASE_Y_CONFIG.lowerY;

            const midX = baseMidX + offsetX;
            const yPos = (tooth1.isUpper ? tooth1.y + 15 : tooth1.y + tooth1.height - 35) + archBaseY + offsetY;

            const tadSize = TAD_GLOBAL_CONFIG.size;
            return { x: midX, y: yPos + (tadSize / 2) };
        }

        const tooth = toothMap[id];
        if (!tooth) return { x: 0, y: 0 };

        // Dynamic Calculation based on THIS tooth's dimensions
        const bracketYOffset = tooth.isUpper ? (tooth.height * 0.75) : (tooth.height * 0.15);
        const bracketXOffset = (tooth.width - 28) / 2; // Fixed from 20 to 28 (baseSize)

        // Apply Micro-adjustments if it's a hook bracket or normal bracket
        const hookConfig = HOOK_BRACKET_CONFIG[String(id)];
        const normalConfig = NORMAL_BRACKET_CONFIG[String(id)];
        const activeConfig = hookConfig || normalConfig;

        const customOffsetX = activeConfig ? (activeConfig.offsetX || 0) : 0;
        const customOffsetY = activeConfig ? (activeConfig.offsetY || 0) : 0;

        // Center of the 28x28 bracket is +14 + custom offsets
        return {
            x: tooth.x + bracketXOffset + 14 + customOffsetX,
            y: tooth.y + bracketYOffset + 14 + customOffsetY
        };
    };

    // Updated Renderer for Chains of Segments
    const renderElasticChain = (chain, isCompleted = false, isPreview = false) => {
        if (!chain || !chain.segments || chain.segments.length === 0) return null;

        // Si es completado y no es el preview temporal, usa su tipo persistido
        // Si es la cadena activa o el preview, usa el tipo seleccionado actualmente
        const effectiveTypeId = (isCompleted && !isPreview) ? chain.typeId : selectedElasticTypeId;
        const type = ELASTIC_TYPES.find(t => t.id === effectiveTypeId) || ELASTIC_TYPES[0];

        const color = type.color;
        const strokeWidth = type.strokeWidth;
        const opacity = isPreview ? 0.4 : (isCompleted ? 0.8 : 1);

        return (
            <g>
                {chain.segments.map((segment, idx) => {
                    const start = getBracketCenter(segment.from);
                    const end = getBracketCenter(segment.to);
                    // Internal = dashed, External = solid. Preview is explicitly dashed
                    const strokeDasharray = isPreview ? "4, 4" : (segment.config === 'internal' ? "6, 8" : "none");

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
                            className={`transition-all duration-300 ${isPreview ? 'animate-pulse' : 'drop-shadow-md'}`}
                        />
                    );
                })}
            </g>
        );
    };

    // Helper to log state changes
    const pushToHistory = (newActiveChain, newCompletedChains) => {
        setHistory(prev => {
            const newHistory = prev.slice(0, historyIndex + 1);
            newHistory.push({ activeChain: newActiveChain, completedChains: newCompletedChains });
            return newHistory;
        });
        setHistoryIndex(prev => prev + 1);
    };

    const handleTadClick = (pairId) => {
        if (actionType === 'elastics') {
            handleBracketClick(pairId);
            return;
        }
        if (actionType !== 'tad' || isReadOnly) return;

        const isRemoving = !!tads[pairId];

        setTads(prev => {
            const newTads = { ...prev };
            if (newTads[pairId]) delete newTads[pairId];
            else newTads[pairId] = true;
            return newTads;
        });

        // 🎯 Si se elimina un TAD, truncamos los elásticos asociados (mantenemos los anteriores)
        if (isRemoving) {
            // 1. Truncar cadena activa
            const activeSegments = [...activeChain.segments];
            const activeBrokenIdx = activeSegments.findIndex(s => s.from === pairId || s.to === pairId);
            const isOriginBroken = activeChain.startPoint === pairId;

            let newActive = activeChain;
            if (isOriginBroken || activeBrokenIdx !== -1) {
                const truncated = isOriginBroken ? [] : activeSegments.slice(0, activeBrokenIdx);
                newActive = truncated.length > 0 ? {
                    ...activeChain,
                    segments: truncated,
                    lastPoint: truncated[truncated.length - 1].to
                } : { segments: [], lastPoint: null, startPoint: null };

                setActiveChain(newActive);
            }

            // 2. Truncar cadenas completadas
            const newCompleted = completedChains.map(chain => {
                const segments = [...chain.segments];
                const brokenIdx = segments.findIndex(s => s.from === pairId || s.to === pairId);
                if (brokenIdx === -1) return chain;

                const truncated = segments.slice(0, brokenIdx);
                if (truncated.length === 0) return null;

                return {
                    ...chain,
                    segments: truncated,
                    lastPoint: truncated[truncated.length - 1].to
                };
            }).filter(Boolean);

            if (newCompleted.some((c, idx) => c !== completedChains[idx]) || newActive !== activeChain) {
                setCompletedChains(newCompleted);
                pushToHistory(newActive, newCompleted);
            }
        }
    };

    const handleBracketClick = (id, overrideRouting = null) => {
        // --- ARCADO DE BRACKETS (PLACEMENT/REMOVAL) ---
        if (actionType === 'bracket') {
            if (isReadOnly) return; // Bloquear en modo lectura
            if (INACTIVE_TYPES.includes(toothStates[id])) return;

            const isRemoving = !!brackets[id];

            setBrackets(prev => {
                const newBrackets = { ...prev };
                if (newBrackets[id]) delete newBrackets[id];
                else newBrackets[id] = true;
                return newBrackets;
            });

            // Si se elimina un bracket, truncamos los elásticos asociados
            if (isRemoving) {
                // 1. Truncar cadena activa
                const activeSegments = [...activeChain.segments];
                const activeBrokenIdx = activeSegments.findIndex(s => s.from === id || s.to === id);
                const isOriginBroken = activeChain.startPoint === id;

                let newActive = activeChain;
                if (isOriginBroken || activeBrokenIdx !== -1) {
                    const truncated = isOriginBroken ? [] : activeSegments.slice(0, activeBrokenIdx);
                    newActive = truncated.length > 0 ? {
                        ...activeChain,
                        segments: truncated,
                        lastPoint: truncated[truncated.length - 1].to
                    } : { segments: [], lastPoint: null, startPoint: null };

                    setActiveChain(newActive);
                }

                // 2. Truncar cadenas completadas
                const newCompleted = completedChains.map(chain => {
                    const segments = [...chain.segments];
                    const brokenIdx = segments.findIndex(s => s.from === id || s.to === id);
                    if (brokenIdx === -1) return chain;

                    const truncated = segments.slice(0, brokenIdx);
                    if (truncated.length === 0) return null;

                    return {
                        ...chain,
                        segments: truncated,
                        lastPoint: truncated[truncated.length - 1].to
                    };
                }).filter(Boolean);

                if (newCompleted.some((c, idx) => c !== completedChains[idx]) || newActive !== activeChain) {
                    setCompletedChains(newCompleted);
                    pushToHistory(newActive, newCompleted);
                }
            }
            return;
        }

        // --- ARCADO DE ELÁSTICOS ---
        if (actionType !== 'elastics' || isReadOnly) return;

        // Solo permitir elásticos en dientes que tengan BRACKET o TAD
        const hasAnchor = brackets[id] || tads[id] || (typeof id === 'string' && id.includes('-') && tads[id]);
        if (!hasAnchor) {
            return;
        }

        // 1. Start new chain if empty
        if (activeChain.segments.length === 0 && !activeChain.lastPoint) {
            const newActive = {
                typeId: selectedElasticTypeId,
                segments: [],
                lastPoint: id,
                startPoint: id
            };
            setActiveChain(newActive);
            pushToHistory(newActive, completedChains);
            return;
        }

        const last = activeChain.lastPoint;

        // 2. Prevent immediate backtrack/double-click on same bracket
        if (id === last) {
            return;
        }

        // 3. Create New Segment directly using current routing selection
        const routingToUse = overrideRouting || elasticRouting;

        const newSegment = {
            from: last,
            to: id,
            config: routingToUse
        };

        const updatedChain = {
            ...activeChain,
            lastPoint: id,
            segments: [...activeChain.segments, newSegment]
        };

        // 4. Check if this segment closes the loop
        if (id === activeChain.startPoint) {
            // "Bake-in" the currently selected type at the moment of closing
            const finalChain = { ...updatedChain, typeId: selectedElasticTypeId };

            // If it closes, commit to completed chains
            const newCompleted = [...completedChains, finalChain];
            const newActive = { segments: [], lastPoint: null, startPoint: null };
            setCompletedChains(newCompleted);
            setActiveChain(newActive);
            pushToHistory(newActive, newCompleted);
        } else {
            // 5. Otherwise, update active chain
            setActiveChain(updatedChain);
            pushToHistory(updatedChain, completedChains);
        }
    };

    const handleRightClickElastic = (e, id) => {
        e.preventDefault();
        const oppositeRouting = elasticRouting === 'external' ? 'internal' : 'external';
        handleBracketClick(id, oppositeRouting);
    };

    const handleRightClickTad = (e, pairId) => {
        e.preventDefault();
        if (actionType === 'elastics') {
            const oppositeRouting = elasticRouting === 'external' ? 'internal' : 'external';
            handleBracketClick(pairId, oppositeRouting);
        }
    };

    const handleUndo = useCallback(() => {
        if (historyIndex > 0) {
            const newIndex = historyIndex - 1;
            setHistoryIndex(newIndex);
            setActiveChain(history[newIndex].activeChain);
            setCompletedChains(history[newIndex].completedChains);
        }
    }, [history, historyIndex]);

    const captureOdontogramImage = async () => {
        if (!svgRef.current) return null;

        try {
            const svgElement = svgRef.current;
            const serializer = new XMLSerializer();
            
            // Clone the SVG to manipulate it without affecting the UI
            const clonedSvg = svgElement.cloneNode(true);
            clonedSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

            // 1. Inline all images (Teeth, Brackets, TADs)
            const images = clonedSvg.querySelectorAll('image');
            for (const img of images) {
                const href = img.getAttribute('href');
                if (href && !href.startsWith('data:')) {
                    try {
                        const response = await fetch(href);
                        const blob = await response.blob();
                        const base64 = await new Promise((resolve) => {
                            const reader = new FileReader();
                            reader.onloadend = () => resolve(reader.result);
                            reader.readAsDataURL(blob);
                        });
                        img.setAttribute('href', base64);
                    } catch (err) {
                        console.error("Error inlining image in SVG:", href, err);
                    }
                }
            }

            const svgString = serializer.serializeToString(clonedSvg);
            
            // 2. Render SVG to Canvas
            return new Promise((resolve) => {
                const canvas = document.createElement('canvas');
                // Use a higher scale for better quality if needed, but 1400x500 is base
                canvas.width = 1400;
                canvas.height = 500;
                const ctx = canvas.getContext('2d');
                
                // Clear background to white (optional, but good for previews)
                ctx.fillStyle = 'white';
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                const img = new Image();
                const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
                const url = URL.createObjectURL(svgBlob);

                img.onload = () => {
                    ctx.drawImage(img, 0, 0);
                    URL.revokeObjectURL(url);
                    
                    canvas.toBlob((blob) => {
                        const file = new File([blob], `odontogram_preview_${Date.now()}.png`, { type: 'image/png' });
                        resolve(file);
                    }, 'image/png');
                };

                img.onerror = (err) => {
                    console.error("Error drawing SVG to canvas:", err);
                    URL.revokeObjectURL(url);
                    resolve(null);
                };

                img.src = url;
            });
        } catch (error) {
            console.error("Error capturing odontogram image:", error);
            return null;
        }
    };

    const handleSaveInstruction = async () => {
        if (isReadOnly) return;

        // Capture the image first
        const imageFile = await captureOdontogramImage();

        const type = ELASTIC_TYPES.find(t => t.id === selectedElasticTypeId);

        const newInstruction = {
            startDate,
            endDate,
            hours: hours ? `${hours} horas` : 'No especificado',
            type: type ? type.label : selectedElasticTypeId,
            typeId: selectedElasticTypeId,
            notes,
            odontogramData: {
                completedChains,
                brackets,
                tads
            }
        };

        const success = await saveInstruction(newInstruction, imageFile);
        if (success) {
            setIsModalOpen(false);
        }
    };

    const handleOpenNew = () => {
        setIsReadOnly(false);
        setStartDate(new Date().toISOString().split('T')[0]);
        setEndDate('');
        setHours('');
        setNotes('');
        setSelectedElasticTypeId(ELASTIC_TYPES[0].id);

        // Reset Odontogram to last "global" state
        loadGlobalOdontogram();
        setCompletedChains([]);
        setActiveChain({ segments: [], lastPoint: null, startPoint: null });
        setHistory([{ activeChain: { segments: [], lastPoint: null, startPoint: null }, completedChains: [] }]);
        setHistoryIndex(0);

        setIsModalOpen(true);
    };

    const handleOpenView = (inst) => {
        setIsReadOnly(true);
        setStartDate(inst.startDate || '');
        setEndDate(inst.endDate || '');
        setHours(inst.hours?.replace(' horas', '') || '');
        setNotes(inst.notes || '');
        setSelectedElasticTypeId(inst.typeId || ELASTIC_TYPES[0].id);

        // Load Snapshotted Odontogram
        if (inst.odontogramData) {
            setCompletedChains(inst.odontogramData.completedChains || []);
            setBrackets(inst.odontogramData.brackets || {});
            setTads(inst.odontogramData.tads || {});
        }

        setActiveChain({ segments: [], lastPoint: null, startPoint: null });
        setHistory([{ activeChain: { segments: [], lastPoint: null, startPoint: null }, completedChains: inst.odontogramData?.completedChains || [] }]);
        setHistoryIndex(0);

        setIsModalOpen(true);
    };

    const handleRedo = useCallback(() => {
        if (historyIndex < history.length - 1) {
            const newIndex = historyIndex + 1;
            setHistoryIndex(newIndex);
            setActiveChain(history[newIndex].activeChain);
            setCompletedChains(history[newIndex].completedChains);
        }
    }, [history, historyIndex]);

    const executeClear = useCallback(() => {
        const newActive = { segments: [], lastPoint: null, startPoint: null };
        const newCompleted = [];
        setActiveChain(newActive);
        setCompletedChains(newCompleted);
        pushToHistory(newActive, newCompleted);
        setShowConfirmClear(false);
    }, [pushToHistory]);

    const handleClear = useCallback(() => {
        if (activeChain.segments.length > 0 || completedChains.length > 0) {
            setShowConfirmClear(true);
        }
    }, [activeChain.segments.length, completedChains.length]);

    const handleAddAllBrackets = useCallback(() => {
        if (isReadOnly) return;

        const allToothIds = [...UPPER_RIGHT, ...UPPER_LEFT, ...LOWER_RIGHT, ...LOWER_LEFT];
        const newBrackets = { ...brackets };
        let changed = false;

        allToothIds.forEach(id => {
            const state = toothStates[id] || 'original';
            if (!INACTIVE_TYPES.includes(state) && !newBrackets[id]) {
                newBrackets[id] = true;
                changed = true;
            }
        });

        if (changed) {
            setBrackets(newBrackets);
        }
    }, [brackets, isReadOnly, toothStates]);

    const handleAddAllTads = useCallback(() => {
        if (isReadOnly) return;

        const newTads = { ...tads };
        let changed = false;

        teethData.forEach((tooth, idx) => {
            if (idx === teethData.length - 1) return;

            const nextTooth = teethData[idx + 1];

            const q1 = parseInt(String(tooth.id)[0]);
            const q2 = parseInt(String(nextTooth.id)[0]);
            if (q1 !== q2) return;

            const pos1 = parseInt(String(tooth.id)[1]);
            const pos2 = parseInt(String(nextTooth.id)[1]);
            if (pos1 === 8 || pos2 === 8) return;

            const pairId = [tooth.id, nextTooth.id].sort((a, b) => a - b).join('-');
            if (pairId === '11-21' || pairId === '31-41') return;

            if (!newTads[pairId]) {
                newTads[pairId] = true;
                changed = true;
            }
        });

        if (changed) {
            setTads(newTads);
        }
    }, [tads, isReadOnly, teethData]);

    // Keyboard Shortcuts (CTRL+Z, CTRL+Y)
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
                e.preventDefault();
                handleUndo();
            }
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
                e.preventDefault();
                handleRedo();
            }
        };

        if (isModalOpen) {
            window.addEventListener('keydown', handleKeyDown);
        }
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleUndo, handleRedo, isModalOpen]);

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
                        onClick={handleOpenNew}
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
                    {isInstructionsLoading ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <Loader2 className="w-8 h-8 text-primary animate-spin mb-3" />
                            <p className="text-sm text-slate-500">Cargando historial...</p>
                        </div>
                    ) : instructions.length === 0 ? (
                        <div className="text-center py-8 border border-dashed border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-800/30">
                            <p className="text-sm text-slate-400 dark:text-slate-500 italic">
                                No se han registrado instrucciones de elásticos aún.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-3">
                            {instructions.map((instruction) => (
                                <div
                                    key={instruction.id}
                                    onClick={() => handleOpenView(instruction)}
                                    className="
                                        flex flex-col md:flex-row md:items-center justify-between gap-4
                                        p-4 rounded-xl
                                        bg-slate-50 dark:bg-slate-800/50
                                        border border-slate-100 dark:border-slate-700/50
                                        hover:border-primary/30 dark:hover:border-primary/50
                                        hover:bg-white dark:hover:bg-slate-800
                                        transition-all cursor-pointer group
                                    "
                                >
                                    {/* Left Info */}
                                    <div className="flex-1 space-y-2">
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold text-sm text-slate-700 dark:text-slate-200 group-hover:text-primary transition-colors">
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

                                    {/* Right Actions */}
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setInstructionToDelete(instruction.id);
                                            }}
                                            className="
                                                p-2 rounded-lg
                                                text-slate-400 hover:text-red-600
                                                hover:bg-red-50 dark:hover:bg-red-900/20
                                                transition-all opacity-0 group-hover:opacity-100
                                            "
                                        >
                                            <Trash2 size={16} />
                                        </button>
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
                                {isReadOnly ? 'Ver Instrucción de Elásticos' : 'Registrar Nueva Instrucción'}
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
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                        Odontograma de Elásticos
                                    </label>

                                    {/* History Toolbar */}
                                    <div className={`flex items-center gap-1 bg-slate-100 dark:bg-slate-800/50 p-1 rounded-lg border border-slate-200 dark:border-slate-700/50 ${isReadOnly ? 'opacity-50 pointer-events-none' : ''}`}>
                                        <button
                                            onClick={handleUndo}
                                            disabled={historyIndex === 0 || isReadOnly}
                                            title="Deshacer (Ctrl+Z)"
                                            className="p-1.5 rounded-md text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-100 hover:shadow-sm disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:shadow-none transition-all active:scale-95 disabled:active:scale-100"
                                        >
                                            <Undo2 size={16} />
                                        </button>
                                        <button
                                            onClick={handleRedo}
                                            disabled={historyIndex === history.length - 1 || isReadOnly}
                                            title="Rehacer (Ctrl+Y)"
                                            className="p-1.5 rounded-md text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-100 hover:shadow-sm disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:shadow-none transition-all active:scale-95 disabled:active:scale-100"
                                        >
                                            <Redo2 size={16} />
                                        </button>
                                        <div className="w-[1px] h-4 bg-slate-300 dark:bg-slate-600 mx-1"></div>
                                        <button
                                            onClick={handleClear}
                                            disabled={(activeChain.segments.length === 0 && completedChains.length === 0) || isReadOnly}
                                            title="Limpiar todos los elásticos"
                                            className="p-1.5 rounded-md text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700 hover:text-red-600 dark:hover:text-red-400 hover:shadow-sm disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:shadow-none transition-all active:scale-95 disabled:active:scale-100"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                        <div className="w-[1px] h-4 bg-slate-300 dark:bg-slate-600 mx-1"></div>
                                        <button
                                            onClick={handleAddAllBrackets}
                                            disabled={isReadOnly}
                                            title="Agregar todos los brackets"
                                            className="p-1.5 rounded-md text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700 hover:text-primary dark:hover:text-primary hover:shadow-sm disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:shadow-none transition-all active:scale-95 disabled:active:scale-100"
                                        >
                                            <LayoutGrid size={16} />
                                        </button>
                                        <button
                                            onClick={handleAddAllTads}
                                            disabled={isReadOnly}
                                            title="Agregar todos los TADs"
                                            className="p-1.5 rounded-md text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700 hover:text-primary dark:hover:text-primary hover:shadow-sm disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:shadow-none transition-all active:scale-95 disabled:active:scale-100"
                                        >
                                            <XCircle size={16} />
                                        </button>
                                    </div>
                                </div>

                                <div
                                    className="
                                        w-full overflow-x-auto
                                        bg-slate-50 dark:bg-slate-800/30
                                        rounded-xl border border-slate-200 dark:border-slate-600
                                        px-2 py-4 flex flex-col items-center relative
                                        min-h-[550px] justify-center
                                    "
                                >

                                    {isLoading ? (
                                        <div className="flex flex-col items-center justify-center absolute inset-0 animate-in fade-in duration-300">
                                            <Loader2 className="w-8 h-8 text-primary animate-spin mb-3" />
                                            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                                                Cargando odontograma...
                                            </span>
                                        </div>
                                    ) : (
                                        <>
                                            {/* SVG Container - Compact ViewBox */}
                                            <svg
                                                ref={svgRef}
                                                width="1400"
                                                height="500"
                                                viewBox="0 0 1400 500"
                                                className="max-w-full select-none animate-in fade-in duration-500"
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
                                                    {teethData.map((tooth) => {
                                                        const isInactive = INACTIVE_TYPES.includes(toothStates[tooth.id]);
                                                        return (
                                                            <g
                                                                key={`tooth-${tooth.id}`}
                                                                transform={`translate(${tooth.x}, ${tooth.y})`}
                                                            >
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
                                                        );
                                                    })}
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

                                                    {/* Render Preview Segment */}
                                                    {activeChain.lastPoint && previewBracket && activeChain.lastPoint !== previewBracket && (brackets[previewBracket] || tads[previewBracket]) && (
                                                        renderElasticChain({
                                                            typeId: selectedElasticTypeId,
                                                            segments: [{
                                                                from: activeChain.lastPoint,
                                                                to: previewBracket,
                                                                config: elasticRouting
                                                            }]
                                                        }, false, true)
                                                    )}
                                                </g>

                                                {/* LAYER 2.5: TADs */}
                                                <g id="tad-layer">
                                                    {teethData.map((tooth, idx) => {
                                                        if (idx === teethData.length - 1) return null;

                                                        const nextTooth = teethData[idx + 1];

                                                        const q1 = parseInt(String(tooth.id)[0]);
                                                        const q2 = parseInt(String(nextTooth.id)[0]);
                                                        if (q1 !== q2) return null;

                                                        const pos1 = parseInt(String(tooth.id)[1]);
                                                        const pos2 = parseInt(String(nextTooth.id)[1]);
                                                        if (pos1 === 8 || pos2 === 8) return null;

                                                        const pairId = [tooth.id, nextTooth.id].sort((a, b) => a - b).join('-');
                                                        if (pairId === '11-21' || pairId === '31-41') return null;

                                                        const hasTad = !!tads[pairId];
                                                        const config = TAD_MICRO_ADJUSTMENTS[pairId] || { offsetX: 0, offsetY: 0 };
                                                        const offsetX = typeof config === 'number' ? config : (config.offsetX || 0);
                                                        const offsetY = typeof config === 'number' ? 0 : (config.offsetY || 0);

                                                        const archBaseY = tooth.isUpper ? TAD_BASE_Y_CONFIG.upperY : TAD_BASE_Y_CONFIG.lowerY;

                                                        const baseMidX = (tooth.x + tooth.width + nextTooth.x) / 2;
                                                        const midX = baseMidX + offsetX;

                                                        const yPos = (tooth.isUpper ? tooth.y + 15 : tooth.y + tooth.height - 35) + archBaseY + offsetY;

                                                        // Logic Identical to Brackets
                                                        const isActive = activeChain.lastPoint === pairId || activeChain.segments.some(s => s.from === pairId || s.to === pairId);
                                                        const isOrigin = activeChain.startPoint === pairId;
                                                        const isCompleted = completedChains.some(chain => chain.segments.some(s => s.from === pairId || s.to === pairId));

                                                        const tadSize = TAD_GLOBAL_CONFIG.size;
                                                        const tadHalfSize = tadSize / 2;

                                                        return (
                                                            <g key={`tad-${pairId}`} transform={`translate(${midX - tadHalfSize}, ${yPos})`}
                                                                onClick={() => handleTadClick(pairId)}
                                                                onContextMenu={(e) => handleRightClickTad(e, pairId)}
                                                                onMouseEnter={() => setPreviewBracket(pairId)}
                                                                onMouseLeave={() => setPreviewBracket(null)}
                                                                className={actionType === 'tad' || actionType === 'elastics' ? "cursor-pointer" : ""}>
                                                                <rect x={-tadHalfSize} y={-120} width={tadSize * 2} height={240} fill="transparent" />
                                                                {hasTad ? (
                                                                    <image
                                                                        href={tadImg}
                                                                        width={tadSize}
                                                                        height={tadSize}
                                                                        style={{ transformOrigin: `${tadHalfSize}px ${tadHalfSize}px`, transform: tooth.isUpper ? 'none' : 'rotate(180deg)' }}
                                                                        className={`transition-all duration-200 ${isOrigin ? 'drop-shadow-[0_0_8px_rgba(34,197,94,0.9)] brightness-125 scale-125' : isActive ? 'drop-shadow-[0_0_5px_rgba(59,130,246,0.9)] brightness-125 scale-110' : isCompleted ? 'opacity-100 drop-shadow-sm brightness-90' : 'opacity-80 hover:opacity-100 hover:scale-110'}`}
                                                                    />
                                                                ) : (
                                                                    actionType === 'tad' && (
                                                                        <rect x="-10" y="-120" width="40" height="240" fill="rgba(59, 130, 246, 0.2)" className="opacity-0 hover:opacity-100 transition-opacity" />
                                                                    )
                                                                )}
                                                            </g>
                                                        );
                                                    })}
                                                </g>

                                                {/* LAYER 3: Brackets & Interactivity (Top) */}
                                                <g id="bracket-layer">
                                                    {teethData.map((tooth) => {
                                                        // Dynamic positioning relative to tooth size
                                                        const bracketYOffset = tooth.isUpper ? (tooth.height * 0.75) : (tooth.height * 0.15);
                                                        const bracketXOffset = (tooth.width - 28) / 2; // Fixed from 20 to 28 (baseSize)
                                                        const activeIndex = activeChain.lastPoint === tooth.id || activeChain.startPoint === tooth.id || activeChain.segments.some(s => s.from === tooth.id || s.to === tooth.id);
                                                        const isActive = activeIndex;
                                                        const isOrigin = activeChain.startPoint === tooth.id;
                                                        const isCompleted = completedChains.some(chain => chain.segments.some(s => s.from === tooth.id || s.to === tooth.id));

                                                        // Micro-Adjustments Configuration
                                                        const hookConfig = HOOK_BRACKET_CONFIG[String(tooth.id)];
                                                        const normalConfig = NORMAL_BRACKET_CONFIG[String(tooth.id)];
                                                        const activeConfig = hookConfig || normalConfig;

                                                        const useHookBracket = !!hookConfig;
                                                        const currentBracketImg = useHookBracket ? bracketGanchoImg : bracketImg;

                                                        const scale = activeConfig ? (activeConfig.scale || 1) : 1;
                                                        const offsetX = activeConfig ? (activeConfig.offsetX || 0) : 0;
                                                        const offsetY = activeConfig ? (activeConfig.offsetY || 0) : 0;
                                                        const rotate = activeConfig ? (activeConfig.rotate || 0) : 0;
                                                        const flipX = activeConfig ? !!activeConfig.flipX : false;

                                                        const baseSize = 28;
                                                        const sizeW = baseSize * scale;
                                                        const sizeH = baseSize * scale;

                                                        // Center adjustment when scaling to keep it centered on the tooth
                                                        const scaleOffsetX = (baseSize - sizeW) / 2;
                                                        const scaleOffsetY = (baseSize - sizeH) / 2;
                                                        const hasBracket = !!brackets[tooth.id];

                                                        return (
                                                            <g key={`bracket-${tooth.id}`} transform={`translate(${tooth.x}, ${tooth.y})`}>
                                                                <g
                                                                    transform={`translate(${bracketXOffset + offsetX}, ${bracketYOffset + offsetY})`}
                                                                    className="cursor-pointer"
                                                                    onClick={() => handleBracketClick(tooth.id)}
                                                                    onContextMenu={(e) => handleRightClickElastic(e, tooth.id)}
                                                                    onMouseEnter={() => setPreviewBracket(tooth.id)}
                                                                    onMouseLeave={() => setPreviewBracket(null)}
                                                                >
                                                                    {/* Click Area expansion */}
                                                                    <rect x={-10} y={-10} width={sizeW + 20} height={sizeH + 20} fill="transparent" />

                                                                    {hasBracket ? (
                                                                        <g transform={`scale(${flipX ? -1 : 1}, 1) translate(${flipX ? -28 : 0}, 0)`}>
                                                                            <g transform={`rotate(${rotate}, 14, 14)`}>
                                                                                <image
                                                                                    href={currentBracketImg}
                                                                                    x={scaleOffsetX}
                                                                                    y={scaleOffsetY}
                                                                                    width={sizeW}
                                                                                    height={sizeH}
                                                                                    style={{ transformOrigin: '14px 14px' }}
                                                                                    className={`transition-all duration-200 ${isOrigin ? 'drop-shadow-[0_0_8px_rgba(34,197,94,0.9)] brightness-125 scale-125' : isActive ? 'drop-shadow-[0_0_5px_rgba(59,130,246,0.9)] brightness-125 scale-110' : isCompleted ? 'opacity-100 drop-shadow-sm brightness-90' : 'opacity-80 hover:opacity-100 hover:scale-105'}`}
                                                                                />
                                                                            </g>
                                                                        </g>
                                                                    ) : (
                                                                        actionType === 'bracket' && (
                                                                            <circle cx="14" cy="14" r="10" fill="rgba(59, 130, 246, 0.2)" className="opacity-0 hover:opacity-100 transition-opacity" />
                                                                        )
                                                                    )}
                                                                </g>
                                                            </g>
                                                        );
                                                    })}
                                                </g>
                                            </svg>

                                            <p className="text-base font-light text-slate-600 dark:text-slate-300 text-center mt-5 max-w-lg mb-2">
                                                Seleccione un bracket para iniciar o gestionar la instrucción de elásticos.
                                            </p>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* 2. Actions Section */}
                            <div className="space-y-3">
                                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                    Acción a realizar
                                </label>
                                <div className="flex flex-wrap items-center gap-4">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="radio" name="actionType" value="bracket" checked={actionType === 'bracket'} onChange={() => setActionType('bracket')} disabled={isReadOnly} className="w-4 h-4 text-primary focus:ring-primary disabled:opacity-50" />
                                        <span className="text-sm text-slate-700 dark:text-slate-300">Colocar Bracket</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="radio" name="actionType" value="tad" checked={actionType === 'tad'} onChange={() => setActionType('tad')} disabled={isReadOnly} className="w-4 h-4 text-primary focus:ring-primary disabled:opacity-50" />
                                        <span className="text-sm text-slate-700 dark:text-slate-300">Colocar Microimplant</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer pr-4 border-r border-slate-200 dark:border-slate-700">
                                        <input type="radio" name="actionType" value="elastics" checked={actionType === 'elastics'} onChange={() => setActionType('elastics')} disabled={isReadOnly} className="w-4 h-4 text-primary focus:ring-primary disabled:opacity-50" />
                                        <span className="text-sm text-slate-700 dark:text-slate-300">Colocar Elásticos</span>
                                    </label>

                                    {/* Configuración de Ruta (Interno/Externo) */}
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => setElasticRouting('external')}
                                            disabled={isReadOnly}
                                            className={`
                                                relative flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-semibold transition-all duration-300
                                                ${elasticRouting === 'external'
                                                    ? 'bg-primary text-white shadow-[0_0_12px_rgba(59,130,246,0.6)] scale-[1.02] border-transparent'
                                                    : 'bg-slate-50 dark:bg-slate-800 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-700'
                                                }
                                                ${isReadOnly && elasticRouting !== 'external' ? 'opacity-30' : ''}
                                            `}
                                        >
                                            <div className={`w-4 h-[2px] ${elasticRouting === 'external' ? 'bg-white' : 'bg-slate-400 dark:bg-slate-500'}`} />
                                            Externo
                                            {elasticRouting === 'external' && !isReadOnly && (
                                                <span className="absolute inset-0 rounded-lg ring-2 ring-primary dark:ring-primary animate-pulse opacity-20 pointer-events-none" />
                                            )}
                                        </button>

                                        <button
                                            onClick={() => setElasticRouting('internal')}
                                            disabled={isReadOnly}
                                            className={`
                                                relative flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-semibold transition-all duration-300
                                                ${elasticRouting === 'internal'
                                                    ? 'bg-primary text-white shadow-[0_0_12px_rgba(59,130,246,0.6)] scale-[1.02] border-transparent'
                                                    : 'bg-slate-50 dark:bg-slate-800 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-700'
                                                }
                                                ${isReadOnly && elasticRouting !== 'internal' ? 'opacity-30' : ''}
                                            `}
                                        >
                                            <div className={`w-4 h-[2px] border-t-2 border-dotted ${elasticRouting === 'internal' ? 'border-white' : 'border-slate-400 dark:bg-slate-500'}`} />
                                            Interno
                                            {elasticRouting === 'internal' && !isReadOnly && (
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
                                        <DateInput
                                            label="Fecha de Inicio"
                                            value={startDate}
                                            onChange={setStartDate}
                                            readOnly={isReadOnly}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <DateInput
                                            label="Fecha de Fin (Opcional)"
                                            value={endDate}
                                            onChange={setEndDate}
                                            readOnly={isReadOnly}
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
                                            disabled={isReadOnly}
                                            className="
                                                w-full px-3 py-2 rounded-lg text-sm
                                                bg-slate-50 dark:bg-slate-800
                                                border border-slate-200 dark:border-slate-700
                                                focus:ring-2 focus:ring-primary/20 focus:border-primary
                                                outline-none transition-all
                                                text-slate-700 dark:text-slate-200
                                                appearance-none cursor-pointer
                                                disabled:opacity-70 disabled:cursor-default
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
                                            value={hours}
                                            onChange={(e) => setHours(e.target.value)}
                                            readOnly={isReadOnly}
                                            className="
                                                w-full px-3 py-2 rounded-lg text-sm
                                                bg-slate-50 dark:bg-slate-800
                                                border border-slate-200 dark:border-slate-700
                                                focus:ring-2 focus:ring-primary/20 focus:border-primary
                                                outline-none transition-all
                                                text-slate-700 dark:text-slate-200
                                                read-only:opacity-70 read-only:cursor-default
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
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        readOnly={isReadOnly}
                                        className="
                                            w-full px-3 py-2 rounded-lg text-sm
                                            bg-slate-50 dark:bg-slate-800
                                            border border-slate-200 dark:border-slate-700
                                            focus:ring-2 focus:ring-primary/20 focus:border-primary
                                            outline-none transition-all resize-none
                                            text-slate-700 dark:text-slate-200
                                            read-only:opacity-70 read-only:cursor-default
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
                            {!isReadOnly && (
                                <button
                                    onClick={handleSaveInstruction}
                                    className="
                                        px-4 py-2 rounded-lg text-sm font-medium
                                        bg-primary text-white 
                                        hover:brightness-110 active:scale-95
                                        transition-all shadow-sm
                                    "
                                >
                                    Guardar Instrucción
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <ConfirmDialog
                open={showConfirmClear}
                title="¿Limpiar todos los elásticos?"
                message="Esta acción eliminará todos los elásticos y cadenas actuales del odontograma. ¿Estás seguro de que deseas continuar?"
                confirmLabel="Sí, limpiar todo"
                cancelLabel="Cancelar"
                confirmVariant="error"
                onConfirm={executeClear}
                onCancel={() => setShowConfirmClear(false)}
            />

            <ConfirmDialog
                open={!!instructionToDelete}
                title="¿Eliminar instrucción?"
                message="Esta acción no se puede deshacer. La instrucción se eliminará permanentemente de la base de datos."
                confirmLabel="Eliminar permanentemente"
                cancelLabel="Cancelar"
                confirmVariant="error"
                onConfirm={async () => {
                    await deleteInstruction(instructionToDelete);
                    setInstructionToDelete(null);
                }}
                onCancel={() => setInstructionToDelete(null)}
            />
        </div>
    );
}

