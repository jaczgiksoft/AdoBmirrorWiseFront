---
description: Create the Payments module following BWISE architecture and reusable domain design
---

When user types `/create-payments`:

## STEP 1 — Product Manager (MANDATORY)

You MUST define the Payments domain BEFORE writing code.

### Define:

1. **Module Name**
   - payments

2. **Purpose**
   - Handle all financial transactions across the system (appointments, treatments, products, etc.)

3. **Scope**
   - Payment creation
   - Payment status (paid, partial, credited)
   - Ticket/receipt generation
   - Support multiple sources via `source_type`

4. **Module Type**
   - LARGE

---

## STEP 2 — Architecture Design (MANDATORY)

You MUST design the module using BWISE Architecture Contract.

### Structure:
modules/payments/
├── services/
│ └── paymentService.js
├── mocks/
│ └── paymentMock.js
├── types/
│ └── payment.types.js
├── utils/ (optional)
│ └── payment.utils.js
├── index.js

---

## STEP 3 — Domain Definition

Define the core payment model:
Payment {
  id
  source_type   // "appointment" | "treatment" | "product"
  source_id
  patient_id
  method
  total
  received
  status        // "paid" | "partial" | "credited"
  created_at
}
________________________________________
STEP 4 — Public API (MANDATORY)
Define what the module exports:
// modules/payments/index.js
export { createPayment } from "./services/paymentService";
Everything else MUST remain private.
________________________________________
STEP 5 — Service Layer
Create:
paymentService.js
Rules:
•	MUST be pure 
•	MUST NOT contain UI logic 
•	MUST NOT contain state 
•	MUST support mock now, API later 
Example:
export async function createPayment(payload) {
    // future:
    // return api.post("/payments", payload)

    return await createPaymentMock(payload);
}
________________________________________
STEP 6 — Mock Layer
Create:
paymentMock.js
Rules:
•	MUST simulate async delay (300–500ms) 
•	MUST generate realistic IDs 
•	MUST compute status based on payload 
•	MUST return ticket-ready data 
________________________________________
STEP 7 — Type Definitions
Create:
payment.types.js
Define:
•	PaymentPayload 
•	PaymentResponse 
•	PaymentStatus 
________________________________________
STEP 8 — Integration Rules
You MUST ensure:
•	Existing modules (appointments) use the payments module 
•	No business logic leaks into UI 
•	Hook → Service → Mock flow is preserved 
________________________________________
STEP 9 — Constraints (CRITICAL)
You MUST NOT:
•	Modify existing UI components 
•	Break existing checkout flow 
•	Introduce global state 
•	Mix payments logic inside appointments module 
________________________________________
STEP 10 — Validation
Before finishing:
•	Module is isolated 
•	Service is reusable 
•	Mock works independently 
•	Payments can be used outside appointments 
________________________________________
STEP 11 — Confirmation
Before writing code, summarize:
•	Module purpose 
•	Structure 
•	Public API 
Then WAIT for approval.

