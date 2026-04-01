// app/renderer/src/pages/attendance/components/AttendanceTable.jsx
import React from "react";
import { Clock, User, Trash2, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Table } from "@/components/ui";

export default function AttendanceTable({ records, onDelete }) {
    const columns = [
        {
            header: "Empleado",
            accessor: "employeeName",
            sortable: true,
            render: (row) => (
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-primary">
                        <User size={16} />
                    </div>
                    <div>
                        <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm">{row.employeeName}</p>
                    </div>
                </div>
            )
        },
        {
            header: "Tipo",
            accessor: "type",
            sortable: true,
            render: (row) => {
                const colors = {
                    "Entrada": "text-green-500 bg-green-500/10",
                    "Salida": "text-red-500 bg-red-500/10",
                    "Salida de comida": "text-orange-500 bg-orange-500/10",
                    "Entrada de comida": "text-cyan-500 bg-cyan-500/10"
                };
                return (
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${colors[row.type] || "text-slate-500 bg-slate-500/10"}`}>
                        {row.type}
                    </span>
                );
            }
        },
        {
            header: "Fecha y Hora",
            accessor: "dateTime",
            sortable: true,
            render: (row) => {
                const date = new Date(row.dateTime);
                return (
                    <div className="flex flex-col">
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                            {date.toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" })}
                        </span>
                        <span className="text-xs text-slate-400">
                            {date.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                        </span>
                    </div>
                );
            }
        },
        {
            header: "Estado",
            accessor: "isLate",
            sortable: true,
            render: (row) => (
                row.isLate ? (
                    <div className="flex items-center gap-1.5 text-amber-500">
                        <AlertTriangle size={14} />
                        <span className="text-xs font-semibold">Con Retardo</span>
                    </div>
                ) : (
                    <div className="flex items-center gap-1.5 text-emerald-500">
                        <CheckCircle2 size={14} />
                        <span className="text-xs font-semibold">Puntual</span>
                    </div>
                )
            )
        },
        {
            header: "Notas",
            accessor: "notes",
            render: (row) => (
                <span className="text-xs text-slate-500 dark:text-slate-400 italic max-w-[200px] truncate block" title={row.notes}>
                    {row.notes || "---"}
                </span>
            )
        },
        {
            header: "Acciones",
            accessor: "id",
            render: (row) => (
                <button
                    onClick={() => onDelete(row)}
                    className="p-1.5 text-slate-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer"
                >
                    <Trash2 size={16} />
                </button>
            )
        }
    ];

    return (
        <Table columns={columns} data={records} emptyMessage="No hay registros de asistencias." />
    );
}
