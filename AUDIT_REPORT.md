# Ankuaru MVP Demo Readiness Audit

## 1. Executive Summary
- **Overall verdict:** **NEARLY READY**
- **Total score:** **16 / 24**
- **Short summary:** The MVP is stable and role-entry capable (not dependent on login-only UX), with working traceability, quarantine, trade chain, and admin decoder foundations. It is not fully demo-safe yet because some role workflows are only partial, some screens violate strict one-primary-action sequencing, and a few trade/decoder displays are brittle or semi-hardcoded.

## 2. Category Scores
- **app stability:** 2
- **role entry/routing:** 2
- **role workflow completion:** 1
- **lineage/traceability:** 1
- **mass balance:** 1
- **trade flow:** 1
- **bank/lab flow:** 1
- **quarantine logic:** 2
- **admin decoder:** 2
- **UI clarity:** 1
- **demo readiness:** 1
- **role coherence:** 1

## 3. Detailed Findings

### A. App Stability
- **Status:** PASS
- **What passed**
  - App compiles and type-checks (`npm run build` PASS).
  - Lint passes (`npm run lint` PASS).
  - Stage label rendering is implemented globally in header.
  - JSON loader covers all mock datasets used by current flows.
  - Dashboard chart component renders multiple chart types (`bar`, `line`, `pie`, `funnel`).
- **What failed**
  - No direct browser console capture in this pass.
- **What is partial**
  - Mobile usability appears designed for responsiveness but was not fully device-validated in this audit.
- **Exact issues**
  - Missing runtime telemetry panel for quick production-style smoke checks.

### B. Role Entry and Routing
- **Status:** PASS
- **What passed**
  - Role entry exists via dev role switcher drawer and via demo-mode role transitions.
  - Header reflects current role.
  - Stage label remains visible.
  - Role switching updates session context without crashing state.
- **What failed**
  - None critical.
- **What is partial**
  - Routing intent is mostly centralized in one large state controller; maintainability risk.
- **Exact issues**
  - Role transition logic is spread across CTA handlers and demo-step functions, increasing fragility.

### C. Role Workflow Completion
- **Status:** PARTIAL
- **What passed**
  - Farmer can record provisional pick.
  - Aggregator can validate pending lot.
  - Processor can process lot with typed loss + mass balance output.
  - Transporter can accept custody.
  - Admin can access decoder.
  - Importer/exporter/bank/lab can traverse trade flow screens.
- **What failed**
  - Some roles do not have deep role-native workflows (exporter/importer/bank/lab are mostly trade viewers).
- **What is partial**
  - Role action depth is uneven; some roles are complete action flows, others are navigation wrappers.
- **Exact issues**
  - Exporter/importer/bank/lab next-step clarity depends heavily on scripted flow order rather than robust role-specific decision logic.

### D. Truth Engine and Traceability
- **Status:** PARTIAL
- **What passed**
  - Recursive lineage function (`buildLineageNodes`) is relation-driven.
  - `lot_005` can trace to source chain through parent relationships.
  - Opaque `publicLotCode` is preserved; no code-string parsing used for lineage.
- **What failed**
  - General lot-detail truth engine is not uniformly available; trace-rich paneling is focused on selected lots/paths.
- **What is partial**
  - Source farm/farmer rendering exists but is not consistently permission-scoped across all detail contexts.
- **Exact issues**
  - Lineage/detail views are still coupled to targeted demo conditions (`lot_005`, `lot_006`) rather than being fully generalized.

### E. Processing and Mass Balance
- **Status:** PARTIAL
- **What passed**
  - Processor flow exists and validates non-positive values.
  - Typed loss is required.
  - Mass-balance card is shown after processing action.
- **What failed**
  - Multi-loss entry UX is limited (single loss entry in current form).
- **What is partial**
  - Historical processed lots (`lot_004`, `lot_005`) are not presented with full editable/read-only loss breakdown inside the same consistent process screen.
- **Exact issues**
  - Loss type coverage exists in data but input UI does not support full set composition in one interaction.

### F. Trade / Contract / Bank / Lab Flow
- **Status:** PARTIAL
- **What passed**
  - RFQ list/detail, offer detail, contract, bank review, lab result, readiness states exist.
  - Linked lot can be opened from offer path.
  - Contract timeline feel is present.
