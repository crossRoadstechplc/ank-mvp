# Test Readiness Summary — Stage 13

**Product:** Ankuaru MVP  
**Stage:** Stage 13 — Full Flow Hardening  
**Date:** 2026-04-09

## What is ready for internal testing

- Login-first entry and role auto-resolution.
- End-to-end role chain including Lab between Transporter and Exporter.
- Live runtime CRUD persistence through Zustand + localStorage.
- Authorized lot lookup through record mapping (non-parsing approach).
- Exporter gating by lab-aware eligibility.
- Admin full-chain decode including lab linkage.
- Dashboard chart normalization with legends/titles/empty states.

## Known weak spots (non-blocking)

- Some chart series remain seed-shaped while KPI tiles are live-driven.
- Lab retest loop is limited (current flow focuses on draft then finalize).
- Ownership-chain depth depends on available transfer events in runtime/session data.

## Exact flows to test

1. Login redirects to role world with no public role picker.
2. Farmer creates/updates/archives multiple fields with GPS and creates a pick.
3. Aggregator validates and receives farmer-origin lot.
4. Aggregator aggregates multiple source lots and preserves parent references.
5. Processor records typed losses and creates output lot(s) with lineage.
6. Transporter accepts custody and completes handoff to lab.
7. Lab sees lot in queue, creates draft result, updates draft, finalizes approved/failed.
8. Exporter sees only lab-cleared eligible lots and links one to trade context.
9. Importer resolves lot code and verifies source/lineage/custody/ownership/lab/trade visibility.
10. Admin decodes lot and verifies complete chain including lab linkage.
11. Refresh browser and verify created runtime entities/mutations persist.
12. Visit each role dashboard and verify chart readability + empty-state behavior.

## Recommended test order

1. Login + role routing
2. Farmer → Aggregator
3. Aggregator → Processor
4. Processor → Transporter
5. Transporter → Lab
6. Lab → Exporter
7. Exporter → Importer trace
8. Admin decode + oversight
9. Persistence and chart checks

## Remaining polish items

- Add optional inline explanation text in exporter queue for why ineligible lots are hidden.
- Add optional lab status chips in more list views (not only detail/trace/decoder views).

---

*Ready for structured internal testing.*
