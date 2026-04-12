import React, { useState, useRef, useMemo } from 'react';
import {
    X,
    Upload,
    Plus,
    Trash2,
    CheckCircle2,
    AlertCircle,
    Image as ImageIcon,
    ChevronRight,
    ChevronDown,
    Save
} from 'lucide-react';
import { useParams } from 'react-router-dom';
import CropperModal from './CropperModal';
import patientGalleryService from '@/services/patientGallery.service';

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

export default function GalleryCreator({ onClose, onSave }) {
    const { id: patientId } = useParams();

    // --- STATE ---
    const [name, setName] = useState('');
    const [photos, setPhotos] = useState({}); // { key: { blob, url } }
    const [xrays, setXrays] = useState([]); // Array of { id, blob, url }
    const [isSaving, setIsSaving] = useState(false);


    // --- CROPPER STATE ---
    const [cropperOpen, setCropperOpen] = useState(false);
    const [pendingImage, setPendingImage] = useState(null);
    const [activeSlot, setActiveSlot] = useState(null); // { type: 'photo' | 'xray', key?: string, cxId?: number }

    // --- COMPUTED ---
    const filledCount = MANDATORY_KEYS.reduce((acc, { key }) => acc + (photos[key] ? 1 : 0), 0);
    const isComplete = filledCount === MANDATORY_KEYS.length;
    const canSave = name.trim().length > 0 && isComplete && !isSaving;

    const currentStep = useMemo(() => {
        if (!name) return 1;
        if (!isComplete) return 2;
        return 3; // Ready to save (or adding X-rays)
    }, [name, isComplete]);

    // --- HANDLERS ---

    // 1. Intercept Upload -> Open Cropper
    const initiateUpload = (file, slotType, slotKey = null, xrayId = null) => {
        if (!file) return;
        const objectUrl = URL.createObjectURL(file);
        setPendingImage(objectUrl);
        setActiveSlot({ type: slotType, key: slotKey, id: xrayId });
        setCropperOpen(true);
    };

    const handlePhotoUpload = (key, file) => {
        initiateUpload(file, 'photo', key);
    };

    const handleAddXray = (file) => {
        // Generate ID ahead of time for the new item
        const newId = Date.now();
        initiateUpload(file, 'xray', null, newId);
    };

    // 2. Cropper Save -> Update State
    const handleCropperSave = (blob) => {
        if (!activeSlot || !blob) return;

        const croppedUrl = URL.createObjectURL(blob);

        if (activeSlot.type === 'photo') {
            setPhotos(prev => ({ ...prev, [activeSlot.key]: { blob, url: croppedUrl } }));
        } else if (activeSlot.type === 'xray') {
            setXrays(prev => [...prev, { id: activeSlot.id, blob, url: croppedUrl }]);
        }

        closeCropper();
    };

    const closeCropper = () => {
        setCropperOpen(false);
        setPendingImage(null);
        setActiveSlot(null);
    };

    const handleRemovePhoto = (key) => {
        setPhotos(prev => {
            const next = { ...prev };
            delete next[key];
            return next;
        });
    };

    const handleRemoveXray = (id) => {
        setXrays(prev => prev.filter(x => x.id !== id));
    };

    const handleSave = async () => {
        if (!canSave) return;

        try {
            setIsSaving(true);
            const formData = new FormData();
            formData.append('patient_id', patientId);
            formData.append('name', name);
            formData.append('description', `Galería: ${name}`);

            // Añadir fotos obligatorias
            MANDATORY_KEYS.forEach(({ key }) => {
                if (photos[key]?.blob) {
                    // Usamos el 'key' como nombre del archivo para identificarlo en el backend
                    formData.append('photos', photos[key].blob, `${key}.jpg`);
                }
            });

            // Añadir radiografías
            xrays.forEach((x, index) => {
                if (x.blob) {
                    formData.append('photos', x.blob, `xray_${index + 1}.jpg`);
                }
            });

            await patientGalleryService.createGallery(formData);
            onSave(); // Notificar al padre para cerrar y recargar
        } catch (error) {
            console.error('Error al guardar galería:', error);
            alert('Error al guardar la galería. Por favor intente de nuevo.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="absolute inset-0 z-50 bg-slate-50 dark:bg-slate-900 flex flex-col animate-in slide-in-from-bottom-4 duration-300">

            {/* --- CROPPER MODAL --- */}
            {cropperOpen && pendingImage && (
                <CropperModal
                    image={pendingImage}
                    onSave={handleCropperSave}
                    onCancel={closeCropper}
                />
            )}

            {/* --- STICKY HEADER --- */}
            <div className="flex items-center justify-between px-6 py-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 shadow-sm z-10 sticky top-0">

                {/* Left: Back & Title */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500"
                    >
                        <X size={20} />
                    </button>

                    <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 mx-2" />

                    <div className="flex flex-col">
                        <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
                            Nueva colección
                        </label>
                        <div className="relative mt-2">
                            <select
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="
                                    w-56 px-3 py-2 rounded-lg
                                    bg-slate-100 dark:bg-slate-800/60
                                    text-slate-700 dark:text-slate-200
                                    border border-slate-300 dark:border-slate-700
                                    text-sm
                                    focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]
                                    appearance-none cursor-pointer
                                "
                            >
                                <option value="" disabled>Selecciona una etapa...</option>
                                <option value="Inicio de tratamiento">Inicio de tratamiento</option>
                                <option value="Diagnóstico inicial">Diagnóstico inicial</option>
                                <option value="Evaluación intermedia">Evaluación intermedia</option>
                                <option value="Final de tratamiento">Final de tratamiento</option>
                                <option value="Seguimiento post-tratamiento">Seguimiento post-tratamiento</option>
                                <option value="Antes y después">Antes y después</option>
                            </select>
                            <ChevronDown
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 pointer-events-none"
                                size={16}
                            />
                        </div>
                    </div>
                </div>

                {/* Center: Step Indicator */}
                <div className="hidden md:block">
                    <WizardSteps currentStep={currentStep} />
                </div>

                {/* Right: Save Button */}
                <button
                    onClick={handleSave}
                    disabled={!canSave}
                    className={`
                        flex items-center gap-2
                        px-4 py-2
                        text-sm font-medium
                        rounded-xl
                        shadow-md hover:shadow-lg
                        transition-all
                        ${canSave
                            ? 'bg-[var(--color-primary)] hover:bg-cyan-400 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                        }
                    `}
                >
                    <Save size={16} className={canSave ? "text-white" : ""} />
                    {isSaving ? "Guardando..." : "Guardar Colección"}
                </button>
            </div>

            {/* --- SCROLLABLE CONTENT --- */}
            <div className="flex-1 overflow-y-auto p-6 md:p-10">
                <div className="max-w-5xl mx-auto space-y-10">

                    {/* SECTION 1: MANDATORY PHOTOS */}
                    <div>
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                                    Fotografías Clínicas
                                </h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                    Arrastra y suelta las 8 imágenes requeridas para completar la colección.
                                </p>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg">
                                <span className={`font-bold ${isComplete ? 'text-green-500' : 'text-blue-500'}`}>
                                    {filledCount}
                                </span>
                                <span className="text-slate-400">/</span>
                                <span className="text-slate-500">8</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            {MANDATORY_KEYS.map(({ key, label }) => (
                                <DropzoneCard
                                    key={key}
                                    label={label}
                                    image={photos[key]?.url}
                                    onUpload={(file) => handlePhotoUpload(key, file)}
                                    onRemove={() => handleRemovePhoto(key)}
                                    required
                                />
                            ))}
                        </div>
                    </div>

                    {/* SECTION 2: OPTIONAL X-RAYS */}
                    <div className="pt-6 border-t border-slate-200 dark:border-slate-700">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                                    Radiografías
                                </h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                    (Opcional) Añade radiografías complementarias.
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            {xrays.map((xray) => (
                                <DropzoneCard
                                    key={xray.id}
                                    label="Radiografía"
                                    image={xray.url}
                                    onRemove={() => handleRemoveXray(xray.id)}
                                />
                            ))}

                            {/* Add Button Card */}
                            <AddXrayCard onUpload={handleAddXray} />
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}

/* ============================================================
    INTERNAL COMPONENTS
============================================================ */

function WizardSteps({ currentStep }) {
    const steps = [
        { label: 'Nombre' },
        { label: 'Fotos Clínicas' },
        { label: 'Radiografías' }
    ];

    return (
        <div className="relative flex items-center justify-between w-[320px] mx-auto">
            {/* Background Rail */}
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-[2px] bg-slate-200 dark:bg-slate-700 z-0" />

            {/* Active Progress Rail */}
            <div
                className="absolute left-0 top-1/2 -translate-y-1/2 h-[2px] bg-[var(--color-primary)] z-0 transition-all duration-500 ease-out"
                style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
            />

            {steps.map((step, index) => {
                const stepNum = index + 1;
                const isActive = stepNum === currentStep;
                const isCompleted = stepNum < currentStep;

                return (
                    <div key={step.label} className="relative z-10 flex flex-col items-center group">
                        {/* Circle Marker */}
                        <div
                            className={`
                                w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300
                                ${isCompleted
                                    ? 'bg-[var(--color-primary)] border-[var(--color-primary)] text-white scale-100'
                                    : isActive
                                        ? 'bg-white dark:bg-slate-900 border-[var(--color-primary)] text-[var(--color-primary)] scale-110 shadow-[0_0_0_4px_rgba(0,184,219,0.15)]'
                                        : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600 text-slate-400 scale-100'
                                }
                            `}
                        >
                            {isCompleted ? (
                                <CheckCircle2 size={16} strokeWidth={3} />
                            ) : (
                                <span className="text-xs font-bold">{stepNum}</span>
                            )}
                        </div>

                        {/* Label */}
                        <span
                            className={`
                                absolute top-10 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition-colors duration-300
                                ${isActive || isCompleted
                                    ? 'text-[var(--color-primary)]'
                                    : 'text-slate-400 dark:text-slate-500'
                                }
                            `}
                        >
                            {step.label}
                        </span>
                    </div>
                );
            })}
        </div>
    );
}

function DropzoneCard({ label, image, onUpload, onRemove, required }) {
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

    const handleClick = () => {
        if (!image) inputRef.current?.click();
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) onUpload(file);
    };

    return (
        <div
            className={`
                relative aspect-[4/3] rounded-xl border-2 transition-all group
                ${image
                    ? 'border-transparent shadow-sm'
                    : isDragging
                        ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-900/20 border-dashed'
                        : 'border-slate-200 dark:border-slate-700 border-dashed bg-white dark:bg-slate-800 hover:border-cyan-400'
                }
            `}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleClick}
        >
            <input
                type="file"
                ref={inputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
            />

            {image ? (
                <>
                    <img
                        src={image}
                        alt={label}
                        className="w-full h-full object-cover rounded-xl"
                    />

                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 rounded-xl">
                        <button
                            onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
                            className="px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg text-xs backdrop-blur-sm transition-colors"
                        >
                            Reemplazar
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); onRemove(); }}
                            className="px-3 py-1.5 bg-red-500/80 hover:bg-red-600 text-white rounded-lg text-xs backdrop-blur-sm transition-colors"
                        >
                            Eliminar
                        </button>
                    </div>

                    {/* Label Badge */}
                    <div className="absolute bottom-2 left-2 right-2 px-2 py-1 bg-black/60 backdrop-blur-sm rounded-lg">
                        <p className="text-xs text-white truncate text-center">{label}</p>
                    </div>
                </>
            ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 p-4 text-center cursor-pointer">
                    <div className={`
                        w-10 h-10 rounded-full flex items-center justify-center mb-3 transition-colors
                        ${isDragging ? 'bg-cyan-100 text-cyan-500' : 'bg-slate-100 dark:bg-slate-700'}
                    `}>
                        {isDragging ? <Upload size={20} /> : <ImageIcon size={20} />}
                    </div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                        {label}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                        {required && <span className="text-amber-500 mr-1">*</span>}
                        Arrastra o clic
                    </p>
                </div>
            )}
        </div>
    );
}

function AddXrayCard({ onUpload }) {
    const inputRef = useRef(null);

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
            className="
                aspect-[4/3] rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700
                bg-slate-50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800
                hover:border-cyan-400 transition-all cursor-pointer
                flex flex-col items-center justify-center text-slate-400 hover:text-cyan-500
            "
        >
            <input
                type="file"
                ref={inputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
            />
            <Plus size={32} strokeWidth={1.5} className="mb-2" />
            <span className="text-sm font-medium">Añadir Radiografía</span>
        </div>
    );
}
