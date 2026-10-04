import {
  bookingBuckets,
  byUrgency,
  chargeAudience,
  cleanPollOptions,
  closingNoteRequired,
  dueTotal,
  dueWhen,
  isDueOpen,
  isFreeEstate,
  isLivePass,
  isOpenItem,
  leadingOptions,
  normalisePlate,
  owed,
  pickEstate,
  pollShare,
  rollOrder,
  turnout,
  type AmenityBooking,
  type Due,
  type MusterRollEntry,
} from '@/lib/api/estateManager';

const due = (over: Partial<Due>): Due =>
  ({
    id: 'd',
    householdId: 'h',
    unitLabel: 'A1',
    residentName: 'Ada',
    amount: 10_000,
    dueDate: '2026-10-10T22:59:00.000Z',
    status: 'pending',
    lateFeeApplied: 0,
    category: 'levy',
    billingCycle: 'monthly',
    isRecurring: false,
    createdAt: '2026-10-01T00:00:00.000Z',
    ...over,
  }) as Due;

describe('choosing the estate to open', () => {
  const estates = [{ id: 'a' }, { id: 'b' }];
  it('reopens the one last chosen', () => {
    expect(pickEstate(estates, 'b')?.id).toBe('b');
  });
  it('falls back to the first when the choice is gone or was never made', () => {
    expect(pickEstate(estates, 'gone')?.id).toBe('a');
    expect(pickEstate(estates, null)?.id).toBe('a');
  });
  it('has nothing to open with no estates', () => {
    expect(pickEstate([], 'a')).toBeUndefined();
    expect(pickEstate(undefined, 'a')).toBeUndefined();
  });
});

describe('estate plan', () => {
  it('treats an unknown plan as paid, so a bought feature is never hidden', () => {
    expect(isFreeEstate({ planTier: 'FREE' })).toBe(true);
    expect(isFreeEstate({ planTier: 'PRO' })).toBe(false);
    expect(isFreeEstate({})).toBe(false);
    expect(isFreeEstate(undefined)).toBe(false);
  });
});

describe('what a household owes', () => {
  it('adds the late fee to what a due costs', () => {
    expect(dueTotal(due({ amount: 10_000, lateFeeApplied: 2_500 }))).toBe(12_500);
  });

  it('counts open dues only, and says how much of it is overdue', () => {
    const result = owed([
      due({ status: 'pending', amount: 10_000 }),
      due({ status: 'overdue', amount: 20_000, lateFeeApplied: 5_000 }),
      due({ status: 'processing', amount: 4_000 }),
      due({ status: 'paid', amount: 99_000 }),
      due({ status: 'waived', amount: 99_000 }),
    ]);
    expect(result).toEqual({ total: 39_000, overdue: 25_000, count: 3 });
  });

  it('treats a due being paid online as still open', () => {
    expect(isDueOpen({ status: 'processing' })).toBe(true);
    expect(isDueOpen({ status: 'paid' })).toBe(false);
    expect(isDueOpen({ status: 'waived' })).toBe(false);
  });
});

describe('when a due falls', () => {
  const now = new Date(2026, 9, 10, 9, 0);
  const on = (day: number) => new Date(2026, 9, day, 23, 59).toISOString();

  it('counts whole days either side of today', () => {
    expect(dueWhen(due({ dueDate: on(10) }), now)).toBe('Due today');
    expect(dueWhen(due({ dueDate: on(11) }), now)).toBe('Due in 1 day');
    expect(dueWhen(due({ dueDate: on(15) }), now)).toBe('Due in 5 days');
    expect(dueWhen(due({ dueDate: on(9), status: 'overdue' }), now)).toBe('1 day overdue');
    expect(dueWhen(due({ dueDate: on(3), status: 'overdue' }), now)).toBe('7 days overdue');
  });

  it('says a settled due is settled, whatever its date', () => {
    expect(dueWhen(due({ dueDate: on(1), status: 'paid' }), now)).toBe('Paid');
    expect(dueWhen(due({ dueDate: on(1), status: 'waived' }), now)).toBe('Waived');
  });
});

describe('who a charge reaches', () => {
  it('names every active household when none are picked', () => {
    expect(chargeAudience(0, 1240)).toBe('Every active household (1,240)');
  });
  it('counts the picked ones', () => {
    expect(chargeAudience(1, 50)).toBe('1 selected household');
    expect(chargeAudience(3, 50)).toBe('3 selected households');
  });
});

