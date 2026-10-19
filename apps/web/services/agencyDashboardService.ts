import type { PmKpiReport } from '@getrentos/ui';
import { authFetch, safeCall, type ApiResponse } from '@/lib/apiHelpers';

export interface AgencyDashboard {
  firmName: string;
  asOf: string;
  clients: { active: number; pending: number; endedLast90Days: number };
  portfolio: {
    properties: number;
    units: number;
    occupiedUnits: number;
    occupancyRate: number | null;
  };
  rentThisMonth: { due: number; collected: number; collectionRate: number | null };
  arrears: {
    total: number;
    charges: number;
    aging: { days0to30: number; days31to60: number; days61to90: number; days90plus: number };
  };
  maintenance: { open: number; slaBreached: number; resolvedThisMonth: number };
  team: { active: number };
  commissionsThisMonth: number;
}

export const agencyDashboardService = {
  get: (): Promise<ApiResponse<AgencyDashboard>> =>
    safeCall(() => authFetch<AgencyDashboard>('/agency/dashboard')),
  /** The firm's KPI pack for a run of months (YYYY-MM, inclusive). */
  kpis: (from: string, to: string): Promise<ApiResponse<PmKpiReport>> =>
    safeCall(() => authFetch<PmKpiReport>(`/agency/kpis?from=${from}&to=${to}`)),
};
