import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ClipboardList,
    Plus,
    Trash2,
    Calendar,
    ChevronDown,
    ChevronUp,
    Layout,
    Check,
    X,
    Save,
    GripVertical
} from 'lucide-react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { useHotkeys } from '@/hooks/useHotkeys';
import { useToastStore } from '@/store/useToastStore';

/* ==============================================================================================
   MOCK DATA & CATALOG
   ============================================================================================== */
const MOCK_TREATMENT_PLANS = [
    {
        id: 1,
        title: "Orthodontic Phase 1",
        start_date: "2025-01-15",
        duration_months: 12,
        is_main: true,
        treatments: [
            { id: 'tx-101', title: "Metal brackets", description: "Initial placement", color: "blue" },
            { id: 'tx-102', title: "Dental alignment", description: "Progressive correction", color: "green" }
        ]
    },
    {
        id: 2,
        title: "Retainers",
        start_date: "2025-12-01",
        duration_months: 6,
        is_main: false,
        treatments: [
            { id: 'tx-201', title: "Hawley retainers", description: "Night-only use", color: "purple" }
        ]
    }
];

const MOCK_TREATMENT_CATALOG = [
    { title: "Metal brackets", color: "blue", description: "Initial placement" },
    { title: "Dental alignment", color: "green", description: "Progressive correction" },
    { title: "Hawley retainers", color: "purple", description: "Night use" },
    { title: "Ceramic brackets", color: "white", description: "Aesthetic option" },
    { title: "Invisalign", color: "teal", description: "Clear aligners" },
    { title: "Hyrax Expander", color: "red", description: "Palatal expansion" }
];

/* ==============================================================================================
   MAIN COMPONENT
   ============================================================================================== */
export default function TreatmentPlanSection() {
    const { addToast } = useToastStore();

    // -- State --
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // -- Data Loading (Mock) --
    useEffect(() => {
        const timer = setTimeout(() => {
            setPlans(MOCK_TREATMENT_PLANS);
            setLoading(false);
        }, 600);
        return () => clearTimeout(timer);
    }, []);

    // -- Shortcuts (Global) --
    useHotkeys(
        {
            n: (e) => {
                e.preventDefault();
                openModal();
            }
        },
        [isModalOpen],
        !isModalOpen
    );

    // -- Actions --
    const openModal = () => setIsModalOpen(true);
    const closeModal = () => setIsModalOpen(false);

    const handleSave = (newPlan) => {
        const planWithId = { ...newPlan, id: Date.now() };
        setPlans(prev => [planWithId, ...prev]);
        addToast({
            type: 'success',
            title: 'Plan Creado',
            message: 'El plan de tratamiento se ha guardado correctamente.'
        });
        closeModal();
    };

    const handleDelete = (id) => {
        setPlans(prev => prev.filter(p => p.id !== id));
        addToast({
            type: 'success',
            title: 'Plan Eliminado',
            message: 'El plan de tratamiento ha sido eliminado.'
        });
    };

    // -- Render --
    return (
        <div className="space-y-6 text-slate-800 dark:text-slate-100">
            <SectionHeader
                title="Planes de Tratamiento"
                subtitle="Gestión y seguimiento de fases de tratamiento."
                onAdd={openModal}
            />

            {loading ? (
                <div className="py-8 text-center text-slate-400 text-sm animate-pulse">
                    Cargando planes...
                </div>
            ) : plans.length === 0 ? (
                <EmptyState onAdd={openModal} />
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {plans.map(plan => (
                        <TreatmentPlanCard
                            key={plan.id}
                            plan={plan}
                            onDelete={() => handleDelete(plan.id)}
                        />
                    ))}
                </div>
            )}

            <TreatmentPlanModal
                isOpen={isModalOpen}
                onClose={closeModal}
                onSave={handleSave}
            />
        </div>
    );
}

/* ==============================================================================================
   SUB-COMPONENTS
   ============================================================================================== */

function SectionHeader({ title, subtitle, onAdd }) {
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
                        <ClipboardList size={20} className="opacity-80" />
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
                    title="Nueva (N)"
                    className="
                        flex items-center gap-1.5 px-3 py-1.5
                        bg-primary/10 text-cyan border border-primary/20
                        hover:bg-primary hover:text-white hover:border-primary
                        rounded-lg text-xs font-semibold transition-all duration-200
                    "
                >
                    <Plus size={14} />
                    Nuevo Plan
                </button>
            </div>
        </div>
    );
}

