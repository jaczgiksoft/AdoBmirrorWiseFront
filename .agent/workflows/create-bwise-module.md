---
description: Create a new BWISE module following strict architecture
---

When user types `/create-module <description>`:

1. Act as **Product Manager**

   - Execute planning based on BWISE architecture
   - Define:
     - Module name
     - Purpose
     - Size (SMALL or LARGE)
     - Folder structure
     - Public API

   - Save to:
     `production_artifacts/Module_Spec.md`

   - WAIT for approval

---

2. Act as **Full-Stack Engineer**

   - Read `Module_Spec.md`
   - Generate module inside:
     `app_build/src/modules/`

   - Respect ALL rules:
     - No logic in JSX
     - No Electron in UI
     - Clean separation

---

3. Act as **QA Engineer**

   - Validate:
     - Architecture compliance
     - Imports
     - Separation of concerns
     - Hook/service boundaries

   - Fix issues if found