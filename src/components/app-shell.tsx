"use client";

import { type ReactNode, useEffect, useState } from "react";

import { DevReadinessPanel } from "@/components/dev-readiness-panel";
import { StageHeader } from "@/components/stage-header";
import { useAppStore } from "@/store/use-app-store";

export function LoadingScreen() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center px-6">
      <div className="text-center">
        <p className="text-base font-medium text-zinc-900">Loading workspace</p>
        <p className="mt-2 text-sm text-zinc-500">Preparing stage data...</p>
      </div>
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="mx-auto flex min-h-[50vh] w-full max-w-xl items-center justify-center px-6">
      <div className="w-full rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm">
        <h2 className="text-lg font-semibold text-zinc-900">{title}</h2>
        <p className="mt-2 text-sm text-zinc-600">{description}</p>
        {action ? <div className="mt-6">{action}</div> : null}
      </div>
    </div>
  );
}

export function AppShell({
  children,
  suppressDevReadinessPanel = false,
}: {
  children: ReactNode;
  suppressDevReadinessPanel?: boolean;
}) {
  const loadAllMockData = useAppStore((s) => s.loadAllMockData);
  const hydrateLiveData = useAppStore((s) => s.hydrateLiveData);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    loadAllMockData();
  }, [loadAllMockData]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const id = window.setInterval(() => {
      hydrateLiveData();
    }, 5000);
    return () => window.clearInterval(id);
  }, [mounted, hydrateLiveData]);

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <StageHeader />
      {mounted && !suppressDevReadinessPanel ? <DevReadinessPanel /> : null}
      <main className="w-full px-4 pb-24 pt-20 sm:px-6">{children}</main>
    </div>
  );
}