function EmptyState({ onAdd }) {
    return (
        <div className="text-center py-12 border border-dashed border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-800/30">
            <div className="flex justify-center mb-3">
                <Layout size={40} className="text-slate-300 dark:text-slate-600" />
            </div>
            <p className="text-sm text-slate-400 dark:text-slate-500 italic mb-4">
                No hay planes de tratamiento activos.
            </p>
            <button
                onClick={onAdd}
                className="text-primary text-xs font-semibold hover:underline"
            >
                Crear nuevo plan (N)
            </button>
        </div>
    );
}

function TreatmentPlanCard({ plan, onDelete }) {
    const [isExpanded, setIsExpanded] = useState(true);

    return (
        <div className="
            group flex flex-col
            bg-white dark:bg-secondary
            border border-slate-200 dark:border-slate-700
            rounded-xl shadow-sm
            overflow-hidden
            hover:shadow-md transition-all duration-200
        ">
            <div className="flex items-start p-4 gap-4">
                <div className={`
                    w-1 self-stretch rounded-full 
                    ${plan.is_main ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-600'}
                `} />

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                            {plan.title}
                        </h3>
                        {plan.is_main && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary uppercase tracking-wide">
                                Principal
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                        <div className="flex items-center gap-1.5">
                            <Calendar size={12} />
                            <span>Inicia: {plan.start_date}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="w-1 h-1 rounded-full bg-slate-300" />
                            <span>Duración: {plan.duration_months} meses</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                    <button
                        onClick={onDelete}
                        className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/10"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            </div>

            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30"
                    >
                        <div className="p-3 pl-8 grid gap-2">
                            {plan.treatments.map((tx, idx) => (
                                <div key={idx} className="flex items-start gap-3 text-sm">
                                    <span
                                        className="mt-1.5 w-2 h-2 rounded-full flex-shrink-0"
                                        style={{ backgroundColor: tx.color || 'gray' }}
                                    />
                                    <div>
                                        <p className="font-medium text-slate-700 dark:text-slate-200 text-xs">
                                            {tx.title}
                                        </p>
                                        <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                                            {tx.description}
                                        </p>
                                    </div>
                                </div>
                            ))}
                            {plan.treatments.length === 0 && (
                                <p className="text-slate-400 text-xs italic">Sin tratamientos definidos.</p>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

/* ==============================================================================================
   SORTABLE ITEM COMPONENT
   ============================================================================================== */
function SortableTreatmentItem({ id, treatment, onUpdate, onSelectCatalog, onRemove }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 'auto',
        position: 'relative'
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`
                flex gap-2 items-start bg-slate-50 dark:bg-slate-800/30 p-2 rounded-lg border 
                ${isDragging ? 'border-primary shadow-lg bg-slate-100 dark:bg-slate-800' : 'border-slate-100 dark:border-slate-700/50'}
                group overflow-visible
            `}
        >
            <div
                {...attributes}
                {...listeners}
                className="mt-2 p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-200 dark:hover:bg-slate-700/50 rounded cursor-grab active:cursor-grabbing flex-shrink-0"
            >
                <GripVertical size={14} />
            </div>

            <div className="flex-1 space-y-2">
                {/* Row 1: Catalog Select & Color */}
                <div className="flex gap-2 items-center">
                    <div className="flex-1">
                        <CustomSelect
                            options={MOCK_TREATMENT_CATALOG}
                            value={treatment.title}
                            onSelect={onSelectCatalog}
                            placeholder="Seleccionar tratamiento..."
                        />
                    </div>
                    {/* Color Display (Auto-set) */}
                    {treatment.color && (
                        <div
                            className="w-8 h-8 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700"
                            style={{ backgroundColor: treatment.color }}
                            title={`Color asignado: ${treatment.color}`}
                        />
                    )}
                </div>

                {/* Row 2: Description */}
                <input
                    type="text"
                    placeholder="Descripción corta..."
                    className="w-full px-2 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded focus:border-primary outline-none"
                    value={treatment.description}
                    onChange={e => onUpdate('description', e.target.value)}
                />
            </div>

            <button
                onClick={onRemove}
                className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded transition-colors self-start mt-1"
            >
                <Trash2 size={14} />
            </button>
        </div>
    );
}

/* ==============================================================================================
   MODAL COMPONENT
   ============================================================================================== */
function TreatmentPlanModal({ isOpen, onClose, onSave }) {
    const [title, setTitle] = useState('');
    const [startDate, setStartDate] = useState('');
    const [durationMonths, setDurationMonths] = useState(6);
    const [isMain, setIsMain] = useState(false);
    const [treatments, setTreatments] = useState([]);

    // DnD Sensors
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // Reset form when opening
    useEffect(() => {
        if (isOpen) {
            setTitle('');
            setStartDate(new Date().toISOString().split('T')[0]);
            setDurationMonths(6);
            setIsMain(false);
            setTreatments([]);
        }
    }, [isOpen]);

    // Shortcuts
    useHotkeys(
        {
            f5: (e) => {
                e.preventDefault();
                handleSubmit();
            },
            escape: (e) => {
                e.preventDefault();
                onClose();
            }
        },
        [isOpen, title, startDate, durationMonths, isMain, treatments],
        isOpen
    );

    const addTreatment = () => {
        const newItem = {
            id: `new-${Date.now()}`,
            title: '',
            description: '',
            color: 'blue'
        };
        setTreatments([...treatments, newItem]);
    };

    const updateTreatment = (id, field, value) => {
        setTreatments(prev => prev.map(t =>
            t.id === id ? { ...t, [field]: value } : t
        ));
    };

    const handleCatalogSelect = (id, catalogItem) => {
        setTreatments(prev => prev.map(t =>
            t.id === id ? {
                ...t,
                title: catalogItem.title,
                description: catalogItem.description,
                color: catalogItem.color
            } : t
        ));
    };

    const removeTreatment = (id) => {
        setTreatments(prev => prev.filter(t => t.id !== id));
    };

    const handleDragEnd = (event) => {
        const { active, over } = event;
        if (active.id !== over.id) {
            setTreatments((items) => {
                const oldIndex = items.findIndex(i => i.id === active.id);
                const newIndex = items.findIndex(i => i.id === over.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };

    const handleSubmit = () => {
        if (!title.trim()) return;

        onSave({
            title,
            start_date: startDate,
            duration_months: durationMonths,
            is_main: isMain,
            treatments: treatments.filter(t => t.title && t.title.trim() !== '')
        });
    };

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="
                w-full max-w-lg 
                bg-white dark:bg-secondary 
                rounded-xl shadow-2xl 
                border-slate-200 dark:border-slate-700
                flex flex-col max-h-[90vh]
            ">
                <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-700">
                    <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">
                        Nuevo Plan de Tratamiento
                    </h3>
                    <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-5 space-y-5">

                    {/* Basic Info */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">
                                Título del Plan
                            </label>
                            <input
                                type="text"
                                autoFocus
                                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                                placeholder="Ej: Fase 1 Ortodoncia"
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">
                                    Fecha de Inicio
                                </label>
                                <input
                                    type="date"
                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-primary/50 outline-none"
                                    value={startDate}
                                    onChange={e => setStartDate(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">
                                    Duración (meses)
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-primary/50 outline-none"
                                    value={durationMonths}
                                    onChange={e => setDurationMonths(parseInt(e.target.value) || 0)}
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-2 py-1">
                            <Switch checked={isMain} onCheckedChange={setIsMain} />
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-200 select-none">
                                ¿Es el plan principal?
                            </span>
                        </div>
                    </div>

                    <div className="h-px bg-slate-100 dark:bg-slate-700 my-2" />

                    {/* Treatments List (Sortable) */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-xs font-semibold text-slate-500 uppercase">
                                Tratamientos Incluidos
                            </label>
                            <button
                                onClick={addTreatment}
                                className="text-xs flex items-center gap-1 text-primary hover:underline font-medium"
                            >
                                <Plus size={12} />
                                Agregar Item
                            </button>
                        </div>

                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleDragEnd}
                        >
                            <SortableContext
                                items={treatments.map(t => t.id)}
                                strategy={verticalListSortingStrategy}
                            >
                                <div className="space-y-3">
                                    {treatments.map((tx) => (
                                        <SortableTreatmentItem
                                            key={tx.id}
                                            id={tx.id}
                                            treatment={tx}
                                            onUpdate={(field, val) => updateTreatment(tx.id, field, val)}
                                            onSelectCatalog={(item) => handleCatalogSelect(tx.id, item)}
                                            onRemove={() => removeTreatment(tx.id)}
                                        />
                                    ))}
                                    {treatments.length === 0 && (
                                        <p className="text-center py-4 text-xs text-slate-400 italic bg-slate-50 dark:bg-slate-800/20 rounded-lg">
                                            No hay items. Agrega uno arriba.
                                        </p>
                                    )}
                                </div>
                            </SortableContext>
                        </DndContext>
                    </div>

                </div>

                <div className="p-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 flex items-center justify-between rounded-b-xl">
                    <div className="text-xs text-slate-400 flex items-center gap-1">
                        <span className="font-bold bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded text-[10px] text-slate-600 dark:text-slate-300">F5</span>
                        <span>Guardar</span>
                        <span className="mx-1">•</span>
                        <span className="font-bold bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded text-[10px] text-slate-600 dark:text-slate-300">ESC</span>
                        <span>Cancelar</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={!title.trim()}
                            className="
                                flex items-center gap-2 px-4 py-2 
                                bg-primary hover:bg-primary/90 
                                text-white text-sm font-semibold 
                                rounded-lg shadow-sm transition-all
                                disabled:opacity-50 disabled:cursor-not-allowed
                            "
                        >
                            <Save size={16} />
                            Guardar Plan
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}

/* ==============================================================================================
   UI COMPONENTS (INTERNAL MOCKS)
   ============================================================================================== */

/**
 * Custom Shadcn-like Switch
 */
function Switch({ checked, onCheckedChange }) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            onClick={() => onCheckedChange(!checked)}
            className={`
                peer inline-flex h-[20px] w-[36px] shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50
                ${checked ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-700'}
            `}
        >
            <span
                className={`
                    pointer-events-none block h-4 w-4 rounded-full bg-white shadow-lg ring-0 transition-transform
                    ${checked ? 'translate-x-4' : 'translate-x-0'}
                `}
            />
        </button>
    );
}

/**
 * Custom Shadcn-like Select (Combobox) with Portal
 */
function CustomSelect({ options, value, onSelect, placeholder = "Select..." }) {
    const [open, setOpen] = useState(false);
    const triggerRef = useRef(null);
    const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (triggerRef.current && !triggerRef.current.contains(event.target)) {
                if (!event.target.closest('.custom-select-portal')) {
                    setOpen(false);
                }
            }
        };

        if (open) {
            document.addEventListener('mousedown', handleClickOutside);
            window.addEventListener('scroll', updatePosition, true);
            window.addEventListener('resize', updatePosition);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('scroll', updatePosition, true);
            window.removeEventListener('resize', updatePosition);
        };
    }, [open]);

    const updatePosition = () => {
        if (triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            setCoords({
                top: rect.bottom + window.scrollY + 4,
                left: rect.left + window.scrollX,
                width: rect.width
            });
        }
    };

    const handleToggle = () => {
        if (!open) {
            updatePosition();
            setOpen(true);
        } else {
            setOpen(false);
        }
    };

    const handleSelect = (item) => {
        onSelect(item);
        setOpen(false);
    };

    return (
        <>
            <button
                ref={triggerRef}
                type="button"
                onClick={handleToggle}
                className="
                    flex h-9 w-full items-center justify-between rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/20
                "
            >
                <span className={value ? "text-slate-900 dark:text-slate-100" : "text-slate-500"}>
                    {value || placeholder}
                </span>
                <ChevronDown className="h-4 w-4 opacity-50" />
            </button>

            {open && createPortal(
                <div
                    className="custom-select-portal absolute z-[9999] overflow-hidden rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-secondary shadow-md animate-in fade-in zoom-in-95 duration-100"
                    style={{
                        top: coords.top,
                        left: coords.left,
                        width: coords.width,
                        maxHeight: '200px',
                        overflowY: 'auto'
                    }}
                >
                    {options.map((option) => (
                        <div
                            key={option.title}
                            onClick={() => handleSelect(option)}
                            className={`
                                relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-xs outline-none hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 cursor-pointer
                                ${value === option.title ? 'bg-slate-100 dark:bg-slate-800' : ''}
                            `}
                        >
                            {value === option.title && (
                                <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                                    <Check className="h-4 w-4 text-primary" />
                                </span>
                            )}
                            <span className="flex-1 truncate">{option.title}</span>
                            <div
                                className="w-2 h-2 rounded-full ml-auto"
                                style={{ backgroundColor: option.color }}
                            />
                        </div>
                    ))}
                </div>,
                document.body
            )}
        </>
    );
}
