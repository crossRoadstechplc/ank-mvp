# Stage 10 — MVP Hardening

## What changed
- Updated stage label to `Stage 10 — MVP Hardening`.
- Removed demo-only runtime flow from core app state and UI rendering.
- Normalized selected-entity transitions so trade/listing selections are reset consistently when changing contexts.
- Kept login-first entry intact (`auth_login` on fresh session, dashboard on valid persisted session).
- Added consistent missing-record fallbacks already present in major screens and retained them as the default behavior.
- Added a development-only internal readiness panel showing role, session status, current screen, and selected entity IDs.

## What was removed
- Removed `qa_checklist` screen/state from the normal runtime flow.
- Removed demo guidance state and actions from store:
  - `demoMode`
  - `demoPath`
  - `demoStep`
  - `demoHelperText`
  - `startDemoPath`
  - `nextDemoStep`
  - `stopDemoPath`
- Removed in-screen `demoHelper` banner references from `RootScreenController`.

## What still needs later improvement
- Add a small utility layer for selection clearing to reduce repetitive `set` payloads in the store.
- Add targeted integration tests for:
  - selected-record transitions across trade screens
  - admin decoder access guard behavior
  - login persistence + logout reset behavior
- Resolve chart container warnings in responsive contexts where chart width/height can briefly resolve to invalid values.
