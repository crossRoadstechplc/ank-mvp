"use client";

import type { ReactNode } from "react";

export function PrimaryActionFooter({
  actionLabel,
  action,
  secondary,
}: {
  actionLabel: string;
  action: ReactNode;
  secondary?: ReactNode;
}) {
  return (
    <footer className="fixed inset-x-0 bottom-0 z-30 border-t border-zinc-200/80 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <p className="text-xs text-zinc-500">{actionLabel}</p>
        <div className="flex items-center gap-2">{secondary}</div>
        <div>{action}</div>
      </div>
    </footer>
  );
}
