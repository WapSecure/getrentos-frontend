import type { StatusTone } from '../utils/landTrust';
import type {
  CoApprovalPendingStep,
  DepositReleaseApprovalOutcome,
  DepositReleaseOutcome,
  LegalStatusCode,
  MoneyStatusCode,
  NextAction,
  OperationalStageCode,
  WorkspaceDocument,
  WorkspaceViewerRole,
} from './types';

interface WorkspaceShape {
  viewer: { role: WorkspaceViewerRole };
  statuses: { moneyStatus: { code: MoneyStatusCode | string } };
  nextAction: NextAction | null;
  plan?: string;
  milestones: { key: string; label: string; status: string; required: boolean }[];
  conditions: { key: string; label: string }[];
  legalSteps: { key: string; label: string; status: string }[];
  coApproval: { binding: boolean; pending?: readonly CoApprovalPendingStep[] };
}

const STAGE_VARIANT: Record<OperationalStageCode, StatusTone> = {
  INTERESTED: 'neutral',
  OFFER_ACCEPTED: 'info',
  RESERVED: 'info',
  DILIGENCE_IN_PROGRESS: 'info',
  FINDINGS_SHARED: 'info',
  CONTRACT_PREPARED: 'info',
  COMPLETING: 'info',
  HANDED_OVER: 'success',
  PAUSED: 'warning',
  CANCELLED: 'neutral',
};

const MONEY_VARIANT: Record<MoneyStatusCode, StatusTone> = {
  NOT_DUE: 'neutral',
  REQUESTED: 'warning',
  PROTECTED: 'info',
  RELEASE_REQUESTED: 'info',
  RELEASED: 'success',
  PAID_OUT: 'success',
  REFUNDED: 'neutral',
  FROZEN: 'danger',
};

const LEGAL_VARIANT: Record<LegalStatusCode, StatusTone> = {
  NOT_STARTED: 'neutral',
  CONTRACT_SIGNED: 'info',
  CONSENT_APPLIED: 'info',
  CONSENT_GRANTED: 'info',
  REGISTERED: 'info',
  PERFECTED: 'success',
};

export const stageVariant = (code: string): StatusTone =>
  STAGE_VARIANT[code as OperationalStageCode] ?? 'neutral';
export const moneyVariant = (code: string): StatusTone =>
  MONEY_VARIANT[code as MoneyStatusCode] ?? 'neutral';
export const legalVariant = (code: string): StatusTone =>
  LEGAL_VARIANT[code as LegalStatusCode] ?? 'neutral';

export const HANDOVER_NOT_DELIVERED_NOTE =
  'The seller has not marked the keys as handed over yet. You can approve once they have.';

export const RELEASE_BLOCKED_NOTE =
  'The seller has not marked the keys as handed over yet. You can release the deposit once they have.';

const DELIVERED_STATUSES: ReadonlySet<string> = new Set(['DELIVERED', 'CONFIRMED', 'WAIVED']);

export const HANDOVER_KEY = 'KEYS_HANDED_OVER';

export const stepAwaitingDelivery = (step: CoApprovalPendingStep): boolean =>
  Boolean(step.releasesDeposit) && step.stepDelivered === false;

/** Built homes only; land sales have their own release rules. */
export const handoverAwaitingDelivery = (workspace: {
  plan?: string;
  milestones: readonly { key: string; status: string }[];
}): boolean => {
  if (workspace.plan !== 'BUILT_HOME') return false;
  const handover = workspace.milestones.find((m) => m.key === HANDOVER_KEY);
  return !handover || !DELIVERED_STATUSES.has(handover.status);
};

/** Land steps and conditions that no longer hold the deposit back (the server's release rule). */
const SETTLED_STEP_STATUSES: ReadonlySet<string> = new Set(['CONFIRMED', 'WAIVED']);
const SETTLED_CONDITION_STATUSES: ReadonlySet<string> = new Set(['SATISFIED', 'WAIVED']);

/** The server refuses to release a land sale's deposit until this is empty, so the button says so up front. */
export const landReleaseOutstanding = (workspace: {
  plan?: string;
  milestones: readonly { label: string; status: string; required: boolean }[];
  conditions: readonly { label: string; status?: string }[];
}): string[] => {
  if (workspace.plan === 'BUILT_HOME') return [];
  return [
    ...workspace.milestones
      .filter((m) => m.required && !SETTLED_STEP_STATUSES.has(m.status))
      .map((m) => m.label),
    ...workspace.conditions
      .filter((c) => !SETTLED_CONDITION_STATUSES.has(c.status ?? 'PENDING'))
      .map((c) => c.label),
  ];
};

