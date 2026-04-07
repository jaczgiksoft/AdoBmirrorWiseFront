
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
import AutocompleteInput from '@/components/inputs/AutocompleteInput';
import { getAllServices } from '@/services/service.service';
import { useOutletContext } from 'react-router-dom';
import { getTreatmentPlans } from '@/services/treatmentPlan.service';
import { getBudgets, createBudget, updateBudget, deleteBudget } from '@/services/budget.service';

/* ==============================================================================================
   MOCK DATA & UTILS
   ============================================================================================== */

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
    const { profile } = useOutletContext();
    const patientId = profile?.id;

    // ---------------------------------------------------------
    // STATE
    // ---------------------------------------------------------
    const [budgets, setBudgets] = useState([]);
    const [loading, setLoading] = useState(false);
    const [servicesCatalog, setServicesCatalog] = useState([]);
    const [treatmentPlans, setTreatmentPlans] = useState([]);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('create');
    const [selectedBudget, setSelectedBudget] = useState(null);

    // Delete State
    const [deleteId, setDeleteId] = useState(null);

    // Load Data (Catalog & Plans)
    useEffect(() => {
        if (!patientId) return;

        // Load Services
        getAllServices().then(data => {
            setServicesCatalog(data || []);
        }).catch(err => console.error("Could not load services catalog", err));

        // Load Plans
        getTreatmentPlans(patientId).then(data => {
            setTreatmentPlans(data || []);
        }).catch(err => console.error("Could not load treatment plans", err));

        // Load Budgets
        loadBudgets();
    }, [patientId]);

    // ---------------------------------------------------------
    // HELPERS
    // ---------------------------------------------------------
    const loadBudgets = async () => {
        setLoading(true);
        try {
            const rawData = await getBudgets(patientId);
            // REQUIREMENT: Normalize all numeric fields and item keys
            const normalizedData = (rawData || []).map(b => ({
                ...b,
                total: parseFloat(b.total) || 0,
                subtotal: parseFloat(b.subtotal) || 0,
                monthly_payment: parseFloat(b.monthly_payment) || 0,
                down_payment_value: parseFloat(b.down_payment_value) || 0,
                down_payment_amount: parseFloat(b.down_payment_amount) || 0,
                discount_value: parseFloat(b.discount_value) || 0,
                discount_amount: parseFloat(b.discount_amount) || 0,

                // Map items: quantity -> qty, unit_price -> price
                items: (b.items || []).map(i => ({
                    id: i.id, // Backend ID
                    description: i.description,
                    qty: parseFloat(i.quantity) || 0,
                    price: parseFloat(i.unit_price) || 0,
                    total_price: parseFloat(i.total_price) || 0
                }))
            }));
            setBudgets(normalizedData);
        } catch (error) {
            console.error(error);
            addToast({ type: 'error', title: 'Error', message: 'No se pudieron cargar los presupuestos.' });
        } finally {
            setLoading(false);
        }
    };

    const refreshData = () => {
        loadBudgets();
        addToast({ type: 'success', title: 'Actualizado', message: 'Lista de presupuestos actualizada.' });
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

    const handleSave = async (budgetData) => {
        try {
            if (modalMode === 'create') {
                const payload = {
                    ...budgetData,
                    patient_id: patientId
                };
                await createBudget(payload);
                addToast({ type: 'success', title: 'Presupuesto Creado', message: 'El presupuesto se ha guardado exitosamente.' });
            } else {
                await updateBudget(selectedBudget.id, budgetData);
                addToast({ type: 'success', title: 'Presupuesto Actualizado', message: 'Cambios guardados correctamente.' });
            }
            setIsModalOpen(false);
            loadBudgets();
        } catch (error) {
            console.error(error);
            addToast({ type: 'error', title: 'Error', message: 'Hubo un error al guardar el presupuesto.' });
        }
    };

    const handleDeleteClick = (id) => {
        setDeleteId(id);
    };

    const confirmDelete = async () => {
        try {
            await deleteBudget(deleteId);
            setDeleteId(null);
            addToast({ type: 'success', title: 'Eliminado', message: 'El presupuesto ha sido eliminado.' });
            loadBudgets();
        } catch (error) {
            console.error(error);
            addToast({ type: 'error', title: 'Error', message: 'No se pudo eliminar el presupuesto.' });
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
                {loading ? (
                    <div className="py-12 flex justify-center text-slate-400 animate-pulse">
                        <span className="text-sm font-medium">Cargando presupuestos...</span>
                    </div>
                ) : budgets.length === 0 ? (
                    <EmptyState onAdd={openCreateModal} />
                ) : (
                    <div className="grid gap-3">
                        <AnimatePresence mode="popLayout">
                            {budgets.map((budget, index) => (
                                <motion.div
                                    key={budget.id}
                                    initial={{ opacity: 0, y: 10 }}
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
            </div>

            <BudgetModal
                open={isModalOpen}
                mode={modalMode}
                initialData={selectedBudget}
                catalog={servicesCatalog}
                plans={treatmentPlans}
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
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-[var(--color-secondary)]">
            <div className="flex items-center justify-between">
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
                    className="flex items-center gap-2 px-4 py-2 bg-[var(--color-primary)] hover:opacity-90 text-white text-sm font-semibold rounded-xl transition-all shadow-sm active:scale-95"
                >
                    <Plus size={16} />
                    <span>Nuevo Presupuesto</span>
                </button>
            </div>
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
function BudgetModal({ open, mode, initialData, catalog = [], plans = [], onSave, onClose }) {
    const { addToast } = useToastStore();
    const titleRef = useRef(null);

    // Initial Data
    const defaultItem = { id: Date.now(), description: '', qty: 1, price: 0 };
    const [title, setTitle] = useState('');
    const [status, setStatus] = useState('pending');
    const [items, setItems] = useState([defaultItem]);

    // Linking Fields
    const [selectedPlanId, setSelectedPlanId] = useState(null); // ID only
    const [selectedPlanTitle, setSelectedPlanTitle] = useState(''); // For autocomplete input
    const [startDate, setStartDate] = useState('');
    const [duration, setDuration] = useState('');

    // Financial Fields
    const [downPaymentType, setDownPaymentType] = useState('fixed');
    const [downPaymentValue, setDownPaymentValue] = useState(0);
    const [discountType, setDiscountType] = useState('fixed');
    const [discountValue, setDiscountValue] = useState(0);

    // Effects
    useEffect(() => {
        if (open) {
            if (mode === 'edit' && initialData) {
                setTitle(initialData.title);
                setStatus(initialData.status);
                // Normalize items: Map backend (quantity, unit_price) to frontend (qty, price) and ensure numbers
                setItems(initialData.items.map(i => ({
                    id: i.id, // Keep backend ID for editing
                    description: i.description,
                    qty: (typeof i.qty === 'number') ? i.qty : (parseFloat(i.quantity) || 0),
                    price: (typeof i.price === 'number') ? i.price : (parseFloat(i.unit_price) || 0)
                })));

                // Mock data won't have these yet, but preparing structure
                // Backend returns "start_date" (YYYY-MM-DD or ISO). Input type="date" needs YYYY-MM-DD.
                const rawDate = initialData.start_date || initialData.startDate;
                setStartDate(rawDate ? rawDate.substring(0, 10) : '');
                setDuration(initialData.duration_months || initialData.duration || '');
                setSelectedPlanId(initialData.treatment_plan_id || null);

                // Financials - Normalize strings to numbers
                setDownPaymentType(initialData.down_payment_type || 'fixed');
                setDownPaymentValue(parseFloat(initialData.down_payment_value) || 0);
                setDiscountType(initialData.discount_type || 'fixed');
                setDiscountValue(parseFloat(initialData.discount_value) || 0);

                // Find plan title if id exists
                const plan = plans.find(p => p.id === initialData.treatment_plan_id);
                setSelectedPlanTitle(plan ? plan.title : '');
            } else {
                setTitle('');
                setStatus('pending');
                setItems([{ ...defaultItem, id: Date.now() }]);
                setStartDate('');
                setDuration('');
                setSelectedPlanId(null);
                setSelectedPlanTitle('');
                setDownPaymentType('fixed');
                setDownPaymentValue(0);
                setDiscountType('fixed');
                setDiscountValue(0);
            }
            setTimeout(() => titleRef.current?.focus(), 100);
        }
    }, [open, mode, initialData]);

    const handlePlanSelect = (plan) => {
        setSelectedPlanId(plan.id);
        setSelectedPlanTitle(plan.title);

        // Auto-fill logic
        setTitle(`${plan.title} - Presupuesto`);
        if (plan.start_date) setStartDate(plan.start_date);
        if (plan.duration_months) setDuration(plan.duration_months);
    };

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

    const handleServiceSelect = (id, service) => {
        setItems(prev => prev.map(item => {
            if (item.id === id) {
                return {
                    ...item,
                    description: service.name,
                    price: parseFloat(service.price) || 0,
                    // If visual color is needed later: color: service.color
                };
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
            items: validItems.map(item => ({
                // Strict mapping: ID removed to avoid database overflow (frontend uses timestamps)
                description: item.description,
                quantity: item.qty,
                unit_price: item.price
            })),

            treatment_plan_id: selectedPlanId,
            start_date: startDate,
            duration_months: parseInt(duration) || 0,

            // Financials
            down_payment_type: downPaymentType,
            down_payment_value: parseFloat(downPaymentValue) || 0,
            discount_type: discountType,
            discount_value: parseFloat(discountValue) || 0,
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

    // Determine read-only state
    const isReadOnly = mode === 'edit' && initialData?.status === 'approved';

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
                            <div className="flex justify-between items-start mb-4">
                                <input
                                    ref={titleRef}
                                    type="text"
                                    disabled={isReadOnly}
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Título del presupuesto..."
                                    className="w-full text-2xl font-bold bg-transparent border-none outline-none placeholder:text-slate-300 dark:placeholder:text-slate-600 text-slate-800 dark:text-slate-100 disabled:opacity-70 disabled:cursor-not-allowed"
                                />
                                {isReadOnly && (
                                    <div className="ml-4 flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap">
                                        <CheckCircle2 size={14} />
                                        <span>Aprobado</span>
                                    </div>
                                )}
                            </div>

                            {/* Plan Linking Section */}
                            <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 mb-4 ${isReadOnly ? 'opacity-70 pointer-events-none' : ''}`}>
                                <div className="sm:col-span-2">
                                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">
                                        Vincular Plan de Tratamiento (Opcional)
                                    </label>
                                    <div className={isReadOnly ? 'pointer-events-none' : ''}>
                                        <AutocompleteInput
                                            options={plans}
                                            value={selectedPlanTitle}
                                            onChange={(val) => {
                                                setSelectedPlanTitle(val);
                                                if (!val) setSelectedPlanId(null); // Clear ID if text cleared
                                            }}
                                            onSelect={handlePlanSelect}
                                            placeholder="Buscar plan..."
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">
                                        Fecha Inicio
                                    </label>
                                    <input
                                        type="date"
                                        disabled={isReadOnly}
                                        className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">
                                        Duración (Meses)
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        disabled={isReadOnly}
                                        className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
                                        value={duration}
                                        onChange={(e) => setDuration(e.target.value)}
                                        placeholder="Ej: 6"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2 text-sm text-slate-500">
                                    <span className="font-medium">Estado:</span>
                                    <div className={`flex bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 ${isReadOnly ? 'opacity-60 pointer-events-none' : ''}`}>
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
                                        <div className={`flex-1 ${isReadOnly ? 'pointer-events-none opacity-80' : ''}`}>
                                            <AutocompleteInput
                                                options={catalog}
                                                value={item.description}
                                                onChange={(val) => handleItemChange(item.id, 'description', val)}
                                                onSelect={(service) => handleServiceSelect(item.id, service)}
                                                placeholder="Descripción o buscar servicio..."
                                            />
                                        </div>
                                        <div className="w-20">
                                            <input
                                                type="number"
                                                min="1"
                                                disabled={isReadOnly}
                                                placeholder="Cant."
                                                value={item.qty}
                                                onChange={(e) => handleItemChange(item.id, 'qty', parseInt(e.target.value) || 0)}
                                                className="w-full bg-transparent border-none outline-none text-sm text-right text-slate-600 dark:text-slate-400 disabled:opacity-50"
                                            />
                                        </div>
                                        <div className="w-28 relative">
                                            <span className="absolute left-0 top-1/2 -translate-y-1/2 text-slate-400 text-xs">$</span>
                                            <input
                                                type="number"
                                                min="0"
                                                disabled={isReadOnly}
                                                placeholder="0.00"
                                                value={item.price}
                                                onChange={(e) => handleItemChange(item.id, 'price', parseFloat(e.target.value) || 0)}
                                                className="w-full bg-transparent border-none outline-none text-sm text-right font-medium text-slate-700 dark:text-slate-200 disabled:opacity-50"
                                            />
                                        </div>
                                        <div className={`w-8 flex justify-end transition-opacity ${isReadOnly ? 'opacity-0 pointer-events-none' : 'opacity-0 group-hover:opacity-100'}`}>
                                            <button
                                                onClick={() => handleRemoveItem(item.id)}
                                                className="text-slate-300 hover:text-[var(--color-error)] transition-colors"
                                                disabled={items.length === 1 || isReadOnly}
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {!isReadOnly && (
                                <button
                                    onClick={handleAddItem}
                                    className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-[var(--color-primary)] hover:opacity-80 transition-opacity"
                                >
                                    <Plus size={14} />
                                    Agregar ítem
                                </button>
                            )}

                            {/* Financial Summary Controls */}
                            <div className={`mt-8 grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6 border-t border-slate-100 dark:border-slate-800 ${isReadOnly ? 'pointer-events-none opacity-80' : ''}`}>
                                {/* Discount */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-semibold text-slate-500 uppercase">Descuento</label>
                                        <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5">
                                            <button
                                                onClick={() => setDiscountType('fixed')}
                                                className={`px-2 py-0.5 text-[10px] font-bold rounded ${discountType === 'fixed' ? 'bg-white shadow text-slate-800' : 'text-slate-400'}`}
                                            >
                                                $
                                            </button>
                                            <button
                                                onClick={() => setDiscountType('percentage')}
                                                className={`px-2 py-0.5 text-[10px] font-bold rounded ${discountType === 'percentage' ? 'bg-white shadow text-slate-800' : 'text-slate-400'}`}
                                            >
                                                %
                                            </button>
                                        </div>
                                    </div>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            min="0"
                                            disabled={isReadOnly}
                                            value={discountValue}
                                            onChange={e => setDiscountValue(parseFloat(e.target.value) || 0)}
                                            className="w-full px-3 py-2 text-right bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm disabled:opacity-50"
                                        />
                                    </div>
                                </div>

                                {/* Down Payment */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-semibold text-slate-500 uppercase">Anticipo / Enganche</label>
                                        <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5">
                                            <button
                                                onClick={() => setDownPaymentType('fixed')}
                                                className={`px-2 py-0.5 text-[10px] font-bold rounded ${downPaymentType === 'fixed' ? 'bg-white shadow text-slate-800' : 'text-slate-400'}`}
                                            >
                                                $
                                            </button>
                                            <button
                                                onClick={() => setDownPaymentType('percentage')}
                                                className={`px-2 py-0.5 text-[10px] font-bold rounded ${downPaymentType === 'percentage' ? 'bg-white shadow text-slate-800' : 'text-slate-400'}`}
                                            >
                                                %
                                            </button>
                                        </div>
                                    </div>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            min="0"
                                            disabled={isReadOnly}
                                            value={downPaymentValue}
                                            onChange={e => setDownPaymentValue(parseFloat(e.target.value) || 0)}
                                            className="w-full px-3 py-2 text-right bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm disabled:opacity-50"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 px-6 py-4 flex items-center justify-between">
                            <div className="flex gap-8">
                                <div className="flex flex-col">
                                    <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">Total</span>
                                    <span className="text-xl font-bold text-slate-800 dark:text-white">
                                        {formatCurrency(grandTotal)}
                                    </span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">Subtotal</span>
                                    <span className="text-xl font-bold text-[var(--color-primary)]">
                                        {formatCurrency(Math.max(0, grandTotal
                                            - (discountType === 'percentage' ? grandTotal * (discountValue / 100) : discountValue)
                                            - (downPaymentType === 'percentage' ? grandTotal * (downPaymentValue / 100) : downPaymentValue)
                                        ))}
                                    </span>
                                </div>
                                {(duration && parseInt(duration) > 0) && (
                                    <div className="flex flex-col">
                                        <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">Mensualidad ({parseInt(duration)})</span>
                                        <span className="text-lg font-semibold text-slate-600 dark:text-slate-300">
                                            {formatCurrency(
                                                Math.max(0, grandTotal
                                                    - (discountType === 'percentage' ? grandTotal * (discountValue / 100) : discountValue)
                                                    - (downPaymentType === 'percentage' ? grandTotal * (downPaymentValue / 100) : downPaymentValue)
                                                ) / parseInt(duration)
                                            )}
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center gap-3">
                                <button
                                    onClick={onClose}
                                    className="px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
                                >
                                    {isReadOnly ? 'Cerrar' : 'Cancelar'}
                                </button>
                                {!isReadOnly && (
                                    <button
                                        onClick={handleSaveInternal}
                                        className="flex items-center gap-2 px-6 py-2 bg-[var(--color-primary)] hover:opacity-90 text-white text-sm font-bold rounded-lg shadow-lg active:scale-95 transition-all"
                                    >
                                        <Save size={16} />
                                        Guardar
                                    </button>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
}
