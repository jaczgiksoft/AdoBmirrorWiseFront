# OdontogramSection Technical Audit (2026-04-23)

Scope analyzed:
- app/renderer/src/pages/patients/PatientDetail/sections/OdontogramSection.jsx
- app/renderer/src/pages/patients/PatientDetail/sections/components/toothSvgHelpers.js
- app/renderer/src/services/odontogram.service.js
- app/renderer/src/store/useToastStore.js
- app/renderer/src/pages/patients/PatientDetail/sections/VoiceSettingsModal.jsx
- app/renderer/src/components/ExtractionOrders/SingleTooth.jsx
- app/renderer/src/components/feedback/ConfirmDialog.jsx
- app/renderer/src/hooks/useSFX.js

# 🦷 Odontogram Section — Technical Audit (2026-04-23)

## 🔍 Summary

**High-level risk profile:** Medium-to-high for performance in the Electron renderer.

There is a **critical hotspot** related to runtime SVG parsing and serialization occurring inside the render path. In addition, several architectural issues are amplifying unnecessary re-renders and memory churn.

---

## 🧩 Key Findings

- The `OdontogramSection.jsx` component is a **large monolithic module** that combines:
  - UI rendering
  - State orchestration
  - Domain logic (clinical rules)
  - Serialization logic
  - Interaction handling  

  This significantly reduces maintainability and makes performance optimization difficult.

- **Dynamic SVG generation** (DOM parsing, XML serialization, and data URL encoding) is executed inside render paths:
  - Occurs per tooth and per radial menu item
  - Represents the **highest performance risk in the renderer thread**

- The **undo/redo system**:
  - Uses full-state snapshots
  - Relies on deep comparisons for every change  
  This introduces unnecessary CPU usage and memory pressure.

---

## 🚨 Critical Issues

### SVG Parsing and Serialization in Render Path

Dynamic SVG generation:
- Parses and mutates SVG structures at runtime
- Serializes and encodes them into data URLs
- Executes directly within UI rendering flows

**Impact:**
- Blocks the Electron renderer thread
- Causes UI lag during interactions such as hover and menu usage
- Generates large temporary objects and strings that increase memory usage

---

### Expensive State History Strategy (Undo/Redo)

Current implementation:
- Performs deep comparisons on every state change
- Stores full application snapshots (including all odontogram-related data)
- Maintains up to 50 historical states

**Impact:**
- Sustained memory growth
- Increased garbage collection pressure
- Performance degradation during frequent user interactions

---

## ⚠️ Medium Issues

### Asset Lookup Inefficiency
- Repeated linear searches for SVG assets
- Frequent execution increases cumulative cost

---

### Non-Memoized Derived Data
- Derived tooth state objects are recreated frequently
- Especially during hover preview interactions

---

### Unstable Callbacks in Render
- Inline functions created inside mapped component trees
- Causes unnecessary re-renders of child components

---

### Global Callback Mismanagement
- Speech synthesis callbacks are overwritten globally
- No cleanup or restoration on component unmount

---

### Timer and Debug Overhead
- Multiple active timers
- Excessive logging in render and hot paths

---

### Toast System Timer Accumulation
- Each toast schedules its own removal timer
- Potential buildup under high usage

---

## 🧠 Root Causes

- **Tight coupling between UI and domain logic**
  - Clinical rules, rendering, and state mutations coexist in the same component tree

- **Heavy SVG pipeline treated as lightweight UI logic**
  - Expensive operations executed directly in render instead of being cached or precomputed

- **Snapshot-based undo system**
  - Full state duplication instead of incremental or operation-based tracking

---

## 🛠 Recommendations

### SVG Optimization
- Cache combined SVG outputs using deterministic keys
- Avoid regenerating identical assets repeatedly
- Move generation outside render paths

---

### Asset Indexing
- Pre-build lookup maps for SVG assets
- Eliminate repeated linear searches

---

### Undo/Redo Refactor
- Replace full snapshots with operation-based or delta-based history
- Remove deep comparison strategy
- Introduce lighter change tracking mechanisms

---

### Render Stabilization
- Stabilize component props
- Reduce unnecessary re-renders
- Memoize heavy UI components where applicable

---

### Global State Handling
- Properly manage lifecycle of global callbacks
- Ensure cleanup and restoration

---

### Debug and Timer Cleanup
- Remove or guard debug logs in production
- Review and control timer usage

---

## 🔧 Refactor Plan

### Phase 1 — Safe Performance Wins
- Cache SVG generation
- Pre-index asset maps
- Remove render-time debug overhead

---

### Phase 2 — Render Optimization
- Reduce re-render frequency
- Stabilize component inputs and derived data

---

### Phase 3 — Architecture Separation
- Extract domain logic into dedicated modules
- Separate UI rendering from business logic

---

### Phase 4 — History Redesign
- Replace snapshot-based undo system
- Introduce operation-based or delta-based approach
- Validate improvements with memory profiling

---

## 🧪 SVG Processing Analysis

The SVG combination process currently:
- Repeatedly parses and clones SVG structures
- Generates new encoded data URLs for each interaction
- Produces large temporary objects retained in memory

**Impact:**
- Increased memory footprint
- Frequent garbage collection cycles
- Reduced responsiveness under interaction-heavy scenarios

**Recommended approach:**
- Cache results based on deterministic keys
- Reuse previously generated outputs
- Minimize regeneration during UI interactions

---

## 📌 Conclusion

This audit identified a **critical rendering bottleneck** and multiple architectural patterns that negatively impact performance and scalability.

Initial optimizations have already addressed the most severe issue (SVG processing). However, further improvements—especially in state management and rendering stability—are required to achieve a fully optimized and scalable odontogram system.

---

## ✅ Testing & Verification

- Project file structure and dependencies were traced
- SVG processing patterns were analyzed
- State and rendering flows were reviewed
- Audit documentation was added for traceability
