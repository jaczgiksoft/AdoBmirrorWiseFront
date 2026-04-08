import { motion } from "framer-motion";
import { ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";

/**
 * Reusable generic Table component
 * 
 * @param {Array} columns - Array of objects: { header: string, accessor: string, render: function(row), sortable: boolean }
 * @param {Array} data - Array of row objects to display
 * @param {boolean} loading - Displays a loading state if true
 * @param {string} emptyMessage - Message to show when data is empty
 * @param {object} sortConfig - { key: string, direction: 'asc' | 'desc' }
 * @param {function} onSort - Function(key) to handle sorting
 */
export default function Table({
    columns,
    data,
    loading = false,
    emptyMessage = "No hay datos disponibles.",
    sortConfig = null,
    onSort = null,
    onRowClick = null,
}) {
    if (loading) {
        return (
            <div className="flex justify-center items-center py-10 text-slate-400 text-sm">
                Cargando datos...
            </div>
        );
    }

    if (!data || data.length === 0) {
        return (
            <div className="text-center py-10 text-slate-500 text-sm border border-dashed border-slate-300 dark:border-slate-700 rounded-xl">
                {emptyMessage}
            </div>
        );
    }

    return (
        <div className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-secondary">
            <table className="w-full text-left border-collapse text-sm">
                <thead className="sticky top-0 z-20 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                    <tr className="border-b border-slate-200 dark:border-slate-700 text-primary">
                        {columns.map((col, index) => {
                            const isSortable = col.sortable && onSort;
                            const isSorted = sortConfig?.key === col.accessor;
                            const direction = sortConfig?.direction;

                            return (
                                <th
                                    key={index}
                                    className={`px-3 py-2 text-sm font-semibold whitespace-nowrap bg-slate-50 dark:bg-slate-800
${isSortable ? "cursor-pointer select-none hover:bg-slate-200/50 dark:hover:bg-slate-700/30 transition-colors" : ""}`}
                                    onClick={() => isSortable && onSort(col.accessor)}
                                >
                                    <div className="flex items-center gap-2">
                                        {col.header}
                                        {isSortable && (
                                            <span className="text-slate-500">
                                                {isSorted ? (
                                                    direction === "asc" ? <ArrowUp size={14} className="text-primary" /> : <ArrowDown size={14} className="text-primary" />
                                                ) : (
                                                    <ArrowUpDown size={14} className="opacity-30 group-hover:opacity-100" />
                                                )}
                                            </span>
                                        )}
                                    </div>
                                </th>
                            );
                        })}
                    </tr>
                </thead>
                <tbody>
                    {data.map((row, rowIndex) => (
                        <motion.tr
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.2, delay: rowIndex * 0.03 }}
                            key={row.id || rowIndex}
                            onClick={onRowClick ? () => onRowClick(row) : undefined}
                            className={`border-b border-slate-100 dark:border-slate-700/50 transition-colors group
                                ${onRowClick
                                    ? "cursor-pointer hover:bg-primary/5 dark:hover:bg-primary/10"
                                    : "hover:bg-slate-50 dark:hover:bg-slate-800/30"
                                }`}
                        >
                            {columns.map((col, colIndex) => (
                                <td
                                    key={colIndex}
                                    className="px-3 py-2 whitespace-nowrap text-slate-700 dark:text-slate-200 text-sm"
                                    onClick={onRowClick ? (e) => { if (e.target !== e.currentTarget && (e.target.closest('button') || e.target.closest('a'))) e.stopPropagation(); } : undefined}
                                >
                                    {col.render ? col.render(row) : row[col.accessor]}
                                </td>
                            ))}
                        </motion.tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
