import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
    Folder,
    X,
    Maximize2,
    Camera,
    FileImage,
    ArrowLeft,
    Image as ImageIcon,
    CheckCircle2,
    Search
} from 'lucide-react';
import ImageLightbox from './ImageLightbox';

const MANDATORY_KEYS = [
    { key: 'facial_front', label: 'Facial Front' },
    { key: 'facial_smiling', label: 'Facial Smiling' },
    { key: 'facial_profile', label: 'Facial Profile' },
    { key: 'occlusal_upper', label: 'Occlusal Upper' },
    { key: 'occlusal_lower', label: 'Occlusal Lower' },
    { key: 'intraoral_left', label: 'Intraoral Left' },
    { key: 'intraoral_center', label: 'Intraoral Center' },
    { key: 'intraoral_right', label: 'Intraoral Right' },
];

export default function GalleryViewer({ collections, initialCollectionId, onClose }) {
    // --- STATE ---
    const [currentIndex, setCurrentIndex] = useState(() => {
        const idx = collections.findIndex(c => c.id === initialCollectionId);
        return idx >= 0 ? idx : 0;
    });

    const [lightboxIndex, setLightboxIndex] = useState(null);
    const [sidebarSearch, setSidebarSearch] = useState('');
    const sidebarRef = useRef(null);

    const currentCollection = collections[currentIndex];

    // --- FILTERED SIDEBAR LIST ---
    const filteredSidebarCollections = useMemo(() => {
        if (!sidebarSearch.trim()) return collections;
        return collections.filter(c =>
            c.name.toLowerCase().includes(sidebarSearch.toLowerCase())
        );
    }, [collections, sidebarSearch]);

    // --- KEYBOARD NAVIGATION (COLLECTION) ---
    useEffect(() => {
        const handleKeyDown = (e) => {
            // Only handle keys if lightbox is NOT open
            if (lightboxIndex !== null) return;

            if (e.key === 'Escape') onClose();
            if (e.key === 'ArrowLeft') handlePrev();
            if (e.key === 'ArrowRight') handleNext();
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [currentIndex, lightboxIndex, onClose]);

    // Scroll active item into view in sidebar
    useEffect(() => {
        if (sidebarRef.current) {
            const activeItem = sidebarRef.current.querySelector(`[data-index="${currentIndex}"]`);
            if (activeItem) {
                activeItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        }
    }, [currentIndex]);

    // --- FILTER CONFIG & STATE ---
    const FILTER_CATEGORIES = {
        ALL: { label: 'Todos', keys: [] },
        FACIAL: { label: 'Facial', keys: ['facial_front', 'facial_smiling', 'facial_profile'] },
        OCCLUSAL: { label: 'Oclusal', keys: ['occlusal_upper', 'occlusal_lower'] },
        INTRAORAL: { label: 'Intraoral', keys: ['intraoral_left', 'intraoral_center', 'intraoral_right'] },
        XRAY: { label: 'Radiografías', keys: [], type: 'xray' }
    };

    const [activeCategory, setActiveCategory] = useState('ALL');
    const [activeSpecific, setActiveSpecific] = useState(null); // specific key or index

    // Reset specific filter when category changes
    const handleCategoryChange = (cat) => {
        setActiveCategory(cat);
        setActiveSpecific(null);
    };

    // --- VISIBILITY LOGIC ---
    const visibleKeys = useMemo(() => {
        if (activeCategory === 'ALL') return MANDATORY_KEYS.map(k => k.key);
        if (FILTER_CATEGORIES[activeCategory].type === 'xray') return [];
        return FILTER_CATEGORIES[activeCategory].keys;
    }, [activeCategory]);

    const showClinical = activeCategory !== 'XRAY';
    const showXrays = activeCategory === 'ALL' || activeCategory === 'XRAY';

    // Helper to check if a specific image is visible
    const isPhotoVisible = (key) => {
        // If specific filter is active, only show that one
        if (activeSpecific && activeSpecific !== key) return false;
        // Otherwise check category visibility
        return visibleKeys.includes(key);
    };

    const isXrayVisible = (idx) => {
        const xrayKey = `xray_${idx}`;
        if (activeSpecific && activeSpecific !== xrayKey) return false;
        return true;
    };

    // --- SUB-FILTERS (Specific Chips) ---
    const subFilters = useMemo(() => {
        if (activeCategory === 'ALL') return [];

        if (activeCategory === 'XRAY') {
            // Generate chips for existing X-rays
            return (currentCollection?.photos?.x_rays || []).map((_, idx) => ({
                key: `xray_${idx}`,
                label: `Radiografía ${idx + 1}`
            }));
        }

        // For clinical categories
        return MANDATORY_KEYS
            .filter(k => FILTER_CATEGORIES[activeCategory].keys.includes(k.key))
            .map(k => ({ key: k.key, label: k.label }));
    }, [activeCategory, currentCollection]);


    // --- ACTIONS ---
    const handleNext = () => {
        if (currentIndex < collections.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setActiveCategory('ALL'); // Reset filter on change? Or keep it? Keeping logic simple for now.
            setActiveSpecific(null);
        }
    };

    const handlePrev = () => {
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
            setActiveCategory('ALL');
            setActiveSpecific(null);
        }
    };

    // --- FLATTEN IMAGES FOR LIGHTBOX ---
    const lightboxImages = useMemo(() => {
        if (!currentCollection) return [];

        const images = [];

        // Add mandatory images
        MANDATORY_KEYS.forEach(({ key, label }) => {
            if (currentCollection.photos[key]) {
                images.push({
                    url: currentCollection.photos[key],
                    label: label
                });
            }
        });

        // Add X-Rays
        if (currentCollection.photos.x_rays) {
            currentCollection.photos.x_rays.forEach((url, idx) => {
                images.push({
                    url: url,
                    label: `Radiografía ${idx + 1}`
                });
            });
        }

        return images;
    }, [currentCollection]);

    // Find the lightbox index for a specific image URL to open it correctly
    const openLightbox = (url) => {
        const idx = lightboxImages.findIndex(img => img.url === url);
        if (idx >= 0) setLightboxIndex(idx);
    };

    if (!currentCollection) return null;

    return (
        <div className="absolute inset-0 z-50 bg-white dark:bg-slate-900 flex flex-col animate-in fade-in duration-200">
            {/* --- HEADER --- */}
            <div className="flex items-center justify-between px-6 py-3 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm z-10 transition-colors">

                {/* Left: Empty or Title (Back button moved to sidebar) */}
                <div className="flex items-center gap-2 text-slate-800 dark:text-slate-100">
                    <Folder size={20} className="text-primary" />
                    <h2 className="text-lg font-bold">
                        {currentCollection.name}
                    </h2>
                </div>

                {/* Right: Close */}
                <button
                    onClick={onClose}
                    className="p-2 hover:bg-red-50 hover:text-red-500 rounded-full transition-colors text-slate-400"
                    title="Cerrar visor"
                >
                    <X size={24} />
                </button>
            </div>

            {/* --- MAIN LAYOUT (2 COLUMNS) --- */}
            <div className="flex flex-1 overflow-hidden">

                {/* --- SIDEBAR (LEFT) --- */}
                <div
                    className="w-64 border-r border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex flex-col transition-colors"
                >
                    {/* Sidebar Header: Back Button + Search */}
                    <div className="p-4 border-b border-slate-200 dark:border-slate-700 space-y-3 bg-white/50 dark:bg-slate-800/50">
                        <button
                            onClick={onClose}
                            className="
                                w-full flex items-center gap-2 px-3 py-2 rounded-lg
                                bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700
                                text-slate-600 dark:text-slate-300
                                hover:bg-slate-100 dark:hover:bg-slate-700
                                transition-colors text-sm font-medium shadow-sm
                            "
                        >
                            <ArrowLeft size={16} />
                            Volver al paciente
                        </button>

                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                            <input
                                type="text"
                                placeholder="Buscar colección..."
                                value={sidebarSearch}
                                onChange={(e) => setSidebarSearch(e.target.value)}
                                className="
                                    w-full pl-9 pr-3 py-2 
                                    bg-white dark:bg-slate-800 
                                    border border-slate-200 dark:border-slate-700 
                                    rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50
                                    text-xs
                                "
                            />
                        </div>
                    </div>

                    {/* Sidebar List */}
                    <div ref={sidebarRef} className="flex-1 overflow-y-auto p-3 space-y-1">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-2 mt-2">
                            Colecciones
                        </p>
                        {filteredSidebarCollections.length === 0 ? (
                            <p className="text-xs text-slate-400 px-2 italic">No se encontraron resultados.</p>
                        ) : (
                            filteredSidebarCollections.map((collection) => {
                                // Find original index to maintain correct state
                                const originalIndex = collections.findIndex(c => c.id === collection.id);
                                const isActive = originalIndex === currentIndex;
                                const totalImages = 8 + (collection.photos.x_rays?.length || 0);

                                return (
                                    <button
                                        key={collection.id}
                                        data-index={originalIndex}
                                        onClick={() => setCurrentIndex(originalIndex)}
                                        className={`
                                            w-full flex items-start gap-3 p-3 rounded-xl text-left transition-all
                                            ${isActive
                                                ? 'bg-white dark:bg-slate-800 shadow-sm ring-1 ring-slate-200 dark:ring-slate-700'
                                                : 'hover:bg-slate-100 dark:hover:bg-slate-800/50 text-slate-500 dark:text-slate-400'
                                            }
                                        `}
                                    >
                                        <Folder
                                            size={18}
                                            className={`mt-0.5 ${isActive ? 'text-primary' : 'text-slate-400'}`}
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm font-medium truncate ${isActive ? 'text-slate-800 dark:text-slate-100' : ''}`}>
                                                {collection.name}
                                            </p>
                                            <p className="text-xs text-slate-400 mt-0.5">
                                                {totalImages} imágenes
                                            </p>
                                        </div>
                                        {isActive && (
                                            <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
                                        )}
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* --- CONTENT (RIGHT) --- */}
                <div className="flex-1 overflow-y-auto bg-slate-50/50 dark:bg-slate-950 p-6 md:p-8 flex flex-col">

                    {/* --- FILTER TOOLBAR --- */}
                    <div className="max-w-6xl mx-auto w-full mb-8 space-y-3">
                        {/* Category Pills */}
                        <div className="flex flex-wrap items-center gap-2">
                            {Object.entries(FILTER_CATEGORIES).map(([key, config]) => {
                                const isActive = activeCategory === key;
                                return (
                                    <button
                                        key={key}
                                        onClick={() => handleCategoryChange(key)}
                                        className={`
                                            px-4 py-1.5 rounded-full text-sm font-medium transition-all
                                            ${isActive
                                                ? 'bg-primary text-white shadow-md shadow-primary/20'
                                                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                                            }
                                        `}
                                    >
                                        {config.label}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Specific Sub-filters (Chips) */}
                        {subFilters.length > 0 && (
                            <div className="flex flex-wrap items-center gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
                                {subFilters.map((sub) => {
                                    const isSelected = activeSpecific === sub.key;
                                    return (
                                        <button
                                            key={sub.key}
                                            onClick={() => setActiveSpecific(isSelected ? null : sub.key)}
                                            className={`
                                                px-3 py-1 rounded-lg text-xs font-medium border transition-colors
                                                ${isSelected
                                                    ? 'bg-primary/5 dark:bg-primary/20 border-primary/20 dark:border-primary/50 text-primary dark:text-primary'
                                                    : 'bg-transparent border-transparent text-slate-500 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800'
                                                }
                                            `}
                                        >
                                            {sub.label}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>


                    <div className="max-w-6xl mx-auto w-full space-y-8">

                        {/* Mandatory Photos */}
                        {showClinical && (
                            <div className="animate-in fade-in duration-300">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-bold flex items-center gap-2 text-slate-700 dark:text-slate-300">
                                        <Camera size={20} />
                                        Fotografías Clínicas
                                    </h3>
                                    {!activeSpecific && activeCategory === 'ALL' && (
                                        <span className="text-xs font-medium px-2 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full flex items-center gap-1">
                                            <CheckCircle2 size={12} />
                                            Obligatorias
                                        </span>
                                    )}
                                </div>

                                {/* Filtered Grid */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {MANDATORY_KEYS.map(({ key, label }) => {
                                        if (!isPhotoVisible(key)) return null;
                                        return (
                                            <ImageCard
                                                key={key}
                                                label={label}
                                                src={currentCollection.photos[key]}
                                                onPreview={() => openLightbox(currentCollection.photos[key])}
                                            />
                                        );
                                    })}
                                </div>
                                {/* Empty State if filtered out all */}
                                {MANDATORY_KEYS.every(({ key }) => !isPhotoVisible(key)) && (
                                    <p className="text-sm text-slate-400 italic">No hay fotos en esta categoría.</p>
                                )}
                            </div>
                        )}

                        {/* X-Rays */}
                        {showXrays && (
                            <div className="animate-in fade-in duration-300">
                                <h3 className="text-lg font-bold flex items-center gap-2 mb-4 text-slate-700 dark:text-slate-300">
                                    <FileImage size={20} />
                                    Radiografías
                                </h3>
                                {currentCollection.photos.x_rays?.length > 0 ? (
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {currentCollection.photos.x_rays.map((url, idx) => {
                                            if (!isXrayVisible(idx)) return null;
                                            return (
                                                <ImageCard
                                                    key={idx}
                                                    label={`Radiografía ${idx + 1}`}
                                                    src={url}
                                                    onPreview={() => openLightbox(url)}
                                                />
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="p-8 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-center">
                                        <p className="text-slate-400">No hay radiografías en esta colección.</p>
                                    </div>
                                )}
                            </div>
                        )}

                    </div>
                </div>

            </div>

            {/* --- LIGHTBOX --- */}
            {lightboxIndex !== null && (
                <ImageLightbox
                    images={lightboxImages}
                    index={lightboxIndex}
                    onClose={() => setLightboxIndex(null)}
                    onNext={() => setLightboxIndex(prev => (prev + 1) % lightboxImages.length)}
                    onPrev={() => setLightboxIndex(prev => (prev - 1 + lightboxImages.length) % lightboxImages.length)}
                />
            )}
        </div>
    );
}

function ImageCard({ label, src, onPreview }) {
    return (
        <div
            className="
                group relative bg-white dark:bg-slate-800 
                rounded-xl border border-slate-200 dark:border-slate-700 
                overflow-hidden shadow-sm hover:shadow-md transition-all
            "
        >
            <div className="aspect-[4/3] bg-slate-100 dark:bg-slate-900 relative overflow-hidden">
                {src ? (
                    <>
                        <img
                            src={src}
                            alt={label}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div
                            className="
                                absolute inset-0 bg-black/0 group-hover:bg-black/20 
                                transition-colors flex items-center justify-center
                                opacity-0 group-hover:opacity-100 cursor-pointer
                            "
                            onClick={onPreview}
                        >
                            <Maximize2 className="text-white drop-shadow-md" size={24} />
                        </div>
                    </>
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300 dark:text-slate-600">
                        <ImageIcon size={32} />
                    </div>
                )}
            </div>
            <div className="p-3 border-t border-slate-100 dark:border-slate-700">
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 truncate">
                    {label}
                </p>
            </div>
        </div>
    );
}
