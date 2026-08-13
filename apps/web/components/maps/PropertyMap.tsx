'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useRef } from 'react';
import { MapPin } from 'lucide-react';
import { useGoogleMaps } from '@/lib/googleMaps';
import { cn } from '@/lib/cn';

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

export const PropertyMap = ({
  center,
  markers = [],
  zoom = 13,
  height = 420,
  className,
  openMarkerId,
}: PropertyMapProps) => {
  const status = useGoogleMaps();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  useEffect(() => {
    if (status.status !== 'ready' || !containerRef.current) return;
    const maps = status.maps;

    const withCoords = markers.filter((m) => m.latitude && m.longitude);
    const mapCenter = center
      ? { lat: center.latitude, lng: center.longitude }
      : withCoords[0]
        ? { lat: withCoords[0].latitude, lng: withCoords[0].longitude }
        : LAGOS;

    if (!mapRef.current) {
      mapRef.current = new maps.Map(containerRef.current, {
        center: mapCenter,
        zoom: withCoords.length > 0 || center ? zoom : 11,
        fullscreenControl: true,
        streetViewControl: true,
        mapTypeControl: false,
      });
    } else {
      mapRef.current.setCenter(mapCenter);
      mapRef.current.setZoom(withCoords.length > 0 || center ? zoom : 11);
    }

    // Clear previous markers.
    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];

    withCoords.forEach((markerData) => {
      const marker = new maps.Marker({
        position: { lat: markerData.latitude, lng: markerData.longitude },
        map: mapRef.current,
        title: markerData.title,
      });

      if (markerData.title || markerData.priceLabel) {
        const image = markerData.imageUrl
          ? `<img src="${escapeHtml(markerData.imageUrl)}" alt="" style="width:100%;height:120px;object-fit:cover;border-radius:10px;margin-bottom:8px" />`
          : '';
        const link = markerData.href
          ? `<a href="${escapeHtml(markerData.href)}" style="display:inline-block;margin-top:8px;color:#0b6e4f;font-weight:600;text-decoration:none">View details →</a>`
          : '';
        const infoWindow = new maps.InfoWindow({
          content: `<div style="min-width:180px;max-width:220px;font-family:inherit;color:#111">${image}<div style="font-weight:600;font-size:14px">${escapeHtml(
            markerData.title ?? ''
          )}</div>${
            markerData.priceLabel
              ? `<div style="color:#0b6e4f;font-weight:600;margin-top:2px">${escapeHtml(markerData.priceLabel)}</div>`
              : ''
          }${link}</div>`,
        });
        marker.addListener('click', () => {
          infoWindow.open({ map: mapRef.current, anchor: marker });
        });
        if (markerData.id === openMarkerId) {
          infoWindow.open({ map: mapRef.current, anchor: marker });
        }
      }

      markersRef.current.push(marker);
    });

    return () => {
      markersRef.current.forEach((marker) => marker.setMap(null));
      markersRef.current = [];
    };
  }, [status, markers, center, zoom, openMarkerId]);

  if (status.status === 'loading') {
    return (
      <div
        className={cn(
          'flex items-center justify-center rounded-2xl border border-border bg-secondary/40',
          className
        )}
        style={{ height }}
      >
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          Loading map…
        </div>
      </div>
    );
  }

  if (status.status === 'error') {
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
        <p className="max-w-sm text-xs text-muted-foreground">{status.message}</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn('w-full overflow-hidden rounded-2xl border border-border', className)}
      style={{ height }}
    />
  );
};
