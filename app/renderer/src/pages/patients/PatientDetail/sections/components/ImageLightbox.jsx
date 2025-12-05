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

            {/* Image */}
            <div
                className="relative max-w-full max-h-full flex flex-col items-center"
                onClick={(e) => e.stopPropagation()}
            >
                <img
                    src={currentImage.url}
                    alt={currentImage.label || 'Image'}
                    className="max-w-full max-h-[90vh] object-contain rounded shadow-2xl"
                />
                {currentImage.label && (
                    <p className="text-white/80 mt-4 text-sm font-medium bg-black/50 px-4 py-2 rounded-full backdrop-blur-sm">
                        {currentImage.label} ({index + 1} / {images.length})
                    </p>
                )}
            </div>
        </div>
    );
}
