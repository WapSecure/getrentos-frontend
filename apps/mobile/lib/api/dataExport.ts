import { apiFetch } from './client';

export interface DataExport {
  exportedAt: string;
  user: Record<string, unknown>;
  [section: string]: unknown;
}

export const dataExportApi = {
  get: () => apiFetch<DataExport>('/users/me/data-export'),
};
