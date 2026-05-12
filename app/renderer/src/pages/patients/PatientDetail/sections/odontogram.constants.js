
// ==========================================
// Odontogram Constants & Configuration
// ==========================================

export const TEETH_TO_SCALE = [
    18, 17, 16,
    26, 27, 28,
    36, 37, 38,
    46, 47, 48
];

// ==========================================
// CONFIGURACIÓN DE BRACKETS ESPECIALES
// ==========================================
export const BRACKET_HOOK_CONFIG = {
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

export const INACTIVE_TYPES = ['extraction', 'missing', 'unerupted'];

// DEFAULT_ATTACHMENT: coordenadas relativas al punto de anclaje del diente
// x: desplazamiento horizontal desde el centro del diente
// y: desplazamiento vertical desde el punto de anclaje (0 = en el borde de la corona)
// width/height: tamaño en px del rectángulo
// rotation: grados de rotación (0 = horizontal)
export const DEFAULT_ATTACHMENT = { x: 0, y: 0, width: 8, height: 4, rotation: 0 };
export const ATTACHMENTS_INITIAL_CONFIG = {};
export const ATTACHMENT_CUSTOM_CONFIG = {
    // Aquí puedes personalizar la posición y tamaño por diente.
    // x: desplazamiento horizontal (px, 0 = centrado en el diente)
    // y: desplazamiento vertical desde el ancla (px, positivo = hacia abajo)
    // width: ancho del rectángulo en px
    // height: alto del rectángulo en px
    // rotation: rotación en grados
    //
    // Ejemplo: 11: { x: 0, y: 2, width: 8, height: 4 },
    11: { x: 0, y: 0, width: 8, height: 4 },
    12: { x: 0, y: 0, width: 8, height: 4 },
    13: { x: 0, y: 0, width: 8, height: 4 },
    14: { x: 0, y: 0, width: 8, height: 4 },
    15: { x: 0, y: 0, width: 8, height: 4 },
    16: { x: 0, y: 0, width: 8, height: 4 },
    17: { x: 0, y: 0, width: 8, height: 4 },
    18: { x: 0, y: 0, width: 8, height: 4 },
    21: { x: 0, y: 0, width: 8, height: 4 },
    22: { x: 0, y: 0, width: 8, height: 4 },
    23: { x: 0, y: 0, width: 8, height: 4 },
    24: { x: 0, y: 0, width: 8, height: 4 },
    25: { x: 0, y: 0, width: 8, height: 4 },
    26: { x: 0, y: 0, width: 8, height: 4 },
    27: { x: 0, y: 0, width: 8, height: 4 },
    28: { x: 0, y: 0, width: 8, height: 4 },
    31: { x: 0, y: 15, width: 8, height: 4 },
    32: { x: 0, y: 15, width: 8, height: 4 },
    33: { x: 0, y: 15, width: 8, height: 4 },
    34: { x: 0, y: 15, width: 8, height: 4 },
    35: { x: 0, y: 15, width: 8, height: 4 },
    36: { x: 0, y: 15, width: 8, height: 4 },
    37: { x: 0, y: 15, width: 8, height: 4 },
    38: { x: 0, y: 15, width: 8, height: 4 },
    41: { x: 0, y: 15, width: 8, height: 4 },
    42: { x: 0, y: 15, width: 8, height: 4 },
    43: { x: 0, y: 15, width: 8, height: 4 },
    44: { x: 0, y: 15, width: 8, height: 4 },
    45: { x: 0, y: 15, width: 8, height: 4 },
    46: { x: 0, y: 15, width: 8, height: 4 },
    47: { x: 0, y: 15, width: 8, height: 4 },
    48: { x: 0, y: 15, width: 8, height: 4 },
};

export const DENTAL_TYPES = [
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

export const RADIAL_MENU_DEFAULT_SIZES = {
    level1: { innerRadius: 78, outerRadius: 250 },
    level2: { innerRadius: 185, outerRadius: 299 }
};

// Apartado de código para poder indicar qué diente es y pasar los valores para ajustarlos
// Ejemplo: { 18: { level1: { innerRadius: 90, outerRadius: 260 }, level2: { innerRadius: 195, outerRadius: 310 } } }
export const RADIAL_MENU_CUSTOM_SIZES = {
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

export const OCCLUSAL_TYPES = [
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
 */
export const TOOTH_COORDINATES = {
    // Upper Right (Q1) - Compact Clinical Spacing (Touching)
    11: -30, 12: -70, 13: -110, 14: -153, 15: -195, 16: -245, 17: -300, 18: -358,
    // Upper Left (Q2)
    21: 30, 22: 70, 23: 110, 24: 153, 25: 195, 26: 245, 27: 300, 28: 358,
    // Lower Left (Q3)
    31: 23, 32: 68, 33: 108, 34: 151, 35: 195, 36: 246, 37: 297, 38: 349,
    // Lower Right (Q4)
    41: -23, 42: -68, 43: -108, 44: -151, 45: -195, 46: -246, 47: -297, 48: -349,
};

/**
 * ANATOMICAL MICRO-ADJUSTMENTS
 */
export const MICRO_ADJUSTMENTS_PERMANENT = {
    // UPPER ARCH
    12: -3, 13: -3, 14: -3, 15: -3, 16: -3, 17: -6, 18: -6,
    22: 3, 23: 3, 24: 3, 25: 3, 26: 3, 27: 6, 28: 6,

    // LOWER ARCH
    42: 9, 43: 10, 44: 10, 45: 9, 46: 6, 47: -3, 48: -8,
    32: -9, 33: -10, 34: -10, 35: -9, 36: -6, 37: 3, 38: 8
};

export const MICRO_ADJUSTMENTS_DECIDUOUS = {
    // UPPER RIGHT (Q1)
    11: -0,
    12: -3,
    13: -4,
    14: -5,
    15: -6,

    // UPPER LEFT (Q2)
    21: 0,
    22: 3,
    23: 4,
    24: 5,
    25: 6,

    // LOWER LEFT (Q3)
    31: -3,
    32: -10,
    33: -12,
    34: -7,
    35: -4,

    // LOWER RIGHT (Q4)
    41: 3,
    42: 10,
    43: 12,
    44: 7,
    45: 4,
};

export const TAD_MICRO_ADJUSTMENTS = {
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

export const TAD_CUSTOM_CONFIG = {
    "12-13": { scale: 1.2 },
    "11-12": { scale: 0.9 },
};

export const QUADRANTS = {
    q1: [18, 17, 16, 15, 14, 13, 12, 11],
    q2: [21, 22, 23, 24, 25, 26, 27, 28],
    q3: [31, 32, 33, 34, 35, 36, 37, 38],
    q4: [48, 47, 46, 45, 44, 43, 42, 41]
};

// Helpers for Arch Groups
export const UPPER_ARCH_IDS = [...QUADRANTS.q1, ...QUADRANTS.q2]; // 18...28
export const LOWER_ARCH_IDS = [...QUADRANTS.q4, ...QUADRANTS.q3]; // 48...38

// Derived Initial State Generator (Factory Function)
export const buildInitialToothStates = () => {
    const initial = {};
    Object.values(QUADRANTS).flat().forEach(id => {
        initial[id] = 'original';
    });
    return initial;
};

// Helper para obtener los tamaños según el diente actual
export const getRadialMenuSizes = (toothId) => {
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

export const RADIAL_MENU_CUSTOM_ROTATION = {
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

/**
 * Periodontal Overlay Position Configuration Helper
 */
export const getToothPositionConfig = (isUpper) => {
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

    return {
        // --- MAXILAR (SUPERIOR) ---
        18: buildConfig('left-[22%]', 'right-[22%]', 'left-[12%]', 'right-[12%]'),
        17: buildConfig('left-[22%]', 'right-[22%]', 'left-[12%]', 'right-[12%]'),
        16: buildConfig('left-[22%]', 'right-[22%]', 'left-[12%]', 'right-[12%]'),
        15: buildConfig('left-[20%]', 'right-[20%]', 'left-[-5%]', 'right-[-5%]'),
        14: buildConfig('left-[20%]', 'right-[20%]', 'left-[-5%]', 'right-[-5%]'),
        13: buildConfig('left-[15%]', 'right-[15%]', 'left-[-2%]', 'right-[1%]'),
        12: buildConfig('left-[15%]', 'right-[10%]', 'left-[-11%]', 'right-[-11%]'),
        11: buildConfig('left-[15%]', 'right-[10%]', 'left-[0%]', 'right-[0%]'),
        21: buildConfig('left-[15%]', 'right-[10%]', 'left-[0%]', 'right-[0%]'),
        22: buildConfig('left-[15%]', 'right-[10%]', 'left-[-11%]', 'right-[-11%]'),
        23: buildConfig('left-[15%]', 'right-[15%]', 'left-[-2%]', 'right-[-1%]'),
        24: buildConfig('left-[20%]', 'right-[20%]', 'left-[-5%]', 'right-[-5%]'),
        25: buildConfig('left-[20%]', 'right-[20%]', 'left-[-5%]', 'right-[-5%]'),
        26: buildConfig('left-[22%]', 'right-[22%]', 'left-[12%]', 'right-[12%]'),
        27: buildConfig('left-[22%]', 'right-[22%]', 'left-[12%]', 'right-[12%]'),
        28: buildConfig('left-[22%]', 'right-[22%]', 'left-[12%]', 'right-[12%]'),

        // --- MANDÍBULA (INFERIOR) ---
        48: buildConfig('left-[22%]', 'right-[22%]', 'left-[12%]', 'right-[12%]'),
        47: buildConfig('left-[22%]', 'right-[22%]', 'left-[12%]', 'right-[12%]'),
        46: buildConfig('left-[22%]', 'right-[22%]', 'left-[12%]', 'right-[12%]'),
        45: buildConfig('left-[20%]', 'right-[20%]', 'left-[-5%]', 'right-[-5%]'),
        44: buildConfig('left-[20%]', 'right-[20%]', 'left-[-2%]', 'right-[-2%]'),
        43: buildConfig('left-[15%]', 'right-[15%]', 'left-[-2%]', 'right-[-2%]'),
        42: buildConfig('left-[15%]', 'right-[10%]', 'left-[-9%]', 'right-[-9%]'),
        41: buildConfig('left-[15%]', 'right-[10%]', 'left-[-8%]', 'right-[-8%]'),
        31: buildConfig('left-[15%]', 'right-[10%]', 'left-[-8%]', 'right-[-8%]'),
        32: buildConfig('left-[15%]', 'right-[10%]', 'left-[-9%]', 'right-[-9%]'),
        33: buildConfig('left-[15%]', 'right-[15%]', 'left-[-2%]', 'right-[-2%]'),
        34: buildConfig('left-[20%]', 'right-[20%]', 'left-[-2%]', 'right-[-2%]'),
        35: buildConfig('left-[20%]', 'right-[20%]', 'left-[-5%]', 'right-[-5%]'),
        36: buildConfig('left-[22%]', 'right-[22%]', 'left-[12%]', 'right-[12%]'),
        37: buildConfig('left-[22%]', 'right-[22%]', 'left-[12%]', 'right-[12%]'),
        38: buildConfig('left-[22%]', 'right-[22%]', 'left-[12%]', 'right-[12%]'),
    };
};
