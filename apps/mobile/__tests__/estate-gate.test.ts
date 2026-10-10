import { ApiError } from '@/lib/api/client';
import {
  contractorDraftError,
  contractorPassBody,
  daySpan,
  formatMinutes,
  gateKeys,
  hasFullName,
  lacksTier,
  moveItem,
  onSiteOrder,
  planRefusal,
  retryUnlessPlanGate,
  roundOrder,
  routeDraftError,
  toggleDay,
  vehiclePurposeLabel,
  windowLabel,
  windowStart,
  type ContractorDraft,
  type OnSiteEntry,
  type PatrolRound,
} from '@/lib/api/estateGate';

const draft = (over: Partial<ContractorDraft> = {}): ContractorDraft => ({
  householdId: 'h1',
  name: 'Chinedu Okafor',
  phone: '',
  company: '',
  trade: '',
  validFrom: '2026-10-10',
  validUntil: '2027-04-10',
  daysOfWeek: [],
  restrictHours: false,
  dailyFrom: '08:00',
  dailyTo: '17:00',
  ...over,
});

describe('plan gating', () => {
  it('locks only on a known shortfall; an unknown plan fails open', () => {
    expect(lacksTier('FREE')).toBe(true);
    expect(lacksTier('PRO')).toBe(true);
    expect(lacksTier('ENTERPRISE')).toBe(false);
    expect(lacksTier(undefined)).toBe(false);
    expect(lacksTier('PRO', 'PRO')).toBe(false);
  });

  it('reads the plan refusal the API sends', () => {
    const err = new ApiError(
      'Dwell analytics is an Enterprise feature.',
      403,
      'PLAN_UPGRADE_REQUIRED',
      {
        required: 'ENTERPRISE',
        current: 'PRO',
      }
    );
    expect(planRefusal(err)).toEqual({ required: 'ENTERPRISE', current: 'PRO' });
    expect(planRefusal(new ApiError('Paywalled', 402))).toEqual({
      required: 'ENTERPRISE',
      current: undefined,
    });
  });

  it('ignores other errors', () => {
    expect(planRefusal(new ApiError('Forbidden', 403, 'FORBIDDEN'))).toBeNull();
    expect(planRefusal(new Error('boom'))).toBeNull();
    expect(planRefusal(undefined)).toBeNull();
  });

  it('never retries a plan refusal, retries other failures twice', () => {
    const gate = new ApiError('x', 403, 'PLAN_UPGRADE_REQUIRED');
    expect(retryUnlessPlanGate(0, gate)).toBe(false);
    expect(retryUnlessPlanGate(0, new Error('net'))).toBe(true);
    expect(retryUnlessPlanGate(2, new Error('net'))).toBe(false);
  });
});

describe('query keys', () => {
  it('sit under the estate so an estate-wide invalidation clears them', () => {
    expect(gateKeys.vehicles('e1', 'inside').slice(0, 2)).toEqual(['estate-manager', 'e1']);
    expect(gateKeys.patrolReport('e1', 'x').slice(0, 4)).toEqual([
      'estate-manager',
      'e1',
      'gate',
      'patrol',
    ]);
  });
});

describe('regular visitors', () => {
  it('needs a surname or a phone', () => {
    expect(hasFullName('Chinedu Okafor')).toBe(true);
    expect(hasFullName('  Chinedu  ')).toBe(false);
    expect(contractorDraftError(draft({ name: 'Chinedu' }))).toMatch(/surname or a phone/);
    expect(contractorDraftError(draft({ name: 'Chinedu', phone: '0803' }))).toBeNull();
  });

  it('needs a household and a name', () => {
    expect(contractorDraftError(draft({ householdId: undefined }))).toMatch(/household/);
    expect(contractorDraftError(draft({ name: ' ' }))).toMatch(/name/);
  });

  it('counts both days and caps the span at 366', () => {
    expect(daySpan('2026-10-10', '2026-10-10')).toBe(0);
    expect(daySpan('2026-10-10', '2026-10-09')).toBe(-1);
    expect(contractorDraftError(draft({ validUntil: '2026-10-10' }))).toBeNull();
    expect(contractorDraftError(draft({ validUntil: '2026-10-09' }))).toMatch(/end on or after/);
    // 10 Oct 2026 to 10 Oct 2027 inclusive is 366 days: allowed.
    expect(contractorDraftError(draft({ validUntil: '2027-10-10' }))).toBeNull();
    expect(contractorDraftError(draft({ validUntil: '2027-10-11' }))).toMatch(/367 days/);
  });

  it('wants both hours, and not the same one, when hours are limited', () => {
    expect(contractorDraftError(draft({ restrictHours: true, dailyTo: '08:00' }))).toMatch(
      /can’t be the same/
    );
    expect(contractorDraftError(draft({ restrictHours: true, dailyTo: '' }))).toMatch(/both/);
    // A night shift crosses midnight.
    expect(
      contractorDraftError(draft({ restrictHours: true, dailyFrom: '22:00', dailyTo: '06:00' }))
    ).toBeNull();
  });

  it('builds the API body from the first instant to the last of the chosen days', () => {
    const body = contractorPassBody(
      draft({ phone: ' 0803 ', company: '', trade: 'Cleaner', daysOfWeek: [2] })
    );
    expect(body).toEqual({
      householdId: 'h1',
      name: 'Chinedu Okafor',
      phone: '0803',
      trade: 'Cleaner',
      validFrom: new Date('2026-10-10T00:00:00').toISOString(),
      validUntil: new Date('2027-04-10T23:59:59').toISOString(),
      daysOfWeek: [2],
    });
    expect(contractorPassBody(draft({ restrictHours: true }))).toMatchObject({
      dailyFrom: '08:00',
      dailyTo: '17:00',
    });
  });

  it('toggles days in the API’s order', () => {
    expect(toggleDay([], 3)).toEqual([3]);
    expect(toggleDay([5, 1], 0)).toEqual([0, 1, 5]);
    expect(toggleDay([0, 1, 5], 1)).toEqual([0, 5]);
  });
});