export const releaseBlockedNote = (workspace: {
  plan?: string;
  milestones: readonly { key: string; label: string; status: string; required: boolean }[];
  conditions: readonly { label: string; status?: string }[];
}): string | null => {
  if (handoverAwaitingDelivery(workspace)) return RELEASE_BLOCKED_NOTE;
  const outstanding = landReleaseOutstanding(workspace);
  if (outstanding.length === 0) return null;
  return `You can release the deposit once you have confirmed: ${outstanding.join('; ')}.`;
};

export const canReleaseDeposit = (
  workspace: Pick<WorkspaceShape, 'viewer' | 'statuses'>
): boolean =>
  workspace.viewer.role === 'BUYER' && workspace.statuses.moneyStatus.code === 'PROTECTED';

export const representativeLabel = (name?: string | null): string =>
  name?.trim() || 'your representative';

const capitalise = (text: string): string => text.charAt(0).toUpperCase() + text.slice(1);

/** A representative's approval never moves money; the API's message is not used so this copy stays accurate. */
export const releaseOutcome = (
  release: DepositReleaseOutcome | undefined,
  representativeName?: string | null
): { waiting: boolean; message: string } => {
  if (release?.state !== 'WAITING_FOR_CO_APPROVAL') {
    return { waiting: false, message: 'Deposit released to the seller.' };
  }
  const rep = representativeLabel(representativeName);
  return {
    waiting: true,
    message:
      release.waitingFor === 'BUYER'
        ? `${capitalise(rep)} has approved. Nothing has been released yet: press Release the deposit to send it to the seller.`
        : `Your approval is recorded. Nothing has been released yet. Once ${rep} approves, come back and press Release the deposit to send it to the seller.`,
  };
};

export const approvalOutcomeMessage = (
  outcome: DepositReleaseApprovalOutcome | undefined
): string =>
  outcome === 'WAITING_FOR_BUYER'
    ? 'Your approval is recorded. Nothing has been released: the buyer approves too and then releases the deposit.'
    : 'Your approval is recorded. Nothing has been released: the buyer can now release the deposit.';

export type DepositReleaseStage =
  /** No two-person rule: the buyer's release sends the deposit straight away. */
  | 'SINGLE'
  | 'NEEDS_APPROVALS'
  /** The buyer approved; the representative has not. Nothing has moved. */
  | 'WAITING_FOR_REPRESENTATIVE'
  | 'BOTH_APPROVED';

interface ReleaseStageShape {
  statuses: { moneyStatus: { code: MoneyStatusCode | string } };
  coApproval: {
    binding: boolean;
    releaseApproved?: boolean;
    pending?: readonly CoApprovalPendingStep[];
  };
}

export const depositReleaseStage = (workspace: ReleaseStageShape): DepositReleaseStage => {
  const { coApproval } = workspace;
  if (!coApproval.binding) return 'SINGLE';
  const releaseStep = coApproval.pending?.find((step) => step.releasesDeposit);
  if (releaseStep?.buyerApproved && releaseStep.representativeApproved) return 'BOTH_APPROVED';
  if (
    workspace.statuses.moneyStatus.code === 'RELEASE_REQUESTED' ||
    (releaseStep?.buyerApproved && !releaseStep.representativeApproved)
  )
    return 'WAITING_FOR_REPRESENTATIVE';
  if (coApproval.releaseApproved && workspace.statuses.moneyStatus.code === 'PROTECTED')
    return 'BOTH_APPROVED';
  return 'NEEDS_APPROVALS';
};

export const releaseDialogDescription = (
  stage: DepositReleaseStage,
  representativeName?: string | null
): string => {
  const rep = representativeLabel(representativeName);
  const tail = 'This does not complete the legal transfer.';
  if (stage === 'BOTH_APPROVED') {
    return `You and ${rep} have both approved. Releasing sends the deposit to the seller now and cannot be undone. ${tail}`;
  }
  if (stage === 'SINGLE') {
    return `Release only once you have received the property and the documents you agreed; it cannot be undone. ${tail}`;
  }
  return `Two-person approval is on, so this records your approval and nothing is released yet. Once ${rep} approves, press Release the deposit again to send it to the seller. Approve only once you have received the property and the documents you agreed. ${tail}`;
};

export const releaseStageNote = (
  stage: DepositReleaseStage,
  representativeName?: string | null
): string | null => {
  const rep = representativeLabel(representativeName);
  if (stage === 'BOTH_APPROVED')
    return 'Both approvals are in. Release the deposit to send it to the seller.';
  if (stage === 'WAITING_FOR_REPRESENTATIVE')
    return `You have approved. Nothing has been released yet. Once ${rep} approves, come back and press Release the deposit.`;
  if (stage === 'NEEDS_APPROVALS')
    return `Two-person approval is on: you and ${rep} both approve, then you release the deposit.`;
  return null;
};

