
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    DollarSign,
    Plus,
    Trash2,
    Edit2,
    X,
    Save,
    Calendar,
    CheckCircle2,
    Clock,
    XCircle,
    FileText,
    CreditCard
} from 'lucide-react';
import { useHotkeys } from '@/hooks/useHotkeys';
import { ConfirmDialog } from '@/components/feedback';
import { useToastStore } from '@/store/useToastStore';

/* ==============================================================================================
   MOCK DATA & UTILS
   ============================================================================================== */

const MOCK_BUDGETS = [
    {
        id: 1,
        title: 'Tratamiento de Ortodoncia Completo',
        createdAt: '2023-10-15T10:30:00Z',
        status: 'approved',
        items: [
            { id: 101, description: 'Brackets Metálicos', qty: 1, price: 5000 },
            { id: 102, description: 'Mensualidades (x12)', qty: 12, price: 800 },
            { id: 103, description: 'Retenedores', qty: 2, price: 1500 }
        ]
    },
    {
        id: 2,
        title: 'Diseño de Sonrisa',
        createdAt: '2023-11-20T14:15:00Z',
        status: 'pending',
        items: [
            { id: 201, description: 'Blanqueamiento Zoom', qty: 1, price: 3500 },
            { id: 202, description: 'Carillas de Porcelana', qty: 6, price: 4500 }
        ]
    },
    {
        id: 3,
        title: 'Limpieza y Profilaxis',
        createdAt: '2023-09-05T09:00:00Z',
        status: 'rejected',
        items: [
            { id: 301, description: 'Limpieza con ultrasonido', qty: 1, price: 800 },
            { id: 302, description: 'Fluorigel', qty: 1, price: 300 }
        ]
    }
];

const STATUS_CONFIG = {
    pending: {
        label: 'Pendiente',
        colorClass: 'text-[var(--color-warning)] bg-[var(--color-warning)]/10',
        icon: Clock
    },
    approved: {
        label: 'Aprobado',
        colorClass: 'text-[var(--color-success)] bg-[var(--color-success)]/10',
        icon: CheckCircle2
    },
    rejected: {
        label: 'Rechazado',
        colorClass: 'text-[var(--color-error)] bg-[var(--color-error)]/10',
        icon: XCircle
    }
};

const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN',
        minimumFractionDigits: 2
    }).format(amount);
};

const calculateTotal = (items) => {
    return items.reduce((sum, item) => sum + (item.qty * item.price), 0);
};

/* ==============================================================================================
   MAIN COMPONENT
   ============================================================================================== */
