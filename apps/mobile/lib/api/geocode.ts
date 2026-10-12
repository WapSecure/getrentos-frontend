import { apiFetch } from './client';

export interface MapPoint {
  latitude: number;
  longitude: number;
}

/** Where an address probably is: a starting pin for the owner to correct. */
export const geocodeApi = {
  suggest: (place: { address: string; city: string; state: string; country?: string }) => {
    const q = new URLSearchParams({
      address: place.address.trim(),
      city: place.city.trim(),
      state: place.state.trim(),
      country: place.country?.trim() || 'Nigeria',
    });
    return apiFetch<({ found: true } & MapPoint) | { found: false }>(
      `/geo/geocode?${q.toString()}`
    );
  },
};

/** Lagos: where the map opens when an address cannot be found, for the owner to drag from. */
export const LAGOS_POINT: MapPoint = { latitude: 6.5244, longitude: 3.3792 };
