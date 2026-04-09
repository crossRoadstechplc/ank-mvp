import type { Lot, LotCodeMapItem } from "@/types/mock-data";

/**
 * Resolve a user-entered public lot code to an internal lot id.
 * Uses the authoritative lotCodeMap first, then a direct record match on Lot.publicLotCode.
 * Does not parse or infer structure from the code string beyond equality matching.
 */
export function resolveLotIdFromPublicCode(
  rawCode: string,
  lotCodeMap: LotCodeMapItem[],
  lots: Lot[],
): string | null {
  const code = rawCode.trim();
  if (!code) return null;
  const mapped = lotCodeMap.find((row) => row.publicLotCode === code);
  if (mapped) return mapped.lotId;
  const direct = lots.find((l) => l.publicLotCode === code);
  return direct?.id ?? null;
}
