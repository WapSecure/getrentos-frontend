import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  approvalOutcomeMessage,
  approvalsWaitingFor,
  coApprovalConfirmDescription,
  canReleaseDeposit,
  depositReleaseStage,
  documentLinkLabel,
  handoverAwaitingDelivery,
  HANDOVER_NOT_DELIVERED_NOTE,
  humaniseCode,
  legalVariant,
  moneyVariant,
  nextActionTarget,
  pendingApprovalStatus,
  RELEASE_BLOCKED_NOTE,
  releaseDialogDescription,
  releaseOutcome,
  releaseStageNote,
  stageVariant,
  stepAwaitingDelivery,
  workspaceProgress,
} from '../src/diaspora/transactionWorkspace.ts';

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

test('a release waiting for the representative says nothing moved and the buyer releases again', () => {
  const waiting = releaseOutcome(
    {
      state: 'WAITING_FOR_CO_APPROVAL',
      waitingFor: 'REPRESENTATIVE',
      // An older API message implying an automatic release is not shown.
      message:
        'Your approval is recorded. The deposit is released once your representative approves too.',
    },
    'Amaka Obi'
  );
  assert.equal(waiting.waiting, true);
  assert.match(waiting.message, /Nothing has been released yet/);
  assert.match(waiting.message, /Once Amaka Obi approves, come back and press Release the deposit/);
  assert.doesNotMatch(waiting.message, /released once/);
  assert.deepEqual(releaseOutcome({ state: 'RELEASED' }), {
    waiting: false,
    message: 'Deposit released to the seller.',
  });
  // Older responses carry no outcome: the release went through.
  assert.equal(releaseOutcome(undefined).waiting, false);
  // Without a name, it still says who is awaited.
  assert.match(
    releaseOutcome({ state: 'WAITING_FOR_CO_APPROVAL', waitingFor: 'REPRESENTATIVE' }).message,
    /Once your representative approves/
  );
  assert.match(
    releaseOutcome({ state: 'WAITING_FOR_CO_APPROVAL', waitingFor: 'BUYER' }, 'Amaka Obi').message,
    /^Amaka Obi has approved\. Nothing has been released yet/
  );
});

test('a representative approval never claims money moved', () => {
  assert.match(approvalOutcomeMessage('WAITING_FOR_BUYER'), /Nothing has been released/);
  assert.match(approvalOutcomeMessage('APPROVED'), /buyer can now release/);
});

const stageOf = (
  money: string,
  coApproval: Parameters<typeof depositReleaseStage>[0]['coApproval']
) => depositReleaseStage({ statuses: statuses(money), coApproval });

test('deposit release stage follows the two approvals', () => {
  assert.equal(stageOf('PROTECTED', { binding: false }), 'SINGLE');
  assert.equal(stageOf('PROTECTED', { binding: true, pending: [] }), 'NEEDS_APPROVALS');
  assert.equal(
    stageOf('RELEASE_REQUESTED', {
      binding: true,
      pending: [
        {
          milestoneKey: 'KEYS_HANDED_OVER',
          releasesDeposit: true,
          buyerApproved: true,
          representativeApproved: false,
        },
      ],
    }),
    'WAITING_FOR_REPRESENTATIVE'
  );
  assert.equal(
    stageOf('PROTECTED', { binding: true, releaseApproved: true, pending: [] }),
    'BOTH_APPROVED'
  );
  // Released already: nothing left to approve.
  assert.equal(stageOf('RELEASED', { binding: true, releaseApproved: true }), 'NEEDS_APPROVALS');
});

