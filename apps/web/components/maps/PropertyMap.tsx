'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useRef, useState } from 'react';
import { MapPin } from 'lucide-react';
import { cn } from '@/lib/cn';
import 'leaflet/dist/leaflet.css';

export interface MapMarker {
  id: string;
  latitude: number;
  longitude: number;
  title?: string;
  priceLabel?: string;
  imageUrl?: string;
  href?: string;
}

interface PropertyMapProps {
  /** Optional explicit center; falls back to the first marker, then Lagos. */
  center?: { latitude: number; longitude: number };
  markers?: MapMarker[];
  zoom?: number;
  height?: number | string;
  className?: string;
  /** Marker id whose info window should be open initially. */
  openMarkerId?: string;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const LAGOS = { lat: 6.5244, lng: 3.3792 };

/** Custom styled pin (avoids Leaflet's default icon asset bundling issue). */
function pinIconHtml(priceLabel?: string): string {
  const shortPrice = priceLabel ? priceLabel.replace(/[^0-9.kKmM]/g, '').slice(0, 5) : '₦';
  return `<div style="width:38px;height:38px;display:flex;align-items:center;justify-content:center;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:#0b6e4f;border:2px solid #ffffff;box-shadow:0 2px 6px rgba(0,0,0,0.35);font-family:inherit;font-size:11px;font-weight:700;color:#ffffff;letter-spacing:-0.3px">${escapeHtml(
    shortPrice
  )}</div>`;
}

/**
 * Keyless map powered by Leaflet + OpenStreetMap tiles.
 * No API keys, no billing — works out of the box anywhere.
 */
export const PropertyMap = ({
  center,
  markers = [],
  zoom = 13,
  height = 420,
  className,
  openMarkerId,
}: PropertyMapProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const leafletRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialise the map exactly once (Leaflet touches `window`, so we load it
  // dynamically on the client).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const L = await import('leaflet');
        if (cancelled || !containerRef.current) return;
        leafletRef.current = L;
        const map = L.map(containerRef.current, {
          zoomControl: true,
          attributionControl: true,
        });
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(map);
        mapRef.current = map;
        setReady(true);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Map failed to load');
      }
    })();
    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      markersRef.current = [];
    };
  }, []);

  // Render markers + keep the view in sync when props change.
  useEffect(() => {
    if (!ready || !mapRef.current || !leafletRef.current) return;
    const L = leafletRef.current;
    const map = mapRef.current;

    const withCoords = markers.filter((m) => m.latitude && m.longitude);
    const mapCenter = center
      ? [center.latitude, center.longitude]
      : withCoords[0]
        ? [withCoords[0].latitude, withCoords[0].longitude]
        : [LAGOS.lat, LAGOS.lng];

    map.setView(mapCenter, withCoords.length > 0 || center ? zoom : 11);

    // Clear previous markers.
    markersRef.current.forEach((marker: any) => marker.remove());
    markersRef.current = [];

    withCoords.forEach((markerData) => {
      const icon = L.divIcon({
        className: '',
        html: `<div style="transform:rotate(0deg)">${pinIconHtml(markerData.priceLabel)}</div>`,
        iconSize: [38, 38],
        iconAnchor: [19, 36],
        popupAnchor: [0, -32],
      });
      const marker = L.marker([markerData.latitude, markerData.longitude], {
        icon,
        title: markerData.title,
      }).addTo(map);

      if (markerData.title || markerData.priceLabel) {
        const image = markerData.imageUrl
          ? `<img src="${escapeHtml(markerData.imageUrl)}" alt="" style="width:100%;height:120px;object-fit:cover;border-radius:10px;margin-bottom:8px" />`
          : '';
        const link = markerData.href
          ? `<a href="${escapeHtml(markerData.href)}" style="display:inline-block;margin-top:8px;color:#0b6e4f;font-weight:600;text-decoration:none">View details →</a>`
          : '';
        marker.bindPopup(
          `<div style="min-width:180px;max-width:220px;font-family:inherit;color:#111">${image}<div style="font-weight:600;font-size:14px">${escapeHtml(
            markerData.title ?? ''
          )}</div>${
            markerData.priceLabel
              ? `<div style="color:#0b6e4f;font-weight:600;margin-top:2px">${escapeHtml(markerData.priceLabel)}</div>`
              : ''
          }${link}</div>`
        );
        marker.on('click', () => marker.openPopup());
        if (markerData.id === openMarkerId) {
          marker.openPopup();
        }
      }

      markersRef.current.push(marker);
    });

    return () => {
      markersRef.current.forEach((marker: any) => marker.remove());
      markersRef.current = [];
    };
  }, [ready, markers, center, zoom, openMarkerId]);

  if (error) {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-card p-8 text-center',
          className
        )}
        style={{ height }}
      >
        <MapPin className="h-8 w-8 text-muted-foreground" />
        <p className="text-sm font-medium text-foreground">Map unavailable</p>
        <p className="max-w-sm text-xs text-muted-foreground">{error}</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn('w-full overflow-hidden rounded-2xl border border-border', className)}
      style={{ height }}
    >
      {!ready && (
        <div className="flex h-full w-full items-center justify-center rounded-2xl bg-secondary/40 text-sm text-muted-foreground">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span className="ml-2">Loading map…</span>
        </div>
      )}
    </div>
  );
};
