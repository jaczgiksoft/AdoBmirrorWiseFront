// ==========================================
// Asset Loading & Helpers for Odontogram SVGs
// ==========================================

// Load all tooth SVGs from all subfolders (original, root-canal, etc.) as image URLs
export const toothImages = import.meta.glob('@/assets/images/odontogram/**/*.svg', {
    eager: true,
    as: 'url'
});

// Load the raw SVG string for generating dynamic custom SVGs without CSS conflicts
export const toothRawSvgs = import.meta.glob('@/assets/images/odontogram/**/*.svg', {
    eager: true,
    query: '?raw',
    import: 'default'
});

// Helper to get raw SVG strings
export const getToothRaw = (id, type) => {
    const specificTypeEntry = Object.entries(toothRawSvgs).find(([path]) =>
        path.includes(`/odontogram/${type}/tooth-${id}.svg`)
    );
    if (specificTypeEntry) return specificTypeEntry[1];

    const originalEntry = Object.entries(toothRawSvgs).find(([path]) =>
        path.includes(`/odontogram/original/tooth-${id}.svg`)
    );
    return originalEntry ? originalEntry[1] : null;
};

// Helper to get image src by Tooth ID and Type
export const getToothSrc = (id, type) => {
    // Try to find the specific type first
    const specificTypeEntry = Object.entries(toothImages).find(([path]) =>
        path.includes(`/odontogram/${type}/tooth-${id}.svg`)
    );

    if (specificTypeEntry) return specificTypeEntry[1];

    // Fallback to original if not found
    const originalEntry = Object.entries(toothImages).find(([path]) =>
        path.includes(`/odontogram/original/tooth-${id}.svg`)
    );

    return originalEntry ? originalEntry[1] : null;
};

export const getBaseSvgType = (types) => {
    const priority = [
        'crown',
        'root-canal',
        'fissure-root',
        'fissure-crown',
        'fissure-full',
        'implant'
    ];

    for (const type of priority) {
        if (types.includes(type)) {
            return type;
        }
    }

    return types[0];
};

// Encapsulated function to create a Combined SVG data URL containing BOTH implant and crown
export const generateCombinedSvgDataUrl = (id, types = []) => {

    if (!types || types.length === 0) {
        types = ['implant', 'crown'];
    }

    types = [...new Set(types)];

    try {
        const parser = new DOMParser();
        const serializer = new XMLSerializer();
        const docs = {};

        // Parse all requested SVGs
        types.forEach(type => {
            const raw = getToothRaw(id, type);
            if (raw) {
                docs[type] = parser.parseFromString(raw, "image/svg+xml");
            }
        });

        const baseType = getBaseSvgType(types);
        const baseDoc = docs[baseType];
        if (!baseDoc) return getToothSrc(id, baseType);

        // 🔥 CLAVE: usar el SVG base real
        const newSvg = baseDoc.documentElement.cloneNode(true);

        // Buscar el grupo principal
        const mainGroup = newSvg.querySelector('g');
        if (!mainGroup) return getToothSrc(id, baseType);

        // Limpiar contenido interno (pero mantener estructura)
        mainGroup.innerHTML = '';

        // Helper
        const getEl = (doc, selector) =>
            doc?.querySelector(selector)?.cloneNode(true);

        const extractCrownElements = (crownDoc) => {
            const group = crownDoc.querySelector('g[id="crown"], g[id="Crown"]');
            let elements = [];

            if (group) {
                elements = Array.from(group.children).filter(el => {
                    const tagId = (el.getAttribute('id') || '').toLowerCase();
                    return el.tagName.toLowerCase() !== 'metadata' &&
                        !tagId.includes('root') &&
                        !tagId.includes('outline');
                });
            }

            if (elements.length === 0) {
                elements = Array.from(crownDoc.querySelectorAll('*')).filter(el => {
                    const tagId = (el.getAttribute('id') || '').toLowerCase();
                    return /^crown[_\d]*$/.test(tagId) &&
                        el.tagName.toLowerCase() !== 'g' &&
                        el.tagName.toLowerCase() !== 'metadata';
                });
            }

            return elements.map(el => el.cloneNode(true));
        };

        const hasImplant = types.includes('implant');
        const hasRootCanal = types.includes('root-canal');
        const hasCrown = types.includes('crown');
        const hasFissureRoot = types.includes('fissure-root');
        const hasFissureFull = types.includes('fissure-full');
        const hasFissureCrown = types.includes('fissure-crown');

        // =====================================================
        // DIRECT ASSET LOADING FOR SPECIFIC COMBINATIONS
        // =====================================================
        if (hasImplant && hasCrown) {
            return getToothSrc(id, 'combinations/implant+crown');
        } else if (hasRootCanal && hasFissureCrown) {
            return getToothSrc(id, 'combinations/root-canal+fissure-crown');
        } else if (hasRootCanal && hasCrown) {
            return getToothSrc(id, 'combinations/root-canal+crown');
        }

        // =====================================================
        // CONSTRUCCIÓN DINÁMICA DE SVG
        // =====================================================

        // 2. crown + fissure-root
        // root → crown → fil2
        if (hasCrown && hasFissureRoot) {

            const root = getEl(docs['fissure-root'], '#root');
            const crownElements = extractCrownElements(docs['crown']);
            const outline = getEl(docs['fissure-root'], '.fil2') ||
                getEl(docs['fissure-root'], '#outline');

            root && mainGroup.appendChild(root);
            crownElements.forEach(el => mainGroup.appendChild(el));
            outline && mainGroup.appendChild(outline);
        }

        // =====================================================
        // crown + fissure-full o fissure-crown
        // root → crown → outline
        // =====================================================
        else if (hasCrown && (hasFissureFull || hasFissureCrown)) {

            const fissureType = hasFissureFull ? 'fissure-full' : 'fissure-crown';

            const root = getEl(docs[fissureType], '#root') || getEl(docs[fissureType], '#Root');
            const crownElements = extractCrownElements(docs['crown']);
            const outline = getEl(docs[fissureType], '#outline') || getEl(docs[fissureType], '#Outline') || getEl(docs[fissureType], '.fil2');

            root && mainGroup.appendChild(root);
            crownElements.forEach(el => mainGroup.appendChild(el));
            outline && mainGroup.appendChild(outline);
        }

        // =====================================================
        // Fallback
        // =====================================================
        else {
            const originalChildren = Array.from(
                docs[baseType].querySelector('g').children
            );

            originalChildren.forEach(el => {
                mainGroup.appendChild(el.cloneNode(true));
            });
        }

        let svgString = serializer.serializeToString(newSvg);
        svgString = svgString.replace(/xmlns:xmlns="[^"]+"/g, '');

        const encoded = encodeURIComponent(svgString)
            .replace(/'/g, "%27")
            .replace(/"/g, "%22");

        return `data:image/svg+xml;utf8,${encoded}`;

    } catch (err) {
        console.error("Error formatting combined SVG:", err);
        return getToothSrc(id, types[0] || 'implant');
    }
};
