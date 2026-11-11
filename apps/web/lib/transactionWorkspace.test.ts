import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  approvalOutcomeMessage,
  approvalsWaitingFor,
  canReleaseDeposit,
  documentLinkLabel,
  humaniseCode,
  legalVariant,
  moneyVariant,
  purchaseWorkspaceHref,
  releaseOutcome,
  stageVariant,
} from './transactionWorkspace';

const statuses = (money: string) =>
  ({
    operationalStage: { code: 'RESERVED', label: 'Reserved with a deposit' },
    moneyStatus: { code: money, label: '', covers: 'DEPOSIT', note: '' },
    legalStatus: { code: 'NOT_STARTED', label: 'Not started' },
  }) as never;

test('each status has its own badge, and unknown codes read as neutral', () => {
  assert.equal(stageVariant('HANDED_OVER'), 'success');
  assert.equal(moneyVariant('FROZEN'), 'danger');
  assert.equal(legalVariant('PERFECTED'), 'success');
  // A released deposit is not legal completion: the legal badge stays neutral.
  assert.equal(moneyVariant('RELEASED'), 'success');
  assert.equal(legalVariant('NOT_STARTED'), 'neutral');
  assert.equal(stageVariant('SOMETHING_NEW'), 'neutral');
});

test('a purchase links to the buyer or the representative workspace', () => {
  assert.equal(
    purchaseWorkspaceHref({ role: 'BUYER', transactionId: 'tx 1' }),
    '/buyer/transactions/tx%201'
  );
  assert.equal(
    purchaseWorkspaceHref({ role: 'REPRESENTATIVE', transactionId: 'tx1' }),
    '/representing/transactions/tx1'
  );
});

test('only the buyer may release, and only a held deposit', () => {
  assert.equal(
    canReleaseDeposit({ viewer: { role: 'BUYER' }, statuses: statuses('PROTECTED') }),
    true
  );
  assert.equal(
    canReleaseDeposit({ viewer: { role: 'BUYER' }, statuses: statuses('RELEASED') }),
    false
  );
  assert.equal(
    canReleaseDeposit({ viewer: { role: 'REPRESENTATIVE' }, statuses: statuses('PROTECTED') }),
    false
  );
});

test('a release waiting for the representative says nothing moved', () => {
  const waiting = releaseOutcome({
    state: 'WAITING_FOR_CO_APPROVAL',
    waitingFor: 'REPRESENTATIVE',
    message:
      'Your approval is recorded. The deposit is released once your representative approves too.',
  });
  assert.equal(waiting.waiting, true);
  assert.match(waiting.message, /once your representative approves/);
  assert.deepEqual(releaseOutcome({ state: 'RELEASED' }), {
    waiting: false,
    message: 'Deposit released to the seller.',
  });
  // Older responses carry no outcome: the release went through.
  assert.equal(releaseOutcome(undefined).waiting, false);
  // Without the API's message, the fallback still names who is awaited.
  assert.match(
    releaseOutcome({ state: 'WAITING_FOR_CO_APPROVAL', waitingFor: 'BUYER' }).message,
    /once you approve/
  );
});

test('a representative approval never claims money moved', () => {
  assert.match(approvalOutcomeMessage('WAITING_FOR_BUYER'), /Nothing moves/);
  assert.match(approvalOutcomeMessage('APPROVED'), /buyer can now release/);
});

test('approvals waiting for the viewer', () => {
  const pending = [
    { milestoneKey: 'A', buyerApproved: true, representativeApproved: false },
    { milestoneKey: 'B', buyerApproved: false, representativeApproved: true },
  ];
  assert.deepEqual(
    approvalsWaitingFor('BUYER', pending).map((s) => s.milestoneKey),
    ['B']
  );
  assert.deepEqual(
    approvalsWaitingFor('REPRESENTATIVE', pending).map((s) => s.milestoneKey),
    ['A']
  );
  assert.deepEqual(approvalsWaitingFor('BUYER', undefined), []);
});

test('documents are named by the step they belong to', () => {
  const workspace = {
    milestones: [{ key: 'KEYS_HANDED_OVER', label: 'Keys handed over' }],
    conditions: [{ key: 'SURVEY', label: 'Survey matches the plan' }],
    legalSteps: [],
  } as never;
  assert.equal(
    documentLinkLabel({ linkedTo: 'MILESTONE', key: 'KEYS_HANDED_OVER' }, workspace),
    'Keys handed over'
  );
  assert.equal(
    documentLinkLabel({ linkedTo: 'CONDITION', key: 'SURVEY' }, workspace),
    'Survey matches the plan'
  );
  assert.equal(
    documentLinkLabel({ linkedTo: 'LEGAL_STEP', key: 'GOVERNORS_CONSENT' }, workspace),
    'Governors consent'
  );
  assert.equal(humaniseCode('TITLE_DEED'), 'Title deed');
});
