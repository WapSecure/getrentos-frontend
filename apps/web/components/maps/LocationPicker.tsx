'use client';

import 'leaflet/dist/leaflet.css';
import { useEffect, useRef, useState } from 'react';
import { Loader2, MapPin } from 'lucide-react';
import { Button } from '@getrentos/ui';
import { geocodeService, LAGOS_POINT, type MapPoint } from '@/services/geocodeService';

/**
 * Where the property is, as the owner says: "Find on map" suggests a pin from
 * the typed address, and the owner drags it (or clicks the map) onto the right
 * building. Leaving it alone is allowed; the property is then placed from its
 * address, less precisely.
 */
export const LocationPicker = ({
  address,
  city,
  state,
  country,
  value,
  onChange,
  guessed = false,
}: {
  address: string;
  city: string;
  state: string;
  country?: string;
  value: MapPoint | null;
  onChange: (point: MapPoint | null) => void;
  /** The current pin is our guess from the address, not the owner's. */
  guessed?: boolean;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  /* eslint-disable @typescript-eslint/no-explicit-any -- Leaflet is loaded at runtime */
  const mapRef = useRef<any>(null);
  const pinRef = useRef<any>(null);
  const leafletRef = useRef<any>(null);
  /* eslint-enable @typescript-eslint/no-explicit-any */
  const onChangeRef = useRef(onChange);
  const [ready, setReady] = useState(false);
  const [finding, setFinding] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const canSearch =
    address.trim().length >= 3 && city.trim().length >= 2 && state.trim().length >= 2;

  useEffect(() => {
    onChangeRef.current = onChange;
  });

  // The map is created once there is a pin to show, and kept.
  const hasPin = value != null;
  useEffect(() => {
    if (!hasPin || mapRef.current) return;
    let cancelled = false;
    (async () => {
      const L = await import('leaflet');
      if (cancelled || !containerRef.current) return;
      leafletRef.current = L;
      const map = L.map(containerRef.current, { zoomControl: true });
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);
      map.on('click', (e: { latlng: { lat: number; lng: number } }) => {
        pinRef.current?.setLatLng(e.latlng);
        onChangeRef.current({ latitude: e.latlng.lat, longitude: e.latlng.lng });
      });
      mapRef.current = map;
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [hasPin]);

  useEffect(
    () => () => {
      mapRef.current?.remove();
      mapRef.current = null;
      pinRef.current = null;
    },
    []
  );

  // Keep the pin where the value says, without moving the view under the owner.
  useEffect(() => {
    const L = leafletRef.current;
    const map = mapRef.current;
    if (!ready || !L || !map || !value) return;
    if (!pinRef.current) {
      const icon = L.divIcon({
        className: '',
        html: '<div style="width:18px;height:18px;border-radius:50%;background:#0b6e4f;border:3px solid #fff;box-shadow:0 1px 6px rgba(0,0,0,.4)"></div>',
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      });
      pinRef.current = L.marker([value.latitude, value.longitude], { icon, draggable: true }).addTo(
        map
      );
      pinRef.current.on('dragend', () => {
        const ll = pinRef.current.getLatLng();
        onChangeRef.current({ latitude: ll.lat, longitude: ll.lng });
      });
      map.setView([value.latitude, value.longitude], 17);
    } else {
      pinRef.current.setLatLng([value.latitude, value.longitude]);
    }
  }, [ready, value]);

  const find = async () => {
    setFinding(true);
    setNote(null);
    const response = await geocodeService.suggest({ address, city, state, country });
    setFinding(false);
    let next: MapPoint;
    if (response.success && response.data?.found) {
      next = { latitude: response.data.latitude, longitude: response.data.longitude };
      setNote('Check the pin is on the right building, and drag it if not.');
    } else {
      next = value ?? LAGOS_POINT;
      setNote(
        response.success
          ? 'We couldn’t find that address. Drag the pin onto the property.'
          : 'Couldn’t search the map right now. You can still drag the pin.'
      );
    }
    onChange(next);
    // A search is the one time the view should jump to the pin.
    mapRef.current?.setView([next.latitude, next.longitude], 17);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <MapPin className="h-4 w-4 text-primary" />
        <span className="flex-1 text-sm font-medium text-foreground">Pin on the map</span>
        {value && (
          <button
            type="button"
            className="text-xs text-muted-foreground hover:text-foreground"
            onClick={() => {
              // The map's element goes with the pin, so the map must too.
              mapRef.current?.remove();
              mapRef.current = null;
              pinRef.current = null;
              setReady(false);
              onChange(null);
              setNote(null);
            }}
          >
            Remove pin
          </button>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        Renters and buyers see this once the property is verified. Placing it yourself is more
        accurate than our guess from the address.
      </p>
      {value && (
        <div
          ref={containerRef}
          className="h-60 w-full overflow-hidden rounded-xl border border-border"
          aria-label="Drag the pin onto the property"
        />
      )}
      {guessed && value && (
        <p className="text-xs text-muted-foreground">
          This pin is our guess from the address. Drag it onto the building to confirm it.
        </p>
      )}
      {note && <p className="text-xs text-muted-foreground">{note}</p>}
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={!canSearch || finding}
        onClick={() => void find()}
      >
        {finding ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {value ? 'Find the address again' : 'Find on map'}
      </Button>
    </div>
  );
};
