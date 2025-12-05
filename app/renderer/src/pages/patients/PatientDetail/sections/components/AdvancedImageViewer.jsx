import React, { useState } from 'react';
import {
    X,
    ZoomIn,
    ZoomOut,
    Maximize,
    RotateCw,
    Trash2
} from 'lucide-react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';

export default function AdvancedImageViewer({ images = [], onClose, onRemoveImage }) {
    if (!images || images.length === 0) return null;

    // Grid configuration based on image count
    const gridCols = images.length === 1 ? 'grid-cols-1' :
        images.length === 2 ? 'grid-cols-2' :
            'grid-cols-3';

    return (
        <div className="fixed inset-0 bg-black/95 z-[99999] flex flex-col animate-in fade-in duration-300">
            {/* --- HEADER --- */}
            <div className="flex items-center justify-between px-6 py-4 bg-black/50 backdrop-blur-sm z-50 border-b border-white/10">
                <div className="flex items-center gap-3">
                    <Maximize className="text-primary" size={20} />
                    <h2 className="text-white font-medium text-lg">
                        Modo Comparación
                    </h2>
                    <span className="px-2 py-0.5 bg-primary/20 text-primary text-xs font-bold rounded-full border border-primary/30">
                        {images.length} {images.length === 1 ? 'imagen' : 'imágenes'}
                    </span>
                </div>

                <button
                    onClick={onClose}
                    className="p-2 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white rounded-full transition-all"
                    title="Cerrar visor"
                >
                    <X size={24} />
                </button>
            </div>

            {/* --- MAIN GRID --- */}
            <div className={`flex-1 p-4 grid gap-4 ${gridCols} overflow-hidden`}>
                {images.map((imgUrl, index) => (
                    <div
                        key={`${imgUrl}-${index}`}
                        className="relative w-full h-full bg-black/40 rounded-xl overflow-hidden border border-white/10 group"
                    >
                        <TransformWrapper
                            initialScale={1}
                            minScale={0.5}
                            maxScale={4}
                            centerOnInit={true}
                        >
                            {({ zoomIn, zoomOut, resetTransform, setTransform }) => (
                                <>
                                    {/* Toolbar (Floating) */}
                                    <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-1 p-1.5 bg-slate-900/80 backdrop-blur-md rounded-lg border border-white/10 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
                                        <ToolButton
                                            icon={<ZoomIn size={18} />}
                                            onClick={() => zoomIn(0.5)}
                                            title="Acercar"
                                        />
                                        <ToolButton
                                            icon={<ZoomOut size={18} />}
                                            onClick={() => zoomOut(0.5)}
                                            title="Alejar"
                                        />
                                        <div className="w-px h-4 bg-white/20 mx-1" />
                                        <ToolButton
                                            icon={<RotateCw size={18} />}
                                            onClick={() => {
                                                // Basic rotation implementation via CSS transform toggle could be added here
                                                // For now, let's stick to reset as rotation requires state tracking per image
                                                resetTransform();
                                            }}
                                            title="Resetear vista"
                                        />
                                        <div className="w-px h-4 bg-white/20 mx-1" />
                                        <ToolButton
                                            icon={<Trash2 size={18} />}
                                            onClick={() => onRemoveImage(imgUrl)}
                                            variant="danger"
                                            title="Quitar de la vista"
                                        />
                                    </div>

                                    {/* Image Area */}
                                    <TransformComponent
                                        wrapperClass="!w-full !h-full"
                                        contentClass="!w-full !h-full flex items-center justify-center"
                                    >
                                        <img
                                            src={imgUrl}
                                            alt={`Image ${index + 1}`}
                                            className="max-w-full max-h-full object-contain"
                                        />
                                    </TransformComponent>
                                </>
                            )}
                        </TransformWrapper>
                    </div>
                ))}
            </div>
        </div>
    );
}

function ToolButton({ icon, onClick, title, variant = 'default' }) {
    const colors = variant === 'danger'
        ? 'hover:bg-red-500/20 text-red-400 hover:text-red-300'
        : 'hover:bg-primary/20 text-slate-300 hover:text-primary';

    return (
        <button
            onClick={onClick}
            className={`p-2 rounded-md transition-colors ${colors}`}
            title={title}
        >
            {icon}
        </button>
    );
}
