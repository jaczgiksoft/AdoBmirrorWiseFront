import React, { useState, useEffect } from 'react';
import { getToothSrc } from './toothSvgHelpers';

/**
 * CaptureGrid - Grilla interactiva para la captura de datos periodontales.
 */

const UPPER_TEETH = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
const LOWER_TEETH = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];
const MOLARS = [18, 17, 16, 26, 27, 28, 36, 37, 38, 46, 47, 48];

// ── CONFIGURACIÓN DE AJUSTE DE GRÁFICAS ──────────────────────────────────────
/**
 * Usa estos valores para ajustar la posición de las gráficas de forma independiente.
 */
const ARCH_CONFIG = {
    superior: {
        bottom: 46,           // Ajustado para que 0mm (ahora abajo) coincida con la corona
        left: 0,
        pointOffsets: [20, 50, 80]
    },
    inferior: {
        bottom: -26,          // Ajustado para que 0mm (ahora arriba) coincida con la corona
        left: 0,
        pointOffsets: [20, 50, 80]
    }
};

/**
 * Microajustes por diente: permite mover un diente y su gráfica de forma individual.
 * Estructura: ID: { x: horizontal, y: vertical }
 * Ejemplo: 18: { x: -5, y: 2 }
 */
const TOOTH_MICRO_ADJUSTMENTS = {
    // Ejemplo: 
    // 18: { x: -2, y: 0 },
    // 11: { x: 5, y: 0 },

    18: { x: 0, y: 0 },
    17: { x: 0, y: 0 },
    16: { x: 0, y: 0 },
    15: { x: 0, y: 0 },
    14: { x: 0, y: 0 },
    13: { x: 0, y: 0 },
    12: { x: 0, y: 0 },
    11: { x: 0, y: 0 },

    21: { x: 0, y: 0 },
    22: { x: 0, y: 0 },
    23: { x: 0, y: 0 },
    24: { x: 0, y: 0 },
    25: { x: 0, y: 0 },
    26: { x: 0, y: 0 },
    27: { x: 0, y: 0 },
    28: { x: 0, y: 0 },

    48: { x: 0, y: 0 },
    47: { x: 0, y: 0 },
    46: { x: 0, y: 0 },
    45: { x: 0, y: 0 },
    44: { x: 0, y: 0 },
    43: { x: 0, y: 0 },
    42: { x: 0, y: 0 },
    41: { x: 0, y: 0 },

    31: { x: 0, y: 0 },
    32: { x: 0, y: 0 },
    33: { x: 0, y: 0 },
    34: { x: 0, y: 0 },
    35: { x: 0, y: 0 },
    36: { x: 0, y: 0 },
    37: { x: 0, y: 0 },
    38: { x: 0, y: 0 },

};

// ── SVG Overlay — Periodontograma Clínico ──────────────────────────────────────
const TOOTH_WIDTH = 100; // coincide con w-[100px] en ToothColumn
const TOOTH_HEIGHT = 96;  // coincide con h-24 (96px) en ToothColumn
const MAX_MM = 15;  // profundidad máxima clínica en mm

/**
 * Convierte un valor en mm a coordenada Y según el arco.
 * - Arco SUPERIOR (isUpper=true):  0mm → top (y=0),       crecen hacia ABAJO  → enfermedad baja
 * - Arco INFERIOR (isUpper=false): 0mm → bottom (y=H),    crecen hacia ARRIBA → enfermedad sube
 */
const toY = (value, isUpper) => {
    const v = Math.max(0, Math.min(MAX_MM, Number(value) || 0));
    const ratio = v / MAX_MM;
    // Superior: 0mm abajo (96), 15mm arriba (0)
    // Inferior: 0mm arriba (0), 15mm abajo (96)
    return isUpper ? (1 - ratio) * TOOTH_HEIGHT : ratio * TOOTH_HEIGHT;
};

