import React, { useEffect } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

export default function ImageLightbox({ images, index, onClose, onNext, onPrev }) {

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'ArrowLeft') onPrev();
            if (e.key === 'ArrowRight') onNext();
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose, onNext, onPrev]);

    if (!images || images.length === 0) return null;

    const currentImage = images[index];

    return (
        <div
            className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 animate-in fade-in duration-200"
            onClick={onClose}
        >
            {/* Close Button */}
            <button
                className="absolute top-4 right-4 p-2 text-white/70 hover:text-white transition-colors z-50"
                onClick={(e) => {
                    e.stopPropagation();
                    onClose();
                }}
            >
                <X size={32} />
            </button>

            {/* Navigation Left */}
            <button
                className="absolute left-4 top-1/2 -translate-y-1/2 p-3 text-white/50 hover:text-white transition-colors z-50 hover:bg-white/10 rounded-full"
                onClick={(e) => {
                    e.stopPropagation();
                    onPrev();
                }}
            >
                <ChevronLeft size={40} />
            </button>

            {/* Navigation Right */}
            <button
                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 text-white/50 hover:text-white transition-colors z-50 hover:bg-white/10 rounded-full"
                onClick={(e) => {
                    e.stopPropagation();
                    onNext();
                }}
            >
                <ChevronRight size={40} />
            </button>

            {/* Image & Notes Wrapper */}
            <div
                className="relative inline-block max-w-[90vw] max-h-[90vh]"
                onClick={(e) => e.stopPropagation()}
            >
                <img
                    src={currentImage.url}
                    alt={currentImage.label || 'Image'}
                    className="max-h-[85vh] w-auto h-auto object-contain rounded shadow-2xl"
                    style={{ maxWidth: '100%' }}
                />
                
                {/* Render Notes */}
                {currentImage.notes && currentImage.notes.map(note => (
                    <div
                        key={note.id || `${note.x}-${note.y}`}
                        className="absolute z-10 group"
                        style={{ left: `${note.x}%`, top: `${note.y}%` }}
                    >
                        <div className="p-1 rounded-full bg-white shadow-md border 
                        border-green-600 cursor-pointer transform -translate-x-1/2 -translate-y-1/2 hover:scale-110 transition-transform relative z-20">
                            {/* SVG eye icon or similar point */}
                            <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                        </div>
                        
                        {/* Tooltip / Popover */}
                        <div className="absolute opacity-0 invisible group-hover:opacity-100 group-hover:visible 
                        bg-slate-800 text-white text-sm px-3 py-2 rounded-lg shadow-xl w-48
                        transition-all duration-200 z-50 transform -translate-x-1/2 mt-2 pointer-events-none">
                            {note.text}
                            {/* Arrow */}
                            <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 rotate-45 w-2 h-2 bg-slate-800 pointer-events-none"/>
                        </div>
                    </div>
                ))}

                {currentImage.label && (
                    <div className="flex justify-center w-full">
                        <p className="text-white/80 mt-4 text-sm font-medium bg-black/50 px-4 py-2 rounded-full backdrop-blur-sm">
                            {currentImage.label} ({index + 1} / {images.length})
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
