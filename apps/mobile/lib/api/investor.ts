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
  /** Off until `DIASPORA_INVEST_ENABLED` is set on the API: the entry points stay hidden. */
  availability: () => apiFetch<InvestorAvailability>('/investor/availability'),
  /** Null before the first save. */
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
  /** The jobs on one managed property: read-only, no Pro plan needed, same shape as home care. */
  managedWorkOrders: (propertyId: string, page = 1, pageSize = 30, status?: WorkOrderStatus) =>
    apiFetch<Paginated<WorkOrder>>(
      `/investor/managed/${encodeURIComponent(propertyId)}/work-orders${toQuery({ page, pageSize, status })}`
    ),
  /** One job on any of my managed properties; 404 for anything else. */
  managedWorkOrder: (id: string) =>
    apiFetch<WorkOrder>(`/investor/managed/work-orders/${encodeURIComponent(id)}`),
  identityAbroad: () => apiFetch<ForeignIdentityStatus>('/trust/foreign-identity'),
};