export const pendingApprovalStatus = (
  step: CoApprovalPendingStep,
  viewer: 'buyer' | 'representative'
): string => {
  if (stepAwaitingDelivery(step)) return 'Waiting for the seller to hand over the keys';
  return viewer === 'buyer'
    ? `${step.buyerApproved ? 'You approved' : 'Waiting for you'} · ${
        step.representativeApproved ? 'representative approved' : 'waiting for your representative'
      }`
    : `${step.buyerApproved ? 'The buyer approved' : 'Waiting for the buyer'} · ${
        step.representativeApproved ? 'you approved' : 'waiting for you'
      }`;
};

export const approvalsWaitingFor = (
  viewer: 'BUYER' | 'REPRESENTATIVE',
  pending: readonly CoApprovalPendingStep[] | undefined
): CoApprovalPendingStep[] =>
  (pending ?? []).filter(
    (step) =>
      !stepAwaitingDelivery(step) &&
      (viewer === 'BUYER' ? !step.buyerApproved : !step.representativeApproved)
  );

export const humaniseCode = (code: string): string => {
  const words = code.toLowerCase().replace(/_/g, ' ').trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
};

export type SalePlan = 'LAND_RESALE' | 'BUILT_HOME';

export const SALE_PLAN_LABEL: Record<SalePlan, string> = {
  LAND_RESALE: 'Land sale',
  BUILT_HOME: 'Built home',
};

/** No type at all means a land resale: the representative's deal list once held only those. */
export const salePlanLabel = (input: { plan?: string | null; propertyType?: string | null }) => {
  if (input.plan) return SALE_PLAN_LABEL[input.plan as SalePlan] ?? humaniseCode(input.plan);
  const plan: SalePlan =
    !input.propertyType || input.propertyType === 'LAND' ? 'LAND_RESALE' : 'BUILT_HOME';
  return SALE_PLAN_LABEL[plan];
};

export const documentLinkLabel = (
  document: Pick<WorkspaceDocument, 'linkedTo' | 'key'>,
  workspace: Pick<WorkspaceShape, 'milestones' | 'conditions' | 'legalSteps'>
): string => {
  const list =
    document.linkedTo === 'MILESTONE'
      ? workspace.milestones
      : document.linkedTo === 'CONDITION'
        ? workspace.conditions
        : workspace.legalSteps;
  return list.find((item) => item.key === document.key)?.label ?? humaniseCode(document.key);
};

export const workspaceProgress = (
  workspace: Pick<WorkspaceShape, 'milestones' | 'legalSteps'>
): { steps: { done: number; total: number }; legal: { done: number; total: number } } => {
  const required = workspace.milestones.filter((m) => m.required);
  return {
    steps: {
      done: required.filter((m) => m.status === 'CONFIRMED' || m.status === 'WAIVED').length,
      total: required.length,
    },
    legal: {
      done: workspace.legalSteps.filter(
        (s) => s.status === 'APPROVED' || s.status === 'NOT_APPLICABLE'
      ).length,
      total: workspace.legalSteps.length,
    },
  };
};

export type WorkspaceSection = 'approvals' | 'deposit' | 'steps';

export const nextActionTarget = (
  workspace: Pick<
    WorkspaceShape,
    'viewer' | 'statuses' | 'nextAction' | 'milestones' | 'coApproval' | 'plan'
  >
): WorkspaceSection | null => {
  if (!workspace.nextAction?.waitingForYou) return null;
  const role = workspace.viewer.role;
  if (role === 'SELLER') return 'steps';
  if (
    workspace.coApproval.binding &&
    approvalsWaitingFor(role, workspace.coApproval.pending).length
  )
    return 'approvals';
  if (role === 'BUYER' && workspace.milestones.some((m) => m.status === 'DELIVERED'))
    return 'steps';
  if (canReleaseDeposit(workspace) && !handoverAwaitingDelivery(workspace)) return 'deposit';
  return 'steps';
};

export const coApprovalConfirmDescription = (input: {
  viewer: 'buyer' | 'representative';
  stepLabel: string;
  releasesDeposit?: boolean;
  representativeName?: string | null;
}): string => {
  const step = `"${input.stepLabel}".`;
  if (!input.releasesDeposit) {
    return input.viewer === 'buyer'
      ? `${step} Once ${representativeLabel(input.representativeName)} has approved too, the step is confirmed. Approve only what you have seen yourself.`
      : `${step} Once the buyer has approved too, the step is confirmed. Approve only what you have seen yourself.`;
  }
  return input.viewer === 'buyer'
    ? `${step} This records your approval; nothing is released. Once ${representativeLabel(input.representativeName)} has approved too, press Release the deposit to send it to the seller.`
    : `${step} Your approval does not move any money. Once you have both approved, the buyer releases the deposit to the seller. Approve only what you have seen yourself.`;
};
