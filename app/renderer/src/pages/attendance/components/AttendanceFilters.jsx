// app/renderer/src/pages/attendance/components/AttendanceFilters.jsx
import React from "react";
import { Search, Filter, Calendar } from "lucide-react";
import Datepicker from "react-tailwindcss-datepicker";

export default function AttendanceFilters({
    searchTerm,
    setSearchTerm,
    selectedType,
    setSelectedType,
    selectedLateness,
    setSelectedLateness,
    dateRange,
    setDateRange,
    attendanceTypes,
    latenessOptions
}) {
    return (
        <div className="flex flex-col lg:flex-row items-center gap-4 bg-white dark:bg-secondary p-5 rounded-2xl shadow-soft border border-slate-100 dark:border-slate-800 transition-all duration-300">
            {/* 🔍 Search Input */}
            <div className="relative flex items-center w-full lg:w-72">
                <Search size={18} className="absolute left-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                <input
                    type="text"
                    placeholder="Buscar empleado..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="
                        w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-dark border border-slate-100 dark:border-slate-700 
                        rounded-xl outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50 
                        text-sm text-slate-700 dark:text-white placeholder:text-slate-400 transition-all
                    "
                />
            </div>

            {/* 🏷️ Type Select */}
            <div className="grid grid-cols-2 sm:flex items-center gap-2 w-full lg:w-auto">
                <div className="hidden sm:flex p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500">
                    <Filter size={18} />
                </div>
                <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    className="
                        flex-1 sm:w-44 px-4 py-3 bg-slate-50 dark:bg-dark border border-slate-100 dark:border-slate-700 
                        rounded-xl outline-none focus:ring-2 focus:ring-primary/40 text-sm font-medium 
                        text-slate-700 dark:text-white cursor-pointer transition-all
                    "
                >
                    <option value="all">Todos los movimientos</option>
                    {attendanceTypes.map(t => (
                        <option key={t} value={t}>{t}</option>
                    ))}
                </select>

                <select
                    value={selectedLateness}
                    onChange={(e) => setSelectedLateness(e.target.value)}
                    className="
                        flex-1 sm:w-40 px-4 py-3 bg-slate-50 dark:bg-dark border border-slate-100 dark:border-slate-700 
                        rounded-xl outline-none focus:ring-2 focus:ring-primary/40 text-sm font-medium 
                        text-slate-700 dark:text-white cursor-pointer transition-all
                    "
                >
                    {latenessOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>
            </div>

            {/* 📅 Date Picker */}
            <div className="w-full lg:w-72 group relative">
                <Datepicker
                    value={dateRange}
                    onChange={setDateRange}
                    showShortcuts={true}
                    useRange={true}
                    displayFormat={"DD/MM/YYYY"}
                    i18n={"es"}
                    inputClassName="
                        w-full pl-4 pr-10 py-3 bg-slate-100 dark:bg-dark border border-slate-100 dark:border-slate-700 
                        rounded-xl text-sm font-medium text-slate-700 dark:text-white outline-none 
                        focus:ring-2 focus:ring-primary/40 transition-all cursor-pointer group-hover:bg-slate-50
                    "
                    placeholder="Rango de fechas..."
                />
            </div>
        </div>
    );
}
