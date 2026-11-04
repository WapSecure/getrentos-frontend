import {
  arrearsStage,
  daysOverdue,
  noticeFacts,
  raiseBlocker,
  type TenancyNotice,
} from '@/lib/api/tenancyNotices';

const notice = (over: Partial<TenancyNotice> = {}): TenancyNotice => ({
  id: 'n1',
  leaseId: 'l1',
  kind: 'NOTICE_TO_QUIT',
  kindLabel: 'Notice to quit',
  rung: 3,
  state: 'DRAFT',
  reason: 'Rent unpaid for the quarter',
  arrearsAmount: null,
  jurisdiction: 'NG-LA',
  periodDays: 90,
  periodSource: 'TABLE',
  periodBasis: null,
  serviceDate: null,
  serviceMethod: null,
  servedAt: null,
  expiresAt: null,
  daysRemaining: null,
  evidenceNote: null,
  withdrawnAt: null,
  createdByName: null,
  createdAt: '2026-10-01T00:00:00.000Z',
  property: null,
  tenantName: null,
  ...over,
});

const fmt = (iso: string) => iso.slice(0, 10);

describe('noticeFacts', () => {
  it('says a draft is unserved and how long it will run', () => {
    expect(noticeFacts(notice(), fmt)).toEqual(['Not served', 'Runs 90 days from service']);
  });

  it('counts down a running notice', () => {
    const running = notice({
      state: 'SERVED',
      serviceDate: '2026-10-01',
      expiresAt: '2026-12-30',
      daysRemaining: 1,
    });
    expect(noticeFacts(running, fmt)).toEqual([
      'Served 2026-10-01',
      'Runs to 2026-12-30 · 1 day left',
    ]);
  });

  it('speaks of a finished or taken-back step in the past, and names a typed period', () => {
    const spent = notice({
      state: 'WITHDRAWN',
      serviceDate: '2026-10-01',
      expiresAt: '2026-12-30',
      daysRemaining: 10,
      periodSource: 'MANUAL',
    });
    expect(noticeFacts(spent, fmt)).toEqual([
      'Served 2026-10-01',
      'Ran to 2026-12-30',
      'Period typed for this notice',
    ]);
  });

  it('says when a step does not count down at all', () => {
    expect(noticeFacts(notice({ periodDays: null }), fmt)[1]).toMatch(/does not count down/);
  });
});

describe('raiseBlocker', () => {
  const base = {
    kind: 'NOTICE_TO_QUIT' as const,
    reason: 'Rent for the quarter is unpaid',
    manualDays: '',
    manualBasis: '',
    periodMissing: false,
  };

  it('lets a well-formed notice through', () => {
    expect(raiseBlocker(base)).toBeNull();
  });

  it('wants a reason the tenant can read', () => {
    expect(raiseBlocker({ ...base, reason: 'unpaid' })).toMatch(/10\+ characters/);
  });

  it('refuses a statutory step with no recorded period unless one is typed with a basis', () => {
    expect(raiseBlocker({ ...base, periodMissing: true })).toMatch(/No period is recorded/);
    expect(raiseBlocker({ ...base, periodMissing: true, manualDays: '30' })).toMatch(/basis/);
    expect(
      raiseBlocker({
        ...base,
        periodMissing: true,
        manualDays: '30',
        manualBasis: 'Counsel advised 30 days on 12 Oct',
      })
    ).toBeNull();
  });

  it('rejects a typed period that is not a number of days', () => {
    expect(raiseBlocker({ ...base, manualDays: '0', manualBasis: 'Counsel advised it' })).toMatch(
      /whole days/
    );
  });
});

describe('arrears', () => {
  const now = Date.parse('2026-11-04T12:00:00Z');

  it('counts whole days overdue and never goes negative', () => {
    expect(daysOverdue('2026-11-01T00:00:00Z', now)).toBe(3);
    expect(daysOverdue('2026-12-01T00:00:00Z', now)).toBe(0);
  });

  it('escalates the stage at 14 and 30 days', () => {
    expect(arrearsStage(13).label).toBe('Overdue');
    expect(arrearsStage(14).label).toBe('Escalating');
    expect(arrearsStage(30).label).toBe('Seriously overdue');
  });
});