describe('office queues', () => {
  it('puts the most urgent first, and the longest-waiting first within a level', () => {
    const items = [
      { id: 'low', priority: 'low', createdAt: '2026-10-01' },
      { id: 'crit-new', priority: 'critical', createdAt: '2026-10-03' },
      { id: 'high', priority: 'high', createdAt: '2026-10-02' },
      { id: 'crit-old', priority: 'critical', createdAt: '2026-10-01' },
      { id: 'urgent', priority: 'urgent', createdAt: '2026-10-02' },
    ];
    expect(byUrgency(items).map((i) => i.id)).toEqual([
      'crit-old',
      'urgent',
      'crit-new',
      'high',
      'low',
    ]);
  });

  it('knows what is still waiting on the office', () => {
    for (const s of ['open', 'in_progress', 'reported', 'warning_issued']) {
      expect(isOpenItem(s)).toBe(true);
    }
    expect(isOpenItem('resolved')).toBe(false);
    expect(isOpenItem('dismissed')).toBe(false);
  });
});

describe('emergency roll call', () => {
  const entry = (id: string, unitLabel: string, state: MusterRollEntry['state']) =>
    ({ id, unitLabel, personName: id, state }) as MusterRollEntry;

  it('lists people needing help first, then the missing, then the settled, by unit', () => {
    const roll = [
      entry('safe', 'A1', 'ACCOUNTED'),
      entry('missing-10', 'A10', 'UNACCOUNTED'),
      entry('away', 'A3', 'NOT_ON_SITE'),
      entry('help', 'C9', 'NEEDS_HELP'),
      entry('missing-2', 'A2', 'UNACCOUNTED'),
    ];
    // A2 before A10: units sort the way a marshal walks them, not as text.
    expect(rollOrder(roll).map((e) => e.id)).toEqual([
      'help',
      'missing-2',
      'missing-10',
      'safe',
      'away',
    ]);
  });

  it('asks for an explanation only when standing down with people missing', () => {
    expect(closingNoteRequired({ unaccounted: 2 })).toBe(true);
    expect(closingNoteRequired({ unaccounted: 0 })).toBe(false);
  });
});

describe('the gate', () => {
  it('reads a registration the way the gate matches it', () => {
    expect(normalisePlate('abc-123 de')).toBe('ABC123DE');
    expect(normalisePlate('  LND 45 xy ')).toBe('LND45XY');
  });

  it('knows which passes are still usable or in use', () => {
    expect(isLivePass('pending')).toBe(true);
    expect(isLivePass('checked_in')).toBe(true);
    expect(isLivePass('checked_out')).toBe(false);
    expect(isLivePass('revoked')).toBe(false);
  });
});

describe('polls', () => {
  const poll = (votes: number[]) => ({
    totalVotes: votes.reduce((a, b) => a + b, 0),
    options: votes.map((voteCount, i) => ({ id: `o${i}`, label: `Option ${i}`, voteCount })),
  });

  it('gives each option its share, and 0 rather than NaN before anyone votes', () => {
    expect(pollShare(3, 12)).toBe(25);
    expect(pollShare(1, 3)).toBe(33);
    expect(pollShare(0, 0)).toBe(0);
  });

  it('names the option in front, both of them on a tie, and none on an empty poll', () => {
    expect(leadingOptions(poll([2, 5, 1]))).toEqual(['o1']);
    expect(leadingOptions(poll([4, 4, 1]))).toEqual(['o0', 'o1']);
    expect(leadingOptions(poll([0, 0]))).toEqual([]);
  });

  it('reports turnout against the households that could vote', () => {
    expect(turnout(30, 120)).toBe('30 of 120 households (25%)');
    expect(turnout(1, 0)).toBe('1 vote');
  });

  it('keeps only distinct, non-empty choices', () => {
    expect(cleanPollOptions([' Yes ', 'yes', '', 'No'])).toEqual(['Yes', 'No']);
  });
});

describe('amenity bookings', () => {
  const now = new Date('2026-10-04T12:00:00.000Z');
  const booking = (id: string, startsAt: string, status: AmenityBooking['status'] = 'confirmed') =>
    ({
      id,
      startsAt,
      endsAt: new Date(new Date(startsAt).getTime() + 3_600_000).toISOString(),
      status,
    }) as AmenityBooking;

  it('puts what is still ahead first, soonest first, and everything else under earlier', () => {
    const b = bookingBuckets(
      [
        booking('later', '2026-10-06T10:00:00.000Z'),
        booking('gone', '2026-10-01T10:00:00.000Z'),
        booking('soon', '2026-10-04T15:00:00.000Z'),
        booking('cancelled', '2026-10-05T10:00:00.000Z', 'cancelled'),
        // Started but not finished: still in use, so still ahead.
        booking('now', '2026-10-04T11:30:00.000Z'),
      ],
      now
    );
    expect(b.upcoming.map((x) => x.id)).toEqual(['now', 'soon', 'later']);
    expect(b.past.map((x) => x.id)).toEqual(['cancelled', 'gone']);
  });
});
