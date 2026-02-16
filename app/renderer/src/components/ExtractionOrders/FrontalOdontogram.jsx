import React, { useState } from 'react';

// Load tooth SVGs (reusing the ones from OdontogramSection)
const toothImages = import.meta.glob('@/assets/images/odontogram/*/*.svg', {
    eager: true,
    as: 'url'
});

const getToothSrc = (id, type) => {
    // Try to find the specific type first
    const specificTypeEntry = Object.entries(toothImages).find(([path]) =>
        path.includes(`/odontogram/${type}/tooth-${id}.svg`)
    );

    if (specificTypeEntry) return specificTypeEntry[1];

    // Fallback to original
    const originalEntry = Object.entries(toothImages).find(([path]) =>
        path.includes(`/odontogram/original/tooth-${id}.svg`)
    );

    return originalEntry ? originalEntry[1] : null;
};

const QUADRANTS = {
    q1: [18, 17, 16, 15, 14, 13, 12, 11], // Upper Right
    q2: [21, 22, 23, 24, 25, 26, 27, 28], // Upper Left
    q4: [48, 47, 46, 45, 44, 43, 42, 41], // Lower Right
    q3: [31, 32, 33, 34, 35, 36, 37, 38]  // Lower Left
};

const TEETH_TO_SCALE = [18, 17, 16, 26, 27, 28, 36, 37, 38, 46, 47, 48];


function FrontalTooth({ id, isExtracted, onClick, isUpper }) {
    // Determine source based on state
    // If extracted, use the specific 'extraction' asset which includes the visual indicator
    const type = isExtracted ? 'extraction' : 'original';
    const src = getToothSrc(id, type);
    const shouldScale = TEETH_TO_SCALE.includes(id);

    if (!src) return <div className="w-10 h-14 bg-red-100 text-xs flex items-center justify-center">{id}</div>;

    const NumberLabel = (
        <span className={`text-[10px] md:text-xs font-black transition-colors z-20 ${isExtracted ? 'text-red-600' : 'text-slate-400 group-hover:text-slate-600 dark:text-slate-500'}`}>
            {id}
        </span>
    );

    return (
        <div
            onClick={() => onClick(id)}
            className="flex flex-col items-center cursor-pointer group relative mx-0 transition-all hover:z-20"
        >
            {/* Number ABOVE for Upper Arch */}
            {isUpper && NumberLabel}

            <div className={`relative h-14 md:h-38 transition-all duration-200 
                ${isExtracted ? '' : 'hover:scale-110 drop-shadow-lg'}`}
            >
                <img
                    src={src}
                    alt={`Tooth ${id}`}
                    className="w-full h-full object-contain pointer-events-none"
                    draggable="false"
                />
            </div>

            {/* Number BELOW for Lower Arch */}
            {!isUpper && NumberLabel}
        </div>
    );
}

function Quadrant({ teeth, teethStatus, onToothClick, isUpper }) {
    return (
        <div className="flex items-end justify-center">
            {teeth.map(id => {
                const status = teethStatus[id];
                const isExtracted = status && status.extraction === true;
                return (
                    <FrontalTooth
                        key={id}
                        id={id}
                        isExtracted={isExtracted}
                        onClick={onToothClick}
                        isUpper={isUpper}
                    />
                );
            })}
        </div>
    );
}

export default function FrontalOdontogram({ teethStatus, onStatusChange }) {

    const handleToothClick = (id) => {
        const currentStatus = teethStatus[id];
        const isExtracted = currentStatus && currentStatus.extraction === true;

        if (isExtracted) {
            // Toggle OFF -> Send null (clear extraction)
            onStatusChange(id, null);
        } else {
            // Toggle ON -> Send extraction: true
            onStatusChange(id, { extraction: true });
        }
    };

    return (
        <div className="flex flex-col items-center justify-center p-4 relative select-none">
            {/* Background pattern */}
            <div className="absolute inset-0 pointer-events-none opacity-5 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] dark:bg-[radial-gradient(#475569_1px,transparent_1px)] [background-size:20px_20px]"></div>

            <div className="relative z-0 scale-90 md:scale-100 transition-transform">
                {/* Labels */}
                <div className="text-center mb-6 text-xs font-bold tracking-[0.2em] text-slate-400 dark:text-slate-500 uppercase">
                    Superior (Maxilar)
                </div>

                {/* Upper Arch */}
                <div className="flex items-end justify-center gap-1 md:gap-4 pb-6 border-b border-slate-200 dark:border-slate-700/50">
                    <Quadrant teeth={QUADRANTS.q1} teethStatus={teethStatus} onToothClick={handleToothClick} isUpper={true} />
                    <div className="w-px h-20 bg-slate-200 dark:bg-slate-700 mx-1"></div>
                    <Quadrant teeth={QUADRANTS.q2} teethStatus={teethStatus} onToothClick={handleToothClick} isUpper={true} />
                </div>

                {/* Lower Arch */}
                <div className="flex items-start justify-center gap-1 md:gap-4 pt-6">
                    <Quadrant teeth={QUADRANTS.q4} teethStatus={teethStatus} onToothClick={handleToothClick} isUpper={false} />
                    <div className="w-px h-20 bg-slate-200 dark:bg-slate-700 mx-1"></div>
                    <Quadrant teeth={QUADRANTS.q3} teethStatus={teethStatus} onToothClick={handleToothClick} isUpper={false} />
                </div>

                <div className="text-center mt-6 text-xs font-bold tracking-[0.2em] text-slate-400 dark:text-slate-500 uppercase">
                    Inferior (Mandíbula)
                </div>
            </div>

            <div className="mt-6 flex items-center gap-2 text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/50 px-3 py-1.5 rounded-full border border-slate-100 dark:border-slate-800">
                <span className="w-2 h-2 rounded-full bg-red-500"></span>
                <span>Seleccione los dientes a extraer</span>
            </div>
        </div>
    );
}
