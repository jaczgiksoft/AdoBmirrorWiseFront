import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * ALIGNER_EXCLUDED_TYPES
 * Clinical rule: Aligners cannot be placed over these tooth states.
 */
const ALIGNER_EXCLUDED_TYPES = ['extraction', 'missing', 'unerupted'];

/**
 * ALIGNER_BRACKET_WARNING
 * Activa o desactiva el highlight de advertencia cuando hay brackets.
 */
const ALIGNER_BRACKET_WARNING = true;

/**
 * CONFIGURACIÓN DE POSICIÓN Y ESTILO (GESTIONAR AQUÍ)
 * Modifica estos valores para ajustar la visualización de los alineadores.
 */
const ALIGNER_CONFIG = {
    upper: {
        yPosition: 70,      // Altura base (Y) para el arco superior
        thickness: 82,      // Grosor del alineador
        archDepth: 80,      // Pronunciación de la curva (profundidad)
    },
    lower: {
        yPosition: 45,      // Altura base (Y) para el arco inferior
        thickness: 82,      // Grosor del alineador
        archDepth: 76,      // Pronunciación de la curva (profundidad)
    }
};

/**
 * ANATOMICAL_OFFSETS
 * Ajustes finos por diente para que el alineador siga la anatomía (borde incisal/gingival).
 * Los IDs corresponden al sistema FDI (11-18, 21-28, 31-38, 41-48).
 * Puedes pasar un número (solo Y) o un objeto { x, y, h } para control total.
 * x: offset horizontal, y: offset vertical, h: grosor (thickness) específico.
 */
const ANATOMICAL_OFFSETS = {
    upper: {
        11: { x: 0, y: -16, h: 65 },
        21: { x: 0, y: -16, h: 65 },

        12: { x: 0, y: -11, h: 54 },
        22: { x: 0, y: -11, h: 54 },

        13: { x: 0, y: -7, h: 64 },
        23: { x: 0, y: -7, h: 64 },

        14: { x: 0, y: 2, h: 54 },
        24: { x: 0, y: 2, h: 54 },

        15: { x: 0, y: 11, h: 55 },
        25: { x: 0, y: 11, h: 55 },

        16: { x: 0, y: 27, h: 50 },
        26: { x: 0, y: 27, h: 50 },

        17: { x: 0, y: 45, h: 50 },
        27: { x: 0, y: 45, h: 50 },

        18: { x: -2, y: 72, h: 45 },
        28: { x: 2, y: 72, h: 45 },
    },
    lower: {
        41: { x: 0, y: 63, h: 56 },
        31: { x: 0, y: 63, h: 56 },

        42: { x: 0, y: 62, h: 57 },
        32: { x: 0, y: 62, h: 57 },

        43: { x: 0, y: 60, h: 70 },
        33: { x: 0, y: 60, h: 70 },

        44: { x: 0, y: 47, h: 55 },
        34: { x: 0, y: 47, h: 55 },

        45: { x: 0, y: 38, h: 55 },
        35: { x: 0, y: 38, h: 55 },

        46: { x: 0, y: 24, h: 52 },
        36: { x: 0, y: 24, h: 52 },

        47: { x: 0, y: 4, h: 49 },
        37: { x: 0, y: 4, h: 49 },

        48: { x: -4, y: -20, h: 45 },
        38: { x: 4, y: -20, h: 45 },
    }
};

/**
 * getLinearSegments
 * Devuelve comandos de línea (L...) para una serie de puntos.
 */
