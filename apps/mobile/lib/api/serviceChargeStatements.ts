import type { RenterServiceCharge, RenterServiceChargeStatement } from '@sureground/shared';
import { apiFetch } from './client';

/** Whose statements: a tenant's (rent account) or an estate resident's (dues). */
export type StatementKind = 'renter' | 'resident';

export type StatementCollection = RenterServiceCharge['collection'] | 'WAIVED';

export type StatementListItem = Omit<RenterServiceCharge, 'collection' | 'rentPaymentId'> & {
  collection: StatementCollection;
  estate?: string | null;
};

export type Statement = Omit<
  RenterServiceChargeStatement,
  'collection' | 'partOfInstalment' | 'budget' | 'lines'
> & {
  collection: StatementCollection;
  partOfInstalment?: number | null;
  /** A household due an upheld query lowered. */
  amountDue?: number | null;
  estate?: string | null;
  lines: (Omit<RenterServiceChargeStatement['lines'][number], 'spentSoFar'> & {
    spentSoFar?: number | null;
  })[];
  budget: Omit<RenterServiceChargeStatement['budget'], 'openBook' | 'spentSoFar'> & {
    spentSoFar?: number | null;
  };
};

const BASE: Record<StatementKind, string> = {
  renter: '/renter/service-charges',
  resident: '/estate/resident/service-charges',
};

/** Service-charge statements and queries for tenants and estate residents. Paying stays in Payments or Dues. */
export const statementsApi = {
  list: async (kind: StatementKind) => {
    const rows = await apiFetch<StatementListItem[]>(BASE[kind]);
    return rows.map((row) => ({ ...row, property: row.property ?? row.estate ?? null }));
  },
  get: (kind: StatementKind, id: string) => apiFetch<Statement>(`${BASE[kind]}/${id}`),
  raiseQuery: (
    kind: StatementKind,
    id: string,
    input: { reason: string; invoiceLineId?: string }
  ) => apiFetch(`${BASE[kind]}/${id}/queries`, { method: 'POST', body: input }),
  withdrawQuery: (kind: StatementKind, queryId: string) =>
    apiFetch(`${BASE[kind]}/queries/${queryId}/withdraw`, { method: 'POST', body: {} }),
};

export const STATEMENT_COPY: Record<
  StatementKind,
  { pay: string; payRoute: string; replier: string; holder: string }
> = {
  renter: {
    pay: 'with your rent under Payments',
    payRoute: '/(app)/payments',
    replier: 'Your landlord or their agency',
    holder: 'tenancy',
  },
  resident: {
    pay: 'with your estate dues under Dues',
    payRoute: '/(app)/dues',
    replier: 'Your estate manager',
    holder: 'household',
  },
};
