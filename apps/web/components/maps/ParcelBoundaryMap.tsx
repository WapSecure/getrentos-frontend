'use client';

import 'leaflet/dist/leaflet.css';
import { useEffect, useRef, useState } from 'react';
import { Eraser, Undo2 } from 'lucide-react';
import { Button } from '@getrentos/ui';
import { boundaryAreaSqm, type BoundaryCorner } from '@getrentos/shared';
import { LAGOS_POINT } from '@/services/geocodeService';
import { addBaseTiles } from '@/lib/mapTiles';

const PRIMARY = '#0b6e4f';

/** An area for people: m² for a plot, hectares for a farm. */
export const formatArea = (sqm: number) =>
  sqm >= 10_000
    ? `${(sqm / 10_000).toFixed(2)} ha`
    : `${Math.round(sqm).toLocaleString('en-NG')} m²`;

/**
 * A land plot's outline on a map. Read-only for buyers; with `onChange` the
 * owner draws it: each click on the map adds a corner, corners drag, and the
 * last one can be undone. Shows the drawn area so it can be checked against
 * the surveyed size.
 */
export const ParcelBoundaryMap = ({
  corners,
  onChange,
  center,
  height = 320,
}: {
  corners: BoundaryCorner[];
  onChange?: (corners: BoundaryCorner[]) => void;
  /** Where to start when there is no outline yet (the property's pin). */
  center?: BoundaryCorner | null;
  height?: number;
}) => {
  const editable = !!onChange;
  const containerRef = useRef<HTMLDivElement>(null);
  /* eslint-disable @typescript-eslint/no-explicit-any -- Leaflet is loaded at runtime */
  const mapRef = useRef<any>(null);
  const leafletRef = useRef<any>(null);
  const layerRef = useRef<any>(null);
  /* eslint-enable @typescript-eslint/no-explicit-any */
  const cornersRef = useRef(corners);
  const onChangeRef = useRef(onChange);
  const [ready, setReady] = useState(false);
  const fittedRef = useRef(false);

  useEffect(() => {
    cornersRef.current = corners;
    onChangeRef.current = onChange;
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = await import('leaflet');
      if (cancelled || !containerRef.current) return;
      leafletRef.current = L;
      const start = cornersRef.current[0] ?? center ?? LAGOS_POINT;
      const map = L.map(containerRef.current, { zoomControl: true }).setView(
        [start.latitude, start.longitude],
        cornersRef.current.length || center ? 17 : 12
      );
      addBaseTiles(L, map);
      if (editable) {
        map.on('click', (e: { latlng: { lat: number; lng: number } }) => {
          onChangeRef.current?.([
            ...cornersRef.current,
            { latitude: e.latlng.lat, longitude: e.latlng.lng },
          ]);
        });
      }
      layerRef.current = L.layerGroup().addTo(map);
      mapRef.current = map;
      setReady(true);
    })();
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // The map is built once; corners and center changes are drawn below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Redraw the outline and its corner handles whenever the corners change.
  useEffect(() => {
    const L = leafletRef.current;
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!ready || !L || !map || !layer) return;
    layer.clearLayers();
    const latlngs = corners.map((c) => [c.latitude, c.longitude]);
    if (corners.length >= 3) {
      L.polygon(latlngs, { color: PRIMARY, weight: 2, fillOpacity: 0.18 }).addTo(layer);
    } else if (corners.length === 2) {
      L.polyline(latlngs, { color: PRIMARY, weight: 2, dashArray: '4 4' }).addTo(layer);
    }
    if (editable) {
      const icon = L.divIcon({
        className: '',
        html: `<div style="width:14px;height:14px;border-radius:50%;background:#fff;border:3px solid ${PRIMARY};box-shadow:0 1px 4px rgba(0,0,0,.35)"></div>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      });
      corners.forEach((c, i) => {
        const label = `Corner ${i + 1} of ${corners.length}: drag to move it`;
        const handle = L.marker([c.latitude, c.longitude], {
          icon,
          draggable: true,
          title: label,
        }).addTo(layer);
        // Leaflet already makes a draggable marker a focusable button; give it a name.
        handle.getElement()?.setAttribute('aria-label', label);
        handle.on('dragend', () => {
          const ll = handle.getLatLng();
          const next = [...cornersRef.current];
          next[i] = { latitude: ll.lat, longitude: ll.lng };
          onChangeRef.current?.(next);
        });
      });
    }
    // Frame an existing outline once; after that the view stays where the owner put it.
    if (!fittedRef.current && corners.length >= 3) {
      map.fitBounds(L.latLngBounds(latlngs), { padding: [24, 24], maxZoom: 19 });
      fittedRef.current = true;
    }
  }, [ready, corners, editable]);

  const area = boundaryAreaSqm(corners);

  return (
    <div className="space-y-2">
      <div
        ref={containerRef}
        style={{ height }}
        className="w-full overflow-hidden rounded-xl border border-border"
        aria-label={editable ? 'Click the map to add the plot’s corners' : 'The plot’s outline'}
      />
      <div className="flex flex-wrap items-center gap-2">
        <p className="flex-1 text-xs text-muted-foreground">
          {corners.length >= 3
            ? `Outlined area: about ${formatArea(area)}`
            : editable
              ? `Click each corner of the plot in turn${corners.length ? ` (${corners.length} of at least 3)` : ''}.`
              : null}
        </p>
        {editable && corners.length > 0 && (
          <>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onChange(corners.slice(0, -1))}
            >
              <Undo2 className="h-4 w-4" />
              Undo corner
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => onChange([])}>
              <Eraser className="h-4 w-4" />
              Clear
            </Button>
          </>
        )}
      </div>
    </div>
  );
};
