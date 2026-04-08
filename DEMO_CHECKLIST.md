# Ankuaru Demo Checklist

## Roles To Test
- farmer
- aggregator
- processor
- exporter
- importer
- bank_officer
- transporter
- lab_officer
- admin

## Exact Objects To Open
- `rfq_001`
- `offer_001`
- `ctr_001`
- `ba_001`
- `lab_001`
- `lot_005` (`ETH-4F2A-9C7D-18B3-005`)
- `lot_006`

## Exact Flows To Verify
1. **Role entry + routing**
   - Enter/switch role -> confirm header role + stage label.
2. **Role workflows**
   - Farmer: record provisional pick.
   - Aggregator: validate pending lot.
   - Processor: process with typed loss + mass balance confirmation.
   - Transporter: accept custody confirmation.
3. **Trade chain**
   - RFQ -> Offer -> Linked Lot -> Contract -> Bank -> Lab -> Ready.
4. **Traceability**
   - Open `lot_005`; confirm upstream chain to `farm_001` and `farm_002`.
5. **Integrity**
   - Open `lot_006`; confirm quarantine warning and compromised integrity state.
6. **Admin decoder**
   - Admin only: decode `ETH-4F2A-9C7D-18B3-005`.
   - Non-admin should be blocked.

## Pre-Demo Checks
- `npm run lint`
- `npm run build`
- Verify `Stage 8 — Guided Demo` renders in header.
- Verify charts render for current role dashboard.
- Verify role switcher works in current environment.
- Verify decoder block for non-admin role.

## Risky Areas To Avoid If Unstable
- Avoid random non-scripted lots for full traceability walkthrough.
- Avoid changing dataset assumptions mid-demo (trade flow expects base mock set).
- Avoid relying on decoder unknown-code path (limited explicit error UI).
- Avoid deep unscripted role jumps during guided demo steps.
