// app/renderer/src/pages/attendance/components/AttendanceFormModal.jsx
import React, { useState } from "react";
import { X, Clock, User, CheckCircle2, AlertTriangle } from "lucide-react";
import AutocompleteInput from "@/components/inputs/AutocompleteInput";

export default function AttendanceFormModal({ open, onClose, onSave, employees, attendanceTypes }) {
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [type, setType] = useState(attendanceTypes[0]);
    const [isLate, setIsLate] = useState(false);
    const [notes, setNotes] = useState("");

    if (!open) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!selectedEmployee) return;

        onSave({
            employeeId: selectedEmployee.id,
            employeeName: `${selectedEmployee.first_name} ${selectedEmployee.last_name} ${selectedEmployee.second_last_name || ""}`.trim(),
            type,
            isLate,
            notes
        });
        reset();
    };

    const reset = () => {
        setSelectedEmployee(null);
        setType(attendanceTypes[0]);
        setIsLate(false);
        setNotes("");
    };

    const employeeOptions = employees.map(emp => ({
        ...emp,
        label: `${emp.first_name} ${emp.last_name} ${emp.second_last_name || ""}`.trim(),
        description: emp.position
    }));

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

                    {/* Type Select */}
                    <div className="space-y-1.5">
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                            Movimiento <span className="text-red-500">*</span>
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            {attendanceTypes.map(t => (
                                <button
                                    key={t}
                                    type="button"
                                    onClick={() => {
                                        setType(t);
                                        if (t !== "Entrada" && t !== "Entrada de comida") setIsLate(false);
                                    }}
                                    className={`
                                        px-3 py-2.5 text-xs font-bold rounded-xl border transition-all text-center
                                        ${type === t
                                            ? "bg-primary border-primary text-white shadow-lg shadow-primary/20"
                                            : "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-500 hover:border-primary/50 cursor-pointer"}
                                    `}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Lateness Toggle (Entrada & Entrada de comida) */}
                    {(type === "Entrada" || type === "Entrada de comida") && (
                        <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700 animate-in fade-in slide-in-from-top-2 duration-300">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${isLate ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                                    {isLate ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-slate-800 dark:text-slate-100">¿Es retardo?</p>
                                    <p className="text-[10px] text-slate-500">{isLate ? "Se marcará con retardo" : "Se marcará como puntual"}</p>
                                </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={isLate}
                                    onChange={(e) => setIsLate(e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none dark:bg-slate-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                            </label>
                        </div>
                    )}

                    {/* Notes */}
                    <div className="space-y-1.5">
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                            Notas / Observaciones
                        </label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Ej. Tráfico, cita médica, etc."
                            rows={3}
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
