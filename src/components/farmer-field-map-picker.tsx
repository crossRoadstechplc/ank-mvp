"use client";

import { useCallback, useEffect } from "react";
import L from "leaflet";
import {
  MapContainer,
  Marker,
  Polygon,
  TileLayer,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "@geoman-io/leaflet-geoman-free";
import "@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css";

let iconsFixed = false;

function fixLeafletDefaultIcons() {
  if (iconsFixed || typeof window === "undefined") return;
  iconsFixed = true;
  delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: string })._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  });
}

function MapRecenter({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, Math.max(map.getZoom(), 13));
  }, [center[0], center[1], map]);
  return null;
}

function GeomanPolygonDraw({
  onPolygon,
}: {
  onPolygon: (ring: [number, number][]) => void;
}) {
  const map = useMap();

  const handleCreate = useCallback(
    (ev: L.LeafletEvent) => {
      const e = ev as L.LeafletEvent & { shape?: string; layer: L.Layer };
      if (e.shape !== "Polygon" || !(e.layer instanceof L.Polygon)) return;

      const latlngs = e.layer.getLatLngs() as L.LatLng[] | L.LatLng[][];
      const outer: L.LatLng[] = Array.isArray(latlngs[0])
        ? (latlngs as L.LatLng[][])[0]
        : (latlngs as L.LatLng[]);

      const ring: [number, number][] = outer.map((ll) => [ll.lng, ll.lat]);
      e.layer.remove();
      onPolygon(ring);
    },
    [onPolygon],
  );

  useEffect(() => {
    fixLeafletDefaultIcons();
    map.pm.addControls({
      position: "topleft",
      drawMarker: false,
      drawCircleMarker: false,
      drawPolyline: false,
      drawRectangle: false,
      drawCircle: false,
      drawText: false,
      drawPolygon: true,
      editMode: true,
      dragMode: false,
      cutPolygon: false,
      removalMode: false,
      rotateMode: false,
    });

    map.on("pm:create", handleCreate);
    return () => {
      map.off("pm:create", handleCreate);
      map.pm.removeControls();
    };
  }, [map, handleCreate]);

  return null;
}

export type FarmerFieldMapPickerProps = {
  /** Map center and marker position (field GPS point) */
  centerLat: number;
  centerLng: number;
  /** Closed or open ring in [lng, lat][] — same as seed JSON */
  polygon: [number, number][] | null;
  onPolygonChange: (ring: [number, number][]) => void;
  /** When the marker is dragged, update form lat/lng */
  onFieldPointChange?: (lat: number, lng: number) => void;
  /** Optional label for screen readers */
  className?: string;
};

export function FarmerFieldMapPicker({
  centerLat,
  centerLng,
  polygon,
  onPolygonChange,
  onFieldPointChange,
  className,
}: FarmerFieldMapPickerProps) {
  const center: [number, number] = [centerLat, centerLng];

  const latLngPositions =
    polygon && polygon.length >= 3
      ? polygon.map(([lng, lat]) => [lat, lng] as [number, number])
      : null;

  return (
    <div className={className}>
      <p className="mb-2 text-sm text-zinc-600">
        Pan and zoom, then use the <strong>polygon</strong> tool on the left toolbar to trace your
        field. Finish the shape with a double-click or by closing the ring. Drag the pin to set the
        main GPS point for this field.
      </p>
      <div className="relative z-0 h-[min(420px,55vh)] w-full overflow-hidden rounded-xl border border-zinc-200">
        <MapContainer
          center={center}
          zoom={14}
          className="h-full w-full"
          scrollWheelZoom
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapRecenter center={center} />
          <GeomanPolygonDraw onPolygon={onPolygonChange} />
          {latLngPositions ? (
            <Polygon
              pathOptions={{
                color: "#166534",
                weight: 2,
                fillColor: "#22c55e",
                fillOpacity: 0.28,
              }}
              positions={latLngPositions}
            />
          ) : null}
          <Marker
            position={center}
            draggable={Boolean(onFieldPointChange)}
            eventHandlers={
              onFieldPointChange
                ? {
                    dragend: (e) => {
                      const p = e.target.getLatLng();
                      onFieldPointChange(p.lat, p.lng);
                    },
                  }
                : undefined
            }
          />
        </MapContainer>
      </div>
      <p className="mt-2 text-xs text-zinc-500">
        {polygon && polygon.length >= 3
          ? `Boundary: ${polygon.length} vertices · use polygon tool again to replace`
          : "No boundary drawn yet — draw a polygon to claim the field area."}
      </p>
    </div>
  );
}
