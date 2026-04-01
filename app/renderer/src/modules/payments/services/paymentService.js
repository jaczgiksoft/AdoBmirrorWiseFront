import { createPaymentMock, getPaymentsMock } from "../mocks/paymentMock";
// import api from "../../../services/api"; // 🔧 future use for actual HTTP requests

/**
 * 💳 paymentService
 * Handles payment creation.
 * 
 * Current: uses mock
 * Future: replace with API call
 * 
 * @param {import('../types/payment.types').PaymentPayload} payload
 * @returns {Promise<import('../types/payment.types').PaymentResponse>}
 */
export async function createPayment(payload) {
    // 🚀 FUTURE:
    // const res = await api.post("/payments", payload);
    // return res.data;

    // 🧪 MOCK:
    return await createPaymentMock(payload);
}

/**
 * 📋 getPayments
 * Fetches list of payments.
 */
export async function getPayments() {
    // 🚀 FUTURE:
    // const res = await api.get("/payments");
    // return res.data;

    // 🧪 MOCK:
    return await getPaymentsMock();
}
