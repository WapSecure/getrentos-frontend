import {
  humanizeMinutes,
  indicativeMonthly,
  intakeBlocker,
  noticeEndsAt,
  openForFirm,
  propertyState,
  type ManagedIntake,
  type Mandate,
} from '@/lib/api/managedService';

const mandate = (over: Partial<Mandate> = {}): Mandate => ({
  id: 'm1',
  propertyId: 'p1',
  managerIsSureground: true,
  servicingTier: 'FULL_MANAGEMENT',
  noticePeriodDays: 30,
  noticeServedAt: null,
  handoverAt: null,
  activatedAt: '2026-10-02T00:00:00Z',
  status: 'ACTIVE',
  createdAt: '2026-10-01T00:00:00Z',
  ...over,
});

const intake = (over: Partial<ManagedIntake> = {}): ManagedIntake => ({
  id: 'i1',
  status: 'SUBMITTED',
  proposalExpired: false,
  propertyId: 'p1',
  propertyTitle: 'Flat',
  requestedTier: 'FULL_MANAGEMENT',
  indicativeFeePct: 10,
  indicativeMonthlyFee: null,
  assessorName: null,
  assessmentScheduledFor: null,
  findings: null,
  proposal: null,
  acceptedAt: null,
  declinedReason: null,
  createdAt: '2026-10-01T00:00:00Z',
  ...over,
});

describe('propertyState', () => {
  it('reads a live Sureground engagement, and one being set up after acceptance', () => {
    expect(propertyState('p1', [mandate()], []).kind).toBe('sureground');
    const s = propertyState(
      'p1',
      [mandate({ status: 'PENDING_OPS' })],
      [intake({ status: 'ACCEPTED' })]
    );
    expect(s).toMatchObject({ kind: 'sureground', settingUp: { status: 'ACCEPTED' } });
  });

  it('reads a firm, carrying an open request to move to Sureground', () => {
    const s = propertyState('p1', [mandate({ managerIsSureground: false })], [intake()]);
    expect(s).toMatchObject({ kind: 'firm', openIntake: { id: 'i1' } });
  });

  it('uses the newest mandate, so an old ended one does not hide a live one', () => {
    const newest = mandate({ id: 'new' });
    const old = mandate({ id: 'old', status: 'TERMINATED', handoverAt: '2026-01-01' });
    expect(propertyState('p1', [newest, old], [])).toMatchObject({ mandate: { id: 'new' } });
  });

  it('is winding down until the handover is confirmed, then free again', () => {
    expect(propertyState('p1', [mandate({ status: 'TERMINATED' })], []).kind).toBe('winding-down');
    expect(
      propertyState('p1', [mandate({ status: 'TERMINATED', handoverAt: '2026-11-01' })], []).kind
    ).toBe('none');
  });

  it('needs no handover for a request cancelled before it went live', () => {
    expect(
      propertyState('p1', [mandate({ status: 'TERMINATED', activatedAt: null })], []).kind
    ).toBe('none');
  });

  it('shows an open request, or the last decline, when nothing manages it', () => {
    expect(propertyState('p1', [], [intake({ status: 'PROPOSED' })]).kind).toBe('requested');
    expect(
      propertyState('p1', [], [intake({ status: 'DECLINED', declinedReason: 'Too far' })])
    ).toMatchObject({ kind: 'none', declined: { declinedReason: 'Too far' } });
    expect(propertyState('p1', [], [intake({ status: 'WITHDRAWN' })])).toEqual({
      kind: 'none',
      declined: null,
    });
  });
});

describe('openForFirm', () => {
  it('leaves out properties that are managed or still handing over', () => {
    const mandates = [
      mandate({ propertyId: 'a' }),
      mandate({ propertyId: 'b', status: 'TERMINATED' }),
      mandate({ propertyId: 'c', status: 'REJECTED' }),
    ];
    expect(openForFirm(['a', 'b', 'c', 'd'], mandates)).toEqual(['c', 'd']);
  });
});

describe('helpers', () => {
  it('reads minutes as an owner would', () => {
    expect(humanizeMinutes(45)).toBe('45 min');
    expect(humanizeMinutes(60)).toBe('1 hour');
    expect(humanizeMinutes(2880)).toBe('2 days');
  });

  it('works out when notice ends', () => {
    expect(noticeEndsAt({ noticeServedAt: null, noticePeriodDays: 30 })).toBeNull();
    expect(noticeEndsAt({ noticeServedAt: '2026-11-01T00:00:00.000Z', noticePeriodDays: 30 })).toBe(
      '2026-12-01T00:00:00.000Z'
    );
  });

  it('estimates the monthly fee only with a rent roll', () => {
    expect(indicativeMonthly(1_200_000, 10)).toBe(10_000);
    expect(indicativeMonthly(0, 10)).toBeNull();
  });

  it('checks units and occupancy', () => {
    expect(intakeBlocker('4', '2')).toBeNull();
    expect(intakeBlocker('0', '0')).toMatch(/at least 1/);
    expect(intakeBlocker('2', '3')).toMatch(/more than units/);
    expect(intakeBlocker('2', '1.5')).toMatch(/occupied/);
  });
});
