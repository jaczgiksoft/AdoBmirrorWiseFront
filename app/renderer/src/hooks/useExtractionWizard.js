import { useState, useEffect } from 'react';
import * as odontogramService from '@/services/odontogram.service';

export default function useExtractionWizard({
    isOpen,
    mode,
    initialData,
    patientId,
    clinicalMode,
    addToast,
    onSave,
    onClose
}) {
    const [step, setStep] = useState(1);
    const [teethStatus, setTeethStatus] = useState({});
    const [files, setFiles] = useState([]);
    const [formData, setFormData] = useState({});
    const [isLoading, setIsLoading] = useState(false);

    const [showResetConfirm, setShowResetConfirm] = useState(false);

    // 🔥 INIT LOGIC (ANTES estaba en useEffect del componente)
    useEffect(() => {
        const loadInitialData = async () => {
            if (!isOpen) return;

            setStep(1);
            setShowResetConfirm(false);

            if (mode === 'edit' && initialData) {
                setTeethStatus(initialData.teethStatus || {});
                setFiles(initialData.files || []);
                setFormData(initialData.formData || {});
                return;
            }

            if (mode === 'create' && patientId) {
                try {
                    setIsLoading(true);

                    const response = await odontogramService.getOdontogramByPatientId(patientId);
                    const odontogram = response.data;

                    if (odontogram?.details) {
                        const initialTeethStatus = {};

                        odontogram.details.forEach(detail => {
                            let status = detail.status || {};
                            if (typeof status === 'string') {
                                try { status = JSON.parse(status); } catch { status = {}; }
                            }

                            let caras = detail.caras || {};
                            if (typeof caras === 'string') {
                                try { caras = JSON.parse(caras); } catch { caras = {}; }
                            }

                            const isExtraction =
                                status.toothState === 'missing' ||
                                status.toothState === 'extraction';

                            initialTeethStatus[detail.tooth_id] = {
                                north: caras.north || null,
                                south: caras.south || null,
                                east: caras.east || null,
                                west: caras.west || null,
                                center: caras.center || null,
                                extraction: isExtraction
                            };
                        });

                        setTeethStatus(initialTeethStatus);
                    } else {
                        setTeethStatus({});
                    }
                } catch (error) {
                    console.error("Error loading odontogram:", error);
                    addToast({
                        type: 'error',
                        title: 'Error',
                        message: 'No se pudo precargar el odontograma actual.'
                    });
                    setTeethStatus({});
                } finally {
                    setIsLoading(false);
                }

                setFiles([]);
                setFormData({});
            }
        };

        loadInitialData();
    }, [isOpen, mode, initialData, patientId]);

    // 🔹 VALIDACIÓN
    const hasSelection = Object.values(teethStatus).some(
        t => t && (t.extraction || Object.values(t).some(v => v !== null && v !== false))
    );

    const canProceed = step === 1 ? hasSelection : true;

    // 🔹 ACTIONS
    const handleNext = () => {
        if (step < 3 && canProceed) setStep(prev => prev + 1);
    };

    const handleBack = () => {
        if (step > 1) setStep(prev => prev - 1);
    };

    const handleFinish = () => {
        onSave({ teethStatus, files, formData });
        onClose();
    };

    const handleResetConfirm = () => {
        setTeethStatus({});
        setShowResetConfirm(false);
    };

    return {
        step,
        setStep,
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
    };
}