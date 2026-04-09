import type { Lot } from "@/types/mock-data";

export function LineageTree({ lotId, lots, level }: { lotId: string; lots: Lot[]; level: number }) {
  const lot = lots.find((item) => item.id === lotId);
  if (!lot) return null;

  return (
    <div className={`${level > 0 ? "ml-4 border-l border-zinc-200 pl-3" : ""} space-y-2`}>
      <div className="rounded-xl bg-zinc-50 p-3">
        <p className="text-sm font-medium text-zinc-900">{lot.id}</p>
        <p className="text-xs text-zinc-500">{lot.publicLotCode}</p>
      </div>
      {lot.parentLotIds.map((parentId) => (
        <LineageTree key={`${lot.id}-${parentId}`} lotId={parentId} lots={lots} level={level + 1} />
      ))}
    </div>
  );
}

export function buildLineageNodes(
  rootLotId: string,
  lots: Lot[],
  visited: Set<string> = new Set(),
): { lot: Lot }[] {
  const lot = lots.find((item) => item.id === rootLotId);
  if (!lot || visited.has(rootLotId)) return [];
  visited.add(rootLotId);

  const children = lot.parentLotIds.flatMap((parentId) => buildLineageNodes(parentId, lots, visited));
  return [{ lot }, ...children];
}
