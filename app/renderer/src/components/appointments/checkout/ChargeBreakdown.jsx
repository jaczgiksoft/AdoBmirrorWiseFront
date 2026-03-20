import { AlertTriangle, ShieldAlert, Tag, Package } from "lucide-react";

/**
 * ChargeBreakdown — Pure presentational component.
 *
 * Shows:
 *   - Base amount (from patient budget / monthly payment)
 *   - Included services (informational, zero cost impact)
 *   - Extra charges (added during visit, affect total)
 *   - Patient existing balance (accumulated debt)
 *   - Grand total due
 *
 * Props:
 *   baseAmount       {number}   — monthly budget payment amount
 *   includedServices {Array}    — services from appointment (informational)
 *   extras           {Array}    — { id, name, amount, type, addedToDebt }
 *   patientBalance   {number}   — existing unpaid debt
 *   patientCredit    {number}   — available credit
 *   unpaidCount      {number}   — number of unpaid past appointments
 *   compact          {boolean}  — render in compact mode (for Payments tab view)
 */
export default function ChargeBreakdown({
    baseAmount = 0,
    includedServices = [],
    extras = [],
    patientBalance = 0,
    patientCredit = 0,
    unpaidCount = 0,
    compact = false,
}) {
    const extrasTotal = extras
        .filter((e) => !e.addedToDebt)
        .reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);

    const extrasToDebt = extras
        .filter((e) => e.addedToDebt)
        .reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);

    const grandTotal = baseAmount + extrasTotal + patientBalance;

    const fmt = (n) =>
        new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n);

    return (
        <div className="flex flex-col gap-3 text-sm">
            {/* ─── Overdue Warning ─── */}
            {unpaidCount >= 2 && (
                <div className="flex items-start gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 text-red-700 dark:text-red-400">
                    <ShieldAlert size={18} className="shrink-0 mt-0.5" />
                    <div>
                        <p className="font-bold text-xs uppercase tracking-wide mb-0.5">
                            Paciente con {unpaidCount} citas sin pagar
                        </p>
                        <p className="text-xs leading-snug">
                            Se recomienda regularizar el saldo antes de continuar.
                        </p>
                    </div>
                </div>
            )}

            {/* ─── Base Amount ─── */}
            <div className={`rounded-xl border ${compact ? "border-slate-200 dark:border-slate-700" : "border-slate-200 dark:border-slate-700"} overflow-hidden`}>
                <div className="bg-slate-50 dark:bg-slate-800/50 px-4 py-2 border-b border-slate-200 dark:border-slate-700">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        Pago del Presupuesto
                    </span>
                </div>
                <div className="px-4 py-3 bg-white dark:bg-slate-800 flex justify-between items-center">
                    <span className="text-slate-700 dark:text-slate-300 font-medium">
                        Mensualidad / Pago acordado
                    </span>
                    <span className="font-bold text-slate-800 dark:text-white">
                        {fmt(baseAmount)}
                    </span>
                </div>

                {/* Included services (informational) */}
                {includedServices.length > 0 && (
                    <div className="px-4 pb-3 bg-white dark:bg-slate-800 space-y-1 border-t border-slate-100 dark:border-slate-700/50">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pt-2 mb-1 flex items-center gap-1">
                            <Package size={11} /> Servicios incluidos (sin costo adicional)
                        </p>
                        {includedServices.map((svc, i) => (
                            <div
                                key={i}
                                className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400"
                            >
                                <span className="flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                                    {svc.name}
                                </span>
                                <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                                    Incluido
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ─── Extras ─── */}
            {extras.length > 0 && (
                <div className="rounded-xl border border-amber-200 dark:border-amber-800/50 overflow-hidden">
                    <div className="bg-amber-50 dark:bg-amber-900/20 px-4 py-2 border-b border-amber-200 dark:border-amber-800/50">
                        <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                            <Tag size={12} /> Cargos Extras
                        </span>
                    </div>
                    <div className="bg-white dark:bg-slate-800 divide-y divide-slate-100 dark:divide-slate-700">
                        {extras.map((extra) => (
                            <div
                                key={extra.id}
                                className="px-4 py-2.5 flex items-center justify-between"
                            >
                                <span className="text-slate-700 dark:text-slate-300">{extra.name}</span>
                                <div className="flex items-center gap-3">
                                    {extra.addedToDebt ? (
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-400 border border-slate-200 dark:border-slate-600">
                                            A deuda
                                        </span>
                                    ) : (
                                        <span className="font-semibold text-amber-700 dark:text-amber-300">
                                            {fmt(extra.amount)}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                        {extrasToDebt > 0 && (
                            <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800/50 flex justify-between text-xs text-slate-400">
                                <span>Extras agregados a deuda</span>
                                <span>{fmt(extrasToDebt)}</span>
                            </div>
                        )}
                        <div className="px-4 py-2.5 flex justify-between bg-amber-50 dark:bg-amber-900/10 font-semibold">
                            <span className="text-amber-700 dark:text-amber-400">Subtotal extras cobrar</span>
                            <span className="text-amber-700 dark:text-amber-400">{fmt(extrasTotal)}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* ─── Existing Balance ─── */}
            {patientBalance > 0 && (
                <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/40">
                    <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
                        <AlertTriangle size={16} />
                        <span className="font-medium">Saldo pendiente acumulado</span>
                    </div>
                    <span className="font-bold text-red-700 dark:text-red-400">{fmt(patientBalance)}</span>
                </div>
            )}

            {/* ─── Credit ─── */}
            {patientCredit > 0 && (
                <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800/40">
                    <span className="font-medium text-emerald-700 dark:text-emerald-400">
                        Crédito disponible
                    </span>
                    <span className="font-bold text-emerald-700 dark:text-emerald-400">
                        − {fmt(patientCredit)}
                    </span>
                </div>
            )}

            {/* ─── Grand Total ─── */}
            <div className={`flex items-center justify-between px-4 py-4 rounded-xl font-bold ${compact ? "bg-slate-100 dark:bg-slate-800" : "bg-slate-900 dark:bg-white"}`}>
                <span className={compact ? "text-slate-700 dark:text-slate-200 text-base" : "text-white dark:text-slate-900 text-base"}>
                    Total a Cobrar
                </span>
                <span className={compact ? "text-slate-900 dark:text-white text-xl" : "text-white dark:text-slate-900 text-2xl"}>
                    {fmt(grandTotal)}
                </span>
            </div>
        </div>
    );
}
