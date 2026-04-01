import { useState, useMemo } from "react";
import { createPayment } from "../../../modules/payments";

/**
 * useCheckout — Encapsulates all checkout business logic.
 *
 * Adjustments per clinic requirements:
 *  - base_amount comes from the patient BUDGET (not service prices)
 *  - included services are informational only
 *  - extras independently added during visit
 *  - total_due = base_amount + extras_total + patient.balance
 *  - supports partial, full, overpay → credit, and no-pay flows
 *
 * @param {object} appointment
 * @param {object} mockPatient  — { balance, credit, unpaidCount }
 * @returns checkout state + handlers
 */
export function useCheckout(appointment, mockPatient) {
    // ─── State ────────────────────────────────────────────
    const [extras, setExtras] = useState([]);
    const [amountReceived, setAmountReceived] = useState("");
    const [paymentMethod, setPaymentMethod] = useState("efectivo");
    const [applyAsCredit, setApplyAsCredit] = useState(false);
    const [completed, setCompleted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Extra form state
    const [extraName, setExtraName] = useState("");
    const [extraAmount, setExtraAmount] = useState("");
    const [extraToDebt, setExtraToDebt] = useState(false);

    // ─── Derived Values ───────────────────────────────────
    const baseAmount = parseFloat(appointment?.base_amount) || 0;
    const patientBalance = parseFloat(mockPatient?.balance) || 0;
    const patientCredit = parseFloat(mockPatient?.credit) || 0;
    const unpaidCount = mockPatient?.unpaidCount || 0;

    const includedServices = appointment?.services || [];

    const extrasTotal = useMemo(
        () => extras.filter((e) => !e.addedToDebt).reduce((s, e) => s + (parseFloat(e.amount) || 0), 0),
        [extras]
    );

    const totalDue = baseAmount + extrasTotal + patientBalance;

    const received = parseFloat(amountReceived) || 0;
    const difference = received - totalDue;
    const change = difference > 0 ? difference : 0;
    const remaining = difference < 0 ? Math.abs(difference) : 0;

    const paymentStatus = useMemo(() => {
        if (received === 0) return "pending";
        if (received >= totalDue) return applyAsCredit && change > 0 ? "credited" : "paid";
        return "partial";
    }, [received, totalDue, applyAsCredit, change]);

    // ─── Handlers ─────────────────────────────────────────
    const addExtra = () => {
        const name = extraName.trim();
        const amount = parseFloat(extraAmount);
        if (!name || isNaN(amount) || amount <= 0) return;

        setExtras((prev) => [
            ...prev,
            {
                id: `extra-${Date.now()}`,
                name,
                amount,
                type: "extra",
                addedToDebt: extraToDebt,
            },
        ]);
        setExtraName("");
        setExtraAmount("");
        setExtraToDebt(false);
    };

    /**
     * addExtraFromService — receives the fully-formed extra object
     * built by ServiceSelector (name, amount * qty, type, addedToDebt).
     * Pushes it directly into the extras list.
     */
    const addExtraFromService = (extraObj) => {
        if (!extraObj || !extraObj.name || !extraObj.amount) return;
        setExtras((prev) => [...prev, extraObj]);
    };

    const removeExtra = (id) => setExtras((prev) => prev.filter((e) => e.id !== id));

    /**
     * Build the final payment result object returned via onComplete callback.
     */
    const buildResult = () => {
        const debtFromExtras = extras
            .filter((e) => e.addedToDebt)
            .reduce((s, e) => s + (parseFloat(e.amount) || 0), 0);

        return {
            payment_status: paymentStatus === "pending" ? "pending" : paymentStatus,
            base_amount: baseAmount,
            extras,
            extras_total: extrasTotal,
            patient_balance_included: patientBalance,
            total_due: totalDue,
            paid_amount: received,
            change,
            remaining_debt: remaining + debtFromExtras,
            credit_applied: applyAsCredit ? change : 0,
            payment_method: paymentMethod,
            paid_at: new Date().toISOString(),
        };
    };

    /**
     * handleSubmitPayment — prepares payload and submits to service.
     */
    const handleSubmitPayment = async () => {
        if (isSubmitting) return;
        setIsSubmitting(true);

        try {
            const items = [
                { name: "Consulta base", qty: 1, price: baseAmount, total: baseAmount },
                ...extras.map(e => ({ name: e.name, qty: 1, price: e.amount, total: e.amount }))
            ];

            const payload = {
                patient_id: appointment.patient?.id ?? null,
                source_type: "appointment",
                source_id: appointment?.id ?? null,
                method: paymentMethod,
                total: totalDue,
                received: received,
                items,
            };

            const serviceResult = await createPayment(payload);

            setCompleted(true);

            const finalResult = {
                ...buildResult(),
                ticket: serviceResult?.ticket ?? null
            };

            return finalResult; // 🔥 IMPORTANTE

        } catch (error) {
            console.error("Error validando checkout:", error);
            return null; // opcional pero recomendado
        } finally {
            setIsSubmitting(false);
        }
    };

    return {
        // Data
        baseAmount,
        includedServices,
        extras,
        extrasTotal,
        totalDue,
        patientBalance,
        patientCredit,
        unpaidCount,
        // Payment
        amountReceived,
        setAmountReceived,
        paymentMethod,
        setPaymentMethod,
        applyAsCredit,
        setApplyAsCredit,
        change,
        remaining,
        paymentStatus,
        completed,
        // Extra form
        extraName,
        setExtraName,
        extraAmount,
        setExtraAmount,
        extraToDebt,
        setExtraToDebt,
        addExtra,
        addExtraFromService,
        removeExtra,
        handleSubmitPayment,
        isSubmitting,
    };
}
