'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useState } from 'react';

/**
 * Minimal loader for the Google Maps JavaScript API. Loads the script once,
 * exposes a `useGoogleMaps()` hook, and degrades to a friendly error state
 * when NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is missing (so the UI never crashes
 * before a key is configured).
 */

export function getGoogleMapsKey(): string {
  return process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';
}

export type Gmaps = any;

declare global {
  interface Window {
    google?: any;
  }
}

let loadPromise: Promise<Gmaps> | null = null;
let lastError: string | null = null;

export function loadGoogleMaps(): Promise<Gmaps> {
  const key = getGoogleMapsKey();
  if (!key) {
    lastError = 'Google Maps is not configured.';
    return Promise.reject(new Error(lastError));
  }
  if (typeof window !== 'undefined' && window.google?.maps) {
    return Promise.resolve(window.google.maps);
  }
  if (loadPromise) return loadPromise;

  loadPromise = new Promise<Gmaps>((resolve, reject) => {
    const callback = `__getrentosGmaps${Date.now()}`;
    (window as any)[callback] = () => {
      resolve(window.google.maps);
      delete (window as any)[callback];
    };
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places&callback=${callback}`;
    script.async = true;
    script.defer = true;
    script.onerror = () => {
      lastError = 'Failed to load Google Maps.';
      reject(new Error(lastError));
    };
    document.head.appendChild(script);
  });
  return loadPromise;
}

export type GoogleMapsStatus =
  | { status: 'loading' }
  | { status: 'ready'; maps: Gmaps }
  | { status: 'error'; message: string };

/** React hook: loads Google Maps once and reports loading/ready/error. */
export function useGoogleMaps(): GoogleMapsStatus {
  const [status, setStatus] = useState<GoogleMapsStatus>(() =>
    getGoogleMapsKey()
      ? { status: 'loading' }
      : {
          status: 'error',
          message:
            'Google Maps is not configured. Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to .env.local to enable the map.',
        }
  );

  useEffect(() => {
    let cancelled = false;
    loadGoogleMaps()
      .then((maps) => {
        if (!cancelled) setStatus({ status: 'ready', maps });
      })
      .catch((err: Error) => {
        if (!cancelled) setStatus({ status: 'error', message: err.message });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return status;
}
