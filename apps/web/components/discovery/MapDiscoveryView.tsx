'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import dynamic from 'next/dynamic';
import { Button, SegmentedControl, Skeleton } from '@sureground/ui';
import { LayoutGrid, Map as MapIcon, X } from '@sureground/icons';
import { cn } from '@sureground/shared';
import { hasMapPoint, type DiscoveryView, type MapArea, type MapPoint } from '@/lib/mapArea';
import type { DiscoveryPin } from './DiscoveryMap';

// Leaflet loads only when someone opens the map, never with the list.
const DiscoveryMap = dynamic(() => import('./DiscoveryMap').then((m) => m.DiscoveryMap), {
  ssr: false,
  loading: () => (
    <div role="status" aria-label="Loading map" className="h-full">
      <Skeleton className="h-full w-full rounded-xl" />
    </div>
  ),
});

export function DiscoveryViewToggle({
  view,
  onChange,
  className,
}: {
  view: DiscoveryView;
  onChange: (view: DiscoveryView) => void;
  className?: string;
}) {
  return (
    <SegmentedControl
      aria-label="Show results as"
      value={view}
      onValueChange={onChange}
      size="sm"
      className={className}
      segments={[
        {
          value: 'grid',
          label: 'Grid',
          icon: <LayoutGrid className="h-4 w-4" aria-hidden="true" />,
        },
        { value: 'map', label: 'Map', icon: <MapIcon className="h-4 w-4" aria-hidden="true" /> },
      ]}
    />
  );
}

/** Shown above results while a map area filters them. */
export function MapAreaNotice({ onClear }: { onClear: () => void }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-primary/25 bg-primary/5 px-3 py-2 text-sm">
      <span className="text-foreground">Showing only results inside the map area.</span>
      <Button
        variant="ghost"
        size="sm"
        icon={<X className="h-4 w-4" aria-hidden="true" />}
        onClick={onClear}
      >
        Clear map area
      </Button>
    </div>
  );
}

interface MapDiscoveryViewProps<T extends { id: string } & MapPoint> {
  items: T[];
  title: (item: T) => string;
  price: (item: T) => number | undefined;
  renderCard: (item: T, state: { selected: boolean; position: number }) => ReactNode;
  area?: MapArea;
  onSearchArea: (area: MapArea) => void;
  /** Clears a searched or drawn area from the map itself. */
  onClearArea?: () => void;
  selectedId?: string;
  onSelect: (id: string | undefined) => void;
  /** Pagination and anything else under the list. */
  footer?: ReactNode;
  /** Shown in place of the list when there are no results; the map stays so the area can be moved. */
  empty?: ReactNode;
  className?: string;
}

/**
 * The map-first layout: results on the left (below the map on phones), the map beside them.
 * The list renders straight away; the map arrives when it has loaded, so a slow network still browses.
 */
export function MapDiscoveryView<T extends { id: string } & MapPoint>({
  items,
  title,
  price,
  renderCard,
  area,
  onSearchArea,
  onClearArea,
  selectedId,
  onSelect,
  footer,
  empty,
  className,
}: MapDiscoveryViewProps<T>) {
  const [highlightedId, setHighlightedId] = useState<string>();
  const listRef = useRef<HTMLOListElement>(null);

  const located = items.filter(hasMapPoint);
  const unlocated = items.length - located.length;
  const pins: DiscoveryPin[] = located.map((item) => ({
    id: item.id,
    latitude: item.latitude,
    longitude: item.longitude,
    title: title(item),
    price: price(item),
    approximate: item.locationPrecision !== 'exact',
  }));
  const anyApproximate = pins.some((p) => p.approximate);

  // A pin picked on the map brings its card into view.
  useEffect(() => {
    if (!selectedId) return;
    const card = listRef.current?.querySelector<HTMLElement>(
      `[data-listing-id="${CSS.escape(selectedId)}"]`
    );
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    card?.scrollIntoView({ block: 'nearest', behavior: reduce ? 'auto' : 'smooth' });
  }, [selectedId]);

  return (
    <div className={cn('grid gap-4 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]', className)}>
      <div className="order-2 min-w-0 lg:order-1">
        {items.length === 0 && empty}
        <ol
          ref={listRef}
          aria-label="Results"
          className="flex flex-col gap-3 lg:max-h-[calc(100vh-11rem)] lg:overflow-y-auto lg:pr-1"
        >
          {items.map((item, position) => (
            <li
              key={item.id}
              data-listing-id={item.id}
              onMouseEnter={() => setHighlightedId(item.id)}
              onMouseLeave={() => setHighlightedId(undefined)}
              onFocus={() => setHighlightedId(item.id)}
              onBlur={() => setHighlightedId(undefined)}
            >
              {renderCard(item, { selected: item.id === selectedId, position })}
            </li>
          ))}
        </ol>
        {(unlocated > 0 || anyApproximate) && (
          <p className="mt-3 text-xs text-muted-foreground">
            {unlocated > 0 &&
              `${unlocated} ${unlocated === 1 ? 'listing on this page has' : 'listings on this page have'} no map location yet. `}
            {anyApproximate &&
              'Dashed prices mark an approximate area; the exact spot is shown once the property is verified.'}
          </p>
        )}
        {footer}
      </div>
      <div className="order-1 h-[55vh] min-h-72 lg:sticky lg:top-20 lg:order-2 lg:h-[calc(100vh-7rem)]">
        <DiscoveryMap
          className="h-full"
          pins={pins}
          area={area}
          selectedId={selectedId}
          highlightedId={highlightedId}
          onSelect={(id) => onSelect(id === selectedId ? undefined : id)}
          onSearchArea={onSearchArea}
          onClearArea={onClearArea}
        />
      </div>
    </div>
  );
}
