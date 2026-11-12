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

// Pure helpers for the purchase workspace (DIA-15, DIA-16), for web and mobile. Sureground holds
// only the deposit (D11). The workspace shapes are taken structurally, so each app keeps its own
// milestone and legal-step types.

interface WorkspaceShape {
  viewer: { role: WorkspaceViewerRole };
  statuses: { moneyStatus: { code: MoneyStatusCode | string } };
  nextAction: NextAction | null;
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

/** A code the app does not know yet reads as neutral rather than breaking the page. */
export const stageVariant = (code: string): StatusTone =>
  STAGE_VARIANT[code as OperationalStageCode] ?? 'neutral';
export const moneyVariant = (code: string): StatusTone =>
  MONEY_VARIANT[code as MoneyStatusCode] ?? 'neutral';
export const legalVariant = (code: string): StatusTone =>
  LEGAL_VARIANT[code as LegalStatusCode] ?? 'neutral';

/** Only the buyer releases, and only a deposit that is held. */
export const canReleaseDeposit = (
  workspace: Pick<WorkspaceShape, 'viewer' | 'statuses'>
): boolean =>
  workspace.viewer.role === 'BUYER' && workspace.statuses.moneyStatus.code === 'PROTECTED';

/**
 * What the buyer's release did. Under two-person approval the buyer's approval is recorded but
 * nothing moves until the representative approves too.
 */
export const releaseOutcome = (
  release: DepositReleaseOutcome | undefined
): { waiting: boolean; message: string } =>
  release?.state === 'WAITING_FOR_CO_APPROVAL'
    ? {
        waiting: true,
        message:
          release.message ??
          (release.waitingFor === 'BUYER'
            ? 'Your representative’s approval is recorded. The deposit is released once you approve too.'
            : 'Your approval is recorded. The deposit is released once your representative approves too.'),
      }
    : { waiting: false, message: 'Deposit released to the seller.' };

/** What a representative's approval did. It never moves money itself. */
export const approvalOutcomeMessage = (
  outcome: DepositReleaseApprovalOutcome | undefined
): string =>
  outcome === 'WAITING_FOR_BUYER'
    ? 'Your approval is recorded. Nothing moves until the buyer approves too.'
    : 'Your approval is recorded. The buyer can now release the deposit.';

/** Two-person approvals on this purchase still waiting for the viewer. */
export const approvalsWaitingFor = (
  viewer: 'BUYER' | 'REPRESENTATIVE',
  pending: readonly CoApprovalPendingStep[] | undefined
): CoApprovalPendingStep[] =>
  (pending ?? []).filter((step) =>
    viewer === 'BUYER' ? !step.buyerApproved : !step.representativeApproved
  );

/** "TITLE_DEED" → "Title deed". */
export const humaniseCode = (code: string): string => {
  const words = code.toLowerCase().replace(/_/g, ' ').trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
};

/** The step, condition or legal step a document belongs to, by its label where the workspace has it. */
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

/** Required steps confirmed or waived, and legal steps approved or not applicable, for the progress bars. */
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

/**
 * Where the header's call to action takes the viewer when something waits for them: an approval
 * first, then a step to confirm, then the deposit to release. Null when nothing is theirs to do.
 */
export const nextActionTarget = (
  workspace: Pick<
    WorkspaceShape,
    'viewer' | 'statuses' | 'nextAction' | 'milestones' | 'coApproval'
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
  if (canReleaseDeposit(workspace)) return 'deposit';
  return 'steps';
};
