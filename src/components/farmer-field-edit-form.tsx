"use client";

import dynamic from "next/dynamic";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import type { AppScreenState } from "@/store/state-meta";
import type { Farm } from "@/types/mock-data";

const FarmerFieldMapPicker = dynamic(
  () =>
    import("@/components/farmer-field-map-picker").then((mod) => mod.FarmerFieldMapPicker),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-64 items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50 text-sm text-zinc-500">
        Loading map…
      </div>
    ),
  },
);

export function FarmerFieldEditForm({
  ef,
  selectedFarmId,
  updateFarmField,
  archiveFarmField,
  goToState,
}: {
  ef: Farm;
  selectedFarmId: string;
  updateFarmField: (farmId: string, patch: Partial<Farm>) => { ok: boolean; message: string };
  archiveFarmField: (farmId: string) => { ok: boolean; message: string };
  goToState: (s: AppScreenState) => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState(ef.name);
  const [notes, setNotes] = useState(ef.notes ?? "");
  const [lat, setLat] = useState(String(ef.coordinates.lat));
  const [lng, setLng] = useState(String(ef.coordinates.lng));
  const [mapPolygon, setMapPolygon] = useState<[number, number][]>(() => [...(ef.polygon ?? [])]);

  const latN = Number(lat);
  const lngN = Number(lng);
  const polygonForMap = mapPolygon.length >= 3 ? mapPolygon : null;

  return (
    <div className="mx-auto mt-10 w-full max-w-3xl space-y-4 rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
      <h1 className="text-xl font-semibold text-zinc-900">Edit {ef.name}</h1>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm"
        placeholder="Field name"
      />
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={2}
        className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm"
        placeholder="Notes"
      />
      <div className="grid grid-cols-2 gap-2">
        <input
          inputMode="decimal"
          value={lat}
          onChange={(e) => setLat(e.target.value)}
          placeholder="Latitude"
          className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm"
        />
        <input
          inputMode="decimal"
          value={lng}
          onChange={(e) => setLng(e.target.value)}
          placeholder="Longitude"
          className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm"
        />
      </div>
      <FarmerFieldMapPicker
        key={selectedFarmId}
        centerLat={Number.isFinite(latN) ? latN : ef.coordinates.lat}
        centerLng={Number.isFinite(lngN) ? lngN : ef.coordinates.lng}
        polygon={polygonForMap}
        onPolygonChange={setMapPolygon}
        onFieldPointChange={(la, ln) => {
          setLat(String(la));
          setLng(String(ln));
        }}
      />
      <Button
        type="button"
        className="w-full border border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-100"
        onClick={() => setMapPolygon([])}
      >
        Clear boundary (optional)
      </Button>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <Button
        type="button"
        className="w-full"
        onClick={() => {
          const r = updateFarmField(selectedFarmId, {
            name,
            notes,
            coordinates: {
              lat: Number(lat),
              lng: Number(lng),
            },
            polygon: mapPolygon,
          });
          if (!r.ok) setError(r.message);
          else {
            setError(null);
            goToState("farmer_fields");
          }
        }}
      >
        Save changes
      </Button>
      <Button
        type="button"
        className="w-full border border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-100"
        onClick={() => {
          const r = archiveFarmField(selectedFarmId);
          if (!r.ok) setError(r.message);
          else {
            setError(null);
            goToState("farmer_fields");
          }
        }}
      >
        Archive field
      </Button>
      <Button
        type="button"
        className="w-full border border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-100"
        onClick={() => goToState("farmer_fields")}
      >
        Back
      </Button>
    </div>
  );
}
