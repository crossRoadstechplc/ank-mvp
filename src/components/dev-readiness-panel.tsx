"use client";

import { useAppStore } from "@/store/use-app-store";

export function DevReadinessPanel() {
  const currentState = useAppStore((s) => s.currentState);
  const primaryRole = useAppStore((s) => s.primaryRole);
  const authenticated = useAppStore((s) => s.authenticated);
  const selectedLotId = useAppStore((s) => s.selectedLotId);
  const selectedRfqId = useAppStore((s) => s.selectedRfqId);
  const selectedOfferId = useAppStore((s) => s.selectedOfferId);
  const selectedContractId = useAppStore((s) => s.selectedContractId);
  const selectedBankApprovalId = useAppStore((s) => s.selectedBankApprovalId);
  const selectedLabResultId = useAppStore((s) => s.selectedLabResultId);
  const isDev = process.env.NODE_ENV === "development";

  if (!isDev) return null;

  return (
    <aside className="fixed bottom-3 right-3 z-50 w-72 rounded-xl border border-zinc-300 bg-white/95 p-3 text-xs shadow-lg backdrop-blur">
      <p className="font-semibold text-zinc-900">Internal Readiness</p>
      <div className="mt-2 space-y-1 text-zinc-700">
        <p>screen: {currentState}</p>
        <p>role: {primaryRole ?? "guest"}</p>
        <p>session: {authenticated ? "authenticated" : "anonymous"}</p>
        <p>lot: {selectedLotId ?? "-"}</p>
        <p>rfq: {selectedRfqId ?? "-"}</p>
        <p>offer: {selectedOfferId ?? "-"}</p>
        <p>contract: {selectedContractId ?? "-"}</p>
        <p>bank approval: {selectedBankApprovalId ?? "-"}</p>
        <p>lab result: {selectedLabResultId ?? "-"}</p>
      </div>
    </aside>
  );
}
