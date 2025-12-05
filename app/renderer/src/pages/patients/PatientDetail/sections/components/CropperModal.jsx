import React, { useRef, useState } from 'react';
import Cropper from 'react-cropper';
import 'cropperjs/dist/cropper.css';
import {
    X,
    RotateCcw,
    RotateCw,
    FlipHorizontal,
    Check,
    Save
} from 'lucide-react';

export default function CropperModal({ image, onSave, onCancel }) {
    const cropperRef = useRef(null);

    // --- HANDLERS ---
    const handleRotateLeft = () => {
        const cropper = cropperRef.current?.cropper;
        if (cropper) cropper.rotate(-90);
    };

    const handleRotateRight = () => {
        const cropper = cropperRef.current?.cropper;
        if (cropper) cropper.rotate(90);
    };

    const handleFlipHorizontal = () => {
        const cropper = cropperRef.current?.cropper;
        if (cropper) {
            // Check current scaleX (1 or -1) and toggle
            const scaleX = cropper.getData().scaleX || 1;
            cropper.scaleX(-scaleX);
        }
    };

    const handleSave = () => {
        const cropper = cropperRef.current?.cropper;
        if (!cropper) return;

        cropper.getCroppedCanvas().toBlob((blob) => {
            if (blob) {
                onSave(blob);
            }
        }, 'image/jpeg', 0.9); // High quality JPEG
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 p-4">
            <div className="bg-white dark:bg-slate-900 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800">

                {/* --- HEADER --- */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                        Ajustar imagen
                    </h3>
                    <button
                        onClick={onCancel}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* --- CROPPER AREA (Scrollable) --- */}
                <div className="flex-1 overflow-auto bg-black relative min-h-[400px]">
                    <Cropper
                        src={image}
                        style={{ height: '100%', width: '100%', minHeight: '400px' }}
                        initialAspectRatio={4 / 5}
                        aspectRatio={4 / 5}
                        guides={true}
                        viewMode={1}
                        dragMode="move"
                        autoCropArea={1}
                        checkOrientation={false}
                        ref={cropperRef}
                        background={false}
                        responsive={true}
                    />
                </div>

                {/* --- FOOTER (Fixed) --- */}
                <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">

                    {/* Controls */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleRotateLeft}
                            className="p-2.5 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                            title="Rotar izquierda"
                        >
                            <RotateCcw size={20} />
                        </button>
                        <button
                            onClick={handleRotateRight}
                            className="p-2.5 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                            title="Rotar derecha"
                        >
                            <RotateCw size={20} />
                        </button>
                        <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1" />
                        <button
                            onClick={handleFlipHorizontal}
                            className="p-2.5 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                            title="Voltear horizontalmente"
                        >
                            <FlipHorizontal size={20} />
                        </button>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3">
                        <button
                            onClick={onCancel}
                            className="px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleSave}
                            className="
                                flex items-center gap-2
                                px-4 py-2
                                text-sm font-medium
                                rounded-xl
                                bg-[var(--color-primary)]
                                hover:bg-cyan-400
                                text-white
                                shadow-md hover:shadow-lg
                                transition-all
                            "
                        >
                            <Check size={16} className="text-white" />
                            Guardar recorte
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
