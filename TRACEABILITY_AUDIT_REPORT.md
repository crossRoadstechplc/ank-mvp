# Traceability Audit Report — Ankuaru MVP (Frontend-Only)

**Stage:** Stage 13 — Full Flow Hardening  
**Date:** 2026-04-09  
**Scope:** Full operational chain with Lab inserted between Transporter and Exporter.

## Overall verdict

The MVP is now aligned to a full frontend-only operational chain:

**Farmer → Aggregator → Processor → Transporter → Lab → Exporter → Importer/authorized endpoint → Admin**

Live runtime state, not seed JSON, is the source for operational continuity. The Lab step now gates exporter eligibility, is visible in authorized lookup, and is inspectable by admin.

## What is already aligned

- Login-first flow with role auto-resolution.
- Immutable seed + mutable Zustand `liveData` + localStorage persistence.
- Opaque lot code resolution through `lotCodeMap` and record links (not code parsing).
- Lot lineage and timeline through `parentLotIds`, `childLotIds`, and `inventoryEvents`.
- Role-based dashboards and sequential, primary-CTA UX.

## What was missing (before Stage 13 hardening)

- Lab step was not enforced as a distinct transport handoff destination.
- Exporter eligibility did not fully require lab-cleared status.
- Importer/admin trace views did not consistently expose lab linkage.
- Transporter flow needed explicit split between pickup and handover-to-lab.

## What was refactored

- Added normalized lab gating helpers and queue/eligibility logic in `src/lib/lab-flow.ts`.
- Added `labStatus` support on lots and optional `notes` on lab results in types.
- Added `HANDOVER_TO_LAB` to inventory event matrix.
- Extended lab form schema for optional trade context (`contractId`).
- Refactored store mutations for:
  - transporter custody accept → in transit
  - transporter handover to lab → lab intake + lab custodian
  - lab draft creation/update/finalize
  - lot status transitions from lab result outcomes
- Refactored screen controller for:
  - transporter pickup vs handover queues
  - dedicated lab queue and lab result finalization actions
  - exporter filtering by lab-cleared eligibility
  - generalized lot detail lab verification block
  - importer authorized lookup with lab result summary
  - admin decoder with explicit lab linkage section
- Updated stage label to **Stage 13 — Full Flow Hardening**.
- Added `lab_dashboard` seed metrics section and fixed JSON validity.

## Role-by-role audit

- **Farmer:** Multi-field + GPS workflows and pick/origin lot creation remain aligned.
- **Aggregator:** Sees farmer-origin flow, validates/receives, aggregates with preserved parent references.
- **Processor:** Processes aggregate lots, records typed losses, outputs transport-eligible child lots with lineage.
- **Transporter:** Accepts custody and hands over to lab with explicit event and lot status updates.
- **Lab:** Receives intake queue after transporter handoff, records draft result, finalizes approved/failed outcomes.
- **Exporter:** Sees only runtime-eligible lots after lab gate; can reserve and link lots to trade context.
- **Importer / authorized endpoint:** Can resolve lot code and inspect lineage/custody/ownership/trade + lab summary.
- **Admin:** Full decode and full-chain trace, including lab linkage.

## Data model audit

Live data supports required entities:
- users, actors, organizations, farms/fields, facilities, vehicles, drivers
- lots, inventoryEvents
- rfqs, offers, auctions, contracts, bankApprovals
- labResults
- lotCodeMap
- dashboardMetrics

Lot and lab-result models now support the Stage 13 lab gate and downstream linkage requirements.

## CRUD audit

All core role mutations update Zustand live data and persist to localStorage. JSON files remain immutable seed inputs.

## Live role-to-role flow audit

1. Farmer pick/origin lot appears for aggregator validation/receive.
2. Aggregation output appears for processor intake.
3. Processor output appears for transporter custody candidates.
4. Transporter handover to lab makes lots visible in lab queue.
5. Lab finalize outcome controls exporter visibility/eligibility.
6. Export-linked lots are visible in importer trace flow.
7. Timeline and chain details include handoffs and lab linkage.

## Lab step audit

- Lab dashboard has queue and status-focused actions.
- Queue logic is based on lot status/custody + normalized lab gate.
- Result lifecycle supports draft update and finalized approved/failed outcomes.
- Finalized lab outcomes update lot status and affect exporter eligibility.
- Lab result summaries appear in lot detail, importer trace, and admin decoder.

## Traceability lookup audit

- Importer/authorized lookup resolves by mapping + stored records.
- Unknown-code states handled gracefully.
- Admin decoder exposes additional internal fields and lab linkage.
- No truth is derived from parsing visible lot code strings.

## Market linkage audit

- Exporter lot-to-offer linkage remains runtime-driven.
- Importer trade-path inspection now includes lab context where available.

## Chart audit

Chart normalization remains in place:
- titles, legends, readable labels/axes, tooltips/value clarity
- empty-state handling for no-data charts

## Final blockers

No blocking issues were found for Stage 13 structured testing readiness. Remaining opportunities are non-blocking UX polish and deeper live-derived chart modeling.
