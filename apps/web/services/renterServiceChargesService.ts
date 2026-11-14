import type {
  RenterServiceCharge,
  RenterServiceChargeQuery,
  RenterServiceChargeStatement,
} from '@sureground/shared';
import { authFetch, safeCall } from '@/lib/apiHelpers';

const BASE = '/renter/service-charges';

/** A tenant's own service charges. Paying one goes through the usual rent checkout. */
export const renterServiceChargesService = {
  list: () => safeCall(() => authFetch<RenterServiceCharge[]>(BASE)),
  get: (id: string) => safeCall(() => authFetch<RenterServiceChargeStatement>(`${BASE}/${id}`)),
  raiseQuery: (id: string, input: { reason: string; invoiceLineId?: string }) =>
    safeCall(() =>
      authFetch<RenterServiceChargeQuery>(`${BASE}/${id}/queries`, {
        method: 'POST',
        body: JSON.stringify(input),
      })
    ),
  withdrawQuery: (queryId: string) =>
    safeCall(() =>
      authFetch<{ id: string }>(`${BASE}/queries/${queryId}/withdraw`, {
        method: 'POST',
        body: '{}',
      })
    ),
};
