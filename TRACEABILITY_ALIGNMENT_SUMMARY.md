# Traceability Alignment Summary

**Product:** Ankuaru MVP (frontend-only, Zustand + localStorage)  
**Stage:** Stage 13 — Full Flow Hardening

## Final supported role chain

Farmer → Aggregator → Processor → Transporter → Lab → Exporter → Importer / authorized endpoint user → Admin

## How lots are created and evolve

1. Farmer creates a pick from a selected field/farm (with GPS metadata).
2. Pick creates an origin lot with opaque `publicLotCode` and trace mapping.
3. Aggregator validates and receives farmer-origin lots.
4. Aggregator combines multiple source lots into aggregate lots with parent references.
5. Processor records process losses and creates processed output lots.
6. Transporter accepts custody, then hands lots over to lab.
7. Lab records and finalizes approved/failed outcomes.
8. Exporter sees only lab-cleared, export-eligible lots for reservation/trade linkage.
9. Importer/authorized endpoint can inspect linked lots and chain traceability.
10. Admin can decode and inspect the full chain.

## Farmer picks flowing into aggregator view

Farmer-origin lots enter aggregator validation and receive queues through lot state + custody transitions stored in live data.

## Aggregate lots flowing into processor view

Aggregate lots preserve lineage in `parentLotIds` and become visible in processor intake based on runtime role-relevant status/custody rules.

## Processed lots flowing into transporter view

Processor output lots are marked for transport flow and surfaced as transporter custody candidates.

## Transporter handoff flowing into lab view

Transporter handover updates lot custody/status and emits handoff events; this directly populates the lab intake/testing queue.

## Lab-cleared lots flowing into exporter view

Lab finalization updates lot lab gate and operational status. Exporter lot candidates are filtered by export + lab eligibility rules.

## Endpoint lot lookup behavior

Authorized lookup resolves from `lotCodeMap` and persisted records, not by parsing visible lot code format. It shows lot summary, lineage, farm/farmer origins, custody/ownership chains, lab summary, and linked trade context.

## Authorized visibility model

- Importer/authorized endpoint users see permitted trace details including lab summary.
- Admin sees full decode context including internal identifiers and complete lab linkage.
- Unauthorized roles do not see admin-only decode details.

## Chart normalization

Charts across role dashboards include:
- explicit titles
- legend/indicators
- readable axes/labels where applicable
- clear values/tooltips
- graceful empty states

## Remaining future improvements

- Increase share of fully live-derived chart datasets (beyond current mixed seed/live approach).
- Add optional retest workflow for finalized failed lab outcomes if desired by operations policy.

---

*End of summary.*
