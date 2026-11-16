import type {
  ServiceChargeBillingCycle,
  ServiceChargeBudgetStatus,
  ServiceChargeCategory,
  ServiceChargeMethod,
  ServiceChargeQuery,
} from '@sureground/shared';
import { apiFetch } from './client';

export type EstateBudget = {
  id: string;
  title: string;
  status: ServiceChargeBudgetStatus;
  periodStart: string;
  lastDay: string;
  method: ServiceChargeMethod;
  billingCycle: ServiceChargeBillingCycle;
  total: number;
  lines: { id: string; category: ServiceChargeCategory; label: string; amount: number }[];
  participants: {
    id: string;
    householdId: string | null;
    label: string;
    weight: number;
    included: boolean;
  }[];
  voidReason: string | null;
};

export type EstatePreview = {
  total: number;
  apportioned: number;
  unitsSharing: number;
  instalments: { number: number; dueDate: string }[];
  participants: {
    id: string;
    label: string;
    included: boolean;
    total: number;
    instalments: number[];
    notes: string[];
  }[];
  blockers: string[];
  previewHash: string;
};

export type EstateInvoice = {
  id: string;
  instalment: number;
  unit: string;
  tenant: string | null;
  dueDate: string;
  amount: number;
  collection: 'PAID' | 'UNPAID' | 'REMOVED' | 'VOIDED';
};

const base = (estateId: string) => `/estate/${estateId}/service-charges`;
const q = (estateId: string) => `/estate/${estateId}/service-charge-queries`;

/** Publish, close, void and uphold use step-up. */
export const estateServiceChargesApi = {
  list: (estateId: string) => apiFetch<EstateBudget[]>(base(estateId)),
  get: (estateId: string, id: string) => apiFetch<EstateBudget>(`${base(estateId)}/${id}`),
  preview: (estateId: string, id: string) =>
    apiFetch<EstatePreview>(`${base(estateId)}/${id}/preview`),
  invoices: (estateId: string, id: string) =>
    apiFetch<EstateInvoice[]>(`${base(estateId)}/${id}/invoices`),
  publish: (estateId: string, id: string, previewHash: string) =>
    apiFetch<EstateBudget & { issuedNow: number }>(`${base(estateId)}/${id}/publish`, {
      method: 'POST',
      body: { previewHash },
    }),
  close: (estateId: string, id: string) =>
    apiFetch(`${base(estateId)}/${id}/close`, { method: 'POST', body: {} }),
  void: (estateId: string, id: string, reason: string) =>
    apiFetch(`${base(estateId)}/${id}/void`, { method: 'POST', body: { reason } }),
  queries: (estateId: string) => apiFetch<ServiceChargeQuery[]>(q(estateId)),
  respond: (estateId: string, id: string, response: string) =>
    apiFetch(`${q(estateId)}/${id}/respond`, { method: 'POST', body: { response } }),
  reject: (estateId: string, id: string, outcomeNote: string) =>
    apiFetch(`${q(estateId)}/${id}/reject`, { method: 'POST', body: { outcomeNote } }),
  uphold: (estateId: string, id: string, outcomeNote: string, adjustmentAmount: number) =>
    apiFetch(`${q(estateId)}/${id}/uphold`, {
      method: 'POST',
      body: { outcomeNote, adjustmentAmount },
    }),
};