/**
 * Genera los puntos {x, y} para una línea del periodontograma.
 * @param {number[]} teethIds   - IDs de dientes del arco
 * @param {object}  teeth       - Estado global de dientes (del hook)
 * @param {string}  view        - 'vestibular' | 'palatino'
 * @param {string}  field1      - Campo primario ('margenGingival' | 'profundidadSondaje')
 * @param {string|null} field2  - Campo secundario a sumar (null si no aplica)
 * @param {boolean} isUpper     - true = arco superior, false = inferior
 */
const buildPoints = (teethIds, teeth, view, field1, field2, isUpper, config) => {
    const pts = [];
    teethIds.forEach((id, i) => {
        const face = teeth[id]?.[view];
        if (!face) return;

        // Aplicar microajuste si existe para este diente
        const adjustment = TOOTH_MICRO_ADJUSTMENTS[id] || {};
        const microX = Number(adjustment.x) || 0;
        const microY = Number(adjustment.y) || 0;

        config.pointOffsets.forEach((xOff, ptIdx) => {
            const v1 = Number(face[field1]?.[ptIdx]) || 0;
            const v2 = field2 ? (Number(face[field2]?.[ptIdx]) || 0) : 0;

            pts.push({
                x: i * TOOTH_WIDTH + xOff + microX,
                y: toY(v1 + v2, isUpper) + microY
            });
        });
    });
    return pts;
};

/** Array de {x,y} → string de path SVG */
const toLinePath = (pts) =>
    pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');

