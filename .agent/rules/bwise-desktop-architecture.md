---
trigger: always_on
---

# BWISE Dental Desktop — Architecture Contract

You are working on the project **BWISE Dental Desktop**.

This is an Electron desktop application with a strict architecture.
You MUST follow the rules below at all times.

---

## High-Level Architecture
- Electron = Native shell & lifecycle
- React (Renderer) = UI and interaction
- Express (Core) = Embedded local backend

Each layer MUST behave as if independently owned.

---

## Electron & Security
- `contextIsolation` MUST be true
- `nodeIntegration` MUST be false
- Renderer MUST NOT import `electron`, `fs`, `child_process`, or Node APIs
- All Renderer ↔ Main communication MUST go through `window.electronAPI`

---

## Renderer Rules
- Pages are orchestrators only (no heavy logic)
- Business logic MUST live in hooks or services
- Services MUST be pure and stateless
- UI components MUST NOT fetch data

---

## State Management
- Global stores are ONLY for auth, identity, and long-lived state
- UI state (modals, inputs, toggles) MUST stay local
- God stores are forbidden

---

## Module Rules
- Every module MUST have an `index.js`
- If it’s not exported from `index.js`, it is PRIVATE
- Deep imports into another module are forbidden

---

## Performance Rules
- Lists > 50 items MUST be virtualized
- Heavy routes/tabs MUST be lazy-loaded
- Fetch only visible data
- Prefer pagination over full loads

---

## Forbidden Anti-Patterns
- Electron or Node APIs in React components
- IPC listeners without cleanup
- Renderer assuming backend availability
- Business logic inside JSX

---

## Conflict Handling
If a request conflicts with this contract:
1. STOP
2. Explain the conflict
3. Ask how to proceed

DO NOT silently violate the architecture.

---

## Refactor Rules (CRITICAL)

These rules apply when modifying existing code.

### Codebase Awareness
- ALWAYS analyze existing files before making changes
- NEVER assume structure — infer it from the codebase
- Identify where logic currently lives before moving it

---

### Minimal Change Principle
- Prefer MODIFYING existing code over rewriting
- Do NOT recreate files unless necessary
- Preserve naming conventions when possible

---

### UI Integrity
- JSX structure MUST remain unchanged unless explicitly allowed
- Styles MUST NOT be modified
- Component hierarchy MUST remain intact

---

### Logic Extraction Rules
- Business logic MUST be extracted into hooks or services
- Services MUST remain pure and stateless
- Hooks orchestrate flow between UI and services

---

### Data Flow Contract
Refactors MUST move toward this structure:

UI → Hook → Service → (Mock | API)

---

### Safe Refactoring
- Do NOT break existing behavior
- Do NOT introduce global state unless explicitly required
- Keep backward compatibility with current flow

---

### File Modification Strategy
- Clearly identify:
  - Files to CREATE
  - Files to MODIFY
- Avoid touching unrelated modules

---

### Validation Before Completion
Before finishing a refactor, verify:

- UI behavior is unchanged
- No broken imports
- No architecture violations
- Data flow follows contract

---

### If Uncertainty Exists
- STOP
- Explain uncertainty
- Ask for clarification

DO NOT guess when refactoring critical logic