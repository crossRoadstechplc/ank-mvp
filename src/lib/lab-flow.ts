import type { LabResult, Lot } from "@/types/mock-data";

/** Post-process transport / lab gate before export trade */
export type LotLabStatus =
  | "none"
  | "pending_transport"
  | "in_transit"
  | "at_lab"
  | "lab_cleared"
  | "lab_failed";

export function normalizeLotLabStatus(lot: Lot): LotLabStatus {
  const e = lot.labStatus;
  if (
    e === "pending_transport" ||
    e === "in_transit" ||
    e === "at_lab" ||
    e === "lab_cleared" ||
    e === "lab_failed" ||
    e === "none"
  ) {
    return e;
  }
  if (lot.status === "awaiting_transport") return "pending_transport";
  if (lot.status === "in_transit") return "pending_transport";
  if (lot.status === "lab_intake") return "at_lab";
  if (lot.status === "lab_rejected") return "lab_failed";
  if (lot.status === "ready_for_export" || lot.status === "contract_reserved") return "lab_cleared";
  return "none";
}

export function isLotQuarantinedOrCompromised(lot: Lot): boolean {
  return lot.status === "quarantined" || lot.integrityStatus === "compromised";
}

/** Processor output: awaiting pickup by transporter */
export function isAwaitingTransport(lot: Lot): boolean {
  return lot.status === "awaiting_transport" && normalizeLotLabStatus(lot) === "pending_transport";
}

/** Transporter may accept from prior custodian (e.g. processor) */
export function canTransporterAcceptLot(lot: Lot, transporterActorId: string): boolean {
  if (isLotQuarantinedOrCompromised(lot)) return false;
  if (lot.currentCustodianActorId === transporterActorId) return false;
  return lot.status === "awaiting_transport" && normalizeLotLabStatus(lot) === "pending_transport";
}

/** Transporter hands off to lab */
export function canTransporterHandoverToLab(lot: Lot, transporterActorId: string): boolean {
  if (isLotQuarantinedOrCompromised(lot)) return false;
  return (
    lot.currentCustodianActorId === transporterActorId &&
    lot.status === "in_transit" &&
    normalizeLotLabStatus(lot) === "pending_transport"
  );
}

/** Lab testing queue */
export function isLabIntakeLot(lot: Lot, labActorId: string): boolean {
  if (isLotQuarantinedOrCompromised(lot)) return false;
  return (
    lot.currentCustodianActorId === labActorId &&
    normalizeLotLabStatus(lot) === "at_lab" &&
    lot.status === "lab_intake"
  );
}

export function hasFinalLabOutcomeForLot(lotId: string, labResults: LabResult[]): boolean {
  return labResults.some(
    (r) =>
      r.lotId === lotId &&
      (r.status === "approved" || r.status === "failed" || r.status === "final"),
  );
}

/** Exporter offers / reservation: lab-cleared export states only */
export function isExportTradeEligibleLot(lot: Lot, labResults: LabResult[]): boolean {
  if (isLotQuarantinedOrCompromised(lot)) return false;
  if (lot.status !== "ready_for_export" && lot.status !== "contract_reserved") return false;
  const lab = normalizeLotLabStatus(lot);
  if (lab === "lab_failed") return false;
  if (lab === "lab_cleared") return true;
  /** Legacy: export status + approved lab row */
  const row = labResults.find((r) => r.lotId === lot.id);
  if (row && (row.status === "approved" || row.status === "final")) return true;
  return false;
}

export function labResultSummaryForLot(lotId: string, labResults: LabResult[]): LabResult | null {
  const rows = labResults.filter((r) => r.lotId === lotId);
  if (!rows.length) return null;
  const terminal = rows.find((r) => r.status === "approved" || r.status === "failed" || r.status === "final");
  return terminal ?? rows[rows.length - 1] ?? null;
}
