import { apiFetch } from './client';
import type { PropertyType } from './properties';

export interface SavedSearchFilters {
  location?: string;
  bedrooms?: number;
  maxPrice?: number;
  propertyType?: PropertyType;
  verifiedOnly?: boolean;
}

export interface SavedSearch {
  id: string;
  name: string;
  filters: SavedSearchFilters;
  createdAt: string;
  alertsEnabled: boolean;
  lastRun: string;
  newMatches: number;
}

export interface CreateSavedSearchInput {
  name: string;
  location?: string;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  bathrooms?: number;
  propertyType?: PropertyType;
  verifiedOnly?: boolean;
}

export const savedSearchesApi = {
  list: () => apiFetch<SavedSearch[]>('/renter/saved-searches'),

  create: (input: CreateSavedSearchInput) =>
    apiFetch<SavedSearch>('/renter/saved-searches', { method: 'POST', body: input }),

  toggleAlerts: (id: string) =>
    apiFetch<SavedSearch>(`/renter/saved-searches/${id}/alerts`, { method: 'PATCH' }),

  remove: (id: string) => apiFetch<void>(`/renter/saved-searches/${id}`, { method: 'DELETE' }),
};
