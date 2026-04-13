// app/renderer/src/pages/attendance/components/AttendanceFormModal.jsx
import React, { useState } from "react";
import { X, Clock, User, CheckCircle2, AlertTriangle, Calendar } from "lucide-react";
import AutocompleteInput from "@/components/inputs/AutocompleteInput";

export default function AttendanceFormModal({ open, onClose, onSave, employees }) {
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [checkIn, setCheckIn] = useState(new Date().toLocaleTimeString('en-GB', { hour12: false }));
    const [status, setStatus] = useState("present");
    const [notes, setNotes] = useState("");

    if (!open) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!selectedEmployee) return;

        onSave({
            employee_id: selectedEmployee.id,
            date,
            check_in: checkIn,
            status,
            notes
        });
        reset();
    };

    const reset = () => {
        setSelectedEmployee(null);
        setDate(new Date().toISOString().split('T')[0]);
        setCheckIn(new Date().toLocaleTimeString('en-GB', { hour12: false }));
        setStatus("present");
        setNotes("");
    };

    const employeeOptions = employees.map(emp => ({
        ...emp,
        label: `${emp.first_name} ${emp.last_name} ${emp.second_last_name || ""}`.trim(),
        description: emp.position
    }));

    const statusOptions = [
        { value: "present", label: "Presente", icon: CheckCircle2, color: "bg-emerald-500" },
        { value: "late", label: "Retardo", icon: AlertTriangle, color: "bg-amber-500" },
        { value: "absent", label: "Falta", icon: AlertTriangle, color: "bg-rose-500" }
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-dark border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg text-primary">
                            <Clock size={20} />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                            Registrar Asistencia
                        </h3>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition p-1 cursor-pointer">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {/* Employee Searchable Select */}
                    <div className="space-y-1.5">
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                            Empleado <span className="text-red-500">*</span>
                        </label>
                        <AutocompleteInput
                            options={employeeOptions}
                            value={selectedEmployee ? selectedEmployee.label : ""}
                            onSelect={(val) => setSelectedEmployee(val)}
                            onChange={(val) => {
                                if (!val) setSelectedEmployee(null);
                            }}
                            placeholder="Buscar empleado..."
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Date */}
                        <div className="space-y-1.5">
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                <Calendar size={14} /> Fecha
                            </label>
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                            />
                        </div>
                        {/* Time */}
                        <div className="space-y-1.5">
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                <Clock size={14} /> Hora
                            </label>
                            <input
                                type="time"
                                step="1"
                                value={checkIn}
                                onChange={(e) => setCheckIn(e.target.value)}
                                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                            />
                        </div>
                    </div>

                    {/* Status Select */}
                    <div className="space-y-1.5">
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                            Estado <span className="text-red-500">*</span>
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                            {statusOptions.map(opt => {
                                const Icon = opt.icon;
                                const isActive = status === opt.value;
                                return (
                                    <button
                                        key={opt.value}
                                        type="button"
                                        onClick={() => setStatus(opt.value)}
                                        className={`
                                            flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl border transition-all
                                            ${isActive
                                                ? `${opt.color} border-transparent text-white shadow-lg`
                                                : "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-500 hover:border-primary/50 cursor-pointer"}
                                        `}
                                    >
                                        <Icon size={18} />
                                        <span className="text-[10px] font-bold uppercase">{opt.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="space-y-1.5">
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                            Notas / Observaciones
                        </label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Ej. Tráfico, cita médica, etc."
                            rows={2}
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-primary/50 text-sm text-slate-700 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 transition-all resize-none"
                        />
                    </div>

                    {/* Submit Button */}
                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={!selectedEmployee}
                            className="w-full py-3.5 rounded-xl font-bold bg-primary hover:bg-sky-500 text-white transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:shadow-none cursor-pointer"
                        >
                            Confirmar Registro
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
