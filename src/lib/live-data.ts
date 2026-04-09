import type { LiveDataBundle, MockDataBundle } from "@/types/mock-data";
import { getRuntimeLiveStorageKey } from "@/lib/runtime-scope";

export const LIVE_STORAGE_KEY = "ankuaru-live-data-v1";
export const LIVE_STORAGE_VERSION = 1;

export interface LiveStorageEnvelope {
  version: number;
  payload: LiveDataBundle;
}

export function cloneLiveFromSeed(seed: MockDataBundle): LiveDataBundle {
  const { app: _a, roles: _r, ...rest } = seed;
  return structuredClone(rest) as LiveDataBundle;
}

export function mergeLiveWithSeed(seed: MockDataBundle, live: LiveDataBundle): MockDataBundle {
  return {
    ...live,
    app: seed.app,
    roles: seed.roles,
  };
}

export function readLiveDataFromStorage(): LiveDataBundle | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(getRuntimeLiveStorageKey());
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LiveStorageEnvelope;
    if (parsed.version !== LIVE_STORAGE_VERSION || !parsed.payload) return null;
    return parsed.payload;
  } catch {
    return null;
  }
}

export function writeLiveDataToStorage(live: LiveDataBundle): void {
  if (typeof window === "undefined") return;
  const envelope: LiveStorageEnvelope = {
    version: LIVE_STORAGE_VERSION,
    payload: live,
  };
  localStorage.setItem(getRuntimeLiveStorageKey(), JSON.stringify(envelope));
}

export function clearLiveStorage(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(getRuntimeLiveStorageKey());
}

export async function readLiveDataFromApi(): Promise<LiveDataBundle | null> {
  if (typeof window === "undefined") return null;
  try {
    const response = await fetch("/api/live-data", { cache: "no-store" });
    if (!response.ok) return null;
    const parsed = (await response.json()) as LiveStorageEnvelope;
    if (parsed.version !== LIVE_STORAGE_VERSION || !parsed.payload) return null;
    return parsed.payload;
  } catch {
    return null;
  }
}

export async function writeLiveDataToApi(live: LiveDataBundle): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    const envelope: LiveStorageEnvelope = {
      version: LIVE_STORAGE_VERSION,
      payload: live,
    };
    await fetch("/api/live-data", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(envelope),
    });
  } catch {
    // Best-effort sync only; local cache remains source of truth when offline.
  }
}
