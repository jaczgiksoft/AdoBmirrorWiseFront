---
description: Guides Gemini to create new BWISE Desktop modules following the official architecture, enforcing scope definition, structure, public APIs, and strict separation of responsibilities.
---

# Workflow: Create BWISE Module

You are creating a NEW feature/module for **BWISE Dental Desktop**.

This project follows a strict Electron + React architecture.
You MUST respect the Architecture Contract at all times.

---

## STEP 1 — Clarify Scope (MANDATORY)

Before writing any code, you MUST state:

1. Module name
2. Purpose (1–2 sentences)
3. Whether the module is:
   - SMALL (simple settings / static page)
   - LARGE (complex domain feature like Patients)

DO NOT proceed until this is clear.

---

## STEP 2 — Choose Structure

### If SMALL module:
- Flat structure is allowed
- Still MUST have an `index.js`

Example:

### Example: SMALL module (flat structure)
modules/about/
├── AboutPage.jsx
├── AboutService.js # optional
└── index.js
---

### If LARGE module:
Use this structure as a reference:
### Example: LARGE module (reference structure)

modules/<module-name>/
├── pages/ # Route entry points (orchestrators)
├── components/ # Domain UI components (no data fetching)
├── forms/ # Smart forms (input + submit)
├── hooks/ # Frontend domain logic
├── services/ # API / IPC contracts
├── schemas/ # Validation schemas
├── types/ # Types / DTOs
└── index.js # Public API (ONLY export point)


---

## STEP 3 — Responsibility Rules

- Pages orchestrate only (no heavy logic)
- Hooks contain business / domain logic
- Services are pure and stateless
- Components are visual and reusable
- Forms manage input and submission

---

## STEP 4 — Public API Definition (MANDATORY)

Before coding, define:
- What the module exposes via `index.js`
- What remains private

If it’s not exported, it is PRIVATE.

---

## STEP 5 — Guardrails

You MUST NOT:
- Use Electron or Node APIs in React components
- Deep-import another module’s internals
- Place business logic inside JSX
- Store UI state in global stores

---

## STEP 6 — Confirmation

Before writing code, summarize:
- Module scope
- Chosen structure
- Public API

Only then proceed with implementation.

