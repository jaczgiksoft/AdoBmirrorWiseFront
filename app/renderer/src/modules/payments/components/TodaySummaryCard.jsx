import React from "react";
import { Calendar, DollarSign, Receipt, Users } from "lucide-react";
import { formatCurrency } from "../utils/formatCurrency";

export default function TodaySummaryCard({ stats }) {
    const today = new Date().toLocaleDateString("es-MX", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric"
    });

    return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 mb-3 shadow-sm dark:shadow-md flex items-center justify-between gap-4 relative overflow-hidden">
            {/* Background Accent Gradient */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-500/5 dark:bg-cyan-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl -ml-10 -mb-10 pointer-events-none"></div>

            {/* Title Section (Horizontal now) */}
            <div className="flex items-center gap-3 z-10">
                <div className="flex items-center gap-1.5 p-1 bg-cyan-500/10 dark:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 rounded">
                    <Calendar size={14} />
                    <span className="font-bold uppercase tracking-widest text-[10px]">HOY</span>
                </div>
                <h2 className="text-slate-900 dark:text-white font-medium text-sm capitalize">{today}</h2>
            </div>

            {/* Stats Group */}
            <div className="flex items-center gap-4 z-10 backdrop-blur-sm px-4 py-2 rounded-lg text-sm bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/50">

                {/* Total Income */}
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                        <DollarSign size={14} />
                        <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">Ingresos:</span>
                    </div>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(stats.total)}
                    </span>
                </div>

                {/* Divider */}
                <div className="w-px h-4 bg-slate-300 dark:bg-slate-700 hidden md:block"></div>

                {/* Payments Count */}
                <div className="flex items-center gap-2 hidden md:flex">
                    <div className="flex items-center gap-1 text-sky-400">
                        <Receipt size={14} />
                        <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">Pagos:</span>
                    </div>
                    <span className="font-bold text-sky-400">
                        {stats.count}
                    </span>
                </div>

                {/* Divider */}
                <div className="w-px h-4 bg-slate-300 dark:bg-slate-700 hidden lg:block"></div>

                {/* Patients Count */}
                <div className="flex items-center gap-2 hidden lg:flex">
                    <div className="flex items-center gap-1 text-purple-400">
                        <Users size={14} />
                        <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">Pacientes:</span>
                    </div>
                    <span className="font-bold text-purple-400">
                        {stats.patients}
                    </span>
                </div>

            </div>
        </div>
    );
}