const getLinearSegments = (points) => {
    if (!points || points.length < 2) return '';
    return points.slice(1).map(p => ` L ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join('');
};

/**
 * getSmoothSegments
 * Devuelve solo los comandos de curva (Q...Q...) para una serie de puntos.
 */
const getSmoothSegments = (points) => {
    if (!points || points.length < 2) return '';
    let d = "";
    for (let i = 1; i < points.length - 1; i++) {
        const curr = points[i];
        const next = points[i + 1];
        const mx = (curr.x + next.x) / 2;
        const my = (curr.y + next.y) / 2;
        d += ` Q ${curr.x.toFixed(2)} ${curr.y.toFixed(2)} ${mx.toFixed(2)} ${my.toFixed(2)}`;
    }
    const last = points[points.length - 1];
    d += ` L ${last.x.toFixed(2)} ${last.y.toFixed(2)}`;
    return d;
};

/**
 * buildSmoothPath
 * Genera un string de path SVG completo (M...Q...L).
 */
const buildSmoothPath = (points) => {
    if (!points || points.length < 1) return '';
    return `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}` + getSmoothSegments(points);
};

/**
 * AlignerOverlay
 *
 * Renders a semi-transparent SVG aligner path over a dental arch.
 * Uses an SVG <mask> to cut out excluded teeth (extracted, missing, unerupted).
 * Brackets on teeth reduce aligner opacity on that segment.
 */
export default function AlignerOverlay({
    isVisible,
    isUpper,
    teethIds,
    toothStates,
    brackets,
    getDynamicOffset,
}) {
    // Extraer configuración según la arcada
    const { yPosition: STRIP_Y, thickness: STRIP_THICKNESS, archDepth: ARCH_DEPTH } =
        isUpper ? ALIGNER_CONFIG.upper : ALIGNER_CONFIG.lower;

    /** 
     * Compute per-tooth data: X position, exclusion status, and bracket conflict.
     */
    const toothData = useMemo(() => {
        return teethIds.map((id) => {
            const dynamicX = getDynamicOffset(id);
            const state = toothStates[id] || 'original';
            const isExcluded = ALIGNER_EXCLUDED_TYPES.includes(state);
            const hasBracket = !!brackets?.[id];

            // Extraer config anatómica extendida
            const config = isUpper ? ANATOMICAL_OFFSETS.upper[id] : ANATOMICAL_OFFSETS.lower[id];

            const offX = typeof config === 'object' ? (config.x || 0) : 0;
            const offY = typeof config === 'object' ? (config.y || 0) : (config || 0);
            const offH = typeof config === 'object' ? (config.h || STRIP_THICKNESS) : STRIP_THICKNESS;

            return {
                id,
                x: dynamicX + offX,
                isExcluded,
                hasBracket,
                anatomicalY: offY,
                thickness: offH
            };
        }).filter(t => t.x !== undefined);
    }, [teethIds, toothStates, brackets, getDynamicOffset, isUpper, STRIP_THICKNESS]);

    /**
     * Compute the arch SVG path.
     */
    const SVG_WIDTH = 820;
    const CENTER = SVG_WIDTH / 2;

    // Build the aligner curve points based on actual tooth X positions
    const arcPoints = useMemo(() => {
        if (!toothData.length) return null;

        const sorted = [...toothData].sort((a, b) => a.x - b.x);
        const leftmost = CENTER + sorted[0].x;
        const rightmost = CENTER + sorted[sorted.length - 1].x;

        const curveY = isUpper
            ? STRIP_Y + ARCH_DEPTH
            : STRIP_Y - ARCH_DEPTH;

        return {
            leftmost,
            rightmost,
            midX: CENTER,
            curveY,
        };
    }, [toothData, isUpper, STRIP_Y, ARCH_DEPTH]);

    /**
     * alignerShape
     * Construye un polígono cerrado (path) que representa el cuerpo del alineador.
     * Permite variar el grosor (h) por diente.
     */
    const alignerShape = useMemo(() => {
        if (!arcPoints || !toothData.length) return "";

        const { leftmost, rightmost, curveY } = arcPoints;
        const sorted = [...toothData].sort((a, b) => a.x - b.x);

        // Generar puntos centrales con sus propiedades anatómicas
        const basePoints = sorted.map(t => {
            const x = CENTER + t.x;
            const normT = (x - leftmost) / (rightmost - leftmost || 1);
            const baseArchY = STRIP_Y + 4 * (curveY - STRIP_Y) * normT * (1 - normT);
            return { x, y: baseArchY + t.anatomicalY, h: t.thickness };
        });

        // Añadir extremos con padding herenando Y y grosor del diente adyacente para evitar saltos
        const first = basePoints[0];
        const last = basePoints[basePoints.length - 1];
        const PADDING = 22;

        const allPoints = [
            { x: first.x - PADDING, y: first.y, h: first.h },
            ...basePoints,
            { x: last.x + PADDING, y: last.y, h: last.h }
        ];

        // Construir los puntos del borde superior e inferior
        const topPoints = allPoints.map(p => ({ x: p.x, y: p.y - p.h / 2 }));
        const bottomPoints = [...allPoints].reverse().map(p => ({ x: p.x, y: p.y + p.h / 2 }));

        // Unir ambos bordes en un solo path cerrado LINEAL
        const path = `M ${topPoints[0].x.toFixed(2)} ${topPoints[0].y.toFixed(2)}` +
            getLinearSegments(topPoints) +
            ` L ${bottomPoints[0].x.toFixed(2)} ${bottomPoints[0].y.toFixed(2)}` +
            getLinearSegments(bottomPoints) +
            " Z";

        return path;
    }, [arcPoints, toothData, STRIP_Y]);

    /**
     * Mask rectangles for excluded teeth.
     */
    const excludedRects = useMemo(() => {
        const TOOTH_SLOT_WIDTH = 44;
        return toothData
            .filter(t => t.isExcluded)
            .map(t => ({
                id: t.id,
                x: CENTER + t.x - TOOTH_SLOT_WIDTH / 2,
                width: TOOTH_SLOT_WIDTH,
            }));
    }, [toothData]);

    /**
     * Bracket segments.
     */
    const bracketSegments = useMemo(() => {
        const TOOTH_SLOT_WIDTH = 38;
        return toothData
            .filter(t => t.hasBracket && !t.isExcluded)
            .map(t => {
                const x = CENTER + t.x;
                // Calcular la Y específica para este diente para que el warning siga el path
                const { leftmost, rightmost, curveY } = arcPoints;
                const normT = (x - leftmost) / (rightmost - leftmost);
                const baseArchY = STRIP_Y + 4 * (curveY - STRIP_Y) * normT * (1 - normT);
                const y = baseArchY + t.anatomicalY;

                return {
                    id: t.id,
                    x: x - TOOTH_SLOT_WIDTH / 2,
                    y,
                    width: TOOTH_SLOT_WIDTH,
                };
            });
    }, [toothData, arcPoints, STRIP_Y]);

    if (!arcPoints) return null;

    const maskId = `aligner-mask-${isUpper ? 'upper' : 'lower'}`;

    // La línea central del arco ahora es dinámica y anatómica (arcPath viene de useMemo)

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.svg
                    key={`aligner-${isUpper ? 'upper' : 'lower'}`}
                    className="absolute inset-0 z-[20] pointer-events-none w-full h-full overflow-visible"
                    viewBox={`0 0 ${SVG_WIDTH} 192`}
                    preserveAspectRatio="xMidYMid meet"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.35, ease: 'easeInOut' }}
                >
                    <defs>
                        <mask id={maskId}>
                            <rect x="0" y="0" width={SVG_WIDTH} height="192" fill="white" />
                            {excludedRects.map(({ id, x, width }) => (
                                <rect
                                    key={`mask-excl-${id}`}
                                    x={x}
                                    y={0}
                                    width={width}
                                    height={192}
                                    fill="black"
                                />
                            ))}
                        </mask>
                    </defs>

                    {/* Main aligner shape — filled to allow varying thickness */}
                    <g mask={`url(#${maskId})`}>
                        <path
                            d={alignerShape}
                            fill="rgba(147, 210, 255, 0.2)"
                            stroke="rgba(100, 180, 255, 0.4)"
                            strokeWidth="1.5"
                            strokeDasharray="6 4"
                            strokeLinejoin="round"
                        />
                    </g>

                    {/* Bracket conflict zones */}
                    {ALIGNER_BRACKET_WARNING && bracketSegments.map(({ id, x, y, width }) => (
                        <rect
                            key={`bracket-warn-${id}`}
                            x={x}
                            y={y - STRIP_THICKNESS / 2 - 2}
                            width={width}
                            height={STRIP_THICKNESS + 4}
                            fill="rgba(251, 191, 36, 0.12)"
                            stroke="rgba(251, 191, 36, 0.4)"
                            strokeWidth="1"
                            strokeDasharray="3 2"
                        />
                    ))}
                </motion.svg>
            )}
        </AnimatePresence>
    );
}


