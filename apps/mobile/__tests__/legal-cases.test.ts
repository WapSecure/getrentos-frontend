import {
  needsAttention,
  nextLine,
  openBlocker,
  primaryAction,
  timelineFor,
  type LegalCase,
} from '@/lib/api/legalCases';

const legalCase = (over: Partial<LegalCase> = {}): LegalCase => ({
  id: 'c1',
  kind: 'RENT_RECOVERY',
  kindLabel: 'Rent recovery',
  status: 'OPEN',
  description: 'Rent unpaid for two quarters.',
  propertyId: 'p1',
  property: { id: 'p1', title: 'Flat', address: '1 Road', city: 'Ikeja', state: 'Lagos' },
  leaseId: 'l1',
  unitName: null,
  tenantId: null,
  tenantName: null,
  court: null,
  suitNumber: null,
  filedAt: null,
  outcome: null,
  outcomeAt: null,
  outcomeNotes: null,
  enforcementMethod: null,
  enforcementAt: null,
  enforcementNotes: null,
  advocateName: null,
  advocateFirm: null,
  advocateContact: null,
  advocateFeeAgreement: null,
  advocateInstructedAt: null,
  openedById: 'u1',
  openedByName: 'Ada',
  closedAt: null,
  createdAt: '2026-10-01T09:00:00Z',
  hearings: [],
  nextHearingAt: null,
  ladderReadyToFile: null,
  outstanding: [],
  costs: { totalAmount: 0, items: [] },
  ...over,
});

const hearing = (over: Partial<LegalCase['hearings'][number]> = {}) => ({
  id: 'h1',
  scheduledFor: '2026-11-20T09:00:00Z',
  heldAt: null,
  outcome: null,
  purpose: null,
  notes: null,
  ...over,
});

describe('primaryAction', () => {
  it('offers filing for an open case that is ready', () => {
    expect(primaryAction(legalCase()).kind).toBe('file');
  });

  it('blocks an eviction with no tenancy, or one whose notices have not run out', () => {
    expect(primaryAction(legalCase({ kind: 'EVICTION', leaseId: null }))).toMatchObject({
      kind: 'blocked',
      title: 'Cannot be filed',
    });
    expect(primaryAction(legalCase({ kind: 'EVICTION', ladderReadyToFile: false }))).toMatchObject({
      kind: 'blocked',
      title: 'Not ready to file',
    });
  });

  it('asks for a date on a filed case with none, and the record of the next sitting otherwise', () => {
    expect(primaryAction(legalCase({ status: 'FILED' })).kind).toBe('schedule');
    const later = hearing({ id: 'h2', scheduledFor: '2026-12-20T09:00:00Z' });
    const action = primaryAction(
      legalCase({
        status: 'FILED',
        hearings: [later, hearing(), hearing({ id: 'h0', heldAt: '2026-10-10T09:00:00Z' })],
      })
    );
    expect(action).toEqual({ kind: 'record', hearing: hearing() });
  });

  it('asks for enforcement once decided, and nothing once closed or withdrawn', () => {
    expect(primaryAction(legalCase({ status: 'DECIDED' })).kind).toBe('enforce');
    expect(
      primaryAction(legalCase({ status: 'DECIDED', enforcementAt: '2026-11-04T09:00:00Z' })).kind
    ).toBe('none');
    expect(primaryAction(legalCase({ status: 'CLOSED' })).kind).toBe('none');
    expect(primaryAction(legalCase({ status: 'WITHDRAWN' })).kind).toBe('none');
  });
});

describe('needsAttention and nextLine', () => {
  const fmt = (iso: string) => iso.slice(0, 10);

  it('flags blocked, undated and unenforced cases', () => {
    const blocked = legalCase({
      outstanding: [{ action: 'Not ready to file', detail: '' }],
    });
    expect(needsAttention(blocked)).toBe(true);
    expect(nextLine(blocked, fmt)).toEqual({ text: 'Cannot file yet', warn: true });
    expect(needsAttention(legalCase({ status: 'FILED' }))).toBe(true);
    expect(needsAttention(legalCase({ status: 'DECIDED' }))).toBe(true);
    expect(needsAttention(legalCase())).toBe(false);
  });

  it('shows the next sitting when there is one', () => {
    const c = legalCase({ status: 'FILED', nextHearingAt: '2026-11-20T09:00:00Z' });
    expect(needsAttention(c)).toBe(false);
    expect(nextLine(c, fmt)).toEqual({ text: 'Next sitting 2026-11-20', warn: false });
  });
});

describe('timelineFor', () => {
  it('reads oldest first, with the scheduled sitting last', () => {
    const entries = timelineFor(
      legalCase({
        status: 'FILED',
        filedAt: '2026-10-05T09:00:00Z',
        court: 'Lagos High Court',
        suitNumber: 'LD/1/2026',
        hearings: [
          hearing(),
          hearing({ id: 'h0', heldAt: '2026-10-15T09:00:00Z', outcome: 'ADJOURNED' }),
        ],
      })
    );
    expect(entries.map((e) => e.title)).toEqual([
      'Case opened',
      'Filed in court',
      'Sitting adjourned',
      'Hearing scheduled',
    ]);
    expect(entries[1].detail).toBe('Lagos High Court · LD/1/2026');
    expect(entries[2].tone).toBe('warn');
  });
});

describe('openBlocker', () => {
  const ok = {
    kind: 'RENT_RECOVERY' as const,
    leaseId: '',
    propertyId: 'p1',
    description: 'Rent unpaid since June.',
  };

  it('needs a tenancy for an eviction, and a tenancy or property otherwise', () => {
    expect(openBlocker(ok)).toBeNull();
    expect(openBlocker({ ...ok, kind: 'EVICTION' })).toMatch(/tenancy/);
    expect(openBlocker({ ...ok, kind: 'EVICTION', leaseId: 'l1' })).toBeNull();
    expect(openBlocker({ ...ok, propertyId: '' })).toMatch(/property/);
  });

  it('needs a description of at least ten characters', () => {
    expect(openBlocker({ ...ok, description: ' short ' })).toMatch(/10 characters/);
  });
});
