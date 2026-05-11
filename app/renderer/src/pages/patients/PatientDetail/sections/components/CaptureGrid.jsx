import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, Save, RefreshCw } from 'lucide-react';
import { useToastStore } from '@/store/useToastStore';
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
        bottom: 29,          // Reajustado para h-36 y margen -10mm
        left: 0,
        pointOffsets: [20, 50, 80]
    },
    inferior: {
        bottom: 33,          // Reajustado para h-36 y margen -10mm
        left: 0,
        pointOffsets: [20, 50, 80]
    }
};

/**
 * FurcaIcon - Renderiza un triángulo según el grado de furca (Estándar Clínico).
 * Grado 1: △ (contorno)
 * Grado 2: ◬ (medio relleno)
 * Grado 3: ▲ (lleno)
 */
const FurcaIcon = ({ grade, className = "w-4 h-4" }) => {
    const g = Number(grade);
    if (!g || g === 0) return null;

    return (
        <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
            {g === 1 && (
                <path d="M50 15 L90 85 L10 85 Z" stroke="currentColor" strokeWidth="10" strokeLinejoin="round" />
            )}
            {g === 2 && (
                <>
                    <path d="M50 15 L90 85 L10 85 Z" stroke="currentColor" strokeWidth="10" strokeLinejoin="round" />
                    <path d="M50 15 L10 85 L50 85 Z" fill="currentColor" />
                </>
            )}
            {g === 3 && (
                <path d="M50 15 L90 85 L10 85 Z" fill="currentColor" stroke="currentColor" strokeWidth="10" strokeLinejoin="round" />
            )}
        </svg>
    );
};

/**
 * Microajustes por diente: permite mover un diente y su gráfica de forma independiente.
 * Estructura: ID: { 
 *   x, y: ajuste visual del diente (imagen)
 *   gx, gy: ajuste visual de la gráfica (puntos y líneas)
 * }
 */
const TOOTH_MICRO_ADJUSTMENTS = {
    // Ejemplo: 
    // 18: { x: -2, y: 0 },
    // 11: { x: 5, y: 0 },

    18: { x: 0, y: -18 },
    17: { x: 0, y: -15 },
    16: { x: 0, y: -15 },
    15: { x: 0, y: -11 },
    14: { x: 0, y: -9 },
    13: { x: 0, y: 0 },
    12: { x: 0, y: -7 },
    11: { x: 0, y: 1 },

    21: { x: 0, y: 1 },
    22: { x: 0, y: -7 },
    23: { x: 0, y: 0 },
    24: { x: 0, y: -9 },
    25: { x: 0, y: -11 },
    26: { x: 0, y: -15 },
    27: { x: 0, y: -15 },
    28: { x: 0, y: -18 },

    48: { x: 0, y: 27 },
    47: { x: 0, y: 22 },
    46: { x: 0, y: 20 },
    45: { x: 0, y: 17 },
    44: { x: 0, y: 15 },
    43: { x: 0, y: 0 },
    42: { x: 0, y: 10 },
    41: { x: 0, y: 10 },

    31: { x: 0, y: 10 },
    32: { x: 0, y: 10 },
    33: { x: 0, y: 0 },
    34: { x: 0, y: 15 },
    35: { x: 0, y: 17 },
    36: { x: 0, y: 20 },
    37: { x: 0, y: 22 },
    38: { x: 0, y: 27 },

};

// ── SVG Overlay — Periodontograma Clínico ──────────────────────────────────────
const TOOTH_WIDTH = 100; // coincide con w-[100px] en ToothColumn
const TOOTH_HEIGHT = 144; // Actualizado a h-36 (144px)
const MAX_MM = 15;  // profundidad máxima clínica en mm
const NEGATIVE_MARGIN = 10; // margen para valores negativos (hasta -10mm)

/**
 * Convierte un valor en mm a coordenada Y según el arco.
 * - Arco SUPERIOR (isUpper=true):  0mm → top (y=0),       crecen hacia ABAJO  → enfermedad baja
 * - Arco INFERIOR (isUpper=false): 0mm → bottom (y=H),    crecen hacia ARRIBA → enfermedad sube
 */
