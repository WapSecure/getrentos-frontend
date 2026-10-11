import {
  canRetryPayout,
  committeeOrder,
  committeeTitleLabel,
  governanceKeys,
  governanceTypeLabel,
  isValidSlug,
  lastMonthPeriod,
  micrositeUrl,
  normaliseSlug,
  payoutAccountValid,
  payoutHold,
  payoutOutcome,
  signatureState,
  statementBadge,
  statementLadder,
  type CommitteeMember,
  type EstateStatement,
} from '@/lib/api/estateGovernance';

describe('signatureState', () => {
  it('is null when the record never asked for signatures', () => {
    expect(signatureState({ requiresSignatures: false, status: 'published' })).toBeNull();
  });

  it('reads as signed once approved', () => {
    expect(
      signatureState({
        requiresSignatures: true,
        status: 'approved',
        signatureProgress: { signed: 3, total: 3 },
      })
    ).toEqual({ label: 'Fully signed', tone: 'success' });
  });

  it('counts progress while signatures are outstanding', () => {
    expect(
      signatureState({
        requiresSignatures: true,
        status: 'pending_signatures',
        signatureProgress: { signed: 1, total: 4 },
      })
    ).toEqual({ label: '1 of 4 signed', tone: 'warning' });
  });

  it('never reports "0 of 0" as if it were done', () => {
    expect(
      signatureState({
        requiresSignatures: true,
        status: 'pending_signatures',
        signatureProgress: { signed: 0, total: 0 },
      })?.label
    ).toBe('No committee to sign yet');
  });
});

describe('labels', () => {
  it('names record types and committee titles', () => {
    expect(governanceTypeLabel('meeting_minutes')).toBe('Meeting minutes');
    expect(governanceTypeLabel('other')).toBe('Document');
    expect(committeeTitleLabel('vice_president')).toBe('Vice president');
    expect(committeeTitleLabel('unknown')).toBe('Member');
  });
});

describe('committeeOrder', () => {
  const m = (id: string, title: CommitteeMember['title'], appointedAt: string) =>
    ({ id, title, appointedAt }) as CommitteeMember;

  it('ranks the board by title, then by who has served longest', () => {
    const order = committeeOrder([
      m('a', 'member', '2025-01-01'),
      m('b', 'treasurer', '2025-03-01'),
      m('c', 'president', '2025-06-01'),
      m('d', 'member', '2024-01-01'),
    ]).map((x) => x.id);
    expect(order).toEqual(['c', 'b', 'd', 'a']);
  });

  it('does not mutate its input', () => {
    const input = [m('a', 'member', '2025-01-01'), m('b', 'president', '2025-01-01')];
    committeeOrder(input);
    expect(input.map((x) => x.id)).toEqual(['a', 'b']);
  });
});

const statement = (over: Partial<EstateStatement> = {}): EstateStatement => ({
  id: 's',
  periodStart: '2026-09-01',
  periodEnd: '2026-09-30',
  grossIncome: 100_000,
  totalExpenses: 0,
  managementFee: 5_000,
  netPayout: 95_000,
  status: 'ISSUED',
  payoutStatus: 'PAID',
  paidAt: null,
  generatedAt: '2026-10-01',
  issuedAt: '2026-10-01',
  ...over,
});

