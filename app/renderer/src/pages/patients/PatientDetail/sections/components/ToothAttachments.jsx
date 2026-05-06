import React, { useMemo, useState } from 'react';

/**
 * ATTACHMENT_EXCLUDED_TYPES
 * Clinical rule: Attachments cannot be placed on these tooth states.
 */
const ATTACHMENT_EXCLUDED_TYPES = ['extraction', 'missing', 'unerupted'];

/**
 * SVG ViewBox constants — must match AlignerOverlay dimensions.
 */
const SVG_WIDTH = 820;
const SVG_HEIGHT = 192;
const CENTER_X = SVG_WIDTH / 2;

/**
 * ATTACHMENT_Y_CONFIG
 * Defines the center Y position (within the SVG viewBox) where attachments
 * are anchored relative to the arch row.
 * Tweak these values to shift attachments up/down for each arch.
 */
const ATTACHMENT_Y_CONFIG = {
    upper: 100, // Y center for upper arch attachments
    lower: 90,  // Y center for lower arch attachments
};

/**
 * SingleAttachment
 *
 * Renders a single SVG <rect> attachment on a tooth.
 * Position is relative to the tooth's center X derived from getDynamicOffset.
 *
 * @param {number}  cx         - Absolute SVG X center of the tooth
 * @param {number}  cy         - Absolute SVG Y center of the tooth row
 * @param {object}  attachment - { x, y, width, height, rotation }
 * @param {boolean} active     - Whether to apply active styles
 * @param {boolean} hovered    - Whether the attachment is hovered
 * @param {function} onMouseEnter
 * @param {function} onMouseLeave
 */
function SingleAttachment({ cx, cy, attachment, active = true, hovered, onMouseEnter, onMouseLeave }) {
    const { x = 0, y = 0, width = 6, height = 4, rotation = 0 } = attachment;

    // Compute rect top-left corner: offset from tooth center
    const rectX = cx + x - width / 2;
    const rectY = cy + y - height / 2;

    // Center of this specific rect (for rotation pivot)
    const pivotX = rectX + width / 2;
    const pivotY = rectY + height / 2;

    const fillColor = active ? '#ffffff' : 'rgba(255,255,255,0.35)';
    const strokeColor = hovered
        ? '#60a5fa'     // blue-400 on hover
        : (active ? '#94a3b8' : '#64748b'); // slate-400 active / slate-500 inactive
    const strokeWidth = hovered ? 1.5 : 1;
    const opacity = active ? 1 : 0.5;

    return (
        <g
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            style={{ cursor: 'default' }}
        >
            <rect
                x={rectX}
                y={rectY}
                width={width}
                height={height}
                rx={1}
                fill={fillColor}
                stroke={strokeColor}
                strokeWidth={strokeWidth}
                opacity={opacity}
                transform={`rotate(${rotation}, ${pivotX}, ${pivotY})`}
            />
            {/* Hover glow */}
            {hovered && (
                <rect
                    x={rectX - 1}
                    y={rectY - 1}
                    width={width + 2}
                    height={height + 2}
                    rx={2}
                    fill="none"
                    stroke="rgba(96, 165, 250, 0.4)"
                    strokeWidth={2.5}
                    transform={`rotate(${rotation}, ${pivotX}, ${pivotY})`}
                    style={{ pointerEvents: 'none' }}
                />
            )}
        </g>
    );
}

/**
 * ToothAttachments
 *
 * Renders all attachments for a given dental arch as an SVG overlay.
 * Sits above the AlignerOverlay (z-[25]) and below brackets (z-[30]).
 *
 * Props:
 * @param {object}   attachments      - { [toothId]: [{ x, y, width, height, rotation }] }
 * @param {boolean}  isUpper          - true = upper arch, false = lower arch
 * @param {number[]} teethIds         - IDs of teeth in this arch
 * @param {object}   toothStates      - Current state per tooth { [id]: 'original' | 'extraction' | ... }
 * @param {function} getDynamicOffset - (id) => X offset in px from SVG center
 * @param {boolean}  active           - Whether attachments are in active style (default: true)
 */
export default function ToothAttachments({
    attachments,
    isUpper,
    teethIds,
    toothStates,
    getDynamicOffset,
    active = true,
}) {
    const [hoveredKey, setHoveredKey] = useState(null);

    // Determine Y anchor for this arch
    const centerY = isUpper ? ATTACHMENT_Y_CONFIG.upper : ATTACHMENT_Y_CONFIG.lower;

    /**
     * Build render list: flatten all attachments filtering excluded teeth.
     */
    const renderList = useMemo(() => {
        if (!attachments || Object.keys(attachments).length === 0) return [];

        const items = [];

        teethIds.forEach((id) => {
            const toothAttachmentsRaw = attachments[id];
            if (!toothAttachmentsRaw) return;

            // Handle both single object and array of objects for robustness
            const toothAttachments = Array.isArray(toothAttachmentsRaw)
                ? toothAttachmentsRaw
                : [toothAttachmentsRaw];

            if (toothAttachments.length === 0) return;

            // Clinical exclusion: skip extracted / unerupted / missing teeth
            const state = toothStates[id] || 'original';
            if (ATTACHMENT_EXCLUDED_TYPES.includes(state)) return;

            const xOffset = getDynamicOffset(id);
            if (xOffset === undefined) return;

            const cx = CENTER_X + xOffset; // Absolute SVG X of tooth center

            toothAttachments.forEach((attachment, index) => {
                items.push({
                    key: `att-${id}-${index}`,
                    id,
                    index,
                    cx,
                    attachment,
                });
            });
        });

        return items;
    }, [attachments, teethIds, toothStates, getDynamicOffset]);

    // Don't render anything if there are no visible attachments
    if (renderList.length === 0) return null;

    return (
        <svg
            className="absolute inset-0 z-[25] pointer-events-none w-full h-full overflow-visible"
            viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
            preserveAspectRatio="xMidYMid meet"
            aria-hidden="true"
        >
            {renderList.map(({ key, cx, attachment }) => (
                <SingleAttachment
                    key={key}
                    cx={cx}
                    cy={centerY}
                    attachment={attachment}
                    active={active}
                    hovered={hoveredKey === key}
                    onMouseEnter={() => setHoveredKey(key)}
                    onMouseLeave={() => setHoveredKey(null)}
                />
            ))}
        </svg>
    );
}
