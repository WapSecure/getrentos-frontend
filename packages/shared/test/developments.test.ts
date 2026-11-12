import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  DEVELOPMENT_NOT_CHECKED,
  DEVELOPMENT_PAYMENT_COPY,
  completionLabel,
  developmentOf,
  developmentSummaryOf,
  instalmentAmountLabel,
} from '../src/showroom/developments.ts';

const checkedAt = '2026-11-10T09:00:00.000Z';

const api = (over: Record<string, unknown> = {}) => ({
  id: 'dev-1',
  name: 'Palm Court',
  summary: 'Twelve terraces.',
  location: {
    addressLine: '4 Palm Close',
    city: 'Lekki',
    state: 'Lagos',
    latitude: 6.44,
    longitude: 3.47,
  },
  stage: 'UNDER_CONSTRUCTION',
  expectedCompletion: '2027-06',
  developer: { name: 'Palm Homes', registeredName: 'PALM HOMES LIMITED' },
  checks: ['DEVELOPER_CAC', 'DIRECTOR_IDENTITY', 'SITE_TITLE', 'BUILDING_APPROVAL'].map((kind) => ({
    kind,
    label: kind,
    checkedAt,
  })),
  approvals: [
    { kind: 'SITE_TITLE', label: 'Certificate of Occupancy', checked: true, checkedAt },
    {
      kind: 'BUILDING_APPROVAL',
      label: 'Building plan approval',
      authority: 'LASPPPA',
      checked: true,
      checkedAt,
    },
    { kind: 'OTHER_APPROVAL', label: 'EIA approval', checked: true },
  ],
  media: [
    {
      id: 'img_old',
      kind: 'image',
      url: 'https://cdn.test/old.jpg',
      order: 0,
      capturedAt: '2026-06-01T09:00:00Z',
    },
    {
      id: 'img_render',
      kind: 'image',
      url: 'https://cdn.test/r.jpg',
      order: 1,
      source: 'render',
      caption: 'Front',
    },
    {
      id: 'img_new',
      kind: 'image',
      url: 'https://cdn.test/new.jpg',
      order: 2,
      capturedAt: '2026-10-30T09:00:00Z',
      caption: 'Roof level',
    },
    { id: 'img_undated', kind: 'image', url: 'https://cdn.test/u.jpg', order: 3 },
    {
      id: 'img_bad',
      kind: 'image',
      url: 'javascript:alert(1)',
      order: 4,
      capturedAt: '2026-10-30T09:00:00Z',
    },
  ],
  unitTypes: [
    {
      id: 'unit-1',
      name: '3 bedroom terrace',
      bedrooms: 3,
      priceFromNaira: 185000000,
      unitsTotal: 12,
      unitsAvailable: 5,
    },
    { id: 'unit-2', name: 'Odd', unitsTotal: 2, unitsAvailable: 9 },
  ],
  paymentPlan: {
    paidTo: 'DEVELOPER',
    note: 'Pay the developer directly.',
    instalments: [
      { id: 'i1', label: 'Deposit', percent: 30, dueWhen: 'On signing' },
      { id: 'i2', label: 'Second', amountNaira: 50000000, unitTypeId: 'unit-1' },
      { id: 'i3', label: 'Ghost', amountNaira: 1, unitTypeId: 'not-on-page' },
    ],
  },
  liveAt: checkedAt,
  ...over,
});

test('developmentOf keeps a complete live development', () => {
  const d = developmentOf(api());
  assert.ok(d);
  assert.equal(d.name, 'Palm Court');
  assert.deepEqual(
    d.checks.map((c) => c.kind),
    ['DEVELOPER_CAC', 'DIRECTOR_IDENTITY', 'SITE_TITLE', 'BUILDING_APPROVAL']
  );
  assert.equal(d.checks[2]!.label, 'Title to the site');
  assert.equal(d.expectedCompletion, '2027-06');
  assert.equal(d.registeredName, 'PALM HOMES LIMITED');
});

