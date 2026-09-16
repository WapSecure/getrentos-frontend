import { apiFetch } from './client';

export interface DataExport {
  exportedAt: string;
  user: Record<string, unknown>;
  applications: unknown[];
  savedListings: unknown[];
  leases: unknown[];
  payments: unknown[];
  maintenanceRequests: unknown[];
  documents: unknown[];
}

export const dataExportApi = {
  get: () => apiFetch<DataExport>('/renter/settings/data-export'),
};
