import { useState, useEffect } from "react";
import { useToastStore } from "../store/useToastStore";

export function usePatientElasticsData(patientId) {
    const { addToast } = useToastStore();
    const [instructions, setInstructions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const STORAGE_KEY = `elastics_instructions_${patientId}`;

    // Cargar datos iniciales
    useEffect(() => {
        if (!patientId) return;
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
                setInstructions(JSON.parse(raw));
            }
        } catch (error) {
            console.error("Error al cargar instrucciones de elásticos:", error);
        } finally {
            setIsLoading(false);
        }
    }, [patientId]);

    const saveInstruction = async (newInstruction) => {
        try {
            const updatedInstructions = [...instructions, { ...newInstruction, id: Date.now() }];
            setInstructions(updatedInstructions);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedInstructions));
            
            addToast({
                title: "Éxito",
                message: "Instrucción de elásticos guardada correctamente.",
                type: "success"
            });
            return true;
        } catch (error) {
            console.error("Error al guardar instrucción:", error);
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
            const updatedInstructions = instructions.filter(i => i.id !== id);
            setInstructions(updatedInstructions);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedInstructions));
            addToast({
                title: "Éxito",
                message: "Instrucción eliminada.",
                type: "success"
            });
        } catch (error) {
            addToast({
                title: "Error",
                message: "No se pudo eliminar la instrucción.",
                type: "error"
            });
        }
    };

    return {
        instructions,
        saveInstruction,
        deleteInstruction,
        isLoading
    };
}
