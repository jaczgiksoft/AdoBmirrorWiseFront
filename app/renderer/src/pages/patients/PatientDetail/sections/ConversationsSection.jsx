import React, { useState, useEffect, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
    MessageSquare,
    Plus,
    Trash2,
    Edit2,
    Calendar,
    Search,
    User
} from 'lucide-react';
import { useHotkeys } from '@/hooks/useHotkeys';
import { ConfirmDialog } from '@/components/feedback';
import { useToastStore } from '@/store/useToastStore';
import * as conversationsService from '@/services/patientConversations.service';
import ConversationsModal from './components/ConversationsModal';
import ConversationsFilterPopover from './components/ConversationsFilterPopover';
import ConversationTimeline from './components/ConversationTimeline';


/* ==============================================================================================
   MAIN SECTION COMPONENT
   ============================================================================================== */
export default function ConversationsSection({ patientId }) {
    const { profile } = useOutletContext();
    const activeId = patientId || profile?.id;
    const { addToast } = useToastStore();

    // ---------------------------------------------------------
    // STATE
    // ---------------------------------------------------------
    const [conversations, setConversations] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'
    const [selectedConversation, setSelectedConversation] = useState(null);

    // Delete Confirmation State
    const [deleteId, setDeleteId] = useState(null);

    // Filter State
    const [filterText, setFilterText] = useState('');
    const [advancedFilters, setAdvancedFilters] = useState({ sort: 'newest' });
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

    const safeConversations = Array.isArray(conversations) ? conversations : [];

    const filteredConversations = safeConversations
        .filter(conv => conv.title?.toLowerCase().includes(filterText.toLowerCase()))
        .sort((a, b) => {
            const dateA = new Date(a.createdAt);
            const dateB = new Date(b.createdAt);
            return advancedFilters.sort === 'newest' ? dateB - dateA : dateA - dateB;
        });

    // ---------------------------------------------------------
    // DATA LOADING
    // ---------------------------------------------------------
    const loadConversations = async () => {
        if (!activeId) return;
        setLoading(true);
        try {
            const data = await conversationsService.getConversationsByPatientId(activeId);
            setConversations(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Error loading conversations:", err);
            addToast({
                type: 'error',
                title: 'Error',
                message: 'No se pudieron cargar las conversaciones.'
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadConversations();
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
        setSelectedConversation(null);
        setIsModalOpen(true);
    };

    const openEditModal = (item) => {
        setModalMode('edit');
        setSelectedConversation(item);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedConversation(null);
    };

    const handleSave = async (formData) => {
        try {
            if (modalMode === 'edit' && selectedConversation) {
                // Update existing
                await conversationsService.updateConversation(selectedConversation.id, formData);
                addToast({
                    type: 'success',
                    title: 'Conversación actualizada',
                    message: 'La conversación se actualizó correctamente.'
                });
            } else {
                // Create new
                await conversationsService.createConversation({
                    patient_id: activeId,
                    ...formData
                });
                addToast({
                    type: 'success',
                    title: 'Conversación creada',
                    message: 'La conversación se creó correctamente.'
                });
            }
            await loadConversations();
            closeModal();
        } catch (err) {
            console.error("Error saving conversation:", err);
            addToast({
                type: 'error',
                title: 'Error',
                message: err.message || 'Ocurrió un error al guardar la conversación.'
            });
        }
    };

    const handleDeleteClick = (id) => {
        setDeleteId(id);
    };

    const confirmDelete = async () => {
        if (deleteId) {
            try {
                await conversationsService.deleteConversation(deleteId);
                addToast({
                    type: 'success',
                    title: 'Conversación eliminada',
                    message: 'La conversación se eliminó correctamente.'
                });
                await loadConversations();
            } catch (err) {
                console.error("Error deleting conversation:", err);
                addToast({
                    type: 'error',
                    title: 'Error',
                    message: err.message || 'No se pudo eliminar la conversación.'
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
                title="Conversaciones"
                icon={MessageSquare}
                subtitle="Registro clínico continuo y seguimiento del paciente."
                onAdd={openCreateModal}
            >
                {/* Filter Input & Popover */}
                <div className="relative flex items-center bg-white border border-slate-300 dark:bg-secondary dark:border-slate-700 rounded-lg w-full max-w-sm mb-4">
                    <Search size={16} className="absolute left-2 text-slate-500 dark:text-slate-400" />
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="Buscar en historial..."
                        value={filterText}
                        onChange={(e) => setFilterText(e.target.value)}
                        className="
                            pl-7 pr-20 py-1.5 bg-transparent
                            text-slate-700 dark:text-slate-200
                            text-sm outline-none
                            placeholder:text-slate-500 dark:placeholder:text-slate-500
                            w-full
                        "
                    />

                    <div className="absolute right-1">
                        <ConversationsFilterPopover
                            filters={advancedFilters}
                            onApply={setAdvancedFilters}
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="py-12 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-secondary animate-pulse flex flex-col items-center justify-center space-y-3">
                        <div className="h-10 w-10 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
                        <div className="h-4 w-48 bg-slate-200 dark:bg-slate-700 rounded"></div>
                        <div className="h-3 w-32 bg-slate-200 dark:bg-slate-700 rounded"></div>
                    </div>
                ) : (
                    <ConversationTimeline
                        conversations={filteredConversations}
                        onEdit={openEditModal}
                        onDelete={handleDeleteClick}
                    />
                )}
            </Section>

            {/* MODAL */}
            <ConversationsModal
                open={isModalOpen}
                mode={modalMode}
                initialData={selectedConversation}
                onSave={handleSave}
                onClose={closeModal}
                section="conversations"
            />

            {/* DELETE CONFIRMATION */}
            <ConfirmDialog
                open={!!deleteId}
                title="Eliminar registro"
                message="¿Estás seguro de que deseas eliminar este registro del historial? Esta acción no se puede deshacer."
                confirmLabel="Sí, eliminar"
                cancelLabel="Cancelar"
                confirmVariant="error"
                onConfirm={confirmDelete}
                onCancel={() => setDeleteId(null)}
            />
        </div >
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
            rounded-2xl shadow-sm overflow-hidden
        ">
            {/* Header Section */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-secondary">
                <div className="flex items-start justify-between">
                    <div>
                        <h2 className="text-lg font-bold flex items-center gap-2 text-primary">
                            <Icon size={22} className="opacity-90" />
                            {title}
                        </h2>
                        {subtitle && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed font-medium">
                                {subtitle}
                            </p>
                        )}
                    </div>
                    <button
                        onClick={onAdd}
                        className="
                            flex items-center gap-2
                            px-4 py-2
                            bg-primary text-white
                            rounded-xl shadow-sm
                            text-sm font-semibold
                            hover:bg-primary/90
                            active:scale-[0.97]
                            transition-all duration-150 cursor-pointer"
                    >
                        <Plus size={16} />
                        Agregar Registro
                    </button>
                </div>
            </div>

            {/* Content Section */}
            <div className="p-5 bg-slate-50/10 dark:bg-slate-900/10">
                {children}
            </div>
        </div>
    );
}
