import React, { useState, useMemo, useContext } from 'react';
import { PatientLayoutContext } from '../PatientDetailLayout';
import {
    Folder,
    CheckCircle2,
    AlertCircle,
    Camera,
    Search,
    ArrowUpDown,
    ChevronLeft,
    Plus
} from 'lucide-react';
import GalleryViewer from './components/GalleryViewer';

export default function GallerySection() {
    const { openViewer, openCreator } = useContext(PatientLayoutContext);

    // --- MOCK DATA ---
    const [collections] = useState([
        {
            id: 1,
            name: "Start of Treatment",
            createdAt: "2025-01-10T14:22:00Z",
            updatedAt: "2025-01-10T14:22:00Z",
            photos: {
                facial_front: "https://picsum.photos/400?random=11",
                facial_smiling: "https://picsum.photos/400?random=12",
                facial_profile: "https://picsum.photos/400?random=13",
                occlusal_upper: "https://picsum.photos/400?random=14",
                occlusal_lower: "https://picsum.photos/400?random=15",
                intraoral_left: "https://picsum.photos/400?random=16",
                intraoral_center: "https://picsum.photos/400?random=17",
                intraoral_right: "https://picsum.photos/400?random=18",
                x_rays: [
                    "https://picsum.photos/400?random=21",
                    "https://picsum.photos/400?random=22",
                    "https://picsum.photos/400?random=23",
                    "https://picsum.photos/400?random=24",
                    "https://picsum.photos/400?random=25",
                ]
            }
        },
        {
            id: 2,
            name: "Final Results",
            createdAt: "2025-02-01T09:10:00Z",
            updatedAt: "2025-02-05T11:30:00Z",
            photos: {
                facial_front: "https://picsum.photos/400?random=31",
                facial_smiling: "https://picsum.photos/400?random=32",
                facial_profile: "https://picsum.photos/400?random=33",
                occlusal_upper: "https://picsum.photos/400?random=34",
                occlusal_lower: "https://picsum.photos/400?random=35",
                intraoral_left: "https://picsum.photos/400?random=36",
                intraoral_center: "https://picsum.photos/400?random=37",
                intraoral_right: "https://picsum.photos/400?random=38",
                x_rays: [] // optional
            }
        }
    ]);

    // --- STATE ---
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('created_desc'); // created_desc, created_asc, updated_desc, updated_asc

    // --- HELPERS ---
    const MANDATORY_KEYS = [
        'facial_front', 'facial_smiling', 'facial_profile',
        'occlusal_upper', 'occlusal_lower',
        'intraoral_left', 'intraoral_center', 'intraoral_right'
    ];

    const checkCompleteness = (photos) => {
        return MANDATORY_KEYS.every(key => !!photos[key]);
    };

    // --- FILTERING & SORTING ---
    const filteredCollections = useMemo(() => {
        return collections
            .filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
            .sort((a, b) => {
                let dateA, dateB;

                if (sortBy.includes('updated')) {
                    dateA = new Date(a.updatedAt);
                    dateB = new Date(b.updatedAt);
                } else {
                    dateA = new Date(a.createdAt);
                    dateB = new Date(b.createdAt);
                }

                return sortBy.endsWith('desc') ? dateB - dateA : dateA - dateB;
            });
    }, [collections, searchQuery, sortBy]);

    const handleOpenViewer = (collection) => {
        openViewer(collection.id, filteredCollections);
    };

    return (
        <div className="space-y-6 text-slate-800 dark:text-slate-100">
            <Section
                title="Galería Fotográfica"
                icon={Camera}
                subtitle="Colecciones de fotos clínicas y radiografías del paciente."
            >
                {/* --- FILTERS --- */}
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar colección..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="
                                w-full pl-10 pr-4 py-2 
                                bg-slate-50 dark:bg-slate-800 
                                border border-slate-200 dark:border-slate-700 
                                rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50
                                text-sm
                            "
                        />
                    </div>
                    <div className="relative min-w-[200px]">
                        <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="
                                w-full pl-10 pr-8 py-2 
                                bg-slate-50 dark:bg-slate-800 
                                border border-slate-200 dark:border-slate-700 
                                rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50
                                text-sm appearance-none cursor-pointer
                            "
                        >
                            <option value="created_desc">Creado: Más reciente</option>
                            <option value="created_asc">Creado: Más antiguo</option>
                            <option value="updated_desc">Modificado: Más reciente</option>
                            <option value="updated_asc">Modificado: Más antiguo</option>
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                            <ChevronLeft className="-rotate-90" size={14} />
                        </div>
                    </div>

                    <button
                        onClick={openCreator}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800/50 hover:bg-slate-700/60 text-primary font-medium text-sm border border-slate-700 transition"
                    >
                        <Plus size={16} className="text-primary" />
                        Nueva Galería
                    </button>
                </div>

                {/* --- GRID --- */}
                {filteredCollections.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
                        <p className="text-slate-400">No se encontraron colecciones.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {filteredCollections.map(collection => {
                            const isComplete = checkCompleteness(collection.photos);
                            const totalImages = 8 + (collection.photos.x_rays?.length || 0);

                            return (
                                <div
                                    key={collection.id}
                                    onDoubleClick={() => handleOpenViewer(collection)}
                                    className="
                                        group relative
                                        flex flex-col items-center justify-center
                                        p-6 rounded-xl border border-slate-200 dark:border-slate-700
                                        bg-slate-50 dark:bg-slate-800/50
                                        hover:bg-white dark:hover:bg-slate-800
                                        hover:shadow-md transition-all cursor-pointer
                                        select-none
                                    "
                                >
                                    {/* Status Indicator */}
                                    <div className="absolute top-3 right-3">
                                        {isComplete ? (
                                            <CheckCircle2 size={18} className="text-green-500" />
                                        ) : (
                                            <AlertCircle size={18} className="text-amber-500" />
                                        )}
                                    </div>

                                    <Folder
                                        size={48}
                                        className="text-primary group-hover:text-primary/80 transition-colors mb-3"
                                        strokeWidth={1.5}
                                    />

                                    <h3 className="font-semibold text-sm text-center leading-tight mb-1">
                                        {collection.name}
                                    </h3>

                                    <p className="text-xs text-slate-400 dark:text-slate-500 mb-2">
                                        {totalImages} imágenes
                                    </p>

                                    <p className="text-[10px] text-slate-400 bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded-full">
                                        {new Date(collection.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                )}
            </Section>
        </div>
    );
}

/* ============================================================
    INTERNAL COMPONENTS
============================================================ */

function Section({ title, icon: Icon, subtitle, children }) {
    return (
        <div
            className="
                bg-white dark:bg-secondary
                border border-slate-200 dark:border-slate-700
                rounded-2xl p-5 shadow-sm
                space-y-4
            "
        >
            <div className="flex items-start justify-between">
                <div>
                    <h2 className="text-lg font-bold flex items-center gap-2 text-primary">
                        <Icon size={20} className="opacity-80" />
                        {title}
                    </h2>

                    {subtitle && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                            {subtitle}
                        </p>
                    )}
                </div>
            </div>

            <div className="mt-2">
                {children}
            </div>
        </div>
    );
}
