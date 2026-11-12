import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildAttentionQueue,
  greetingFor,
  identityProgress,
  portfolioFigures,
  stageProgress,
} from '../src/diaspora/investorWorkspace.ts';

const links = {
  purchase: ({ role, transactionId }: { role: string; transactionId: string }) =>
    role === 'REPRESENTATIVE'
      ? `/representing/transactions/${transactionId}`
      : `/buyer/transactions/${transactionId}`,
  risk: '/buyer/invest/onboarding?step=risk',
  tours: '/buyer/tours',
  approvals: '/owner/approvals',
  identity: '/buyer/trust-profile?tab=abroad',
};

const purchase = (over: Record<string, unknown> = {}) =>
  ({
    transactionId: 'tx1',
    title: 'Three-bedroom flat, Lekki',
    propertyType: 'FLAT',
    role: 'BUYER',
    operationalStage: { code: 'RESERVED', label: 'Reserved with a deposit' },
    moneyStatus: { code: 'PROTECTED', label: 'Deposit protected', covers: 'DEPOSIT', note: '' },
    legalStatus: { code: 'NOT_STARTED', label: 'Not started' },
    nextAction: null,
    waitingForYou: false,
    pendingApprovals: 0,
    ...over,
  }) as never;

const doc = (state: string, reviewDueAt: string | null = null) => ({ state, reviewDueAt }) as never;

test('an empty account has nothing waiting', () => {
  assert.deepEqual(buildAttentionQueue({ links }), []);
});

test('the risk statement comes first when it is still owed', () => {
  const items = buildAttentionQueue({
    riskAccepted: false,
    tours: [{ id: 't1', status: 'PROPOSED', land: 'Plot 4', proposedSlots: [] }],
    links,
  });
  assert.equal(items[0].kind, 'risk');
  assert.equal(items[0].severity, 'urgent');
});

test('a deposit due carries its amount and replaces the same purchase’s own row', () => {
  const items = buildAttentionQueue({
    depositsDue: [{ id: 'tx1', propertyTitle: 'Flat, Lekki', depositAmount: 5_000_000 }],
    purchases: [purchase({ waitingForYou: true, nextAction: 'Pay the deposit' })],
    links,
  });
  assert.equal(items.length, 1);
  assert.equal(items[0].kind, 'deposit');
  assert.match(items[0].detail ?? '', /5,000,000/);
  assert.equal(items[0].link.path, '/buyer/transactions/tx1');
  assert.doesNotMatch(JSON.stringify(items), /escrow/i);
});

test('approvals and representative purchases link to the right workspace', () => {
  const items = buildAttentionQueue({
    purchases: [
      purchase({ pendingApprovals: 2, waitingForYou: true }),
      purchase({
        transactionId: 'tx2',
        role: 'REPRESENTATIVE',
        representing: { principalId: 'u2', principalName: 'Ada Obi' },
        waitingForYou: true,
        nextAction: 'Confirm the inspection',
      }),
      purchase({ transactionId: 'tx3' }),
    ],
    links,
  });
  assert.equal(items.length, 2);
  assert.equal(items[0].title, '2 approvals waiting for you');
  assert.equal(items[1].title, 'Confirm the inspection');
  assert.equal(items[1].detail, 'Three-bedroom flat, Lekki for Ada Obi');
  assert.equal(items[1].link.path, '/representing/transactions/tx2');
});

test('a tour with times offered is due at its earliest slot; other tours are not listed', () => {
  const items = buildAttentionQueue({
    tours: [
      {
        id: 't1',
        status: 'PROPOSED',
        land: 'Plot 4',
        proposedSlots: [{ at: '2026-11-20T10:00:00Z' }, { at: '2026-11-18T09:00:00Z' }],
      },
      { id: 't2', status: 'REQUESTED', land: 'Plot 5' },
    ],
    links,
  });
  assert.equal(items.length, 1);
  assert.equal(items[0].dueAt, '2026-11-18T09:00:00Z');
});

test('tours and spending need their pages to be reachable', () => {
  const items = buildAttentionQueue({
    tours: [{ id: 't1', status: 'PROPOSED', land: 'Plot 4' }],
    spendApprovals: { count: 1, totalAmount: '250000' },
    links: { risk: links.risk, identity: links.identity },
  });
  assert.deepEqual(items, []);
});

test('identity checks: a rejected one is urgent, one in review is information with its date', () => {
  const items = buildAttentionQueue({
    identity: {
      eligible: true,
      passport: doc('APPROVED'),
      address: doc('REJECTED'),
      bankStatement: doc('IN_REVIEW', '2026-11-13T17:00:00Z'),
    } as never,
    links,
  });
  assert.deepEqual(
    items.map((i) => [i.key, i.severity]),
    [
      ['identity-address', 'urgent'],
      ['identity-bankStatement', 'info'],
    ]
  );
  assert.equal(items[1].dueAt, '2026-11-13T17:00:00Z');
});

test('source of funds: a row when required and not started, or rejected; none while with our team', () => {
  const sof = (state: string, required: boolean) =>
    buildAttentionQueue({
      identity: {
        eligible: true,
        passport: doc('APPROVED'),
        address: doc('APPROVED'),
        bankStatement: doc('APPROVED'),
        sourceOfFunds: { ...doc(state), required },
      } as never,
      links,
    }).map((i) => [i.key, i.severity, i.title]);
  assert.deepEqual(sof('NOT_STARTED', true), [
    ['identity-source-of-funds', 'urgent', 'Confirm your source of funds'],
  ]);
  assert.deepEqual(sof('REJECTED', true), [
    ['identity-source-of-funds', 'urgent', 'Send your source of funds documents again'],
  ]);
  assert.deepEqual(sof('NOT_STARTED', false), []);
  assert.deepEqual(sof('IN_REVIEW', true), []);
  assert.deepEqual(sof('APPROVED', true), []);
});