export default function BudgetsSection() {
    const { addToast } = useToastStore();

    // ---------------------------------------------------------
    // STATE
    // ---------------------------------------------------------
    const [budgets, setBudgets] = useState(MOCK_BUDGETS);
    const [loading, setLoading] = useState(false); // Mock loading

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('create');
    const [selectedBudget, setSelectedBudget] = useState(null);

    // Delete State
    const [deleteId, setDeleteId] = useState(null);

    // ---------------------------------------------------------
    // HELPERS
    // ---------------------------------------------------------
    const refreshData = () => {
        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            addToast({ type: 'success', title: 'Actualizado', message: 'Lista de presupuestos actualizada.' });
        }, 600);
    };

    // ---------------------------------------------------------
    // SHORTCUTS
    // ---------------------------------------------------------
    useHotkeys({
        n: (e) => {
            if (!isModalOpen) {
                e.preventDefault();
                openCreateModal();
            }
        },
        f5: (e) => {
            e.preventDefault();
            refreshData();
        }
    }, [isModalOpen]);

    // ---------------------------------------------------------
    // ACTIONS
    // ---------------------------------------------------------
    const openCreateModal = () => {
        setModalMode('create');
        setSelectedBudget(null);
        setIsModalOpen(true);
    };

    const openEditModal = (budget) => {
        setModalMode('edit');
        setSelectedBudget(budget);
        setIsModalOpen(true);
    };

    const handleSave = (budgetData) => {
        if (modalMode === 'create') {
            const newBudget = {
                ...budgetData,
                id: Date.now(),
                createdAt: new Date().toISOString()
            };
            setBudgets(prev => [newBudget, ...prev]);
            addToast({ type: 'success', title: 'Presupuesto Creado', message: 'El presupuesto se ha guardado exitosamente.' });
        } else {
            setBudgets(prev => prev.map(b => b.id === selectedBudget.id ? { ...budgetData, id: b.id, createdAt: b.createdAt } : b));
            addToast({ type: 'success', title: 'Presupuesto Actualizado', message: 'Cambios guardados correctamente.' });
        }
        setIsModalOpen(false);
    };

    const handleDeleteClick = (id) => {
        setDeleteId(id);
    };

    const confirmDelete = () => {
        setBudgets(prev => prev.filter(b => b.id !== deleteId));
        setDeleteId(null);
        addToast({ type: 'success', title: 'Eliminado', message: 'El presupuesto ha sido eliminado.' });
    };

    // ---------------------------------------------------------
    // RENDER
    // ---------------------------------------------------------
    return (
        <div className="space-y-6">
            <SectionHeader onAdd={openCreateModal} />

            {loading ? (
                <div className="py-12 flex justify-center text-slate-400 animate-pulse">
                    <span className="text-sm font-medium">Cargando presupuestos...</span>
                </div>
            ) : budgets.length === 0 ? (
                <EmptyState onAdd={openCreateModal} />
            ) : (
                <div className="grid gap-4">
                    <AnimatePresence mode="popLayout">
                        {budgets.map((budget, index) => (
                            <motion.div
                                key={budget.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <BudgetRow
                                    budget={budget}
                                    onEdit={() => openEditModal(budget)}
                                    onDelete={() => handleDeleteClick(budget.id)}
                                />
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}

            <BudgetModal
                open={isModalOpen}
                mode={modalMode}
                initialData={selectedBudget}
                onSave={handleSave}
                onClose={() => setIsModalOpen(false)}
            />

            <ConfirmDialog
                open={!!deleteId}
                title="Eliminar Presupuesto"
                message="¿Estás seguro? Esta acción eliminará el presupuesto permanentemente."
                confirmLabel="Eliminar"
                confirmVariant="error"
                onConfirm={confirmDelete}
                onCancel={() => setDeleteId(null)}
            />
        </div>
    );
}

/* ==============================================================================================
   SUB-COMPONENTS
   ============================================================================================== */
function SectionHeader({ onAdd }) {
    return (
        <div className="flex items-center justify-between bg-white dark:bg-[var(--color-secondary)] border border-slate-200 dark:border-slate-700 p-5 rounded-2xl shadow-sm">
            <div className="flex items-center gap-3">
                <div className="p-2.5 bg-[var(--color-primary)]/10 text-[var(--color-primary)] rounded-xl">
                    <DollarSign size={22} />
                </div>
                <div>
                    <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Presupuestos</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Gestiona cotizaciones y planes de tratamiento.</p>
                </div>
            </div>
            <button
                onClick={onAdd}
                className="flex items-center gap-2 px-4 py-2 bg-[var(--color-primary)] hover:opacity-90 text-white text-sm font-medium rounded-lg transition-all shadow-sm active:scale-95"
            >
                <Plus size={16} />
                <span>Nuevo Presupuesto</span>
            </button>
        </div>
    );
}

function BudgetRow({ budget, onEdit, onDelete }) {
    const StatusIcon = STATUS_CONFIG[budget.status].icon;
    const total = calculateTotal(budget.items);

    return (
        <div
            onClick={onEdit}
            className="group flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white dark:bg-[var(--color-secondary)] border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm hover:shadow-md hover:border-[var(--color-primary)]/30 transition-all cursor-pointer"
        >
            <div className="flex items-start gap-4 mb-3 sm:mb-0">
                <div className="hidden sm:flex items-center justify-center w-10 h-10 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-400 group-hover:text-[var(--color-primary)] transition-colors">
                    <FileText size={20} />
                </div>
                <div>
                    <h3 className="font-semibold text-slate-800 dark:text-slate-100 group-hover:text-[var(--color-primary)] transition-colors">
                        {budget.title}
                    </h3>
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1">
                            <Calendar size={12} />
                            {new Date(budget.createdAt).toLocaleDateString()}
                        </span>
                        <span>•</span>
                        <span>{budget.items.length} ítems</span>
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto">
                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_CONFIG[budget.status].colorClass}`}>
                    <StatusIcon size={12} />
                    {STATUS_CONFIG[budget.status].label}
                </div>

                <div className="text-right min-w-[100px]">
                    <span className="block text-sm font-bold text-slate-800 dark:text-slate-100">
                        {formatCurrency(total)}
                    </span>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">Total</span>
                </div>

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
                <CreditCard size={32} className="text-[var(--color-primary)]/50" />
            </div>
            <h3 className="text-base font-semibold text-slate-700 dark:text-slate-300">No hay presupuestos aún</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 max-w-xs text-center">
                Crea el primer presupuesto para este paciente para comenzar a llevar el control.
            </p>
            <button
                onClick={onAdd}
                className="px-4 py-2 bg-white dark:bg-[var(--color-secondary)] border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 text-sm font-medium rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
            >
                Crear presupuesto ahora
            </button>
        </div>
    );
}

/* ==============================================================================================
   MODAL COMPONENT
   ============================================================================================== */
function BudgetModal({ open, mode, initialData, onSave, onClose }) {
    const { addToast } = useToastStore();
    const titleRef = useRef(null);

    // Initial Data
    const defaultItem = { id: Date.now(), description: '', qty: 1, price: 0 };
    const [title, setTitle] = useState('');
    const [status, setStatus] = useState('pending');
    const [items, setItems] = useState([defaultItem]);

    // Effects
    useEffect(() => {
        if (open) {
            if (mode === 'edit' && initialData) {
                setTitle(initialData.title);
                setStatus(initialData.status);
                setItems(initialData.items.map(i => ({ ...i }))); // deep clone somewhat
            } else {
                setTitle('');
                setStatus('pending');
                setItems([{ ...defaultItem, id: Date.now() }]);
            }
            setTimeout(() => titleRef.current?.focus(), 100);
        }
    }, [open, mode, initialData]);

    // Handlers
    const handleAddItem = () => {
        setItems(prev => [...prev, { id: Date.now(), description: '', qty: 1, price: 0 }]);
    };

    const handleRemoveItem = (id) => {
        if (items.length === 1) return;
        setItems(prev => prev.filter(item => item.id !== id));
    };

    const handleItemChange = (id, field, value) => {
        setItems(prev => prev.map(item => {
            if (item.id === id) {
                return { ...item, [field]: value };
            }
            return item;
        }));
    };

    const handleSaveInternal = () => {
        if (!title.trim()) {
            addToast({ type: 'error', title: 'Falta información', message: 'El título es obligatorio.' });
            return;
        }

        // Filter out empty items if needed, or validate them
        const validItems = items.filter(i => i.description.trim());
        if (validItems.length === 0) {
            addToast({ type: 'error', title: 'Sin ítems', message: 'Agrega al menos un ítem valido.' });
            return;
        }

        onSave({
            title,
            status,
            items: validItems,
            total: calculateTotal(validItems)
        });
    };

    // Keyboard support for saving
    useHotkeys({
        enter: (e) => {
            if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
                handleSaveInternal();
            }
        },
        escape: () => onClose()
    }, [open, title, items, status], open);


    const grandTotal = calculateTotal(items);

    if (!open) return null;

    return createPortal(
        <AnimatePresence>
            {open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                        onClick={onClose}
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        className="relative w-full max-w-2xl bg-white dark:bg-[var(--color-secondary)] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="px-6 pt-6 pb-2">
                            <input
                                ref={titleRef}
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Título del presupuesto..."
                                className="w-full text-2xl font-bold bg-transparent border-none outline-none placeholder:text-slate-300 dark:placeholder:text-slate-600 text-slate-800 dark:text-slate-100"
                            />

                            <div className="flex items-center gap-4 mt-4">
                                <div className="flex items-center gap-2 text-sm text-slate-500">
                                    <span className="font-medium">Estado:</span>
                                    <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5">
                                        {Object.keys(STATUS_CONFIG).map(key => (
                                            <button
                                                key={key}
                                                onClick={() => setStatus(key)}
                                                className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${status === key
                                                        ? 'bg-white dark:bg-[var(--color-secondary)] text-[var(--color-primary)] shadow-sm'
                                                        : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                                                    }`}
                                            >
                                                {STATUS_CONFIG[key].label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Body - Items List */}
                        <div className="flex-1 overflow-y-auto px-6 py-4">
                            <div className="space-y-1">
                                {items.map((item, index) => (
                                    <div key={item.id} className="group flex items-start gap-3 py-2 border-b border-transparent hover:border-slate-100 dark:hover:border-slate-800 transition-colors">
                                        <div className="flex-1">
                                            <input
                                                type="text"
                                                placeholder="Descripción del ítem"
                                                value={item.description}
                                                onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                                                className="w-full bg-transparent border-none outline-none text-sm font-medium text-slate-700 dark:text-slate-200 placeholder:text-slate-400"
                                            />
                                        </div>
                                        <div className="w-20">
                                            <input
                                                type="number"
                                                min="1"
                                                placeholder="Cant."
                                                value={item.qty}
                                                onChange={(e) => handleItemChange(item.id, 'qty', parseInt(e.target.value) || 0)}
                                                className="w-full bg-transparent border-none outline-none text-sm text-right text-slate-600 dark:text-slate-400"
                                            />
                                        </div>
                                        <div className="w-28 relative">
                                            <span className="absolute left-0 top-1/2 -translate-y-1/2 text-slate-400 text-xs">$</span>
                                            <input
                                                type="number"
                                                min="0"
                                                placeholder="0.00"
                                                value={item.price}
                                                onChange={(e) => handleItemChange(item.id, 'price', parseFloat(e.target.value) || 0)}
                                                className="w-full bg-transparent border-none outline-none text-sm text-right font-medium text-slate-700 dark:text-slate-200"
                                            />
                                        </div>
                                        <div className="w-8 flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => handleRemoveItem(item.id)}
                                                className="text-slate-300 hover:text-[var(--color-error)] transition-colors"
                                                disabled={items.length === 1}
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={handleAddItem}
                                className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-[var(--color-primary)] hover:opacity-80 transition-opacity"
                            >
                                <Plus size={14} />
                                Agregar ítem
                            </button>
                        </div>

                        {/* Footer */}
                        <div className="bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 px-6 py-4 flex items-center justify-between">
                            <div className="flex flex-col">
                                <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">Total Presupuesto</span>
                                <span className="text-xl font-bold text-slate-800 dark:text-white">
                                    {formatCurrency(grandTotal)}
                                </span>
                            </div>

                            <div className="flex items-center gap-3">
                                <button
                                    onClick={onClose}
                                    className="px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleSaveInternal}
                                    className="flex items-center gap-2 px-6 py-2 bg-[var(--color-primary)] hover:opacity-90 text-white text-sm font-bold rounded-lg shadow-lg active:scale-95 transition-all"
                                >
                                    <Save size={16} />
                                    Guardar
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
}
