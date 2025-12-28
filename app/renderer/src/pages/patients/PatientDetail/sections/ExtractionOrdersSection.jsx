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
import ExtractionOrderWizard from '../../../../components/ExtractionOrders/ExtractionOrderWizard';
import { ConfirmDialog } from '@/components/feedback';

export default function ExtractionOrdersSection() {
    const { id: patientId } = useParams();
    const { addToast } = useToastStore();
    const [isWizardOpen, setIsWizardOpen] = useState(false);
    const [modalMode, setModalMode] = useState('create');
    const [editingId, setEditingId] = useState(null);
    const [wizardData, setWizardData] = useState(null);

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
            await api.delete(`/patient-extractions/${orderToDelete.id}`);
            addToast({
                type: 'success',
                title: 'Orden Eliminada',
                message: 'La orden de extracción ha sido eliminada exitosamente.'
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
            const response = await api.get(`/patient-extractions/patient/${patientId}`);

            // Normalize API data to UI shape
            const normalizedOrders = response.data.map(order => ({
                id: order.id,
                date: order.date,
                destination: order.destination || 'Destinatario Externo',
                teethCount: order.teeth ? order.teeth.length : 0,
                status: 'Pendiente' // Default status
            }));

            // Sort by ID desc (newest first)
            normalizedOrders.sort((a, b) => b.id - a.id);

            setOrders(normalizedOrders);
        } catch (error) {
            console.error('Error fetching orders:', error);
            addToast({
                type: 'error',
                title: 'Error',
                message: 'No se pudieron cargar las órdenes de extracción.'
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

    const handleOpenCreate = () => {
        setModalMode('create');
        setEditingId(null);
        setWizardData(null);
        setIsWizardOpen(true);
    };

    const handleEditOrder = async (orderId) => {
        try {
            const response = await api.get(`/patient-extractions/${orderId}`);
            const fullOrder = response.data;

            // Transform Teeth
            const teethStatus = {};
            if (fullOrder.teeth) {
                fullOrder.teeth.forEach(t => {
                    teethStatus[t.tooth_id] = {
                        extraction: t.extraction,
                        ...t.areas.reduce((acc, area) => ({ ...acc, [area]: 'treatment' }), {})
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
                    date: fullOrder.date,
                    destination: fullOrder.destination,
                    observations: fullOrder.observations,
                    prophylaxis: fullOrder.prophylaxis,
                    fluoride: fullOrder.fluoride
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

            // 1. Order Data
            const orderPayload = {
                destination: formData.destination,
                date: formData.date,
                observations: formData.observations,
                prophylaxis: formData.prophylaxis || false,
                fluoride: formData.fluoride || false
            };

            // 2. Teeth Data
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
                        tooth: parseInt(toothId, 10),
                        extraction: isExtraction,
                        areas
                    };
                })
                .filter(item => item.extraction || item.areas.length > 0);

            // 3. Construct FormData
            const apiPayload = new FormData();
            apiPayload.append('patient_id', patientId);
            apiPayload.append('order', JSON.stringify(orderPayload));
            apiPayload.append('teeth', JSON.stringify(teethPayload));

            if (files && files.length > 0) {
                files.forEach(fileWrapper => {
                    if (fileWrapper.file) {
                        apiPayload.append('radiographs', fileWrapper.file);
                    }
                });
            }

            // 4. API Call
            if (modalMode === 'edit' && editingId) {
                await api.put(`/patient-extractions/${editingId}`, apiPayload);
            } else {
                await api.post('/patient-extractions', apiPayload);
            }

            addToast({
                type: 'success',
                title: modalMode === 'edit' ? 'Orden Actualizada' : 'Orden Creada',
                message: modalMode === 'edit'
                    ? 'La orden se ha actualizado exitosamente.'
                    : 'La orden de extracción se ha guardado exitosamente.'
            });
            setIsWizardOpen(false);

            // 5. Refresh List
            fetchOrders();

        } catch (error) {
            console.error('Error creating extraction order:', error);
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
        <div className="space-y-6">
            <SectionHeader onAdd={handleOpenCreate} />

            {isLoading ? (
                <div className="py-12 flex justify-center text-slate-400 animate-pulse">
                    <span className="text-sm font-medium">Cargando órdenes...</span>
                </div>
            ) : orders.length === 0 ? (
                <EmptyState onAdd={handleOpenCreate} />
            ) : (
                <div className="grid gap-4">
                    <AnimatePresence mode="popLayout">
                        {orders.map((order, index) => (
                            <motion.div
                                key={order.id}
                                initial={{ opacity: 0, y: 20 }}
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

            {/* Wizard Modal */}
            <ExtractionOrderWizard
                isOpen={isWizardOpen}
                onClose={() => setIsWizardOpen(false)}
                onSave={handleSaveOrder}
                mode={modalMode}
                initialData={wizardData}
            />

            <ConfirmDialog
                open={deleteDialogOpen}
                title="Eliminar Orden"
                message="¿Desea eliminar esta orden de extracción? Esta acción no se puede deshacer."
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

function SectionHeader({ onAdd }) {
    return (
        <div className="flex items-center justify-between bg-white dark:bg-[var(--color-secondary)] border border-slate-200 dark:border-slate-700 p-5 rounded-2xl shadow-sm">
            <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl">
                    <Activity size={22} />
                </div>
                <div>
                    <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Órdenes de Extracción</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Gestione las derivaciones y tratamientos quirúrgicos.</p>
                </div>
            </div>
            <button
                onClick={onAdd}
                className="flex items-center gap-2 px-4 py-2 bg-[var(--color-primary)] hover:opacity-90 text-white text-sm font-medium rounded-lg transition-all shadow-sm active:scale-95"
            >
                <Plus size={16} />
                <span>Nueva Orden</span>
            </button>
        </div>
    );
}

function OrderRow({ order, onEdit, onDelete }) {
    // Config based on status
    const statusConfig = {
        'Pendiente': { color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400', icon: Clock },
        'Completada': { color: 'text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400', icon: CheckCircle2 }
    };

    // Default fallback
    const config = statusConfig[order.status] || statusConfig['Pendiente'];
    const StatusIcon = config.icon;

    return (
        <div className="group flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white dark:bg-[var(--color-secondary)] border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700 transition-all cursor-pointer">

            {/* Left Info */}
            <div className="flex items-start gap-4 mb-3 sm:mb-0">
                <div className="hidden sm:flex items-center justify-center w-10 h-10 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-400 group-hover:text-blue-500 transition-colors">
                    <FileOutput size={20} />
                </div>
                <div>
                    <h3 className="font-semibold text-slate-800 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        Orden #{order.id}
                    </h3>
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
                <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={(e) => { e.stopPropagation(); onEdit(); }}
                        className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                        title="Editar"
                    >
                        <Edit2 size={16} />
                    </button>
                    <button
                        className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        title="Exportar PDF"
                    >
                        <FileText size={16} />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onDelete(); }}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
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
                <Activity size={32} className="text-blue-500/50" />
            </div>
            <h3 className="text-base font-semibold text-slate-700 dark:text-slate-300">
                No hay órdenes de extracción
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 max-w-xs text-center">
                Genere la primera orden para este paciente para gestionar sus extracciones.
            </p>
            <button
                onClick={onAdd}
                className="px-4 py-2 bg-white dark:bg-[var(--color-secondary)] border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 text-sm font-medium rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
            >
                Crear orden ahora
            </button>
        </div>
    );
}
