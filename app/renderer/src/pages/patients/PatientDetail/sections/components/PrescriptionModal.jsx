import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, AlertCircle } from 'lucide-react';

import { ConfirmDialog } from '@/components/feedback';
import { useToastStore } from '@/store/useToastStore';

export default function PrescriptionModal({
    open,
    mode = 'create', // 'create' | 'edit'
    initialData = null,
    onSave,
    onClose,
    section = 'prescriptions'
}) {
    const { addToast } = useToastStore();
    const titleInputRef = useRef(null);

    // ---------------------------------------------------------
    // STATE
    // ---------------------------------------------------------
    const initialForm = {
        title: '',
        content: ''
    };

    const [form, setForm] = useState(initialForm);
    const [errors, setErrors] = useState({});
    const [showConfirmDiscard, setShowConfirmDiscard] = useState(false);

    // ---------------------------------------------------------
    // EFFECTS
    // ---------------------------------------------------------

    // Reset form when opening
    useEffect(() => {
        if (open) {
            if (mode === 'edit' && initialData) {
                setForm({
                    title: initialData.title || '',
                    content: initialData.content || ''
                });
            } else {
                setForm(initialForm);
            }
            setErrors({});
            setShowConfirmDiscard(false);

            // Auto-focus title
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
            return form.title.trim() !== '' || form.content.trim() !== '';
        }
        if (mode === 'edit' && initialData) {
            return (
                form.title !== initialData.title ||
                form.content !== initialData.content
            );
        }
        return false;
    };

    const validate = () => {
        const newErrors = {};
        if (!form.title.trim()) newErrors.title = 'Campo obligatorio';
        if (!form.content.trim()) newErrors.content = 'Campo obligatorio';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // ---------------------------------------------------------
    // HANDLERS
    // ---------------------------------------------------------
    // ---------------------------------------------------------
    // HANDLERS
    // ---------------------------------------------------------
    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
        // Clear error when typing
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

    // User requested "onRequestClose" naming convention
    const onRequestClose = () => {
        if (hasChanges()) {
            setShowConfirmDiscard(true);
        } else {
            onClose();
        }
    };

    // ---------------------------------------------------------
    // KEYBOARD SHORTCUTS
    // ---------------------------------------------------------

    // 1. F5 Shortcut (via electronAPI)
    useEffect(() => {
        if (!open) return;

        const unsubscribe = window.electronAPI?.onSaveShortcut(() => {
            if (!open) return;
            // Check if we are in the correct section (if prop is provided)
            if (section && section !== 'prescriptions') return;

            if (showConfirmDiscard) return;
            handleSubmit();
        });

        return () => unsubscribe?.();
    }, [open, showConfirmDiscard, form, errors, section]); // Dependencies for closure

    // 2. ESC Shortcut (via window keydown)
    useEffect(() => {
        if (!open) return;

        const handleKey = (e) => {
            if (e.key === "Escape") {
                e.preventDefault();
                e.stopPropagation();
                onRequestClose();
            }
        };

        window.addEventListener("keydown", handleKey);
        return () => window.removeEventListener("keydown", handleKey);
    }, [open, showConfirmDiscard, form, initialData]); // Dependencies for onRequestClose -> hasChanges

    // 3. Enter Shortcut (Global for modal)
    useEffect(() => {
        if (!open) return;

        const handleEnter = (e) => {
            if (e.key === 'Enter') {
                // Ignore if ConfirmDialog is open
                if (showConfirmDiscard) return;

                // Ignore if in textarea (unless Ctrl+Enter, but keeping simple as per request)
                if (document.activeElement?.tagName === 'TEXTAREA') return;

                e.preventDefault();
                handleSubmit();
            }
        };

        window.addEventListener('keydown', handleEnter);
        return () => window.removeEventListener('keydown', handleEnter);
    }, [open, showConfirmDiscard, form, errors]);

    // ---------------------------------------------------------
    // RENDER
    // ---------------------------------------------------------
    if (!open) return null;

    return createPortal(
        <>
            <AnimatePresence>
                {open && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white dark:bg-secondary rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
                        >
                            {/* HEADER */}
                            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
                                <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">
                                    {mode === 'create' ? 'Nueva Receta' : 'Editar Receta'}
                                </h3>
                                <button
                                    onClick={onRequestClose}
                                    className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* BODY */}
                            <div className="p-6 space-y-5 overflow-y-auto">
                                {/* Name Field */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 label-required">
                                        Medicamento / Título
                                    </label>
                                    <input
                                        ref={titleInputRef}
                                        name="title"
                                        value={form.title}
                                        onChange={handleChange}
                                        placeholder="Ej. Amoxicilina 500mg"
                                        className={`
                                            w-full px-3 py-2 rounded-lg border 
                                            bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100
                                            focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary
                                            transition-all
                                            ${errors.title
                                                ? 'border-red-500 ring-1 ring-red-500/50'
                                                : 'border-slate-200 dark:border-slate-700'}
                                        `}
                                    />
                                    {errors.title && (
                                        <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                                            <AlertCircle size={12} />
                                            {errors.title}
                                        </p>
                                    )}
                                </div>

                                {/* Content Field */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 label-required">
                                        Indicaciones
                                    </label>
                                    <textarea
                                        name="content"
                                        value={form.content}
                                        onChange={handleChange}
                                        rows={6}
                                        placeholder="Ej. Tomar 1 cápsula cada 8 horas por 7 días..."
                                        className={`
                                            w-full px-3 py-2 rounded-lg border resize-none
                                            bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100
                                            focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary
                                            transition-all
                                            ${errors.content
                                                ? 'border-red-500 ring-1 ring-red-500/50'
                                                : 'border-slate-200 dark:border-slate-700'}
                                        `}
                                    />
                                    {errors.content && (
                                        <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                                            <AlertCircle size={12} />
                                            {errors.content}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* FOOTER */}
                            <div className="flex items-center justify-end gap-3 px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800">
                                <button
                                    onClick={onRequestClose}
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
