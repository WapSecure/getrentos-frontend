'use client';

/* eslint-disable @typescript-eslint/no-explicit-any -- Leaflet is loaded at runtime */
// Only ever loaded through next/dynamic from MapDiscoveryView, so Leaflet and its CSS stay out of the first bundle.
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import { useEffect, useRef, useState } from 'react';
import { Button, Skeleton } from '@sureground/ui';
import { MapPin, Pencil, Search, Square, X } from '@sureground/icons';
import { cn, formatCurrency } from '@sureground/shared';
import { addBaseTiles } from '@/lib/mapTiles';
import { areaKey as keyOfArea, polygonArea, type MapArea } from '@/lib/mapArea';

export interface DiscoveryPin {
  id: string;
  latitude: number;
  longitude: number;
  title: string;
  price?: number;
  /** The API blurs this point until the property is verified. */
  approximate?: boolean;
}

interface DiscoveryMapProps {
  pins: DiscoveryPin[];
  /** The searched area, drawn as a box. */
  area?: MapArea;
  selectedId?: string;
  highlightedId?: string;
  onSelect: (id: string) => void;
  onSearchArea: (area: MapArea) => void;
  /** Shows a "Clear area" control on the map while an area is searched. */
  onClearArea?: () => void;
  className?: string;
}

type DrawMode = 'polygon' | 'rectangle';

const LAGOS: [number, number] = [6.5244, 3.3792];
/** The API moves an approximate point up to 500 m, so this circle always holds the real spot. */
const APPROXIMATE_RADIUS_M = 600;

const escapeHtml = (text: string) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function pinHtml(pin: DiscoveryPin, state: 'idle' | 'highlighted' | 'selected') {
  const label =
    typeof pin.price === 'number' && pin.price > 0
      ? formatCurrency(pin.price, { compact: true })
      : 'View';
  const tone =
    state === 'selected'
      ? 'border-primary bg-primary text-primary-foreground'
      : state === 'highlighted'
        ? 'border-primary bg-card text-primary'
        : 'border-border bg-card text-foreground';
  return `<span class="${cn(
    'data-value inline-flex -translate-x-1/2 -translate-y-full items-center whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-semibold shadow-md transition-transform',
    pin.approximate && 'border-dashed',
    state !== 'idle' && 'scale-110',
    tone
  )}">${escapeHtml(label)}</span>`;
}

const boundsOf = (area: MapArea): [[number, number], [number, number]] => [
  [area.minLat, area.minLng],
  [area.maxLat, area.maxLng],
];

