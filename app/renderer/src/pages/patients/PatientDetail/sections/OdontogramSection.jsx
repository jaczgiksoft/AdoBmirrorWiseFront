import React, { useState, useRef, useLayoutEffect, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import bracketImg from '@/assets/images/odontogram/bracket.svg';
import bracketRotoImg from '@/assets/images/odontogram/bracket-roto.svg';
import bracketGanchoImg from '@/assets/images/odontogram/bracket-gancho.svg';
import bracketGanchoRotoImg from '@/assets/images/odontogram/bracket-gancho-roto.svg';
import tadImg from '@/assets/images/odontogram/tad.svg';
import SingleTooth from '@/components/ExtractionOrders/SingleTooth';
import ConfirmDialog from '@/components/feedback/ConfirmDialog';
import { Menu, MenuItem, SubMenu } from '@spaceymonk/react-radial-menu';
import VoiceSettingsModal from './VoiceSettingsModal';

// ==========================================
// 1. Asset Loading & Helpers
// ==========================================

import {
    toothImages,
    toothRawSvgs,
    getToothRaw,
    getToothSrc,
    getBaseSvgType,
    generateCombinedSvgDataUrl
} from './components/toothSvgHelpers';

// Helper to handle combined state toggling
const getToggledToothState = (currentType, newType) => {
    // If clicking the same type, toggle back to original
    if (currentType === newType) return 'original';

    // Exclusive states that immediately override anything else
    const exclusive = ['extraction', 'missing', 'unerupted', 'deciduous', 'pulpotomy', 'original', 'reabsorcion-radicular', 'anquilosado'];
    if (exclusive.includes(newType)) return newType;

    // Convert current state into an array of active types
    // 'implant-crown' is mapped to ['implant', 'crown'] for backwards compatibility
    let activeTypes = currentType === 'original' || exclusive.includes(currentType) ? [] :
        (currentType === 'implant-crown' ? ['implant', 'crown'] : currentType.split('+'));

    // Toggle newType
    if (activeTypes.includes(newType)) {
        activeTypes = activeTypes.filter(t => t !== newType);
    } else {
        // Enforce mutually exclusive rules within combinations
        // e.g. you can't have two different types of fissure at once
        if (newType.startsWith('fissure-')) {
            activeTypes = activeTypes.filter(t => !t.startsWith('fissure-'));
        }
        activeTypes.push(newType);
    }

    // If we removed everything or ended up with 1 thing
    if (activeTypes.length === 0) return 'original';
    if (activeTypes.length === 1) return activeTypes[0];

    // Legacy mapping for implant-crown exact match
    if (activeTypes.length === 2 && activeTypes.includes('implant') && activeTypes.includes('crown')) {
        return 'implant-crown';
    }

    // Join any complex multi-states with a + delimiter
    return activeTypes.sort().join('+');
};

// Helper to get display number (Permanent vs Deciduous)
const getDisplayNumber = (id, type) => {
    // Only 'deciduous' and 'pulpotomy' types trigger deciduous numbering
    if (type !== 'deciduous' && type !== 'pulpotomy') return id;

    const idStr = id.toString();
    const quadrant = parseInt(idStr[0]);
    const position = parseInt(idStr[1]);

    // Deciduous teeth only go up to 5
    if (position > 5) return id;

    let newQuadrant;
    switch (quadrant) {
        case 1: newQuadrant = 5; break;
        case 2: newQuadrant = 6; break;
        case 3: newQuadrant = 7; break;
        case 4: newQuadrant = 8; break;
        default: return id;
    }

    return parseInt(`${newQuadrant}${position}`);
};

// Helper to compute Pediatric ID for label display
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

// ==========================================
// 2. Constants & Data Definition
// ==========================================

const TEETH_TO_SCALE = [
    18, 17, 16,
    26, 27, 28,
    36, 37, 38,
    46, 47, 48
];

// ==========================================
// CONFIGURACIÓN DE BRACKETS ESPECIALES
// ==========================================
const BRACKET_HOOK_CONFIG = {
    // Dientes que usarán el bracket-gancho.svg en lugar del tradicional
    teethIds: [16, 17, 18, 26, 27, 28, 36, 37, 38, 46, 47, 48],
    // Clases CSS de Tailwind para el tamaño del bracket especial (móvil y escritorio)
    sizeClasses: 'w-4 h-4 md:w-8 md:h-8',
    // Clases CSS de Tailwind para el tamaño del bracket normal
    defaultSizeClasses: 'w-2.5 h-2.5 md:w-5 md:h-5',
    // Micro ajustes para rotar (grados), voltear (espejo scaleX/scaleY), o trasladar (offsetX/offsetY en píxeles)
    adjustments: {
        16: { rotate: 180, scaleX: 1, scaleY: 1, offsetX: 0, offsetY: -12 },
        17: { rotate: 180, scaleX: 1, scaleY: 1, offsetX: 0, offsetY: -12 },
        18: { rotate: 180, scaleX: 1, scaleY: 1, offsetX: 0, offsetY: -10 },
        26: { rotate: 180, scaleX: -1, scaleY: 1, offsetX: 0, offsetY: -12 },
        27: { rotate: 180, scaleX: -1, scaleY: 1, offsetX: 0, offsetY: -12 }, // Volteado horizontalmente
        28: { rotate: 180, scaleX: -1, scaleY: 1, offsetX: 0, offsetY: -10 },
        36: { rotate: 0, scaleX: 1, scaleY: 1, offsetX: 0, offsetY: -1 },
        37: { rotate: 0, scaleX: 1, scaleY: 1, offsetX: 0, offsetY: -3 }, // Rotado
        38: { rotate: 0, scaleX: 1, scaleY: 1, offsetX: 0, offsetY: -6 },
        46: { rotate: 0, scaleX: -1, scaleY: 1, offsetX: 0, offsetY: -1 },
        47: { rotate: 0, scaleX: -1, scaleY: 1, offsetX: 0, offsetY: -3 }, // Rotado y volteado
        48: { rotate: 0, scaleX: -1, scaleY: 1, offsetX: 0, offsetY: -6 }
    }
};
const INACTIVE_TYPES = ['extraction', 'missing', 'unerupted'];
const DENTAL_TYPES = [
    { id: 'original', label: 'Diente Base', color: 'text-emerald-700 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400' },
    { id: 'root-canal', label: 'Tratamiento de Endodoncia', color: 'text-pink-700 bg-pink-50 dark:bg-pink-900/20 dark:text-pink-400' },
    { id: 'extraction', label: 'Extracción Dental', color: 'text-slate-700 bg-slate-100 dark:bg-slate-800 dark:text-slate-400' },
    { id: 'missing', label: 'Diente Ausente', color: 'text-gray-600 bg-gray-50 dark:bg-gray-800 dark:text-gray-400' },
    { id: 'unerupted', label: 'Diente no erupcionado', color: 'text-purple-700 bg-purple-50 dark:bg-purple-900/20 dark:text-purple-400' },
    { id: 'implant', label: 'Implante Dental', color: 'text-blue-700 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400' },
    { id: 'crown', label: 'Corona Dental', color: 'text-amber-700 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400' },
    { id: 'fissure-full', label: 'Fisura Completa', color: 'text-red-700 bg-red-50 dark:bg-red-900/20 dark:text-red-400' },
    { id: 'fissure-crown', label: 'Fisura Corona', color: 'text-orange-700 bg-orange-50 dark:bg-orange-900/20 dark:text-orange-400' },
    { id: 'fissure-root', label: 'Fisura Raíz', color: 'text-rose-700 bg-rose-50 dark:bg-rose-900/20 dark:text-rose-400' },
    { id: 'deciduous', label: 'Diente Deciduo', color: 'text-cyan-700 bg-cyan-50 dark:bg-cyan-900/20 dark:text-cyan-400' },
    { id: 'pulpotomy', label: 'Pulpotomía', color: 'text-indigo-700 bg-indigo-50 dark:bg-indigo-900/20 dark:text-indigo-400' },
    { id: 'reabsorcion-radicular', label: 'Reabsorción Radicular', color: 'text-teal-700 bg-teal-50 dark:bg-teal-900/20 dark:text-teal-400' },
    { id: 'anquilosado', label: 'Anquilosado', color: 'text-fuchsia-700 bg-fuchsia-50 dark:bg-fuchsia-900/20 dark:text-fuchsia-400' },
];

const RADIAL_MENU_DEFAULT_SIZES = {
    level1: { innerRadius: 78, outerRadius: 250 },
    level2: { innerRadius: 185, outerRadius: 299 }
};

// Apartado de código para poder indicar qué diente es y pasar los valores para ajustarlos
// Ejemplo: { 18: { level1: { innerRadius: 90, outerRadius: 260 }, level2: { innerRadius: 195, outerRadius: 310 } } }
const RADIAL_MENU_CUSTOM_SIZES = {
    18: {
        offsetX: -10,
        offsetY: 7,
        previewOffsetY: -20,
        level1: { innerRadius: 85, outerRadius: 190 },
        level2: { innerRadius: 195, outerRadius: 290 }
    },
    17: {
        offsetX: -10,
        offsetY: 7,
        previewOffsetY: -15,
        level1: { innerRadius: 90, outerRadius: 190 },
        level2: { innerRadius: 195, outerRadius: 290 }
    },
    16: {
        offsetX: -10,
        offsetY: 3,
        previewOffsetY: -15,
        level1: { innerRadius: 90, outerRadius: 190 },
        level2: { innerRadius: 195, outerRadius: 290 }
    },
    15: {
        offsetX: -10,
        offsetY: -1,
        previewOffsetY: -12,
        typeOffsets: {
            'pulpotomy': { offsetX: 10, offsetY: -15 },
            'deciduous': { offsetX: 10, offsetY: -15 },
        },
        level1: { innerRadius: 100, outerRadius: 190 },
        level2: { innerRadius: 195, outerRadius: 290 }
    },
    14: {
        offsetX: -11,
        offsetY: -3,
        previewOffsetY: -10,
        typeOffsets: {
            'pulpotomy': { offsetX: 10, offsetY: -15 },
            'deciduous': { offsetX: 10, offsetY: -15 },
        },
        level1: { innerRadius: 100, outerRadius: 190 },
        level2: { innerRadius: 195, outerRadius: 290 }
    },
    13: {
        offsetX: -11,
        offsetY: -12,
        previewOffsetY: 0,
        typeOffsets: {
            'pulpotomy': { offsetX: 0, offsetY: -20 },
            'deciduous': { offsetX: 0, offsetY: -20 },
        },
        level1: { innerRadius: 110, outerRadius: 190 },
        level2: { innerRadius: 195, outerRadius: 290 }
    },
    12: {
        offsetX: -11,
        offsetY: -2,
        previewOffsetY: -5,
        typeOffsets: {
            'pulpotomy': { offsetX: 0, offsetY: -30 },
            'deciduous': { offsetX: 0, offsetY: -30 },
        },
        level1: { innerRadius: 95, outerRadius: 190 },
        level2: { innerRadius: 195, outerRadius: 290 }
    },
    11: {
        offsetX: -11,
        offsetY: -6,
        previewOffsetY: -5,
        typeOffsets: {
            'pulpotomy': { offsetX: 0, offsetY: -20 },
            'deciduous': { offsetX: 0, offsetY: -20 },
        },
        level1: { innerRadius: 107, outerRadius: 190 },
        level2: { innerRadius: 195, outerRadius: 290 }
    },
    // 21 al 28
    28: {
        offsetX: -10,
        offsetY: 7,
        previewOffsetY: -20,
        level1: { innerRadius: 85, outerRadius: 190 },
        level2: { innerRadius: 195, outerRadius: 290 }
    },
    27: {
        offsetX: -10,
        offsetY: 7,
        previewOffsetY: -15,
        level1: { innerRadius: 90, outerRadius: 190 },
        level2: { innerRadius: 195, outerRadius: 290 }
    },
    26: {
        offsetX: -10,
        offsetY: 3,
        previewOffsetY: -15,
        level1: { innerRadius: 90, outerRadius: 190 },
        level2: { innerRadius: 195, outerRadius: 290 }
    },
    25: {
        offsetX: -10,
        offsetY: -1,
        previewOffsetY: -12,
        typeOffsets: {
            'pulpotomy': { offsetX: -10, offsetY: -15 },
            'deciduous': { offsetX: -10, offsetY: -15 },
        },
        level1: { innerRadius: 100, outerRadius: 190 },
        level2: { innerRadius: 195, outerRadius: 290 }
    },
    24: {
        offsetX: -11,
        offsetY: -3,
        previewOffsetY: -10,
        typeOffsets: {
            'pulpotomy': { offsetX: -10, offsetY: -15 },
            'deciduous': { offsetX: -10, offsetY: -15 },
        },
        level1: { innerRadius: 100, outerRadius: 190 },
        level2: { innerRadius: 195, outerRadius: 290 }
    },
    23: {
        offsetX: -11,
        offsetY: -12,
        previewOffsetY: 0,
        typeOffsets: {
            'pulpotomy': { offsetX: 0, offsetY: -20 },
            'deciduous': { offsetX: 0, offsetY: -20 },
        },
        level1: { innerRadius: 110, outerRadius: 190 },
        level2: { innerRadius: 195, outerRadius: 290 }
    },
    22: {
        offsetX: -11,
        offsetY: -2,
        previewOffsetY: -5,
        typeOffsets: {
            'pulpotomy': { offsetX: 0, offsetY: -30 },
            'deciduous': { offsetX: 0, offsetY: -30 },
        },
        level1: { innerRadius: 95, outerRadius: 190 },
        level2: { innerRadius: 195, outerRadius: 290 }
    },
    21: {
        offsetX: -11,
        offsetY: -6,
        previewOffsetY: -5,
        typeOffsets: {
            'pulpotomy': { offsetX: 0, offsetY: -20 },
            'deciduous': { offsetX: 0, offsetY: -20 },
        },
        level1: { innerRadius: 107, outerRadius: 190 },
        level2: { innerRadius: 195, outerRadius: 290 }
    },
    /*-- inferiores ---*/
    // 31 al 38
    31: {
        offsetX: -8,
        offsetY: -26,
        previewOffsetY: 15,
        typeOffsets: {
            'pulpotomy': { offsetX: 0, offsetY: 30 },
            'deciduous': { offsetX: 0, offsetY: 30 },
        },
        level1: { innerRadius: 90, outerRadius: 180 },
        level2: { innerRadius: 195, outerRadius: 290 }
    },
    32: {
        offsetX: -7,
        offsetY: -25,
        previewOffsetY: 15,
        typeOffsets: {
            'pulpotomy': { offsetX: 0, offsetY: 30 },
            'deciduous': { offsetX: 0, offsetY: 30 },
        },
        level1: { innerRadius: 90, outerRadius: 190 },
        level2: { innerRadius: 195, outerRadius: 290 }
    },
    33: {
        offsetX: -9,
        offsetY: -14,
        previewOffsetY: 3,
        typeOffsets: {
            'pulpotomy': { offsetX: 0, offsetY: 30 },
            'deciduous': { offsetX: 0, offsetY: 30 },
        },
        level1: { innerRadius: 105, outerRadius: 190 },
        level2: { innerRadius: 195, outerRadius: 290 }
    },
    34: {
        offsetX: -10,
        offsetY: -30,
        previewOffsetY: 15,
        typeOffsets: {
            'pulpotomy': { offsetX: -10, offsetY: 15 },
            'deciduous': { offsetX: -10, offsetY: 15 },
        },
        level1: { innerRadius: 90, outerRadius: 190 },
        level2: { innerRadius: 195, outerRadius: 290 }
    },
    35: {
        offsetX: -10,
        offsetY: -30,
        previewOffsetY: 15,
        typeOffsets: {
            'pulpotomy': { offsetX: -15, offsetY: 12 },
            'deciduous': { offsetX: -15, offsetY: 12 },
        },
        level1: { innerRadius: 90, outerRadius: 190 },
        level2: { innerRadius: 195, outerRadius: 290 }
    },
    36: {
        offsetX: -12,
        offsetY: -35,
        previewOffsetY: 25,
        level1: { innerRadius: 90, outerRadius: 190 },
        level2: { innerRadius: 195, outerRadius: 290 }
    },
    37: {
        offsetX: -13,
        offsetY: -40,
        previewOffsetY: 25,
        level1: { innerRadius: 90, outerRadius: 190 },
        level2: { innerRadius: 195, outerRadius: 290 }
    },
    38: {
        offsetX: -13,
        offsetY: -45,
        previewOffsetY: 28,
        level1: { innerRadius: 90, outerRadius: 190 },
        level2: { innerRadius: 195, outerRadius: 290 }
    },
    // 41 al 48
    41: {
        offsetX: -8,
        offsetY: -26,
        previewOffsetY: 15,
        typeOffsets: {
            'pulpotomy': { offsetX: 0, offsetY: 30 },
            'deciduous': { offsetX: 0, offsetY: 30 },
        },
        level1: { innerRadius: 90, outerRadius: 180 },
        level2: { innerRadius: 195, outerRadius: 290 }
    },
    42: {
        offsetX: -7,
        offsetY: -25,
        previewOffsetY: 15,
        typeOffsets: {
            'pulpotomy': { offsetX: 0, offsetY: 30 },
            'deciduous': { offsetX: 0, offsetY: 30 },
        },
        level1: { innerRadius: 90, outerRadius: 190 },
        level2: { innerRadius: 195, outerRadius: 290 }
    },
    43: {
        offsetX: -9,
        offsetY: -14,
        previewOffsetY: 3,
        typeOffsets: {
            'pulpotomy': { offsetX: 0, offsetY: 30 },
            'deciduous': { offsetX: 0, offsetY: 30 },
        },
        level1: { innerRadius: 105, outerRadius: 190 },
        level2: { innerRadius: 195, outerRadius: 290 }
    },
    44: {
        offsetX: -10,
        offsetY: -30,
        previewOffsetY: 15,
        typeOffsets: {
            'pulpotomy': { offsetX: 10, offsetY: 15 },
            'deciduous': { offsetX: 10, offsetY: 15 },
        },
        level1: { innerRadius: 90, outerRadius: 190 },
        level2: { innerRadius: 195, outerRadius: 290 }
    },
    45: {
        offsetX: -10,
        offsetY: -30,
        previewOffsetY: 15,
        typeOffsets: {
            'pulpotomy': { offsetX: 15, offsetY: 12 },
            'deciduous': { offsetX: 15, offsetY: 12 },
        },
        level1: { innerRadius: 90, outerRadius: 190 },
        level2: { innerRadius: 195, outerRadius: 290 }
    },
    46: {
        offsetX: -12,
        offsetY: -35,
        previewOffsetY: 25,
        level1: { innerRadius: 90, outerRadius: 190 },
        level2: { innerRadius: 195, outerRadius: 290 }
    },
    47: {
        offsetX: -13,
        offsetY: -40,
        previewOffsetY: 25,
        level1: { innerRadius: 90, outerRadius: 190 },
        level2: { innerRadius: 195, outerRadius: 290 }
    },
    48: {
        offsetX: -13,
        offsetY: -45,
        previewOffsetY: 28,
        level1: { innerRadius: 90, outerRadius: 190 },
        level2: { innerRadius: 195, outerRadius: 290 }
    },
};

// Helper para obtener los tamaños según el diente actual
const getRadialMenuSizes = (toothId) => {
    if (!toothId || !RADIAL_MENU_CUSTOM_SIZES[toothId]) {
        return RADIAL_MENU_DEFAULT_SIZES;
    }
    return {
        level1: {
            ...RADIAL_MENU_DEFAULT_SIZES.level1,
            ...RADIAL_MENU_CUSTOM_SIZES[toothId].level1
        },
        level2: {
            ...RADIAL_MENU_DEFAULT_SIZES.level2,
            ...RADIAL_MENU_CUSTOM_SIZES[toothId].level2
        }
    };
};

const OCCLUSAL_TYPES = [
    { id: 'normal', label: 'Limpiar / Normal', color: 'bg-white' },

    // Caries → café
    {
        id: 'caries',
        label: 'Caries',
        color: 'bg-amber-100 border-amber-300 text-amber-800'
    },

    // Restauración → azul
    {
        id: 'restoration',
        label: 'Restauración',
        color: 'bg-slate-100 border-sky-300 text-sky-700'
    },

    // Fractura → amarillo
    // {
    //     id: 'fracture',
    //     label: 'Fractura',
    //     color: 'bg-yellow-100 border-yellow-300 text-yellow-700'
    // }
];

/**
 * FIXED FDI COORDINATE MAP
 * Defines the exact X offset (in pixels) from the center (0) for each tooth.
 * Negative values = Left of center (Patient Right)
 * Positive values = Right of center (Patient Left)
 */
const TOOTH_COORDINATES = {
    // Upper Right (Q1) - Compact Clinical Spacing (Touching)
    11: -30, 12: -70, 13: -110, 14: -153, 15: -195, 16: -245, 17: -300, 18: -358,
    // Upper Left (Q2)
    21: 30, 22: 70, 23: 110, 24: 153, 25: 195, 26: 245, 27: 300, 28: 358,
    // Lower Left (Q3)
    31: 23, 32: 68, 33: 108, 34: 151, 35: 195, 36: 246, 37: 297, 38: 349,
    // Lower Right (Q4)
    41: -23, 42: -68, 43: -108, 44: -151, 45: -195, 46: -246, 47: -297, 48: -349,
    // Note: Adjusted for visual contact. Anteriors ~42px, Premolars ~43px, Molars ~51px spacing.
};

/**
 * ANATOMICAL MICRO-ADJUSTMENTS
 * Additive pixel offsets to fine-tune specific tooth positions.
 * Used to create slightly more natural separation or tightness where needed without breaking the base grid.
 */
const MICRO_ADJUSTMENTS_PERMANENT = {
    // UPPER ARCH
    12: -3, 13: -3, 14: -3, 15: -3, 16: -3, 17: -6, 18: -6,
    22: 3, 23: 3, 24: 3, 25: 3, 26: 3, 27: 6, 28: 6,

    // LOWER ARCH
    42: 9, 43: 10, 44: 10, 45: 9, 46: 6, 47: -3, 48: -8,
    32: -9, 33: -10, 34: -10, 35: -9, 36: -6, 37: 3, 38: 8
};

const MICRO_ADJUSTMENTS_DECIDUOUS = {
    // UPPER RIGHT (Q1)
    11: -0,
    12: -3,
    13: -4,
    14: -12,
    15: -16,

    // UPPER LEFT (Q2)
    21: 0,
    22: 3,
    23: 4,
    24: 12,
    25: 16,

    // LOWER LEFT (Q3)
    31: -3,
    32: -10,
    33: -12,
    34: -0,
    35: 5,

    // LOWER RIGHT (Q4)
    41: 3,
    42: 10,
    43: 12,
    44: 0,
    45: -5,
};

const TAD_MICRO_ADJUSTMENTS = {
    // UPPER RIGHT (Q1)
    "16-17": -2,
    "15-16": 6,
    "14-15": -2,
    "13-14": -2,
    "12-13": 2,
    "11-12": -1,

    // UPPER LEFT (Q2)
    "21-22": 0,
    "22-23": -2,
    "23-24": 1,
    "24-25": 2,
    "25-26": -6,
    "26-27": 2,

    // LOWER RIGHT (Q4)
    "46-47": -5,
    "45-46": 4.5,
    "44-45": -1,
    "43-44": -1,
    "42-43": 2,
    "41-42": 0,

    // LOWER LEFT (Q3)
    "31-32": -1,
    "32-33": -2,
    "33-34": 1,
    "34-35": 0,
    "35-36": -5,
    "36-37": 3.5,
};

const TAD_CUSTOM_CONFIG = {
    // "16-17": { scale: 1.2, offsetY: 0 },
    "12-13": { scale: 1.2 }, // 20% larger
    "11-12": { scale: 0.9 }, // 10% smaller
};


// Define quadrants purely for iteration purposes (rendering order doesn't matter for layout now, but good for data)
const QUADRANTS = {
    q1: [18, 17, 16, 15, 14, 13, 12, 11],
    q2: [21, 22, 23, 24, 25, 26, 27, 28],
    q3: [31, 32, 33, 34, 35, 36, 37, 38],
    q4: [48, 47, 46, 45, 44, 43, 42, 41]
};

// Helpers for Arch Groups
const UPPER_ARCH_IDS = [...QUADRANTS.q1, ...QUADRANTS.q2]; // 18...28
const LOWER_ARCH_IDS = [...QUADRANTS.q4, ...QUADRANTS.q3]; // 48...38

// Derived Initial State Generator (Factory Function)
const buildInitialToothStates = () => {
    const initial = {};
    Object.values(QUADRANTS).flat().forEach(id => {
        initial[id] = 'original';
    });
    return initial;
};

// ==========================================
// 3. Components
// ==========================================

// Individual Tooth Component (Frontal) - Unchanged visuals
function Tooth({ id, type, hasBracket, isBroken, isSelectedBracket, isBracketMode, onToothClick, onToothRightClick, currentClinicalAction, onResize, hideLabel, hoveredPreviewType }) {
    const isImplantCrown = type === 'implant-crown';
    const activeTypes = isImplantCrown ? ['implant', 'crown'] : (type ? type.split('+') : ['original']);
    const isCombined = activeTypes.length > 1 || isImplantCrown;
    const baseType = activeTypes[0] || 'original';
    const src = !isCombined ? getToothSrc(id, baseType) : null;
    const containerRef = useRef(null);
    const pressTimer = useRef(null);

    // Measure width on mount/update
    useLayoutEffect(() => {
        if (containerRef.current && onResize) {
            const { offsetWidth } = containerRef.current;
            onResize(id, offsetWidth);
        }
    }, [id, onResize, src, isCombined]); // Re-measure if src changes (loading different tooth)

    const shouldScale = TEETH_TO_SCALE.includes(id);

    // Check for "Permanent Molar in Deciduous Mode" (Positions 6, 7, 8)
    const isDeciduousMode = currentClinicalAction === 'deciduous' || currentClinicalAction === 'pulpotomy';
    const position = parseInt(id.toString()[1]);
    const isInvalidDeciduous = isDeciduousMode && position > 5;

    // Calculate display number based on type
    let displayNumber = getDisplayNumber(id, type);
    if (isInvalidDeciduous) {
        displayNumber = '–';
    }

    const isMaxillary = id < 30;
    const bracketPositionClass = isMaxillary ? 'top-[75%]' : 'top-[12%]';

    const handlePointerDown = (e) => {
        if (e.button !== 0 || isInvalidDeciduous) return; // Only left-click
        const rect = e.currentTarget.getBoundingClientRect();
        const x = rect.left + rect.width / 2;
        const y = rect.top + rect.height / 2;

        pressTimer.current = setTimeout(() => {
            if (onToothRightClick) {
                onToothRightClick(id, x, y);
            }
            pressTimer.current = null;
        }, 500);
    };

    const handlePointerUp = (e) => {
        if (e.button !== 0) return;
        if (pressTimer.current !== null) {
            clearTimeout(pressTimer.current);
            pressTimer.current = null;
            if (!isInvalidDeciduous && onToothClick) {
                onToothClick(id);
            }
        }
    };

    const handlePointerLeave = () => {
        if (pressTimer.current !== null) {
            clearTimeout(pressTimer.current);
            pressTimer.current = null;
        }
    };

    if (!src && !isCombined) {
        return (
            <div className="w-11 h-16 md:w-14 md:h-20 flex items-center justify-center bg-red-100 text-red-500 text-xs rounded border border-red-200">
                {id}?
            </div>
        );
    }

    const wrapperClasses = `flex flex-col items-center gap-2 group relative -mx-[2px] transition-all transform-gpu will-change-transform
        ${isInvalidDeciduous
            ? 'opacity-20 grayscale cursor-not-allowed'
            : `hover:z-20 ${isBracketMode ? 'cursor-pointer' : 'cursor-pointer'}`}`;

    const labelClasses = `text-[10px] md:text-xs font-bold transition-colors${isInvalidDeciduous
        ? 'text-slate-200 dark:text-slate-700'
        : (hasBracket ? 'text-blue-600 dark:text-blue-400' : 'text-slate-300 group-hover:text-slate-600 dark:group-hover:text-slate-200')
        }`;

    return (
        <div
            className={wrapperClasses}
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerLeave}
            onContextMenu={(e) => {
                e.preventDefault();
                if (isInvalidDeciduous || !onToothRightClick) return;
                const rect = e.currentTarget.getBoundingClientRect();
                const x = rect.left + rect.width / 2;
                const y = rect.top + rect.height / 2;
                onToothRightClick(id, x, y);
            }}
        >
            {/* Tooth Image Container - Reverted to auto width for natural aspect ratio centering */}
            <div
                ref={containerRef}
                className={`
                    relative h-40
                    flex items-end justify-center
                    transition-transform duration-300
                    ${!isInvalidDeciduous && (isBracketMode ? 'hover:scale-105' : 'hover:scale-105')}
                    z-10
                `}>
                <img
                    src={isCombined ? generateCombinedSvgDataUrl(id, activeTypes) : src}
                    alt={isCombined ? `Tooth Combined ${id}` : `Tooth ${id}`}
                    draggable={false}
                    className={`w-full h-full object-contain drop-shadow-sm transition-transform ${shouldScale ? 'scale-x-95' : ''}`}
                    onLoad={() => {
                        if (containerRef.current && onResize) {
                            onResize(id, containerRef.current.offsetWidth);
                        }
                    }}
                />

                {/* Bracket Overlay */}
                <AnimatePresence>
                    {hasBracket && !isInvalidDeciduous && (!hoveredPreviewType || !INACTIVE_TYPES.includes(hoveredPreviewType)) && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.5, y: -5 }}
                            animate={{ opacity: 1, scale: isSelectedBracket ? 1.02 : 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.5 }}
                            className={`absolute ${bracketPositionClass} left-1/2 -translate-x-1/2 z-20 pointer-events-none transition-transform duration-200 ${isSelectedBracket ? 'drop-shadow-[0_0_4px_rgba(59,130,246,0.6)]' : ''}`}
                        >
                            <img
                                src={
                                    BRACKET_HOOK_CONFIG.teethIds.includes(parseInt(id, 10))
                                        ? (isBroken ? bracketGanchoRotoImg : bracketGanchoImg)
                                        : (isBroken ? bracketRotoImg : bracketImg)
                                }
                                alt={isBroken ? "Bracket Roto" : "Bracket"}
                                className={`object-contain opacity-90 drop-shadow-sm transition-transform duration-200 ${BRACKET_HOOK_CONFIG.teethIds.includes(parseInt(id, 10)) ? BRACKET_HOOK_CONFIG.sizeClasses : BRACKET_HOOK_CONFIG.defaultSizeClasses} ${isSelectedBracket ? 'scale-125' : ''}`}
                                style={
                                    BRACKET_HOOK_CONFIG.teethIds.includes(parseInt(id, 10)) && BRACKET_HOOK_CONFIG.adjustments && BRACKET_HOOK_CONFIG.adjustments[id]
                                        ? {
                                            transform: `translate(${BRACKET_HOOK_CONFIG.adjustments[id].offsetX || 0}px, ${BRACKET_HOOK_CONFIG.adjustments[id].offsetY || 0}px) rotate(${BRACKET_HOOK_CONFIG.adjustments[id].rotate || 0}deg) scaleX(${BRACKET_HOOK_CONFIG.adjustments[id].scaleX || 1}) scaleY(${BRACKET_HOOK_CONFIG.adjustments[id].scaleY || 1}) ${isSelectedBracket ? 'scale(1.25)' : ''}`
                                        }
                                        : {}
                                }
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
            {/* Tooth Number Label */}
            <div className={`flex flex-col items-center leading-none select-none transition-opacity duration-300 ${hideLabel ? 'opacity-0' : 'opacity-100'}`}>
                <span className={labelClasses}>
                    {displayNumber}
                </span>
            </div>
        </div >
    );
}

