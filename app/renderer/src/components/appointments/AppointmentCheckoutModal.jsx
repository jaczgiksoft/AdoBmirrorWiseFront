import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Trash2, Receipt, CheckCircle, Calendar, AlertTriangle } from "lucide-react";
import ChargeBreakdown from "./checkout/ChargeBreakdown";
import PaymentInput from "./checkout/PaymentInput";
import PaymentSummary from "./checkout/PaymentSummary";
import ServiceSelector from "./checkout/ServiceSelector";
import { useCheckout } from "./checkout/useCheckout";

/**
 * Mock patient data injected per appointment.
 * In a real implementation this would come from a patient service.
 */
function getMockPatient(appointment) {
    return {
        balance: 0,       // accumulated unpaid debt
        credit: 0,        // available credit
        unpaidCount: 0,   // number of previous unpaid appointments
    };
}

/**
 * AppointmentCheckoutModal
 *
 * Full-screen overlay modal for the checkout / payment flow.
 * Opened from AppointmentDetailModal when the user clicks "Cobrar".
 *
 * Props:
 *   open         {boolean}
 *   appointment  {object}
 *   onClose      {fn}
 *   onComplete   {fn(result)} — called after successful payment
 *   onScheduleNext {fn}      — called when user wants to schedule next appointment
 */
