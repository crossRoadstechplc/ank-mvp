"use client";

import { Button } from "@/components/ui/button";
import { useAppStore } from "@/store/use-app-store";

export function StageHeader() {
  const stageLabel = useAppStore((s) => s.stageLabel);
  const role = useAppStore((s) => s.role);
  const authenticated = useAppStore((s) => s.authenticated);
  const logout = useAppStore((s) => s.logout);

  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-zinc-200/80 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
        <div>
          <p className="text-xs font-medium tracking-wide text-zinc-500">{stageLabel}</p>
          <p className="text-sm font-semibold text-zinc-900">Ankuaru</p>
        </div>
        <div className="flex items-center gap-3">
          <p className="text-xs text-zinc-600">{role ? `Role: ${role}` : "Role: Guest"}</p>
          {authenticated ? (
            <Button
              type="button"
              onClick={logout}
              className="h-8 rounded-lg border border-zinc-300 bg-white px-3 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-100"
            >
              Logout
            </Button>
          ) : null}
        </div>
      </div>
    </header>
  );
}
