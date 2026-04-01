/**
 * utils/paymentActions.js
 * 
 * Mock action handlers for UI demonstration.
 * They simulate hardware integration (printers) or external APIs (emailing).
 * Privado al módulo de pagos.
 */

export function reprintTicket(payment) {
    console.log("[MOCK] Imprimiendo ticket en terminal térmica...", payment.id);
    alert(`Enviando ticket ${payment.id} a la impresora térmica.`);
}

export function downloadPaymentPDF(payment) {
    console.log("[MOCK] Generando y descargando PDF estructurado...", payment.id);
    alert(`Descargando comprobante PDF para el pago ${payment.id}.`);
}

export function viewInvoice(payment) {
    console.log("[MOCK] Redirigiendo al visor maestro del SAT / PDF Timbrado...", payment.id);
    alert(`Abriendo visor de CFDI y XML para la factura asociada.`);
}

export function sendInvoiceEmail(payment) {
    console.log("[MOCK] Solicitando API de Correos para adjuntar XML/PDF...", payment.id);
    alert(`Enviando XML y PDF al correo del paciente registrado: ${payment.patient_name}`);
}
