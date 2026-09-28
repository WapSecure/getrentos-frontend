import { apiFetch } from './client';

export type LocationCountry = { code: string; name: string; states: string[] };

export const locationsApi = {
  list: () => apiFetch<LocationCountry[]>('/geo/locations', { anonymous: true }),
};