export function DiscoveryMap({
  pins,
  area,
  selectedId,
  highlightedId,
  onSelect,
  onSearchArea,
  onClearArea,
  className,
}: DiscoveryMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const leafletRef = useRef<any>(null);
  const markersRef = useRef<Map<string, any>>(new Map());
  const overlaysRef = useRef<any[]>([]);
  const programmaticMove = useRef(false);
  const fittedKey = useRef<string | null>(null);
  // Markers are made once per result set; the latest handler is read through this ref.
  const onSelectRef = useRef(onSelect);
  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);
  const [moved, setMoved] = useState(false);
  const [drawing, setDrawing] = useState<DrawMode | null>(null);
  const drawHandlerRef = useRef<any>(null);
  const onSearchAreaRef = useRef(onSearchArea);
  useEffect(() => {
    onSearchAreaRef.current = onSearchArea;
  }, [onSearchArea]);

  // Leaflet touches `window`, so it is loaded on the client, once.
  useEffect(() => {
    let cancelled = false;
    const markers = markersRef.current;
    (async () => {
      try {
        const leaflet: any = await import('leaflet');
        const L = leaflet.default ?? leaflet;
        // leaflet-draw extends the global L, so it is set before the plugin loads; both arrive with the map only.
        (window as any).L = L;
        await import('leaflet-draw');
        if (cancelled || !containerRef.current) return;
        leafletRef.current = L;
        const map = L.map(containerRef.current, { zoomControl: true, attributionControl: true });
        addBaseTiles(L, map);
        map.setView(LAGOS, 11);
        // Only a move the person made offers "Search this area"; fitting to results does not.
        map.on('movestart', () => {
          if (!programmaticMove.current) setMoved(true);
        });
        // A finished drawing becomes the searched area: a box stays a box, a shape is sent as a polygon.
        map.on(L.Draw.Event.CREATED, (event: any) => {
          drawHandlerRef.current = null;
          setDrawing(null);
          setMoved(false);
          if (event.layerType === 'rectangle') {
            const b = event.layer.getBounds();
            onSearchAreaRef.current({
              minLat: Math.max(b.getSouth(), -90),
              minLng: Math.max(b.getWest(), -180),
              maxLat: Math.min(b.getNorth(), 90),
              maxLng: Math.min(b.getEast(), 180),
            });
            return;
          }
          const ring = event.layer.getLatLngs()[0] as Array<{ lat: number; lng: number }>;
          const next = polygonArea(ring.map((p) => ({ lat: p.lat, lng: p.lng })));
          if (next) onSearchAreaRef.current(next);
        });
        map.on(L.Draw.Event.DRAWSTOP, () => {
          drawHandlerRef.current = null;
          setDrawing(null);
        });
        mapRef.current = map;
        setReady(true);
      } catch {
        if (!cancelled) setError(true);
      }
    })();
    return () => {
      cancelled = true;
      drawHandlerRef.current?.disable();
      drawHandlerRef.current = null;
      mapRef.current?.remove();
      mapRef.current = null;
      markers.clear();
    };
  }, []);

  // Leaflet fires movestart synchronously inside setView, fitBounds and panTo, so the flag only needs to
  // cover the call itself; a fit that changes nothing fires nothing and leaves no stale flag behind.
  const fit = (run: () => void) => {
    programmaticMove.current = true;
    try {
      run();
    } finally {
      programmaticMove.current = false;
    }
    setMoved(false);
  };

  // Frame the searched area, or else the results; refit only when the set changes, never on hover.
  const pinKey = pins.map((p) => p.id).join('|');
  const areaKey = keyOfArea(area);
  useEffect(() => {
    const map = mapRef.current;
    const L = leafletRef.current;
    if (!ready || !map || !L) return;
    const key = areaKey || `pins:${pinKey}`;
    if (fittedKey.current === key) return;
    fittedKey.current = key;
    if (area) {
      fit(() => map.fitBounds(boundsOf(area), { animate: false }));
    } else if (pins.length) {
      const bounds = L.latLngBounds(pins.map((p) => [p.latitude, p.longitude]));
      fit(() => map.fitBounds(bounds, { padding: [48, 48], maxZoom: 15, animate: false }));
    }
    // `area` and `pins` are represented by their keys.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, areaKey, pinKey]);

  // One marker per pin; recreated when the result set changes.
  useEffect(() => {
    const map = mapRef.current;
    const L = leafletRef.current;
    if (!ready || !map || !L) return;
    const markers = markersRef.current;
    markers.forEach((m) => m.remove());
    markers.clear();
    for (const pin of pins) {
      const marker = L.marker([pin.latitude, pin.longitude], {
        icon: L.divIcon({ className: '', html: pinHtml(pin, 'idle'), iconSize: null }),
        title: pin.approximate ? `${pin.title} (approximate area)` : pin.title,
        alt: pin.title,
        keyboard: true,
        riseOnHover: true,
      }).addTo(map);
      marker.on('click', () => onSelectRef.current(pin.id));
      markers.set(pin.id, marker);
    }
    return () => {
      markers.forEach((m) => m.remove());
      markers.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, pinKey]);

  // Selection and hover restyle the pins in place, so the map never jumps.
  useEffect(() => {
    if (!ready) return;
    for (const pin of pins) {
      const marker = markersRef.current.get(pin.id);
      if (!marker) continue;
      const state =
        pin.id === selectedId ? 'selected' : pin.id === highlightedId ? 'highlighted' : 'idle';
      // Rewrites the label inside the marker element, so a keyboard user's focus stays on it.
      const element = marker.getElement();
      if (element) element.innerHTML = pinHtml(pin, state);
      marker.setZIndexOffset(state === 'idle' ? 0 : 1000);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, pinKey, selectedId, highlightedId]);

  // The searched box, and the honest circle around a selected approximate pin.
  useEffect(() => {
    const map = mapRef.current;
    const L = leafletRef.current;
    if (!ready || !map || !L) return;
    overlaysRef.current.forEach((o) => o.remove());
    overlaysRef.current = [];
    if (area) {
      const style = {
        className: 'stroke-primary fill-primary',
        weight: 2,
        dashArray: '6 4',
        fillOpacity: 0.04,
        interactive: false,
      };
      overlaysRef.current.push(
        (area.polygon
          ? L.polygon(
              area.polygon.map((p) => [p.lat, p.lng]),
              style
            )
          : L.rectangle(boundsOf(area), style)
        ).addTo(map)
      );
    }
    const selected = pins.find((p) => p.id === selectedId);
    if (selected?.approximate) {
      overlaysRef.current.push(
        L.circle([selected.latitude, selected.longitude], {
          radius: APPROXIMATE_RADIUS_M,
          className: 'stroke-primary fill-primary',
          weight: 1.5,
          fillOpacity: 0.12,
          interactive: false,
        }).addTo(map)
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, areaKey, pinKey, selectedId]);

  // A pin chosen from the list is brought into view if it is off screen.
  useEffect(() => {
    const map = mapRef.current;
    const pin = pins.find((p) => p.id === selectedId);
    if (!ready || !map || !pin) return;
    if (!map.getBounds().contains([pin.latitude, pin.longitude])) {
      fit(() => map.panTo([pin.latitude, pin.longitude]));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, selectedId]);

  const searchHere = () => {
    const map = mapRef.current;
    if (!map) return;
    const b = map.getBounds();
    setMoved(false);
    onSearchArea({
      minLat: Math.max(b.getSouth(), -90),
      minLng: Math.max(b.getWest(), -180),
      maxLat: Math.min(b.getNorth(), 90),
      maxLng: Math.min(b.getEast(), 180),
    });
  };

  // leaflet-draw's own toolbar is replaced by these buttons, so the controls match the rest of the page.
  const startDrawing = (mode: DrawMode) => {
    const map = mapRef.current;
    const L = leafletRef.current;
    if (!map || !L) return;
    drawHandlerRef.current?.disable();
    const shapeOptions = { color: 'currentColor', weight: 2, dashArray: '6 4', fillOpacity: 0.06 };
    // showArea stays off: leaflet-draw 1.0.4 throws while measuring area on Leaflet 1.9.
    const handler =
      mode === 'polygon'
        ? new L.Draw.Polygon(map, {
            allowIntersection: true,
            showArea: false,
            showLength: false,
            maxPoints: 50,
            shapeOptions,
          })
        : new L.Draw.Rectangle(map, { showArea: false, metric: true, shapeOptions });
    handler.enable();
    drawHandlerRef.current = handler;
    setDrawing(mode);
  };

  const stopDrawing = () => {
    drawHandlerRef.current?.disable();
    drawHandlerRef.current = null;
    setDrawing(null);
  };

  if (error) {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-card p-8 text-center',
          className
        )}
      >
        <MapPin className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
        <p className="text-sm font-medium text-foreground">The map could not load</p>
        <p className="max-w-sm text-xs text-muted-foreground">
          The list still shows every result. Check your connection and switch views to try again.
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn('relative isolate overflow-hidden rounded-xl border border-border', className)}
    >
      <div
        ref={containerRef}
        className="h-full w-full"
        role="region"
        aria-label="Map of results. Select a price to highlight its listing."
      />
      {!ready && (
        <div role="status" aria-label="Loading map" className="absolute inset-0">
          <Skeleton className="h-full w-full rounded-none" />
        </div>
      )}
      {ready && (
        <div className="absolute right-3 top-3 z-[1000] flex flex-col items-end gap-2 text-primary">
          {drawing ? (
            <>
              <p
                role="status"
                className="max-w-56 rounded-lg border border-border bg-card px-3 py-2 text-xs text-foreground shadow-md"
              >
                {drawing === 'polygon'
                  ? 'Tap the map to add corners. Tap the first corner to finish.'
                  : 'Press and drag across the map to draw a box.'}
              </p>
              <Button
                size="sm"
                variant="outline"
                rounded="full"
                className="bg-card shadow-md"
                icon={<X className="h-4 w-4" aria-hidden="true" />}
                onClick={stopDrawing}
              >
                Cancel drawing
              </Button>
            </>
          ) : (
            <>
              <Button
                size="sm"
                variant="outline"
                rounded="full"
                className="bg-card shadow-md"
                icon={<Pencil className="h-4 w-4" aria-hidden="true" />}
                onClick={() => startDrawing('polygon')}
              >
                Draw area
              </Button>
              <Button
                size="sm"
                variant="outline"
                rounded="full"
                className="bg-card shadow-md"
                icon={<Square className="h-4 w-4" aria-hidden="true" />}
                onClick={() => startDrawing('rectangle')}
              >
                Draw box
              </Button>
              {area && onClearArea && (
                <Button
                  size="sm"
                  variant="outline"
                  rounded="full"
                  className="bg-card shadow-md"
                  icon={<X className="h-4 w-4" aria-hidden="true" />}
                  onClick={onClearArea}
                >
                  Clear area
                </Button>
              )}
            </>
          )}
        </div>
      )}
      {ready && moved && !drawing && (
        <div className="pointer-events-none absolute inset-x-0 top-3 z-[1000] flex justify-center">
          <Button
            size="sm"
            rounded="full"
            className="pointer-events-auto shadow-md"
            icon={<Search className="h-4 w-4" aria-hidden="true" />}
            onClick={searchHere}
          >
            Search this area
          </Button>
        </div>
      )}
    </div>
  );
}
