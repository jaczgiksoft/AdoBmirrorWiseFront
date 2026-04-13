// app/renderer/src/pages/attendance/hooks/useAttendance.js
import { useState, useEffect } from "react";
import { INITIAL_ATTENDANCE_DATA, ATTENDANCE_TYPES, LATENESS_OPTIONS } from "../services/attendanceService";
import { getEmployees } from "@/services/employee.service";

const STORAGE_KEY = "bwise_attendance_data";

export function useAttendance() {
    const [records, setRecords] = useState(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        try {
            return saved ? JSON.parse(saved) : INITIAL_ATTENDANCE_DATA;
        } catch (e) {
            console.error("Error parsing attendance storage:", e);
            return INITIAL_ATTENDANCE_DATA;
        }
    });

    const [employees, setEmployees] = useState([]);

    useEffect(() => {
        const fetchEmployeesData = async () => {
            try {
                const data = await getEmployees();
                setEmployees(data);
            } catch (err) {
                console.error("Error fetching employees for attendance:", err);
            }
        };
        fetchEmployeesData();
    }, []);

    // Persist changes to localStorage
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    }, [records]);

    // Add a new record
    const addRecord = (newRecord) => {
        const id = Math.max(0, ...records.map(r => r.id)) + 1;
        setRecords(prev => [{ ...newRecord, id, dateTime: new Date().toISOString() }, ...prev]);
    };

    // Delete a record
    const deleteRecord = (id) => {
        setRecords(prev => prev.filter(r => r.id !== id));
    };

    return {
        records,
        employees,
        attendanceTypes: ATTENDANCE_TYPES,
        latenessOptions: LATENESS_OPTIONS,
        addRecord,
        deleteRecord
    };
}