test('identity checks are skipped for someone not eligible', () => {
  const items = buildAttentionQueue({
    identity: {
      eligible: false,
      passport: doc('NOT_STARTED'),
      address: doc('NOT_STARTED'),
      bankStatement: doc('NOT_STARTED'),
    } as never,
    links,
  });
  assert.deepEqual(items, []);
});

test('stage progress follows the usual path and skips paused or cancelled purchases', () => {
  assert.deepEqual(stageProgress('RESERVED'), { step: 3, total: 8 });
  assert.deepEqual(stageProgress('HANDED_OVER'), { step: 8, total: 8 });
  assert.equal(stageProgress('PAUSED'), null);
  assert.equal(stageProgress('SOMETHING_NEW'), null);
});

test('portfolio figures use only what the API returns', () => {
  assert.deepEqual(portfolioFigures(undefined), {
    activePurchases: null,
    representing: 0,
    depositsHeldCount: null,
    depositsHeldAmount: null,
    managedProperties: null,
    latestStatementNet: null,
    acquisitionCost: null,
    rentReceived12m: null,
    net12m: null,
    occupancyRate: null,
  });

  const figures = portfolioFigures(
    {
      protectedPurchases: { total: 3, byStatus: { FUNDS_HELD: 1, FROZEN: 1, RELEASED: 1 } },
      landPurchases: { total: 2, byStatus: { ACTIVE: 1, COMPLETED: 1 } },
      activeManagedProperties: 2,
      latestStatement: {
        id: 's1',
        periodStart: '',
        periodEnd: '',
        issuedAt: null,
        netAmount: '420000',
        payoutStatus: 'PAID',
      },
    },
    {
      complete: true,
      items: [
        { escrowStatus: 'funds_held', depositAmount: 2_000_000 },
        { escrowStatus: 'frozen', depositAmount: 1_000_000 },
        { escrowStatus: 'released', depositAmount: 9_000_000 },
      ],
    }
  );
  assert.equal(figures.activePurchases, 3);
  assert.equal(figures.depositsHeldCount, 2);
  assert.equal(figures.depositsHeldAmount, 3_000_000);
  assert.equal(figures.managedProperties, 2);
  assert.equal(figures.latestStatementNet, 420_000);
});

test('portfolio figures come through only where the API has a record', () => {
  const figures = portfolioFigures({
    portfolio: {
      properties: 2,
      acquisitionCost: '150000000',
      rentReceived12m: '2500000',
      expenses12m: '465433',
      net12m: '2034567',
      occupancyRate: 66.7,
      asOf: '2026-11-12T10:00:00.000Z',
    },
  });
  assert.equal(figures.acquisitionCost, 150_000_000);
  assert.equal(figures.rentReceived12m, 2_500_000);
  assert.equal(figures.net12m, 2_034_567);
  assert.equal(figures.occupancyRate, 66.7);

  const none = portfolioFigures({
    portfolio: {
      properties: null,
      acquisitionCost: null,
      rentReceived12m: null,
      expenses12m: null,
      net12m: null,
      occupancyRate: null,
      asOf: '2026-11-12T10:00:00.000Z',
    },
  });
  assert.equal(none.acquisitionCost, null);
  assert.equal(none.rentReceived12m, null);
  assert.equal(none.net12m, null);
  assert.equal(none.occupancyRate, null);
  // An older API without the block reads as no figures, not zero.
  assert.equal(portfolioFigures({}).acquisitionCost, null);
});

test('the deposit total is withheld when the list is partial or an amount is missing', () => {
  const overview = { protectedPurchases: { total: 1, byStatus: { FUNDS_HELD: 1 } } };
  assert.equal(
    portfolioFigures(overview, {
      complete: false,
      items: [{ escrowStatus: 'funds_held', depositAmount: 1 }],
    }).depositsHeldAmount,
    null
  );
  assert.equal(
    portfolioFigures(overview, { complete: true, items: [{ escrowStatus: 'funds_held' }] })
      .depositsHeldAmount,
    null
  );
});

test('with purchases listed, active sales come from their stages and representatives are counted apart', () => {
  const figures = portfolioFigures({
    purchases: [
      purchase(),
      purchase({ transactionId: 'tx2', operationalStage: { code: 'HANDED_OVER', label: '' } }),
      purchase({ transactionId: 'tx3', role: 'REPRESENTATIVE' }),
    ],
  });
  assert.equal(figures.activePurchases, 1);
  assert.equal(figures.representing, 1);
});

test('identity progress counts approvals and names the next check', () => {
  const progress = identityProgress({
    eligible: true,
    passport: doc('APPROVED'),
    address: doc('IN_REVIEW'),
    bankStatement: doc('NOT_STARTED'),
  } as never);
  assert.equal(progress.approved, 1);
  assert.equal(progress.next?.key, 'bankStatement');
});

test('the greeting follows the investor’s own clock', () => {
  const now = new Date('2026-11-11T07:30:00Z');
  assert.equal(greetingFor(now, 'Africa/Lagos'), 'Good morning');
  assert.equal(greetingFor(now, 'Asia/Tokyo'), 'Good afternoon');
  assert.equal(greetingFor(new Date('2026-11-11T19:30:00Z'), 'Europe/London'), 'Good evening');
  assert.equal(greetingFor(now, 'Not/AZone'), 'Good morning');
  assert.equal(greetingFor(now, null), 'Good morning');
});
