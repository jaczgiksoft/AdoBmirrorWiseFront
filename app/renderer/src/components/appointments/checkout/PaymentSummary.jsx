import { CheckCircle, AlertCircle, Gift, Clock } from "lucide-react";

/**
 * PaymentSummary — Live preview of payment outcome.
 *
 * Props:
 *   totalDue         {number}
 *   amountReceived   {number}
 *   paymentMethod    {string}
 *   applyAsCredit    {boolean}   — checkbox: apply change as patient credit
 *   setApplyAsCredit {fn}
 *   paymentStatus    {string}    — 'pending'|'paid'|'partial'|'credited'
 *   disabled         {boolean}
 */
export default function PaymentSummary({
    totalDue = 0,
    amountReceived = 0,
    paymentMethod = "efectivo",
    applyAsCredit = false,
    setApplyAsCredit,
    paymentStatus = "pending",
    disabled = false,
}) {
    const received = parseFloat(amountReceived) || 0;
    const difference = received - totalDue;
    const change = difference > 0 ? difference : 0;
    const remaining = difference < 0 ? Math.abs(difference) : 0;

    const fmt = (n) =>
        new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n);

    // Determine outcome
    const isNoPay = received === 0;
    const isFull = received >= totalDue && totalDue > 0;
    const isPartial = received > 0 && received < totalDue;
    const isOverpay = difference > 0;

    // Status config
    const statusConfig = {
        pending: {
            color: "text-slate-400",
            bg: "bg-slate-50 dark:bg-slate-800/40",
            border: "border-slate-200 dark:border-slate-700",
            icon: Clock,
            label: "Ingresa un monto para ver el resumen",
        },
        paid: {
            color: "text-emerald-600 dark:text-emerald-400",
            bg: "bg-emerald-50 dark:bg-emerald-900/20",
            border: "border-emerald-200 dark:border-emerald-800",
            icon: CheckCircle,
            label: "Pagado en su totalidad",
        },
        partial: {
            color: "text-amber-600 dark:text-amber-400",
            bg: "bg-amber-50 dark:bg-amber-900/20",
            border: "border-amber-200 dark:border-amber-800",
            icon: AlertCircle,
            label: "Pago parcial — queda saldo pendiente",
        },
        credited: {
            color: "text-sky-600 dark:text-sky-400",
            bg: "bg-sky-50 dark:bg-sky-900/20",
            border: "border-sky-200 dark:border-sky-800",
            icon: Gift,
            label: "Cambio aplicado como crédito",
        },
    };

    const currentStatus = statusConfig[paymentStatus] || statusConfig.pending;
    const StatusIcon = currentStatus.icon;

    return (
        <div className="flex flex-col gap-4">
            {/* ─── Status Card ─── */}
            <div className={`rounded-2xl border p-4 ${currentStatus.bg} ${currentStatus.border} transition-all duration-300`}>
                <div className={`flex items-center gap-2 mb-1 ${currentStatus.color}`}>
                    <StatusIcon size={18} />
                    <span className="font-bold text-sm">{currentStatus.label}</span>
                </div>
            </div>

            {/* ─── Breakdown Grid ─── */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                <Row label="Total a cobrar" value={fmt(totalDue)} muted={isNoPay} />
                <Row label="Monto recibido" value={fmt(received)} highlight={received > 0} />

                {isFull && change > 0 && (
                    <Row
                        label="Cambio"
                        value={fmt(change)}
                        color="text-emerald-600 dark:text-emerald-400"
                    />
                )}
                {isPartial && remaining > 0 && (
                    <Row
                        label="Queda pendiente"
                        value={fmt(remaining)}
                        color="text-amber-600 dark:text-amber-400"
                    />
                )}
                {isNoPay && totalDue > 0 && (
                    <Row
                        label="Deuda a registrar"
                        value={fmt(totalDue)}
                        color="text-red-500 dark:text-red-400"
                    />
                )}
            </div>

            {/* ─── Apply as Credit Checkbox ─── */}
            {isOverpay && change > 0 && !disabled && (
                <label className="flex items-start gap-3 bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-800 rounded-xl p-3.5 cursor-pointer group">
                    <input
                        type="checkbox"
                        checked={applyAsCredit}
                        onChange={(e) => setApplyAsCredit?.(e.target.checked)}
                        className="mt-0.5 w-4 h-4 accent-primary shrink-0"
                    />
                    <div>
                        <p className="font-semibold text-sky-700 dark:text-sky-300 text-sm">
                            Aplicar cambio como crédito
                        </p>
                        <p className="text-xs text-sky-600/70 dark:text-sky-400/70 mt-0.5">
                            Se acreditarán {fmt(change)} al saldo del paciente para próximas citas.
                        </p>
                    </div>
                </label>
            )}

            {/* ─── Method Badge ─── */}
            {received > 0 && (
                <div className="text-center">
                    <span className="inline-block text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-600">
                        Método: {paymentMethod === "efectivo" ? "Efectivo"
                            : paymentMethod === "tarjeta" ? "Tarjeta"
                            : paymentMethod === "transferencia" ? "Transferencia"
                            : "Crédito interno"}
                    </span>
                </div>
            )}
        </div>
    );
}

function Row({ label, value, color, highlight, muted }) {
    return (
        <div className={`flex justify-between items-center px-4 py-3 border-b border-slate-100 dark:border-slate-700 last:border-0 ${muted ? "opacity-50" : ""}`}>
            <span className="text-sm text-slate-500 dark:text-slate-400">{label}</span>
            <span className={`font-bold text-sm ${color || (highlight ? "text-slate-800 dark:text-white" : "text-slate-600 dark:text-slate-400")}`}>
                {value}
            </span>
        </div>
    );
}
