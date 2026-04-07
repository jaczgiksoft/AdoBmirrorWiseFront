import React from 'react';
import { NotebookPen, Edit2, Trash2, Calendar } from 'lucide-react';


export default function ConversationEntry({ conversation, onEdit, onDelete }) {
    const employee = conversation.user?.employee;

    const employeeName = employee
        ? `${employee.first_name} ${employee.last_name}`
        : conversation.user?.username || "Desconocido";

    const employeeImage = employee?.profile_image;

    // Format date: "14 dic 2024, 10:30 PM"
    const dateFormatted = new Date(conversation.createdAt || new Date()).toLocaleString('es-MX', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
    });

    return (
        <div className="group relative flex gap-4 p-4 border-b border-slate-100 dark:border-slate-700/50 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
            {/* Avatar / Icon */}
            <div className="flex-shrink-0 mt-1">
                {employeeImage ? (
                    <img
                        src={employeeImage}
                        alt={employeeName}
                        className="w-10 h-10 rounded-full object-cover ring-2 ring-slate-100 dark:ring-slate-700"
                    />
                ) : (
                    <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 ring-2 ring-slate-100 dark:ring-slate-700">
                        <NotebookPen size={20} />
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 space-y-1">
                {/* Header: Name & Date */}
                <div className="flex items-center justify-between">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2">
                        <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                            {employeeName}
                        </span>
                        <div className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
                            <Calendar size={12} />
                            <span>{dateFormatted}</span>
                        </div>
                    </div>
                </div>

                {/* Title (Optional, if title is distinct from content) */}
                {conversation.title && (
                    <div className="text-xs font-medium text-primary mt-1 mb-0.5">
                        {conversation.title}
                    </div>
                )}

                {/* Body Text */}
                <div className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                    {conversation.content}
                </div>
            </div>

            {/* Actions (Hover Only) */}
            <div className="absolute top-4 right-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white dark:bg-secondary shadow-sm border border-slate-200 dark:border-slate-700 rounded-lg p-0.5">
                <button
                    onClick={() => onEdit(conversation)}
                    className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-all"
                    title="Editar"
                >
                    <Edit2 size={14} />
                </button>
                <div className="w-px h-4 bg-slate-200 dark:bg-slate-700" />
                <button
                    onClick={() => onDelete(conversation.id)}
                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-all"
                    title="Eliminar"
                >
                    <Trash2 size={14} />
                </button>
            </div>
        </div>
    );
}


