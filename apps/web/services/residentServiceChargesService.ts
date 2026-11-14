import type { RenterServiceCharge } from '@sureground/shared';
import type { ServiceChargeStatementData } from '@/components/shared/service-charge/ServiceChargeStatementView';
import { authFetch, safeCall } from '@/lib/apiHelpers';

const BASE = '/estate/resident/service-charges';

export type ResidentServiceCharge = Omit<
  RenterServiceCharge,
  'collection' | 'rentPaymentId' | 'property'
> & {
  estate: string | null;
  property: string | null;
  collection: 'PAID' | 'UNPAID' | 'REMOVED' | 'WAIVED';
};

/** An estate resident's own service charges. Paying stays on the dues page. */
export const residentServiceChargesService = {
  list: () =>
    safeCall(async () =>
      (await authFetch<ResidentServiceCharge[]>(BASE)).map((c) => ({ ...c, property: c.estate }))
    ),
  get: (id: string) => safeCall(() => authFetch<ServiceChargeStatementData>(`${BASE}/${id}`)),
  raiseQuery: (id: string, input: { reason: string; invoiceLineId?: string }) =>
    safeCall(() =>
      authFetch(`${BASE}/${id}/queries`, { method: 'POST', body: JSON.stringify(input) })
    ),
  withdrawQuery: (queryId: string) =>
    safeCall(() =>
      authFetch(`${BASE}/queries/${queryId}/withdraw`, { method: 'POST', body: '{}' })
    ),
};