test('release copy names the representative and never hedges with "If"', () => {
  const both = releaseDialogDescription('BOTH_APPROVED', 'Amaka Obi');
  assert.match(both, /You and Amaka Obi have both approved/);
  const first = releaseDialogDescription('NEEDS_APPROVALS', 'Amaka Obi');
  assert.match(
    first,
    /^Two-person approval is on, so this records your approval and nothing is released yet/
  );
  assert.match(first, /press Release the deposit again/);
  for (const text of [both, first, releaseDialogDescription('SINGLE')]) {
    assert.doesNotMatch(text, /\bIf two-person/);
    assert.doesNotMatch(text, /\u2014/);
  }
  assert.equal(
    releaseStageNote('BOTH_APPROVED'),
    'Both approvals are in. Release the deposit to send it to the seller.'
  );
  assert.match(
    releaseStageNote('WAITING_FOR_REPRESENTATIVE', 'Amaka Obi') ?? '',
    /Once Amaka Obi approves/
  );
  assert.equal(releaseStageNote('SINGLE'), null);
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

test('progress counts required steps and settled legal steps', () => {
  const progress = workspaceProgress({
    milestones: [
      { required: true, status: 'CONFIRMED' },
      { required: true, status: 'DELIVERED' },
      { required: false, status: 'CONFIRMED' },
      { required: true, status: 'WAIVED' },
    ],
    legalSteps: [{ status: 'APPROVED' }, { status: 'SUBMITTED' }, { status: 'NOT_APPLICABLE' }],
  } as never);
  assert.deepEqual(progress, { steps: { done: 2, total: 3 }, legal: { done: 2, total: 3 } });
});

test('the call to action goes to what is waiting for the viewer', () => {
  const base = {
    viewer: { role: 'BUYER' },
    statuses: statuses('PROTECTED'),
    nextAction: { label: 'x', waitingForYou: true },
    milestones: [],
    coApproval: { binding: false },
  };
  assert.equal(
    nextActionTarget({ ...base, nextAction: { label: 'x', waitingForYou: false } } as never),
    null
  );
  assert.equal(nextActionTarget({ ...base, nextAction: null } as never), null);
  assert.equal(nextActionTarget(base as never), 'deposit');
  assert.equal(
    nextActionTarget({ ...base, milestones: [{ status: 'DELIVERED' }] } as never),
    'steps'
  );
  assert.equal(
    nextActionTarget({
      ...base,
      viewer: { role: 'REPRESENTATIVE' },
      coApproval: {
        binding: true,
        pending: [{ milestoneKey: 'K', buyerApproved: true, representativeApproved: false }],
      },
    } as never),
    'approvals'
  );
});

test('approving the deposit release never promises an automatic release', () => {
  const rep = coApprovalConfirmDescription({
    viewer: 'representative',
    stepLabel: 'Keys handed over',
    releasesDeposit: true,
  });
  assert.match(rep, /does not move any money/);
  assert.match(rep, /the buyer releases the deposit/);
  const buyer = coApprovalConfirmDescription({
    viewer: 'buyer',
    stepLabel: 'Keys handed over',
    releasesDeposit: true,
    representativeName: 'Amaka Obi',
  });
  assert.match(
    buyer,
    /nothing is released\. Once Amaka Obi has approved too, press Release the deposit/
  );
  assert.doesNotMatch(rep + buyer, /is released to the seller/);
});

test('a built home’s handover cannot be approved or released before the seller delivers it', () => {
  const plan = (status: string) => ({
    plan: 'BUILT_HOME',
    milestones: [
      { key: 'CONTRACT_OF_SALE', status: 'PENDING' },
      { key: 'KEYS_HANDED_OVER', status },
    ],
  });
  assert.equal(handoverAwaitingDelivery(plan('PENDING')), true);
  assert.equal(handoverAwaitingDelivery(plan('DISPUTED')), true);
  assert.equal(handoverAwaitingDelivery(plan('DELIVERED')), false);
  assert.equal(handoverAwaitingDelivery(plan('CONFIRMED')), false);
  assert.equal(handoverAwaitingDelivery(plan('WAIVED')), false);
  // Planned but not saved yet: still not delivered.
  assert.equal(handoverAwaitingDelivery({ plan: 'BUILT_HOME', milestones: [] }), true);
  // Land sales keep their own release rules.
  assert.equal(handoverAwaitingDelivery({ plan: 'LAND_RESALE', milestones: [] }), false);
  assert.match(RELEASE_BLOCKED_NOTE, /has not marked the keys as handed over yet/);
});

test('an undelivered handover is not waiting for anyone’s approval, and says why', () => {
  const awaiting = {
    milestoneKey: 'KEYS_HANDED_OVER',
    releasesDeposit: true,
    stepDelivered: false,
    buyerApproved: false,
    representativeApproved: false,
  };
  const delivered = { ...awaiting, stepDelivered: true };
  assert.equal(stepAwaitingDelivery(awaiting), true);
  assert.equal(stepAwaitingDelivery(delivered), false);
  // Older responses without the flag are not blocked here; the server refuses anyway.
  const { stepDelivered: _omit, ...legacy } = awaiting;
  assert.equal(stepAwaitingDelivery(legacy), false);
  assert.equal(stepAwaitingDelivery({ ...awaiting, releasesDeposit: undefined }), false);

  assert.deepEqual(approvalsWaitingFor('REPRESENTATIVE', [awaiting]), []);
  assert.deepEqual(approvalsWaitingFor('BUYER', [awaiting]), []);
  assert.equal(approvalsWaitingFor('REPRESENTATIVE', [delivered]).length, 1);

  assert.equal(
    pendingApprovalStatus(awaiting, 'representative'),
    'Waiting for the seller to hand over the keys'
  );
  assert.equal(
    pendingApprovalStatus(delivered, 'representative'),
    'Waiting for the buyer · waiting for you'
  );
  assert.equal(
    pendingApprovalStatus({ ...delivered, buyerApproved: true }, 'buyer'),
    'You approved · waiting for your representative'
  );
  assert.equal(
    HANDOVER_NOT_DELIVERED_NOTE,
    'The seller has not marked the keys as handed over yet. You can approve once they have.'
  );
});

test('the call to action does not send the buyer to a release they cannot make yet', () => {
  const base = {
    viewer: { role: 'BUYER' },
    statuses: statuses('PROTECTED'),
    nextAction: { label: 'x', waitingForYou: true },
    coApproval: { binding: false },
    plan: 'BUILT_HOME',
  };
  assert.equal(
    nextActionTarget({
      ...base,
      milestones: [{ key: 'KEYS_HANDED_OVER', status: 'PENDING' }],
    } as never),
    'steps'
  );
  assert.equal(
    nextActionTarget({
      ...base,
      milestones: [{ key: 'KEYS_HANDED_OVER', status: 'CONFIRMED' }],
    } as never),
    'deposit'
  );
});
