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
    Save,
    Eye
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
    const [pendingFile, setPendingFile] = useState(null);
    const [activeSlot, setActiveSlot] = useState(null); // { type: 'photo' | 'xray', key?: string, cxId?: number }

    // --- NOTES EDITOR STATE ---
    const [editingNotesImage, setEditingNotesImage] = useState(null); // { type: 'photo' | 'xray', keyOrId: string|number, url: string, notes: [] }

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
        setPendingFile(file);
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
            setPhotos(prev => ({ ...prev, [activeSlot.key]: { blob, url: croppedUrl, notes: [] } }));
        } else if (activeSlot.type === 'xray') {
            setXrays(prev => [...prev, { id: activeSlot.id, blob, url: croppedUrl, notes: [] }]);
        }

        closeCropper();
    };

    const closeCropper = () => {
        setCropperOpen(false);
        setPendingImage(null);
        setPendingFile(null);
        setActiveSlot(null);
    };

    // --- NOTES HANDLERS ---
    const handleOpenNotes = (type, keyOrId, url, notes = []) => {
        setEditingNotesImage({ type, keyOrId, url, notes });
    };

    const handleSaveNotes = (newNotes) => {
        if (!editingNotesImage) return;
        const { type, keyOrId } = editingNotesImage;
        if (type === 'photo') {
            setPhotos(prev => ({
                ...prev,
                [keyOrId]: { ...prev[keyOrId], notes: newNotes }
            }));
        } else if (type === 'xray') {
            setXrays(prev => prev.map(x => x.id === keyOrId ? { ...x, notes: newNotes } : x));
        }
        setEditingNotesImage(null);
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
            const notesMap = {};
            MANDATORY_KEYS.forEach(({ key }) => {
                if (photos[key]?.blob) {
                    const fileName = `${key}.jpg`;
                    // Usamos el 'key' como nombre del archivo para identificarlo en el backend
                    formData.append('photos', photos[key].blob, fileName);
                    if (photos[key].notes && photos[key].notes.length > 0) {
                        notesMap[fileName] = photos[key].notes;
                    }
                }
            });

            // Añadir radiografías
            xrays.forEach((x, index) => {
                if (x.blob) {
                    const fileName = `xray_${index + 1}.jpg`;
                    formData.append('photos', x.blob, fileName);
                    if (x.notes && x.notes.length > 0) {
                        notesMap[fileName] = x.notes;
                    }
                }
            });

            if (Object.keys(notesMap).length > 0) {
                formData.append('notes', JSON.stringify(notesMap));
            }

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
                    originalFile={pendingFile}
                    onSave={handleCropperSave}
                    onCancel={closeCropper}
                />
            )}

            {/* --- NOTES EDITOR MODAL --- */}
            {editingNotesImage && (
                <ImageNotesEditor
                    imageObj={editingNotesImage}
                    onSaveNotes={handleSaveNotes}
                    onClose={() => setEditingNotesImage(null)}
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
                                    notes={photos[key]?.notes}
                                    onUpload={(file) => handlePhotoUpload(key, file)}
                                    onRemove={() => handleRemovePhoto(key)}
                                    onOpenNotes={() => handleOpenNotes('photo', key, photos[key].url, photos[key].notes)}
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
                                    notes={xray.notes}
                                    onRemove={() => handleRemoveXray(xray.id)}
                                    onOpenNotes={() => handleOpenNotes('xray', xray.id, xray.url, xray.notes)}
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

function DropzoneCard({ label, image, notes = [], onUpload, onRemove, onOpenNotes, required }) {
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
                            onClick={(e) => { e.stopPropagation(); onOpenNotes(); }}
                            className="px-3 py-1.5 bg-blue-500/80 hover:bg-blue-600 text-white rounded-lg text-xs backdrop-blur-sm transition-colors flex items-center gap-1.5"
                        >
                            <Eye size={14} /> Notas {notes.length > 0 && `(${notes.length})`}
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); onRemove(); }}
                            className="px-3 py-1.5 bg-red-500/80 hover:bg-red-600 text-white rounded-lg text-xs backdrop-blur-sm transition-colors"
                        >
                            Eliminar
                        </button>
                    </div>

                    {/* Label Badge */}
                    <div className="absolute bottom-2 left-2 right-2 px-2 py-1 bg-black/60 backdrop-blur-sm rounded-lg flex items-center justify-center gap-1.5">
                        <p className="text-xs text-white truncate">{label}</p>
                        {notes.length > 0 && (
                            <div className="flex items-center gap-1 pl-1.5 border-l border-white/20 shrink-0">
                                <Eye size={10} className="text-cyan-400" />
                                <span className="text-[10px] font-bold text-white">{notes.length}</span>
                            </div>
                        )}
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
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                        {label}
                        {notes.length > 0 && (
                            <span className="flex items-center gap-1 text-cyan-500">
                                <Eye size={12} strokeWidth={2.5} />
                                <span className="text-xs font-bold">{notes.length}</span>
                            </span>
                        )}
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

