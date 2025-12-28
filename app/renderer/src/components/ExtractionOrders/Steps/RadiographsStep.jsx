import React, { useState, useRef } from 'react';
import { Upload, Plus, Image as ImageIcon, X } from 'lucide-react';

const RadiographsStep = ({ files, setFiles }) => {
    // files is array of { id, url, file }

    const handleUpload = (newFile) => {
        if (files.length >= 3) return;
        const objectUrl = URL.createObjectURL(newFile);
        setFiles(prev => [...prev, { id: Date.now() + Math.random(), url: objectUrl, file: newFile }]);
    };

    const handleRemove = (id) => {
        setFiles(prev => prev.filter(f => f.id !== id));
    };

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-6">
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                    Radiografías
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    (Opcional) Adjunte hasta 3 radiografías o imágenes complementarias.
                </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {files.map((item, index) => (
                    <DropzoneCard
                        key={item.id}
                        label={`Radiografía ${index + 1}`}
                        image={item.url}
                        onRemove={() => handleRemove(item.id)}
                    />
                ))}

                {files.length < 3 && (
                    <AddXrayCard onUpload={handleUpload} />
                )}
            </div>

            {files.length === 0 && (
                <div className="mt-8 p-6 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/20 text-center">
                    <p className="text-sm text-slate-400">
                        No se han seleccionado imágenes. Puede continuar sin añadir radiografías.
                    </p>
                </div>
            )}
        </div>
    );
};

/* ============================================================
    ADAPTED INTERNAL COMPONENTS (from GalleryCreator.jsx)
============================================================ */

function DropzoneCard({ label, image, onRemove }) {
    // Simplified DropzoneCard: No replace logic needed for this simple wizard, just remove.
    // Kept visual style IDENTICAL to GalleryCreator.

    return (
        <div className="relative aspect-[4/3] rounded-xl border-2 border-transparent shadow-sm bg-white dark:bg-slate-800 group overflow-hidden">
            <img
                src={image}
                alt={label}
                className="w-full h-full object-cover"
            />

            {/* Hover Overlay */}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                <button
                    onClick={(e) => { e.stopPropagation(); onRemove(); }}
                    className="px-3 py-1.5 bg-red-500/80 hover:bg-red-600 text-white rounded-lg text-xs backdrop-blur-sm transition-colors flex items-center gap-1"
                >
                    <X size={14} />
                    Eliminar
                </button>
            </div>

            {/* Label Badge */}
            <div className="absolute bottom-2 left-2 right-2 px-2 py-1 bg-black/60 backdrop-blur-sm rounded-lg pointer-events-none">
                <p className="text-xs text-white truncate text-center">{label}</p>
            </div>
        </div>
    );
}

function AddXrayCard({ onUpload }) {
    const inputRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            onUpload(file);
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            onUpload(file);
            e.target.value = ''; // Reset
        }
    };

    return (
        <div
            onClick={() => inputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`
                aspect-[4/3] rounded-xl border-2 border-dashed 
                flex flex-col items-center justify-center text-slate-400 
                transition-all cursor-pointer group
                ${isDragging
                    ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-900/20 text-cyan-500'
                    : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 hover:border-cyan-400 hover:text-cyan-500'
                }
            `}
        >
            <input
                type="file"
                ref={inputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
            />
            <div className={`
                w-10 h-10 rounded-full flex items-center justify-center mb-3 transition-colors
                ${isDragging ? 'bg-cyan-100 dark:bg-cyan-900/40 text-cyan-500' : 'bg-slate-100 dark:bg-slate-700 group-hover:bg-cyan-50 dark:group-hover:bg-cyan-900/30'}
            `}>
                {isDragging ? <Upload size={20} /> : <Plus size={24} strokeWidth={1.5} />}
            </div>
            <span className="text-xs font-medium">Añadir Imagen</span>
            <span className="text-[10px] text-slate-400 mt-1 opacity-60 group-hover:opacity-100">Arrastra o clic</span>
        </div>
    );
}

export default RadiographsStep;
