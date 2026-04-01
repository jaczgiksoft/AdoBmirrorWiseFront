import React from "react";
import Modal from "@/components/ui/Modal";
import { Receipt, User, Calendar, CreditCard, BadgeCheck, FileX, Printer, Download, Eye, Mail } from "lucide-react";
import { formatCurrency } from "../utils/formatCurrency";
import { reprintTicket, downloadPaymentPDF, sendInvoiceEmail, viewInvoice } from "../utils/paymentActions";

const STATUS_LABELS = {
    paid:    { label: "Pagado",   cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
    partial: { label: "Parcial",  cls: "bg-amber-100   text-amber-700   dark:bg-amber-900/30   dark:text-amber-400"   },
    pending: { label: "Pendiente",cls: "bg-rose-100    text-rose-700    dark:bg-rose-900/30    dark:text-rose-400"    },
};

const METHOD_LABELS = {
    efectivo:      "Efectivo",
    tarjeta:       "Tarjeta",
    transferencia: "Transferencia",
};

/**
 * PaymentDetailModal — View-only detail modal.
 * Driven entirely by `payment.ticket` when available.
 * Private to the payments module. Not exported from index.js.
 *
 * @param {{ payment: object|null, onClose: function }} props
 */
export default function PaymentDetailModal({ payment, onClose }) {
    if (!payment) return null;

    // Use ticket as primary data source if available — constraint #1
    const ticket = payment.ticket ?? {};
    const statusConfig = STATUS_LABELS[payment.status] ?? { label: payment.status, cls: "bg-slate-100 text-slate-600" };

    return (
        <Modal
            open={!!payment}
            onClose={onClose}
            title="Detalle de Pago"
            widthClass="w-[560px]"
            closeOnBackdrop
        >
            {/* ── Payment ID & Status ── */}
            <div className="flex items-start justify-between mb-5">
                <div>
                    <p className="text-xs text-slate-400 mb-1">Referencia</p>
                    <p className="font-mono text-sm text-slate-700 dark:text-slate-300">{payment.id}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${statusConfig.cls}`}>
                    {statusConfig.label}
                </span>
            </div>

            {/* ── Info Grid ── */}
            <div className="grid grid-cols-2 gap-3 mb-5">
                <InfoRow icon={User}    label="Paciente"  value={ticket.patient ?? payment.patient_name ?? "—"} />
                <InfoRow icon={Calendar} label="Fecha"    value={ticket.date ? new Date(ticket.date).toLocaleDateString("es-MX", { dateStyle: "long" }) : "—"} />
                <InfoRow icon={CreditCard} label="Método" value={METHOD_LABELS[payment.method] ?? payment.method} />
                <InfoRow
                    icon={payment.invoiced ? BadgeCheck : FileX}
                    label="Facturado"
                    value={payment.invoiced ? "Sí" : "No"}
                    valueClass={payment.invoiced ? "text-emerald-500" : "text-slate-400"}
                />
            </div>

            {/* ── Items Table ── */}
            {ticket.items && ticket.items.length > 0 && (
                <div className="mb-5">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Conceptos</p>
                    <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 text-xs">
                                    <th className="text-left px-4 py-2 font-medium">Concepto</th>
                                    <th className="text-center px-3 py-2 font-medium">Cant.</th>
                                    <th className="text-right px-4 py-2 font-medium">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {ticket.items.map((item, i) => (
                                    <tr key={i} className="border-t border-slate-100 dark:border-slate-700/50">
                                        <td className="px-4 py-2.5 text-slate-700 dark:text-slate-300">{item.name}</td>
                                        <td className="px-3 py-2.5 text-center text-slate-500">{item.qty}</td>
                                        <td className="px-4 py-2.5 text-right font-medium text-slate-800 dark:text-slate-100">
                                            {formatCurrency(item.total ?? item.price)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ── Totals Summary ── */}
            <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl p-4 space-y-2 text-sm mb-5">
                <SummaryRow label="Total" value={formatCurrency(ticket.total ?? payment.total)} bold />
                <SummaryRow label="Recibido" value={formatCurrency(ticket.received ?? payment.received)} />
                {(ticket.change ?? 0) > 0 && (
                    <SummaryRow label="Cambio" value={formatCurrency(ticket.change)} />
                )}
            </div>

            {/* ── Actions Footer ── */}
            <div className="border-t border-slate-200 dark:border-slate-700 pt-5 flex flex-wrap items-center justify-between gap-3">
                <div className="flex gap-2">
                    <button 
                        onClick={() => reprintTicket(payment)} 
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 dark:text-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg transition"
                    >
                        <Printer size={16} /> Ticket
                    </button>
                    <button 
                        onClick={() => downloadPaymentPDF(payment)} 
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 dark:text-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg transition"
                    >
                        <Download size={16} /> PDF
                    </button>
                </div>

                {payment.invoiced && (
                    <div className="flex gap-2">
                        <button 
                            onClick={() => viewInvoice(payment)} 
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 dark:text-indigo-400 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 rounded-lg transition"
                        >
                            <Eye size={16} /> SAT
                        </button>
                        <button 
                            onClick={() => sendInvoiceEmail(payment)} 
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition shadow-md shadow-indigo-500/20"
                        >
                            <Mail size={16} /> Enviar CFDI
                        </button>
                    </div>
                )}
            </div>
        </Modal>
    );
}

// ── Private sub-components ────────────────────────────────────────────────────

function InfoRow({ icon: Icon, label, value, valueClass = "text-slate-800 dark:text-slate-100" }) {
    return (
        <div className="flex items-start gap-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl px-3 py-2.5">
            <Icon size={16} className="text-slate-400 mt-0.5 flex-shrink-0" />
            <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider leading-tight">{label}</p>
                <p className={`text-sm font-semibold leading-snug ${valueClass}`}>{value}</p>
            </div>
        </div>
    );
}

function SummaryRow({ label, value, bold = false }) {
    return (
        <div className="flex justify-between items-center">
            <span className="text-slate-500">{label}</span>
            <span className={bold ? "font-bold text-slate-900 dark:text-white text-base" : "text-slate-700 dark:text-slate-300"}>
                {value}
            </span>
        </div>
    );
}
