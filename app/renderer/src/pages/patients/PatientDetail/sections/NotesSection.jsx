import React, { useState, useEffect, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    StickyNote,
    Plus,
    Trash2,
    Edit2,
    Calendar,
    Search,
    Lock,
    FileText,
    User
} from 'lucide-react';
import { useHotkeys } from '@/hooks/useHotkeys';
import { ConfirmDialog } from '@/components/feedback';
import { useToastStore } from '@/store/useToastStore';
import * as notesService from '@/services/patientNotes.service';
import NotesModal from './components/NotesModal';
import NotesFilterPopover from './components/NotesFilterPopover';

/* ==============================================================================================
   MAIN SECTION COMPONENT
   ============================================================================================== */
export default function NotesSection({ patientId }) {
    const { profile } = useOutletContext();
    const activeId = patientId || profile?.id;
    const { addToast } = useToastStore();

    // ---------------------------------------------------------
    // STATE
    // ---------------------------------------------------------
    const [notes, setNotes] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'
    const [selectedNote, setSelectedNote] = useState(null);

    // Delete Confirmation State
    const [deleteId, setDeleteId] = useState(null);

    // Filter State
    const [filterText, setFilterText] = useState('');
    const [advancedFilters, setAdvancedFilters] = useState({ privacy: 'all' });
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

    const filteredNotes = notes.filter(note => {
        const matchesText = note.title.toLowerCase().includes(filterText.toLowerCase());

        let matchesPrivacy = true;
        if (advancedFilters.privacy === 'public') {
            matchesPrivacy = !note.is_private;
        } else if (advancedFilters.privacy === 'private') {
            matchesPrivacy = !!note.is_private;
        }

        return matchesText && matchesPrivacy;
    });

    // ---------------------------------------------------------
    // DATA LOADING
    // ---------------------------------------------------------
    const loadNotes = async () => {
        if (!activeId) return;
        setLoading(true);
        try {
            const data = await notesService.getNotesByPatientId(activeId);
            setNotes(data);
        } catch (err) {
            console.error("Error loading notes:", err);
            addToast({
                type: 'error',
                title: 'Error',
                message: 'No se pudieron cargar las notas.'
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadNotes();
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
        setSelectedNote(null);
        setIsModalOpen(true);
    };

    const openEditModal = (item) => {
        setModalMode('edit');
        setSelectedNote(item);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedNote(null);
    };

    const handleSave = async (formData) => {
        try {
            if (modalMode === 'edit' && selectedNote) {
                // Update existing
                await notesService.updateNote(selectedNote.id, formData);
                addToast({
                    type: 'success',
                    title: 'Nota actualizada',
                    message: 'La nota se actualizó correctamente.'
                });
            } else {
                // Create new
                await notesService.createNote({
                    patient_id: activeId,
                    ...formData
                });
                addToast({
                    type: 'success',
                    title: 'Nota creada',
                    message: 'La nota se creó correctamente.'
                });
            }
            await loadNotes();
            closeModal();
        } catch (err) {
            console.error("Error saving note:", err);
            addToast({
                type: 'error',
                title: 'Error',
                message: err.message || 'Ocurrió un error al guardar la nota.'
            });
        }
    };

    const handleDeleteClick = (id) => {
        setDeleteId(id);
    };

    const confirmDelete = async () => {
        if (deleteId) {
            try {
                await notesService.deleteNote(deleteId);
                addToast({
                    type: 'success',
                    title: 'Nota eliminada',
                    message: 'La nota se eliminó correctamente.'
                });
                await loadNotes();
            } catch (err) {
                console.error("Error deleting note:", err);
                addToast({
                    type: 'error',
                    title: 'Error',
                    message: err.message || 'No se pudo eliminar la nota.'
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
                title="Notas del Paciente"
                icon={StickyNote}
                subtitle="Registro de observaciones, recordatorios y notas privadas."
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
                        <NotesFilterPopover
                            filters={advancedFilters}
                            onApply={setAdvancedFilters}
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="py-8 text-center text-slate-400 text-sm animate-pulse">
                        Cargando notas...
                    </div>
                ) : filteredNotes.length === 0 ? (
                    <EmptyState text={filterText ? "No se encontraron notas coincidentes." : "No hay notas registradas. Presiona F2 para agregar una."} />
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredNotes.map(note => (
                            <NoteCard
                                key={note.id}
                                note={note}
                                onEdit={openEditModal}
                                onDelete={handleDeleteClick}
                            />
                        ))}
                    </div>
                )}
            </Section>

            {/* MODAL */}
            <NotesModal
                open={isModalOpen}
                mode={modalMode}
                initialData={selectedNote}
                onSave={handleSave}
                onClose={closeModal}
                section="notes"
            />

            {/* DELETE CONFIRMATION */}
            <ConfirmDialog
                open={!!deleteId}
                title="Eliminar Nota"
                message="¿Estás seguro de que deseas eliminar esta nota? Esta acción no se puede deshacer."
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
                        btn-primary-soft
                        rounded-lg text-xs font-semibold transition-all cursor-pointer
                    "
                >
                    <Plus size={14} />
                    Agregar Nota
                </button>
            </div>
            <div className="mt-2">
                {children}
            </div>
        </div>
    );
}

function NoteCard({ note, onEdit, onDelete }) {
    const [hoveredAction, setHoveredAction] = useState(null);
    const employee = note.user?.employee;

    const employeeName = employee
        ? `${employee.first_name} ${employee.last_name}`
        : note.user?.username || "Desconocido";

    const employeeImage = employee?.profile_image;

    return (
        <div
            className="
                group relative flex flex-col gap-3
                rounded-xl p-4

                bg-white dark:bg-slate-800
                border border-slate-200 dark:border-slate-700
                shadow-sm hover:shadow-md

                /* 📄 Fondo tipo hoja rayada */
                bg-[linear-gradient(to_bottom,transparent_23px,rgba(148,163,184,0.25)_24px)]
                dark:bg-[linear-gradient(to_bottom,transparent_23px,rgba(148,163,184,0.12)_24px)]
                bg-[length:100%_24px]
            "
        >
            {/* Header */}
            <div className="flex items-start gap-3">
                <div
                    className={`p-2 rounded-lg ${note.is_private
                        ? "bg-amber-100 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400"
                        : "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
                        }`}
                >
                    {note.is_private ? <Lock size={18} /> : <FileText size={18} />}
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-sm text-slate-800 dark:text-slate-100 line-clamp-1">
                            {note.title}
                        </h3>

                        {note.is_private && (
                            <span className="
                                px-1.5 py-0.5 rounded text-[10px] font-bold
                                bg-amber-100 text-amber-700
                                dark:bg-amber-900/30 dark:text-amber-400
                                border border-amber-200 dark:border-amber-800/30
                            ">
                                PRIVADO
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1">
                        <Calendar size={12} />
                        <span>
                            {new Date(note.createdAt || new Date()).toLocaleDateString("es-MX", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                            })}
                        </span>
                    </div>
                </div>
            </div>

            {/* ✍️ Contenido alineado a renglones */}
            <div
                className="
                    text-xs leading-[24px]
                    text-slate-700 dark:text-slate-200
                    min-h-[72px]
                    line-clamp-3
                "
            >
                {note.content}
            </div>

            {/* Autor */}
            <div className="flex items-center gap-2 pt-2 mt-1 border-t border-slate-100 dark:border-slate-700/50">
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

            {/* Acciones */}
            <div className="
                absolute top-3 right-3 flex items-center gap-1
                opacity-0 group-hover:opacity-100 transition-all duration-200 translate-y-1 group-hover:translate-y-0
                bg-white/90 dark:bg-slate-800/90
                rounded-lg p-1 shadow-sm
            ">
                <div className="relative">
                    <button
                        onClick={() => onEdit(note)}
                        onMouseEnter={() => setHoveredAction('edit')}
                        onMouseLeave={() => setHoveredAction(null)}
                        className="p-1.5 text-slate-400 hover:text-blue-500 transition-colors"
                    >
                        <Edit2 size={14} />
                    </button>
                    <AnimatePresence>
                        {hoveredAction === 'edit' && (
                            <motion.div
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 5 }}
                                className="
                                    absolute bottom-full left-1/2 -translate-x-1/2 mb-2
                                    px-2 py-1 rounded text-[10px] font-medium
                                    bg-slate-800 text-white shadow-xl whitespace-nowrap
                                    z-50
                                "
                            >
                                Editar
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <div className="relative">
                    <button
                        onClick={() => onDelete(note.id)}
                        onMouseEnter={() => setHoveredAction('delete')}
                        onMouseLeave={() => setHoveredAction(null)}
                        className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"
                    >
                        <Trash2 size={14} />
                    </button>
                    <AnimatePresence>
                        {hoveredAction === 'delete' && (
                            <motion.div
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 5 }}
                                className="
                                    absolute bottom-full left-1/2 -translate-x-1/2 mb-2
                                    px-2 py-1 rounded text-[10px] font-medium
                                    bg-red-600 text-white shadow-xl whitespace-nowrap
                                    z-50
                                "
                            >
                                Eliminar
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}

function EmptyState({ text }) {
    return (
        <div className="text-center py-8 border border-dashed border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-800/30">
            <div className="flex justify-center mb-2">
                <StickyNote size={32} className="text-slate-300 dark:text-slate-600" />
            </div>
            <p className="text-sm text-slate-400 dark:text-slate-500 italic">
                {text}
            </p>
        </div>
    );
}
