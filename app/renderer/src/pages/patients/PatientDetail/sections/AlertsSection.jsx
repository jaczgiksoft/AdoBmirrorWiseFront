import { useOutletContext } from "react-router-dom";
import React, { useState } from 'react';
import {
    AlertTriangle,
    ShieldAlert,
    Plus,
    Trash2,
    Edit2,
    Calendar,
    MoreVertical,
    Check
} from 'lucide-react';
import PatientAlertModal from "../../shared/PatientAlertModal";

export default function AlertsSection() {
    const { profile } = useOutletContext();
    // Initialize state with patient alerts or empty array
    const [alerts, setAlerts] = useState(profile?.alerts || []);
    const [sortOrder, setSortOrder] = useState('desc'); // 'desc' = newest first

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAlert, setEditingAlert] = useState(null);
    const [defaultIsAdmin, setDefaultIsAdmin] = useState(false);

    // --- MOCK ACTIONS ---
    const handleDelete = (id) => {
        if (confirm('¿Estás seguro de eliminar esta alerta?')) {
            setAlerts(prev => prev.filter(a => a.id !== id));
        }
    };

    const handleEdit = (id) => {
        const alertToEdit = alerts.find(a => a.id === id);
        if (alertToEdit) {
            setEditingAlert(alertToEdit);
            setIsModalOpen(true);
        }
    };

    const handleAddClick = (isAdmin) => {
        setEditingAlert(null);
        setDefaultIsAdmin(isAdmin);
        setIsModalOpen(true);
    };

    const handleSaveAlert = (formData) => {
        if (editingAlert) {
            // Update existing
            setAlerts(prev => prev.map(a =>
                a.id === editingAlert.id ? { ...a, ...formData } : a
            ));
        } else {
            // Create new
            const newAlert = {
                id: Date.now(),
                ...formData,
                createdAt: new Date().toISOString()
            };
            setAlerts(prev => [newAlert, ...prev]);
        }
        setIsModalOpen(false);
        setEditingAlert(null);
    };

    // --- SORTING & GROUPING ---
    const sortedAlerts = [...alerts].sort((a, b) => {
        const dateA = new Date(a.createdAt);
        const dateB = new Date(b.createdAt);
        return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });

    const clinicalAlerts = sortedAlerts.filter(a => !a.is_admin_alert);
    const adminAlerts = sortedAlerts.filter(a => a.is_admin_alert);

    // Helper to chunk array
    const chunkArray = (arr, size) => {
        const chunks = [];
        for (let i = 0; i < arr.length; i += size) {
            chunks.push(arr.slice(i, i + size));
        }
        return chunks;
    };

    const clinicalChunks = chunkArray(clinicalAlerts, 5);
    const adminChunks = chunkArray(adminAlerts, 5);

    return (
        <div className="space-y-6 text-slate-800 dark:text-slate-100">
            <Section
                title="Alertas del Paciente"
                icon={AlertTriangle}
                subtitle="Información crítica y advertencias administrativas."
                onAdd={() => handleAddClick(false)}
            >
                {/* --- CLINICAL ALERTS --- */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold flex items-center gap-2 text-red-600 dark:text-red-400 uppercase tracking-wider">
                            <AlertTriangle size={16} />
                            Alertas Clínicas
                        </h3>
                        <button
                            onClick={() => handleAddClick(false)}
                            className="text-xs flex items-center gap-1 text-primary hover:text-primary/80 transition-colors cursor-pointer"
                        >
                            <Plus size={14} />
                            Agregar
                        </button>
                    </div>

                    <div className="space-y-4">
                        {clinicalChunks.length === 0 ? (
                            <EmptyState text="No hay alertas clínicas registradas." />
                        ) : (
                            clinicalChunks.map((chunk, chunkIndex) => (
                                <div key={chunkIndex} className="grid grid-cols-5 gap-4">
                                    {chunk.map(alert => (
                                        <AlertCard
                                            key={alert.id}
                                            alert={alert}
                                            onDelete={handleDelete}
                                            onEdit={handleEdit}
                                        />
                                    ))}
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* --- ADMINISTRATIVE ALERTS --- */}
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold flex items-center gap-2 text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                            <ShieldAlert size={16} />
                            Alertas Administrativas
                        </h3>
                        <button
                            onClick={() => handleAddClick(true)}
                            className="text-xs flex items-center gap-1 text-primary hover:text-primary/80 transition-colors cursor-pointer"
                        >
                            <Plus size={14} />
                            Agregar
                        </button>
                    </div>

                    <div className="space-y-4">
                        {adminChunks.length === 0 ? (
                            <EmptyState text="No hay alertas administrativas." />
                        ) : (
                            adminChunks.map((chunk, chunkIndex) => (
                                <div key={chunkIndex} className="grid grid-cols-5 gap-4">
                                    {chunk.map(alert => (
                                        <AlertCard
                                            key={alert.id}
                                            alert={alert}
                                            onDelete={handleDelete}
                                            onEdit={handleEdit}
                                        />
                                    ))}
                                </div>
                            ))
                        )}
                    </div>
                </div>

            </Section>

            {/* MODAL */}
            <PatientAlertModal
                open={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setEditingAlert(null);
                }}
                onSave={handleSaveAlert}
                alert={editingAlert}
                defaultIsAdmin={defaultIsAdmin}
                patientId={profile?.id}
            />
        </div>
    );
}

/* ============================================================
    COMPONENTES INTERNOS
============================================================ */

function Section({ title, icon: Icon, subtitle, children, onAdd }) {
    return (
        <div
            className="
                bg-white dark:bg-secondary
                border border-slate-200 dark:border-slate-700
                rounded-2xl p-5 shadow-sm
                space-y-4
            "
        >
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
            </div>

            <div className="mt-2">
                {children}
            </div>
        </div>
    );
}

function AlertCard({ alert: a, onDelete, onEdit }) {
    return (
        <div
            className={`
                rounded-xl border shadow-sm p-3 flex flex-col gap-1 relative group
                ${a.is_admin_alert
                    ? "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300"
                    : "bg-red-50 dark:bg-red-900/20 border-red-300"}
            `}
        >
            {/* Actions Overlay */}
            <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 dark:bg-slate-800/80 rounded-lg p-0.5 shadow-sm z-10">
                <button
                    onClick={() => onEdit(a.id)}
                    className="p-1 text-slate-400 hover:text-blue-500 transition-colors"
                    title="Editar"
                >
                    <Edit2 size={12} />
                </button>
                <button
                    onClick={() => onDelete(a.id)}
                    className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                    title="Eliminar"
                >
                    <Trash2 size={12} />
                </button>
            </div>

            <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                    <AlertTriangle
                        size={14}
                        className={a.is_admin_alert ? "text-yellow-700" : "text-red-700"}
                    />
                    <p className="font-semibold text-[13px] leading-tight truncate max-w-[120px]">
                        {a.title}
                    </p>
                </div>

                <span
                    className={`
                        text-[9px] px-1.5 py-[1px] rounded-full font-medium
                        ${a.is_admin_alert
                            ? "bg-yellow-200/70 text-yellow-800"
                            : "bg-red-200/70 text-red-800"}
                    `}
                >
                    {a.is_admin_alert ? "Admin" : "Clínica"}
                </span>
            </div>

            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-tight line-clamp-2">
                {a.description}
            </p>

            <p className="text-[9px] text-slate-400 dark:text-slate-500 mt-1">
                {new Date(a.createdAt).toLocaleDateString("es-MX")}
            </p>
        </div>
    );
}

function EmptyState({ text }) {
    return (
        <div className="text-center py-6 border border-dashed border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-800/30">
            <p className="text-sm text-slate-400 dark:text-slate-500 italic">
                {text}
            </p>
        </div>
    );
}