// Interproximal Zone Component (Absolute Positioned)
function InterproximalZone({ t1, t2, hasTad, isTadMode, onClick, xPos, isUpper, pairId }) {
    const config = TAD_CUSTOM_CONFIG[pairId] || {};
    const scale = config.scale || 1;
    const offsetY = config.offsetY || 0;

    return (
        <div
            className="absolute z-30 flex flex-col items-center justify-end"
            style={{
                left: `calc(50% + ${xPos}px)`,
                transform: 'translateX(-50%)',
                bottom: 0,
                top: 0, // Fill height
                width: '2px'
            }}
        >
            {/* Hit box */}
            <div
                className={`absolute inset-y-0 -left-1.5 -right-1.5 z-40 transition-colors duration-200 
                ${isTadMode
                        ? 'cursor-pointer hover:bg-blue-400/30'
                        : 'pointer-events-none'
                    }
                `}
                onClick={() => isTadMode && onClick(t1, t2)}
                title={isTadMode ? `Colocar TAD entre ${t1} y ${t2}` : ''}
            />

            {/* TAD Visualization */}
            <AnimatePresence>
                {hasTad && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0 }}
                        className={`
                            absolute left-1/2 -translate-x-1/2 -translate-y-1/2
                            pointer-events-none flex items-center justify-center
                            w-4 md:w-3.5
                            ${isUpper ? 'top-[35%]' : 'bottom-[45%]'}
                        `}
                        style={{
                            scale: scale,
                            translateY: isUpper ? `${offsetY}px` : `${-offsetY}px`
                        }}
                    >
                        <img
                            src={tadImg}
                            alt="TAD"
                            className={`w-full h-auto drop-shadow-md opacity-90 ${!isUpper ? 'rotate-180' : ''}`}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// ==========================================
// 4. Layout Components (New Coordinate System)
// ==========================================

const getDynamicOffset = (
    id,
    toothStates,
    toothWidths,
    baseToothWidths
) => {
    if (TOOTH_COORDINATES[id] === undefined) return undefined;

    const type = toothStates[id];

    const adjustmentMap =
        type === 'deciduous' || type === 'pulpotomy'
            ? MICRO_ADJUSTMENTS_DECIDUOUS
            : MICRO_ADJUSTMENTS_PERMANENT;

    let base = TOOTH_COORDINATES[id] + (adjustmentMap[id] || 0);

    const quadrant = parseInt(String(id)[0], 10);
    const targetCoord = TOOTH_COORDINATES[id];

    let accumulatedDelta = 0;

    for (let i = 1; i <= 8; i++) {
        const currentId = parseInt(`${quadrant}${i}`, 10);
        const currentType = toothStates[currentId];

        if (currentType !== 'deciduous' && currentType !== 'pulpotomy') continue;

        const permanentWidth = baseToothWidths[currentId];
        const deciduousWidth = toothWidths[currentId] || permanentWidth;

        if (!permanentWidth) continue;

        const delta = deciduousWidth - permanentWidth;
        if (delta <= 0) continue;

        const currentCoord = TOOTH_COORDINATES[currentId];

        const isMesial =
            (quadrant === 1 || quadrant === 4)
                ? currentCoord > targetCoord
                : currentCoord < targetCoord;

        if (isMesial) {
            accumulatedDelta += delta;
        }
    }

    if (accumulatedDelta !== 0) {
        if (quadrant === 1 || quadrant === 4) {
            base -= accumulatedDelta;
        } else {
            base += accumulatedDelta;
        }
    }

    return base;
};

function ArchRow({ activeRadialTooth, teethIds, toothStates, brackets, bracketWires, tadWires, selectedBracket, tads, periodontalData, isBracketMode, isTadMode, isPeriodontalMode, periodontalUpperY, periodontalLowerY, periodontalUpperThickness, periodontalLowerThickness, onToothClick, onToothRightClick, onTadClick, currentClinicalAction, onToothResize, toothWidths, baseToothWidths, isUpper, hoveredPreviewType }) {
    // Generate TAD slots based on teeth list
    // Iterate through pairable teeth (e.g. 18-17, 17-16...)
    // Since teethIds includes both Left and Right, we need to be careful not to create a TAD across the midline (11-21) if not desired.
    // Usually TADs are interproximal within a quadrant.
    // We will assume TADs exist between any adjacent indices in the provided list, EXCEPT if gap is too large (like midline).
    // Actually, midline TADS are possible.

    const renderTads = () => {
        const tadElements = [];

        for (let i = 0; i < teethIds.length - 1; i++) {
            const t1 = teethIds[i];
            const t2 = teethIds[i + 1];

            const quadrant1 = parseInt(String(t1)[0]);
            const quadrant2 = parseInt(String(t2)[0]);

            const pos1 = parseInt(String(t1)[1]);
            const pos2 = parseInt(String(t2)[1]);

            // -----------------------------
            // 1️⃣ Deben ser del mismo cuadrante
            // -----------------------------
            if (quadrant1 !== quadrant2) continue;

            // -----------------------------
            // 2️⃣ No permitir línea media
            // (11-21 y 31-41)
            // -----------------------------
            const pairKey = `${t1}-${t2}`;
            if (pairKey === "11-21" || pairKey === "21-11" ||
                pairKey === "31-41" || pairKey === "41-31") {
                continue;
            }


            // -----------------------------
            // 3️⃣ No después del tercer molar
            // (si alguno es posición 8)
            // -----------------------------
            if (pos1 === 8 || pos2 === 8) continue;

            // -----------------------------
            // Si pasó todas las reglas → permitido
            // -----------------------------

            const pairId = [t1, t2].sort((a, b) => a - b).join('-');
            const hasTad = !!tads[pairId];

            const x1 = getDynamicOffset(t1, toothStates, toothWidths, baseToothWidths);
            const x2 = getDynamicOffset(t2, toothStates, toothWidths, baseToothWidths);

            if (x1 === undefined || x2 === undefined) continue;

            const baseMidX = (x1 + x2) / 2;

            const adjustment = TAD_MICRO_ADJUSTMENTS[pairId] || 0;

            const midX = baseMidX + adjustment;

            tadElements.push(
                <InterproximalZone
                    key={`tad-${pairId}`}
                    t1={t1}
                    t2={t2}
                    hasTad={hasTad}
                    isTadMode={isTadMode}
                    onClick={onTadClick}
                    xPos={midX}
                    isUpper={isUpper}
                    pairId={pairId}
                />
            );
        }

        return tadElements;
    };

    const renderWires = () => {
        const hasSolidWires = bracketWires && Object.keys(bracketWires).length > 0;
        const hasDashedWires = tadWires && Object.keys(tadWires).length > 0;

        if (!hasSolidWires && !hasDashedWires) return null;

        const solidWiresToRender = [];
        if (hasSolidWires) {
            Object.keys(bracketWires).forEach(pairId => {
                const [t1Str, t2Str] = pairId.split('-');
                const t1 = parseInt(t1Str, 10);
                const t2 = parseInt(t2Str, 10);

                if (teethIds.includes(t1) && teethIds.includes(t2)) {
                    const x1 = getDynamicOffset(t1, toothStates, toothWidths, baseToothWidths);
                    const x2 = getDynamicOffset(t2, toothStates, toothWidths, baseToothWidths);

                    if (x1 !== undefined && x2 !== undefined) {
                        solidWiresToRender.push({ pairId, x1, x2 });
                    }
                }
            });
        }

        const dashedWiresToRender = [];
        if (hasDashedWires) {
            Object.keys(tadWires).forEach(connectionId => {
                const [bracketIdStr, tadIdStr] = connectionId.split('|');
                const bracketId = parseInt(bracketIdStr, 10);

                // Only render if the bracket is in THIS arch (to avoid massive cross-arch lines originating from the wrong SVG)
                if (teethIds.includes(bracketId)) {
                    const [tadT1Str, tadT2Str] = tadIdStr.split('-');
                    const tadT1 = parseInt(tadT1Str, 10);
                    const tadT2 = parseInt(tadT2Str, 10);

                    const bracketX = getDynamicOffset(bracketId, toothStates, toothWidths, baseToothWidths);

                    const tadX1 = getDynamicOffset(tadT1, toothStates, toothWidths, baseToothWidths);
                    const tadX2 = getDynamicOffset(tadT2, toothStates, toothWidths, baseToothWidths);

                    if (bracketX !== undefined && tadX1 !== undefined && tadX2 !== undefined) {
                        const baseMidX = (tadX1 + tadX2) / 2;
                        const adjustment = TAD_MICRO_ADJUSTMENTS[tadIdStr] || 0;
                        const tadX = baseMidX + adjustment;

                        // Default logic: we assume the bracket is in this arch.
                        // If the TAD is in the opposing arch, the Y coordinate needs to "shoot out" of the SVG to reach it.
                        const isTadUpper = UPPER_ARCH_IDS.includes(tadT1);

                        dashedWiresToRender.push({ connectionId, bracketX, tadX, isTadUpper });
                    }
                }
            });
        }

        if (solidWiresToRender.length === 0 && dashedWiresToRender.length === 0) return null;

        return (
            <svg className="absolute inset-0 z-[15] pointer-events-none w-full h-full overflow-visible">
                {/* Solid wires between brackets are disabled as requested */}
                {/* 
                {solidWiresToRender.map(({ pairId, x1, x2 }) => {
                    const y = isUpper ? 138 : 28;
                    const cX1 = `calc(50% + ${x1}px)`;
                    const cX2 = `calc(50% + ${x2}px)`;

                    return (
                        <line
                            key={`solid-${pairId}`}
                            x1={cX1}
                            y1={y}
                            x2={cX2}
                            y2={y}
                            stroke="#333"
                            strokeWidth="2"
                            strokeLinecap="round"
                        />
                    );
                })} 
                */}

                {dashedWiresToRender.map(({ connectionId, bracketX, tadX, isTadUpper }) => {
                    const bY = isUpper ? 138 : 28;

                    let tY;
                    if (isUpper && isTadUpper) {           // Upper bracket to Upper TAD
                        tY = 67;
                    } else if (!isUpper && !isTadUpper) {  // Lower bracket to Lower TAD
                        tY = 105;
                    } else if (isUpper && !isTadUpper) {   // Upper bracket to Lower TAD
                        tY = 393;
                    } else {                               // Lower bracket to Upper TAD
                        tY = -221;
                    }

                    const cX1 = `calc(50% + ${bracketX}px)`;
                    const cX2 = `calc(50% + ${tadX}px)`;

                    return (
                        <line
                            key={`dashed-${connectionId}`}
                            x1={cX1}
                            y1={bY}
                            x2={cX2}
                            y2={tY}
                            stroke="#333"
                            strokeWidth="2"
                            strokeDasharray="4,4"
                            strokeLinecap="round"
                        />
                    );
                })}
            </svg>
        );
    };

    return (
        <div className={`relative w-full ${isUpper ? 'h-48 flex items-end' : 'h-48 flex items-start'} mb-1`}>
            {renderWires()}
            {/* Periodontal Visual Band - Single continuous band */}
            <AnimatePresence>
                {isPeriodontalMode && (
                    <motion.div
                        initial={{ opacity: 0, scaleY: 0 }}
                        animate={{ opacity: 1, scaleY: 1 }}
                        exit={{ opacity: 0, scaleY: 0 }}
                        className={`absolute left-1/2 -translate-x-1/2 bg-red-500/50 rounded-full z-0 blur-[4px] pointer-events-none origin-${isUpper ? 'bottom' : 'top'}`}
                        style={{
                            width: '820px',
                            height: `${isUpper ? periodontalUpperThickness : periodontalLowerThickness}px`,
                            bottom: isUpper ? `${periodontalUpperY}px` : 'auto',
                            top: !isUpper ? `${periodontalLowerY}px` : 'auto',
                        }}
                    />
                )}
            </AnimatePresence>

            {/* Render Tooth Slots */}
            {teethIds.map(id => {
                let xPos = getDynamicOffset(
                    id,
                    toothStates,
                    toothWidths,
                    baseToothWidths
                );
                if (xPos === undefined) return null; // Should not happen

                let typeOffsetX = 0;
                let typeOffsetY = 0;
                if (activeRadialTooth === id) {
                    const activeType = toothStates[id] || 'original';
                    const customSize = RADIAL_MENU_CUSTOM_SIZES[id];
                    const tOffset = customSize?.typeOffsets?.[activeType];
                    if (tOffset) {
                        typeOffsetX = tOffset.offsetX || 0;
                        typeOffsetY = tOffset.offsetY || 0;
                    }
                }

                return (
                    <div
                        key={id}
                        className={`absolute ${activeRadialTooth === id ? 'z-[100] opacity-0 pointer-events-none' : 'z-10 transition-all duration-300'}`}
                        style={{
                            left: `calc(50% + ${xPos}px)`,
                            transform: typeOffsetX !== 0 || typeOffsetY !== 0
                                ? `translate(calc(-50% + ${typeOffsetX}px), ${typeOffsetY}px)`
                                : 'translateX(-50%)',
                            bottom: isUpper ? 0 : 'auto',
                            top: isUpper ? 'auto' : 0,
                        }}
                    >
                        {isPeriodontalMode && periodontalData && periodontalData[id] && (
                            <PeriodontalOverlay data={periodontalData[id]} isUpper={isUpper} toothId={id} />
                        )}
                        <Tooth
                            id={id}
                            type={toothStates[id]}
                            hasBracket={!!brackets[id]}
                            isBroken={!!brackets[id]?.isBroken}
                            isSelectedBracket={selectedBracket === id}
                            isBracketMode={isBracketMode}
                            onToothClick={isTadMode ? () => { } : onToothClick}
                            onToothRightClick={isTadMode ? undefined : onToothRightClick}
                            currentClinicalAction={currentClinicalAction}
                            onResize={onToothResize}
                            hideLabel={activeRadialTooth === id}
                            hoveredPreviewType={activeRadialTooth === id ? hoveredPreviewType : null}
                        />

                    </div>
                );
            })}

            {/* Render TADs */}
            {renderTads()}
        </div>
    );
}

function OcclusalArchRow({
    activeRadialTooth,
    teethIds,
    surfaceStates,
    toothStates,
    onSurfaceClick,
    toothWidths,
    baseToothWidths,
    isUpper
}) {
    return (
        <div className="relative w-full h-12 mb-0">
            {teethIds.map(id => {

                const xPos = getDynamicOffset(
                    id,
                    toothStates,
                    toothWidths,
                    baseToothWidths
                );

                if (xPos === undefined) return null;

                const isInactiveTooth = INACTIVE_TYPES.includes(toothStates[id]);
                const status = isInactiveTooth
                    ? null
                    : (surfaceStates[id] || {});

                let colorScheme = 'neutral';
                const currentStatus = surfaceStates[id];

                if (currentStatus) {
                    const states = Object.values(currentStatus);
                    if (states.includes('restoration')) colorScheme = 'green';
                    else if (states.includes('caries')) colorScheme = 'brown';
                    else if (states.includes('fracture')) colorScheme = 'yellow';
                }

                const OCCLUSAL_FIXED_SIZE = 35; // Ajusta visualmente si quieres
                const occlusalSize = OCCLUSAL_FIXED_SIZE;

                const typeString = toothStates[id] || 'original';
                const activeTypes = typeString === 'implant-crown' ? ['implant', 'crown'] : typeString.split('+');
                const isCrown = activeTypes.includes('crown');

                return (
                    <div
                        key={id}
                        className={`absolute origin-center z-10 transition-all duration-300`}
                        style={{
                            left: `calc(50% + ${xPos}px)`,
                            transform: 'translateX(-50%)',
                            top: isUpper ? '10px' : 'auto',
                            bottom: isUpper ? 'auto' : '10px'
                        }}
                    >
                        <div className={`relative ${isInactiveTooth ? 'pointer-events-none opacity-90' : ''}`}>
                            <SingleTooth
                                id={id}
                                pediatricId={getPediatricId(id)}
                                status={status}
                                selectedMode="treatment"
                                onClick={(toothId, area) => {
                                    if (isInactiveTooth || isCrown) return;
                                    onSurfaceClick(toothId, area);
                                }}
                                showLabels={false}
                                strokeColor="#000000"
                                size={occlusalSize}
                                colorScheme={colorScheme}
                                paintMode="clinical"
                                isCrown={isCrown}
                            />

                            {isInactiveTooth && (
                                <div className="absolute inset-0 flex items-center justify-center bg-slate-500/80 dark:bg-slate-900/80 rounded-full z-20 select-none">
                                    <span className="text-[10px] font-bold text-red-500 uppercase tracking-wide rotate-[-30deg]">
                                        {toothStates[id] === 'extraction' && 'EXT'}
                                        {toothStates[id] === 'missing' && 'MISS'}
                                        {toothStates[id] === 'unerupted' && 'UNER'}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

// ==========================================
// 5. Support Components (Summary, Actions, Modal)
// ==========================================

// Periodontal Overlay Component
function PeriodontalOverlay({ data, isUpper, toothId }) {
    if (!data || !toothId) return null;

    // Helper to build default config
    const buildConfig = (sLeft, sRight, stLeft, stRight) => ({
        shadowVestibularY: isUpper ? 'top-[45%]' : 'bottom-[45%]',
        shadowLingualY: isUpper ? 'top-[20%]' : 'bottom-[20%]',
        siteVestibularY: isUpper ? 'bottom-[45%]' : 'bottom-[45%]',
        siteLingualY: isUpper ? 'bottom-[20%]' : 'bottom-[20%]',
        shadowLeft: sLeft,
        shadowRight: sRight,
        siteLeft: stLeft,
        siteRight: stRight,
    });

    const toothPositionConfig = {
        // --- MAXILAR (SUPERIOR) ---
        // Cuadrante 1 (18-11)
        18: buildConfig('left-[22%]', 'right-[22%]', 'left-[12%]', 'right-[12%]'),
        17: buildConfig('left-[22%]', 'right-[22%]', 'left-[12%]', 'right-[12%]'),
        16: buildConfig('left-[22%]', 'right-[22%]', 'left-[12%]', 'right-[12%]'),
        15: buildConfig('left-[20%]', 'right-[20%]', 'left-[-5%]', 'right-[-5%]'),
        14: buildConfig('left-[20%]', 'right-[20%]', 'left-[-5%]', 'right-[-5%]'),
        13: buildConfig('left-[15%]', 'right-[15%]', 'left-[-2%]', 'right-[1%]'),
        12: buildConfig('left-[15%]', 'right-[10%]', 'left-[-11%]', 'right-[-11%]'),
        11: buildConfig('left-[15%]', 'right-[10%]', 'left-[0%]', 'right-[0%]'),

        // Cuadrante 2 (21-28)
        21: buildConfig('left-[15%]', 'right-[10%]', 'left-[0%]', 'right-[0%]'),
        22: buildConfig('left-[15%]', 'right-[10%]', 'left-[-11%]', 'right-[-11%]'),
        23: buildConfig('left-[15%]', 'right-[15%]', 'left-[-2%]', 'right-[-1%]'),
        24: buildConfig('left-[20%]', 'right-[20%]', 'left-[-5%]', 'right-[-5%]'),
        25: buildConfig('left-[20%]', 'right-[20%]', 'left-[-5%]', 'right-[-5%]'),
        26: buildConfig('left-[22%]', 'right-[22%]', 'left-[12%]', 'right-[12%]'),
        27: buildConfig('left-[22%]', 'right-[22%]', 'left-[12%]', 'right-[12%]'),
        28: buildConfig('left-[22%]', 'right-[22%]', 'left-[12%]', 'right-[12%]'),

        // --- MANDÍBULA (INFERIOR) ---
        // Cuadrante 4 (48-41)
        48: buildConfig('left-[22%]', 'right-[22%]', 'left-[12%]', 'right-[12%]'),
        47: buildConfig('left-[22%]', 'right-[22%]', 'left-[12%]', 'right-[12%]'),
        46: buildConfig('left-[22%]', 'right-[22%]', 'left-[12%]', 'right-[12%]'),
        45: buildConfig('left-[20%]', 'right-[20%]', 'left-[-5%]', 'right-[-5%]'),
        44: buildConfig('left-[20%]', 'right-[20%]', 'left-[-2%]', 'right-[-2%]'),
        43: buildConfig('left-[15%]', 'right-[15%]', 'left-[-2%]', 'right-[-2%]'),
        42: buildConfig('left-[15%]', 'right-[10%]', 'left-[-9%]', 'right-[-9%]'),
        41: buildConfig('left-[15%]', 'right-[10%]', 'left-[-8%]', 'right-[-8%]'),

        // Cuadrante 3 (31-38)
        31: buildConfig('left-[15%]', 'right-[10%]', 'left-[-8%]', 'right-[-8%]'),
        32: buildConfig('left-[15%]', 'right-[10%]', 'left-[-9%]', 'right-[-9%]'),
        33: buildConfig('left-[15%]', 'right-[15%]', 'left-[-2%]', 'right-[-2%]'),
        34: buildConfig('left-[20%]', 'right-[20%]', 'left-[-2%]', 'right-[-2%]'),
        35: buildConfig('left-[20%]', 'right-[20%]', 'left-[-5%]', 'right-[-5%]'),
        36: buildConfig('left-[22%]', 'right-[22%]', 'left-[12%]', 'right-[12%]'),
        37: buildConfig('left-[22%]', 'right-[22%]', 'left-[12%]', 'right-[12%]'),
        38: buildConfig('left-[22%]', 'right-[22%]', 'left-[12%]', 'right-[12%]'),
    };

    // Default general molars configs for fallback (like for baby teeth)
    const config = toothPositionConfig[toothId] || buildConfig('left-[22%]', 'right-[22%]', 'left-[12%]', 'right-[12%]');


    const renderSite = (siteData, positionClasses) => {
        if (!siteData) return null;
        const { ps, bop } = siteData;
        const isPathological = ps >= 4;
        const isSevere = ps >= 7;

        if (!isPathological && !bop) return null;

        return (
            <div className={`absolute flex flex-col items-center justify-center ${positionClasses} z-40 pointer-events-none`}>
                {isPathological && (
                    <span className={`text-[8px] md:text-[8px] font-bold leading-none ${isSevere ? 'text-white bg-red-700' : 'text-red-700 bg-white/90'} rounded px-[1px] py-[1px] shadow-sm`}>
                        {ps}
                    </span>
                )}
                {bop && (
                    <div className="w-2 h-2 md:w-2.5 md:h-2.5 bg-red-600 rounded-full mt-0.5 shadow-sm shadow-red-500/50 border border-white" title="Sangrado (BOP)" />
                )}
            </div>
        );
    };

    const renderShadow = (siteData, positionClasses) => {
        if (!siteData) return null;
        const { ps } = siteData;
        if (ps < 4) return null;
        const isSevere = ps >= 7;
        const color = isSevere ? 'bg-indigo-600/50 shadow-[0_0_8px_3px_rgba(79,70,229,0.5)] border border-red-500/50' : 'bg-blue-400/50 shadow-[0_0_6px_2px_rgba(96,165,250,0.5)]';
        return <div className={`absolute ${positionClasses} w-3.5 h-6 ${color} blur-[1px] rounded-full`} />;
    };

    return (
        <div className="absolute inset-x-0 z-30 pointer-events-none flex justify-center w-full" style={{ top: isUpper ? '10%' : '10%', bottom: isUpper ? '20%' : '20%' }}>
            <div className={`relative w-full h-full max-w-[60px] ${isUpper ? 'rotate-180' : ''}`}>
                {/* Vestibular Shadows */}
                {renderShadow(data.MV, `${config.shadowVestibularY} ${config.shadowLeft}`)}
                {renderShadow(data.V, `${config.shadowVestibularY} left-1/2 -translate-x-1/2`)}
                {renderShadow(data.DV, `${config.shadowVestibularY} ${config.shadowRight}`)}

                {/* Lingual Shadows */}
                {renderShadow(data.ML, `${config.shadowLingualY} ${config.shadowLeft}`)}
                {renderShadow(data.L, `${config.shadowLingualY} left-1/2 -translate-x-1/2`)}
                {renderShadow(data.DL, `${config.shadowLingualY} ${config.shadowRight}`)}

                {/* Vestibular Values (Rotate back so text is upright) */}
                <div className={`absolute inset-0 ${isUpper ? 'rotate-180' : ''}`}>
                    {renderSite(data.MV, `${config.siteVestibularY} ${isUpper ? config.siteRight : config.siteLeft}`)}
                    {renderSite(data.V, `${config.siteVestibularY} left-1/2 -translate-x-1/2`)}
                    {renderSite(data.DV, `${config.siteVestibularY} ${isUpper ? config.siteLeft : config.siteRight}`)}

                    {/* Lingual Values */}
                    {renderSite(data.ML, `${config.siteLingualY} ${isUpper ? config.siteRight : config.siteLeft}`)}
                    {renderSite(data.L, `${config.siteLingualY} left-1/2 -translate-x-1/2`)}
                    {renderSite(data.DL, `${config.siteLingualY} ${isUpper ? config.siteLeft : config.siteRight}`)}
                </div>
            </div>
        </div>
    );
}

// Periodontal Modal
function PeriodontalModal({ isOpen, onClose, onSave, toothId, initialData }) {
    const defaultSite = { ps: '', rg: '', bop: false, cal: '' };
    const [data, setData] = useState(initialData || {
        MV: { ...defaultSite },
        V: { ...defaultSite },
        DV: { ...defaultSite },
        ML: { ...defaultSite },
        L: { ...defaultSite },
        DL: { ...defaultSite }
    });
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        if (isOpen) {
            setData(initialData || {
                MV: { ...defaultSite },
                V: { ...defaultSite },
                DV: { ...defaultSite },
                ML: { ...defaultSite },
                L: { ...defaultSite },
                DL: { ...defaultSite }
            });
        }
    }, [isOpen, initialData]);

    if (!isOpen || !toothId) return null;

    const handleSiteChange = (site, field, value) => {
        let finalValue = value;
        if (field === 'ps' && value !== '') {
            const numVal = Number(value);
            if (numVal > 15) {
                finalValue = '15';
                setErrorMsg('La Profundidad de Sondaje (PS) máxima permitida es 15 mm.');
                setTimeout(() => setErrorMsg(''), 3000);
            } else if (numVal < 0) {
                finalValue = '0';
            }
        }

        setData(prev => {
            const currentSite = prev[site] || { ...defaultSite };
            const updatedSite = { ...currentSite, [field]: finalValue };

            // Auto-calculate CAL
            const psVal = field === 'ps' ? (finalValue === '' ? 0 : Number(finalValue)) : (Number(updatedSite.ps) || 0);
            const rgVal = field === 'rg' ? (finalValue === '' ? 0 : Number(finalValue)) : (Number(updatedSite.rg) || 0);
            updatedSite.cal = psVal + rgVal;

            return { ...prev, [site]: updatedSite };
        });
    };

    const handleSave = () => {
        console.log('toothId', toothId, 'data', JSON.stringify(data));
        const cleanedData = {};
        for (const site in data) {
            cleanedData[site] = {
                ps: data[site].ps === '' ? 0 : Number(data[site].ps),
                rg: data[site].rg === '' ? 0 : Number(data[site].rg),
                bop: data[site].bop || false,
                cal: data[site].cal === '' ? 0 : Number(data[site].cal)
            };
        }
        onSave(toothId, cleanedData);
        onClose();
    };

    const renderSiteInputs = (site, label) => (
        <div className="flex flex-col gap-1 p-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800/50 shadow-sm transition-colors hover:border-blue-300 dark:hover:border-blue-700">
            <span className="text-xs font-bold text-center text-slate-700 dark:text-slate-300 mb-1">{label}</span>
            <div className="flex items-center justify-between gap-2">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 w-6">PS:</label>
                <input type="number" min="0" max="15" className="input input-xs w-14 text-center border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-blue-500" value={data[site]?.ps ?? ''} onChange={e => handleSiteChange(site, 'ps', e.target.value)} placeholder="0" />
            </div>

            <div className="flex items-center justify-between gap-2 mt-2">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 cursor-pointer flex-1 select-none" onClick={() => handleSiteChange(site, 'bop', !(data[site]?.bop))}>Sangrado (BOP):</label>
                <input type="checkbox" className="checkbox checkbox-xs checkbox-error rounded-sm border-2" checked={data[site]?.bop || false} onChange={e => handleSiteChange(site, 'bop', e.target.checked)} />
            </div>
            <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-600 flex justify-between items-center">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">CAL:</span>
                <span className={`text-sm font-bold ${(data[site]?.ps || 0) >= 4 ? 'text-red-500' : 'text-slate-700 dark:text-slate-200'}`}>{data[site]?.ps || 0} mm</span>
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-3xl w-full p-0 overflow-hidden"
            >
                <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/80">
                    <div>
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                            <span className="w-8 h-8 rounded-full bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 flex items-center justify-center text-sm">
                                {toothId}
                            </span>
                            Registro Periodontal
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Registra profundidad de sondaje, recesión gingival y sangrado.</p>
                    </div>
                    <button onClick={onClose} className="btn btn-sm btn-circle btn-ghost text-slate-500 hover:text-slate-800 dark:hover:text-slate-200">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Vestibular */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="h-px bg-blue-200 dark:bg-blue-800 flex-1"></div>
                            <h4 className="font-bold text-sm text-blue-700 dark:text-blue-400 uppercase tracking-wider">Vestibular</h4>
                            <div className="h-px bg-blue-200 dark:bg-blue-800 flex-1"></div>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                            {renderSiteInputs('MV', 'Mesio')}
                            {renderSiteInputs('V', 'Medio')}
                            {renderSiteInputs('DV', 'Disto')}
                        </div>
                    </div>

                    {/* Lingual/Palatino */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="h-px bg-indigo-200 dark:bg-indigo-800 flex-1"></div>
                            <h4 className="font-bold text-sm text-indigo-700 dark:text-indigo-400 uppercase tracking-wider">Lingual / Palatino</h4>
                            <div className="h-px bg-indigo-200 dark:bg-indigo-800 flex-1"></div>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                            {renderSiteInputs('ML', 'Mesio')}
                            {renderSiteInputs('L', 'Medio')}
                            {renderSiteInputs('DL', 'Disto')}
                        </div>
                    </div>
                </div>

                <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center gap-3">
                    <div className="flex-1">
                        <AnimatePresence>
                            {errorMsg && (
                                <motion.div
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                    className="text-xs font-semibold text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 px-3 py-1.5 rounded flex items-center gap-2"
                                >
                                    <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                    {errorMsg}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                    <div className="flex gap-3">
                        <button type="button" onClick={onClose} className="btn btn-ghost border border-slate-300 dark:border-slate-600">Cancelar</button>
                        <button type="button" onClick={handleSave} className="btn btn-primary bg-blue-600 hover:bg-blue-700 border-none shadow-md shadow-blue-500/30">
                            Guardar Datos
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

function ClinicalActionModal({ isOpen, onClose, onSelect }) {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-lg w-full p-6"
            >
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">
                    Seleccionar Tratamiento
                </h3>

                <div className="grid grid-cols-2 gap-3 mb-6">
                    {/* Render Occlusal Types */}
                    {OCCLUSAL_TYPES.map(type => (
                        <button
                            key={type.id}
                            onClick={() => onSelect(type.id)}
                            className={`p-3 rounded-lg border hover:shadow-md transition-all text-sm flex items-center gap-2 font-medium 
                                ${type.id === 'normal'
                                    ? 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-400'
                                    : `${type.color} hover:brightness-95`
                                }`}
                        >
                            <div className={`w-3 h-3 rounded-full ${type.id === 'normal' ? 'bg-slate-400' : 'bg-current opacity-50'}`}></div>
                            {type.label}
                        </button>
                    ))}
                </div>

                <div className="flex justify-end">
                    <button
                        type="button"
                        onClick={onClose}
                        className="btn btn-sm btn-ghost"
                    >
                        Cancelar
                    </button>
                </div>
            </motion.div >
        </div >
    );
}

function DentalSummary({ toothStates }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const stats = DENTAL_TYPES.map(type => {
        const count = Object.values(toothStates).filter(t => {
            if (t === type.id) return true;
            if (t === 'implant-crown' && (type.id === 'implant' || type.id === 'crown')) return true;
            return false;
        }).length;
        return { ...type, count };
    });
    const visibleStats = isExpanded ? stats : stats.filter(s => s.count > 0);

    return (
        <div className="bg-white dark:bg-[var(--color-secondary)] rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden transition-all duration-300">
            <div className="p-4 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                <AnimatePresence initial={false}>
                    {visibleStats.map(stat => (
                        <motion.div
                            key={stat.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            layout
                            className={`p-3 rounded-lg border border-transparent ${stat.color} flex flex-col items-center justify-center text-center`}
                        >
                            <span className="text-2xl font-bold leading-none mb-1">{stat.count}</span>
                            <span className="text-[10px] font-bold uppercase tracking-wider opacity-90 leading-tight">{stat.label}</span>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/50 px-4 py-2 flex justify-center border-t border-slate-100 dark:border-slate-700/50">
                <button
                    type="button"
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="text-xs font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors flex items-center gap-1 focus:outline-none"
                >
                    {isExpanded ? 'Ver menos' : 'Ver resumen completo'}
                    <svg className={`w-3 h-3 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </button>
            </div>
        </div>
    );
}

function ModeCheckbox({ checked, onChange, label, color = 'blue' }) {
    const colors = {
        blue: { active: 'bg-blue-500 border-blue-500 shadow-blue-500/25', bg: 'bg-blue-500' },
        sky: { active: 'bg-sky-500 border-sky-500 shadow-sky-500/25', bg: 'bg-sky-500' },
        red: { active: 'bg-red-500 border-red-500 shadow-red-500/25', bg: 'bg-red-500' }
    };
    const theme = colors[color] || colors.blue;

    return (
        <label className="group flex items-center gap-3 cursor-pointer select-none relative px-3 py-2 rounded-xl transition-all duration-300 hover:bg-slate-50 dark:hover:bg-slate-800/50">
            <input type="checkbox" className="peer sr-only" checked={checked} onChange={onChange} />
            <div className={`
                w-5 h-5 md:w-6 md:h-6 rounded-[6px] border-[2px] flex items-center justify-center transition-all duration-300 ease-out shadow-sm
                ${checked
                    ? `${theme.active} scale-100`
                    : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 group-hover:border-slate-400 dark:group-hover:border-slate-500'
                }
            `}>
                <svg className={`w-3.5 h-3.5 md:w-4 md:h-4 text-white transform transition-all duration-300 ease-spring ${checked ? 'scale-100 opacity-100 rotate-0' : 'scale-50 opacity-0 -rotate-90'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 13l4 4L19 7" />
                </svg>
            </div>
            <span className={`text-sm font-semibold transition-colors duration-200 ${checked ? 'text-slate-800 dark:text-slate-100' : 'text-slate-600 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-300'}`}>
                {label}
            </span>
            {checked && (<div className={`absolute inset-0 rounded-xl opacity-10 pointer-events-none ${theme.bg}`} />)}
        </label>
    );
}

function ActionPanel({
    isBracketMode, setBracketMode,
    isTadMode, setTadMode,
    isPeriodontalMode, setPeriodontalMode,
    onApplyAll, selectedToothType, setSelectedToothType, onReset,
    onOpenVoiceSettings, hasVoiceSupport,
    onSaveToElastics, savedToElastics
}) {
    const [hoveredAction, setHoveredAction] = useState(null);

    return (
        <div className="bg-white dark:bg-[var(--color-secondary)] p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm mt-6 flex flex-col md:flex-row items-center justify-between gap-4">
            {/* General Actions */}
            <div className="flex items-center gap-4 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
                <label className="text-sm font-medium text-slate-600 dark:text-slate-300 whitespace-nowrap hidden md:block">
                    Acción Clínica:
                </label>
                <select
                    className="input input-sm md:input-md w-full md:w-48 border-slate-300 dark:border-slate-600"
                    disabled={isBracketMode || isTadMode || isPeriodontalMode}
                    value={selectedToothType}
                    onChange={(e) => setSelectedToothType(e.target.value)}
                >
                    {DENTAL_TYPES.filter(t => t.id !== 'extraction').map(t => (
                        <option key={t.id} value={t.id}>{t.label}</option>
                    ))}
                </select>
                <button
                    type="button"
                    className="btn btn-primary btn-sm md:btn-md shadow-sm"
                    disabled={isBracketMode || isTadMode || isPeriodontalMode}
                >
                    Aplicar
                </button>

                <div className="relative">
                    <button
                        type="button"
                        onClick={() => {
                            console.log("[DEBUG] Reset button clicked");
                            onReset();
                        }}
                        onMouseEnter={() => setHoveredAction('reset')}
                        onMouseLeave={() => setHoveredAction(null)}
                        className="btn btn-sm md:btn-md bg-white dark:bg-slate-700 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 hover:text-red-600 border border-slate-200 dark:border-slate-600 shadow-sm transition-colors whitespace-nowrap"
                    >
                        Limpiar odontograma
                    </button>
                    <AnimatePresence>
                        {hoveredAction === 'reset' && (
                            <motion.div
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 5 }}
                                className="
                                    absolute bottom-full left-1/2 -translate-x-1/2 mb-2
                                    px-2 py-1 rounded text-[10px] font-medium
                                    bg-red-600 text-white shadow-xl whitespace-nowrap
                                    z-50
                                "
                            >
                                Limpiar todo el odontograma
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
            <div className="hidden md:block w-px h-8 bg-slate-400 dark:bg-slate-700 mx-1"></div>
            <div className="flex items-center gap-2 md:gap-4 w-full md:w-auto justify-between md:justify-end flex-wrap md:flex-wrap lg:flex-nowrap">
                {/* Botón guardar diseño para Elásticos y persistencia general */}
                <div className="relative">
                    <button
                        type="button"
                        onClick={onSaveToElastics}
                        onMouseEnter={() => setHoveredAction('save')}
                        onMouseLeave={() => setHoveredAction(null)}
                        className="btn btn-sm md:btn-md bg-white dark:bg-slate-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-700 shadow-sm transition-colors whitespace-nowrap flex items-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                        </svg>
                        Guardar Odontograma
                    </button>
                    {/* Feedback de guardado exitoso */}
                    {savedToElastics && (
                        <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/50 border border-emerald-200 dark:border-emerald-700 rounded px-2 py-0.5 whitespace-nowrap shadow-sm animate-bounce">
                            ✓ ¡Guardado!
                        </span>
                    )}
                    <AnimatePresence>
                        {hoveredAction === 'save' && (
                            <motion.div
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 5 }}
                                className="
                                    absolute bottom-full left-1/2 -translate-x-1/2 mb-2
                                    px-2 py-1 rounded text-[10px] font-medium
                                    bg-slate-800 text-white shadow-xl whitespace-nowrap
                                    z-50
                                "
                            >
                                Guardar diseño actual del odontograma para este paciente
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {hasVoiceSupport && (
                    <div className="relative">
                        <button
                            type="button"
                            onClick={onOpenVoiceSettings}
                            onMouseEnter={() => setHoveredAction('voice')}
                            onMouseLeave={() => setHoveredAction(null)}
                            className="btn btn-sm md:btn-md bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600/80 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600 shadow-sm transition-colors whitespace-nowrap flex items-center gap-2"
                        >
                            <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                            </svg>
                            Ajustes de Voz
                        </button>
                        <AnimatePresence>
                            {hoveredAction === 'voice' && (
                                <motion.div
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 5 }}
                                    className="
                                        absolute bottom-full left-1/2 -translate-x-1/2 mb-2
                                        px-2 py-1 rounded text-[10px] font-medium
                                        bg-slate-800 text-white shadow-xl whitespace-nowrap
                                        z-50
                                    "
                                >
                                    Configuración de Voz
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </div>
    );
}


// ==========================================
// 6. Main Component
// ==========================================

export default function OdontogramSection() {
    // Obtener ID del paciente actual para aislar los datos en localStorage
    const { id: patientId } = useParams();

    // Initial State: All teeth are 'original'
    const [toothStates, setToothStates] = useState(buildInitialToothStates);
    const [radialState, setRadialState] = useState(null);
    const [level2Open, setLevel2Open] = useState(false);
    const [pendingCombination, setPendingCombination] = useState(null);
    const [hoveredMenuItem, setHoveredMenuItem] = useState(null);
    const [hoveredPreviewType, setHoveredPreviewType] = useState(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [hoveredAction, setHoveredAction] = useState(null);

    // Feedback temporal al guardar para Elásticos
    const [savedToElastics, setSavedToElastics] = useState(false);

    const [brackets, setBrackets] = useState({});
    const [bracketWires, setBracketWires] = useState({});
    const [selectedBracket, setSelectedBracket] = useState(null);
    const [tads, setTads] = useState({});
    const [tadWires, setTadWires] = useState({});
    const [periodontalData, setPeriodontalData] = useState({});
    const [isBracketMode, setIsBracketMode] = useState(false);
    const [isTadMode, setIsTadMode] = useState(false);
    const [isPeriodontalMode, setIsPeriodontalMode] = useState(false);
    const [activePeriodontalTooth, setActivePeriodontalTooth] = useState(null);

    const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
    const [voiceSettings, setVoiceSettings] = useState({ isMuted: false, selectedVoiceURI: '' });
    const [hasVoiceSupport, setHasVoiceSupport] = useState(false);

    useEffect(() => {
        const checkVoices = () => {
            if ('speechSynthesis' in window) {
                const voices = window.speechSynthesis.getVoices();
                const spanishVoices = voices.filter(v => v.lang.startsWith('es'));
                setHasVoiceSupport(spanishVoices.length > 0);
            } else {
                setHasVoiceSupport(false);
            }
        };

        checkVoices();
        if ('speechSynthesis' in window && window.speechSynthesis.onvoiceschanged !== undefined) {
            window.speechSynthesis.onvoiceschanged = checkVoices;
        }
    }, []);

    useEffect(() => {
        const savedSettingsStr = localStorage.getItem('odontogram_voice_settings');
        if (savedSettingsStr) {
            try {
                const settings = JSON.parse(savedSettingsStr);
                setVoiceSettings({
                    isMuted: settings.isMuted || false,
                    selectedVoiceURI: settings.selectedVoiceURI || ''
                });
            } catch (e) {
                console.error("Error loading voice settings", e);
            }
        }
    }, [isVoiceModalOpen]); // Reload when modal closes to ensure sync

    // --- Auto-scroll y ajuste de posición del Menú Radial ---
    useEffect(() => {
        if (!radialState) return;

        // 1. Auto-scroll si el menú está fuera de los límites (solo ejecuta al abrir)
        if (!radialState.isAutoScrolled) {
            const MENU_RADIUS = 330;
            const { y } = radialState;
            let scrollDelta = 0;

            if (y + MENU_RADIUS > window.innerHeight) {
                scrollDelta = (y + MENU_RADIUS) - window.innerHeight;
            } else if (y - MENU_RADIUS < 0) {
                scrollDelta = y - MENU_RADIUS;
            }

            if (scrollDelta !== 0) {
                const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
                const currentScroll = window.scrollY;
                let actualScroll = scrollDelta;

                if (scrollDelta > 0 && currentScroll + scrollDelta > maxScroll) {
                    actualScroll = maxScroll - currentScroll;
                } else if (scrollDelta < 0 && currentScroll + scrollDelta < 0) {
                    actualScroll = -currentScroll;
                }

                if (actualScroll !== 0) {
                    window.scrollBy({ top: actualScroll, behavior: 'smooth' });
                }
            }

            setRadialState(prev => ({ ...prev, isAutoScrolled: true }));
        }

        // 2. Mantener el menú anclado al diente garantizando visibilidad total (clamping)
        const handleScrollOrResize = () => {
            setRadialState(prev => {
                if (!prev) return prev;

                const MENU_RADIUS = 310;
                let newY = prev.docY - window.scrollY;
                let newX = prev.docX - window.scrollX;

                if (newY + MENU_RADIUS > window.innerHeight) {
                    newY = window.innerHeight - MENU_RADIUS;
                }
                if (newY - MENU_RADIUS < 0) {
                    newY = MENU_RADIUS;
                }

                if (newX + MENU_RADIUS > window.innerWidth) {
                    newX = window.innerWidth - MENU_RADIUS;
                }
                if (newX - MENU_RADIUS < 0) {
                    newX = MENU_RADIUS;
                }

                return {
                    ...prev,
                    x: newX,
                    y: newY
                };
            });
        };

        window.addEventListener('scroll', handleScrollOrResize, { passive: true });
        window.addEventListener('resize', handleScrollOrResize, { passive: true });

        handleScrollOrResize();

        return () => {
            window.removeEventListener('scroll', handleScrollOrResize);
            window.removeEventListener('resize', handleScrollOrResize);
        };
    }, [radialState?.toothId, radialState?.isAutoScrolled]);

    // ⚙️ AJUSTES DE BANDA PERIODONTAL (Configurables por el desarrollador)
    // Modifica estos valores para cambiar la altura o el grosor de la banda visual roja.
    const periodontalUpperY = 80; // Altura desde abajo para el maxilar superior
    const periodontalLowerY = 60; // Altura desde arriba para la mandíbula inferior
    const periodontalUpperThickness = 105; // Grosor de la banda superior
    const periodontalLowerThickness = 100; // Grosor de la banda inferior


    const setBracketMode = (val) => {
        setIsBracketMode(val);
        if (val) {
            setIsTadMode(false);
            setIsPeriodontalMode(false);
        } else {
            setSelectedBracket(null);
        }
    };

    const setTadMode = (val) => {
        setIsTadMode(val);
        if (val) {
            setIsBracketMode(false);
            setIsPeriodontalMode(false);
        }
    };

    const setPeriodontalMode = (val) => {
        setIsPeriodontalMode(val);
        if (val) {
            setIsBracketMode(false);
            setIsTadMode(false);
        }
    };

    const [selectedToothType, setSelectedToothType] = useState('original');
    const [surfaceStates, setSurfaceStates] = useState({});
    const [selectedSurface, setSelectedSurface] = useState(null);
    const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);

    useEffect(() => {
        console.log("[DEBUG] isResetDialogOpen changed:", isResetDialogOpen);
    }, [isResetDialogOpen]);

    // --- HISTORY SYSTEM (UNDO / REDO) ---
    const [historyState, setHistoryState] = useState(() => ({
        past: [],
        present: {
            toothStates: buildInitialToothStates(),
            brackets: {},
            bracketWires: {},
            tads: {},
            tadWires: {},
            surfaceStates: {},
            periodontalData: {}
        },
        future: []
    }));
    const isUndoRedoAction = useRef(false);
    const isInitialLoad = useRef(true);

    // ==========================================
    // Carga inicial del estado persistido (localStorage)
    // ==========================================
    useEffect(() => {
        if (!patientId) return;
        const STORAGE_KEY = `odontogram_data_${patientId}`;
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) {
                isInitialLoad.current = false;
                return;
            }

            const parsed = JSON.parse(raw);
            isUndoRedoAction.current = true; // Evitar que el historial guarde este paso inicial
            isInitialLoad.current = true;

            // Actualizar todos los estados clínicos
            if (parsed.toothStates) setToothStates(parsed.toothStates);

            // Migración de brackets (boolean -> object)
            let finalBrackets = parsed.brackets || {};
            let migrationNeeded = false;
            Object.keys(finalBrackets).forEach(id => {
                if (typeof finalBrackets[id] === 'boolean') {
                    finalBrackets[id] = { isBroken: false };
                    migrationNeeded = true;
                }
            });
            setBrackets(finalBrackets);

            if (parsed.bracketWires) setBracketWires(parsed.bracketWires);
            if (parsed.tads) setTads(parsed.tads);
            if (parsed.tadWires) setTadWires(parsed.tadWires);
            if (parsed.surfaceStates) setSurfaceStates(parsed.surfaceStates);
            if (parsed.periodontalData) setPeriodontalData(parsed.periodontalData);

            // Sincronizar historial con los datos cargados
            setHistoryState({
                past: [],
                present: {
                    toothStates: parsed.toothStates || buildInitialToothStates(),
                    brackets: finalBrackets,
                    bracketWires: parsed.bracketWires || {},
                    tads: parsed.tads || {},
                    tadWires: parsed.tadWires || {},
                    surfaceStates: parsed.surfaceStates || {},
                    periodontalData: parsed.periodontalData || {}
                },
                future: []
            });

            setTimeout(() => {
                isInitialLoad.current = false;
            }, 100);

        } catch (err) {
            console.error('[OdontogramSection] Error al cargar datos persistidos:', err);
            isInitialLoad.current = false;
        }
    }, [patientId]);

    useEffect(() => {
        if (isUndoRedoAction.current || isInitialLoad.current) {
            isUndoRedoAction.current = false;
            return;
        }
        const newState = { toothStates, brackets, bracketWires, tads, tadWires, surfaceStates, periodontalData };
        setHistoryState(prev => {
            if (JSON.stringify(prev.present) === JSON.stringify(newState)) return prev;
            const newPast = [...prev.past, prev.present].slice(-50);
            return { past: newPast, present: newState, future: [] };
        });
    }, [toothStates, brackets, bracketWires, tads, tadWires, surfaceStates, periodontalData]);

    const handleUndo = useCallback(() => {
        setHistoryState(prev => {
            if (prev.past.length === 0) return prev;
            const newPast = [...prev.past];
            const previousState = newPast.pop();

            isUndoRedoAction.current = true;
            setToothStates(previousState.toothStates);
            setBrackets(previousState.brackets);
            setBracketWires(previousState.bracketWires || {});
            setTads(previousState.tads);
            setTadWires(previousState.tadWires || {});
            setSurfaceStates(previousState.surfaceStates);
            setPeriodontalData(previousState.periodontalData || {});

            setSelectedBracket(null);

            return { past: newPast, present: previousState, future: [prev.present, ...prev.future] };
        });
    }, []);

    const handleRedo = useCallback(() => {
        setHistoryState(prev => {
            if (prev.future.length === 0) return prev;
            const newFuture = [...prev.future];
            const nextState = newFuture.shift();

            isUndoRedoAction.current = true;
            setToothStates(nextState.toothStates);
            setBrackets(nextState.brackets);
            setBracketWires(nextState.bracketWires || {});
            setTads(nextState.tads);
            setTadWires(nextState.tadWires || {});
            setSurfaceStates(nextState.surfaceStates);
            setPeriodontalData(nextState.periodontalData || {});

            setSelectedBracket(null);

            return { past: [...prev.past, prev.present], present: nextState, future: newFuture };
        });
    }, []);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
                e.preventDefault();
                handleUndo();
            } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
                e.preventDefault();
                handleRedo();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleUndo, handleRedo]);

    // ==========================================
    // Guardar diseño del odontograma en localStorage para la sección de Elásticos
    // La clave incluye el patientId para evitar cruce de datos entre pacientes
    // ==========================================
    const STORAGE_KEY = patientId ? `odontogram_data_${patientId}` : 'odontogram_data_unknown';

    const handleSaveToElastics = useCallback(() => {
        try {
            // Guardamos el estado COMPLETO del odontograma
            const dataToSave = {
                toothStates: historyState.present.toothStates,
                brackets: historyState.present.brackets,
                bracketWires: historyState.present.bracketWires,
                tads: historyState.present.tads,
                tadWires: historyState.present.tadWires,
                surfaceStates: historyState.present.surfaceStates,
                periodontalData: historyState.present.periodontalData,
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
            setSavedToElastics(true);
        } catch (err) {
            console.error('[OdontogramSection] Error al guardar en localStorage:', err);
        }
    }, [STORAGE_KEY, historyState.present]);

    // Limpiar el badge "¡Guardado!" después de 2.5 segundos
    useEffect(() => {
        if (!savedToElastics) return;
        const timer = setTimeout(() => setSavedToElastics(false), 2500);
        return () => clearTimeout(timer);
    }, [savedToElastics]);

    // Store measured widths of frontal teeth
    const [toothWidths, setToothWidths] = useState({});
    const [baseToothWidths, setBaseToothWidths] = useState({});

    const handleToothResize = useCallback((id, width) => {
        setToothWidths(prev => {
            if (prev[id] === width) return prev;
            return { ...prev, [id]: width };
        });

        // Guardar ancho base SOLO si el diente es original
        setBaseToothWidths(prev => {
            if (toothStates[id] === 'original' && !prev[id]) {
                return { ...prev, [id]: width };
            }
            return prev;
        });
    }, [toothStates]);

    const handleToothRightClick = (id, x, y) => {
        if (isBracketMode || isTadMode || isPeriodontalMode) return;
        setRadialState({
            toothId: id,
            x,
            y,
            docX: x + window.scrollX,
            docY: y + window.scrollY,
            isAutoScrolled: false
        });
        setLevel2Open(false);
        setHoveredMenuItem(null);
        setPendingCombination(null);
    };

    const cleanupBracketsForTooth = useCallback((toothId) => {
        setBrackets(prev => {
            if (!prev[toothId]) return prev;
            const next = { ...prev };
            delete next[toothId];
            return next;
        });

        setSelectedBracket(prev => (prev === toothId ? null : prev));

        setBracketWires(prev => {
            let changed = false;
            const next = { ...prev };
            Object.keys(next).forEach(key => {
                if (key.split('-').includes(String(toothId))) {
                    delete next[key];
                    changed = true;
                }
            });
            return changed ? next : prev;
        });

        setTadWires(prev => {
            let changed = false;
            const next = { ...prev };
            Object.keys(next).forEach(key => {
                if (key.startsWith(`${toothId}|`)) {
                    delete next[key];
                    changed = true;
                }
            });
            return changed ? next : prev;
        });
    }, []);

    const handleToothClick = (id) => {
        if (isBracketMode) {
            if (INACTIVE_TYPES.includes(toothStates[id])) return;

            if (!brackets[id]) {
                setBrackets(prev => ({ ...prev, [id]: { isBroken: false } }));
            } else {
                if (selectedBracket === id) {
                    setBrackets(prev => {
                        const next = { ...prev };
                        delete next[id];
                        return next;
                    });
                    setSelectedBracket(null);
                    setBracketWires(prev => {
                        const next = { ...prev };
                        Object.keys(next).forEach(key => {
                            if (key.split('-').includes(String(id))) {
                                delete next[key];
                            }
                        });
                        return next;
                    });
                    setTadWires(prev => {
                        const next = { ...prev };
                        Object.keys(next).forEach(key => {
                            if (key.startsWith(`${id}|`)) {
                                delete next[key];
                            }
                        });
                        return next;
                    });
                } else if (selectedBracket) {
                    if (true) { // Desactivado: no crear líneas entre brackets por ahora
                        setSelectedBracket(id);
                    } else {
                        // El código original para crear líneas entre brackets ha sido desactivado
                        /*
                        const isSameArch =
                            (UPPER_ARCH_IDS.includes(id) && UPPER_ARCH_IDS.includes(selectedBracket)) ||
                            (LOWER_ARCH_IDS.includes(id) && LOWER_ARCH_IDS.includes(selectedBracket));

                        if (isSameArch) {
                            const pairId = [id, selectedBracket].sort((a, b) => a - b).join('-');
                            setBracketWires(prev => {
                                const next = { ...prev };
                                if (next[pairId]) {
                                    delete next[pairId];
                                } else {
                                    next[pairId] = true;
                                }
                                return next;
                            });
                            setSelectedBracket(id);
                        } else {
                            setSelectedBracket(id);
                        }
                        */
                    }
                } else {
                    setSelectedBracket(id);
                }
            }
        } else if (isPeriodontalMode) {
            setActivePeriodontalTooth(id);
        } else if (isTadMode) {
            // Handled via onTadClick
        } else {
            const currentType = toothStates[id] || 'original';
            const finalType = getToggledToothState(currentType, selectedToothType);

            setToothStates(prev => ({ ...prev, [id]: finalType }));

            if (INACTIVE_TYPES.includes(finalType)) {
                cleanupBracketsForTooth(id);
            }
        }
    };

    const handleSurfaceClick = (id, area) => {
        if (toothStates[id] === 'extraction') return;
        setSelectedSurface({ id, area });
    };

    const handleClinicalAction = (action) => {
        if (!selectedSurface) return;
        const { id, area } = selectedSurface;
        setSurfaceStates(prev => {
            const currentToothState = prev[id] || {};
            const newAreaState = action === 'normal' ? null : action;
            const newToothState = { ...currentToothState, [area]: newAreaState };
            return { ...prev, [id]: newToothState };
        });
        setSelectedSurface(null);
    };

    const handleTadClick = (t1, t2) => {
        const pairId = [t1, t2].sort((a, b) => a - b).join('-');

        if (isBracketMode && selectedBracket) {
            // Only allow if TAD actually exists
            if (!tads[pairId]) return;

            const connectionId = `${selectedBracket}|${pairId}`;
            setTadWires(prev => {
                const next = { ...prev };
                if (next[connectionId]) delete next[connectionId];
                else next[connectionId] = true;
                return next;
            });
        } else if (isTadMode) {
            setTads(prev => ({ ...prev, [pairId]: !prev[pairId] }));
            // Note: Currently we don't auto-clean tadWires if a TAD is removed, 
            // but it's safe since they only render if both ends exist.
        }
    };

    const handleApplyAllBrackets = () => {
        const newBrackets = { ...brackets };
        Object.values(QUADRANTS).flat().forEach(id => {
            const state = toothStates[id];
            if (!INACTIVE_TYPES.includes(state)) {
                if (!newBrackets[id]) newBrackets[id] = { isBroken: false };
            }
        });
        setBrackets(newBrackets);
    };
    const handlePeriodontalSave = (id, data) => {
        setPeriodontalData(prev => ({ ...prev, [id]: data }));
    };

    const RADIAL_MENU_CUSTOM_ROTATION = {
        default: {
            'original': 0,
            'reabsorcion-radicular': 0,
            'anquilosado': 0,
            'root-canal': 25,
            'crown': 60,
            'fissure-root': 85,
            'fissure-crown': 120,
            'fissure-full': 160,
            'pulpotomy': 180,
            'deciduous': 200,
            'implant': 255,
            'missing': 285,
            'unerupted': 315,
            'extraction': 0, // Fallback, not visible

            // Level 2 Combinations
            'implant-level2': 0,
            'implant-crown': 0,
            'root-canal-level2': 0,
            'root-canal+crown': 0,
            'root-canal+crown+fissure-crown': 0,
            'crown-level2': 0,
            'crown+fissure-root': 0,
            'crown+fissure-crown': 0,
            'crown+fissure-full': 0
        },
        11: {
            'original': -65,
            'reabsorcion-radicular': -130,
            'anquilosado': -100,
            'root-canal': 320,
            'crown': 60,
            'fissure-root': 145,
            'fissure-crown': 120,
            'fissure-full': 90,
            'pulpotomy': 200,
            'deciduous': 175,
            'implant': 35,
            'missing': 340,
            'unerupted': 5,
            'extraction': 0, // Fallback, not visible

            // Level 2 Combinations
            'implant-level2': 0,
            'implant-crown': 0,
            'root-canal-level2': 0,
            'root-canal+crown': 0,
            'root-canal+crown+fissure-crown': 0,
            'crown-level2': 0,
            'crown+fissure-root': 0,
            'crown+fissure-crown': 0,
            'crown+fissure-full': 0
        },
        12: {
            'original': -70,
            'reabsorcion-radicular': -130,
            'anquilosado': -110,
            'root-canal': 320,
            'crown': 60,
            'fissure-root': 140,
            'fissure-crown': 120,
            'fissure-full': 90,
            'pulpotomy': 250,
            'deciduous': 220,
            'implant': 40,
            'missing': 340,
            'unerupted': 10,
            'extraction': 0, // Fallback, not visible

            // Level 2 Combinations
            'implant-level2': 0,
            'implant-crown': 0,
            'root-canal-level2': 0,
            'root-canal+crown': 0,
            'root-canal+crown+fissure-crown': 0,
            'crown-level2': 0,
            'crown+fissure-root': 0,
            'crown+fissure-crown': 0,
            'crown+fissure-full': 0
        },
        13: {
            'original': -70,
            'reabsorcion-radicular': -130,
            'anquilosado': -110,
            'root-canal': 320,
            'crown': 60,
            'fissure-root': 140,
            'fissure-crown': 120,
            'fissure-full': 90,
            'pulpotomy': -160,
            'deciduous': -190,
            'implant': 40,
            'missing': 340,
            'unerupted': 10,
            'extraction': 0, // Fallback, not visible

            // Level 2 Combinations
            'implant-level2': 0,
            'implant-crown': 0,
            'root-canal-level2': 0,
            'root-canal+crown': 0,
            'root-canal+crown+fissure-crown': 0,
            'crown-level2': 0,
            'crown+fissure-root': 0,
            'crown+fissure-crown': 0,
            'crown+fissure-full': 0
        },
        14: {
            'original': -70,
            'reabsorcion-radicular': -130,
            'anquilosado': -110,
            'root-canal': 320,
            'crown': 60,
            'fissure-root': 140,
            'fissure-crown': 120,
            'fissure-full': 90,
            'pulpotomy': -160,
            'deciduous': -190,
            'implant': 40,
            'missing': 340,
            'unerupted': 10,
            'extraction': 0, // Fallback, not visible

            // Level 2 Combinations
            'implant-level2': 0,
            'implant-crown': 0,
            'root-canal-level2': 0,
            'root-canal+crown': 0,
            'root-canal+crown+fissure-crown': 0,
            'crown-level2': 0,
            'crown+fissure-root': 0,
            'crown+fissure-crown': 0,
            'crown+fissure-full': 0
        },
        15: {
            'original': -70,
            'reabsorcion-radicular': -130,
            'anquilosado': -110,
            'root-canal': 320,
            'crown': 60,
            'fissure-root': 140,
            'fissure-crown': 120,
            'fissure-full': 90,
            'pulpotomy': -160,
            'deciduous': -190,
            'implant': 40,
            'missing': 340,
            'unerupted': 10,
            'extraction': 0, // Fallback, not visible

            // Level 2 Combinations
            'implant-level2': 0,
            'implant-crown': 0,
            'root-canal-level2': 0,
            'root-canal+crown': 0,
            'root-canal+crown+fissure-crown': 0,
            'crown-level2': 0,
            'crown+fissure-root': 0,
            'crown+fissure-crown': 0,
            'crown+fissure-full': 0
        },
        16: {
            'original': -70,
            'reabsorcion-radicular': -130,
            'anquilosado': -110,
            'root-canal': 320,
            'crown': 90,
            'fissure-root': 190,
            'fissure-crown': 150,
            'fissure-full': 120,
            'pulpotomy': -160,
            'deciduous': -190,
            'implant': 60,
            'missing': 350,
            'unerupted': 25,
            'extraction': 0, // Fallback, not visible

            // Level 2 Combinations
            'implant-level2': 0,
            'implant-crown': 0,
            'root-canal-level2': 0,
            'root-canal+crown': 0,
            'root-canal+crown+fissure-crown': 0,
            'crown-level2': 0,
            'crown+fissure-root': 0,
            'crown+fissure-crown': 0,
            'crown+fissure-full': 0
        },
        17: {
            'original': -70,
            'reabsorcion-radicular': -130,
            'anquilosado': -110,
            'root-canal': 320,
            'crown': 90,
            'fissure-root': 190,
            'fissure-crown': 150,
            'fissure-full': 120,
            'pulpotomy': -160,
            'deciduous': -190,
            'implant': 60,
            'missing': 350,
            'unerupted': 25,
            'extraction': 0, // Fallback, not visible

            // Level 2 Combinations
            'implant-level2': 0,
            'implant-crown': 0,
            'root-canal-level2': 0,
            'root-canal+crown': 0,
            'root-canal+crown+fissure-crown': 0,
            'crown-level2': 0,
            'crown+fissure-root': 0,
            'crown+fissure-crown': 0,
            'crown+fissure-full': 0
        },
        18: {
            'original': -70,
            'reabsorcion-radicular': -130,
            'anquilosado': -110,
            'root-canal': 320,
            'crown': 90,
            'fissure-root': 190,
            'fissure-crown': 150,
            'fissure-full': 120,
            'pulpotomy': -160,
            'deciduous': -190,
            'implant': 60,
            'missing': 350,
            'unerupted': 25,
            'extraction': 0, // Fallback, not visible

            // Level 2 Combinations
            'implant-level2': 0,
            'implant-crown': 0,
            'root-canal-level2': 0,
            'root-canal+crown': 0,
            'root-canal+crown+fissure-crown': 0,
            'crown-level2': 0,
            'crown+fissure-root': 0,
            'crown+fissure-crown': 0,
            'crown+fissure-full': 0
        },
        //Maxiliar izquierdo
        21: {
            'original': -65,
            'reabsorcion-radicular': -130,
            'anquilosado': -100,
            'root-canal': 320,
            'crown': 60,
            'fissure-root': 145,
            'fissure-crown': 120,
            'fissure-full': 90,
            'pulpotomy': 200,
            'deciduous': 175,
            'implant': 35,
            'missing': 340,
            'unerupted': 5,
            'extraction': 0, // Fallback, not visible

            // Level 2 Combinations
            'implant-level2': 0,
            'implant-crown': 0,
            'root-canal-level2': 0,
            'root-canal+crown': 0,
            'root-canal+crown+fissure-crown': 0,
            'crown-level2': 0,
            'crown+fissure-root': 0,
            'crown+fissure-crown': 0,
            'crown+fissure-full': 0
        },
        22: {
            'original': -70,
            'reabsorcion-radicular': -130,
            'anquilosado': -110,
            'root-canal': 320,
            'crown': 60,
            'fissure-root': 140,
            'fissure-crown': 120,
            'fissure-full': 90,
            'pulpotomy': 250,
            'deciduous': 220,
            'implant': 40,
            'missing': 340,
            'unerupted': 10,
            'extraction': 0, // Fallback, not visible

            // Level 2 Combinations
            'implant-level2': 0,
            'implant-crown': 0,
            'root-canal-level2': 0,
            'root-canal+crown': 0,
            'root-canal+crown+fissure-crown': 0,
            'crown-level2': 0,
            'crown+fissure-root': 0,
            'crown+fissure-crown': 0,
            'crown+fissure-full': 0
        },
        23: {
            'original': -70,
            'reabsorcion-radicular': -130,
            'anquilosado': -110,
            'root-canal': 320,
            'crown': 60,
            'fissure-root': 140,
            'fissure-crown': 120,
            'fissure-full': 90,
            'pulpotomy': -160,
            'deciduous': -190,
            'implant': 40,
            'missing': 340,
            'unerupted': 10,
            'extraction': 0, // Fallback, not visible

            // Level 2 Combinations
            'implant-level2': 0,
            'implant-crown': 0,
            'root-canal-level2': 0,
            'root-canal+crown': 0,
            'root-canal+crown+fissure-crown': 0,
            'crown-level2': 0,
            'crown+fissure-root': 0,
            'crown+fissure-crown': 0,
            'crown+fissure-full': 0
        },
        24: {
            'original': -70,
            'reabsorcion-radicular': -130,
            'anquilosado': -110,
            'root-canal': 320,
            'crown': 60,
            'fissure-root': 140,
            'fissure-crown': 120,
            'fissure-full': 90,
            'pulpotomy': -160,
            'deciduous': -190,
            'implant': 40,
            'missing': 340,
            'unerupted': 10,
            'extraction': 0, // Fallback, not visible

            // Level 2 Combinations
            'implant-level2': 0,
            'implant-crown': 0,
            'root-canal-level2': 0,
            'root-canal+crown': 0,
            'root-canal+crown+fissure-crown': 0,
            'crown-level2': 0,
            'crown+fissure-root': 0,
            'crown+fissure-crown': 0,
            'crown+fissure-full': 0
        },
        25: {
            'original': -70,
            'reabsorcion-radicular': -130,
            'anquilosado': -110,
            'root-canal': 320,
            'crown': 60,
            'fissure-root': 140,
            'fissure-crown': 120,
            'fissure-full': 90,
            'pulpotomy': -160,
            'deciduous': -190,
            'implant': 40,
            'missing': 340,
            'unerupted': 10,
            'extraction': 0, // Fallback, not visible

            // Level 2 Combinations
            'implant-level2': 0,
            'implant-crown': 0,
            'root-canal-level2': 0,
            'root-canal+crown': 0,
            'root-canal+crown+fissure-crown': 0,
            'crown-level2': 0,
            'crown+fissure-root': 0,
            'crown+fissure-crown': 0,
            'crown+fissure-full': 0
        },
        26: {
            'original': -70,
            'reabsorcion-radicular': -130,
            'anquilosado': -110,
            'root-canal': 320,
            'crown': 90,
            'fissure-root': 190,
            'fissure-crown': 150,
            'fissure-full': 120,
            'pulpotomy': -160,
            'deciduous': -190,
            'implant': 60,
            'missing': 350,
            'unerupted': 25,
            'extraction': 0, // Fallback, not visible

            // Level 2 Combinations
            'implant-level2': 0,
            'implant-crown': 0,
            'root-canal-level2': 0,
            'root-canal+crown': 0,
            'root-canal+crown+fissure-crown': 0,
            'crown-level2': 0,
            'crown+fissure-root': 0,
            'crown+fissure-crown': 0,
            'crown+fissure-full': 0
        },
        27: {
            'original': -70,
            'reabsorcion-radicular': -130,
            'anquilosado': -110,
            'root-canal': 320,
            'crown': 90,
            'fissure-root': 190,
            'fissure-crown': 150,
            'fissure-full': 120,
            'pulpotomy': -160,
            'deciduous': -190,
            'implant': 60,
            'missing': 350,
            'unerupted': 25,
            'extraction': 0, // Fallback, not visible

            // Level 2 Combinations
            'implant-level2': 0,
            'implant-crown': 0,
            'root-canal-level2': 0,
            'root-canal+crown': 0,
            'root-canal+crown+fissure-crown': 0,
            'crown-level2': 0,
            'crown+fissure-root': 0,
            'crown+fissure-crown': 0,
            'crown+fissure-full': 0
        },
        28: {
            'original': -70,
            'reabsorcion-radicular': -130,
            'anquilosado': -110,
            'root-canal': 320,
            'crown': 90,
            'fissure-root': 190,
            'fissure-crown': 150,
            'fissure-full': 120,
            'pulpotomy': -160,
            'deciduous': -190,
            'implant': 60,
            'missing': 350,
            'unerupted': 25,
            'extraction': 0, // Fallback, not visible

            // Level 2 Combinations
            'implant-level2': 0,
            'implant-crown': 0,
            'root-canal-level2': 0,
            'root-canal+crown': 0,
            'root-canal+crown+fissure-crown': 0,
            'crown-level2': 0,
            'crown+fissure-root': 0,
            'crown+fissure-crown': 0,
            'crown+fissure-full': 0
        },
        //Inferior derecho
        41: {
            'original': 110,
            'reabsorcion-radicular': 50,
            'anquilosado': 70,
            'root-canal': 140,
            'crown': -120,
            'fissure-root': -30,
            'fissure-crown': -60,
            'fissure-full': -90,
            'pulpotomy': 30,
            'deciduous': -5,
            'implant': -140,
            'missing': 160,
            'unerupted': -170,
            'extraction': 0, // Fallback, not visible

            // Level 2 Combinations
            'implant-level2': 0,
            'implant-crown': 0,
            'root-canal-level2': 0,
            'root-canal+crown': 0,
            'root-canal+crown+fissure-crown': 0,
            'crown-level2': 0,
            'crown+fissure-root': 0,
            'crown+fissure-crown': 0,
            'crown+fissure-full': 0
        },
        42: {
            'original': 110,
            'reabsorcion-radicular': 50,
            'anquilosado': 70,
            'root-canal': 140,
            'crown': -120,
            'fissure-root': -30,
            'fissure-crown': -60,
            'fissure-full': -90,
            'pulpotomy': 30,
            'deciduous': -5,
            'implant': -140,
            'missing': 160,
            'unerupted': -170,
            'extraction': 0, // Fallback, not visible

            // Level 2 Combinations
            'implant-level2': 0,
            'implant-crown': 0,
            'root-canal-level2': 0,
            'root-canal+crown': 0,
            'root-canal+crown+fissure-crown': 0,
            'crown-level2': 0,
            'crown+fissure-root': 0,
            'crown+fissure-crown': 0,
            'crown+fissure-full': 0
        },
        43: {
            'original': 110,
            'reabsorcion-radicular': 50,
            'anquilosado': 70,
            'root-canal': 140,
            'crown': -120,
            'fissure-root': -30,
            'fissure-crown': -60,
            'fissure-full': -90,
            'pulpotomy': 20,
            'deciduous': -5,
            'implant': -140,
            'missing': 160,
            'unerupted': -170,
            'extraction': 0, // Fallback, not visible

            // Level 2 Combinations
            'implant-level2': 0,
            'implant-crown': 0,
            'root-canal-level2': 0,
            'root-canal+crown': 0,
            'root-canal+crown+fissure-crown': 0,
            'crown-level2': 0,
            'crown+fissure-root': 0,
            'crown+fissure-crown': 0,
            'crown+fissure-full': 0
        },
        44: {
            'original': 110,
            'reabsorcion-radicular': 50,
            'anquilosado': 70,
            'root-canal': 140,
            'crown': -120,
            'fissure-root': -30,
            'fissure-crown': -60,
            'fissure-full': -90,
            'pulpotomy': 20,
            'deciduous': -5,
            'implant': -140,
            'missing': 160,
            'unerupted': -170,
            'extraction': 0, // Fallback, not visible

            // Level 2 Combinations
            'implant-level2': 0,
            'implant-crown': 0,
            'root-canal-level2': 0,
            'root-canal+crown': 0,
            'root-canal+crown+fissure-crown': 0,
            'crown-level2': 0,
            'crown+fissure-root': 0,
            'crown+fissure-crown': 0,
            'crown+fissure-full': 0
        },
        45: {
            'original': 110,
            'reabsorcion-radicular': 50,
            'anquilosado': 70,
            'root-canal': 140,
            'crown': -120,
            'fissure-root': -30,
            'fissure-crown': -60,
            'fissure-full': -90,
            'pulpotomy': 20,
            'deciduous': -5,
            'implant': -140,
            'missing': 160,
            'unerupted': -170,
            'extraction': 0, // Fallback, not visible

            // Level 2 Combinations
            'implant-level2': 0,
            'implant-crown': 0,
            'root-canal-level2': 0,
            'root-canal+crown': 0,
            'root-canal+crown+fissure-crown': 0,
            'crown-level2': 0,
            'crown+fissure-root': 0,
            'crown+fissure-crown': 0,
            'crown+fissure-full': 0
        },
        46: {
            'original': 110,
            'reabsorcion-radicular': 40,
            'anquilosado': 70,
            'root-canal': 140,
            'crown': -100,
            'fissure-root': 10,
            'fissure-crown': -20,
            'fissure-full': -60,
            'pulpotomy': 20,
            'deciduous': -5,
            'implant': -120,
            'missing': 170,
            'unerupted': -160,
            'extraction': 0, // Fallback, not visible

            // Level 2 Combinations
            'implant-level2': 0,
            'implant-crown': 0,
            'root-canal-level2': 0,
            'root-canal+crown': 0,
            'root-canal+crown+fissure-crown': 0,
            'crown-level2': 0,
            'crown+fissure-root': 0,
            'crown+fissure-crown': 0,
            'crown+fissure-full': 0
        },
        47: {
            'original': 110,
            'reabsorcion-radicular': 40,
            'anquilosado': 70,
            'root-canal': 140,
            'crown': -100,
            'fissure-root': 10,
            'fissure-crown': -20,
            'fissure-full': -60,
            'pulpotomy': 20,
            'deciduous': -5,
            'implant': -120,
            'missing': 170,
            'unerupted': -160,
            'extraction': 0, // Fallback, not visible

            // Level 2 Combinations
            'implant-level2': 0,
            'implant-crown': 0,
            'root-canal-level2': 0,
            'root-canal+crown': 0,
            'root-canal+crown+fissure-crown': 0,
            'crown-level2': 0,
            'crown+fissure-root': 0,
            'crown+fissure-crown': 0,
            'crown+fissure-full': 0
        },
        48: {
            'original': 110,
            'reabsorcion-radicular': 40,
            'anquilosado': 70,
            'root-canal': 140,
            'crown': -100,
            'fissure-root': 10,
            'fissure-crown': -20,
            'fissure-full': -60,
            'pulpotomy': 20,
            'deciduous': -5,
            'implant': -120,
            'missing': 170,
            'unerupted': -160,
            'extraction': 0, // Fallback, not visible

            // Level 2 Combinations
            'implant-level2': 0,
            'implant-crown': 0,
            'root-canal-level2': 0,
            'root-canal+crown': 0,
            'root-canal+crown+fissure-crown': 0,
            'crown-level2': 0,
            'crown+fissure-root': 0,
            'crown+fissure-crown': 0,
            'crown+fissure-full': 0
        },
        //Inferior izquierdo
        31: {
            'original': 110,
            'reabsorcion-radicular': 50,
            'anquilosado': 70,
            'root-canal': 140,
            'crown': -120,
            'fissure-root': -30,
            'fissure-crown': -60,
            'fissure-full': -90,
            'pulpotomy': 30,
            'deciduous': -5,
            'implant': -140,
            'missing': 160,
            'unerupted': -170,
            'extraction': 0, // Fallback, not visible

            // Level 2 Combinations
            'implant-level2': 0,
            'implant-crown': 0,
            'root-canal-level2': 0,
            'root-canal+crown': 0,
            'root-canal+crown+fissure-crown': 0,
            'crown-level2': 0,
            'crown+fissure-root': 0,
            'crown+fissure-crown': 0,
            'crown+fissure-full': 0
        },
        32: {
            'original': 110,
            'reabsorcion-radicular': 50,
            'anquilosado': 70,
            'root-canal': 140,
            'crown': -120,
            'fissure-root': -30,
            'fissure-crown': -60,
            'fissure-full': -90,
            'pulpotomy': 30,
            'deciduous': -5,
            'implant': -140,
            'missing': 160,
            'unerupted': -170,
            'extraction': 0, // Fallback, not visible

            // Level 2 Combinations
            'implant-level2': 0,
            'implant-crown': 0,
            'root-canal-level2': 0,
            'root-canal+crown': 0,
            'root-canal+crown+fissure-crown': 0,
            'crown-level2': 0,
            'crown+fissure-root': 0,
            'crown+fissure-crown': 0,
            'crown+fissure-full': 0
        },
        33: {
            'original': 110,
            'reabsorcion-radicular': 50,
            'anquilosado': 70,
            'root-canal': 140,
            'crown': -120,
            'fissure-root': -30,
            'fissure-crown': -60,
            'fissure-full': -90,
            'pulpotomy': 20,
            'deciduous': -5,
            'implant': -140,
            'missing': 160,
            'unerupted': -170,
            'extraction': 0, // Fallback, not visible

            // Level 2 Combinations
            'implant-level2': 0,
            'implant-crown': 0,
            'root-canal-level2': 0,
            'root-canal+crown': 0,
            'root-canal+crown+fissure-crown': 0,
            'crown-level2': 0,
            'crown+fissure-root': 0,
            'crown+fissure-crown': 0,
            'crown+fissure-full': 0
        },
        34: {
            'original': 110,
            'reabsorcion-radicular': 50,
            'anquilosado': 70,
            'root-canal': 140,
            'crown': -120,
            'fissure-root': -30,
            'fissure-crown': -60,
            'fissure-full': -90,
            'pulpotomy': 20,
            'deciduous': -5,
            'implant': -140,
            'missing': 160,
            'unerupted': -170,
            'extraction': 0, // Fallback, not visible

            // Level 2 Combinations
            'implant-level2': 0,
            'implant-crown': 0,
            'root-canal-level2': 0,
            'root-canal+crown': 0,
            'root-canal+crown+fissure-crown': 0,
            'crown-level2': 0,
            'crown+fissure-root': 0,
            'crown+fissure-crown': 0,
            'crown+fissure-full': 0
        },
        35: {
            'original': 110,
            'reabsorcion-radicular': 50,
            'anquilosado': 70,
            'root-canal': 140,
            'crown': -120,
            'fissure-root': -30,
            'fissure-crown': -60,
            'fissure-full': -90,
            'pulpotomy': 20,
            'deciduous': -5,
            'implant': -140,
            'missing': 160,
            'unerupted': -170,
            'extraction': 0, // Fallback, not visible

            // Level 2 Combinations
            'implant-level2': 0,
            'implant-crown': 0,
            'root-canal-level2': 0,
            'root-canal+crown': 0,
            'root-canal+crown+fissure-crown': 0,
            'crown-level2': 0,
            'crown+fissure-root': 0,
            'crown+fissure-crown': 0,
            'crown+fissure-full': 0
        },
        36: {
            'original': 110,
            'reabsorcion-radicular': 40,
            'anquilosado': 70,
            'root-canal': 140,
            'crown': -100,
            'fissure-root': 10,
            'fissure-crown': -20,
            'fissure-full': -60,
            'pulpotomy': 20,
            'deciduous': -5,
            'implant': -120,
            'missing': 170,
            'unerupted': -160,
            'extraction': 0, // Fallback, not visible

            // Level 2 Combinations
            'implant-level2': 0,
            'implant-crown': 0,
            'root-canal-level2': 0,
            'root-canal+crown': 0,
            'root-canal+crown+fissure-crown': 0,
            'crown-level2': 0,
            'crown+fissure-root': 0,
            'crown+fissure-crown': 0,
            'crown+fissure-full': 0
        },
        37: {
            'original': 110,
            'reabsorcion-radicular': 40,
            'anquilosado': 70,
            'root-canal': 140,
            'crown': -100,
            'fissure-root': 10,
            'fissure-crown': -20,
            'fissure-full': -60,
            'pulpotomy': 20,
            'deciduous': -5,
            'implant': -120,
            'missing': 170,
            'unerupted': -160,
            'extraction': 0, // Fallback, not visible

            // Level 2 Combinations
            'implant-level2': 0,
            'implant-crown': 0,
            'root-canal-level2': 0,
            'root-canal+crown': 0,
            'root-canal+crown+fissure-crown': 0,
            'crown-level2': 0,
            'crown+fissure-root': 0,
            'crown+fissure-crown': 0,
            'crown+fissure-full': 0
        },
        38: {
            'original': 110,
            'reabsorcion-radicular': 40,
            'anquilosado': 70,
            'root-canal': 140,
            'crown': -100,
            'fissure-root': 10,
            'fissure-crown': -20,
            'fissure-full': -60,
            'pulpotomy': 20,
            'deciduous': -5,
            'implant': -120,
            'missing': 170,
            'unerupted': -160,
            'extraction': 0, // Fallback, not visible

            // Level 2 Combinations
            'implant-level2': 0,
            'implant-crown': 0,
            'root-canal-level2': 0,
            'root-canal+crown': 0,
            'root-canal+crown+fissure-crown': 0,
            'crown-level2': 0,
            'crown+fissure-root': 0,
            'crown+fissure-crown': 0,
            'crown+fissure-full': 0
        }
    };

    const renderMenuItem = (type, index, array) => {

        const currentToothId = radialState?.toothId;
        const rotationMap = RADIAL_MENU_CUSTOM_ROTATION[currentToothId] || RADIAL_MENU_CUSTOM_ROTATION.default;
        const customRotation = rotationMap[type.id] !== undefined ? rotationMap[type.id] : (rotationMap['original'] !== undefined ? rotationMap['original'] : 0);

        return (
            <MenuItem
                key={type.id}
                onMouseEnter={(e) => {
                    setHoveredMenuItem(type.id);
                    if (radialState && radialState.toothId) {
                        const currentType = toothStates[radialState.toothId] || 'original';
                        const previewFinal = getToggledToothState(currentType, type.id);
                        setHoveredPreviewType(previewFinal);
                    }
                    setMousePos({ x: e.clientX, y: e.clientY });
                }}
                onMouseMove={(e) => setMousePos({ x: e.clientX, y: e.clientY })}
                onMouseLeave={() => {
                    setHoveredMenuItem(null);
                    setHoveredPreviewType(null);
                }}
                onItemClick={(e) => {
                    e.stopPropagation();

                    // Reproducir el nombre del tratamiento seleccionado si no está silenciado
                    if ('speechSynthesis' in window && !voiceSettings.isMuted) {
                        const utterance = new SpeechSynthesisUtterance("Seleccionado " + type.label);

                        if (voiceSettings.selectedVoiceURI) {
                            const voices = window.speechSynthesis.getVoices();
                            const selectedVoice = voices.find(v => v.voiceURI === voiceSettings.selectedVoiceURI);
                            if (selectedVoice) {
                                utterance.voice = selectedVoice;
                            }
                        }

                        // Cancel any currently playing speech to avoid overlapping
                        window.speechSynthesis.cancel();
                        window.speechSynthesis.speak(utterance);
                    }

                    if (radialState && radialState.toothId) {
                        const currentType = toothStates[radialState.toothId] || 'original';
                        const finalType = getToggledToothState(currentType, type.id);

                        const exclusive = ['extraction', 'missing', 'unerupted', 'deciduous', 'pulpotomy', 'original', 'reabsorcion-radicular', 'anquilosado'];
                        const isExclusive = exclusive.includes(type.id);

                        // Nueva Regla Directa: Si escogemos Implante, Endodoncia o Corona, SIEMPRE abrir el 2do menú
                        const isBaseTreatment = ['implant', 'root-canal', 'crown'].includes(type.id);

                        if (
                            isBaseTreatment ||
                            (currentType !== 'original' &&
                                finalType !== 'original' &&
                                finalType !== type.id &&
                                finalType !== currentType &&
                                !isExclusive)
                        ) {
                            setPendingCombination({
                                toothId: radialState.toothId,
                                newType: type.id,
                                finalTypeStr: finalType,
                                finalTypesArray: finalType === 'implant-crown' ? ['implant', 'crown'] : finalType.split('+')
                            });
                            setLevel2Open(true);
                        } else {
                            setToothStates(prev => ({ ...prev, [radialState.toothId]: finalType }));

                            if (INACTIVE_TYPES.includes(finalType)) {
                                cleanupBracketsForTooth(radialState.toothId);
                            }

                            setSelectedToothType(type.id);
                            setRadialState(null);
                            setLevel2Open(false);
                            setPendingCombination(null);
                        }
                    } else {
                        setSelectedToothType(type.id);
                        setRadialState(null);
                        setLevel2Open(false);
                    }
                    setHoveredMenuItem(null);
                }}
                data={type.id}
            >
                <div
                    className={`group relative w-[76px] h-[76px] rounded-full flex items-center justify-center p-1 text-center bg-transparent shadow-none border border-transparent cursor-pointer hover:scale-105 hover:bg-slate-100/10 dark:hover:bg-slate-800/50 transition-transform ${type.color.replace(/bg-[a-z0-9/-]+/g, '').replace(/border-[a-z0-9/-]+/g, '')}`}
                >
                    {radialState?.toothId && (
                        <img
                            src={getToothSrc(radialState.toothId, type.id)}
                            alt={type.label}
                            draggable={false}
                            style={{ transform: `rotate(${customRotation}deg)` }}
                            className={`w-4/5 h-4/5 object-contain drop-shadow-md select-none opacity-90 transition-opacity`}
                        />
                    )}
                </div>
            </MenuItem>
        )
    };

    const renderCombinationItem = (comboOption, index, array) => {
        const { isReturn, isCombined, types, label, id } = comboOption;
        const comboId = id || types?.join('+') || '';

        const currentToothId = pendingCombination?.toothId;
        const rotationMap = RADIAL_MENU_CUSTOM_ROTATION[currentToothId] || RADIAL_MENU_CUSTOM_ROTATION.default;

        // Buscamos primero si existe una rotación específica para el nivel 2 (ej. 'crown-level2', 'implant-crown-level2')
        // Si no existe, usamos la rotación base ('crown', 'implant-crown') o 0 como respaldo.
        const level2Key = `${comboId}-level2`;
        const customRotation = rotationMap[level2Key] !== undefined
            ? rotationMap[level2Key]
            : (rotationMap[comboId] !== undefined ? rotationMap[comboId] : 0);

        // Botón Regresar
        if (isReturn) {
            return (
                <MenuItem
                    key="return-button"
                    onMouseEnter={(e) => {
                        setHoveredMenuItem(label);
                        setMousePos({ x: e.clientX, y: e.clientY });
                    }}
                    onMouseMove={(e) => setMousePos({ x: e.clientX, y: e.clientY })}
                    onMouseLeave={() => {
                        setHoveredMenuItem(null);
                        setHoveredPreviewType(null);
                    }}
                    onItemClick={(e) => {
                        e.stopPropagation();
                        setLevel2Open(false);
                        setPendingCombination(null);
                    }}
                >
                    <div className="group relative w-[80px] h-[80px] flex flex-col items-center justify-center p-1 text-center shadow-sm cursor-pointer transition-colors">
                        <svg className="w-8 h-8 text-slate-500 dark:text-slate-400 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 drop-shadow-sm">Regresar</span>
                    </div>
                </MenuItem>
            );
        }

        const iconSrc = generateCombinedSvgDataUrl(pendingCombination.toothId, types);

        return (
            <MenuItem
                key={id || (isCombined ? 'combined' : 'replace')}
                onMouseEnter={(e) => {
                    setHoveredMenuItem(label);
                    let previewFinal;
                    if (isCombined) {
                        previewFinal = id ? id : pendingCombination?.finalTypeStr;
                    } else {
                        previewFinal = pendingCombination?.newType;
                    }
                    if (previewFinal) setHoveredPreviewType(previewFinal);
                    setMousePos({ x: e.clientX, y: e.clientY });
                }}
                onMouseMove={(e) => setMousePos({ x: e.clientX, y: e.clientY })}
                onMouseLeave={() => {
                    setHoveredMenuItem(null);
                    setHoveredPreviewType(null);
                }}
                onItemClick={(e) => {
                    e.stopPropagation();


                    // if ('speechSynthesis' in window) {
                    //     window.speechSynthesis.speak(new SpeechSynthesisUtterance("Seleccionado " + label));
                    // }

                    // Calcular el tipo final dependiendo de si es combinado o reemplazo puro
                    let newFinalType;
                    if (isCombined) {
                        // Si hay un ID explícito de combinación manual (ej. root-canal+crown)
                        newFinalType = id ? id : pendingCombination.finalTypeStr;
                    } else {
                        // Reemplazar: solo el tratamiento nuevo
                        newFinalType = pendingCombination.newType;
                    }

                    setToothStates(prev => ({ ...prev, [pendingCombination.toothId]: newFinalType }));

                    if (INACTIVE_TYPES.includes(newFinalType)) {
                        cleanupBracketsForTooth(pendingCombination.toothId);
                    }

                    setSelectedToothType(pendingCombination.newType);
                    setRadialState(null);
                    setLevel2Open(false);
                    setPendingCombination(null);
                }}
            >
                <div className="group relative w-[80px] h-[80px] rounded-full flex flex-col items-center justify-center p-1 text-center bg-transparent shadow-none border border-transparent cursor-pointer hover:scale-105 hover:bg-slate-100/10 dark:hover:bg-slate-800/50 transition-transform">
                    <img
                        src={iconSrc}
                        alt={label}
                        draggable={false}
                        style={{ transform: `rotate(${customRotation}deg)` }}
                        className="w-4/5 h-4/5 object-contain drop-shadow-md select-none opacity-90 transition-opacity"
                    />


                </div>
            </MenuItem>
        );
    };

    const buildCombinationOptions = () => {
        if (!pendingCombination) return [];

        const { newType } = pendingCombination;
        let options = [];

        // 1. Mostrar las combinaciones dinámicas
        switch (newType) {
            case 'implant':
                options.push({ isCombined: true, types: ['implant', 'crown'], label: 'Implante + Corona', id: 'implant-crown' });
                break;
            case 'root-canal':
                options.push({ isCombined: true, types: ['root-canal', 'crown'], label: 'Endodoncia + Corona', id: 'root-canal+crown' });
                options.push({
                    isCombined: true,
                    types: ['root-canal', 'crown', 'fissure-crown'],
                    label: 'Endo + Corona + Fisura',
                    id: 'root-canal+crown+fissure-crown'
                });
                break;
            case 'crown':
                options.push({ isCombined: true, types: ['crown', 'fissure-root'], label: 'Corona + Fisura Raíz', id: 'crown+fissure-root' });
                options.push({ isCombined: true, types: ['crown', 'fissure-crown'], label: 'Corona + Fisura Corona', id: 'crown+fissure-crown' });
                options.push({ isCombined: true, types: ['crown', 'fissure-full'], label: 'Corona + Fisura Corona', id: 'crown+fissure-full' });
                break;
            default:
                // Fallback a comportamiento anterior para otros tratamientos combinables no listados
                options.push({ isCombined: true, types: pendingCombination.finalTypesArray, label: 'Combinar' });
                break;
        }

        // 2. Opción de Reemplazar (poner el tratamiento puro y sobreescribir)
        const replaceMatch = DENTAL_TYPES.find(t => t.id === newType);
        const replaceStr = replaceMatch ? `${replaceMatch.label}` : 'Reemplazar';
        options.push({ isCombined: false, types: [newType], label: replaceStr });

        // 3. Botón de regresar
        options.push({ isReturn: true, label: 'Regresar' });

        return options;
    };

    const combinationOptions = buildCombinationOptions();

    const handleResetOdontogram = () => {
        // 1. Reset Teeth to Initial State (all 'original')
        setToothStates(buildInitialToothStates());

        // 2. Clear all clinical overlays
        setBrackets({});
        setBracketWires({});
        setTads({});
        setTadWires({});
        setSurfaceStates({});
        setToothWidths({});
        setPeriodontalData({});

        // 3. Reset UI Modes
        setIsBracketMode(false);
        setIsTadMode(false);
        setIsPeriodontalMode(false);
        setSelectedToothType('original');
        setSelectedSurface(null); // Ensure no surface is selected
        // 4. Close Dialog
        setIsResetDialogOpen(false);
    };

    const displayToothStates = hoveredPreviewType && radialState?.toothId
        ? { ...toothStates, [radialState.toothId]: hoveredPreviewType }
        : toothStates;

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-1 space-y-6">
            {/* BLUR OVERLAY PARA TODA LA PAGINA CUANDO EL MENU ESTA ABIERTO */}
            {typeof document !== 'undefined' && createPortal(
                <AnimatePresence>
                    {radialState && (() => {
                        const customSize = RADIAL_MENU_CUSTOM_SIZES[radialState.toothId] || null;
                        const finalOffsetX = customSize?.offsetX || 0;
                        const finalOffsetY = customSize?.offsetY || 0;
                        const centerX = radialState.x + finalOffsetX;
                        const centerY = radialState.y + finalOffsetY;

                        return (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="fixed inset-0 z-[9990] backdrop-blur-[6px] bg-white/30 dark:bg-slate-900/40 pointer-events-none"
                                style={{
                                    maskImage: `radial-gradient(circle at ${centerX}px ${centerY}px, transparent 170px, black 65px)`,
                                    WebkitMaskImage: `radial-gradient(circle at ${centerX}px ${centerY}px, transparent 170px, black 65px)`
                                }}
                            />
                        );
                    })()}
                </AnimatePresence>,
                document.body
            )}

            {/* 1. Summary Section */}
            <DentalSummary toothStates={toothStates} />

            {/* 2. Odontogram Visualization */}
            <div className={`bg-white dark:bg-[var(--color-secondary)] border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm p-4 flex flex-col items-center relative overflow-hidden transition-colors 
                ${isBracketMode ? 'ring-2 ring-blue-500/20 border-blue-200 dark:border-blue-900/30' : ''}
                ${isTadMode ? 'ring-2 ring-sky-500/20 border-sky-200 dark:border-sky-900/30' : ''}
                ${isPeriodontalMode ? 'ring-2 ring-red-500/20 border-red-200 dark:border-red-900/30' : ''}
            `}>
                <div className="w-full mb-4 flex items-start justify-between z-10 relative gap-4">
                    <div>
                        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                            {!isBracketMode && "Odontograma Actual"}
                            {isBracketMode && <span className="badge badge-sm badge-info gap-1 font-normal">Modo Ortodoncia (Brackets)</span>}
                            {isTadMode && <span className="badge badge-sm badge-info gap-1 font-normal">Modo Ortodoncia (TADs)</span>}
                            {/* {isPeriodontalMode && <span className="badge badge-sm badge-error gap-1 font-normal">Bolsas Periodontales</span>} */}
                        </h2>
                        {!isBracketMode && <p className="text-sm text-slate-500 dark:text-slate-400">Vista general del estado dental del paciente.</p>}
                    </div>

                    {/* --- CONTROLES SUPERIORES (Checkboxes + Undo/Redo) --- */}
                    <div className="flex items-center gap-3 md:gap-4 flex-wrap justify-end relative z-10 w-full md:w-auto">

                        {/* Checkboxes de Modos y Botón Aplicar a Todos */}
                        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800/50 rounded-lg p-1 border border-slate-200 dark:border-slate-700 shadow-sm">
                            {/*  desactivado temporalmente jhasta quese tenga el priocedimiento bien
                            <ModeCheckbox label="Bolsas Periodontales" checked={isPeriodontalMode} onChange={(e) => setPeriodontalMode(e.target.checked)} color="red" /> 
                            */}
                            <ModeCheckbox label="Colocar TADs" checked={isTadMode} onChange={(e) => setTadMode(e.target.checked)} color="sky" />
                            <ModeCheckbox label="Colocar Brackets" checked={isBracketMode} onChange={(e) => setBracketMode(e.target.checked)} color="blue" />

                            <AnimatePresence>
                                {isBracketMode && (
                                    <div className="flex items-center gap-1.5 ml-1">
                                        <motion.button
                                            initial={{ opacity: 0, scale: 0.9, width: 0 }}
                                            animate={{ opacity: 1, scale: 1, width: 'auto' }}
                                            exit={{ opacity: 0, scale: 0.9, width: 0 }}
                                            onClick={handleApplyAllBrackets}
                                            type="button"
                                            className="px-3 py-1.5 rounded-md flex items-center gap-1.5 text-xs font-semibold transition-colors bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600 shadow-sm overflow-hidden whitespace-nowrap"
                                        >
                                            Aplicar a todos
                                        </motion.button>

                                        {selectedBracket && (
                                            <motion.button
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: -10 }}
                                                onClick={() => {
                                                    const isBroken = !!brackets[selectedBracket]?.isBroken;
                                                    setBrackets(prev => ({
                                                        ...prev,
                                                        [selectedBracket]: { ...prev[selectedBracket], isBroken: !isBroken }
                                                    }));
                                                }}
                                                type="button"
                                                className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 text-xs font-semibold transition-all border shadow-sm overflow-hidden whitespace-nowrap ${brackets[selectedBracket]?.isBroken
                                                    ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800'
                                                    : 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800'
                                                    }`}
                                            >
                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                                </svg>
                                                {brackets[selectedBracket]?.isBroken ? 'Reparar Bracket' : 'Bracket Roto'}
                                            </motion.button>
                                        )}
                                    </div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* --- PANEL DE CONTROL UNDO/REDO --- */}
                        <div className="flex flex-shrink-0 items-center bg-slate-100 dark:bg-slate-800/50 rounded-lg p-1 border border-slate-200 dark:border-slate-700 shadow-sm">
                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={handleUndo}
                                    onMouseEnter={() => setHoveredAction('undo')}
                                    onMouseLeave={() => setHoveredAction(null)}
                                    disabled={historyState.past.length === 0}
                                    className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 text-xs font-semibold transition-colors ${historyState.past.length === 0
                                        ? 'text-slate-400 dark:text-slate-600 cursor-not-allowed opacity-50'
                                        : 'text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 hover:shadow-sm'
                                        }`}
                                >
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
                                    </svg>
                                    Deshacer
                                </button>
                                <AnimatePresence>
                                    {hoveredAction === 'undo' && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 5 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: 5 }}
                                            className="
                                                absolute bottom-full left-1/2 -translate-x-1/2 mb-2
                                                px-2 py-1 rounded text-[10px] font-medium
                                                bg-slate-800 text-white shadow-xl whitespace-nowrap
                                                z-50
                                            "
                                        >
                                            Deshacer (Ctrl + Z)
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            <div className="w-px h-5 bg-slate-300 dark:bg-slate-600 mx-1"></div>

                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={handleRedo}
                                    onMouseEnter={() => setHoveredAction('redo')}
                                    onMouseLeave={() => setHoveredAction(null)}
                                    disabled={historyState.future.length === 0}
                                    className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 text-xs font-semibold transition-colors ${historyState.future.length === 0
                                        ? 'text-slate-400 dark:text-slate-600 cursor-not-allowed opacity-50'
                                        : 'text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 hover:shadow-sm'
                                        }`}
                                >
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 15l6-6m0 0l-6-6m6 6H9a6 6 0 000 12h3" />
                                    </svg>
                                    Rehacer
                                </button>
                                <AnimatePresence>
                                    {hoveredAction === 'redo' && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 5 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: 5 }}
                                            className="
                                                absolute bottom-full left-1/2 -translate-x-1/2 mb-2
                                                px-2 py-1 rounded text-[10px] font-medium
                                                bg-slate-800 text-white shadow-xl whitespace-nowrap
                                                z-50
                                            "
                                        >
                                            Rehacer (Ctrl + Y)
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="absolute inset-0 pointer-events-none opacity-5 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] dark:bg-[radial-gradient(#475569_1px,transparent_1px)] [background-size:20px_20px]"></div>

                {/* COORDINATE BASED LAYOUT CONTAINER */}
                {/* We use min-w-[950px] to ensure the fixed coordinates fit without wrapping, adding x-scroll if needed on small screens */}
                <div className={`relative ${radialState ? 'z-[50]' : 'z-0'} scale-100 xl:scale-110 transition-transform origin-top mt-4 mb-4 overflow-x-auto w-full flex justify-center`}>
                    <div className="relative min-w-[1000px] pb-4 isolate select-none">

                        {/* Labels */}
                        <div className="text-center mb-2 text-[15px] font-bold tracking-[0.2em] text-slate-600 dark:text-white uppercase select-none">
                            Superior (Maxilar)
                        </div>

                        {/* BLUR OVERLAY PARA EL ODONTOGRAMA CUANDO EL MENU ESTA ABIERTO */}
                        <AnimatePresence>
                            {radialState && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="absolute -inset-10 z-[50] backdrop-blur-[6px] pointer-events-none"
                                />
                            )}
                        </AnimatePresence>

                        {/* === UPPER ARCH === */}
                        <div className={`relative flex flex-col w-full ${radialState ? '' : 'isolate'}`}>
                            {/* CENTER DIVIDER */}
                            <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-px bg-slate-400 dark:bg-slate-700 z-0"></div>

                            {/* ROW 1: FRONTAL */}
                            <ArchRow
                                activeRadialTooth={radialState?.toothId}
                                teethIds={UPPER_ARCH_IDS}
                                toothStates={displayToothStates}
                                brackets={brackets}
                                bracketWires={bracketWires}
                                tadWires={tadWires}
                                selectedBracket={selectedBracket}
                                tads={tads}
                                periodontalData={periodontalData}
                                isBracketMode={isBracketMode}
                                isTadMode={isTadMode}
                                isPeriodontalMode={isPeriodontalMode}
                                periodontalUpperY={periodontalUpperY}
                                periodontalLowerY={periodontalLowerY}
                                periodontalUpperThickness={periodontalUpperThickness}
                                periodontalLowerThickness={periodontalLowerThickness}
                                onToothClick={handleToothClick}
                                onToothRightClick={handleToothRightClick}
                                onTadClick={handleTadClick}
                                currentClinicalAction={selectedToothType}
                                onToothResize={handleToothResize}
                                toothWidths={toothWidths}
                                baseToothWidths={baseToothWidths}
                                isUpper={true}
                                hoveredPreviewType={hoveredPreviewType}
                            />

                            {/* ROW 2: OCCLUSAL */}
                            <div className="border-b border-slate-400 dark:border-slate-700/50 w-full mb-0 pb-1 relative z-10">
                                <OcclusalArchRow
                                    activeRadialTooth={radialState?.toothId}
                                    teethIds={UPPER_ARCH_IDS}
                                    surfaceStates={surfaceStates}
                                    toothStates={displayToothStates}
                                    onSurfaceClick={handleSurfaceClick}
                                    toothWidths={toothWidths}
                                    baseToothWidths={baseToothWidths}
                                    isUpper={true}
                                />
                            </div>
                        </div>

                        {/* === LOWER ARCH === */}
                        <div className={`relative flex flex-col w-full ${radialState ? '' : 'isolate'}`}>
                            {/* CENTER DIVIDER */}
                            <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-px bg-slate-400 dark:bg-slate-700 z-0"></div>

                            {/* ROW 3: OCCLUSAL */}
                            <div className="w-full mt-0 pt-1 relative z-10">
                                <OcclusalArchRow
                                    activeRadialTooth={radialState?.toothId}
                                    teethIds={LOWER_ARCH_IDS}
                                    surfaceStates={surfaceStates}
                                    toothStates={displayToothStates}
                                    onSurfaceClick={handleSurfaceClick}
                                    toothWidths={toothWidths}
                                    baseToothWidths={baseToothWidths}
                                    isUpper={false}
                                />
                            </div>

                            {/* ROW 4: FRONTAL */}
                            <ArchRow
                                activeRadialTooth={radialState?.toothId}
                                teethIds={LOWER_ARCH_IDS}
                                toothStates={displayToothStates}
                                brackets={brackets}
                                bracketWires={bracketWires}
                                tadWires={tadWires}
                                selectedBracket={selectedBracket}
                                tads={tads}
                                periodontalData={periodontalData}
                                isBracketMode={isBracketMode}
                                isTadMode={isTadMode}
                                isPeriodontalMode={isPeriodontalMode}
                                periodontalUpperY={periodontalUpperY}
                                periodontalLowerY={periodontalLowerY}
                                periodontalUpperThickness={periodontalUpperThickness}
                                periodontalLowerThickness={periodontalLowerThickness}
                                onToothClick={handleToothClick}
                                onToothRightClick={handleToothRightClick}
                                onTadClick={handleTadClick}
                                currentClinicalAction={selectedToothType}
                                onToothResize={handleToothResize}
                                toothWidths={toothWidths}
                                baseToothWidths={baseToothWidths}
                                isUpper={false}
                                hoveredPreviewType={hoveredPreviewType}
                            />
                        </div>

                        {/* Labels */}
                        <div className="text-center mt-2 mb-15 text-[15px] font-bold tracking-[0.2em] text-slate-600 dark:text-white uppercase select-none">
                            Inferior (Mandíbula)
                        </div>

                        {/* Side Labels */}
                        <div className="absolute top-[50%] left-4 -translate-y-[220%] -rotate-90 text-[15px] font-bold tracking-[0.2em] text-slate-600 dark:text-white select-none transform-gpu">
                            DERECHO
                        </div>
                        <div className="absolute top-[50%] right-4 -translate-y-[200%] rotate-90 text-[15px] font-bold tracking-[0.2em] text-slate-600 dark:text-white select-none transform-gpu">
                            IZQUIERDO
                        </div>

                    </div>
                </div>
            </div>

            {/* 3. Actions Section */}
            <ActionPanel
                isBracketMode={isBracketMode}
                setBracketMode={setBracketMode}
                isTadMode={isTadMode}
                setTadMode={setTadMode}
                isPeriodontalMode={isPeriodontalMode}
                setPeriodontalMode={setPeriodontalMode}
                onApplyAll={handleApplyAllBrackets}
                selectedToothType={selectedToothType}
                setSelectedToothType={setSelectedToothType}
                onReset={() => {
                    console.log("[DEBUG] onReset triggered");
                    setIsResetDialogOpen(true);
                }}
                onOpenVoiceSettings={() => setIsVoiceModalOpen(true)}
                hasVoiceSupport={hasVoiceSupport}
                onSaveToElastics={handleSaveToElastics}
                savedToElastics={savedToElastics}
            />

            <ClinicalActionModal
                isOpen={!!selectedSurface}
                onClose={() => setSelectedSurface(null)}
                onSelect={handleClinicalAction}
            />

            <PeriodontalModal
                isOpen={!!activePeriodontalTooth}
                onClose={() => setActivePeriodontalTooth(null)}
                onSave={handlePeriodontalSave}
                toothId={activePeriodontalTooth}
                initialData={activePeriodontalTooth ? periodontalData[activePeriodontalTooth] : null}
            />

            {console.log("[DEBUG] ConfirmDialog render check:", isResetDialogOpen)}
            <ConfirmDialog
                open={isResetDialogOpen}
                title="Limpiar Odontograma"
                message="¿Estás seguro de que deseas limpiar todo el odontograma? Esta acción no se puede deshacer."
                confirmLabel="Sí, limpiar todo"
                cancelLabel="Cancelar"
                requiresDoubleConfirm={true}
                secondTitle="Confirmar limpieza"
                secondMessage="¿Estás completamente seguro de que deseas limpiar todo el odontograma? Esta acción no se puede deshacer."
                secondConfirmLabel="Sí, confirmo"
                onConfirm={handleResetOdontogram}
                onCancel={() => setIsResetDialogOpen(false)}
                variant="danger"
            />

            <AnimatePresence>
                {radialState && (
                    <motion.div
                        className="fixed inset-0 z-[9999]"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => {
                            setRadialState(null);
                            setLevel2Open(false);
                            setHoveredMenuItem(null);
                            setPendingCombination(null);
                            setHoveredPreviewType(null);
                        }}
                        onContextMenu={(e) => {
                            e.preventDefault();
                            setRadialState(null);
                            setLevel2Open(false);
                            setHoveredMenuItem(null);
                            setPendingCombination(null);
                            setHoveredPreviewType(null);
                        }}
                    >
                        {/* LEYENDA / INSTRUCCIONES */}
                        <div className={`absolute ${UPPER_ARCH_IDS.includes(radialState?.toothId) ? 'bottom-12' : 'top-12'} left-1/2 -translate-x-1/2 text-center whitespace-nowrap bg-white/80 dark:bg-slate-800/80 backdrop-blur-md px-6 py-3 rounded-2xl shadow-lg border border-slate-200/50 dark:border-slate-700/50 pointer-events-none z-[10000]`}>
                            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-1">Menú de Tratamientos</h3>
                            <p className="text-xs text-slate-600 dark:text-slate-300">Pasa el cursor para <span className="font-semibold text-blue-600 dark:text-blue-400">previsualizar</span> • Haz clic para <span className="font-semibold text-emerald-600 dark:text-emerald-400">aplicar</span></p>
                        </div>

                        <div className="menu-wrapper">
                            <div style={{ position: 'relative' }}>

                                {/* Nivel 1 (Todos los tratamientos) */}
                                {(() => {
                                    const customSize = radialState ? RADIAL_MENU_CUSTOM_SIZES[radialState.toothId] : null;
                                    const finalOffsetX = (customSize?.offsetX || 0);
                                    const finalOffsetY = (customSize?.offsetY || 0);

                                    return (
                                        <Menu
                                            centerX={radialState.x + finalOffsetX}
                                            centerY={radialState.y + finalOffsetY}
                                            innerRadius={radialState ? getRadialMenuSizes(radialState.toothId).level1.innerRadius : 78}
                                            outerRadius={radialState ? getRadialMenuSizes(radialState.toothId).level1.outerRadius : 250}
                                            show={!!radialState}
                                            animation={["fade", "scale", "rotate"]}
                                            animationTimeout={150}
                                            drawBackground={true}
                                        >
                                            {DENTAL_TYPES.filter(type => {
                                                if (type.id === 'extraction') return false;
                                                const adultMolars = [16, 17, 18, 26, 27, 28, 36, 37, 38, 46, 47, 48];
                                                if (adultMolars.includes(radialState?.toothId) && (type.id === 'deciduous' || type.id === 'pulpotomy')) {
                                                    return false;
                                                }
                                                return true;
                                            }).map(renderMenuItem)}
                                        </Menu>
                                    );
                                })()}

                                {/* Nivel 2 (Combinaciones Dinámicas) */}
                                {level2Open && pendingCombination && (() => {
                                    const customSize = radialState ? RADIAL_MENU_CUSTOM_SIZES[radialState.toothId] : null;
                                    const finalOffsetX = (customSize?.offsetX || 0);
                                    const finalOffsetY = (customSize?.offsetY || 0);

                                    return (
                                        <Menu
                                            centerX={radialState.x + finalOffsetX}
                                            centerY={radialState.y + finalOffsetY}
                                            innerRadius={radialState ? getRadialMenuSizes(radialState.toothId).level2.innerRadius : 185}
                                            outerRadius={radialState ? getRadialMenuSizes(radialState.toothId).level2.outerRadius : 299}
                                            show={true}
                                            animation={["fade", "scale", "rotate"]}
                                            animationTimeout={150}
                                            drawBackground={true}
                                        >
                                            {combinationOptions.map(renderCombinationItem)}
                                        </Menu>
                                    );
                                })()}

                                {/* Diente Clonado Preview en el centro del menú radial */}
                                {(() => {
                                    if (!radialState) return null;
                                    const customSize = RADIAL_MENU_CUSTOM_SIZES[radialState.toothId] || null;
                                    const finalOffsetX = customSize?.offsetX || 0;
                                    const finalOffsetY = customSize?.offsetY || 0;

                                    // NUEVO: Microajustes para centrar el diente visualmente dentro del circulo
                                    // Puedes modificar estos valores base para todos
                                    const basePreviewOffsetX = 0;
                                    const basePreviewOffsetY = 10; // Ajustamos hacia arriba por el espacio del número

                                    // Si quieres ajustes específicos por diente, agrégalos a RADIAL_MENU_CUSTOM_SIZES
                                    const previewOffsetX = basePreviewOffsetX + (customSize?.previewOffsetX || 0);
                                    const previewOffsetY = basePreviewOffsetY + (customSize?.previewOffsetY || 0);

                                    const id = radialState.toothId;
                                    const isUpper = UPPER_ARCH_IDS.includes(id);

                                    return (
                                        <div
                                            className="absolute pointer-events-none drop-shadow-2xl z-[9000]"
                                            style={{
                                                left: radialState.x + finalOffsetX + previewOffsetX,
                                                top: radialState.y + finalOffsetY + previewOffsetY,
                                                transform: 'translate(-50%, -50%) scale(1.15)',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}
                                        >
                                            {isPeriodontalMode && periodontalData && periodontalData[id] && (
                                                <div className="absolute top-0 bottom-0 left-0 right-0 pointer-events-none z-10 w-full h-full">
                                                    <PeriodontalOverlay data={periodontalData[id]} isUpper={isUpper} toothId={id} />
                                                </div>
                                            )}
                                            <Tooth
                                                id={id}
                                                type={displayToothStates[id]}
                                                hasBracket={!!brackets[id]}
                                                isSelectedBracket={false}
                                                isBracketMode={false}
                                                onToothClick={() => { }}
                                                onToothRightClick={() => { }}
                                                currentClinicalAction={null}
                                                onResize={() => { }}
                                                hideLabel={true}
                                                hoveredPreviewType={hoveredPreviewType}
                                            />
                                        </div>
                                    );
                                })()}

                                {/* Tooltip en el centro del Menú Radial (Movido al final para z-index real) */}
                                <AnimatePresence>
                                    {hoveredMenuItem && (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.8 }}
                                            transition={{ duration: 0.15 }}
                                            className="fixed pointer-events-none flex items-center justify-center"
                                            style={{
                                                zIndex: 99999, // Asegurar un z-index extremadamente alto
                                                left: mousePos.x,
                                                top: mousePos.y - 15, // Ligero offset hacia arriba
                                                transform: 'translate(-50%, -100%)', // Centrado horizontalmente y anclado por su borde inferior
                                                whiteSpace: 'nowrap'
                                            }}
                                        >
                                            <span className="bg-slate-800/90 dark:bg-slate-700/90 backdrop-blur-sm text-white text-[11px] font-bold px-3 py-1.5 rounded-lg shadow-xl text-center leading-tight drop-shadow-2xl">
                                                {DENTAL_TYPES.find(t => t.id === hoveredMenuItem)?.label || hoveredMenuItem}
                                            </span>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Voice Settings Modal */}
            {hasVoiceSupport && (
                <VoiceSettingsModal
                    isOpen={isVoiceModalOpen}
                    onClose={() => setIsVoiceModalOpen(false)}
                    onSettingsChange={(settings) => setVoiceSettings(settings)}
                />
            )}
        </motion.div>
    );
}
