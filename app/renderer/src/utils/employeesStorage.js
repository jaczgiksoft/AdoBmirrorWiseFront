/**
 * ⚠️ TEMPORAL - MOCK STORAGE
 * Esta implementación usa localStorage para simular persistencia de datos de empleados.
 * 
 * 📌 IMPORTANTE:
 * - Esto es un MOCK temporal para desarrollo.
 * - Debe eliminarse completamente cuando se conecte a un backend real (API).
 * - Reemplazar por llamadas a servicios (GET, POST, PUT, DELETE).
 * - Diseñado para ser removido fácilmente sin afectar la lógica de los componentes.
 */

const STORAGE_KEY = "employees_mock_data";

export const employeesStorage = {
    /**
     * Obtiene los empleados guardados o retorna los iniciales si no hay nada.
     * @param {Array} initialData - Datos iniciales por defecto (MOCK_EMPLOYEES).
     */
    get: (initialData = []) => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            return stored ? JSON.parse(stored) : initialData;
        } catch (error) {
            console.error("Error loading employees from localStorage:", error);
            return initialData;
        }
    },

    /**
     * Guarda la lista completa de empleados.
     * @param {Array} employees - Lista de empleados a persistir.
     */
    save: (employees) => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(employees));
        } catch (error) {
            console.error("Error saving employees to localStorage:", error);
        }
    },

    /**
     * Limpia el almacenamiento (opcional/utilidad).
     */
    clear: () => {
        localStorage.removeItem(STORAGE_KEY);
    }
};
