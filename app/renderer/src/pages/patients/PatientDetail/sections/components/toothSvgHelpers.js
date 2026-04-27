// ==========================================
// Asset Loading & Helpers for Odontogram SVGs
// ==========================================

const svgCache = new Map();
const parsedDocCache = new Map();
const globalParser = new DOMParser();
const globalSerializer = new XMLSerializer();

// Load all tooth SVGs from all subfolders (original, root-canal, etc.) as image URLs
export const toothImages = import.meta.glob('@/assets/images/odontogram/**/*.svg', {

    as: 'url'
});

// Load the raw SVG string for generating dynamic custom SVGs without CSS conflicts
export const toothRawSvgs = import.meta.glob('@/assets/images/odontogram/**/*.svg', {

    query: '?raw',
    import: 'default'
});

// ⚡ O(1) Indexing for Paths
const buildIndex = (globObj) => {
    const index = new Map();
    for (const [path, value] of Object.entries(globObj)) {
        const match = path.match(/\/odontogram\/(.+)\/tooth-(\d+)\.svg/);
        if (match) {
            const type = match[1];
            const id = match[2];
            index.set(`${id}:${type}`, value);
        }
    }
    return index;
};

const rawIndex = buildIndex(toothRawSvgs);
const srcIndex = buildIndex(toothImages);

// Helper to get raw SVG strings
export const getToothRaw = async (id, type) => {
    const loader =
        rawIndex.get(`${id}:${type}`) ||
        rawIndex.get(`${id}:original`);

    if (!loader) return null;

    return await loader();
};

// Helper to get image src by Tooth ID and Type
export const getToothSrc = async (id, type) => {
    const loader =
        srcIndex.get(`${id}:${type}`) ||
        srcIndex.get(`${id}:original`);

    if (!loader) return null;

    return await loader();
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

// Caches parsed documents to avoid re-parsing identical raw SVGs
const getParsedDoc = async (id, type) => {
    const key = `${id}:${type}`;

    if (parsedDocCache.has(key)) {
        return parsedDocCache.get(key);
    }

    const raw = await getToothRaw(id, type);
    if (!raw) return null;

    if (parsedDocCache.size > 30) {
        const firstKey = parsedDocCache.keys().next().value;
        parsedDocCache.delete(firstKey);
    }

    const doc = globalParser.parseFromString(raw, "image/svg+xml");
    parsedDocCache.set(key, doc);

    return doc;
};

export const cleanupOdontogramCache = () => {
    svgCache.forEach(url => {
        if (url && url.startsWith('blob:')) {
            URL.revokeObjectURL(url);
        }
    });
    svgCache.clear();
    parsedDocCache.clear();
};

const addBlobToCache = (cacheKey, svgString) => {
    if (svgCache.size > 150) {
        const firstKey = svgCache.keys().next().value;
        const url = svgCache.get(firstKey);

        if (url?.startsWith('blob:')) {
            URL.revokeObjectURL(url);
        }

        svgCache.delete(firstKey);
    }
    const blob = new Blob([svgString], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    svgCache.set(cacheKey, url);
    return url;
};

// Encapsulated function to create a Combined SVG data URL containing BOTH implant and crown
export const generateCombinedSvgDataUrl = async (id, types = []) => {
    if (!types || types.length === 0) {
        types = ['implant', 'crown'];
    }

    types = Array.isArray(types) ? [...new Set(types)].sort() : [];

    // 🔑 KEY DE CACHE
    const cacheKey = `${id}:${types.join('+')}`;

    if (svgCache.has(cacheKey)) {
        return svgCache.get(cacheKey);
    }

    try {
        const docs = {};

        await Promise.all(
            types.map(async (type) => {
                const doc = await getParsedDoc(id, type);
                if (doc) {
                    docs[type] = doc;
                }
            })
        );

        const baseType = getBaseSvgType(types);
        const baseDoc = docs[baseType];

        if (!baseDoc) {
            const fallback = await getToothSrc(id, baseType);
            if (fallback) {
                svgCache.set(cacheKey, fallback);
            }
            return fallback;
        }

        const newSvg = baseDoc.documentElement.cloneNode(true);
        const mainGroup = newSvg.querySelector('g');

        if (!mainGroup) {
            const fallback = await getToothSrc(id, baseType);
            if (fallback) {
                svgCache.set(cacheKey, fallback);
            }
            return fallback;
        }

        mainGroup.innerHTML = '';

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

        // ⚡ combinaciones directas (NO calcular)
        if (hasImplant && hasCrown) {
            const result = await getToothSrc(id, 'combinations/implant+crown');
            svgCache.set(cacheKey, result);
            return result;
        }

        if (hasRootCanal && hasFissureCrown) {
            const result = await getToothSrc(id, 'combinations/root-canal+fissure-crown');
            svgCache.set(cacheKey, result);
            return result;
        }

        if (hasRootCanal && hasCrown) {
            const result = await getToothSrc(id, 'combinations/root-canal+crown');
            svgCache.set(cacheKey, result);
            return result;
        }

        // 🔧 construcción dinámica
        if (hasCrown && hasFissureRoot) {
            const root = getEl(docs['fissure-root'], '#root');
            const crownElements = extractCrownElements(docs['crown']);
            const outline = getEl(docs['fissure-root'], '.fil2') ||
                getEl(docs['fissure-root'], '#outline');

            root && mainGroup.appendChild(root);
            crownElements.forEach(el => mainGroup.appendChild(el));
            outline && mainGroup.appendChild(outline);
        } else if (hasCrown && (hasFissureFull || hasFissureCrown)) {
            const fissureType = hasFissureFull ? 'fissure-full' : 'fissure-crown';

            const root = getEl(docs[fissureType], '#root') || getEl(docs[fissureType], '#Root');
            const crownElements = extractCrownElements(docs['crown']);
            const outline = getEl(docs[fissureType], '#outline') ||
                getEl(docs[fissureType], '#Outline') ||
                getEl(docs[fissureType], '.fil2');

            root && mainGroup.appendChild(root);
            crownElements.forEach(el => mainGroup.appendChild(el));
            outline && mainGroup.appendChild(outline);
        } else {
            const originalChildren = Array.from(
                docs[baseType].querySelector('g').children
            );

            originalChildren.forEach(el => {
                mainGroup.appendChild(el.cloneNode(true));
            });
        }

        let svgString = globalSerializer.serializeToString(newSvg);
        svgString = svgString.replace(/xmlns:xmlns="[^"]+"/g, '');

        // 💾 guardar en cache como Blob URL (mucho más rápido en memoria)
        return addBlobToCache(cacheKey, svgString);

    } catch (err) {
        console.error("Error formatting combined SVG:", err);
        return await getToothSrc(id, types[0] || 'implant');
    }
};