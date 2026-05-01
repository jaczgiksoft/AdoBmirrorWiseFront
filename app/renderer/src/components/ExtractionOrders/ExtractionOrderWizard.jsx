import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, Save, CheckCircle2 } from 'lucide-react';

import { ConfirmDialog } from '@/components/feedback';
import OdontogramStep from './Steps/OdontogramStep';
import RadiographsStep from './Steps/RadiographsStep';
import AdditionalDataStep from './Steps/AdditionalDataStep';
import { useToastStore } from '@/store/useToastStore';
import useExtractionWizard from '@/hooks/useExtractionWizard';

const ExtractionOrderWizard = ({
    isOpen,
    onClose,
    onSave,
    mode = 'create',
    initialData = null,
    clinicalMode,
    patientId
}) => {

    const { addToast } = useToastStore();

    const {
        step,
        teethStatus,
        setTeethStatus,
        files,
        setFiles,
        formData,
        setFormData,
        isLoading,
        showResetConfirm,
        setShowResetConfirm,
        canProceed,
        handleNext,
        handleBack,
        handleFinish,
        handleResetConfirm
    } = useExtractionWizard({
        isOpen,
        mode,
        initialData,
        patientId,
        clinicalMode,
        addToast,
        onSave,
        onClose
    });
    const renderStep = () => {
        switch (step) {
            case 1:
                return (
                    <OdontogramStep
                        teethStatus={teethStatus}
                        onStatusChange={(id, status) =>
                            setTeethStatus(prev => ({ ...prev, [id]: status }))
                        }
                        onResetRequest={() => setShowResetConfirm(true)}
                        clinicalMode={clinicalMode}
                    />
                );
            case 2:
                return <RadiographsStep files={files} setFiles={setFiles} />;
            case 3:
                return (
                    <AdditionalDataStep
                        data={formData}
                        onChange={setFormData}
                        clinicalMode={clinicalMode}
                    />
                );
            default:
                return null;
        }
    };

    const getTitle = () => {
        if (mode === 'edit') {
            return clinicalMode === 'extraction'
                ? 'Editar Orden de Extracción'
                : 'Editar Orden Restaurativa';
        }
        return clinicalMode === 'extraction'
            ? 'Nueva Orden de Extracción'
            : 'Nueva Orden Restaurativa';
    };

    return createPortal(
        <>
            <AnimatePresence>
                {isOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white dark:bg-secondary rounded-2xl shadow-2xl w-full max-w-5xl h-[70vh] flex flex-col overflow-hidden"
                        >

                            {/* Header */}
                            <div className="bg-white dark:bg-secondary border-b border-slate-100 dark:border-slate-800 px-6 py-4 flex justify-between items-center shrink-0">
                                <div>
                                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                                        {getTitle()}
                                    </h2>
                                    <p className="text-slate-500 text-xs font-medium mt-0.5 uppercase tracking-wide">
                                        Paso {step} de 3
                                    </p>
                                </div>

                                <div className="flex items-center gap-10">
                                    <WizardSteps currentStep={step} />
                                    <div className="w-px h-8 bg-slate-200 dark:bg-slate-700"></div>

                                    <button
                                        onClick={onClose}
                                        className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="flex-1 p-0 overflow-hidden bg-slate-50 dark:bg-slate-900/50 relative">
                                <div className="absolute inset-0 p-6 overflow-y-auto">
                                    {isLoading ? (
                                        <div className="flex justify-center items-center h-full text-slate-400">
                                            Cargando odontograma...
                                        </div>
                                    ) : (
                                        renderStep()
                                    )}
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="bg-white dark:bg-secondary border-t border-slate-100 dark:border-slate-800 p-6 flex justify-between items-center shrink-0">
                                <button
                                    onClick={step === 1 ? onClose : handleBack}
                                    className="px-6 py-2 rounded-lg font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all active:scale-95"
                                >
                                    {step === 1 ? 'Cancelar' : 'Atrás'}
                                </button>

                                <div className="flex gap-3">
                                    {step < 3 ? (
                                        <button
                                            onClick={handleNext}
                                            disabled={!canProceed}
                                            className={`px-6 py-2 rounded-lg font-bold text-white shadow-md shadow-primary/20 transition-all hover:-translate-y-0.5 active:scale-95 flex items-center gap-2 ${canProceed
                                                ? 'bg-primary hover:bg-primary/90'
                                                : 'bg-slate-300 dark:bg-slate-700 cursor-not-allowed text-slate-500'
                                                }`}
                                        >
                                            Siguiente
                                            <ArrowRight size={18} />
                                        </button>
                                    ) : (
                                        <button
                                            onClick={handleFinish}
                                            className="px-6 py-2 rounded-lg font-bold text-white bg-primary hover:bg-primary/90 shadow-md shadow-primary/20 transition-all hover:-translate-y-0.5 active:scale-95 flex items-center gap-2"
                                        >
                                            <Save size={18} />
                                            {mode === 'edit' ? 'Guardar Cambios' : 'Generar Orden'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* RESET CONFIRMATION */}
            <ConfirmDialog
                open={showResetConfirm}
                title="¿Limpiar odontograma?"
                message="Esta acción borrará todas las selecciones actuales. ¿Desea continuar?"
                confirmLabel="Sí, limpiar todo"
                cancelLabel="Cancelar"
                confirmVariant="error"
                onConfirm={handleResetConfirm}
                onCancel={() => setShowResetConfirm(false)}
            />
        </>,
        document.body
    );
};

function WizardSteps({ currentStep }) {
    const steps = [
        { label: 'ODONTOGRAMA' },
        { label: 'IMÁGENES CLÍNICAS' },
        { label: 'DATOS DE LA ORDEN' }
    ];

    return (
        <div className="relative flex items-center justify-between w-[330px]">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-[2px] bg-slate-100 dark:bg-slate-800 z-0" />

            <div
                className="absolute left-0 top-1/2 -translate-y-1/2 h-[2px] bg-primary z-0 transition-all duration-500 ease-out"
                style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
            />

            {steps.map((step, index) => {
                const stepNum = index + 1;
                const isActive = stepNum === currentStep;
                const isCompleted = stepNum < currentStep;

                return (
                    <div key={step.label} className="relative z-10 flex flex-col items-center">
                        <div
                            className={`
                                w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all duration-300
                                ${isCompleted
                                    ? 'bg-primary border-primary text-white'
                                    : isActive
                                        ? 'bg-white dark:bg-slate-900 border-primary text-primary scale-110'
                                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-300'
                                }
                            `}
                        >
                            {isCompleted ? (
                                <CheckCircle2 size={14} strokeWidth={3} />
                            ) : (
                                <span className="text-[10px] font-bold">{stepNum}</span>
                            )}
                        </div>

                        <span
                            className={`
                                absolute top-9 text-[9px] font-bold tracking-wider whitespace-nowrap
                                ${isActive || isCompleted
                                    ? 'text-primary'
                                    : 'text-slate-400 dark:text-slate-600'
                                }
                            `}
                        >
                            {step.label}
                        </span>
                    </div>
                );
            })}
        </div>
    );
}

export default ExtractionOrderWizard;