describe('dwell', () => {
  it('writes minutes the way the server does', () => {
    expect(formatMinutes(null)).toBe('–');
    expect(formatMinutes(0)).toBe('0m');
    expect(formatMinutes(45)).toBe('45m');
    expect(formatMinutes(120)).toBe('2h');
    expect(formatMinutes(270.4)).toBe('4h 30m');
    expect(formatMinutes(-5)).toBe('0m');
  });

  it('counts a window back from now', () => {
    const now = Date.UTC(2026, 9, 10);
    expect(windowStart(30, now)).toBe(new Date(Date.UTC(2026, 8, 10)).toISOString());
  });

  it('puts overstays first, the furthest over first', () => {
    const e = (passId: string, overstaying: boolean, minutesOver: number, minutesInside: number) =>
      ({ passId, overstaying, minutesOver, minutesInside }) as OnSiteEntry;
    const order = onSiteOrder([
      e('a', false, 0, 300),
      e('b', true, 20, 200),
      e('c', true, 90, 100),
      e('d', false, 0, 600),
    ]).map((x) => x.passId);
    expect(order).toEqual(['c', 'b', 'd', 'a']);
  });
});

describe('patrols', () => {
  it('shows the night nobody walked first', () => {
    const r = (id: string, status: PatrolRound['status'], scheduledFor: string) =>
      ({ id, status, scheduledFor }) as PatrolRound;
    const order = roundOrder([
      r('walked-new', 'COMPLETE', '2026-10-09T22:00:00Z'),
      r('missed-old', 'MISSED', '2026-10-01T22:00:00Z'),
      r('open', 'OPEN', '2026-10-10T22:00:00Z'),
      r('missed-new', 'MISSED', '2026-10-08T22:00:00Z'),
    ]).map((x) => x.id);
    expect(order).toEqual(['missed-new', 'missed-old', 'open', 'walked-new']);
  });

  it('moves a checkpoint within the walk order', () => {
    expect(moveItem(['a', 'b', 'c'], 0, 1)).toEqual(['b', 'a', 'c']);
    expect(moveItem(['a', 'b', 'c'], 2, -1)).toEqual(['a', 'c', 'b']);
    const same = ['a', 'b'];
    expect(moveItem(same, 0, -1)).toBe(same);
    expect(moveItem(same, 1, 1)).toBe(same);
  });

  it('validates a round like the API', () => {
    const ok = {
      name: 'Night round',
      startTime: '22:00',
      windowMinutes: 90,
      daysOfWeek: [],
      checkpointIds: ['c1'],
    };
    expect(routeDraftError(ok)).toBeNull();
    expect(routeDraftError({ ...ok, name: ' ' })).toMatch(/name/);
    expect(routeDraftError({ ...ok, startTime: '24:00' })).toMatch(/starts/);
    expect(routeDraftError({ ...ok, windowMinutes: 4 })).toMatch(/between/);
    expect(routeDraftError({ ...ok, checkpointIds: [] })).toMatch(/at least one/);
  });

  it('labels the window', () => {
    expect(windowLabel(45)).toBe('45 min');
    expect(windowLabel(90)).toBe('1h 30m');
  });
});

describe('labels', () => {
  it('names a vehicle’s purpose whatever its case', () => {
    expect(vehiclePurposeLabel('staff')).toBe('Staff');
    expect(vehiclePurposeLabel('DELIVERY')).toBe('Delivery');
    expect(vehiclePurposeLabel('mystery')).toBe('Other');
  });
});