- **What failed**
  - Some headings are visibly fixed (`Bank Approval BA-001`, `Lab Result LAB-001`) instead of purely selected-record-driven labels.
- **What is partial**
  - Flow currently depends on first-record assumptions in several places (array index based transitions).
- **Exact issues**
  - Trade robustness for non-default datasets is limited.

### G. Integrity Failure and Quarantine
- **Status:** PASS
- **What passed**
  - Quarantine warning for `lot_006` is clearly visible.
  - Integrity compromised/missing validation issue is visible or inferable.
  - System remains usable outside quarantined lot path.
- **What failed**
  - None critical identified.
- **What is partial**
  - Quarantine drill-down is concise; could expose more structured reason metadata.
- **Exact issues**
  - Quarantine reason display is copy-driven; less explicit linkage to specific missing event IDs.

### H. Admin Lot Decoder
- **Status:** PASS
- **What passed**
  - Admin-only access control enforced at screen level.
  - Decoder accepts public lot code and resolves via `lotCodeMap`.
  - Shows internal UUID, traceKey, lineage, source farms/farmers, custody chain, ownership chain.
- **What failed**
  - None critical identified.
- **What is partial**
  - Decoder output is functional but presentation is dense for live storytelling.
- **Exact issues**
  - No explicit “decode failed” state messaging for unknown code beyond empty result.

### I. Sequential UI/UX Quality
- **Status:** PARTIAL
- **What passed**
  - State-driven flow model is used.
  - Most screens provide a clear next CTA.
  - Stage label and role identity are persistent and visible.
- **What failed**
  - Entry screen demo launcher presents multiple parallel CTAs at once (violates strict one-primary-action principle).
- **What is partial**
  - Demo helper adds guidance but can introduce competing action context with screen CTA.
- **Exact issues**
  - Several screens are minimal but not consistently “single dominant action only.”

### J. Demo Readiness
- **Status:** PARTIAL
- **What passed**
  - Full narrative pillars exist: role entry, role actions, lineage, processing, trade chain, quarantine, decoder.
  - Guided demo mode improves explainability.
- **What failed**
  - Not fully deterministic under all operator paths; relies on scripted state assumptions.
- **What is partial**
  - Can be shown in under 3 minutes by an informed operator, but still requires careful path discipline.
- **Exact issues**
  - Demo-mode QA checklist marks fixed “Pass” values and is not bound to actual runtime assertions.

## 4. Demo Blocking Issues
- Multi-CTA launcher/flow points violate strict sequential UX expectation for a live “one next action” demo.
- Traceability UX is not uniformly generalized outside targeted lots; risk when audience asks for non-scripted lot.
- Trade path robustness depends on default-first-record assumptions; fragile under data variation.

## 5. Non-Blocking Improvements
- Add explicit unknown/empty states for decoder and trade records.
- Normalize role dashboard headers and summaries so each role feels clearly unique beyond CTA text.
- Add lightweight dev-only runtime status panel for selected entities and current state.
- Add role-specific badge/microcopy consistency pass.

## 6. Recommended Fix Order

### Critical before demo
1. Enforce one-primary-action UX on entry/demo screens.
2. Replace index/constant-based trade labels with fully selected-record-driven labels.
3. Generalize lot trace detail rendering beyond scripted lots.

### Important polish
1. Improve processor loss entry to support multiple typed losses in one action.
2. Strengthen role workflow depth for importer/exporter/bank/lab.
3. Add explicit error/empty states in decoder and trade chain screens.

### Later improvements
1. Add dev runtime audit panel and step assertions.
2. Add lightweight automated e2e smoke path for demo.
3. Improve visual hierarchy for dense decoder details.

## 7. Best Role-Based Demo Path
1. Enter as importer and show role header + dashboard context.
2. Run trade chain: RFQ -> offer -> linked lot (`lot_005`) -> contract (`ctr_001`) -> bank (`ba_001`) -> lab (`lab_001`) -> readiness.
3. Switch to admin and open `lot_006` quarantine state.
4. Still as admin, open decoder and decode `ETH-4F2A-9C7D-18B3-005`.
5. Show lineage/source trace, then end with QA checklist.

## 8. Final Recommendation
- **ready after minor fixes**
