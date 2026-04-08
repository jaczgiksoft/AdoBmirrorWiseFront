import React from "react";
import { CheckCircle2, Clock, AlertCircle, TrendingUp, BadgeCheck, FileX, Receipt, Calculator } from "lucide-react";
import { formatCurrency } from "../utils/formatCurrency";

/**
 * PaymentKPICards — Pure presentational component.
 * Receives pre-computed KPI data from the hook. No calculations inside.
 *
 * @param {{ totalIngresos: number, paid: number, partial: number, pending: number, total_invoiced: number, total_not_invoiced: number, invoices_count: number, non_invoiced_count: number }} kpis
 */
export default function PaymentKPICards({ kpis }) {
    const generalCards = [
        {
            label: "Total Ingresos",
            value: formatCurrency(kpis.totalIngresos),
            icon: TrendingUp,
            color: "text-emerald-500",
            bg: "bg-emerald-500/10",
            border: "border-emerald-500/20",
        },
        {
            label: "Pagos Completados",
            value: kpis.paid,
            icon: CheckCircle2,
            color: "text-sky-500",
            bg: "bg-sky-500/10",
            border: "border-sky-500/20",
        },
        {
            label: "Pagos Parciales",
            value: kpis.partial,
            icon: AlertCircle,
            color: "text-amber-500",
            bg: "bg-amber-500/10",
            border: "border-amber-500/20",
        },
        {
            label: "Pendientes",
            value: kpis.pending,
            icon: Clock,
            color: "text-rose-500",
            bg: "bg-rose-500/10",
            border: "border-rose-500/20",
        },
    ];

    const billingCards = [
        {
            label: "Total Esperado",
            value: formatCurrency(kpis.total_expected),
            icon: Calculator,
            color: "text-indigo-500",
            bg: "bg-indigo-500/10",
            border: "border-indigo-500/20",
        },
        {
            label: "Total Recaudado",
            value: formatCurrency(kpis.total_collected),
            icon: BadgeCheck,
            color: "text-emerald-500",
            bg: "bg-emerald-500/10",
            border: "border-emerald-500/20",
        },
        {
            label: "Cuentas por Cobrar",
            value: formatCurrency(kpis.accounts_receivable),
            icon: Clock,
            color: "text-amber-500",
            bg: "bg-amber-500/10",
            border: "border-amber-500/20",
        },
        {
            label: "Monto Facturado",
            value: formatCurrency(kpis.total_invoiced),
            icon: Receipt,
            color: "text-slate-500",
            bg: "bg-slate-500/10",
            border: "border-slate-500/20",
        },
    ];

    const renderCard = (card) => {
        const Icon = card.icon;
        return (
            <div
                key={card.label}
                className={`flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-secondary border ${card.border} shadow-sm`}
            >
                <div className={`w-8 h-8 flex items-center justify-center rounded-lg ${card.bg}`}>
                    <Icon size={16} className={card.color} />
                </div>
                <div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">{card.label}</p>
                    <p className={`text-base font-bold leading-tight mt-0.5 ${card.color}`}>{card.value}</p>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-2 mb-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
                {generalCards.map(renderCard)}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
                {billingCards.map(renderCard)}
            </div>
        </div>
    );
}
