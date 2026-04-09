export const SUPPORTED_INVENTORY_EVENT_TYPES = [
  "PICK",
  "VALIDATE_PICK",
  "RECEIVE",
  "TRANSFER_CUSTODY",
  "TRANSFER_OWNERSHIP",
  "AGGREGATE",
  "DISAGGREGATE",
  "PROCESS_PULP_AND_WASH",
  "PROCESS_HULL_AND_GRADE",
  "QUARANTINE",
  "RELEASE_QUARANTINE",
  "HANDOVER_TO_LAB",
] as const;

export type SupportedInventoryEventType = (typeof SUPPORTED_INVENTORY_EVENT_TYPES)[number];

export function isSupportedEventType(t: string): t is SupportedInventoryEventType {
  return (SUPPORTED_INVENTORY_EVENT_TYPES as readonly string[]).includes(t);
}
