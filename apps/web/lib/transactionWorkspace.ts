import type { BadgeVariant } from '@sureground/ui';
import type { CoApprovalPendingStep, DepositReleaseApproval } from '@/types/landRepresentative';
import type {
  DepositReleaseOutcome,
  LegalStatusCode,
  MoneyStatusCode,
  OperationalStageCode,
  PurchaseSummary,
  TransactionWorkspace,
  WorkspaceDocument,
} from '@/types/transactionWorkspace';
import { PURCHASE_ROUTES } from './constants/purchaseRoutes';

// Pure helpers for the purchase workspace (DIA-15, DIA-16). Sureground holds only the deposit (D11).

const STAGE_VARIANT: Record<OperationalStageCode, BadgeVariant> = {
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

const MONEY_VARIANT: Record<MoneyStatusCode, BadgeVariant> = {
  NOT_DUE: 'neutral',
  REQUESTED: 'warning',
  PROTECTED: 'info',
  RELEASE_REQUESTED: 'info',
  RELEASED: 'success',
  PAID_OUT: 'success',
  REFUNDED: 'neutral',
  FROZEN: 'danger',
};

const LEGAL_VARIANT: Record<LegalStatusCode, BadgeVariant> = {
  NOT_STARTED: 'neutral',
  CONTRACT_SIGNED: 'info',
  CONSENT_APPLIED: 'info',
  CONSENT_GRANTED: 'info',
  REGISTERED: 'info',
  PERFECTED: 'success',
};

/** A code the app does not know yet reads as neutral rather than breaking the page. */
export const stageVariant = (code: string): BadgeVariant =>
  STAGE_VARIANT[code as OperationalStageCode] ?? 'neutral';
export const moneyVariant = (code: string): BadgeVariant =>
  MONEY_VARIANT[code as MoneyStatusCode] ?? 'neutral';
export const legalVariant = (code: string): BadgeVariant =>
  LEGAL_VARIANT[code as LegalStatusCode] ?? 'neutral';

/** The buyer opens their own workspace; a representative opens the one they see for the buyer. */
export const purchaseWorkspaceHref = (purchase: Pick<PurchaseSummary, 'role' | 'transactionId'>) =>
  purchase.role === 'REPRESENTATIVE'
    ? PURCHASE_ROUTES.representingWorkspace(purchase.transactionId)
    : PURCHASE_ROUTES.buyerWorkspace(purchase.transactionId);

/** Only the buyer releases, and only a deposit that is held. */
export const canReleaseDeposit = (
  workspace: Pick<TransactionWorkspace, 'viewer' | 'statuses'>
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
  outcome: DepositReleaseApproval['outcome'] | undefined
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
  workspace: Pick<TransactionWorkspace, 'milestones' | 'conditions' | 'legalSteps'>
): string => {
  const list =
    document.linkedTo === 'MILESTONE'
      ? workspace.milestones
      : document.linkedTo === 'CONDITION'
        ? workspace.conditions
        : workspace.legalSteps;
  return list.find((item) => item.key === document.key)?.label ?? humaniseCode(document.key);
};
