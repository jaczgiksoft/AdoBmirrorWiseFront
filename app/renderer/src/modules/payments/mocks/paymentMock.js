/**
 * modules/payments/mocks/paymentMock.js
 * 
 * Simula una llamada asincrónica al backend real para la creación y listado de pagos.
 * Mejorado para generar escenarios de negocio realistas.
 */

const MOCK_PATIENTS = [
    { id: "pat_001", name: "Juan Pérez" },
    { id: "pat_002", name: "María García" },
    { id: "pat_003", name: "Carlos López" },
    { id: "pat_004", name: "Ana Martínez" },
    { id: "pat_005", name: "Sofía Fernández" },
];

const MOCK_METHODS = ["efectivo", "tarjeta", "transferencia"];
const MOCK_SOURCES = ["appointment", "treatment", "product"];

/**
 * Utilidad privada para generar un pago con datos aleatorios realistas
 * @param {Object} [overrides={}] - Datos que provienen del payload (para preservar)
 * @returns {Object} 
 */
function generateRealisticPayment(overrides = {}) {
    const generatedAt = overrides.created_at || new Date().toISOString();
    // 1. Generate core logic parameters automatically (if not overwritten)
    const patient = overrides.patient_id
        ? (MOCK_PATIENTS.find(p => p.id === overrides.patient_id) || { id: overrides.patient_id, name: "Paciente Especificado" })
        : MOCK_PATIENTS[Math.floor(Math.random() * MOCK_PATIENTS.length)];

    const method = overrides.method || MOCK_METHODS[Math.floor(Math.random() * MOCK_METHODS.length)];
    const source_type = overrides.source_type || MOCK_SOURCES[Math.floor(Math.random() * MOCK_SOURCES.length)];

    // 2. Amounts Logic
    // Total is between 200 and 5000 if not provided
    const total = overrides.total !== undefined ? overrides.total : Math.floor(Math.random() * 4800) + 200;

    // Received Logic
    let received;
    if (overrides.received !== undefined) {
        received = overrides.received;
    } else {
        const scenario = Math.random();
        if (scenario > 0.6) {
            received = total; // 40% chance full payment
        } else if (scenario > 0.2) {
            // 40% chance partial payment (30% to 70% of total)
            const percentage = (Math.floor(Math.random() * 40) + 30) / 100;
            received = Math.floor(total * percentage);
        } else {
            received = 0; // 20% chance pending (0 received)
        }
    }

    // 3. Status Derivation
    let status;
    if (received >= total) status = "paid";
    else if (received > 0) status = "partial";
    else status = "pending";

    // 4. Ticket & Invoice Logic
    const invoiced = overrides.invoiced !== undefined ? overrides.invoiced : Math.random() > 0.5;

    const items = overrides.items && overrides.items.length > 0
        ? overrides.items.map(item => ({
            ...item,
            taxable: item.taxable !== undefined ? item.taxable : Math.random() > 0.5,
            tax_rate: item.tax_rate !== undefined ? item.tax_rate : 0.16
        }))
        : [{
            name: `Servicio / Producto Genérico (${source_type})`,
            qty: 1,
            price: total,
            total: total,
            taxable: Math.random() > 0.3,
            tax_rate: 0.16
        }];

    let invoice = null;
    if (invoiced) {
        let subtotal = 0;
        let tax = 0;

        items.forEach(item => {
            const itemTotal = item.total ?? 0;

            if (item.taxable) {
                const rate = item.tax_rate || 0.16;
                const itemTax = itemTotal * rate;
                subtotal += itemTotal;
                tax += itemTax;
            } else {
                subtotal += itemTotal;
            }
        });

        invoice = {
            subtotal,
            tax,
            total,
            items,
            issued_at: generatedAt
        };
    }

    return {
        // Enforce ID creation randomly matching database string length
        id: overrides.id || `pay_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        patient_id: patient.id,
        patient_name: patient.name,
        source_type,
        source_id: overrides.source_id || `${source_type.substring(0, 3)}_${Math.floor(Math.random() * 9999)}`,
        method,
        total,
        received,
        status,
        invoiced,
        invoice,
        created_at: generatedAt,
        ticket: {
            clinic: "Clínica BWISE",
            patient: patient.name,
            items: items,
            total,
            received,
            change: Math.max(0, received - total),
            date: generatedAt
        }
    };
}

// 🛒 MOCK MEMORY STATE: Boot with 10 completely random realistic payments
let mockPaymentsDB = Array.from({ length: 12 }, () => generateRealisticPayment())
    // Sort them descending by created_at so newest is first
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

/**
 * Obtiene la lista de pagos mockeada.
 * @returns {Promise<import('../types/payment.types').PaymentResponse[]>}
 */
export async function getPaymentsMock() {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve([...mockPaymentsDB]);
        }, 400); // simulate network
    });
}

/**
 * Crea un nuevo pago iterando los overrides de la UI devolviendo el estado combinado
 * @param {import('../types/payment.types').PaymentPayload} payload
 * @returns {Promise<import('../types/payment.types').PaymentResponse>}
 */
export async function createPaymentMock(payload) {
    return new Promise((resolve) => {
        setTimeout(() => {
            // Apply realism generator on top of whatever the UI explicitly submitted.
            // Eg: If the UI gave total & received, they won't be randomized. 
            // If the UI didn't include `invoiced`, it WILL be appropriately randomized.
            const newPayment = generateRealisticPayment({
                ...payload,
                created_at: new Date().toISOString() // Force current time on creation
            });

            // 📥 Guarda en la RAM para que getPaymentsMock lo vea luego
            mockPaymentsDB = [newPayment, ...mockPaymentsDB];

            resolve(newPayment);
        }, Math.floor(Math.random() * 200) + 300);
    });
}
