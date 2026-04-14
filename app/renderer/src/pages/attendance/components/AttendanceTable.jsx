// app/renderer/src/pages/attendance/components/AttendanceTable.jsx
import React from "react";
import { Clock, User, Trash2, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Table } from "@/components/ui";

export default function AttendanceTable({ records, onDelete, sortConfig, onSort }) {
    const columns = [
        {
            header: "Empleado",
            accessor: "employee",
            sortable: true,
            render: (row) => (
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-primary overflow-hidden">
                        {row.employee?.profile_image ? (
                            <img src={row.employee.profile_image} alt="" className="w-full h-full object-cover" />
                        ) : (
                            <User size={16} />
                        )}
                    </div>
                    <div>
                        <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm">
                            {row.employee ? `${row.employee.first_name} ${row.employee.last_name}` : "---"}
                        </p>
                    </div>
                </div>
            )
        },
        {
            header: "Fecha",
            accessor: "date",
            sortable: true,
            render: (row) => (
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    {new Date(row.date + "T00:00:00").toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" })}
                </span>
            )
        },
        {
            header: "Entrada / Salida",
            accessor: "check_in",
            render: (row) => (
                <div className="flex flex-col">
                    {row.check_in && (
                        <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                            Entrada: {row.check_in}
                        </span>
                    )}
                    {row.check_out && (
                        <span className="text-xs text-rose-600 dark:text-rose-400 font-medium">
                            Salida: {row.check_out}
                        </span>
                    )}
                    {!row.check_in && !row.check_out && <span className="text-xs text-slate-400">---</span>}
                </div>
            )
        },
        {
            header: "Estado",
            accessor: "status",
            sortable: true,
            render: (row) => {
                const statusMap = {
                    present: { label: "Puntual", color: "text-emerald-500", icon: CheckCircle2 },
                    late: { label: "Retardo", color: "text-amber-500", icon: AlertTriangle },
                    absent: { label: "Falta", color: "text-rose-500", icon: AlertTriangle }
                };
                const config = statusMap[row.status] || { label: row.status, color: "text-slate-500", icon: AlertTriangle };
                const Icon = config.icon;

                return (
                    <div className={`flex items-center gap-1.5 ${config.color}`}>
                        <Icon size={14} />
                        <span className="text-xs font-semibold">{config.label}</span>
                    </div>
                );
            }
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
        <Table 
            columns={columns} 
            data={records} 
            sortConfig={sortConfig}
            onSort={onSort}
            emptyMessage="No hay registros de asistencias." 
        />
    );
}
