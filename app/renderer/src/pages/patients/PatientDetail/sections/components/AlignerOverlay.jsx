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
        yPosition: 125,      // Altura base (Y) para el arco superior
        thickness: 82,      // Grosor del alineador
        archDepth: 76,      // Pronunciación de la curva (profundidad)
    },
    lower: {
        yPosition: 45,      // Altura base (Y) para el arco inferior
        thickness: 82,      // Grosor del alineador
        archDepth: 76,      // Pronunciación de la curva (profundidad)
    }
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
            const x = getDynamicOffset(id);
            const state = toothStates[id] || 'original';
            const isExcluded = ALIGNER_EXCLUDED_TYPES.includes(state);
            const hasBracket = !!brackets?.[id];
            return { id, x, isExcluded, hasBracket };
        }).filter(t => t.x !== undefined);
    }, [teethIds, toothStates, brackets, getDynamicOffset]);

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
            ? STRIP_Y + ARCH_DEPTH   // Ahora apunta hacia abajo (hacia el centro)
            : STRIP_Y - ARCH_DEPTH;  // Ahora apunta hacia arriba (hacia el centro)

        // Compensación: El stroke-linecap="round" añade (thickness / 2) a cada extremo en el eje X.
        // Restamos esa cantidad para que el ancho total se mantenga igual aunque cambies el grosor.
        const capRadius = STRIP_THICKNESS / 2;
        const totalPad = 22; // El padding original que querías mantener

        return {
            leftmost: (leftmost - totalPad) + capRadius,
            rightmost: (rightmost + totalPad) - capRadius,
            midX: CENTER,
            curveY,
        };
    }, [toothData, isUpper, STRIP_Y, ARCH_DEPTH, STRIP_THICKNESS]);

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
            .map(t => ({
                id: t.id,
                x: CENTER + t.x - TOOTH_SLOT_WIDTH / 2,
                width: TOOTH_SLOT_WIDTH,
            }));
    }, [toothData]);

    if (!arcPoints) return null;

    const maskId = `aligner-mask-${isUpper ? 'upper' : 'lower'}`;
    const { leftmost, rightmost, midX, curveY } = arcPoints;

    // Definición de la línea central del arco
    const arcPath = `M ${leftmost} ${STRIP_Y} Q ${midX} ${curveY} ${rightmost} ${STRIP_Y}`;

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

                    {/* Main aligner strip — masked to exclude certain teeth */}
                    <g mask={`url(#${maskId})`}>
                        {/* El relleno con bordes redondeados (stroke-linecap="round") */}
                        <path
                            d={arcPath}
                            fill="none"
                            stroke="rgba(147, 210, 255, 0.2)"
                            strokeWidth={STRIP_THICKNESS}
                            strokeLinecap="round"
                        />
                        {/* El borde punteado opcional */}
                        <path
                            d={arcPath}
                            fill="none"
                            stroke="rgba(100, 180, 255, 0.4)"
                            strokeWidth={STRIP_THICKNESS + 1}
                            strokeDasharray="6 4"
                            strokeLinecap="round"
                        />
                    </g>

                    {/* Bracket conflict zones */}
                    {ALIGNER_BRACKET_WARNING && bracketSegments.map(({ id, x, width }) => (
                        <rect
                            key={`bracket-warn-${id}`}
                            x={x}
                            y={STRIP_Y - STRIP_THICKNESS / 2 - (isUpper ? ARCH_DEPTH / 2 : -ARCH_DEPTH / 2)}
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