const toY = (value, isUpper) => {
    const v = Number(value) || 0;
    // Definimos un rango visual que permita valores negativos (ej: -10 a 15)
    const scale = TOOTH_HEIGHT / (MAX_MM + NEGATIVE_MARGIN);

    if (isUpper) {
        // 0mm estará desplazado NEGATIVE_MARGIN desde el borde inferior
        const baseline = TOOTH_HEIGHT - (NEGATIVE_MARGIN * scale);
        return baseline - (v * scale);
    } else {
        // 0mm estará desplazado NEGATIVE_MARGIN desde el borde superior
        const baseline = NEGATIVE_MARGIN * scale;
        return baseline + (v * scale);
    }
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
        const graphX = Number(adjustment.gx) || 0;
        const graphY = Number(adjustment.gy) || 0;

        config.pointOffsets.forEach((xOff, ptIdx) => {
            const v1 = Number(face[field1]?.[ptIdx]) || 0;
            const v2 = field2 ? (Number(face[field2]?.[ptIdx]) || 0) : 0;

            pts.push({
                x: i * TOOTH_WIDTH + xOff + graphX,
                y: toY(v1 + v2, isUpper) + graphY
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
 * Overlay SVG puro (aria-hidden, pointerEvents none) sobre la zona h-36 de dientes.
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

        </svg>
    );
}

const LS_KEY = 'bwise_periodonto_history';

export default function CaptureGrid({ view, teeth, odontogramStates, onUpdate, onGeneralUpdate, selectedRecord, onRecordSaved, patientId }) {
    const { addToast } = useToastStore();
    const [noteModal, setNoteModal] = useState({ isOpen: false, toothId: null, initialNote: '' });
    const [isSaving, setIsSaving] = useState(false);

    /**
     * Persiste el periodontograma en localStorage bajo la clave bwise_periodonto_history.
     * Si existe un selectedRecord, reemplaza el registro por id; si no, crea uno nuevo.
     */
    const handleSave = useCallback(() => {
        setIsSaving(true);
        try {
            const raw = localStorage.getItem(LS_KEY);
            const history = raw ? JSON.parse(raw) : [];

            const entry = {
                id: selectedRecord?.id ?? `periodonto_${Date.now()}`,
                date: new Date().toISOString(),
                patientId: patientId ?? null,
                data: teeth,
            };

            let updatedHistory;
            if (selectedRecord?.id) {
                // Actualización: reemplazar el registro existente
                const idx = history.findIndex(r => r.id === selectedRecord.id);
                if (idx !== -1) {
                    updatedHistory = [...history];
                    updatedHistory[idx] = entry;
                } else {
                    updatedHistory = [...history, entry];
                }
            } else {
                // Nuevo registro
                updatedHistory = [...history, entry];
            }

            localStorage.setItem(LS_KEY, JSON.stringify(updatedHistory));

            addToast({
                type: 'success',
                title: selectedRecord?.id ? 'Registro actualizado' : 'Periodontograma guardado',
                message: selectedRecord?.id
                    ? 'Los cambios han sido guardados correctamente.'
                    : 'El periodontograma se guardó en el historial local.',
            });

            if (typeof onRecordSaved === 'function') {
                onRecordSaved(entry);
            }
        } catch (err) {
            console.error('[CaptureGrid] Error al guardar en localStorage:', err);
            addToast({
                type: 'error',
                title: 'Error al guardar',
                message: 'No se pudo guardar el periodontograma. Intenta de nuevo.',
            });
        } finally {
            setIsSaving(false);
        }
    }, [teeth, selectedRecord, patientId, addToast, onRecordSaved]);

    const openNoteModal = (id, note) => {
        setNoteModal({ isOpen: true, toothId: id, initialNote: note });
    };

    /**
     * Valida y limita los valores de margen y profundidad.
     */
    const handleUpdateWithLimits = (id, view, idx, field, value) => {
        if (value === "") {
            onUpdate(id, view, idx, field, 0);
            return;
        }

        const num = Number(value);
        if (isNaN(num)) {
            // Permitir signos o valores vacíos temporales
            onUpdate(id, view, idx, field, value);
            return;
        }

        let finalValue = value;
        if (num > 15) {
            finalValue = 15;
            addToast({
                type: 'warning',
                title: 'Límite excedido',
                message: 'El valor máximo permitido es 15mm'
            });
        } else if (num < -9) {
            finalValue = -9;
            addToast({
                type: 'warning',
                title: 'Límite excedido',
                message: 'El valor mínimo permitido es -9mm'
            });
        }

        onUpdate(id, view, idx, field, finalValue);
    };

    const renderArch = (teethIds, label) => (
        <div className="flex flex-col gap-1 mb-8 overflow-x-auto pb-4 custom-scrollbar">
            <h4 className="text-[10px] font-bold uppercase text-slate-400 mb-2 px-2">
                Arco {label} ({view === 'vestibular' ? 'Frente' : 'Atrás'})
            </h4>

            <div className="flex items-start">
                {/* Etiquetas de Fila (Opcional, se pueden poner a la izquierda) */}
                <div className="flex flex-col gap-1 pr-3 sticky left-0 bg-white dark:bg-secondary z-10">
                    <div className="h-8 flex items-center text-[9px] font-bold text-slate-400 uppercase">Not</div>
                    <div className="h-8 flex items-center text-[9px] font-bold text-slate-400 uppercase">Mob</div>
                    <div className="h-8 flex items-center text-[9px] font-bold text-slate-400 uppercase">Fur</div>
                    <div className="h-8 flex items-center text-[9px] font-bold text-slate-400 uppercase">Pron</div>
                    <div className="h-8 flex items-center text-[9px] font-bold text-slate-400 uppercase text-red-500">BOP</div>
                    <div className="h-8 flex items-center text-[9px] font-bold text-slate-400 uppercase text-blue-500">Plq</div>
                    <div className="h-8 flex items-center text-[9px] font-bold text-slate-400 uppercase text-amber-500">Sup</div>
                    <div className="h-8 flex items-center text-[9px] font-bold text-slate-400 uppercase">Mar</div>
                    <div className="h-8 flex items-center text-[9px] font-bold text-slate-400 uppercase font-bold text-slate-600 dark:text-slate-200">Pro</div>
                    <div className="h-8 flex items-center text-[9px] font-bold text-slate-400 uppercase text-primary">CAL</div>
                    <div className="h-36 flex items-center text-[9px] font-bold text-slate-400 uppercase">ID</div>
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
                                onUpdate={handleUpdateWithLimits}
                                onGeneralUpdate={onGeneralUpdate}
                                onNoteClick={() => openNoteModal(id, teeth[id]?.note || '')}
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

            <AnimatePresence>
                {noteModal.isOpen && (
                    <ToothNoteModal
                        isOpen={noteModal.isOpen}
                        toothId={noteModal.toothId}
                        initialNote={noteModal.initialNote}
                        onClose={() => setNoteModal({ ...noteModal, isOpen: false })}
                        onSave={(id, note) => {
                            onGeneralUpdate(id, 'note', note);
                        }}
                    />
                )}
            </AnimatePresence>

            {/* ── Botón Flotante de Guardado ── */}
            <motion.button
                onClick={handleSave}
                disabled={isSaving}
                title={selectedRecord?.id ? 'Actualizar Registro' : 'Guardar Periodontograma'}
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                whileHover={{ scale: 1.07, y: -2 }}
                whileTap={{ scale: 0.96 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                style={{
                    position: 'fixed',
                    bottom: '2.5rem',
                    right: '2.5rem',
                    zIndex: 9999,
                }}
                className="
                    flex items-center gap-2.5
                    bg-primary hover:brightness-110
                    text-white
                    font-bold text-sm
                    px-5 py-3
                    rounded-2xl
                    shadow-xl shadow-primary/30
                    border border-white/10
                    disabled:opacity-60 disabled:cursor-not-allowed
                    transition-all
                "
            >
                {isSaving ? (
                    <RefreshCw size={16} className="animate-spin" />
                ) : (
                    <Save size={16} />
                )}
                {selectedRecord?.id ? 'Actualizar Registro' : 'Guardar Periodontograma'}
            </motion.button>
        </div>
    );
}

function ToothColumn({ id, view, data, odontogramState, onUpdate, onGeneralUpdate, onNoteClick }) {
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

            {/* Notas */}
            <div className="h-8 flex items-center">
                <button
                    onClick={onNoteClick}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all ${data.note
                            ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                            : 'text-slate-300 hover:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                    title={data.note ? "Ver nota" : "Agregar nota"}
                >
                    <Eye size={18} strokeWidth={data.note ? 3 : 2} />
                </button>
            </div>

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
                <button
                    disabled={!isMolar}
                    onClick={() => {
                        const current = Number(data.furca) || 0;
                        const next = (current + 1) % 4;
                        onGeneralUpdate(id, 'furca', next);
                    }}
                    className={`${inputClasses} flex items-center justify-center transition-all hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-20 disabled:cursor-not-allowed`}
                >
                    {isMolar ? (
                        <FurcaIcon grade={data.furca} className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                    ) : (
                        <span className="text-slate-400">—</span>
                    )}
                </button>
            </div>

            {/* Pronóstico */}
            <div className="h-8 flex items-center">
                <select
                    value={data.prognosis || ''}
                    onChange={(e) => onGeneralUpdate(id, 'prognosis', e.target.value)}
                    className={`${inputClasses} text-[9px] w-20 px-1 appearance-none bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700`}
                >
                    <option value=""></option>
                    <option value="Bueno">Bueno</option>
                    <option value="Dudoso">Dudoso</option>
                    <option value="Malo">Malo</option>
                    <option value="Imposible">Imposible</option>
                </select>
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
                        className={`w-7 h-6 rounded-sm border transition-all ${val ? 'bg-blue-400 border-blue-500 shadow-sm' : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                            }`}
                    />
                ))}
            </div>

            {/* Supuración */}
            <div className={`h-8 flex items-center ${tripleInputContainer}`}>
                {faceData.supuracion.map((val, idx) => (
                    <button
                        key={idx}
                        onClick={() => onUpdate(id, view, idx, 'supuracion', !val)}
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
                        min="-9"
                        max="15"
                        placeholder="0"
                        value={Number(val) === 0 ? '' : val}
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
                        min="-9"
                        max="15"
                        placeholder="0"
                        value={Number(val) === 0 ? '' : val}
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
            <div className="h-48 flex flex-col items-center justify-center gap-1 transition-opacity">
                {toothSrc ? (
                    <div className="relative group">
                        <img
                            src={toothSrc}
                            alt={`Diente ${id}`}
                            style={{
                                transform: `translate(${(TOOTH_MICRO_ADJUSTMENTS[id]?.x || 0)}px, ${(TOOTH_MICRO_ADJUSTMENTS[id]?.y || 0)}px)`,
                                transition: 'transform 0.2s ease'
                            }}
                            className="h-48 w-auto object-contain drop-shadow-sm"
                        />
                        {/* Overlay de Furca */}
                        {isMolar && data.furca > 0 && (
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none">
                                <FurcaIcon
                                    grade={data.furca}
                                    className="w-5 h-5 text-red-500 drop-shadow-[0_0_2px_rgba(255,255,255,0.8)]"
                                />
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="h-48 w-48 bg-slate-100 dark:bg-slate-800 rounded-full animate-pulse" />
                )}
                <span className="text-[10px] font-black text-slate-400">{id}</span>
            </div>

        </div>
    );
}

/**
 * ToothNoteModal - Basado en OdontogramSection
 */
function ToothNoteModal({ isOpen, onClose, onSave, toothId, initialNote }) {
    const [note, setNote] = useState(initialNote || '');

    useEffect(() => {
        if (isOpen) {
            setNote(initialNote || '');
        }
    }, [isOpen, initialNote]);

    if (!isOpen || !toothId) return null;

    const handleSave = () => {
        onSave(toothId, note);
        onClose();
    };

    const handleDelete = () => {
        onSave(toothId, '');
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-0 overflow-hidden"
            >
                <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/80">
                    <div>
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                            <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 flex items-center justify-center text-sm">
                                {toothId}
                            </span>
                            Nota del Diente
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Escribe una nota interna para este diente.</p>
                    </div>
                    <button onClick={onClose} className="btn btn-sm btn-circle btn-ghost text-slate-500 hover:text-slate-800 dark:hover:text-slate-200">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <div className="p-6">
                    <textarea
                        autoFocus
                        className="w-full h-32 p-3 text-sm bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all resize-none"
                        placeholder="Escribe aquí cualquier observación o nota importante..."
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                    />
                </div>

                <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center gap-3">
                    <div className="flex-1">
                        {initialNote && (
                            <button
                                type="button"
                                onClick={handleDelete}
                                className="text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 px-3 py-2 rounded-lg transition-all flex items-center gap-2"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                Borrar Nota
                            </button>
                        )}
                    </div>
                    <div className="flex gap-3">
                        <button type="button" onClick={onClose} className="text-sm font-bold text-slate-500 px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-all">Cancelar</button>
                        <button
                            type="button"
                            onClick={handleSave}
                            className="text-sm font-bold bg-primary text-white px-6 py-2 rounded-lg shadow-md shadow-primary/20 hover:brightness-110 transition-all"
                        >
                            Guardar Nota
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