function ImageNotesEditor({ imageObj, onSaveNotes, onClose }) {
    const [notes, setNotes] = useState(imageObj.notes || []);
    const [activeNote, setActiveNote] = useState(null); // { id?, x, y, text }
    const imageRef = useRef(null);

    const handleImageClick = (e) => {
        if (activeNote) return;

        const rect = imageRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;

        setActiveNote({ x, y, text: '' });
    };

    const handleSaveNote = (text) => {
        if (activeNote.id) {
            // Edit
            setNotes(notes.map(n => n.id === activeNote.id ? { ...n, text } : n));
        } else {
            // Add
            setNotes([...notes, { id: Date.now(), x: activeNote.x, y: activeNote.y, text }]);
        }
        setActiveNote(null);
    };

    const handleDeleteNote = (id) => {
        setNotes(notes.filter(n => n.id !== id));
        setActiveNote(null);
    };

    const handleClose = () => {
        onSaveNotes(notes);
    };

    return (
        <div className="fixed inset-0 z-[100] bg-slate-900/95 flex flex-col animate-in fade-in duration-200">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-slate-900">
                <h3 className="text-white font-bold flex items-center gap-2">
                    <Eye size={20} className="text-[var(--color-primary)]" />
                    Anotaciones en Imagen
                </h3>
                <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors" title="Cancelar cambios">
                    <X size={24} />
                </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-auto flex items-center justify-center p-8 relative">
                <div className="relative inline-block max-w-[90vw] max-h-[80vh]">
                    <img
                        ref={imageRef}
                        src={imageObj.url}
                        alt="Edición de Notas"
                        className="max-h-[80vh] w-auto h-auto object-contain shadow-2xl rounded-xl cursor-crosshair"
                        onClick={handleImageClick}
                        draggable={false}
                        style={{ maxWidth: '100%' }}
                    />

                    {/* Render Notes */}
                    {notes.map(note => (
                        <div
                            key={note.id}
                            className="absolute z-10 p-1 rounded-full bg-white shadow-sm border border-red-700 cursor-pointer transform -translate-x-1/2 -translate-y-1/2 hover:scale-110 transition-transform"
                            style={{ left: `${note.x}%`, top: `${note.y}%` }}
                            onClick={(e) => {
                                e.stopPropagation();
                                setActiveNote(note);
                            }}
                            title={note.text}
                        >
                            <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                        </div>
                    ))}

                    {/* Active Note Modal/Popover */}
                    {activeNote && (
                        <NotePopover
                            note={activeNote}
                            onSave={handleSaveNote}
                            onDelete={() => activeNote.id ? handleDeleteNote(activeNote.id) : setActiveNote(null)}
                            onCancel={() => setActiveNote(null)}
                        />
                    )}
                </div>
            </div>

            {/* Footer / Toolbar */}
            <div className="p-4 border-t border-white/10 bg-slate-900 flex items-center justify-between">
                <p className="text-slate-400 text-sm flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)]"></span>
                    Haz clic en cualquier parte de la imagen para agregar una nota.
                </p>
                <div className="flex items-center gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-800 transition-colors"
                    >
                        Descartar Cambios
                    </button>
                    <button
                        onClick={handleClose}
                        className="px-4 py-2 rounded-lg text-sm font-medium bg-[var(--color-primary)] hover:bg-cyan-400 text-white transition-colors shadow-lg"
                    >
                        Guardar ({notes.length} Notas)
                    </button>
                </div>
            </div>
        </div>
    );
}

function NotePopover({ note, onSave, onDelete, onCancel }) {
    const [text, setText] = useState(note.text || '');

    return (
        <div
            className="absolute z-50 bg-white dark:bg-slate-800 rounded-xl shadow-xl w-64 p-4 border border-slate-200 dark:border-slate-700 transform -translate-x-1/2 mt-3 cursor-default"
            style={{ left: `${note.x}%`, top: `${note.y}%` }}
            onClick={e => e.stopPropagation()}
        >
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-2">Nota en la imagen</h4>
            <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder="Escribe una observación..."
                className="w-full text-sm p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] mb-3 resize-none h-20 text-slate-700 dark:text-slate-300"
                autoFocus
            />
            <div className="flex justify-end gap-2">
                <button
                    onClick={onCancel}
                    className="px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                    Cancelar
                </button>
                {note.id && (
                    <button
                        onClick={onDelete}
                        className="px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                        Quitar
                    </button>
                )}
                <button
                    onClick={() => onSave(text)}
                    disabled={!text.trim()}
                    className="px-3 py-1.5 text-xs font-medium bg-[var(--color-primary)] hover:bg-cyan-400 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                    Aceptar
                </button>
            </div>
            {/* Arrow pointer */}
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rotate-45 w-3 h-3 bg-white dark:bg-slate-800 border-l border-t border-slate-200 dark:border-slate-700"></div>
        </div>
    );
}
