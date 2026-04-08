/**
 * modules/payments/mocks/paymentMock.js
 * 
 * Simula una llamada asincrónica al backend real para la creación y listado de pagos.
 * Genera escenarios realistas con múltiples servicios.
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

const MOCK_SERVICES = [
    { name: "Consulta general", min: 300, max: 600 },
    { name: "Limpieza dental", min: 500, max: 900 },
    { name: "Extracción simple", min: 800, max: 1500 },
    { name: "Resina dental", min: 700, max: 1200 },
    { name: "Radiografía", min: 200, max: 400 },
    { name: "Endodoncia", min: 2500, max: 5000 },
    { name: "Blanqueamiento", min: 1500, max: 3000 },
];

/**
 * Genera un pago con datos realistas
 */
function generateRealisticPayment(overrides = {}) {
    const generatedAt = overrides.created_at || new Date().toISOString();

    // ── PATIENT ──
    const patient = overrides.patient_id
        ? (MOCK_PATIENTS.find(p => p.id === overrides.patient_id) || { id: overrides.patient_id, name: "Paciente Especificado" })
        : MOCK_PATIENTS[Math.floor(Math.random() * MOCK_PATIENTS.length)];

    const method = overrides.method || MOCK_METHODS[Math.floor(Math.random() * MOCK_METHODS.length)];
    const source_type = overrides.source_type || MOCK_SOURCES[Math.floor(Math.random() * MOCK_SOURCES.length)];

    // ── ITEMS (MULTI SERVICIO) ──
    let items;

    if (overrides.items && overrides.items.length > 0) {
        items = overrides.items.map(item => ({
            ...item,
            taxable: item.taxable !== undefined ? item.taxable : Math.random() > 0.5,
            tax_rate: item.tax_rate !== undefined ? item.tax_rate : 0.16
        }));
    } else {
        const itemCount = Math.floor(Math.random() * 8) + 1;

        // evitar duplicados
        const shuffled = [...MOCK_SERVICES].sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, itemCount);

        items = selected.map(service => {
            const price = Math.floor(
                Math.random() * (service.max - service.min) + service.min
            );

            const qty = Math.random() > 0.7 ? 2 : 1;

            return {
                name: service.name,
                qty,
                price,
                total: price * qty,
                taxable: Math.random() > 0.3,
                tax_rate: 0.16
            };
        });
    }

    // ── TOTAL ──
    const total = overrides.total !== undefined
        ? overrides.total
        : items.reduce((sum, item) => sum + item.total, 0);

    // ── RECEIVED ──
    let received;
    if (overrides.received !== undefined) {
        received = overrides.received;
    } else {
        const scenario = Math.random();
        if (scenario > 0.6) {
            received = total;
        } else if (scenario > 0.2) {
            const percentage = (Math.floor(Math.random() * 40) + 30) / 100;
            received = Math.floor(total * percentage);
        } else {
            received = 0;
        }
    }

    // ── STATUS ──
    let status;
    if (received >= total) status = "paid";
    else if (received > 0) status = "partial";
    else status = "pending";

    // ── INVOICE ──
    const invoiced = overrides.invoiced !== undefined ? overrides.invoiced : Math.random() > 0.5;

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
            items,
            total,
            received,
            change: Math.max(0, received - total),
            date: generatedAt
        }
    };
}

// ── MOCK DB ──
let mockPaymentsDB = Array.from({ length: 12 }, () => generateRealisticPayment())
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

// ── GET ──
export async function getPaymentsMock() {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve([...mockPaymentsDB]);
        }, 400);
    });
}

// ── CREATE ──
export async function createPaymentMock(payload) {
    return new Promise((resolve) => {
        setTimeout(() => {
            const newPayment = generateRealisticPayment({
                ...payload,
                created_at: new Date().toISOString()
            });

            mockPaymentsDB = [newPayment, ...mockPaymentsDB];

            resolve(newPayment);
        }, Math.floor(Math.random() * 200) + 300);
    });
}