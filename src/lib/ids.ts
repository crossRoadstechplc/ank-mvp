function randomHex(byteLength: number): string {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("").toUpperCase();
}

export function newInternalUuid(): string {
  return crypto.randomUUID();
}

/** Opaque public code: ETH- + entropy (no region/farmer hints) */
export function newPublicLotCode(): string {
  return `ETH-${randomHex(2)}-${randomHex(2)}-${randomHex(2)}`;
}

export function newTraceKey(): string {
  return `TRC-${randomHex(2)}-${randomHex(2)}`;
}

export function nextPrefixedId(prefix: string, existingIds: string[]): string {
  const re = new RegExp(`^${prefix}_(\\d+)$`);
  let max = 0;
  for (const id of existingIds) {
    const m = id.match(re);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  return `${prefix}_${String(max + 1).padStart(3, "0")}`;
}

export function newFarmUid(): string {
  return `FARM-${randomHex(3)}-${randomHex(2)}`.toUpperCase();
}

export function newRfqUid(): string {
  return `RFQ-${randomHex(2)}-${randomHex(2)}`.toUpperCase();
}

export function newContractUid(): string {
  return `CNT-${randomHex(2)}-${randomHex(2)}`.toUpperCase();
}

export function isoNow(): string {
  return new Date().toISOString();
}
