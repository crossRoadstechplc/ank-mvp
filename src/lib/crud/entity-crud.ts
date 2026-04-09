import type { LiveDataBundle } from "@/types/mock-data";

export type LiveCollectionKey = keyof LiveDataBundle;

export function getEntityById<T extends { id: string }>(items: T[], id: string): T | undefined {
  return items.find((x) => x.id === id);
}

export function listEntitiesByFilter<T>(items: T[], predicate: (t: T) => boolean): T[] {
  return items.filter(predicate);
}

export function createEntity<T extends { id: string }>(items: T[], entity: T): T[] {
  if (items.some((x) => x.id === entity.id)) return items;
  return [...items, entity];
}

export function updateEntity<T extends { id: string }>(items: T[], id: string, patch: Partial<T>): T[] {
  return items.map((x) => (x.id === id ? { ...x, ...patch } : x));
}

export function upsertEntity<T extends { id: string }>(items: T[], entity: T): T[] {
  const i = items.findIndex((x) => x.id === entity.id);
  if (i === -1) return [...items, entity];
  const next = [...items];
  next[i] = { ...next[i], ...entity };
  return next;
}

export function deleteEntity<T extends { id: string }>(items: T[], id: string): T[] {
  return items.filter((x) => x.id !== id);
}

export function archiveEntity<T extends { id: string; status?: string }>(
  items: T[],
  id: string,
  status: "archived" | "cancelled" | "deleted_soft" | "inactive" = "archived",
): T[] {
  return items.map((x) => (x.id === id ? { ...x, status } : x));
}

export function lotHasLineageLinks(lot: {
  parentLotIds: string[];
  childLotIds: string[];
}): boolean {
  return lot.parentLotIds.length > 0 || lot.childLotIds.length > 0;
}
