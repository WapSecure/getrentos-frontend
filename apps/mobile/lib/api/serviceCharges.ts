import type {
  ServiceChargeBudget,
  ServiceChargeBudgetSummary,
  ServiceChargeInvoice,
  ServiceChargePreview,
} from '@sureground/shared';
import { apiFetch } from './client';
import { toQuery } from './query';
import type { Paginated } from './properties';

const BASE = '/home-management/service-charges';

/** Service-charge budgets. Set up on the web; the app shows them and can publish, close or void (step-up). */
export const serviceChargesApi = {
  list: (propertyId?: string) =>
    apiFetch<Paginated<ServiceChargeBudgetSummary>>(
      `${BASE}${toQuery({ propertyId, pageSize: 50 })}`
    ),
  get: (id: string) => apiFetch<ServiceChargeBudget>(`${BASE}/${id}`),
  preview: (id: string) => apiFetch<ServiceChargePreview>(`${BASE}/${id}/preview`),
  invoices: (id: string) =>
    apiFetch<Paginated<ServiceChargeInvoice>>(
      `${BASE}/${id}/invoices${toQuery({ pageSize: 100 })}`
    ),
  publish: (id: string, previewHash: string) =>
    apiFetch<ServiceChargeBudget & { issuedNow: number }>(`${BASE}/${id}/publish`, {
      method: 'POST',
      body: { previewHash },
    }),
  close: (id: string) =>
    apiFetch<ServiceChargeBudget>(`${BASE}/${id}/close`, { method: 'POST', body: {} }),
  void: (id: string, reason: string) =>
    apiFetch<{ id: string; unpaidChargesRemoved: number }>(`${BASE}/${id}/void`, {
      method: 'POST',
      body: { reason },
    }),
};
