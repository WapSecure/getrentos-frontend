import { apiFetch } from './client';

export interface ManagedEstate {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  gateCount: number | null;
}

export interface EstateDashboardStats {
  totalHouseholds: number;
  duesCollectedThisMonth: number;
  duesOutstanding: number;
  openIncidents: number;
  openMaintenanceTickets: number;
  pendingViolations: number;
}

export const estateManagerApi = {
  listMine: () => apiFetch<ManagedEstate[]>('/estate/mine'),
  dashboard: (estateId: string) =>
    apiFetch<EstateDashboardStats>(`/estate/${estateId}/dashboard/stats`),
};
