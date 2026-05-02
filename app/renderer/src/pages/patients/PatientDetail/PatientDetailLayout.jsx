import React, { useState, createContext } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import GalleryViewer from "./sections/components/GalleryViewer";
import GalleryCreator from "./sections/components/GalleryCreator";

// Create and export the context
export const PatientLayoutContext = createContext({
    openViewer: () => { },
    closeViewer: () => { },
    openCreator: () => { },
    closeCreator: () => { },
    refreshTrigger: 0,
    triggerRefresh: () => { },
    updateViewerCollections: () => { },
    isRefreshingGallery: false,
    setIsRefreshingGallery: () => { }
});

export default function PatientDetailLayout({ sidebar, children }) {
    const navigate = useNavigate();

    // Viewer State: { collectionId, collections } or null
    const [viewerState, setViewerState] = useState(null);

    // Creator State: boolean
    const [isCreatorOpen, setIsCreatorOpen] = useState(false);

    // Refresh trigger for components
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [isRefreshingGallery, setIsRefreshingGallery] = useState(false);

    const triggerRefresh = () => setRefreshTrigger(prev => prev + 1);

    const updateViewerCollections = (newCollections) => {
        setViewerState(prev => prev ? { ...prev, collections: newCollections } : null);
    };


    const openViewer = (collectionId, collections) => {
        setViewerState({ collectionId, collections });
    };

    const closeViewer = () => {
        setViewerState(null);
    };

    const openCreator = () => {
        setIsCreatorOpen(true);
    };

    const closeCreator = () => {
        setIsCreatorOpen(false);
    };

    const handleSaveCreator = () => {
        setIsCreatorOpen(false);
        triggerRefresh();
    };

    return (
        <PatientLayoutContext.Provider value={{
            openViewer,
            closeViewer,
            openCreator,
            closeCreator,
            refreshTrigger,
            triggerRefresh,
            updateViewerCollections,
            isRefreshingGallery,
            setIsRefreshingGallery
        }}>
            <div className="flex relative bg-slate-100 dark:bg-dark h-full">

                {/* SIDEBAR (FIJO) */}
                {sidebar}

                {/* CONTENEDOR DEL DETALLE */}
                <div className="flex-1 flex flex-col min-h-0">

                    {/* HEADER FIJO DEL DETALLE */}
                    <div
                        className="
                            flex items-center gap-2
                            px-6 py-4
                            border-b border-slate-200 dark:border-slate-700
                            bg-white dark:bg-secondary
                            sticky top-0 z-20
                        "
                    >
                        <button
                            onClick={() => navigate('/patients')}
                            className="flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-primary"
                        >
                            <ArrowLeft size={18} />
                            <span className="font-medium">Volver al listado</span>
                        </button>
                    </div>

                    {/* SOLO LOS SECTIONS SON SCROLLEABLES */}
                    <main className="flex-1 overflow-y-auto px-6 py-6">
                        {children}
                    </main>
                </div>

                {/* VIEWER OVERLAY */}
                {viewerState && (
                    <GalleryViewer
                        collections={viewerState.collections}
                        initialCollectionId={viewerState.collectionId}
                        onClose={closeViewer}
                    />
                )}

                {/* CREATOR OVERLAY */}
                {isCreatorOpen && (
                    <GalleryCreator
                        onClose={closeCreator}
                        onSave={handleSaveCreator}
                    />
                )}
            </div>
        </PatientLayoutContext.Provider>
    );
}
