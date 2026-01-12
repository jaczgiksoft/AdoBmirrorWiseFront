import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useOutletContext } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Pill,
    Plus,
    Trash2,
    Edit2,
    Calendar,
    FileText,
    X,
    Save,
    AlertCircle,
    Search
} from 'lucide-react';
import { useHotkeys } from '@/hooks/useHotkeys';
import { ConfirmDialog } from '@/components/feedback';
import { useToastStore } from '@/store/useToastStore';
import * as prescriptionsService from '@/services/prescriptions.service';
import PrescriptionModal from './components/PrescriptionModal';

/* ==============================================================================================
   MAIN SECTION COMPONENT
   ============================================================================================== */
export default function PrescriptionsSection({ patientId }) {
    const { profile } = useOutletContext();
    const activeId = patientId || profile?.id;
    const { addToast } = useToastStore();

    // ---------------------------------------------------------
    // STATE
    // ---------------------------------------------------------
    const [prescriptions, setPrescriptions] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'
    const [selectedPrescription, setSelectedPrescription] = useState(null);

    // Delete Confirmation State
    const [deleteId, setDeleteId] = useState(null);

    // Filter State
    const [filterText, setFilterText] = useState('');
    const inputRef = useRef(null);

    // F1 Shortcut
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

    const filteredPrescriptions = prescriptions.filter(rx =>
        rx.title.toLowerCase().includes(filterText.toLowerCase())
    );

    // ---------------------------------------------------------
    // DATA LOADING
    // ---------------------------------------------------------
    const loadPrescriptions = async () => {
        if (!activeId) return;
        setLoading(true);
        try {
            const data = await prescriptionsService.getPrescriptionsByPatient(activeId);
            setPrescriptions(data);
        } catch (err) {
            console.error("Error loading prescriptions:", err);
            addToast({
                type: 'error',
                title: 'Error',
                message: 'No se pudieron cargar las recetas.'
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadPrescriptions();
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
        setSelectedPrescription(null);
        setIsModalOpen(true);
    };

    const openEditModal = (item) => {
        setModalMode('edit');
        setSelectedPrescription(item);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedPrescription(null);
    };

    const handleSave = async (formData) => {
        try {
            if (modalMode === 'edit' && selectedPrescription) {
                // Update existing
                await prescriptionsService.updatePrescription(selectedPrescription.id, formData);
                addToast({
                    type: 'success',
                    title: 'Receta actualizada',
                    message: 'La receta se actualizó correctamente.'
                });
            } else {
                // Create new
                await prescriptionsService.createPrescription(activeId, formData);
                addToast({
                    type: 'success',
                    title: 'Receta creada',
                    message: 'La receta se creó correctamente.'
                });
            }
            await loadPrescriptions();
            closeModal();
        } catch (err) {
            console.error("Error saving prescription:", err);
            addToast({
                type: 'error',
                title: 'Error',
                message: err.message || 'Ocurrió un error al guardar la receta.'
            });
        }
    };

    const handleDeleteClick = (id) => {
        setDeleteId(id);
    };

    const confirmDelete = async () => {
        if (deleteId) {
            try {
                await prescriptionsService.deletePrescription(deleteId);
                addToast({
                    type: 'success',
                    title: 'Receta eliminada',
                    message: 'La receta se eliminó correctamente.'
                });
                await loadPrescriptions();
            } catch (err) {
                console.error("Error deleting prescription:", err);
                addToast({
                    type: 'error',
                    title: 'Error',
                    message: err.message || 'No se pudo eliminar la receta.'
                });
            } finally {
                setDeleteId(null);
            }
        }
    };

    // ---------------------------------------------------------
    // RENDER
    // ---------------------------------------------------------
    return (
        <div className="space-y-6 text-slate-800 dark:text-slate-100">
            <Section
                title="Recetas Médicas"
                icon={Pill}
                subtitle="Historial de recetas y prescripciones emitidas al paciente."
                onAdd={openCreateModal}
            >
                {/* Filter Input */}
                <div className="relative flex items-center bg-white border border-slate-300 dark:bg-secondary dark:border-slate-700 rounded-lg w-full max-w-sm mb-4">
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

                {loading ? (
                    <div className="py-8 text-center text-slate-400 text-sm animate-pulse">
                        Cargando recetas...
                    </div>
                ) : filteredPrescriptions.length === 0 ? (
                    <EmptyState text={filterText ? "No se encontraron recetas coincidentes." : "No hay recetas registradas. Presiona F2 para agregar una."} />
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredPrescriptions.map(rx => (
                            <PrescriptionCard
                                key={rx.id}
                                prescription={rx}
                                onEdit={openEditModal}
                                onDelete={handleDeleteClick}
                            />
                        ))}
                    </div>
                )}
            </Section>

            {/* MODAL */}
            <PrescriptionModal
                open={isModalOpen}
                mode={modalMode}
                initialData={selectedPrescription}
                onSave={handleSave}
                onClose={closeModal}
                section="prescriptions"
            />

            {/* DELETE CONFIRMATION */}
            <ConfirmDialog
                open={!!deleteId}
                title="Eliminar Receta"
                message="¿Estás seguro de que deseas eliminar esta receta? Esta acción no se puede deshacer."
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
   HELPER COMPONENTS
   ============================================================================================== */

function Section({ title, icon: Icon, subtitle, children, onAdd }) {
    return (
        <div className="
            bg-white dark:bg-secondary
            border border-slate-200 dark:border-slate-700
            rounded-2xl p-5 shadow-sm
            space-y-4
        ">
            <div className="flex items-start justify-between">
                <div>
                    <h2 className="text-lg font-bold flex items-center gap-2 text-primary">
                        <Icon size={20} className="opacity-80" />
                        {title}
                    </h2>
                    {subtitle && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                            {subtitle}
                        </p>
                    )}
                </div>
                <button
                    onClick={onAdd}
                    className="
                        flex items-center gap-2
            px-4 py-2
            bg-primary/10 text-primary
            rounded-xl shadow-sm
            text-sm font-medium
            hover:bg-primary hover:text-white
            active:scale-[0.97]
            transition-all duration-150 cursor-pointer"
                >
                    <Plus size={14} />
                    Agregar Receta
                </button>
            </div>
            <div className="mt-2">
                {children}
            </div>
        </div>
    );
}

function PrescriptionCard({ prescription: rx, onEdit, onDelete }) {
    return (
        <div className="
            group relative flex flex-col gap-3
            bg-white dark:bg-secondary
            border border-slate-200 dark:border-slate-700
            rounded-xl p-4 shadow-sm h-full
            hover:shadow-md hover:border-primary/30 transition-all duration-200
        ">
            {/* Header */}
            <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 shrink-0">
                    <FileText size={20} />
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm text-slate-800 dark:text-slate-100 leading-tight truncate" title={rx.title}>
                        {rx.title}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1">
                        <Calendar size={12} />
                        <span>
                            {new Date(rx.createdAt).toLocaleDateString('es-MX', {
                                year: 'numeric', month: 'short', day: 'numeric'
                            })}
                        </span>
                    </div>
                </div>
            </div>

            {/* Content Preview */}
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 text-xs text-slate-600 dark:text-slate-300 leading-relaxed min-h-[60px]">
                <p className="line-clamp-3">
                    {rx.content}
                </p>
            </div>

            {/* Actions Overlay (Visible on Hover) */}
            <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 dark:bg-slate-800/90 rounded-lg p-1 shadow-sm">
                <button
                    onClick={() => onEdit(rx)}
                    className="p-1.5 text-slate-400 hover:text-blue-500 transition-colors"
                    title="Editar"
                >
                    <Edit2 size={14} />
                </button>
                <button
                    onClick={() => onDelete(rx.id)}
                    className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"
                    title="Eliminar"
                >
                    <Trash2 size={14} />
                </button>
            </div>
        </div>
    );
}

function EmptyState({ text }) {
    return (
        <div className="text-center py-8 border border-dashed border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-800/30">
            <div className="flex justify-center mb-2">
                <Pill size={32} className="text-slate-300 dark:text-slate-600" />
            </div>
            <p className="text-sm text-slate-400 dark:text-slate-500 italic">
                {text}
            </p>
        </div>
    );
}
