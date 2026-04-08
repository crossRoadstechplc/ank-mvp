"use client";

import { AppShell } from "@/components/app-shell";
import { RootScreenController } from "@/components/root-screen-controller";

export default function Home() {
  return (
    <AppShell>
      <RootScreenController />
    </AppShell>
  );
}
