import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, Star, Smile, AlertTriangle, Clock, Timer, XCircle,
    Sparkles, Droplet, AlertOctagon, Check
} from 'lucide-react';

export function CategorySelector({ title, value, onChange, options }) {
    return (
        <div className="mb-6">
            <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">
                {title}
            </h3>
            <div className="grid grid-cols-3 gap-3">
                {options.map((option) => {
                    const isSelected = value === option.value;
                    const Icon = option.icon;
                    return (
                        <button
                            key={option.value}
                            onClick={() => onChange(option.value)}
                            className={`
                                relative flex flex-col items-center justify-center p-4 rounded-xl border transition-all duration-200
                                hover:scale-[1.02] active:scale-95
                                ${isSelected
                                    ? 'border-primary bg-primary/10 text-primary shadow-sm'
                                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'
                                }
                            `}
                        >
                            <Icon size={28} className={isSelected ? "text-primary mb-2" : "text-slate-400 dark:text-slate-500 mb-2"} />
                            <span className="text-sm font-semibold">{option.label}</span>

                            {isSelected && (
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="absolute top-2 right-2 bg-primary text-white rounded-full p-0.5"
                                >
                                    <Check size={12} strokeWidth={3} />
                                </motion.div>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

export default function PatientEvaluationModal({ open, onClose, appointment, onSave }) {
    const [attitude, setAttitude] = useState(null);
    const [punctuality, setPunctuality] = useState(null);
    const [hygiene, setHygiene] = useState(null);

    // If modal is not open, we still render AnimatePresence to handle exit animation
    if (!appointment) return null;

    const attitudeOptions = [
        { value: 3, label: 'Excelente', icon: Star },
        { value: 2, label: 'Normal', icon: Smile },
        { value: 1, label: 'Difícil', icon: AlertTriangle },
    ];

    const punctualityOptions = [
        { value: 3, label: 'Puntual', icon: Clock },
        { value: 2, label: 'Tolerable', icon: Timer },
        { value: 1, label: 'Impuntual', icon: XCircle },
    ];

    const hygieneOptions = [
        { value: 3, label: 'Adecuada', icon: Sparkles },
        { value: 2, label: 'Regular', icon: Droplet },
        { value: 1, label: 'Deficiente', icon: AlertOctagon },
    ];

    const canSave = attitude && punctuality && hygiene;

    const handleSave = () => {
        if (!canSave) return;
        const evaluation = {
            appointmentId: appointment.id,
            patientId: appointment.patient?.id,
            attitude,
            punctuality,
            hygiene,
            createdAt: new Date()
        };
        onSave(evaluation);
        onClose();
        // Reset state after animation
        setTimeout(() => {
            setAttitude(null);
            setPunctuality(null);
            setHygiene(null);
        }, 300);
    };

    const patientName = appointment.patient
        ? `${appointment.patient.first_name} ${appointment.patient.last_name}`
        : "Paciente Desconocido";

    return (
        <AnimatePresence>
            {open && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                        onClick={onClose}
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        transition={{ type: "spring", duration: 0.4, bounce: 0 }}
                        className="relative w-full max-w-lg bg-white dark:bg-secondary rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-slate-200 dark:border-slate-800"
                    >
                        {/* Header */}
                        <div className="flex items-start justify-between p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
                            <div>
                                <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-1">Calificar Paciente</h2>
                                <p className="text-slate-600 dark:text-slate-300 font-medium">{patientName}</p>
                                <div className="flex items-center gap-2 mt-1 text-xs text-slate-400 dark:text-slate-500">
                                    {appointment.patient?.medical_record_number && (
                                        <span>EXP: {appointment.patient.medical_record_number} •</span>
                                    )}
                                    <span>{appointment.date}</span>
                                    {appointment.start_time && (
                                        <span>• {appointment.start_time.substring(0, 5)}</span>
                                    )}
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 -mr-2 -mt-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Body - Selectors */}
                        <div className="p-6 overflow-y-auto max-h-[60vh] custom-scrollbar">
                            <CategorySelector
                                title="Actitud"
                                value={attitude}
                                onChange={setAttitude}
                                options={attitudeOptions}
                            />

                            <CategorySelector
                                title="Puntualidad"
                                value={punctuality}
                                onChange={setPunctuality}
                                options={punctualityOptions}
                            />

                            <CategorySelector
                                title="Higiene"
                                value={hygiene}
                                onChange={setHygiene}
                                options={hygieneOptions}
                            />
                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 flex gap-3">
                            <button
                                onClick={onClose}
                                className="flex-1 px-4 py-3 rounded-xl font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition active:scale-[0.98]"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={!canSave}
                                className={`
                                    flex-[2] px-4 py-3 rounded-xl font-bold text-white transition-all active:scale-[0.98] shadow-sm
                                    ${canSave
                                        ? 'bg-primary hover:bg-sky-600 shadow-primary/20'
                                        : 'bg-slate-300 dark:bg-slate-700 cursor-not-allowed opacity-70'
                                    }
                                `}
                            >
                                Guardar evaluación
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
