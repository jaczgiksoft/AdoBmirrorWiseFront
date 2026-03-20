import { DollarSign, CreditCard } from "lucide-react";

const PAYMENT_METHODS = [
    { value: "efectivo", label: "💵 Efectivo" },
    { value: "tarjeta", label: "💳 Tarjeta" },
    { value: "transferencia", label: "🏦 Transferencia" },
    { value: "credito_interno", label: "🎫 Crédito interno" },
];

/**
 * PaymentInput — Controlled input for amount + method.
 *
 * Props:
 *   amountReceived    {string|number}
 *   setAmountReceived {fn}
 *   paymentMethod     {string}
 *   setPaymentMethod  {fn}
 *   patientCredit     {number}   — auto-fills when method = credito_interno
 *   totalDue          {number}   — used to auto-fill "exact" amount
 *   disabled          {boolean}
 */
export default function PaymentInput({
    amountReceived,
    setAmountReceived,
    paymentMethod,
    setPaymentMethod,
    patientCredit = 0,
    totalDue = 0,
    disabled = false,
}) {
    const handleMethodChange = (e) => {
        const method = e.target.value;
        setPaymentMethod(method);
        // Auto-fill credit amount when switching to internal credit
        if (method === "credito_interno") {
            setAmountReceived(Math.min(patientCredit, totalDue).toFixed(2));
        }
    };

    const handleExact = () => setAmountReceived(totalDue.toFixed(2));

    return (
        <div className="space-y-4">
            {/* Payment Method */}
            <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <CreditCard size={13} />
                    Método de Pago
                </label>
                <select
                    value={paymentMethod}
                    onChange={handleMethodChange}
                    disabled={disabled}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary transition disabled:opacity-50"
                >
                    {PAYMENT_METHODS.map((m) => (
                        <option key={m.value} value={m.value}>
                            {m.label}
                        </option>
                    ))}
                </select>
                {paymentMethod === "credito_interno" && patientCredit <= 0 && (
                    <p className="text-xs text-amber-500 mt-1 ml-1">
                        El paciente no tiene crédito disponible.
                    </p>
                )}
            </div>

            {/* Amount Received */}
            <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <DollarSign size={13} />
                    Monto Recibido
                </label>
                <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-lg pointer-events-none">
                        $
                    </span>
                    <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={amountReceived}
                        onChange={(e) => setAmountReceived(e.target.value)}
                        disabled={disabled || paymentMethod === "credito_interno"}
                        placeholder="0.00"
                        className="w-full pl-8 pr-4 py-4 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-white text-2xl font-bold focus:outline-none focus:ring-2 focus:ring-primary transition disabled:opacity-50 disabled:bg-slate-50 dark:disabled:bg-slate-800/50"
                    />
                </div>
            </div>

            {/* Quick-fill buttons */}
            {paymentMethod !== "credito_interno" && !disabled && (
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={handleExact}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-primary/10 hover:text-primary transition border border-slate-200 dark:border-slate-600"
                    >
                        Monto exacto
                    </button>
                    {[200, 500, 1000].map((quick) => (
                        totalDue > 0 && quick >= totalDue * 0.9 ? (
                            <button
                                key={quick}
                                onClick={() => setAmountReceived(String(quick))}
                                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-primary/10 hover:text-primary transition border border-slate-200 dark:border-slate-600"
                            >
                                ${quick}
                            </button>
                        ) : null
                    ))}
                    <button
                        onClick={() => setAmountReceived("")}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-red-500 transition"
                    >
                        Limpiar
                    </button>
                </div>
            )}
        </div>
    );
}
