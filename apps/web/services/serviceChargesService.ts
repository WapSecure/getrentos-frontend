import type {
  ServiceChargeBudget,
  ServiceChargeBudgetStatus,
  ServiceChargeBudgetSummary,
  ServiceChargeBillingCycle,
  ServiceChargeCategory,
  ServiceChargeInvoice,
  ServiceChargeMethod,
  ServiceChargePreview,
  ServiceChargeQuery,
  ServiceChargeQueryStatus,
  ServiceChargeActualCandidate,
  ServiceChargeReconciliation,
} from '@sureground/shared';
import { authFetch, safeCall, toQuery, type Paginated } from '@/lib/apiHelpers';

const BASE = '/home-management/service-charges';

export type CreateServiceChargeBudgetInput = {
  propertyId: string;
  title: string;
  periodStart: string;
  /** The day after the last day covered. */
  periodEnd: string;
  billingCycle: ServiceChargeBillingCycle;
  method: ServiceChargeMethod;
  firstDueDate?: string;
  leadDays?: number;
};

export type UpdateServiceChargeBudgetInput = Partial<
  Omit<CreateServiceChargeBudgetInput, 'propertyId'>
> & { openBook?: boolean; notes?: string };

const send = <T>(path: string, method: string, body?: unknown) =>
  safeCall(() =>
    authFetch<T>(path, { method, ...(body === undefined ? {} : { body: JSON.stringify(body) }) })
  );

/** Service-charge budgets. Publish, close and void ask for step-up (handled by authFetch). */
export const serviceChargesService = {
  list: (params: { propertyId?: string; status?: ServiceChargeBudgetStatus; page?: number } = {}) =>
    safeCall(() =>
      authFetch<Paginated<ServiceChargeBudgetSummary>>(
        `${BASE}${toQuery({ ...params, pageSize: 20 })}`
      )
    ),
  get: (id: string) => safeCall(() => authFetch<ServiceChargeBudget>(`${BASE}/${id}`)),
  create: (input: CreateServiceChargeBudgetInput) => send<ServiceChargeBudget>(BASE, 'POST', input),
  update: (id: string, input: UpdateServiceChargeBudgetInput) =>
    send<ServiceChargeBudget>(`${BASE}/${id}`, 'PATCH', input),
  setLines: (
    id: string,
    lines: { category: ServiceChargeCategory; label: string; amount: number }[]
  ) => send<ServiceChargeBudget>(`${BASE}/${id}/lines`, 'PUT', { lines }),
  setParticipants: (
    id: string,
    participants: { unitId: string; weight: number; included: boolean; exclusionReason?: string }[]
  ) => send<ServiceChargeBudget>(`${BASE}/${id}/participants`, 'PUT', { participants }),
  preview: (id: string) => safeCall(() => authFetch<ServiceChargePreview>(`${BASE}/${id}/preview`)),
  publish: (id: string, previewHash: string) =>
    send<ServiceChargeBudget & { issuedNow: number }>(`${BASE}/${id}/publish`, 'POST', {
      previewHash,
    }),
  close: (id: string) => send<ServiceChargeBudget>(`${BASE}/${id}/close`, 'POST', {}),
  void: (id: string, reason: string) =>
    send<{ id: string; unpaidChargesRemoved: number }>(`${BASE}/${id}/void`, 'POST', { reason }),
  invoices: (id: string, page = 1) =>
    safeCall(() =>
      authFetch<Paginated<ServiceChargeInvoice>>(
        `${BASE}/${id}/invoices${toQuery({ page, pageSize: 25 })}`
      )
    ),
  queries: (
    params: { propertyId?: string; status?: ServiceChargeQueryStatus; page?: number } = {}
  ) =>
    safeCall(() =>
      authFetch<Paginated<ServiceChargeQuery>>(
        `/home-management/service-charge-queries${toQuery({ ...params, pageSize: 20 })}`
      )
    ),
  respondToQuery: (id: string, response: string) =>
    send<ServiceChargeQuery>(`/home-management/service-charge-queries/${id}/respond`, 'POST', {
      response,
    }),
  rejectQuery: (id: string, outcomeNote: string) =>
    send<ServiceChargeQuery>(`/home-management/service-charge-queries/${id}/reject`, 'POST', {
      outcomeNote,
    }),
  /** Behind step-up: a credit lands on the tenant's lease. */
  upholdQuery: (id: string, outcomeNote: string, adjustmentAmount: number) =>
    send<ServiceChargeQuery>(`/home-management/service-charge-queries/${id}/uphold`, 'POST', {
      outcomeNote,
      adjustmentAmount,
    }),
  reconciliation: (id: string) =>
    safeCall(() => authFetch<ServiceChargeReconciliation>(`${BASE}/${id}/reconciliation`)),
  actualCandidates: (id: string) =>
    safeCall(() => authFetch<ServiceChargeActualCandidate[]>(`${BASE}/${id}/actual-candidates`)),
  linkActual: (
    id: string,
    body: {
      budgetLineId: string;
      utilityPurchaseId?: string;
      expenseId?: string;
      vendorInvoiceId?: string;
    }
  ) => send<{ id: string }>(`${BASE}/${id}/actuals`, 'POST', body),
  unlinkActual: (id: string, linkId: string) =>
    send<{ id: string }>(`${BASE}/${id}/actuals/${linkId}`, 'DELETE'),
  /** Behind step-up: changes what tenants are billed from the next instalment. */
  amend: (
    id: string,
    input: {
      reason: string;
      lines: { id?: string; category: ServiceChargeCategory; label: string; amount: number }[];
    }
  ) => send<ServiceChargeBudget>(`${BASE}/${id}/amend`, 'POST', input),
  reopen: (id: string, reason: string) =>
    send<ServiceChargeBudget>(`${BASE}/${id}/reopen`, 'POST', { reason }),
  carryForward: (id: string, title: string) =>
    send<ServiceChargeBudget>(`${BASE}/${id}/carry-forward`, 'POST', { title }),
};
