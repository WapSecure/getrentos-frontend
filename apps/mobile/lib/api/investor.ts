import type {
  ForeignIdentityStatus,
  InvestorAvailability,
  InvestorManaged,
  InvestorOverview,
  InvestorProfile,
  InvestorProfileInput,
  RiskDeclaration,
} from '@sureground/shared';
import { apiFetch, apiFetchOrNull } from './client';
import type { WorkOrder, WorkOrderStatus } from './homeCare';
import type { Paginated } from './properties';
import { toQuery } from './query';

export const investorApi = {
  availability: () => apiFetch<InvestorAvailability>('/investor/availability'),
  profile: () => apiFetchOrNull<InvestorProfile>('/investor/profile'),
  saveProfile: (input: InvestorProfileInput) =>
    apiFetch<InvestorProfile>('/investor/profile', { method: 'PUT', body: input }),
  risk: () => apiFetch<RiskDeclaration>('/investor/declarations/risk'),
  /** 409 when `version` is no longer current: reload the points and ask again. */
  acceptRisk: (version: string) =>
    apiFetch<RiskDeclaration>('/investor/declarations/risk', {
      method: 'POST',
      body: { version },
    }),
  overview: () => apiFetch<InvestorOverview>('/investor/overview'),
  managed: () => apiFetch<InvestorManaged>('/investor/managed'),
  managedWorkOrders: (propertyId: string, page = 1, pageSize = 30, status?: WorkOrderStatus) =>
    apiFetch<Paginated<WorkOrder>>(
      `/investor/managed/${encodeURIComponent(propertyId)}/work-orders${toQuery({ page, pageSize, status })}`
    ),
  managedWorkOrder: (id: string) =>
    apiFetch<WorkOrder>(`/investor/managed/work-orders/${encodeURIComponent(id)}`),
  identityAbroad: () => apiFetch<ForeignIdentityStatus>('/trust/foreign-identity'),
};
