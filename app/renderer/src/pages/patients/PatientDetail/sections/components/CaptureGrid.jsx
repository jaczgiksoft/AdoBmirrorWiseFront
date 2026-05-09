import React, { useState, useEffect } from 'react';
import { getToothSrc } from './toothSvgHelpers';

/**
 * CaptureGrid - Grilla interactiva para la captura de datos periodontales.
 */

const UPPER_TEETH = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
const LOWER_TEETH = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];
const MOLARS = [18, 17, 16, 26, 27, 28, 36, 37, 38, 46, 47, 48];

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
                    <div className="h-16 flex items-center text-[9px] font-bold text-slate-400 uppercase">ID</div>
                </div>

                {/* Dientes */}
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
                        className={`w-7 h-6 rounded-sm border transition-all ${
                            val ? 'bg-red-500 border-red-600 shadow-sm' : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
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
                        className={`w-7 h-6 rounded-sm border transition-all ${
                            val ? 'bg-amber-400 border-amber-500 shadow-sm' : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
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
            <div className="h-16 flex flex-col items-center justify-center gap-1 opacity-80 hover:opacity-100 transition-opacity">
                {toothSrc ? (
                    <img 
                        src={toothSrc} 
                        alt={`Diente ${id}`}
                        className="h-8 w-auto object-contain drop-shadow-sm grayscale brightness-125"
                    />
                ) : (
                    <div className="h-8 w-8 bg-slate-100 dark:bg-slate-800 rounded-full animate-pulse" />
                )}
                <span className="text-[10px] font-black text-slate-400">{id}</span>
            </div>

        </div>
    );
}
