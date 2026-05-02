import React, { useState, useRef, useEffect } from 'react';
import { Upload, Plus, X, Loader2 } from 'lucide-react';

/* ============================================================
   🔹 CONFIG
============================================================ */

const MAX_FILES = 3;
const MAX_SIZE_MB = 5;

/* ============================================================
   🔹 COMPONENT
============================================================ */

const RadiographsStep = ({ files, setFiles }) => {

    /* ============================
       🔹 CLEANUP (memory leak fix)
    ============================ */

    useEffect(() => {
        return () => {
            files.forEach(f => {
                if (f.url?.startsWith('blob:')) {
                    URL.revokeObjectURL(f.url);
                }
            });
        };
    }, [files]);

    /* ============================
       🔹 HANDLERS
    ============================ */

    const handleUpload = (newFile) => {
        if (!newFile) return;

        // 🔒 tipo
        if (!newFile.type.startsWith('image/')) {
            console.warn('Archivo no válido');
            return;
        }

        // 🔒 tamaño
        if (newFile.size > MAX_SIZE_MB * 1024 * 1024) {
            console.warn('Archivo demasiado grande');
            return;
        }

        if (files.length >= MAX_FILES) return;

        const objectUrl = URL.createObjectURL(newFile);

        setFiles(prev => [
            ...prev,
            {
                id: crypto.randomUUID(),
                url: objectUrl,
                file: newFile
            }
        ]);
    };

    const handleRemove = (id) => {
        setFiles(prev => {
            const fileToRemove = prev.find(f => f.id === id);

            if (fileToRemove?.url?.startsWith('blob:')) {
                URL.revokeObjectURL(fileToRemove.url);
            }

            return prev.filter(f => f.id !== id);
        });
    };

    /* ============================
       🔹 UI
    ============================ */

    return (
        <div className="max-w-4xl mx-auto">

            {/* HEADER */}
            <div className="mb-6">
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                    Radiografías
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    (Opcional) Adjunte hasta {MAX_FILES} radiografías o imágenes complementarias.
                </p>
            </div>

            {/* GRID */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {files.map((item, index) => (
                    <DropzoneCard
                        key={item.id}
                        label={`Radiografía ${index + 1}`}
                        image={item.url}
                        onRemove={() => handleRemove(item.id)}
                    />
                ))}

                {files.length < MAX_FILES && (
                    <AddXrayCard onUpload={handleUpload} />
                )}
            </div>

            {/* EMPTY */}
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
   🔹 PREVIEW CARD
============================================================ */

function DropzoneCard({ label, image, onRemove }) {
    const [src, setSrc] = useState(null);

    useEffect(() => {
        let isMounted = true;
        if (image instanceof Promise) {
            image.then(result => {
                if (isMounted) setSrc(result);
            });
        } else {
            setSrc(image);
        }
        return () => { isMounted = false; };
    }, [image]);

    return (
        <div className="relative aspect-[4/3] rounded-xl border-2 border-transparent shadow-sm bg-white dark:bg-slate-800 group overflow-hidden">

            {src ? (
                <img
                    src={src}
                    alt={label}
                    className="w-full h-full object-cover"
                />
            ) : (
                <div className="w-full h-full flex items-center justify-center bg-slate-50 dark:bg-slate-900/50">
                    <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
                </div>
            )}

            {/* Hover Overlay */}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onRemove();
                    }}
                    className="px-3 py-1.5 bg-red-500/80 hover:bg-red-600 text-white rounded-lg text-xs backdrop-blur-sm transition-colors flex items-center gap-1"
                >
                    <X size={14} />
                    Eliminar
                </button>
            </div>

            {/* Label */}
            <div className="absolute bottom-2 left-2 right-2 px-2 py-1 bg-black/60 backdrop-blur-sm rounded-lg pointer-events-none">
                <p className="text-xs text-white truncate text-center">{label}</p>
            </div>
        </div>
    );
}

/* ============================================================
   🔹 ADD CARD
============================================================ */

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
        if (file) onUpload(file);
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            onUpload(file);
            e.target.value = '';
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
                ${isDragging
                    ? 'bg-cyan-100 dark:bg-cyan-900/40 text-cyan-500'
                    : 'bg-slate-100 dark:bg-slate-700 group-hover:bg-cyan-50 dark:group-hover:bg-cyan-900/30'
                }
            `}>
                {isDragging
                    ? <Upload size={20} />
                    : <Plus size={24} strokeWidth={1.5} />
                }
            </div>

            <span className="text-xs font-medium">Añadir Imagen</span>
            <span className="text-[10px] text-slate-400 mt-1 opacity-60 group-hover:opacity-100">
                Arrastra o clic
            </span>
        </div>
    );
}

export default RadiographsStep;