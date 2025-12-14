# 🏗️ BWISE Dental Desktop — Architecture

**Version:** 1.0  
**Scope:** Electron Desktop Application  
**Audience:** AI Coding Assistants & Senior Developers  
**Status:** Active / Enforced

---

## 1. Purpose

This document defines the **mandatory architectural rules** for the BWISE Dental Desktop application.

Its goals are to:
- Preserve security, stability, and scalability
- Prevent architectural drift
- Ensure AI-generated code follows the same standards as human-written code

This is a **rule-based standard** (MUST / MUST NOT). It is not a suggestion guide.

---

## 2. High-Level Architecture

BWISE Dental Desktop is a **Hybrid Monolithic Desktop Application**:

- **Electron** → Native shell & lifecycle
- **React (Renderer)** → UI & user interaction
- **Express (Core)** → Embedded local backend

Although bundled, **each layer MUST behave as if independently owned**.

---

## 3. Layer Responsibilities (STRICT)

### 🧠 Electron Main
**Responsible for:**
- App lifecycle
- Window & tray management
- Starting/supervising the backend
- Native integrations (printers, file system, dialogs)

**MUST NOT:**
- Contain UI logic
- Import Renderer code
- Implement business/domain logic

---

### 🔐 Preload
**Responsible for:**
- Defining the ONLY allowed communication surface between Renderer and Main

**MUST:**
- Use `contextIsolation: true`
- Use `nodeIntegration: false`
- Expose APIs via `window.electronAPI`
- Whitelist IPC channels explicitly

**MUST NOT:**
- Expose raw Electron/Node APIs
- Contain business or UI logic

---

### 🖥️ Renderer (React)
**Responsible for:**
- UI composition
- User interaction
- Local UI state
- Calling backend APIs

**MUST NOT:**
- Import `electron`, `fs`, `child_process`, or Node APIs
- Access IPC directly
- Assume backend availability
- Place complex logic inside JSX

---

### ⚙️ Core (Backend)
**Responsible for:**
- Business rules
- Data persistence
- Offline-first logic

**OUT OF SCOPE**, except where it affects:
- Startup behavior
- Crash impact on Electron
- Communication contracts

---

## 4. Communication Rules (NON-NEGOTIABLE)

### Renderer ↔ Main
- MUST go through `window.electronAPI`
- IPC listeners MUST be cleaned up
- No `ipcRenderer.on` in React without cleanup

### Renderer ↔ Backend
- Communication via **HTTP to localhost**
- Renderer MUST handle backend unavailable states
- Renderer MUST NOT assume backend is always alive

---

## 5. State Management Rules

### 🌐 Global State
Use global stores **only** for:
- Authentication/session
- User identity
- Long-lived app state

**MUST NOT:**
- Store transient UI state (modals, inputs, toggles)
- Become a “God Store”

### 🧩 Local State
- Forms
- UI toggles
- Component-specific logic

**MUST live in:**
- Component state
- Feature-local hooks

---

## 6. Feature Module Design (Blueprint)

Large features (e.g., **Patients**) follow **principles**, not rigid structures:

- **Pages (Orchestrators):** read params, connect hooks to layouts; no heavy logic
- **Domain Components:** visual, domain-aware, no data fetching
- **Forms:** manage input/dirty/submit; isolated from pages
- **Hooks:** frontend domain logic (loading, errors, derived state, orchestration)
- **Services:** pure, stateless API/IPC calls

### Cross-Module Interaction
**Allowed:**
- ID-based linking
- Events/signals
- Shared “minified” types
- Explicit services

**Forbidden:**
- Importing another module’s internal components
- Mutating another module’s store
- Deep imports into module internals

---

## 7. Target Folder Structure (Reference)

```text
src/
  modules/
    patients/
      components/   # Domain UI components
      features/     # Large sub-domains (only if needed)
      forms/        # Smart form wrappers
      hooks/        # Frontend domain logic
      pages/        # Route entry points
      services/     # API / IPC contracts
      schemas/      # Validation schemas
      types/        # Types / DTOs
      index.js      # Public API (ONLY export point)
```

## Module Rules

- Every module **MUST** have an `index.js`
- If it’s not exported from `index.js`, it is **private**
- Small modules **may be flattened** to avoid over-structuring

---

## 8. Performance Rules

- Lists with **more than 50 items MUST be virtualized**
- Heavy routes or tabs **MUST be lazy-loaded**
- Fetch **only visible data** (no “load all” strategies)
- **Pagination is preferred** over full data loads

---

## 9. Forbidden Anti-Patterns

The following patterns are **explicitly forbidden**:

- Importing Electron or Node APIs inside React components
- “God stores” mixing UI, session, and hardware state
- IPC listeners registered without proper cleanup
- Renderer code assuming backend availability
- Business or transformation logic written directly inside JSX

---

## 10. Adoption & Roadmap

### NOW (Weeks 1–4)

- Enforce architecture standards for **new code only**
- Audit IPC usage and enforce `window.electronAPI`
- Add virtualization to the longest lists
- Stop adding UI state to global stores

---

### NEXT (Months 1–3)

- De-bloat the largest files using hooks and components
- Enforce public module interfaces (`index.js`)
- Lazy-load heavy routes and feature tabs

---

### LATER (Month 4+)

- Backend process isolation
- Robust database migrations
- Optional offline sync
- Design System v2 (shared package)

---

## 11. AI Coding Rules

AI-generated code **MUST**:

- Respect architectural layer boundaries
- Avoid deep imports into module internals
- Use services and hooks (no inline business logic)
- Follow this document **strictly**

When in doubt:  
**clarity and separation over convenience**.
