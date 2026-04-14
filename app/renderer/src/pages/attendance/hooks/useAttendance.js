// app/renderer/src/pages/attendance/hooks/useAttendance.js
import { useState, useEffect, useCallback } from "react";
import attendanceService from "../services/attendanceService";
import { getEmployees } from "@/services/employee.service";
import { useToastStore } from "@/store/useToastStore";

export function useAttendance() {
    const { addToast } = useToastStore();
    const [records, setRecords] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchEmployeesData = useCallback(async () => {
        try {
            const data = await getEmployees();
            setEmployees(data);
        } catch (err) {
            console.error("Error fetching employees for attendance:", err);
        }
    }, []);

    const fetchRecords = useCallback(async (filters = {}) => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await attendanceService.getAll(filters);
            setRecords(data);
        } catch (err) {
            const msg = err.response?.data?.message || "Error al cargar asistencias";
            setError(msg);
            addToast({ type: "error", title: "Atención", message: msg });
        } finally {
            setIsLoading(false);
        }
    }, [addToast]);

    useEffect(() => {
        fetchEmployeesData();
        fetchRecords();
    }, [fetchEmployeesData, fetchRecords]);

    const addRecord = async (newRecord) => {
        setIsLoading(true);
        try {
            await attendanceService.create(newRecord);
            addToast({ type: "success", title: "Éxito", message: "Asistencia registrada correctamente" });
            await fetchRecords(); // Refresh list
            return true;
        } catch (err) {
            const msg = err.response?.data?.message || "Error al registrar asistencia";
            addToast({ type: "error", title: "Error", message: msg });
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    const deleteRecord = async (id) => {
        setIsLoading(true);
        try {
            await attendanceService.delete(id);
            addToast({ type: "success", title: "Éxito", message: "Registro eliminado correctamente" });
            setRecords(prev => prev.filter(r => r.id !== id));
            return true;
        } catch (err) {
            const msg = err.response?.data?.message || "Error al eliminar registro";
            addToast({ type: "error", title: "Error", message: msg });
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    return {
        records,
        employees,
        isLoading,
        error,
        fetchRecords,
        addRecord,
        deleteRecord
    };
}
