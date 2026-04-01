/**
 * 📘 payment.types.js
 * 
 * JSDoc definitions for the payments domain.
 * Provides IntelliSense and structural contract for the module.
 */

/**
 * @typedef {Object} PaymentItem
 * @property {string} name
 * @property {number} qty
 * @property {number} price
 * @property {number} total
 * @property {boolean} [taxable]
 * @property {number} [tax_rate]
 */

/**
 * @typedef {("appointment" | "treatment" | "product")} PaymentSourceType
 */

/**
 * @typedef {("paid" | "partial" | "credited" | "pending")} PaymentStatus
 */

/**
 * @typedef {Object} PaymentPayload
 * @property {string|null} patient_id
 * @property {PaymentSourceType} source_type
 * @property {string|number|null} source_id
 * @property {string} method
 * @property {number} total
 * @property {number} received
 * @property {PaymentItem[]} items
 */

/**
 * @typedef {Object} PaymentTicket
 * @property {string} clinic
 * @property {string} patient
 * @property {PaymentItem[]} items
 * @property {number} total
 * @property {number} received
 * @property {number} change
 * @property {string} date
 */

/**
 * @typedef {Object} InvoiceData
 * @property {number} subtotal
 * @property {number} tax
 * @property {number} total
 * @property {PaymentItem[]} items
 * @property {string} issued_at
 */

/**
 * @typedef {Object} PaymentResponse
 * @property {string} id
 * @property {string|null} patient_id
 * @property {PaymentSourceType} source_type
 * @property {string|number|null} source_id
 * @property {string} method
 * @property {number} total
 * @property {number} received
 * @property {PaymentStatus} status
 * @property {PaymentItem[]} items
 * @property {string} created_at
 * @property {PaymentTicket} ticket
 * @property {InvoiceData|null} [invoice]
 */
