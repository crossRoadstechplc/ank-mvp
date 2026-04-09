const DEFAULT_SESSION_STORAGE_KEY = "ankuaru-session-v1";
const DEFAULT_LIVE_STORAGE_KEY = "ankuaru-live-data-v1";

function isMonitorPreviewPath(pathname: string): boolean {
  return pathname.startsWith("/monitor-preview");
}

function readPreviewNamespaceFromUrl(url: URL): string {
  const raw = url.searchParams.get("ns")?.trim();
  if (!raw) return "default";
  return raw.replace(/[^a-zA-Z0-9:_-]/g, "_").slice(0, 64) || "default";
}

export function getRuntimeScope() {
  if (typeof window === "undefined") {
    return { isPreview: false, namespace: "main" as const };
  }
  const url = new URL(window.location.href);
  if (!isMonitorPreviewPath(url.pathname)) {
    return { isPreview: false, namespace: "main" as const };
  }
  return { isPreview: true, namespace: readPreviewNamespaceFromUrl(url) };
}

export function getRuntimeSessionStorageKey(): string {
  const scope = getRuntimeScope();
  if (!scope.isPreview) return DEFAULT_SESSION_STORAGE_KEY;
  return `${DEFAULT_SESSION_STORAGE_KEY}:preview:${scope.namespace}`;
}

export function getRuntimeLiveStorageKey(): string {
  const scope = getRuntimeScope();
  if (!scope.isPreview) return DEFAULT_LIVE_STORAGE_KEY;
  return `${DEFAULT_LIVE_STORAGE_KEY}:preview:${scope.namespace}`;
}