export default function AppointmentCheckoutModal({
    open,
    appointment,
    onClose,
    onComplete,
    onScheduleNext,
}) {
    const mockPatient = getMockPatient(appointment);
    const co = useCheckout(appointment, mockPatient);
    const [showNextPrompt, setShowNextPrompt] = useState(false);
    const [lastResult, setLastResult] = useState(null);

    if (!open || !appointment) return null;

    const patientName = appointment.patient
        ? `${appointment.patient.first_name} ${appointment.patient.last_name}`
        : "Paciente";

    const canComplete = co.paymentStatus !== "pending" || co.totalDue === 0;

    const handleComplete = async () => {
        const result = await co.handleSubmitPayment();

        if (!result) return; // 🔥 defensivo

        setLastResult(result);
        setShowNextPrompt(true);
    };

    const handleConfirmNext = () => {
        onComplete(lastResult);
        setShowNextPrompt(false);
        if (onScheduleNext) onScheduleNext(appointment);
        else onClose();
    };

    const handleSkipNext = () => {
        onComplete(lastResult);
        setShowNextPrompt(false);
        onClose();
    };

    const fmt = (n) =>
        new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n);

    return (
        <AnimatePresence>
            {open && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.96 }}
                        transition={{ duration: 0.18 }}
                        className="bg-white dark:bg-secondary w-full max-w-5xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col"
                        style={{ maxHeight: "92vh" }}
                    >
                        {/* ── Header ── */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                                    <Receipt size={20} />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-slate-800 dark:text-white">
                                        Checkout / Pago de servicio
                                    </h2>
                                    <p className="text-xs text-slate-400">{patientName}</p>
                                </div>
                            </div>

                            {/* Overdue alert badge */}
                            {co.unpaidCount >= 2 && (
                                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-xs font-bold">
                                    <AlertTriangle size={14} />
                                    {co.unpaidCount} citas sin pagar
                                </div>
                            )}

                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* ── Body: 3-column layout ── */}
                        <div className="flex flex-1 overflow-hidden min-h-0">
                            {/* LEFT 35% — Charge Breakdown */}
                            <div className="w-[35%] border-r border-slate-100 dark:border-slate-800 overflow-y-auto p-5 bg-slate-50/50 dark:bg-slate-800/20 shrink-0">
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                                    Desglose de Pago
                                </h3>
                                <ChargeBreakdown
                                    baseAmount={co.baseAmount}
                                    includedServices={co.includedServices}
                                    extras={co.extras}
                                    patientBalance={co.patientBalance}
                                    patientCredit={co.patientCredit}
                                    unpaidCount={co.unpaidCount}
                                />
                            </div>

                            {/* CENTER 40% — Extras + Payment Input */}
                            <div className="flex-1 overflow-y-auto p-5 space-y-6 bg-white dark:bg-secondary">
                                {/* ── Add Extras ── */}
                                <section>
                                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                        <Plus size={13} />
                                        Agregar Cargos Extras
                                    </h3>

                                    <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                                        {/* Service selector */}
                                        <div className="p-4 bg-white dark:bg-slate-800">
                                            <ServiceSelector
                                                onSelect={co.addExtraFromService}
                                                disabled={co.completed}
                                            />
                                        </div>

                                        {/* Extras already added */}
                                        {co.extras.length > 0 && (
                                            <div className="divide-y divide-slate-100 dark:divide-slate-700 border-t border-slate-200 dark:border-slate-700">
                                                {co.extras.map((extra) => (
                                                    <div key={extra.id} className="flex items-center justify-between px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50">
                                                        <div className="text-sm">
                                                            <span className="text-slate-700 dark:text-slate-300 font-medium">{extra.name}</span>
                                                            {extra.addedToDebt && (
                                                                <span className="ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400">
                                                                    A deuda
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-sm font-semibold text-amber-600 dark:text-amber-400">
                                                                {extra.addedToDebt ? "—" : fmt(extra.amount)}
                                                            </span>
                                                            <button
                                                                onClick={() => co.removeExtra(extra.id)}
                                                                className="text-slate-300 hover:text-red-500 transition"
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </section>

                                <div className="border-t border-slate-100 dark:border-slate-800" />

                                {/* ── Payment Input ── */}
                                <section>
                                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                                        Registrar Pago
                                    </h3>
                                    <PaymentInput
                                        amountReceived={co.amountReceived}
                                        setAmountReceived={co.setAmountReceived}
                                        paymentMethod={co.paymentMethod}
                                        setPaymentMethod={co.setPaymentMethod}
                                        patientCredit={co.patientCredit}
                                        totalDue={co.totalDue}
                                        disabled={co.completed}
                                    />
                                </section>
                            </div>

                            {/* RIGHT 25% — Live Summary */}
                            <div className="w-[25%] border-l border-slate-100 dark:border-slate-800 overflow-y-auto p-5 bg-slate-50/50 dark:bg-slate-800/20 shrink-0">
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                                    Resumen
                                </h3>
                                <PaymentSummary
                                    totalDue={co.totalDue}
                                    amountReceived={co.amountReceived}
                                    paymentMethod={co.paymentMethod}
                                    applyAsCredit={co.applyAsCredit}
                                    setApplyAsCredit={co.setApplyAsCredit}
                                    paymentStatus={co.paymentStatus}
                                    disabled={co.completed}
                                />
                            </div>
                        </div>

                        {/* ── Footer ── */}
                        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-secondary flex items-center justify-between gap-4 shrink-0">
                            <div className="text-sm text-slate-400">
                                Total a cobrar:{" "}
                                <span className="font-bold text-slate-800 dark:text-white text-base">
                                    {fmt(co.totalDue)}
                                </span>
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={onClose}
                                    className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition border border-slate-200 dark:border-slate-700"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleComplete}
                                    disabled={!canComplete || co.completed || co.isSubmitting}
                                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-700 transition active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    <CheckCircle size={17} />
                                    {co.isSubmitting ? "Registrando..." : co.completed ? "Registrado" : "Registrar Pago"}
                                </button>
                            </div>
                        </div>
                    </motion.div>

                    {/* ── Schedule Next Appointment Prompt ── */}
                    <AnimatePresence>
                        {showNextPrompt && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm"
                            >
                                <div className="bg-white dark:bg-secondary rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-8 max-w-sm w-full text-center">
                                    <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-4">
                                        <CheckCircle className="text-emerald-500" size={32} />
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-1">
                                        ¡Pago registrado!
                                    </h3>
                                    <p className="text-sm text-slate-400 mb-6">
                                        ¿Deseas agendar la próxima cita para {patientName}?
                                    </p>
                                    <div className="flex flex-col gap-3">
                                        <button
                                            onClick={handleConfirmNext}
                                            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-bold bg-primary text-white shadow-lg shadow-sky-500/20 hover:bg-sky-600 transition"
                                        >
                                            <Calendar size={18} />
                                            Agendar siguiente cita
                                        </button>
                                        <button
                                            onClick={handleSkipNext}
                                            className="w-full py-3 rounded-xl font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition border border-slate-200 dark:border-slate-700 text-sm"
                                        >
                                            Ahora no
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}
        </AnimatePresence>
    );
}
