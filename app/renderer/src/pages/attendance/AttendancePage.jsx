// app/renderer/src/pages/attendance/AttendancePage.jsx
import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Clock, PlusCircle, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { PageHeader } from "@/components/layout";
import { ConfirmDialog } from "@/components/feedback";
import { Pagination } from "@/components/ui";
import { useAttendance } from "./hooks/useAttendance";

import AttendanceTable from "./components/AttendanceTable";
import AttendanceFormModal from "./components/AttendanceFormModal";
import AttendanceFilters from "./components/AttendanceFilters";

export default function AttendancePage() {
    const navigate = useNavigate();
    const {
        records,
        employees,
        isLoading,
        addRecord,
        deleteRecord,
        fetchRecords
    } = useAttendance();

    // -- State --
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedStatus, setSelectedStatus] = useState("all");
    const [dateRange, setDateRange] = useState({ startDate: null, endDate: null });

    const [currentPage, setCurrentPage] = useState(1);
    const [sortConfig, setSortConfig] = useState({ key: "date", direction: "desc" });
    const ITEMS_PER_PAGE = 10;

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [recordToDelete, setRecordToDelete] = useState(null);

    // Re-fetch records when date range changes (Server-side filtering potential)
    useEffect(() => {
        if (dateRange.startDate && dateRange.endDate) {
            fetchRecords({
                startDate: dateRange.startDate,
                endDate: dateRange.endDate
            });
        } else {
            fetchRecords();
        }
    }, [dateRange, fetchRecords]);

    // Reset page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, selectedStatus, dateRange]);

    // -- Memoized Filtering (Client-side for search and status) --
    const filteredRecords = useMemo(() => {
        const filtered = records.filter(rec => {
            // 🔍 Search Filter (Employee Name)
            const fullName = rec.employee ? `${rec.employee.first_name} ${rec.employee.last_name} ${rec.employee.second_last_name || ""}`.toLowerCase() : "";
            const matchesSearch = fullName.includes(searchTerm.toLowerCase());

            // 🏷️ Status Filter
            const matchesStatus = selectedStatus === "all" || rec.status === selectedStatus;

            return matchesSearch && matchesStatus;
        });

        // 📋 Sorting Logic
        if (!sortConfig.key) return filtered;

        return [...filtered].sort((a, b) => {
            let aValue = a[sortConfig.key];
            let bValue = b[sortConfig.key];

            // Specific sorting for nested employee name
            if (sortConfig.key === "employee") {
                aValue = a.employee ? `${a.employee.first_name} ${a.employee.last_name}` : "";
                bValue = b.employee ? `${b.employee.first_name} ${b.employee.last_name}` : "";
            }

            if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
            if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
            return 0;
        });
    }, [records, searchTerm, selectedStatus, sortConfig]);

    // -- Pagination Logic --
    const totalPages = Math.ceil(filteredRecords.length / ITEMS_PER_PAGE);
    const paginatedRecords = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredRecords.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredRecords, currentPage]);

    // -- Handlers --
    const handleSave = async (data) => {
        const success = await addRecord(data);
        if (success) setIsModalOpen(false);
    };

    const handleDeleteConfirm = async () => {
        if (recordToDelete) {
            await deleteRecord(recordToDelete.id);
            setRecordToDelete(null);
        }
    };

    const handleSort = (key) => {
        let direction = "asc";
        if (sortConfig.key === key && sortConfig.direction === "asc") {
            direction = "desc";
        }
        setSortConfig({ key, direction });
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
                    selectedStatus={selectedStatus}
                    setSelectedStatus={setSelectedStatus}
                    dateRange={dateRange}
                    setDateRange={setDateRange}
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
                    <span>Registrar Asistencia</span>
                </motion.button>
            </div>

            {/* Table Section */}
            <div className="bg-white dark:bg-secondary rounded-3xl shadow-soft dark:shadow-none border border-slate-100 dark:border-slate-800 overflow-hidden transform transition-all relative">
                {isLoading && (
                    <div className="absolute inset-0 z-10 bg-white/50 dark:bg-dark/50 backdrop-blur-[1px] flex items-center justify-center">
                        <Loader2 className="w-8 h-8 text-primary animate-spin" />
                    </div>
                )}
                <div className="p-1 px-4 py-3 bg-slate-50 dark:bg-dark/40 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest pl-2">
                        Historial de Movimientos (BD)
                    </h3>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                            {filteredRecords.length} Registros
                        </span>
                    </div>
                </div>
                <div className="overflow-x-auto min-h-[400px]">
                    <AttendanceTable
                        records={paginatedRecords}
                        onDelete={setRecordToDelete}
                        sortConfig={sortConfig}
                        onSort={handleSort}
                    />
                </div>
            </div>

            {/* Pagination Controls */}
            <div className="flex justify-end pr-2">
                <Pagination
                    page={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                />
            </div>

            {/* Modals */}
            <AnimatePresence>
                {isModalOpen && (
                    <AttendanceFormModal
                        open={isModalOpen}
                        onClose={() => setIsModalOpen(false)}
                        onSave={handleSave}
                        employees={employees}
                    />
                )}
            </AnimatePresence>

            <ConfirmDialog
                open={!!recordToDelete}
                title="Eliminar Registro"
                message={`¿Estás seguro de que deseas eliminar el registro de ${recordToDelete?.employee ? `${recordToDelete.employee.first_name} ${recordToDelete.employee.last_name}` : ""}? Esta acción no se puede deshacer.`}
                onConfirm={handleDeleteConfirm}
                onCancel={() => setRecordToDelete(null)}
                confirmLabel="Eliminar"
                cancelLabel="Cancelar"
                confirmVariant="error"
            />
        </div>
    );
}
