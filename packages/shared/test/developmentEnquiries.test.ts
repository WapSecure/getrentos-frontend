import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  DEVELOPMENT_ENQUIRY_COPY,
  buyerDevelopmentEnquiriesOf,
  buyerDevelopmentEnquiryOf,
  canAskAgain,
  developerDevelopmentEnquiryOf,
  developmentEnquiryCountsOf,
  enquiryMessageProblem,
} from '../src/showroom/developmentEnquiries.ts';

const createdAt = '2026-11-12T10:00:00.000Z';

const buyerApi = (over: Record<string, unknown> = {}) => ({
  id: 'enq-1',
  development: {
    id: 'dev-1',
    name: 'Palm Court',
    city: 'Lekki',
    state: 'Lagos',
    developerName: 'Palm Homes Ltd',
    live: true,
  },
  unitTypeName: 'Three-bedroom terrace',
  message: 'Is the first instalment refundable?',
  status: 'NEW',
  createdAt,
  ...over,
});

const developerApi = (over: Record<string, unknown> = {}) => ({
  id: 'enq-1',
  developmentId: 'dev-1',
  buyerName: 'Ada Buyer',
  message: 'Is the first instalment refundable?',
  status: 'NEW',
  createdAt,
  ...over,
});

test('reads a buyer question and its development', () => {
  const e = buyerDevelopmentEnquiryOf(buyerApi());
  assert.ok(e);
  assert.equal(e.status, 'NEW');
  assert.equal(e.development.developerName, 'Palm Homes Ltd');
  assert.equal(e.development.live, true);
  assert.equal(e.unitTypeName, 'Three-bedroom terrace');
  assert.equal(e.answer, undefined);
});

test('drops malformed questions rather than guessing', () => {
  assert.equal(buyerDevelopmentEnquiryOf(null), undefined);
  assert.equal(buyerDevelopmentEnquiryOf(buyerApi({ status: 'PAID' })), undefined);
  assert.equal(buyerDevelopmentEnquiryOf(buyerApi({ createdAt: 'yesterday' })), undefined);
  assert.equal(buyerDevelopmentEnquiryOf(buyerApi({ message: '   ' })), undefined);
  assert.equal(buyerDevelopmentEnquiryOf(buyerApi({ development: { id: 'dev-1' } })), undefined);
  // "Answered" without an answer would promise something that is not there.
  assert.equal(buyerDevelopmentEnquiryOf(buyerApi({ status: 'ANSWERED' })), undefined);
  assert.equal(
    buyerDevelopmentEnquiriesOf([buyerApi(), buyerApi({ status: 'X' }), 'junk']).length,
    1
  );
  assert.deepEqual(buyerDevelopmentEnquiriesOf({ items: [] }), []);
});

test('a development is live only when the API says exactly true', () => {
  const e = buyerDevelopmentEnquiryOf(
    buyerApi({ development: { ...buyerApi().development, live: 'yes' } })
  );
  assert.equal(e?.development.live, false);
});

test('keeps an answer and its date; ignores a closed date on an open question', () => {
  const answered = buyerDevelopmentEnquiryOf(
    buyerApi({ status: 'ANSWERED', answer: ' Yes, within 30 days. ', answeredAt: createdAt })
  );
  assert.equal(answered?.answer, 'Yes, within 30 days.');
  assert.equal(answered?.answeredAt, createdAt);
  const open = buyerDevelopmentEnquiryOf(buyerApi({ closedAt: createdAt }));
  assert.equal(open?.closedAt, undefined);
});

test('reads a developer inbox item without contact details', () => {
  const e = developerDevelopmentEnquiryOf(
    developerApi({ buyerEmail: 'ada@example.com', buyerPhone: '0801', answeredByName: 'Sam' })
  );
  assert.ok(e);
  assert.equal(e.buyerName, 'Ada Buyer');
  assert.equal('buyerEmail' in e, false);
  assert.equal('buyerPhone' in e, false);
  // A name for who answered only appears with an answer.
  assert.equal(e.answeredByName, undefined);
  assert.equal(
    developerDevelopmentEnquiryOf(developerApi({ buyerName: '' }))?.buyerName,
    'A buyer'
  );
  assert.equal(developerDevelopmentEnquiryOf(developerApi({ developmentId: '' })), undefined);
});

test('counts only positive whole numbers', () => {
  assert.deepEqual(
    developmentEnquiryCountsOf([
      { developmentId: 'a', newCount: 2 },
      { developmentId: 'b', newCount: 0 },
      { developmentId: 'c', newCount: 1.5 },
      { newCount: 3 },
    ]),
    { a: 2 }
  );
  assert.deepEqual(developmentEnquiryCountsOf(null), {});
});

test('form checks and the open-question cap', () => {
  assert.match(enquiryMessageProblem('short') ?? '', /at least 10/);
  assert.equal(enquiryMessageProblem('When is handover planned?'), undefined);
  assert.match(enquiryMessageProblem('x'.repeat(2001)) ?? '', /under 2000/);
  assert.equal(canAskAgain([{ status: 'NEW' }, { status: 'NEW' }, { status: 'ANSWERED' }]), true);
  assert.equal(canAskAgain([{ status: 'NEW' }, { status: 'NEW' }, { status: 'NEW' }]), false);
});

test('copy says Sureground takes no payment, in plain words', () => {
  assert.match(DEVELOPMENT_ENQUIRY_COPY.payment, /does not take payment for developments/);
  assert.match(DEVELOPMENT_ENQUIRY_COPY.developerLead, /does not take payment for developments/);
  for (const line of Object.values(DEVELOPMENT_ENQUIRY_COPY)) {
    assert.doesNotMatch(line, /escrow|\bAI\b|—|\$/i);
  }
});
