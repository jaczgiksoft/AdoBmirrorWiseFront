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
                subtitle="Registro de interacciones y conversaciones con el paciente."
                onAdd={openCreateModal}
            >
                {/* Filter Input & Popover */}
                <div className="relative flex items-center bg-white border border-slate-300 dark:bg-secondary dark:border-slate-700 rounded-lg w-full max-w-sm mb-4">
                    <Search size={16} className="absolute left-2 text-slate-500 dark:text-slate-400" />
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="Filtrar por título..."
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
                    <div className="py-8 text-center text-slate-400 text-sm animate-pulse">
                        Cargando conversaciones...
                    </div>
                ) : filteredConversations.length === 0 ? (
                    <EmptyState text={filterText ? "No se encontraron conversaciones coincidentes." : "No hay conversaciones registradas. Presiona F2 para agregar una."} />
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredConversations.map(conv => (
                            <ConversationCard
                                key={conv.id}
                                conversation={conv}
                                onEdit={openEditModal}
                                onDelete={handleDeleteClick}
                            />
                        ))}
                    </div>
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
                title="Eliminar Conversación"
                message="¿Estás seguro de que deseas eliminar esta conversación? Esta acción no se puede deshacer."
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
                        flex items-center gap-1.5 px-3 py-1.5
                        bg-primary/10 text-primary hover:bg-primary hover:text-white
                        rounded-lg text-xs font-semibold transition-all
                    "
                >
                    <Plus size={14} />
                    Agregar
                </button>
            </div>
            <div className="mt-2">
                {children}
            </div>
        </div>
    );
}

function ConversationCard({ conversation, onEdit, onDelete }) {
    const employee = conversation.user?.employee;

    const employeeName = employee
        ? `${employee.first_name} ${employee.last_name}`
        : conversation.user?.username || "Desconocido";

    const employeeImage = employee?.profile_image;

    return (
        <div className="
            group relative flex flex-col gap-3
            bg-white dark:bg-secondary
            border border-slate-200 dark:border-slate-700
            rounded-xl p-4 shadow-sm
            hover:shadow-md hover:border-primary/30 transition-all duration-200
        ">
            {/* Header */}
            <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400">
                    <MessageSquare size={20} />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-sm text-slate-800 dark:text-slate-100 leading-tight line-clamp-1">
                            {conversation.title}
                        </h3>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1">
                        <Calendar size={12} />
                        <span>
                            {new Date(conversation.createdAt || new Date()).toLocaleDateString('es-MX', {
                                year: 'numeric', month: 'short', day: 'numeric'
                            })}
                        </span>
                    </div>
                </div>
            </div>

            {/* Content Preview */}
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 text-xs text-slate-600 dark:text-slate-300 leading-relaxed min-h-[60px] line-clamp-3">
                {conversation.content}
            </div>

            {/* Author Footer */}
            <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-700/50 mt-1">
                {employeeImage ? (
                    <img
                        src={employeeImage}
                        alt={employeeName}
                        className="w-5 h-5 rounded-full object-cover"
                    />
                ) : (
                    <div className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                        <User size={12} className="text-slate-500 dark:text-slate-400" />
                    </div>
                )}
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400 truncate">
                    {employeeName}
                </span>
            </div>

            {/* Actions Overlay (Visible on Hover) */}
            <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 dark:bg-slate-800/90 rounded-lg p-1 shadow-sm">
                <button
                    onClick={() => onEdit(conversation)}
                    className="p-1.5 text-slate-400 hover:text-blue-500 transition-colors"
                    title="Editar"
                >
                    <Edit2 size={14} />
                </button>
                <button
                    onClick={() => onDelete(conversation.id)}
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
                <MessageSquare size={32} className="text-slate-300 dark:text-slate-600" />
            </div>
            <p className="text-sm text-slate-400 dark:text-slate-500 italic">
                {text}
            </p>
        </div>
    );
}
