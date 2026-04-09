"use client";

import { Button } from "@/components/ui/button";
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
  const resetLiveDataToSeed = useAppStore((s) => s.resetLiveDataToSeed);
  const exportLiveDataSnapshot = useAppStore((s) => s.exportLiveDataSnapshot);
  const clearLocalState = useAppStore((s) => s.clearLocalState);
  const isDev = process.env.NODE_ENV === "development";
  const isRoleMonitorScreen = currentState === "admin_role_monitor";
  const isMonitorPreviewRoute =
    typeof window !== "undefined" && window.location.pathname.startsWith("/monitor-preview");

  if (!isDev || isRoleMonitorScreen || isMonitorPreviewRoute) return null;

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
      {primaryRole === "admin" ? (
        <div className="mt-3 space-y-1 border-t border-zinc-200 pt-2">
          <p className="font-medium text-zinc-800">Local data tools</p>
          <Button type="button" className="h-7 w-full text-xs" onClick={() => resetLiveDataToSeed()}>
            Reset to seed
          </Button>
          <Button
            type="button"
            className="h-7 w-full border border-zinc-200 bg-white text-xs text-zinc-900 hover:bg-zinc-100"
            onClick={() => {
              const blob = exportLiveDataSnapshot();
              void navigator.clipboard.writeText(blob);
            }}
          >
            Copy live snapshot
          </Button>
          <Button
            type="button"
            className="h-7 w-full border border-red-200 bg-red-50 text-xs text-red-900 hover:bg-red-100"
            onClick={() => {
              if (typeof window !== "undefined" && window.confirm("Clear all local persisted data and session?")) {
                clearLocalState();
              }
            }}
          >
            Clear local state
          </Button>
        </div>
      ) : null}
    </aside>
  );
}
