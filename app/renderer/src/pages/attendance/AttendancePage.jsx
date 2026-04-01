// app/renderer/src/pages/attendance/AttendancePage.jsx
import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Clock, PlusCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { PageHeader } from "@/components/layout";
import { ConfirmDialog } from "@/components/feedback";
import { useAttendance } from "./hooks/useAttendance";

import AttendanceTable from "./components/AttendanceTable";
import AttendanceFormModal from "./components/AttendanceFormModal";
import AttendanceFilters from "./components/AttendanceFilters";

export default function AttendancePage() {
    const navigate = useNavigate();
    const {
        records,
        employees,
        attendanceTypes,
        latenessOptions,
        addRecord,
        deleteRecord
    } = useAttendance();

    // -- State --
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedType, setSelectedType] = useState("all");
    const [selectedLateness, setSelectedLateness] = useState("all");
    const [dateRange, setDateRange] = useState({ startDate: null, endDate: null });

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [recordToDelete, setRecordToDelete] = useState(null);

    // -- Memoized Filtering --
    const filteredRecords = useMemo(() => {
        return records.filter(rec => {
            // 🔍 Search Filter
            const matchesSearch = rec.employeeName.toLowerCase().includes(searchTerm.toLowerCase());

            // 🏷️ Type Filter
            const matchesType = selectedType === "all" || rec.type === selectedType;

            // ⏰ Lateness Filter
            const matchesLateness = selectedLateness === "all" ||
                (selectedLateness === "late" && rec.isLate) ||
                (selectedLateness === "on_time" && !rec.isLate);

            // 📅 Date Range Filter
            let matchesDate = true;
            if (dateRange.startDate && dateRange.endDate) {
                const recDate = new Date(rec.dateTime);
                const start = new Date(dateRange.startDate);
                const end = new Date(dateRange.endDate);
                end.setHours(23, 59, 59, 999);
                matchesDate = recDate >= start && recDate <= end;
            }

            return matchesSearch && matchesType && matchesLateness && matchesDate;
        });
    }, [records, searchTerm, selectedType, selectedLateness, dateRange]);

    // -- Handlers --
    const handleSave = (data) => {
        addRecord(data);
        setIsModalOpen(false);
    };

    const handleDeleteConfirm = () => {
        if (recordToDelete) {
            deleteRecord(recordToDelete.id);
            setRecordToDelete(null);
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            <PageHeader
                icon={Clock}
                title="Control de Asistencias"
                subtitle="Gestión de entradas, salidas y puntualidad de empleados"
                onBack={() => navigate("/dashboard")}
            />

            {/* Actions Row */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <AttendanceFilters
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                    selectedType={selectedType}
                    setSelectedType={setSelectedType}
                    selectedLateness={selectedLateness}
                    setSelectedLateness={setSelectedLateness}
                    dateRange={dateRange}
                    setDateRange={setDateRange}
                    attendanceTypes={attendanceTypes}
                    latenessOptions={latenessOptions}
                />

                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsModalOpen(true)}
                    className="
                        flex items-center justify-center gap-2 px-6 py-3.5 
                        bg-primary text-white font-bold rounded-2xl 
                        shadow-lg shadow-primary/30 hover:bg-sky-500 
                        transition-all duration-300 cursor-pointer
                    "
                >
                    <PlusCircle size={20} />
                    <span>Registrar Entrada/Salida</span>
                </motion.button>
            </div>

            {/* Table Section */}
            <div className="bg-white dark:bg-secondary rounded-3xl shadow-soft dark:shadow-none border border-slate-100 dark:border-slate-800 overflow-hidden transform transition-all">
                <div className="p-1 px-4 py-3 bg-slate-50 dark:bg-dark/40 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest pl-2">
                        Historial de Movimientos
                    </h3>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                            {filteredRecords.length} Registros
                        </span>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <AttendanceTable
                        records={filteredRecords}
                        onDelete={setRecordToDelete}
                    />
                </div>
            </div>

            {/* Modals */}
            <AnimatePresence>
                {isModalOpen && (
                    <AttendanceFormModal
                        open={isModalOpen}
                        onClose={() => setIsModalOpen(false)}
                        onSave={handleSave}
                        employees={employees}
                        attendanceTypes={attendanceTypes}
                    />
                )}
            </AnimatePresence>

            <ConfirmDialog
                open={!!recordToDelete}
                title="Eliminar Registro"
                message={`¿Estás seguro de que deseas eliminar el registro de ${recordToDelete?.employeeName}? Esta acción no se puede deshacer.`}
                onConfirm={handleDeleteConfirm}
                onCancel={() => setRecordToDelete(null)}
                confirmLabel="Eliminar"
                cancelLabel="Cancelar"
                confirmVariant="error"
            />
        </div>
    );
}