test('developmentOf refuses a development missing a check, or whose money is not paid to the developer', () => {
  const three = api({ checks: api().checks.slice(0, 3) });
  assert.equal(developmentOf(three), undefined);
  const undated = api({ checks: api().checks.map((c) => ({ ...c, checkedAt: undefined })) });
  assert.equal(developmentOf(undated), undefined);
  assert.equal(
    developmentOf(api({ paymentPlan: { paidTo: 'SUREGROUND', instalments: [] } })),
    undefined
  );
  assert.equal(developmentOf(api({ paymentPlan: undefined })), undefined);
  assert.equal(developmentOf(null), undefined);
});

test('site photos carry their date, impressions say so, and undated or unsafe photos are dropped', () => {
  const d = developmentOf(api())!;
  assert.deepEqual(
    d.media.map((m) => m.id),
    ['img_old', 'img_render', 'img_new']
  );
  assert.equal(d.media[1]!.caption, "Artist's impression · Front");
  assert.equal(d.media[1]!.source, 'render');
  assert.match(d.media[2]!.caption!, /^Taken 30 Oct 2026 · Roof level$/);
  // The progress gallery is site photos only, newest first.
  assert.deepEqual(
    d.progress.map((m) => m.id),
    ['img_new', 'img_old']
  );
});

test('another approval is never shown as checked; unit counts above the total are dropped', () => {
  const d = developmentOf(api())!;
  assert.deepEqual(
    d.approvals.map((a) => [a.kind, a.checked]),
    [
      ['SITE_TITLE', true],
      ['BUILDING_APPROVAL', true],
      ['OTHER_APPROVAL', false],
    ]
  );
  assert.equal(d.unitTypes[1]!.unitsAvailable, undefined);
  assert.equal(d.unitTypes[0]!.unitsAvailable, 5);
});

test('the payment plan is as stated: no totals, no conversions, no lines for unknown unit types', () => {
  const d = developmentOf(api())!;
  assert.deepEqual(
    d.instalments.map((i) => i.id),
    ['i1', 'i2']
  );
  const naira = (n: number) => `₦${n.toLocaleString('en-NG')}`;
  assert.equal(instalmentAmountLabel(d.instalments[0]!, naira), '30% of the price');
  assert.equal(instalmentAmountLabel(d.instalments[1]!, naira), '₦50,000,000');
  assert.equal(instalmentAmountLabel({}, naira), 'Amount not stated');
  assert.equal('total' in d, false);
});

test('the copy says Sureground holds no money and lists what was not checked, in plain words', () => {
  const all = [
    DEVELOPMENT_PAYMENT_COPY.lead,
    ...DEVELOPMENT_PAYMENT_COPY.points,
    ...DEVELOPMENT_NOT_CHECKED,
  ].join(' ');
  assert.match(DEVELOPMENT_PAYMENT_COPY.lead, /does not take, hold or pass on any money/);
  assert.doesNotMatch(all, /escrow|\bAI\b|—|\$/i);
});

test('summaries and completion months', () => {
  const s = developmentSummaryOf({
    id: 'dev-1',
    name: 'Palm Court',
    city: 'Lekki',
    state: 'Lagos',
    stage: 'PLANNED',
    developerName: 'Palm Homes',
    cover: {
      id: 'img_r',
      kind: 'image',
      url: 'https://cdn.test/r.jpg',
      order: 0,
      source: 'render',
    },
    priceFromNaira: 185000000,
    unitTypeCount: 2,
  });
  assert.equal(s?.cover?.caption, "Artist's impression");
  assert.equal(s?.priceFromNaira, 185000000);
  assert.equal(developmentSummaryOf({ id: 'x' }), undefined);
  assert.equal(completionLabel('2027-06'), 'June 2027');
  assert.equal(completionLabel('2027-13'), undefined);
});
