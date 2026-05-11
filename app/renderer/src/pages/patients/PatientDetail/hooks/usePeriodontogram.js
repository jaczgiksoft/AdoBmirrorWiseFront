import { useState, useCallback } from 'react';

/**
 * Hook personalizado para gestionar el estado de un Periodontograma (Estándar SEPA).
 * 
 * Estructura de datos:
 * - 32 dientes (Adultos, notación FDI).
 * - Cada diente: movilidad, furca (solo molares), ausente.
 * - Cada diente tiene 2 caras: vestibular y palatino/lingual.
 * - Cada cara tiene 3 puntos (mesial, central, distal) para margen, profundidad, sangrado y placa.
 */

const MOLARS = [18, 17, 16, 26, 27, 28, 36, 37, 38, 46, 47, 48];

const ALL_TEETH_IDS = [
    18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28,
    48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38
];

const createInitialFaceState = () => ({
    margenGingival: [0, 0, 0],     // [mesial, central, distal]
    profundidadSondaje: [0, 0, 0], // [mesial, central, distal]
    sangrado: [false, false, false],
    placa: [false, false, false],
    supuracion: [false, false, false]
});

const buildInitialState = () => {
    const initialState = {};
    ALL_TEETH_IDS.forEach(id => {
        initialState[id] = {
            id,
            mobility: 0,
            furca: 0, // Solo relevante para molares
            prognosis: '', // Bueno, Dudoso, Malo, Imposible
            note: '', // Notas u observaciones por diente
            absent: false,
            vestibular: createInitialFaceState(),
            palatino: createInitialFaceState()
        };
    });
    return initialState;
};

export const usePeriodontogram = () => {
    const [teeth, setTeeth] = useState(buildInitialState);

    /**
     * Actualiza una medición específica en una cara de un diente.
     * @param {number|string} toothId - ID del diente (ej. 11)
     * @param {string} face - 'vestibular' | 'palatino'
     * @param {number} pointIndex - 0 (mesial), 1 (central), 2 (distal)
     * @param {string} field - 'margenGingival' | 'profundidadSondaje' | 'sangrado' | 'placa'
     * @param {any} value - Nuevo valor
     */
    const updateMeasurement = useCallback((toothId, face, pointIndex, field, value) => {
        setTeeth(prev => {
            const tooth = prev[toothId];
            if (!tooth) return prev;

            const faceData = tooth[face];
            const currentArray = faceData[field];
            
            const newArray = [...currentArray];
            newArray[pointIndex] = value;

            return {
                ...prev,
                [toothId]: {
                    ...tooth,
                    [face]: {
                        ...faceData,
                        [field]: newArray
                    }
                }
            };
        });
    }, []);

    /**
     * Actualiza propiedades generales del diente.
     * @param {number|string} toothId 
     * @param {string} field - 'mobility' | 'furca' | 'absent'
     * @param {any} value 
     */
    const updateToothGeneral = useCallback((toothId, field, value) => {
        setTeeth(prev => {
            const tooth = prev[toothId];
            if (!tooth) return prev;

            // Validación de furca solo para molares
            if (field === 'furca' && !MOLARS.includes(Number(toothId))) {
                return prev;
            }

            return {
                ...prev,
                [toothId]: {
                    ...tooth,
                    [field]: value
                }
            };
        });
    }, []);

    /**
     * Calcula el Nivel de Inserción (CAL) para una cara específica.
     * CAL = Margen Gingival + Profundidad de Sondaje.
     * @param {number|string} toothId 
     * @param {string} face 
     * @returns {number[]} Array de 3 valores [mesial, central, distal]
     */
    const getNivelInsercion = useCallback((toothId, face) => {
        const tooth = teeth[toothId];
        if (!tooth) return [0, 0, 0];

        const { margenGingival, profundidadSondaje } = tooth[face];
        
        return margenGingival.map((margen, idx) => {
            const profundidad = profundidadSondaje[idx] || 0;
            return (Number(margen) || 0) + (Number(profundidad) || 0);
        });
    }, [teeth]);

    /**
     * Reinicia el periodontograma al estado inicial.
     */
    const resetPeriodontogram = useCallback(() => {
        setTeeth(buildInitialState());
    }, []);

    return {
        teeth,
        updateMeasurement,
        updateToothGeneral,
        getNivelInsercion,
        resetPeriodontogram,
        constants: {
            MOLARS,
            ALL_TEETH_IDS
        }
    };
};
