---
description: Intelligent refactor of existing feature using codebase awareness
---

When user types `/refactor <task>`:

## STEP 1 — Codebase Discovery (MANDATORY)

Act as Product Manager + Architect.

You MUST:

1. Scan the project structure
2. Identify relevant files for the feature:
   - hooks
   - components
   - services
   - mocks

3. Infer current architecture:
   - Where logic lives
   - Where data is handled
   - Any anti-patterns

---

## STEP 2 — Build Refactor Plan

Create:

`production_artifacts/Refactor_Spec.md`

### MUST include:

#### Current State
- Where logic is located
- Problems found

#### Target Architecture
UI → Hook → Service → (Mock | API)

#### Refactor Strategy
- What logic will be extracted
- What abstractions will be introduced
- What responsibilities will be reassigned

#### File Map
- Files to create
- Files to modify

#### Constraints
- DO NOT change UI
- DO NOT break components
- KEEP behavior identical

---

Save file.

Then STOP and ask:

"Do you approve this refactor plan?"

WAIT for approval.

---

## STEP 3 — Smart Refactor Execution

Act as Engineer.

You MUST:

1. Modify ONLY necessary files
2. Preserve JSX structure EXACTLY
3. Extract business logic into:
   - hooks
   - services
   - utilities (if needed)

4. Introduce a clear action handler:
   (e.g. submit, update, create, delete)

5. Ensure data flows through a service layer

---

## STEP 4 — QA Validation

Act as QA.

You MUST:

- Compare before/after behavior
- Ensure UI untouched
- Ensure separation of concerns
- Ensure no broken imports
- Ensure async flow works