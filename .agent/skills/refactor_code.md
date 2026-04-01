# Skill: Intelligent Refactor

## Objective
Refactor existing code using minimal, surgical changes.

## Rules
- NEVER rewrite entire files unnecessarily
- NEVER touch JSX structure
- ONLY move logic where needed
- KEEP behavior identical

---

## Instructions

### 1. Locate Relevant Files
- Find hook (e.g. useCheckout.js)
- Find related components
- Identify where payment logic exists

---

### 2. Analyze Current Logic
- Identify inline logic
- Detect duplicated logic
- Detect missing abstraction

---

### 3. Extract Logic

Create:

#### Service Layer
src/services/paymentService.js

#### Mock Layer
src/mocks/paymentMock.js

---

### 4. Refactor Hook

- Extract:
  handleSubmitPayment()

- Build payload:

{
patient_id,
source_type,
source_id,
method,
total,
received,
items
}

- Call:
createPayment(payload)

---

### 5. Minimal Changes Strategy

- Keep same variable names if possible
- Keep same flow
- Do NOT restructure component tree

---

### 6. Future Ready

Structure service like:

// future
// return api.post(...)