import { apiFetch } from './client';

/**
 * A copy of the person's data, for every role. Each list is one kind of record
 * (applications, leases, properties, offers, bookings, messages…); which ones
 * hold anything depends on how the account is used.
 */
export interface DataExport {
  exportedAt: string;
  user: Record<string, unknown>;
  [section: string]: unknown;
}

export const dataExportApi = {
  get: () => apiFetch<DataExport>('/users/me/data-export'),
};
