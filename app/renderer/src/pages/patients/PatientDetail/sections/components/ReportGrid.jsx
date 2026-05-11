import React, { useState, useEffect } from 'react';
import { Eye } from 'lucide-react';
import { getToothSrc } from './toothSvgHelpers';

/**
 * ReportGrid - Vista de reporte de solo lectura (Estándar SEPA).
 */

const UPPER_TEETH = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
const LOWER_TEETH = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];
const MOLARS = [18, 17, 16, 26, 27, 28, 36, 37, 38, 46, 47, 48];

// ── CONFIGURACIÓN DE AJUSTE DE GRÁFICAS ──────────────────────────────────────
const ARCH_CONFIG = {
    superior: {
        bottom: 29,
        left: 0,
        pointOffsets: [20, 50, 80]
    },
    inferior: {
        bottom: 33,
        left: 0,
        pointOffsets: [20, 50, 80]
    }
};

const TOOTH_WIDTH = 100;
const TOOTH_HEIGHT = 144;
const MAX_MM = 15;
const NEGATIVE_MARGIN = 10;

const TOOTH_MICRO_ADJUSTMENTS = {
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

const toY = (value, isUpper) => {
    const v = Number(value) || 0;
    const scale = TOOTH_HEIGHT / (MAX_MM + NEGATIVE_MARGIN);
    if (isUpper) {
        const baseline = TOOTH_HEIGHT - (NEGATIVE_MARGIN * scale);
        return baseline - (v * scale);
    } else {
        const baseline = NEGATIVE_MARGIN * scale;
        return baseline + (v * scale);
    }
};

const buildPoints = (teethIds, teeth, view, field1, field2, isUpper, config) => {
    const pts = [];
    teethIds.forEach((id, i) => {
        const face = teeth[id]?.[view];
        if (!face) return;
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

const toLinePath = (pts) => pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
const toAreaPath = (top, bottom) => {
    if (!top.length || !bottom.length) return '';
    const fwd = toLinePath(top);
    const rev = [...bottom].reverse().map(p => `L ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
    return `${fwd} ${rev} Z`;
};

function ArchSvgOverlay({ archId, isUpper, teethIds, teeth, view }) {
    const config = isUpper ? ARCH_CONFIG.superior : ARCH_CONFIG.inferior;
    const svgW = teethIds.length * TOOTH_WIDTH;
    const margenPts = buildPoints(teethIds, teeth, view, 'margenGingival', null, isUpper, config);
    const calPts = buildPoints(teethIds, teeth, view, 'margenGingival', 'profundidadSondaje', isUpper, config);
    const margenPath = toLinePath(margenPts);
    const calPath = toLinePath(calPts);
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
            {pocketArea && <path d={pocketArea} fill="rgba(59,130,246,0.15)" stroke="none" />}
            {calPath && <path d={calPath} fill="none" stroke="#3b82f6" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />}
            {margenPath && <path d={margenPath} fill="none" stroke="#ef4444" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />}
        </svg>
    );
}

/**
 * FurcaIcon - Renderiza un triángulo según el grado de furca (Estándar Clínico).
 */
const FurcaIcon = ({ grade, className = "w-4 h-4" }) => {
    const g = Number(grade);
    if (!g || g === 0) return null;
    return (
        <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
            {g === 1 && <path d="M50 15 L90 85 L10 85 Z" stroke="currentColor" strokeWidth="10" strokeLinejoin="round" />}
            {g === 2 && (
                <>
                    <path d="M50 15 L90 85 L10 85 Z" stroke="currentColor" strokeWidth="10" strokeLinejoin="round" />
                    <path d="M50 15 L10 85 L50 85 Z" fill="currentColor" />
                </>
            )}
            {g === 3 && <path d="M50 15 L90 85 L10 85 Z" fill="currentColor" stroke="currentColor" strokeWidth="10" strokeLinejoin="round" />}
        </svg>
    );
};

export default function ReportGrid({ teeth, odontogramStates, getCAL }) {
    return (
        <div className="flex flex-col gap-8 bg-white dark:bg-secondary border border-slate-200 dark:border-slate-700 rounded-3xl p-8 shadow-sm overflow-x-auto print:p-0 print:border-0 print:shadow-none custom-scrollbar">
            <ReportArchBlock title="Arcada Superior - Vestibular" teethIds={UPPER_TEETH} face="vestibular" teeth={teeth} odontogramStates={odontogramStates} getCAL={getCAL} />
            <ReportArchBlock title="Arcada Superior - Palatino" teethIds={UPPER_TEETH} face="palatino" teeth={teeth} odontogramStates={odontogramStates} getCAL={getCAL} isOppositeFace />
            <div className="h-4 border-y border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20 flex items-center justify-center">
                <div className="w-full h-px bg-slate-200 dark:bg-slate-700" />
            </div>
            <ReportArchBlock title="Arcada Inferior - Lingual" teethIds={LOWER_TEETH} face="palatino" teeth={teeth} odontogramStates={odontogramStates} getCAL={getCAL} />
            <ReportArchBlock title="Arcada Inferior - Vestibular" teethIds={LOWER_TEETH} face="vestibular" teeth={teeth} odontogramStates={odontogramStates} getCAL={getCAL} isOppositeFace />
        </div>
    );
}

function ReportArchBlock({ title, teethIds, face, teeth, odontogramStates, getCAL, isOppositeFace }) {
    return (
        <div className="flex flex-col gap-4 min-w-max">
            <div className="flex items-center gap-2 border-l-4 border-primary pl-3 py-1">
                <h3 className="text-sm font-black uppercase text-slate-700 dark:text-slate-200 tracking-wider">{title}</h3>
            </div>
            <div className="flex border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden">
                <div className="flex flex-col bg-slate-50 dark:bg-slate-800/50 border-r border-slate-100 dark:border-slate-700 sticky left-0 z-20">
                    <div className="h-8 flex items-center px-2 text-[9px] font-bold text-slate-400 uppercase">Not</div>
                    <div className="h-8 flex items-center px-2 text-[9px] font-bold text-slate-400 uppercase">Mob</div>
                    <div className="h-8 flex items-center px-2 text-[9px] font-bold text-slate-400 uppercase">Fur</div>
                    <div className="h-8 flex items-center px-2 text-[9px] font-bold text-slate-400 uppercase">Pron</div>
                    <div className="h-8 flex items-center px-2 text-[9px] font-bold text-slate-400 uppercase text-red-500">BOP</div>
                    <div className="h-8 flex items-center px-2 text-[9px] font-bold text-slate-400 uppercase text-blue-500">Plq</div>
                    <div className="h-8 flex items-center px-2 text-[9px] font-bold text-slate-400 uppercase text-amber-500">Sup</div>
                    <div className="h-8 flex items-center px-2 text-[9px] font-bold text-slate-400 uppercase">Mar</div>
                    <div className="h-8 flex items-center px-2 text-[9px] font-bold text-slate-600 dark:text-slate-200 uppercase">Pro</div>
                    <div className="h-8 flex items-center px-2 text-[9px] font-bold text-primary uppercase">CAL</div>
                    <div className="h-48 flex items-center px-2 text-[10px] font-black text-slate-400 uppercase">ID</div>
                </div>
                <div className="relative">
                    <div className="flex">
                        {teethIds.map(id => (
                            <ReportToothColumn key={id} id={id} face={face} data={teeth[id]} odontogramState={odontogramStates[id]} cal={getCAL(id, face)} />
                        ))}
                    </div>
                    <ArchSvgOverlay archId={title} isUpper={UPPER_TEETH.includes(Number(teethIds[0]))} teethIds={teethIds} teeth={teeth} view={face} />
                </div>
            </div>
        </div>
    );
}

function ReportToothColumn({ id, face, data, odontogramState, cal }) {
    const [toothSrc, setToothSrc] = useState(null);
    useEffect(() => {
        let mounted = true;
        getToothSrc(id, odontogramState || 'original').then(src => {
            if (mounted) setToothSrc(src);
        });
        return () => { mounted = false; };
    }, [id, odontogramState]);

    const isMolar = MOLARS.includes(Number(id));
    const faceData = data[face];

    return (
        <div className="flex flex-col w-[100px] border-r border-slate-100 dark:border-slate-800 last:border-0 items-center">
            {/* Notas */}
            <div className="h-8 flex items-center justify-center">
                {data.note ? (
                    <div className="text-blue-500" title={data.note}><Eye size={16} /></div>
                ) : <span className="text-slate-200 dark:text-slate-800">—</span>}
            </div>

            {/* Movilidad */}
            <div className="h-8 flex items-center justify-center">
                <span className="text-[11px] font-bold text-blue-600">{data.mobility || '—'}</span>
            </div>

            {/* Furca */}
            <div className="h-8 flex items-center justify-center">
                {isMolar && data.furca > 0 ? (
                    <FurcaIcon grade={data.furca} className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                ) : <span className="text-slate-200 dark:text-slate-800">—</span>}
            </div>

            {/* Pronóstico */}
            <div className="h-8 flex items-center justify-center">
                <span className="text-[9px] font-bold text-slate-500 capitalize">{data.prognosis || '—'}</span>
            </div>

            {/* BOP (Sangrado) */}
            <div className="h-8 flex items-center justify-center gap-1">
                {faceData.sangrado.map((val, idx) => (
                    <div key={idx} className={`w-7 h-6 rounded-sm border ${val ? 'bg-red-500 border-red-600' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700'}`} />
                ))}
            </div>

            {/* Placa */}
            <div className="h-8 flex items-center justify-center gap-1">
                {faceData.placa.map((val, idx) => (
                    <div key={idx} className={`w-7 h-6 rounded-sm border ${val ? 'bg-blue-400 border-blue-500' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700'}`} />
                ))}
            </div>

            {/* Supuración */}
            <div className="h-8 flex items-center justify-center gap-1">
                {faceData.supuracion.map((val, idx) => (
                    <div key={idx} className={`w-7 h-6 rounded-sm border ${val ? 'bg-amber-400 border-amber-500' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700'}`} />
                ))}
            </div>

            {/* Margen */}
            <div className="h-8 flex items-center justify-center gap-1">
                {faceData.margenGingival.map((v, i) => (
                    <span key={i} className="w-7 text-center text-[10px] font-medium text-slate-400">{v}</span>
                ))}
            </div>

            {/* Profundidad (PRO) */}
            <div className="h-8 flex items-center justify-center gap-1">
                {faceData.profundidadSondaje.map((v, i) => (
                    <span key={i} className={`w-7 text-center text-[11px] font-bold ${Number(v) > 3 ? 'text-red-500 underline' : 'text-slate-700 dark:text-slate-300'}`}>{v}</span>
                ))}
            </div>

            {/* CAL */}
            <div className="h-8 flex items-center justify-center gap-1 w-full bg-primary/5">
                {cal.map((v, i) => (
                    <span key={i} className="w-7 text-center text-[11px] font-black text-primary">{v}</span>
                ))}
            </div>

            {/* Diente e ID */}
            <div className="h-48 flex flex-col items-center justify-center gap-1">
                {toothSrc ? (
                    <div className="relative">
                        <img 
                            src={toothSrc} 
                            alt={id}
                            style={{
                                transform: `translate(${(TOOTH_MICRO_ADJUSTMENTS[id]?.x || 0)}px, ${(TOOTH_MICRO_ADJUSTMENTS[id]?.y || 0)}px)`,
                            }}
                            className="h-48 w-auto object-contain opacity-40 grayscale"
                        />
                        {isMolar && data.furca > 0 && (
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
                                <FurcaIcon grade={data.furca} className="w-5 h-5 text-red-500" />
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="h-48 w-20 bg-slate-50 dark:bg-slate-800 rounded-full animate-pulse" />
                )}
                <span className="text-[10px] font-black text-primary">{id}</span>
            </div>
        </div>
    );
}
