# Stage 11 — Runtime CRUD & Mutable Data (Summary)

## Local persistence model

- **Seed (read-only):** JSON under `src/mock-data/*.json` is loaded via [`loadMockData()`](src/lib/mock-data-loader.ts) into `seedData` in the Zustand store. `app` and `roles` always come from seed when building the merged bundle.
- **Live (mutable):** All other collections are copied into `liveData` (`LiveDataBundle` = `MockDataBundle` without `app` / `roles`). CRUD mutates `liveData` only.
- **Merged read model:** `data` in the store is `mergeLiveWithSeed(seedData, liveData)` so existing UI keeps using a full `MockDataBundle`.
- **Storage keys:**
  - `ankuaru-live-data-v1` — JSON envelope `{ version: 1, payload: LiveDataBundle }` (written on each live mutation).
  - `ankuaru-session-v1` — Zustand `persist` for session fields only (unchanged pattern).
- **Helpers:** `resetLiveDataToSeed`, `exportLiveDataSnapshot`, `clearLocalState`, `hydrateLiveData` on the store. **Logout does not clear live data** (single-browser MVP; dataset is shared until reset/clear).
- **Dev-only tools:** [`DevReadinessPanel`](src/components/dev-readiness-panel.tsx) (admin role) exposes reset, copy snapshot, and clear local state.

## Entities with runtime CRUD (high level)

| Area | Actions |
|------|---------|
| **Farms / fields** | Farmer: create, update, archive (via `archiveFarmField` → `status: archived`). Zod: [`farmFieldFormSchema`](src/lib/schemas/forms.ts). |
| **Lots** | Farmer: create cherry lot from own field, edit provisional (weight/notes), cancel without lineage hard-delete. Processor: process with typed losses → **child output lot** + parent `consumed`. Aggregator: validate, receive, aggregate. Admin: quarantine / release. Exporter: export reservation label on lot. |
| **Inventory events** | Created by domain actions (`PICK`, `VALIDATE_PICK`, `RECEIVE`, `AGGREGATE`, `PROCESS_*`, `TRANSFER_CUSTODY`, `QUARANTINE`, `RELEASE_QUARANTINE`, etc.). `appendInventoryEvent` for supported types. |
| **RFQs** | Importer: create draft, update title (edit screen), archive draft. |
| **Offers** | Exporter: create draft linked to RFQ + lot. |
| **Bank approvals** | Bank officer: update guarantee fields, status, exposure notes. |
| **Lab results** | Lab officer: create pending result, update while not final/approved, finalize (`status: final`). |
| **Admin hub** | Search + soft archive on selected collections (`farms`, `facilities`, `lots`, `inventoryEvents`, `rfqs`, `contracts`, `bankApprovals`, `labResults`). |
| **`lotCodeMap`** | Appended when new lots are created (farmer pick, aggregate, process output). |

Generic helpers live in [`src/lib/crud/entity-crud.ts`](src/lib/crud/entity-crud.ts); IDs in [`src/lib/ids.ts`](src/lib/ids.ts).

## Farmer field / GPS model

- Reuses and extends [`Farm`](src/types/mock-data.ts): optional `notes`, optional audit fields (`createdAt`, `updatedAt`, `createdBy`, `updatedBy`).
- **Coordinates:** `coordinates.lat` / `coordinates.lng` with Zod range checks.
- **Polygon:** Optional `[lng, lat][]` in JSON (advanced textarea on **New field**). UI lists vertex count per field.
- **Screens:** `farmer_fields`, `farmer_field_new`, `farmer_field_edit`; dashboard accordion **Field & lot actions**; **My lots** lists origin lots and opens full lot detail.

## Processor enhancements

- Loss types include **`other`**.
- **Process context** (collapsed): process type (`PROCESS_PULP_AND_WASH` | `PROCESS_HULL_AND_GRADE`), optional facility, output grade, notes.
- **Output:** New **child parchment lot** (`ready_for_export`); parent gets `childLotIds` update and `status: consumed`. Mass balance + optional `lastOutputLotId` on confirmation screen.

## Decoder

- Resolves codes via **`lotCodeMap` first**, then **direct `lots.publicLotCode` match** (runtime-created codes).
- Custody / ownership chains show **actor display names** when available.

## Architectural notes

- Store implementation: [`src/store/use-app-store.ts`](src/store/use-app-store.ts) with slices (session, app, data, UI, CRUD-style actions). Screen meta: [`src/store/state-meta.ts`](src/store/state-meta.ts).
- Lineage UI extracted to [`src/components/lot-lineage-tree.tsx`](src/components/lot-lineage-tree.tsx).
- **Stage label:** `Stage 11 — Runtime CRUD & Mutable Data` (in store, shown in header).

## Remaining limitations

- No backend; all roles share one browser’s `localStorage` dataset.
- **Permissions** are enforced in store actions, but not every button is double-gated in UI (failures return messages from the store).
- `dashboardMetrics` JSON is not recomputed after CRUD; KPIs use **derived counts** when mock metrics are absent.
- Admin archive semantics are **MVP** (`status: archived` / `archived` entity helper); not full compliance workflow.
- No real map rendering—GPS/polygon shown as text summaries and optional JSON editor.
- Lab / bank forms use pragmatic defaults (e.g. contract picker for new lab rows).