/** Cierra el área entre dos series de puntos (bolsa periodontal) */
const toAreaPath = (top, bottom) => {
    if (!top.length || !bottom.length) return '';
    const fwd = toLinePath(top);
    const rev = [...bottom].reverse()
        .map(p => `L ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
    return `${fwd} ${rev} Z`;
};

/**
 * ArchSvgOverlay
 * Overlay SVG puro (aria-hidden, pointerEvents none) sobre la zona h-24 de dientes.
 *
 * Líneas:
 *   🔴 Roja  — Margen Gingival         (margenGingival)
 *   🔵 Azul  — Fondo de bolsa / CAL    (margenGingival + profundidadSondaje)
 *   🩵 Relleno azul claro entre ambas   = bolsa periodontal
 *
 * Dirección Y:
 *   Superior → valores crecen hacia ABAJO  (pockets open downward)
 *   Inferior → valores crecen hacia ARRIBA (pockets open upward)
 */
function ArchSvgOverlay({ archId, isUpper, teethIds, teeth, view }) {
    const config = isUpper ? ARCH_CONFIG.superior : ARCH_CONFIG.inferior;
    const svgW = teethIds.length * TOOTH_WIDTH;

    // Línea roja: margen gingival solo
    const margenPts = buildPoints(teethIds, teeth, view, 'margenGingival', null, isUpper, config);
    // Línea azul: margen + profundidad = fondo de la bolsa (CAL)
    const calPts = buildPoints(teethIds, teeth, view, 'margenGingival', 'profundidadSondaje', isUpper, config);

    const margenPath = toLinePath(margenPts);
    const calPath = toLinePath(calPts);
    // El área de la bolsa va de la línea roja hasta la línea azul
    const pocketArea = toAreaPath(margenPts, calPts);

    return (
        <svg
            aria-hidden="true"
            style={{
                position: 'absolute',
                bottom: config.bottom,
                left: config.left,
                width: svgW,
                height: TOOTH_HEIGHT,
                pointerEvents: 'none',
                zIndex: 10,
            }}
            viewBox={`0 0 ${svgW} ${TOOTH_HEIGHT}`}
        >
            {/* ── Bolsa periodontal: área entre margen y CAL ── */}
            {pocketArea && (
                <path
                    d={pocketArea}
                    fill="rgba(59,130,246,0.15)"
                    stroke="none"
                />
            )}

            {/* ── Línea azul: fondo de bolsa (margen + profundidad) ── */}
            {calPath && (
                <path
                    d={calPath}
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                />
            )}

            {/* ── Línea roja: margen gingival ── */}
            {margenPath && (
                <path
                    d={margenPath}
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                />
            )}

            {/* ── Círculos de medición: fondo de bolsa (azul) ── */}
            {calPts.map((p, i) => (
                <circle
                    key={`${archId}-cal-${i}`}
                    cx={p.x} cy={p.y} r="2.5"
                    fill="#3b82f6"
                    stroke="#fff"
                    strokeWidth="0.8"
                />
            ))}

            {/* ── Círculos de medición: margen gingival (rojo) ── */}
            {margenPts.map((p, i) => (
                <circle
                    key={`${archId}-mar-${i}`}
                    cx={p.x} cy={p.y} r="2.5"
                    fill="#ef4444"
                    stroke="#fff"
                    strokeWidth="0.8"
                />
            ))}
        </svg>
    );
}

export default function CaptureGrid({ view, teeth, odontogramStates, onUpdate, onGeneralUpdate }) {
    const renderArch = (teethIds, label) => (
        <div className="flex flex-col gap-1 mb-8 overflow-x-auto pb-4 custom-scrollbar">
            <h4 className="text-[10px] font-bold uppercase text-slate-400 mb-2 px-2">
                Arco {label} ({view === 'vestibular' ? 'Frente' : 'Atrás'})
            </h4>

            <div className="flex items-start">
                {/* Etiquetas de Fila (Opcional, se pueden poner a la izquierda) */}
                <div className="flex flex-col gap-1 pr-3 sticky left-0 bg-white dark:bg-secondary z-10">
                    <div className="h-8 flex items-center text-[9px] font-bold text-slate-400 uppercase">Mob</div>
                    <div className="h-8 flex items-center text-[9px] font-bold text-slate-400 uppercase">Fur</div>
                    <div className="h-8 flex items-center text-[9px] font-bold text-slate-400 uppercase text-red-500">BOP</div>
                    <div className="h-8 flex items-center text-[9px] font-bold text-slate-400 uppercase text-amber-500">Plq</div>
                    <div className="h-8 flex items-center text-[9px] font-bold text-slate-400 uppercase">Mar</div>
                    <div className="h-8 flex items-center text-[9px] font-bold text-slate-400 uppercase font-bold text-slate-600 dark:text-slate-200">Pro</div>
                    <div className="h-8 flex items-center text-[9px] font-bold text-slate-400 uppercase text-primary">CAL</div>
                    <div className="h-24 flex items-center text-[9px] font-bold text-slate-400 uppercase">ID</div>
                </div>

                {/* Dientes + SVG overlay relativo */}
                <div className="relative">
                    <div className="flex">
                        {teethIds.map(id => (
                            <ToothColumn
                                key={id}
                                id={id}
                                view={view}
                                data={teeth[id]}
                                odontogramState={odontogramStates[id]}
                                onUpdate={onUpdate}
                                onGeneralUpdate={onGeneralUpdate}
                            />
                        ))}
                    </div>
                    <ArchSvgOverlay
                        archId={label}
                        isUpper={label === 'Superior'}
                        teethIds={teethIds}
                        teeth={teeth}
                        view={view}
                    />
                </div>
            </div>
        </div>
    );

    return (
        <div className="bg-white dark:bg-secondary border border-slate-200 dark:border-slate-700 rounded-3xl p-6 shadow-sm">
            {renderArch(UPPER_TEETH, "Superior")}
            <div className="h-px bg-slate-100 dark:bg-slate-800 my-4" />
            {renderArch(LOWER_TEETH, "Inferior")}
        </div>
    );
}

function ToothColumn({ id, view, data, odontogramState, onUpdate, onGeneralUpdate }) {
    const [toothSrc, setToothSrc] = useState(null);

    useEffect(() => {
        let mounted = true;
        getToothSrc(id, odontogramState || 'original').then(src => {
            if (mounted) setToothSrc(src);
        });
        return () => { mounted = false; };
    }, [id, odontogramState]);

    const isMolar = MOLARS.includes(Number(id));
    const faceData = data[view];

    // Cálculo del CAL localmente para respuesta inmediata
    const calValues = faceData.margenGingival.map((m, idx) => {
        return (Number(m) || 0) + (Number(faceData.profundidadSondaje[idx]) || 0);
    });

    const inputClasses = "w-8 h-8 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-center text-xs font-bold focus:ring-1 focus:ring-primary outline-none transition-all";
    const tripleInputContainer = "flex gap-0.5 justify-center";

    return (
        <div className="flex flex-col gap-1 w-[100px] border-r border-slate-50 dark:border-slate-800/50 last:border-0 items-center transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/30">

            {/* Movilidad */}
            <div className="h-8 flex items-center">
                <input
                    type="number"
                    min="0"
                    max="3"
                    value={data.mobility}
                    onChange={(e) => onGeneralUpdate(id, 'mobility', e.target.value)}
                    className={`${inputClasses} bg-blue-50/30 border-blue-100 dark:border-blue-900/30 text-blue-600`}
                />
            </div>

            {/* Furca */}
            <div className="h-8 flex items-center">
                <input
                    type="number"
                    min="0"
                    max="3"
                    disabled={!isMolar}
                    value={isMolar ? data.furca : ''}
                    onChange={(e) => onGeneralUpdate(id, 'furca', e.target.value)}
                    className={`${inputClasses} disabled:opacity-20 disabled:cursor-not-allowed`}
                    placeholder={!isMolar ? '—' : ''}
                />
            </div>

            {/* Sangrado (BOP) */}
            <div className={`h-8 flex items-center ${tripleInputContainer}`}>
                {faceData.sangrado.map((val, idx) => (
                    <button
                        key={idx}
                        onClick={() => onUpdate(id, view, idx, 'sangrado', !val)}
                        className={`w-7 h-6 rounded-sm border transition-all ${val ? 'bg-red-500 border-red-600 shadow-sm' : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                            }`}
                    />
                ))}
            </div>

            {/* Placa */}
            <div className={`h-8 flex items-center ${tripleInputContainer}`}>
                {faceData.placa.map((val, idx) => (
                    <button
                        key={idx}
                        onClick={() => onUpdate(id, view, idx, 'placa', !val)}
                        className={`w-7 h-6 rounded-sm border transition-all ${val ? 'bg-amber-400 border-amber-500 shadow-sm' : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                            }`}
                    />
                ))}
            </div>

            {/* Margen */}
            <div className={`h-8 flex items-center ${tripleInputContainer}`}>
                {faceData.margenGingival.map((val, idx) => (
                    <input
                        key={idx}
                        type="number"
                        value={val}
                        onChange={(e) => onUpdate(id, view, idx, 'margenGingival', e.target.value)}
                        className={`${inputClasses} w-7`}
                    />
                ))}
            </div>

            {/* Profundidad */}
            <div className={`h-8 flex items-center ${tripleInputContainer}`}>
                {faceData.profundidadSondaje.map((val, idx) => (
                    <input
                        key={idx}
                        type="number"
                        min="0"
                        value={val}
                        onChange={(e) => onUpdate(id, view, idx, 'profundidadSondaje', e.target.value)}
                        className={`${inputClasses} w-7 bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-600`}
                    />
                ))}
            </div>

            {/* CAL */}
            <div className={`h-8 flex items-center ${tripleInputContainer}`}>
                {calValues.map((val, idx) => (
                    <div
                        key={idx}
                        className="w-7 h-8 flex items-center justify-center text-xs font-black text-primary"
                    >
                        {val}
                    </div>
                ))}
            </div>

            {/* Diente e ID */}
            <div className="h-24 flex flex-col items-center justify-center gap-1 transition-opacity">
                {toothSrc ? (
                    <img
                        src={toothSrc}
                        alt={`Diente ${id}`}
                        style={{
                            transform: `translate(${(TOOTH_MICRO_ADJUSTMENTS[id]?.x || 0)}px, ${(TOOTH_MICRO_ADJUSTMENTS[id]?.y || 0)}px)`,
                            transition: 'transform 0.2s ease'
                        }}
                        className="h-24 w-auto object-contain drop-shadow-sm"
                    />
                ) : (
                    <div className="h-24 w-24 bg-slate-100 dark:bg-slate-800 rounded-full animate-pulse" />
                )}
                <span className="text-[10px] font-black text-slate-400">{id}</span>
            </div>

        </div>
    );
}
