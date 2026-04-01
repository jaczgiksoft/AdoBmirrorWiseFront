import Modal from "@/components/ui/Modal";
import { Calculator, CheckCircle2, AlertCircle } from "lucide-react";
import { formatCurrency } from "../utils/formatCurrency";
import { useMemo } from "react";
/**
 * InvoicePreviewModal - Previews and calculates tax before confirming an invoice.
 * Private to the payments module.
 *
 * @param {Object} payment - The payment object to invoice
 * @param {Function} onClose - Close modal handler
 * @param {Function} onConfirm - Confirm handler, receives (paymentId, invoiceData)
 */
export default function InvoicePreviewModal({ payment, onClose, onConfirm }) {
    if (!payment) return null;

    // ── Calculate Invoice Totals ──
    const invoice = useMemo(() => {
        let subtotal = 0;
        let tax = 0;
        const items = payment.ticket?.items || payment.items || [];

        items.forEach(item => {
            const itemTotal = item.total ?? 0;
            if (item.taxable) {
                // Assuming IVA is already included in the item total (common in MX for B2C)
                const rate = item.tax_rate ?? 0.16;
                const itemSubtotal = itemTotal / (1 + rate);
                subtotal += itemSubtotal;
                tax += (itemTotal - itemSubtotal);
            } else {
                subtotal += itemTotal;
            }
        });

        // The exact final total from the payment itself
        const total = payment.total;

        return {
            subtotal,
            tax,
            total,
            items,
            issued_at: new Date().toISOString()
        };
    }, [payment]);

    const handleConfirm = () => {
        onConfirm(payment.id, invoice);
    };

    return (
        <Modal
            open={!!payment}
            onClose={onClose}
            title="Vista Previa de Facturación"
            widthClass="w-[500px]"
            closeOnBackdrop={false}
        >
            <div className="flex items-center gap-3 p-4 mb-5 bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 rounded-xl border border-blue-100 dark:border-blue-800/30">
                <Calculator size={20} className="shrink-0" />
                <p className="text-sm">
                    Revisa el desglose de impuestos antes de emitir el comprobante. Esta acción marcará el pago como facturado.
                </p>
            </div>

            {/* ── Items Breakdown ── */}
            <div className="mb-6 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                <div className="bg-slate-50 dark:bg-slate-800/50 px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider flex justify-between">
                    <span>Conceptos Facturables</span>
                    <span>IVA</span>
                </div>
                <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
                    {invoice.items.length === 0 ? (
                        <div className="p-4 text-center text-sm text-slate-500">Sin conceptos definidos</div>
                    ) : (
                        invoice.items.map((item, idx) => (
                            <div key={idx} className="p-3 flex items-center justify-between text-sm">
                                <div className="flex flex-col">
                                    <span className="font-medium text-slate-800 dark:text-slate-200">{item.name}</span>
                                    <span className="text-xs text-slate-500">{item.qty} x {formatCurrency(item.price)}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    {item.taxable ? (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">
                                            16%
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                                            Exento
                                        </span>
                                    )}
                                    <span className="font-semibold text-slate-900 dark:text-white min-w-[80px] text-right">
                                        {formatCurrency(item.total)}
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <p className="text-[11px] text-slate-400 dark:text-slate-500 mb-2 px-2 text-right">
                Los precios ya incluyen IVA (16%). La factura solo desglosa los impuestos.
            </p>

            {/* ── Totals Box ── */}
            <div className="bg-slate-50 dark:bg-slate-800/40 p-5 rounded-xl space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Subtotal</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {formatCurrency(invoice.subtotal)}
                    </span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-slate-500">IVA (16%)</span>
                    <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                        {formatCurrency(invoice.tax)}
                    </span>
                </div>
                <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
                    <span className="font-bold text-slate-700 dark:text-slate-200">Total a Facturar</span>
                    <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(invoice.total)}
                    </span>
                </div>
            </div>

            {/* ── Actions ── */}
            <div className="flex items-center justify-end gap-3 pt-2">
                <button
                    onClick={onClose}
                    className="px-5 py-2.5 rounded-xl font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition"
                >
                    Cancelar
                </button>
                <button
                    onClick={handleConfirm}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-700 transition"
                >
                    <CheckCircle2 size={18} />
                    Confirmar Factura
                </button>
            </div>
        </Modal>
    );
}