describe('statements', () => {
  it('badges a draft as a draft whatever its payout field says', () => {
    expect(statementBadge(statement({ status: 'DRAFT', payoutStatus: 'PENDING' })).label).toBe(
      'Draft'
    );
    expect(statementBadge(statement({ payoutStatus: 'FAILED' })).tone).toBe('danger');
  });

  it('offers a retry only for an issued payout that failed or was held back', () => {
    expect(canRetryPayout(statement({ payoutStatus: 'FAILED' }))).toBe(true);
    expect(canRetryPayout(statement({ payoutStatus: 'REJECTED' }))).toBe(true);
    expect(canRetryPayout(statement({ payoutStatus: 'AWAITING_APPROVAL' }))).toBe(false);
    expect(canRetryPayout(statement({ status: 'DRAFT', payoutStatus: 'FAILED' }))).toBe(false);
  });

  it('adds VAT and markup steps to the ladder only when charged', () => {
    expect(statementLadder(statement()).map((r) => r.label)).toEqual([
      'Gross income',
      'Expenses',
      'Management fee',
    ]);
    expect(
      statementLadder(statement({ vatAmount: 375, maintenanceMarkup: 1_000 })).map((r) => r.label)
    ).toEqual([
      'Gross income',
      'Expenses',
      'Maintenance markup',
      'Management fee',
      'VAT on the fee',
    ]);
  });

  it('explains a dispute hold ahead of a second-approval hold', () => {
    const hold = payoutHold(
      statement({
        payoutStatus: 'AWAITING_APPROVAL',
        disputeSummary: { openCount: 2, totalCount: 2, moneyEffect: 'HELD', reason: 'Wrong unit' },
      })
    );
    expect(hold?.title).toBe('Paused while a line is disputed');
    expect(hold?.body).toContain('2 lines');
    expect(hold?.quote).toBe('Wrong unit');
  });

  it('names the two-person threshold when waiting for a second check', () => {
    const hold = payoutHold(
      statement({
        payoutStatus: 'AWAITING_APPROVAL',
        release: {
          id: 'r',
          amount: 95_000,
          status: 'PENDING',
          requestedAt: '2026-10-01',
          decidedAt: null,
          decisionNote: null,
          thresholdAtRequest: 50_000,
        },
      })
    );
    expect(hold?.body).toContain('₦50,000');
  });

  it('says nothing is held for a draft or a paid statement', () => {
    expect(payoutHold(statement({ status: 'DRAFT', payoutStatus: 'PENDING' }))).toBeNull();
    expect(payoutHold(statement())).toBeNull();
  });

  it('does not claim a dispute paused money that has already gone', () => {
    const hold = payoutHold(
      statement({
        disputeSummary: { openCount: 1, totalCount: 1, moneyEffect: 'PAID', reason: null },
      })
    );
    expect(hold?.body).toContain('already been sent');
  });

  it('reports a held or failed payout as not ok', () => {
    expect(payoutOutcome('PAID', 'issue').ok).toBe(true);
    expect(payoutOutcome('AWAITING_APPROVAL', 'retry').ok).toBe(true);
    expect(payoutOutcome('FAILED', 'issue').ok).toBe(false);
    expect(payoutOutcome('REJECTED', 'retry').ok).toBe(false);
  });

  it('defaults to the last full calendar month', () => {
    expect(lastMonthPeriod(new Date(2026, 9, 10))).toEqual({
      periodStart: '2026-09-01',
      periodEnd: '2026-09-30',
    });
    expect(lastMonthPeriod(new Date(2026, 0, 15))).toEqual({
      periodStart: '2025-12-01',
      periodEnd: '2025-12-31',
    });
  });

  it('accepts only a real bank code and a ten-digit account number', () => {
    expect(payoutAccountValid('058', '0123456789')).toBe(true);
    expect(payoutAccountValid('58', '0123456789')).toBe(false);
    expect(payoutAccountValid('058', '012345678')).toBe(false);
    expect(payoutAccountValid('05a', '0123456789')).toBe(false);
  });
});

describe('microsite', () => {
  it('validates links the way the API does', () => {
    expect(isValidSlug('sunrise-estate')).toBe(true);
    expect(isValidSlug('sunrise--estate')).toBe(false);
    expect(isValidSlug('-sunrise')).toBe(false);
    expect(isValidSlug('Sunrise')).toBe(false);
    expect(isValidSlug('a'.repeat(61))).toBe(false);
  });

  it('turns what was typed into a usable link where it can', () => {
    expect(normaliseSlug('Sunrise Estate')).toBe('sunrise-estate');
    expect(normaliseSlug('Lekki  Phase 1!')).toBe('lekki-phase-1');
  });

  it('builds the public address on the website', () => {
    expect(micrositeUrl('https://getrentos.com/', 'sunrise')).toBe(
      'https://getrentos.com/e/sunrise'
    );
  });
});

describe('governanceKeys', () => {
  it('nests every key under the estate so one invalidation reaches them all', () => {
    const root = ['estate-manager', 'e1'];
    for (const key of [
      governanceKeys.records('e1'),
      governanceKeys.committee('e1'),
      governanceKeys.statement('e1', 's1'),
      governanceKeys.microsite('e1'),
      governanceKeys.payoutAccount('e1'),
    ]) {
      expect(key.slice(0, 2)).toEqual(root);
    }
    expect(governanceKeys.statementList('e1').slice(0, 3)).toEqual(governanceKeys.statements('e1'));
  });
});
