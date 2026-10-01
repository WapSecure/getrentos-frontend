import { apiFetch } from './client';

export interface RealtorDashboard {
  totalListings: number;
  publishedListings: number;
  offerCount: number;
  activeClients: number;
  activeLeads: number;
  upcomingViewings: number;
}

export const realtorApi = {
  dashboard: () => apiFetch<RealtorDashboard>('/realtor/dashboard'),
};
