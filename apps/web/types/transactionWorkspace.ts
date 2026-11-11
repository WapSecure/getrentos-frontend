import type { LandMilestone } from './landBuyer';
import type { LandPerfectionStep } from './landClosing';
import type { CoApprovalView } from './landRepresentative';

/**
 * Mirrors the backend's `land/dto/transaction-workspace.dto.ts` (DIA-15, DIA-16). One purchase,
 * seen by its buyer, its seller or the buyer's representative. Sureground holds only the deposit
 * under Payment Protection, never the rest of the price (D11).
 */

export const OPERATIONAL_STAGES = [
  'INTERESTED',
  'OFFER_ACCEPTED',
  'RESERVED',
  'DILIGENCE_IN_PROGRESS',
  'FINDINGS_SHARED',
  'CONTRACT_PREPARED',
  'COMPLETING',
  'HANDED_OVER',
  'PAUSED',
  'CANCELLED',
] as const;
export type OperationalStageCode = (typeof OPERATIONAL_STAGES)[number];

export const MONEY_STATUSES = [
  'NOT_DUE',
  'REQUESTED',
  'PROTECTED',
  'RELEASE_REQUESTED',
  'RELEASED',
  'PAID_OUT',
  'REFUNDED',
  'FROZEN',
] as const;
export type MoneyStatusCode = (typeof MONEY_STATUSES)[number];

export const LEGAL_STATUSES = [
  'NOT_STARTED',
  'CONTRACT_SIGNED',
  'CONSENT_APPLIED',
  'CONSENT_GRANTED',
  'REGISTERED',
  'PERFECTED',
] as const;
export type LegalStatusCode = (typeof LEGAL_STATUSES)[number];

export interface OperationalStage {
  code: OperationalStageCode;
  label: string;
}

export interface MoneyStatus {
  code: MoneyStatusCode;
  label: string;
  /** Only the deposit held under Payment Protection is covered. */
  covers: 'DEPOSIT';
  note: string;
}

export interface LegalStatus {
  code: LegalStatusCode;
  label: string;
}

/** Kept separate: a released deposit never reads as legal completion. */
export interface AcquisitionStatuses {
  operationalStage: OperationalStage;
  moneyStatus: MoneyStatus;
  legalStatus: LegalStatus;
}

export interface NextAction {
  label: string;
  waitingForYou: boolean;
}

export interface WorkspaceMilestone extends LandMilestone {
  /** The professional who checked it. */
  verifiedBy?: { name: string; role?: string };
}

export interface WorkspaceCondition {
  key: string;
  label: string;
  status: string;
  deadline?: string;
  remedy: string;
}

export interface WorkspaceLegalCase {
  status: 'OPEN' | 'EXCEPTION' | 'PERFECTED';
  professionalName?: string;
  professionalFirm?: string;
  openedAt: string;
  perfectedAt?: string;
  finalInstrumentReference?: string;
  blockers: string[];
}

/** The seller sees `{ binding }` only. */
export type WorkspaceCoApproval = CoApprovalView;

export interface WorkspaceRepresentative {
  appointmentId: string;
  name?: string;
  relationship: string;
  scopes: string[];
  status: 'INVITED' | 'ACTIVE';
  /** Gives the second approval on this sale. */
  approvesPayments: boolean;
}

export interface WorkspaceProfessional {
  role: 'SURVEYOR' | 'LAWYER' | 'VALUER' | 'INSPECTOR';
  name: string;
  status: 'ACTIVE' | 'COMPLETED';
  completedAt?: string;
}

export interface WorkspaceDocument {
  id: string;
  documentType: string;
  linkedTo: 'MILESTONE' | 'CONDITION' | 'LEGAL_STEP';
  /** The milestone, condition or legal step key. */
  key: string;
  uploadedAt: string;
}

export type WorkspaceActorKind = 'MANAGER' | 'SUREGROUND' | 'TENANT' | 'SYSTEM' | 'OTHER' | 'YOU';

export interface WorkspaceHistoryItem {
  id: string;
  at: string;
  label: string;
  actorKind: WorkspaceActorKind;
  /** Staff always show as "Sureground". */
  actor: string;
  important: boolean;
}

export interface WorkspaceDelays {
  overdueMilestones: number;
  overdueLegalSteps: number;
  /** A step is more than 30 days late. */
  escalated: boolean;
}

export type WorkspaceViewerRole = 'BUYER' | 'SELLER' | 'REPRESENTATIVE';

export interface TransactionWorkspace {
  transactionId: string;
  propertyId: string;
  propertyTitle: string;
  propertyType: string;
  plan: 'LAND_RESALE' | 'BUILT_HOME';
  viewer: { role: WorkspaceViewerRole; scopes?: string[] };
  statuses: AcquisitionStatuses;
  nextAction: NextAction | null;
  milestones: WorkspaceMilestone[];
  conditions: WorkspaceCondition[];
  /** Null, with no legal steps, until staff open title perfection. */
  legalCase: WorkspaceLegalCase | null;
  legalSteps: LandPerfectionStep[];
  coApproval: WorkspaceCoApproval;
  representatives: WorkspaceRepresentative[];
  professionals: WorkspaceProfessional[];
  documents: WorkspaceDocument[];
  delays: WorkspaceDelays;
  history: WorkspaceHistoryItem[];
}

/** The outcome of the buyer's deposit release (`POST buyer/transactions/:id/release`). */
export interface DepositReleaseOutcome {
  state: 'RELEASED' | 'WAITING_FOR_CO_APPROVAL';
  waitingFor?: 'REPRESENTATIVE' | 'BUYER';
  message?: string;
}

/** One purchase on the investor overview, from the same functions as the workspace. */
export interface PurchaseSummary {
  transactionId: string;
  title: string;
  propertyType: string;
  role: 'BUYER' | 'REPRESENTATIVE';
  /** Set when I see this purchase as someone's representative. */
  representing?: { principalId: string; principalName: string };
  operationalStage: OperationalStage;
  moneyStatus: MoneyStatus;
  legalStatus: LegalStatus;
  nextAction: string | null;
  /** Something is waiting for me, including a two-person approval. */
  waitingForYou: boolean;
  /** Two-person approvals waiting for me on this purchase. */
  pendingApprovals: number;
}
