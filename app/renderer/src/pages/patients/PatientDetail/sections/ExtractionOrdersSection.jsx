import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus,
    FileOutput,
    Calendar,
    Activity,
    Edit2,
    Trash2,
    CheckCircle2,
    Clock,
    FileText
} from 'lucide-react';
import { useToastStore } from '../../../../store/useToastStore';
import api from '../../../../services/api';
import * as extractionOrderService from '../../../../services/extractionOrder.service';
import ExtractionOrderWizard from '../../../../components/ExtractionOrders/ExtractionOrderWizard';
import { ConfirmDialog } from '@/components/feedback';

export default function ExtractionOrdersSection() {
    const { id: patientId } = useParams();
    const { addToast } = useToastStore();
    const [isWizardOpen, setIsWizardOpen] = useState(false);
    const [modalMode, setModalMode] = useState('create');
    const [editingId, setEditingId] = useState(null);
    const [wizardData, setWizardData] = useState(null);

    // START: Clinical Mode State
    const [clinicalMode, setClinicalMode] = useState(null); // 'extraction' | 'restorative'

    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [orderToDelete, setOrderToDelete] = useState(null);

    const [orders, setOrders] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // --- DATA FETCHING ---


    const handleDeleteRequest = (order) => {
        setOrderToDelete(order);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!orderToDelete) return;
        try {
            await extractionOrderService.deleteOrder(orderToDelete.id);
            addToast({
                type: 'success',
                title: 'Orden Eliminada',
                message: 'La orden ha sido eliminada exitosamente.'
            });
            // Optimistic update
            setOrders(prev => prev.filter(o => o.id !== orderToDelete.id));
        } catch (error) {
            console.error('Error deleting order:', error);
            addToast({
                type: 'error',
                title: 'Error',
                message: 'No se pudo eliminar la orden.'
            });
        } finally {
            setDeleteDialogOpen(false);
            setOrderToDelete(null);
        }
    };


    const fetchOrders = async () => {
        try {
            setIsLoading(true);
            const data = await extractionOrderService.getOrdersByPatient(patientId);

            const normalizedOrders = data.map(order => ({
                id: order.id,
                date: order.order_date,
                destination: order.clinical_reason || 'Sin motivo clínico especificado',
                teethCount: order.teeth ? order.teeth.length : 0,
                status: order.status === 'pending' ? 'Pendiente' : 'Completada',
                hasExtractions: order.teeth ? order.teeth.some(t => t.extraction) : false
            }));

            setOrders(normalizedOrders);
        } catch (error) {
            console.error('Error fetching orders:', error);
            addToast({
                type: 'error',
                title: 'Error',
                message: 'No se pudieron cargar las órdenes.'
            });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (patientId) {
            fetchOrders();
        }
    }, [patientId]);

    const handleOpenCreateExtraction = () => {
        setClinicalMode('extraction');
        setModalMode('create');
        setEditingId(null);
        setWizardData(null);
        setIsWizardOpen(true);
    };

    const handleOpenCreateRestorative = () => {
        setClinicalMode('restorative');
        setModalMode('create');
        setEditingId(null);
        setWizardData(null);
        setIsWizardOpen(true);
    };

    const handleEditOrder = async (orderId) => {
        try {
            const fullOrder = await extractionOrderService.getOrderById(orderId);

            // Determine Clinical Mode from Data
            const hasExtractions = fullOrder.teeth && fullOrder.teeth.some(t => t.extraction === 1 || t.extraction === true);
            const inferredMode = hasExtractions ? 'extraction' : 'restorative';

            setClinicalMode(inferredMode);

            // Transform Teeth
            const teethStatus = {};
            if (fullOrder.teeth) {
                fullOrder.teeth.forEach(t => {
                    let processedAreas = [];
                    if (Array.isArray(t.areas)) {
                        processedAreas = t.areas;
                    } else if (typeof t.areas === 'string') {
                        try { processedAreas = JSON.parse(t.areas); } catch (e) { processedAreas = []; }
                    }

                    teethStatus[t.tooth_id] = {
                        extraction: t.extraction,
                        ...processedAreas.reduce((acc, area) => ({ ...acc, [area]: 'treatment' }), {})
                    };
                });
            }

            // Transform Files - assuming backend serves uploads at root
            const files = (fullOrder.files || []).map(f => ({
                id: f.id,
                url: `http://localhost:3000/${f.path.replace(/\\/g, '/')}`,
                file: null // Existing file marker
            }));

            const initialData = {
                teethStatus,
                files,
                formData: {
                    date: fullOrder.order_date,
                    observations: fullOrder.clinical_reason,
                    notes: fullOrder.notes
                }
            };

            setWizardData(initialData);
            setEditingId(orderId);
            setModalMode('edit');
            setIsWizardOpen(true);
        } catch (error) {
            console.error('Error fetching details:', error);
            addToast({ type: 'error', title: 'Error', message: 'No se pudo cargar la orden.' });
        }
    };

    const handleSaveOrder = async (newOrderData) => {
        try {
            const { formData, teethStatus, files } = newOrderData;

            // 1. Order Data Mapping
            const orderPayload = {
                patient_id: parseInt(patientId, 10),
                clinical_reason: formData.observations, // Map observations to clinical_reason
                notes: `Destinatario: ${formData.destination || 'N/A'}. Dr(a). ${formData.doctor || 'N/A'}`,
                order_date: formData.date || new Date().toISOString().split('T')[0],
                status: 'pending',
                prophylaxis: formData.prophylaxis || false,
                fluoride: formData.fluoride || false
            };

            // 2. Teeth Data Mapping
            const teethPayload = Object.entries(teethStatus)
                .filter(([_, status]) => status !== null)
                .map(([toothId, status]) => {
                    const isExtraction = status.extraction === true;
                    let areas = [];

                    if (!isExtraction) {
                        areas = Object.keys(status)
                            .filter(
                                key =>
                                    key !== 'extraction' &&
                                    key !== 'id' &&
                                    (status[key] === true || status[key] === 'treatment')
                            );
                    }

                    return {
                        tooth_id: parseInt(toothId, 10),
                        extraction: isExtraction,
                        areas
                    };
                })
                .filter(item => item.extraction || (item.areas && item.areas.length > 0));

            const finalPayload = {
                ...orderPayload,
                teeth: teethPayload,
                files: files // Service handles FormData
            };

            // 3. API Call
            if (modalMode === 'edit' && editingId) {
                await extractionOrderService.updateOrder(editingId, finalPayload);
            } else {
                await extractionOrderService.createOrder(finalPayload);
            }

            addToast({
                type: 'success',
                title: modalMode === 'edit' ? 'Orden Actualizada' : 'Orden Creada',
                message: modalMode === 'edit'
                    ? 'La orden se ha actualizado exitosamente.'
                    : 'La orden se ha guardado exitosamente.'
            });
            setIsWizardOpen(false);

            // 4. Refresh List
            fetchOrders();

        } catch (error) {
            console.error('Error saving extraction order:', error);
            const msg = error.response?.data?.message || 'Error al guardar la orden';
            addToast({
                type: 'error',
                title: 'Error',
                message: msg
            });
        }
    };

    // --- RENDER ---
    return (
        <div className="
            bg-white dark:bg-[var(--color-secondary)] 
            border border-slate-200 dark:border-slate-700 
            rounded-2xl shadow-sm overflow-hidden
        ">
            <SectionHeader
                onAddExtraction={handleOpenCreateExtraction}
                onAddRestorative={handleOpenCreateRestorative}
            />

            <div className="p-5 bg-slate-50/10 dark:bg-slate-900/10">
                {isLoading ? (
                    <div className="py-12 flex justify-center text-slate-400 animate-pulse">
                        <span className="text-sm font-medium">Cargando órdenes...</span>
                    </div>
                ) : orders.length === 0 ? (
                    <EmptyState
                        onAddExtraction={handleOpenCreateExtraction}
                        onAddRestorative={handleOpenCreateRestorative}
                    />
                ) : (
                    <div className="grid gap-3">
                        <AnimatePresence mode="popLayout">
                            {orders.map((order, index) => (
                                <motion.div
                                    key={order.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                >
                                    <OrderRow
                                        order={order}
                                        onEdit={() => handleEditOrder(order.id)}
                                        onDelete={() => handleDeleteRequest(order)}
                                    />
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>

            {/* Wizard Modal */}
            <ExtractionOrderWizard
                isOpen={isWizardOpen}
                onClose={() => setIsWizardOpen(false)}
                onSave={handleSaveOrder}
                mode={modalMode}
                initialData={wizardData}
                clinicalMode={clinicalMode}
                patientId={patientId}
            />

            <ConfirmDialog
                open={deleteDialogOpen}
                title="Eliminar Orden"
                message="¿Desea eliminar esta orden? Esta acción no se puede deshacer."
                confirmLabel="Eliminar"
                cancelLabel="Cancelar"
                onConfirm={handleDeleteConfirm}
                onCancel={() => setDeleteDialogOpen(false)}
            />
        </div>
    );
}

/* ============================================================
    INTERNAL COMPONENTS
   ============================================================ */

function SectionHeader({ onAddExtraction, onAddRestorative }) {
    return (
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-[var(--color-secondary)] flex flex-col md:flex-row items-center justify-between gap-4 md:gap-0">
            <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="p-2.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl">
                    <Activity size={22} />
                </div>
                <div>
                    <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Órdenes Clínicas</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Gestione extracciones y tratamientos.</p>
                </div>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
                <button
                    onClick={onAddRestorative}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-sm font-semibold rounded-xl transition-all shadow-sm active:scale-95"
                >
                    <Plus size={16} />
                    <span>Restauración</span>
                </button>
                <button
                    onClick={onAddExtraction}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 text-sm font-semibold rounded-xl transition-all shadow-sm active:scale-95"
                >
                    <Plus size={16} />
                    <span>Extracción</span>
                </button>
            </div>
        </div>
    );
}

function OrderRow({ order, onEdit, onDelete }) {
    const [hoveredAction, setHoveredAction] = useState(null);

    // Config based on status + extractions presence
    const statusConfig = {
        'Pendiente': { color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400', icon: Clock },
        'Completada': { color: 'text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400', icon: CheckCircle2 }
    };

    // Default fallback
    const config = statusConfig[order.status] || statusConfig['Pendiente'];
    const StatusIcon = config.icon;

    // Type Badge
    const isExtraction = order.hasExtractions;
    const typeLabel = isExtraction ? 'Extracción' : 'Restauración';
    const typeColor = isExtraction
        ? 'text-red-600 bg-red-50 border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/30'
        : 'text-emerald-600 bg-emerald-50 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-900/30';


    return (
        <div className="group flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white dark:bg-[var(--color-secondary)] border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700 transition-all cursor-pointer">

            {/* Left Info */}
            <div className="flex items-start gap-4 mb-3 sm:mb-0">
                <div className="hidden sm:flex items-center justify-center w-10 h-10 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-400 group-hover:text-blue-500 transition-colors">
                    <FileOutput size={20} />
                </div>
                <div>
                    <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-slate-800 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            Orden #{order.id}
                        </h3>
                        {/* Type Badge */}
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${typeColor}`}>
                            {typeLabel}
                        </span>
                    </div>

                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1">
                            <Calendar size={12} />
                            {order.date}
                        </span>
                        <span>•</span>
                        <span className="truncate max-w-[150px]">{order.destination}</span>
                        <span>•</span>
                        <span>{order.teethCount} piezas</span>
                    </div>
                </div>
            </div>

            {/* Right Actions */}
            <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto">
                {/* Status Badge */}
                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.color}`}>
                    <StatusIcon size={12} />
                    {order.status}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-200 sm:translate-y-1 sm:group-hover:translate-y-0">
                    <div className="relative">
                        <button
                            onClick={(e) => { e.stopPropagation(); onEdit(); }}
                            onMouseEnter={() => setHoveredAction('edit')}
                            onMouseLeave={() => setHoveredAction(null)}
                            className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                        >
                            <Edit2 size={16} />
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
                            onMouseEnter={() => setHoveredAction('export')}
                            onMouseLeave={() => setHoveredAction(null)}
                            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        >
                            <FileText size={16} />
                        </button>
                        <AnimatePresence>
                            {hoveredAction === 'export' && (
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
                                    Exportar PDF
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="relative">
                        <button
                            onClick={(e) => { e.stopPropagation(); onDelete(); }}
                            onMouseEnter={() => setHoveredAction('delete')}
                            onMouseLeave={() => setHoveredAction(null)}
                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        >
                            <Trash2 size={16} />
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
        </div>
    );
}

function EmptyState({ onAddExtraction, onAddRestorative }) {
    return (
        <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-800/20">
            <div className="p-4 bg-white dark:bg-slate-800 rounded-full shadow-sm mb-4">
                <Activity size={32} className="text-blue-500/50" />
            </div>
            <h3 className="text-base font-semibold text-slate-700 dark:text-slate-300">
                No hay órdenes registradas
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 max-w-xs text-center">
                Genere una nueva orden para gestionar extracciones o tratamientos.
            </p>
            <div className="flex items-center gap-3">
                <button
                    onClick={onAddRestorative}
                    className="px-4 py-2 bg-white dark:bg-[var(--color-secondary)] border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-sm font-medium rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors shadow-sm"
                >
                    Nueva Restauración
                </button>
                <button
                    onClick={onAddExtraction}
                    className="px-4 py-2 bg-white dark:bg-[var(--color-secondary)] border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm font-medium rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors shadow-sm"
                >
                    Nueva Extracción
                </button>
            </div>
        </div>
    );
}
