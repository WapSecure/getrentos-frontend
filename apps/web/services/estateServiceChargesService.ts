import type {
  ServiceChargeBillingCycle,
  ServiceChargeBudgetStatus,
  ServiceChargeCategory,
  ServiceChargeMethod,
} from '@sureground/shared';
import { authFetch, safeCall } from '@/lib/apiHelpers';

export type EstateServiceChargeBudget = {
  id: string;
  title: string;
  estate: { id: string; name: string } | null;
  status: ServiceChargeBudgetStatus;
  periodStart: string;
  periodEnd: string;
  lastDay: string;
  firstDueDate: string;
  method: ServiceChargeMethod;
  billingCycle: ServiceChargeBillingCycle;
  leadDays: number;
  version: number;
  total: number;
  lines: { id: string; category: ServiceChargeCategory; label: string; amount: number }[];
  participants: {
    id: string;
    householdId: string | null;
    label: string;
    weight: number;
    included: boolean;
    exclusionReason: string | null;
  }[];
  voidReason: string | null;
  invoicesCount: number;
};

export type EstateServiceChargePreview = {
  budgetId: string;
  total: number;
  apportioned: number;
  unitsSharing: number;
  instalments: {
    number: number;
    periodStart: string;
    periodEnd: string;
    dueDate: string;
    issueDate: string;
  }[];
  participants: {
    id: string;
    householdId: string | null;
    label: string;
    weight: number;
    included: boolean;
    total: number;
    instalments: number[];
    notes: string[];
  }[];
  blockers: string[];
  previewHash: string;
};

export type EstateServiceChargeInvoice = {
  id: string;
  instalment: number;
  unit: string;
  tenant: string | null;
  periodStart: string;
  periodEnd: string;
  dueDate: string;
  amount: number;
  status: 'ISSUED' | 'SKIPPED' | 'VOIDED';
  collection: 'PAID' | 'UNPAID' | 'REMOVED' | 'VOIDED';
};

const base = (estateId: string) => `/estate/${estateId}/service-charges`;
const send = <T>(path: string, method: string, body?: unknown) =>
  safeCall(() =>
    authFetch<T>(path, { method, ...(body === undefined ? {} : { body: JSON.stringify(body) }) })
  );

/** An estate's service-charge budgets, billed to households as dues. Publish, close and void ask for step-up. */
export const estateServiceChargesService = {
  list: (estateId: string) =>
    safeCall(() => authFetch<EstateServiceChargeBudget[]>(base(estateId))),
  get: (estateId: string, id: string) =>
    safeCall(() => authFetch<EstateServiceChargeBudget>(`${base(estateId)}/${id}`)),
  create: (
    estateId: string,
    input: {
      title: string;
      periodStart: string;
      periodEnd: string;
      billingCycle: ServiceChargeBillingCycle;
      method: ServiceChargeMethod;
    }
  ) => send<EstateServiceChargeBudget>(base(estateId), 'POST', input),
  setLines: (
    estateId: string,
    id: string,
    lines: { category: ServiceChargeCategory; label: string; amount: number }[]
  ) => send<EstateServiceChargeBudget>(`${base(estateId)}/${id}/lines`, 'PUT', { lines }),
  setHouseholds: (
    estateId: string,
    id: string,
    households: { householdId: string; weight: number; included: boolean }[]
  ) => send<EstateServiceChargeBudget>(`${base(estateId)}/${id}/households`, 'PUT', { households }),
  preview: (estateId: string, id: string) =>
    safeCall(() => authFetch<EstateServiceChargePreview>(`${base(estateId)}/${id}/preview`)),
  publish: (estateId: string, id: string, previewHash: string) =>
    send<EstateServiceChargeBudget & { issuedNow: number }>(
      `${base(estateId)}/${id}/publish`,
      'POST',
      {
        previewHash,
      }
    ),
  close: (estateId: string, id: string) =>
    send<EstateServiceChargeBudget>(`${base(estateId)}/${id}/close`, 'POST', {}),
  void: (estateId: string, id: string, reason: string) =>
    send<{ id: string; duesWaived: number }>(`${base(estateId)}/${id}/void`, 'POST', { reason }),
  invoices: (estateId: string, id: string) =>
    safeCall(() => authFetch<EstateServiceChargeInvoice[]>(`${base(estateId)}/${id}/invoices`)),
};
