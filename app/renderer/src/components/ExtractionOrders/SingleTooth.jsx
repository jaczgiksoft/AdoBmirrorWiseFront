import React from 'react';

const SingleTooth = ({ id, status, onClick, selectedMode, showLabels = true, strokeColor }) => {
    // Defines safe fallback if status is null/undefined
    const safeStatus = status || { extraction: false };
    // status is object { north: 'extraction', south: 'treatment', etc }
    // modes: 'extraction' -> red, 'treatment' -> green, null -> white

    const getColor = (area) => {
        // Priority: Top-level extraction flag overrides everything
        if (safeStatus.extraction) {
            return 'fill-red-500 hover:fill-red-600 dark:fill-red-600 dark:hover:fill-red-500';
        }

        const state = safeStatus[area];
        if (state === 'extraction') return 'fill-red-500 hover:fill-red-600 dark:fill-red-600 dark:hover:fill-red-500';
        if (state === 'treatment') return 'fill-emerald-500 hover:fill-emerald-600 dark:fill-emerald-600 dark:hover:fill-emerald-500';
        // New Clinical Interactive States
        if (state === 'caries') return 'fill-amber-400 hover:fill-amber-500 dark:fill-amber-500 dark:hover:fill-amber-400';
        if (state === 'fracture') return 'fill-amber-800 hover:fill-amber-900 dark:fill-amber-700 dark:hover:fill-amber-600';
        if (state === 'restoration') return 'fill-emerald-500 hover:fill-emerald-600 dark:fill-emerald-600 dark:hover:fill-emerald-500';

        // Default interactive hover
        if (selectedMode === 'extraction') return 'fill-slate-100 dark:fill-slate-700 hover:fill-red-100 dark:hover:fill-red-900/50';
        if (selectedMode === 'treatment') return 'fill-stone-100 dark:fill-stone-100/90 hover:fill-sky-300/70 dark:hover:fill-sky-300';

        return 'fill-slate-100 dark:fill-slate-700';
    };

    const handleClick = (area) => {
        if (onClick) onClick(id, area);
    };

    // Calculate Pediatric ID (FDI Notation)
    const getPediatricId = (permanentId) => {
        const pid = String(permanentId);
        const quadrant = parseInt(pid[0]);
        const tooth = parseInt(pid[1]);

        // Molars 6, 7, 8 have no pediatric replacement in this slot position
        if (tooth > 5) return '–';

        // Quadrant mapping: 1->5, 2->6, 3->7, 4->8
        const pediatricQuadrant = quadrant + 4;
        return `${pediatricQuadrant}${tooth}`;
    };

    const pediatricId = getPediatricId(id);

    // Common props for paths
    const commonProps = {
        className: `transition-colors duration-200 cursor-pointer ${strokeColor || 'stroke-slate-500 dark:stroke-slate-600'}`,
        strokeWidth: "50",
        strokeMiterlimit: "22.9256"
    };

    return (
        <div className="flex flex-col items-center group">
            {/* Labels Container */}
            {showLabels && (
                <div className="flex flex-col items-center leading-none mb-1 select-none">
                    <span className="text-xs font-bold text-slate-400 group-hover:text-slate-600 dark:text-slate-500 dark:group-hover:text-slate-400 transition-colors">
                        {id}
                    </span>
                    <span className="text-[10px] font-medium text-slate-300 dark:text-slate-600">
                        {pediatricId}
                    </span>
                </div>
            )}

            <svg
                viewBox="0 0 2458 2458"
                className="w-10 h-10 md:w-12 md:h-12 drop-shadow-sm transform hover:scale-105 transition-transform"
            >
                <g id="area_center" onClick={() => handleClick('center')}>
                    <circle
                        {...commonProps}
                        cx="1229" cy="1229" r="536.76"
                        className={`${commonProps.className} ${getColor('center')}`}
                    />
                </g>
                <g id="area_south" onClick={() => handleClick('south')}>
                    <path
                        {...commonProps}
                        d="M1608.55 1608.55l489.48 489.48c-222.4,222.41 -529.65,359.97 -869.03,359.97 -339.38,0 -646.63,-137.56 -869.04,-359.97l489.49 -489.48 -489.49 489.48 489.49 -489.48 0.88 0.86c97.07,96.62 230.89,156.35 378.67,156.35 148.22,0 282.41,-60.08 379.55,-157.21z"
                        className={`${commonProps.className} ${getColor('south')}`}
                    />
                </g>
                <g id="area_west" onClick={() => handleClick('west')}>
                    <path
                        {...commonProps}
                        d="M359.96 2098.03l489.49 -489.48c-97.13,-97.14 -157.21,-231.33 -157.21,-379.55 0,-148.22 60.08,-282.41 157.21,-379.55l-489.48 -489.48c-222.41,222.4 -359.97,529.65 -359.97,869.03 0,339.38 137.56,646.63 359.96,869.03z"
                        className={`${commonProps.className} ${getColor('west')}`}
                    />
                </g>
                <g id="area_north" onClick={() => handleClick('north')}>
                    <path
                        {...commonProps}
                        d="M1229 0c339.38,0 646.63,137.56 869.03,359.97l-489.48 489.48c-97.14,-97.13 -231.33,-157.21 -379.55,-157.21 -147.78,0 -281.6,59.73 -378.67,156.35l-0.88 0.86 -489.48 -489.48 489.48 489.48 -489.48 -489.48c222.4,-222.41 529.65,-359.97 869.03,-359.97z"
                        className={`${commonProps.className} ${getColor('north')}`}
                    />
                </g>
                <g id="area_east" onClick={() => handleClick('east')}>
                    <path
                        {...commonProps}
                        d="M2098.03 359.97l-489.48 489.48 0 0c97.13,97.14 157.21,231.33 157.21,379.55 0,148.22 -60.08,282.41 -157.21,379.55l489.48 489.48 -489.48 -489.48 489.48 489.48 0.87 -0.88c221.89,-222.33 359.1,-529.21 359.1,-868.15 0,-339.38 -137.56,-646.63 -359.97,-869.03z"
                        className={`${commonProps.className} ${getColor('east')}`}
                    />
                </g>
            </svg>
        </div>
    );
};

export default SingleTooth;
