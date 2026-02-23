import React from 'react';

const SingleTooth = ({ id, status, onClick, selectedMode, showLabels = true, strokeColor, size, pediatricId, colorScheme = 'blue', paintMode = 'simple' }) => {
    // Defines safe fallback if status is null/undefined
    // paintMode: 'simple' | 'clinical'
    const safeStatus = status || { extraction: false };
    const [hoveredArea, setHoveredArea] = React.useState(null);

    const sizeStyle = size ? { width: size, height: size } : {};
    const defaultSizeClasses = size ? '' : 'w-10 h-10 md:w-11.5 md:h-11.5';

    const COLORS = {
        base: "#FFFFFF",
        blue: { selected: "#60a5fa" }, // blue-400
        emerald: { selected: "#10b981", hover: "#6ee7b7" }, // emerald-500, emerald-300
        neutral: { default: "#FFFFFF", stroke: "#111827", selected: "#3b82f6", hover: "#3b82f6" }, // white, gray-900, blue-500

        yellow: {
            selected: "#facc15",
            hover: "#fde047"
        },

        brown: {
            selected: "#92400e",
            hover: "#b45309"
        },

        green: {
            selected: "#16a34a",
            hover: "#22c55e"
        }
    };

    const commonProps = {
        stroke: paintMode === 'clinical'
            ? "#111827"   // negro fijo en odontograma
            : (colorScheme === 'neutral'
                ? COLORS.neutral.stroke
                : (strokeColor || "#1f2937")),
        strokeWidth: 120,
        className: status?.extraction
            ? "cursor-not-allowed transition-colors"
            : "cursor-pointer transition-colors"
    };

    const getColor = (area) => {
        if (status?.extraction) return COLORS.base;
        // Clinical Mode (Odontogram)
        if (paintMode === 'clinical') {
            if (!status) return COLORS.base;

            const condition = status?.[area];

            if (condition) {
                if (condition === 'caries') return COLORS.brown.selected;
                if (condition === 'restoration') return COLORS.green.selected;
                if (condition === 'fracture') return COLORS.yellow.selected;
            }

            // Hover remains blue
            if (hoveredArea === area && !status?.extraction) {
                return "#3b82f6";
            }

            return COLORS.base;
        }

        // Simple Mode (Extraction Orders / Default)
        // Uses colorScheme to determine active color
        if (!status) return colorScheme === 'neutral' ? COLORS.neutral.default : COLORS.base;

        // Base restoration removal logic (if applicable in context)
        if (selectedMode === "Diente Base") {
            return colorScheme === 'neutral' ? COLORS.neutral.default : COLORS.base;
        }

        const isSelected = !!status?.[area];

        if (isSelected) {
            if (colorScheme === 'emerald') return COLORS.emerald.selected;
            if (colorScheme === 'neutral') return COLORS.neutral.selected;
            return COLORS.blue.selected;
        }

        // Hover Effects
        if (hoveredArea === area) {
            if (colorScheme === 'emerald') return COLORS.emerald.hover;
            if (colorScheme === 'neutral') return COLORS.neutral.hover;
        }

        // Default Background
        if (colorScheme === 'neutral') return COLORS.neutral.default;

        return COLORS.base;
    };

    const handleClick = (area) => {
        if (onClick) onClick(id, area);
    };

    const handleMouseEnter = (area) => setHoveredArea(area);
    const handleMouseLeave = () => setHoveredArea(null);

    const renderArea = (id, d, cx, cy, r) => (
        <g
            id={`area_${id}`}
            onClick={() => handleClick(id)}
            onMouseEnter={() => handleMouseEnter(id)}
            onMouseLeave={handleMouseLeave}
        >
            {d ? (
                <path
                    {...commonProps}
                    d={d}
                    style={{ fill: getColor(id) }}
                />
            ) : (
                <circle
                    {...commonProps}
                    cx={cx} cy={cy} r={r}
                    style={{ fill: getColor(id) }}
                />
            )}
        </g>
    );

    return (
        <div className="flex flex-col items-center group">
            {/* Labels Container */}
            {showLabels && (
                <div className="flex flex-col items-center leading-none mb-1 select-none">
                    <span className="text-xs font-bold text-slate-400 group-hover:text-slate-600 dark:text-slate-500 dark:group-hover:text-slate-400 transition-colors">
                        {id}
                    </span>
                    {pediatricId && (
                        <span className="text-[10px] font-medium text-slate-300 dark:text-slate-600">
                            {pediatricId}
                        </span>
                    )}
                </div>
            )}

            <svg
                viewBox="0 0 2458 2458"
                style={sizeStyle}
                className={`${defaultSizeClasses} drop-shadow-sm transform hover:scale-105 transition-transform`}
            >
                {renderArea('center', null, "1229", "1229", "536.76")}
                {renderArea('south', "M1608.55 1608.55l489.48 489.48c-222.4,222.41 -529.65,359.97 -869.03,359.97 -339.38,0 -646.63,-137.56 -869.04,-359.97l489.49 -489.48 -489.49 489.48 489.49 -489.48 0.88 0.86c97.07,96.62 230.89,156.35 378.67,156.35 148.22,0 282.41,-60.08 379.55,-157.21z")}
                {renderArea('west', "M359.96 2098.03l489.49 -489.48c-97.13,-97.14 -157.21,-231.33 -157.21,-379.55 0,-148.22 60.08,-282.41 157.21,-379.55l-489.48 -489.48c-222.41,222.4 -359.97,529.65 -359.97,869.03 0,339.38 137.56,646.63 359.96,869.03z")}
                {renderArea('north', "M1229 0c339.38,0 646.63,137.56 869.03,359.97l-489.48 489.48c-97.14,-97.13 -231.33,-157.21 -379.55,-157.21 -147.78,0 -281.6,59.73 -378.67,156.35l-0.88 0.86 -489.48 -489.48 489.48 489.48 -489.48 -489.48c222.4,-222.41 529.65,-359.97 869.03,-359.97z")}
                {renderArea('east', "M2098.03 359.97l-489.48 489.48 0 0c97.13,97.14 157.21,231.33 157.21,379.55 0,148.22 -60.08,282.41 -157.21,379.55l489.48 489.48 -489.48 -489.48 489.48 489.48 0.87 -0.88c221.89,-222.33 359.1,-529.21 359.1,-868.15 0,-339.38 -137.56,-646.63 -359.97,-869.03z")}
            </svg>
        </div>
    );
};

export default SingleTooth;
