import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, AlertCircle, Lock, Unlock } from 'lucide-react';

import { ConfirmDialog } from '@/components/feedback';
import { useToastStore } from '@/store/useToastStore';

export default function NotesModal({
    open,
    mode = 'create', // 'create' | 'edit'
    initialData = null,
    onSave,
    onClose,
    section = 'notes'
}) {
    const { addToast } = useToastStore();
    const titleInputRef = useRef(null);

    // ---------------------------------------------------------
    // STATE
    // ---------------------------------------------------------
    const initialForm = {
        title: '',
        content: '',
        is_private: false
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
                    content: initialData.content || '',
                    is_private: initialData.is_private || false
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
            return form.title.trim() !== '' || form.content.trim() !== '' || form.is_private !== false;
        }
        if (mode === 'edit' && initialData) {
            return (
                form.title !== initialData.title ||
                form.content !== initialData.content ||
                form.is_private !== initialData.is_private
            );
        }
        return false;
    };

    const validate = () => {
        const newErrors = {};
        if (!form.title.trim()) newErrors.title = 'Campo obligatorio';
        if (form.title.length > 150) newErrors.title = 'Máximo 150 caracteres';

        if (!form.content.trim()) newErrors.content = 'Campo obligatorio';
        if (form.content.length > 5000) newErrors.content = 'Máximo 5000 caracteres';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

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

    const handleSwitchChange = (checked) => {
        setForm(prev => ({ ...prev, is_private: checked }));
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
            if (section && section !== 'notes') return;

            if (showConfirmDiscard) return;
            handleSubmit();
        });

        return () => unsubscribe?.();
    }, [open, showConfirmDiscard, form, errors, section]);

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
    }, [open, showConfirmDiscard, form, initialData]);

    // 3. Enter Shortcut (Global for modal)
    useEffect(() => {
        if (!open) return;

        const handleEnter = (e) => {
            if (e.key === 'Enter') {
                // Ignore if ConfirmDialog is open
                if (showConfirmDiscard) return;

                // Ignore if in textarea
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
                                    {mode === 'create' ? 'Nueva Nota' : 'Editar Nota'}
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
                                {/* Title Field */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 label-required">
                                        Título
                                    </label>
                                    <input
                                        ref={titleInputRef}
                                        name="title"
                                        value={form.title}
                                        onChange={handleChange}
                                        placeholder="Ej. Observaciones generales"
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
                                        Contenido
                                    </label>
                                    <textarea
                                        name="content"
                                        value={form.content}
                                        onChange={handleChange}
                                        rows={6}
                                        placeholder="Escribe los detalles de la nota..."
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

                                {/* Private Switch */}
                                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${form.is_private ? 'bg-amber-100 text-amber-600' : 'bg-slate-200 text-slate-500'}`}>
                                            {form.is_private ? <Lock size={18} /> : <Unlock size={18} />}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                                                Nota Privada
                                            </p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                                Solo visible para usuarios autorizados
                                            </p>
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        role="switch"
                                        aria-checked={form.is_private}
                                        onClick={() => handleSwitchChange(!form.is_private)}
                                        className={`
                                            relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
                                            ${form.is_private ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-600'}
                                        `}
                                    >
                                        <span
                                            className={`
                                                inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm
                                                ${form.is_private ? 'translate-x-6' : 'translate-x-1'}
                                            `}
                                        />
                                    </button>
                                </div>
                            </div>

                            {/* FOOTER */}
                            <div className="flex items-center justify-end gap-3 px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800">
                                <button
                                    onClick={onRequestClose}
                                    className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors cursor-pointer"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    className="
                                        flex items-center gap-2 px-4 py-2 rounded-lg
                                        bg-primary text-white font-medium text-sm
                                        hover:bg-primary-dark shadow-sm hover:shadow
                                        transition-all cursor-pointer
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
