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
            <div className={`flex-1 p-4 grid gap-0 ${gridCols} overflow-hidden`}>
                {images.map((imgObj, index) => (
                    <div
                        key={`${imgObj.url}-${index}`}
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
                                            onClick={() => onRemoveImage(imgObj)}
                                            variant="danger"
                                            title="Quitar de la vista"
                                        />
                                    </div>

                                    {/* Image Area */}
                                    <TransformComponent
                                        wrapperClass="!w-full !h-full"
                                        contentClass="!w-full !h-full flex items-center justify-center p-8"
                                    >
                                        <div className="relative inline-block">
                                            <img
                                                src={imgObj.url}
                                                alt={`Image ${index + 1}`}
                                                className="max-w-full max-h-full object-contain shadow-2xl"
                                                draggable={false}
                                            />
                                            {/* Render Notes */}
                                            {imgObj.notes && imgObj.notes.map((note) => (
                                                <div
                                                    key={note.id || `${note.x}-${note.y}`}
                                                    className="absolute z-10 group"
                                                    style={{ left: `${note.x}%`, top: `${note.y}%` }}
                                                >
                                                    <div className="p-1 rounded-full bg-white shadow-md border 
                                                    border-green-600 cursor-pointer transform -translate-x-1/2 -translate-y-1/2 hover:scale-110 transition-transform relative z-20">
                                                        <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                        </svg>
                                                    </div>
                                                    
                                                    {/* Tooltip / Popover */}
                                                    <div className="absolute opacity-0 invisible group-hover:opacity-100 group-hover:visible 
                                                    bg-slate-800 text-white text-sm px-3 py-2 rounded-lg shadow-xl w-48
                                                    transition-all duration-200 z-50 transform -translate-x-1/2 mt-2 pointer-events-none text-center">
                                                        {note.text}
                                                        <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 rotate-45 w-2 h-2 bg-slate-800 pointer-events-none"/>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
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
