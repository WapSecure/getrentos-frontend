import {
  disputeOpen,
  queryStatusBadge,
  querySlaText,
  returnBlocker,
  type DepositDeduction,
  type DepositHold,
  type QuerySummary,
} from '@/lib/api/management';

const deduction = (over: Partial<DepositDeduction> = {}): DepositDeduction => ({
  id: 'd1',
  amount: 10_000,
  reason: 'Repaint',
  status: 'APPROVED',
  inspectionId: null,
  decidedAt: null,
  decisionNote: null,
  tenantDisputedAt: null,
  tenantDisputeReason: null,
  disputeAnsweredAt: null,
  disputeAnswer: null,
  createdAt: '2026-10-01T00:00:00.000Z',
  ...over,
});

const deposit = (deductions: DepositDeduction[], status: DepositHold['status'] = 'HELD') =>
  ({
    id: 'h1',
    leaseId: 'l1',
    propertyId: 'p1',
    propertyTitle: 'Flat 2',
    amount: 500_000,
    status,
    heldBySureground: false,
    returnable: 490_000,
    createdAt: '2026-01-01T00:00:00.000Z',
    takenAt: '2026-01-01T00:00:00.000Z',
    returnedAt: null,
    returnedAmount: null,
    deductions,
    summary: {
      held: 500_000,
      approvedDeductions: 10_000,
      proposedDeductions: 0,
      returnable: 490_000,
    },
  }) satisfies DepositHold;

describe('returnBlocker', () => {
  it('lets a deposit with settled deductions be returned', () => {
    expect(returnBlocker(deposit([deduction()]))).toBeNull();
  });

  it('holds the return while a deduction awaits a decision', () => {
    expect(returnBlocker(deposit([deduction({ status: 'PROPOSED' })]))).toMatch(/proposed/);
  });

  it("holds the return while the tenant's dispute is unanswered", () => {
    const disputed = deduction({ tenantDisputedAt: '2026-10-02T00:00:00.000Z' });
    expect(disputeOpen(disputed)).toBe(true);
    expect(returnBlocker(deposit([disputed]))).toMatch(/dispute/);
  });

  it('treats an answered dispute as settled', () => {
    const answered = deduction({
      tenantDisputedAt: '2026-10-02T00:00:00.000Z',
      disputeAnsweredAt: '2026-10-03T00:00:00.000Z',
    });
    expect(disputeOpen(answered)).toBe(false);
    expect(returnBlocker(deposit([answered]))).toBeNull();
  });

  it('has nothing to block once the deposit is returned', () => {
    expect(returnBlocker(deposit([deduction({ status: 'PROPOSED' })], 'RETURNED'))).toBeNull();
  });
});

const query = (over: Partial<QuerySummary> = {}): QuerySummary => ({
  id: 'q1',
  subject: 'September statement',
  category: 'STATEMENT',
  status: 'OPEN',
  propertyId: 'p1',
  propertyTitle: 'Flat 2',
  ownerName: 'Ada',
  manager: 'Acme Lettings',
  viewerSide: 'OWNER',
  lastActivityAt: '2026-10-01T00:00:00.000Z',
  lastMessage: null,
  messageCount: 1,
  createdAt: '2026-10-01T00:00:00.000Z',
  firstResponseDueAt: '2026-10-02T00:00:00.000Z',
  firstResponseAt: null,
  answeredInHours: null,
  late: false,
  ...over,
});

describe('owner–manager questions', () => {
  const fmt = (iso: string) => iso.slice(0, 10);

  it('reads the status from the viewer’s side', () => {
    expect(queryStatusBadge(query()).label).toBe('Waiting on manager');
    expect(queryStatusBadge(query({ viewerSide: 'MANAGER' })).label).toBe('Waiting on you');
    expect(queryStatusBadge(query({ status: 'RESOLVED' })).tone).toBe('neutral');
  });

  it('states the reply promise in words', () => {
    expect(querySlaText(query(), fmt)).toBe('Reply due by 2026-10-02');
    expect(querySlaText(query({ late: true }), fmt)).toBe('No reply yet: overdue');
    expect(
      querySlaText(query({ firstResponseAt: '2026-10-01T03:00:00Z', answeredInHours: 3 }), fmt)
    ).toBe('Answered in 3 hours');
    expect(
      querySlaText(query({ firstResponseAt: '2026-10-01T00:20:00Z', answeredInHours: 0 }), fmt)
    ).toBe('Answered in under an hour');
  });
});
