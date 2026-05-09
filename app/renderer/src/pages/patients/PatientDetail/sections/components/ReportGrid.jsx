import React, { useState, useEffect } from 'react';
import { getToothSrc } from './toothSvgHelpers';

/**
 * ReportGrid - Vista de reporte de solo lectura (Estándar SEPA).
 */

const UPPER_TEETH = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
const LOWER_TEETH = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];
const MOLARS = [18, 17, 16, 26, 27, 28, 36, 37, 38, 46, 47, 48];

export default function ReportGrid({ teeth, odontogramStates, getCAL }) {
    return (
        <div className="flex flex-col gap-8 bg-white dark:bg-secondary border border-slate-200 dark:border-slate-700 rounded-3xl p-8 shadow-sm overflow-x-auto print:p-0 print:border-0 print:shadow-none custom-scrollbar">
            
            {/* 1. Superior Vestibular */}
            <ReportArchBlock 
                title="Arcada Superior - Vestibular" 
                teethIds={UPPER_TEETH} 
                face="vestibular" 
                teeth={teeth} 
                odontogramStates={odontogramStates}
                getCAL={getCAL}
            />

            {/* 2. Superior Palatino */}
            <ReportArchBlock 
                title="Arcada Superior - Palatino" 
                teethIds={UPPER_TEETH} 
                face="palatino" 
                teeth={teeth} 
                odontogramStates={odontogramStates}
                getCAL={getCAL}
                isOppositeFace
            />

            {/* ESPACIADOR */}
            <div className="h-4 border-y border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20 flex items-center justify-center">
                <div className="w-full h-px bg-slate-200 dark:bg-slate-700" />
            </div>

            {/* 3. Inferior Lingual */}
            <ReportArchBlock 
                title="Arcada Inferior - Lingual" 
                teethIds={LOWER_TEETH} 
                face="palatino" 
                teeth={teeth} 
                odontogramStates={odontogramStates}
                getCAL={getCAL}
            />

            {/* 4. Inferior Vestibular */}
            <ReportArchBlock 
                title="Arcada Inferior - Vestibular" 
                teethIds={LOWER_TEETH} 
                face="vestibular" 
                teeth={teeth} 
                odontogramStates={odontogramStates}
                getCAL={getCAL}
                isOppositeFace
            />

        </div>
    );
}

function ReportArchBlock({ title, teethIds, face, teeth, odontogramStates, getCAL, isOppositeFace }) {
    return (
        <div className="flex flex-col gap-4 min-w-max">
            <div className="flex items-center gap-2 border-l-4 border-primary pl-3 py-1">
                <h3 className="text-sm font-black uppercase text-slate-700 dark:text-slate-200 tracking-wider">
                    {title}
                </h3>
            </div>

            <div className="flex border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden">
                {/* Labels de Fila */}
                <div className="flex flex-col bg-slate-50 dark:bg-slate-800/50 border-r border-slate-100 dark:border-slate-700 sticky left-0 z-10">
                    <div className="h-12 w-12 flex items-center justify-center text-[10px] font-black text-slate-400">ID</div>
                    <div className="h-8 flex items-center px-2 text-[8px] font-black text-slate-400 uppercase">CAL</div>
                    <div className="h-8 flex items-center px-2 text-[8px] font-black text-slate-400 uppercase">PRO</div>
                    <div className="h-8 flex items-center px-2 text-[8px] font-black text-slate-400 uppercase">MAR</div>
                    <div className="h-6 flex items-center px-2 text-[8px] font-black text-slate-400 uppercase">MOB</div>
                    <div className="h-6 flex items-center px-2 text-[8px] font-black text-slate-400 uppercase">FUR</div>
                </div>

                {/* Dientes */}
                <div className="flex">
                    {teethIds.map(id => (
                        <ReportToothColumn 
                            key={id}
                            id={id}
                            face={face}
                            data={teeth[id]}
                            odontogramState={odontogramStates[id]}
                            cal={getCAL(id, face)}
                        />
                    ))}
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
        <div className="flex flex-col w-[60px] border-r border-slate-100 dark:border-slate-800 last:border-0 items-center">
            
            {/* ID e Imagen */}
            <div className="h-12 flex flex-col items-center justify-center gap-0.5 py-1">
                <span className="text-[10px] font-black text-primary">{id}</span>
                {toothSrc ? (
                    <img 
                        src={toothSrc} 
                        alt={id}
                        className="h-5 w-auto object-contain opacity-30 grayscale"
                    />
                ) : (
                    <div className="h-5 w-5 bg-slate-50 dark:bg-slate-800 rounded-full animate-pulse" />
                )}
            </div>

            {/* CAL */}
            <div className="h-8 flex items-center justify-center gap-1 w-full bg-primary/5">
                {cal.map((v, i) => (
                    <span key={i} className="w-4 text-center text-[11px] font-black text-primary">{v}</span>
                ))}
            </div>

            {/* Profundidad (PRO) */}
            <div className="h-8 flex items-center justify-center gap-1 w-full">
                {faceData.profundidadSondaje.map((v, i) => (
                    <div key={i} className="flex flex-col items-center justify-center w-4 relative">
                        <span className={`text-[11px] font-bold ${Number(v) > 3 ? 'text-red-500 underline decoration-red-200 decoration-2' : 'text-slate-700 dark:text-slate-300'}`}>
                            {v}
                        </span>
                        {/* Punto de Sangrado (BOP) */}
                        {faceData.sangrado[i] && (
                            <div className="absolute -top-1 -right-0.5 w-1.5 h-1.5 bg-red-500 rounded-full border border-white dark:border-slate-900" />
                        )}
                    </div>
                ))}
            </div>

            {/* Margen (MAR) */}
            <div className="h-8 flex items-center justify-center gap-1 w-full text-slate-400">
                {faceData.margenGingival.map((v, i) => (
                    <div key={i} className="flex flex-col items-center justify-center w-4 relative">
                        <span className="text-[10px] font-medium">{v}</span>
                        {/* Punto de Placa */}
                        {faceData.placa[i] && (
                            <div className="absolute -bottom-1 w-1 h-1 bg-amber-400 rounded-full" />
                        )}
                    </div>
                ))}
            </div>

            {/* Movilidad (MOB) */}
            <div className="h-6 flex items-center justify-center w-full border-t border-slate-50 dark:border-slate-800/50">
                <span className="text-[10px] font-bold text-blue-600">{data.mobility || '—'}</span>
            </div>

            {/* Furca (FUR) */}
            <div className="h-6 flex items-center justify-center w-full border-t border-slate-50 dark:border-slate-800/50">
                <span className="text-[10px] font-bold text-slate-500">{isMolar ? (data.furca || '—') : ''}</span>
            </div>

        </div>
    );
}
