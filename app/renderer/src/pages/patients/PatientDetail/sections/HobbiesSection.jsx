import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useOutletContext } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Smile,
    Plus,
    Trash2,
    Edit2,
    Search,
    X,
    Save,
    AlertCircle,
    Calendar
} from 'lucide-react';
import { useHotkeys } from '@/hooks/useHotkeys';
import { ConfirmDialog } from '@/components/feedback';
import { useToastStore } from '@/store/useToastStore';
import * as hobbiesService from '@/services/hobbies.service';

/* ==============================================================================================
   MAIN SECTION COMPONENT
   ============================================================================================== */
export default function HobbiesSection({ patientId }) {
    const { profile } = useOutletContext();
    const activeId = patientId || profile?.id;
    const { addToast } = useToastStore();

    // ---------------------------------------------------------
    // STATE
    // ---------------------------------------------------------
    const [hobbies, setHobbies] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'
    const [selectedHobby, setSelectedHobby] = useState(null);

    // Delete Confirmation State
    const [deleteId, setDeleteId] = useState(null);

    // Filter State
    const [filterText, setFilterText] = useState('');
    const inputRef = useRef(null);

    // F1 Shortcut - Focus Filter
    useHotkeys(
        {
            f1: (e) => {
                e.preventDefault();
                inputRef.current?.focus();
            }
        },
        [],
        true
    );

    const filteredHobbies = hobbies.filter(hobby =>
        hobby.name.toLowerCase().includes(filterText.toLowerCase())
    );

    // ---------------------------------------------------------
    // DATA LOADING
    // ---------------------------------------------------------
    const loadHobbies = async () => {
        if (!activeId) return;

        setLoading(true);
        try {
            const data = await hobbiesService.getHobbiesByPatient(activeId);
            console.log("data", data);
            setHobbies(data);
        } catch (error) {
            console.error("Error loading hobbies:", error);
            addToast({
                type: 'error',
                title: 'Error',
                message: 'No se pudieron cargar los pasatiempos.'
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadHobbies();
    }, [activeId]);

    // ---------------------------------------------------------
    // KEYBOARD SHORTCUTS (GLOBAL SECTION)
    // ---------------------------------------------------------
    // F2 -> Open Create Modal
    useHotkeys(
        {
            f2: (e) => {
                e.preventDefault();
                openCreateModal();
            }
        },
        [isModalOpen], // Dependencies
        !isModalOpen   // Enabled only when modal is NOT open
    );

    // ---------------------------------------------------------
    // ACTIONS
    // ---------------------------------------------------------
    const openCreateModal = () => {
        setModalMode('create');
        setSelectedHobby(null);
        setIsModalOpen(true);
    };

    const openEditModal = (item) => {
        setModalMode('edit');
        setSelectedHobby(item);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedHobby(null);
    };

    const handleSave = async (formData) => {
        try {
            if (modalMode === 'edit' && selectedHobby) {
                // Update existing
                await hobbiesService.updateHobby(selectedHobby.id, formData);
                addToast({
                    type: 'success',
                    title: 'Pasatiempo actualizado',
                    message: 'El pasatiempo se actualizó correctamente.'
                });
            } else {
                // Create new
                await hobbiesService.createHobby(activeId, formData);
                addToast({
                    type: 'success',
                    title: 'Pasatiempo creado',
                    message: 'El pasatiempo se agregó correctamente.'
                });
            }
            // Reload list
            await loadHobbies();
            closeModal();
        } catch (error) {
            console.error("Error saving hobby:", error);
            addToast({
                type: 'error',
                title: 'Error',
                message: error.message || 'Ocurrió un error al guardar el pasatiempo.'
            });
        }
    };

    const handleDeleteClick = (id) => {
        setDeleteId(id);
    };

    const confirmDelete = async () => {
        if (!deleteId) return;

        try {
            await hobbiesService.deleteHobby(deleteId);
            addToast({
                type: 'success',
                title: 'Pasatiempo eliminado',
                message: 'El pasatiempo ha sido eliminado.'
            });
            await loadHobbies();
        } catch (error) {
            console.error("Error deleting hobby:", error);
            addToast({
                type: 'error',
                title: 'Error',
                message: error.message || 'No se pudo eliminar el pasatiempo.'
            });
        } finally {
            setDeleteId(null);
        }
    };

    // ---------------------------------------------------------
    // RENDER
    // ---------------------------------------------------------
    return (
        <div className="
            bg-white dark:bg-[var(--color-secondary)] 
            border border-slate-200 dark:border-slate-700 
            rounded-2xl shadow-sm overflow-hidden
        ">
            <SectionHeader onAdd={openCreateModal} />

            <div className="p-5 bg-slate-50/10 dark:bg-slate-900/10">
                {/* Filter Input - Only show if there are hobbies */}
                {!loading && hobbies.length > 0 && (
                    <div className="relative flex items-center bg-white border border-slate-300 dark:bg-[var(--color-secondary)] dark:border-slate-700 rounded-lg w-full max-w-sm mb-4">
                        <Search size={16} className="absolute left-2 text-slate-500 dark:text-slate-400" />
                        <input
                            ref={inputRef}
                            type="text"
                            placeholder="Filtrar por título..."
                            value={filterText}
                            onChange={(e) => setFilterText(e.target.value)}
                            className="
                                pl-7 pr-4 py-1.5 bg-transparent
                                text-slate-700 dark:text-slate-200
                                text-sm outline-none
                                placeholder:text-slate-500 dark:placeholder:text-slate-500
                                w-full
                            "
                        />
                    </div>
                )}

                {loading ? (
                    <div className="py-12 flex justify-center text-slate-400 animate-pulse">
                        <span className="text-sm font-medium">Cargando pasatiempos...</span>
                    </div>
                ) : hobbies.length === 0 ? (
                    <EmptyState onAdd={openCreateModal} />
                ) : (
                    <>
                        {filteredHobbies.length === 0 ? (
                            <div className="py-12 text-center text-slate-400 text-sm italic border border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
                                No se encontraron pasatiempos con ese título.
                            </div>
                        ) : (
                            <div className="grid gap-3">
                                <AnimatePresence mode="popLayout">
                                    {filteredHobbies.map((hobby, index) => (
                                        <motion.div
                                            key={hobby.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                        >
                                            <HobbyRow
                                                hobby={hobby}
                                                onEdit={() => openEditModal(hobby)}
                                                onDelete={() => handleDeleteClick(hobby.id)}
                                            />
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* MODAL */}
            <HobbyModal
                open={isModalOpen}
                mode={modalMode}
                initialData={selectedHobby}
                onSave={handleSave}
                onClose={closeModal}
                section="hobbies"
            />

            {/* DELETE CONFIRMATION */}
            <ConfirmDialog
                open={!!deleteId}
                title="Eliminar Pasatiempo"
                message="¿Estás seguro de que deseas eliminar este pasatiempo? Esta acción no se puede deshacer."
                confirmLabel="Sí, eliminar"
                cancelLabel="Cancelar"
                confirmVariant="error"
                onConfirm={confirmDelete}
                onCancel={() => setDeleteId(null)}
            />
        </div>
    );
}

/* ==============================================================================================
   MODAL COMPONENT
   ============================================================================================== */
function HobbyModal({
    open,
    mode = 'create',
    initialData = null,
    onSave,
    onClose,
    section = 'hobbies'
}) {
    const { addToast } = useToastStore();
    const titleInputRef = useRef(null);

    // State
    const initialForm = { name: '' };
    const [form, setForm] = useState(initialForm);
    const [errors, setErrors] = useState({});
    const [showConfirmDiscard, setShowConfirmDiscard] = useState(false);

    // ---------------------------------------------------------
    // LIFECYCLE & EFFECTS
    // ---------------------------------------------------------
    useEffect(() => {
        if (open) {
            if (mode === 'edit' && initialData) {
                setForm({
                    name: initialData.name || ''
                });
            } else {
                setForm(initialForm);
            }
            setErrors({});
            setShowConfirmDiscard(false);

            // Focus title
            setTimeout(() => {
                titleInputRef.current?.focus();
            }, 100);
        }
    }, [open, mode, initialData]);

    // ---------------------------------------------------------
    // HELPERS
    // ---------------------------------------------------------
    const hasChanges = () => {
        if (mode === 'create') {
            return form.name.trim() !== '';
        }
        if (mode === 'edit' && initialData) {
            return form.name !== initialData.name;
        }
        return false;
    };

    const validate = () => {
        const newErrors = {};
        if (!form.name.trim()) newErrors.name = 'Campo obligatorio';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // ---------------------------------------------------------
    // HANDLERS
    // ---------------------------------------------------------
    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }));
        }
    };

    const handleSubmit = () => {
        if (!validate()) {
            addToast({
                type: 'error',
                title: 'Campos requeridos',
                message: 'Por favor completa todos los campos obligatorios.'
            });
            return;
        }
        onSave(form);
    };

    const handleCloseRequest = () => {
        if (hasChanges()) {
            setShowConfirmDiscard(true);
        } else {
            onClose();
        }
    };

    // ---------------------------------------------------------
    // KEYBOARD SHORTCUTS
    // ---------------------------------------------------------

    // ⚡ F5 from Electron — saves the form just like pressing Enter
    useEffect(() => {
        if (!open) return;

        const unsubscribe = window.electronAPI?.onSaveShortcut(() => {
            if (!open) return;
            // Check if we are in the correct section
            if (section && section !== 'hobbies') return;

            if (showConfirmDiscard) return;
            handleSubmit();
        });

        return () => unsubscribe?.();
    }, [open, showConfirmDiscard, form, section]);

    // ⚡ ESC Key - Explicit handling to ensure ConfirmDialog works
    useEffect(() => {
        if (!open) return;

        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                if (showConfirmDiscard) return;
                e.preventDefault();
                e.stopPropagation();
                handleCloseRequest();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [open, showConfirmDiscard, form]);

    useHotkeys(
        {
            enter: () => {
                if (!open || showConfirmDiscard) return;
                handleSubmit();
            }
        },
        [open, showConfirmDiscard, form],
        open
    );

    // ---------------------------------------------------------
    // RENDER
    // ---------------------------------------------------------
    if (!open) return null;

    return createPortal(
        <>
            <AnimatePresence>
                {open && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                        {/* BACKDROP CLICK HANDLER */}
                        <div className="absolute inset-0" onClick={handleCloseRequest} />

                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="relative bg-white dark:bg-secondary rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* HEADER */}
                            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
                                <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">
                                    {mode === 'create' ? 'Nuevo Pasatiempo' : 'Editar Pasatiempo'}
                                </h3>
                                <button
                                    onClick={handleCloseRequest}
                                    className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* BODY */}
                            <div className="p-6 space-y-5">
                                {/* Name Field */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 label-required">
                                        Nombre del Pasatiempo
                                    </label>
                                    <input
                                        ref={titleInputRef}
                                        name="name"
                                        value={form.name}
                                        onChange={handleChange}
                                        placeholder="Ej. Pintura, Natación..."
                                        className={`
                                            w-full px-3 py-2 rounded-lg border 
                                            bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100
                                            focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary
                                            transition-all
                                            ${errors.name
                                                ? 'border-error ring-1 ring-error/50'
                                                : 'border-slate-200 dark:border-slate-700'}
                                        `}
                                    />
                                    {errors.name && (
                                        <p className="text-xs text-error mt-1 flex items-center gap-1">
                                            <AlertCircle size={12} />
                                            {errors.name}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* FOOTER */}
                            <div className="flex items-center justify-end gap-3 px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800">
                                <button
                                    onClick={handleCloseRequest}
                                    className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    className="
                                        flex items-center gap-2 px-4 py-2 rounded-lg
                                        bg-primary text-white font-medium text-sm
                                        hover:bg-primary-dark shadow-sm hover:shadow
                                        transition-all
                                    "
                                >
                                    <Save size={16} />
                                    Guardar
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* DISCARD CHANGES CONFIRMATION */}
            <ConfirmDialog
                open={showConfirmDiscard}
                title="¿Descartar cambios?"
                message="Tienes cambios sin guardar. ¿Estás seguro de que deseas cerrar y perder los cambios?"
                confirmLabel="Sí, descartar"
                cancelLabel="Continuar editando"
                confirmVariant="error"
                onConfirm={() => {
                    setShowConfirmDiscard(false);
                    onClose();
                }}
                onCancel={() => setShowConfirmDiscard(false)}
            />
        </>,
        document.body
    );
}

/* ==============================================================================================
   SUB-COMPONENTS
   ============================================================================================== */
function SectionHeader({ onAdd }) {
    return (
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-[var(--color-secondary)]">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-[var(--color-primary)]/10 text-[var(--color-primary)] rounded-xl">
                        <Smile size={22} />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Pasatiempos</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Intereses y actividades recreativas del paciente.</p>
                    </div>
                </div>
                <button
                    onClick={onAdd}
                    className="flex items-center gap-2 px-4 py-2 bg-[var(--color-primary)] hover:opacity-90 text-white text-sm font-semibold rounded-xl transition-all shadow-sm active:scale-95"
                >
                    <Plus size={16} />
                    <span>Nuevo Pasatiempo</span>
                </button>
            </div>
        </div>
    );
}

function HobbyRow({ hobby, onEdit, onDelete }) {
    return (
        <div
            onClick={onEdit}
            className="group flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white dark:bg-[var(--color-secondary)] border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm hover:shadow-md hover:border-[var(--color-primary)]/30 transition-all cursor-pointer"
        >
            <div className="flex items-start gap-4 mb-3 sm:mb-0">
                <div className="hidden sm:flex items-center justify-center w-10 h-10 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-400 group-hover:text-[var(--color-primary)] transition-colors">
                    <Smile size={20} />
                </div>
                <div>
                    <h3 className="font-semibold text-slate-800 dark:text-slate-100 group-hover:text-[var(--color-primary)] transition-colors">
                        {hobby.name}
                    </h3>
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1">
                            <Calendar size={12} />
                            {new Date(hobby.createdAt).toLocaleDateString()}
                        </span>
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto">
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={(e) => { e.stopPropagation(); onEdit(); }}
                        className="p-2 text-slate-400 hover:text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 rounded-lg transition-colors"
                        title="Editar"
                    >
                        <Edit2 size={16} />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onDelete(); }}
                        className="p-2 text-slate-400 hover:text-[var(--color-error)] hover:bg-[var(--color-error)]/10 rounded-lg transition-colors"
                        title="Eliminar"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
}



function EmptyState({ onAdd }) {
    return (
        <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-800/20">
            <div className="p-4 bg-white dark:bg-slate-800 rounded-full shadow-sm mb-4">
                <Smile size={32} className="text-[var(--color-primary)]/50" />
            </div>
            <h3 className="text-base font-semibold text-slate-700 dark:text-slate-300">No hay pasatiempos aún</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 max-w-xs text-center">
                Registra los intereses y actividades recreativas del paciente para personalizar su atención.
            </p>
            <button
                onClick={onAdd}
                className="px-4 py-2 bg-white dark:bg-[var(--color-secondary)] border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 text-sm font-medium rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
            >
                Agregar pasatiempo ahora
            </button>
        </div>
    );
}
