'use client';

import 'leaflet/dist/leaflet.css';
import { useEffect, useMemo, useRef, useState } from 'react';
import { boundaryCorners } from '@getrentos/shared';
import { addBaseTiles } from '@/lib/mapTiles';
import { LAND_PLOT_STATUS_LABELS, type LandPlot } from '@/types/landBuyer';
import { PLOT_STATUS_STYLES, plotLabel } from './landSaleLogic';

/**
 * An estate's plots drawn from their surveyed outlines, coloured by status.
 * Read-only: clicking a plot selects it. Uses the same tiles as the single
 * parcel map (ParcelBoundaryMap), which only draws one outline. Plots without
 * an outline are simply absent here; the plot grid beside it lists every plot,
 * so nothing is reachable only by map.
 */
export const PlotLayoutMap = ({
  plots,
  selectedId,
  onSelect,
  height = 360,
}: {
  plots: LandPlot[];
  selectedId?: string | null;
  onSelect: (plot: LandPlot) => void;
  height?: number;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  /* eslint-disable @typescript-eslint/no-explicit-any -- Leaflet is loaded at runtime */
  const mapRef = useRef<any>(null);
  const leafletRef = useRef<any>(null);
  const layerRef = useRef<any>(null);
  /* eslint-enable @typescript-eslint/no-explicit-any */
  const onSelectRef = useRef(onSelect);
  const fittedRef = useRef(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    onSelectRef.current = onSelect;
  });

  const outlined = useMemo(
    () =>
      plots
        .map((plot) => ({ plot, corners: boundaryCorners(plot.boundaryGeometry) }))
        .filter((entry): entry is { plot: LandPlot; corners: NonNullable<typeof entry.corners> } =>
          Boolean(entry.corners)
        ),
    [plots]
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = await import('leaflet');
      if (cancelled || !containerRef.current) return;
      leafletRef.current = L;
      const map = L.map(containerRef.current, { zoomControl: true, scrollWheelZoom: false });
      map.setView([6.5244, 3.3792], 12);
      addBaseTiles(L, map);
      layerRef.current = L.layerGroup().addTo(map);
      mapRef.current = map;
      setReady(true);
    })();
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const L = leafletRef.current;
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!ready || !L || !map || !layer) return;
    layer.clearLayers();
    const all: [number, number][] = [];
    for (const { plot, corners } of outlined) {
      const latlngs = corners.map((c) => [c.latitude, c.longitude] as [number, number]);
      all.push(...latlngs);
      const colour = PLOT_STATUS_STYLES[plot.status].hex;
      const selected = plot.id === selectedId;
      const polygon = L.polygon(latlngs, {
        color: selected ? '#111827' : colour,
        weight: selected ? 3 : 1.5,
        fillColor: colour,
        fillOpacity: plot.status === 'AVAILABLE' ? 0.35 : 0.2,
      }).addTo(layer);
      polygon.bindTooltip(`${plotLabel(plot)}: ${LAND_PLOT_STATUS_LABELS[plot.status]}`);
      polygon.on('click', () => onSelectRef.current(plot));
    }
    if (!fittedRef.current && all.length) {
      map.fitBounds(L.latLngBounds(all), { padding: [24, 24], maxZoom: 19 });
      fittedRef.current = true;
    }
  }, [ready, outlined, selectedId]);

  return (
    <div
      ref={containerRef}
      style={{ height }}
      className="w-full overflow-hidden rounded-xl border border-border"
      role="img"
      aria-label={`Estate map with ${outlined.length} surveyed plot outlines. Use the plot list to choose a plot.`}
    />
  );
};

/** Whether any plot carries a usable outline. */
export const hasPlotOutlines = (plots: LandPlot[]) =>
  plots.some((plot) => boundaryCorners(plot.boundaryGeometry) !== null);
