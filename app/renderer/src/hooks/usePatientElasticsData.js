import { useState, useEffect, useCallback } from "react";
import { useToastStore } from "../store/useToastStore";
import * as patientElasticService from "../services/patientElastic.service";

export function usePatientElasticsData(patientId) {
    const { addToast } = useToastStore();
    const [instructions, setInstructions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Cargar datos iniciales desde el servidor
    const loadInstructions = useCallback(async () => {
        if (!patientId) return;
        setIsLoading(true);
        setError(null);
        try {
            const response = await patientElasticService.getElasticsByPatientId(patientId);
            if (response.success) {
                // Mapear de base de datos a formato de UI si es necesario
                setInstructions(response.data.map(inst => ({
                    ...inst,
                    startDate: inst.start_date,
                    endDate: inst.end_date,
                    odontogramData: typeof inst.odontogram_data === 'string' 
                        ? JSON.parse(inst.odontogram_data) 
                        : inst.odontogram_data
                })));
            }
        } catch (err) {
            console.error("Error al cargar instrucciones de elásticos:", err);
            setError(err);
            addToast({
                title: "Error",
                message: "No se pudieron cargar las instrucciones de elásticos.",
                type: "error"
            });
        } finally {
            setIsLoading(false);
        }
    }, [patientId, addToast]);

    useEffect(() => {
        loadInstructions();
    }, [loadInstructions]);

    const saveInstruction = async (newInstruction, previewFile) => {
        try {
            const formData = new FormData();
            formData.append('patient_id', patientId);
            formData.append('start_date', newInstruction.startDate);
            if (newInstruction.endDate) formData.append('end_date', newInstruction.endDate);
            formData.append('hours', newInstruction.hours);
            formData.append('notes', newInstruction.notes || '');
            formData.append('upper_elastic', newInstruction.typeId); // Usamos typeId como placeholder para upper_elastic
            formData.append('lower_elastic', newInstruction.type);   // Usamos type (label) como placeholder para lower_elastic
            
            // Los campos JSON deben enviarse como string en FormData
            formData.append('odontogram_data', JSON.stringify(newInstruction.odontogramData));

            if (previewFile) {
                formData.append('preview_image', previewFile);
            }

            const response = await patientElasticService.createElastic(formData);
            
            if (response.success) {
                await loadInstructions(); // Recargar para tener los datos actualizados con IDs reales
                
                addToast({
                    title: "Éxito",
                    message: "Instrucción de elásticos guardada correctamente.",
                    type: "success"
                });
                return true;
            }
            return false;
        } catch (err) {
            console.error("Error al guardar instrucción:", err);
            addToast({
                title: "Error",
                message: "No se pudo guardar la instrucción.",
                type: "error"
            });
            return false;
        }
    };

    const deleteInstruction = async (id) => {
        try {
            const response = await patientElasticService.deleteElastic(id);
            if (response.success) {
                setInstructions(prev => prev.filter(i => i.id !== id));
                addToast({
                    title: "Éxito",
                    message: "Instrucción eliminada.",
                    type: "success"
                });
                return true;
            }
            return false;
        } catch (err) {
            console.error("Error al eliminar instrucción:", err);
            addToast({
                title: "Error",
                message: "No se pudo eliminar la instrucción.",
                type: "error"
            });
            return false;
        }
    };

    return {
        instructions,
        saveInstruction,
        deleteInstruction,
        isLoading,
        error,
        refresh: loadInstructions
    };
}
