import type {
  AcquisitionStatuses,
  NextAction,
  WorkspaceDocument,
  WorkspaceViewerRole,
} from '@sureground/shared';
import type { LandMilestone } from './landBuyer';
import type { LandPerfectionStep } from './landClosing';
import type { CoApprovalView } from './landRepresentative';

/**
 * Mirrors the backend's `land/dto/transaction-workspace.dto.ts` (DIA-15, DIA-16). One purchase,
 * seen by its buyer, its seller or the buyer's representative. Sureground holds only the deposit
 * under Payment Protection, never the rest of the price (D11).
 */

export {
  LEGAL_STATUSES,
  MONEY_STATUSES,
  OPERATIONAL_STAGES,
  type AcquisitionStatuses,
  type DepositReleaseOutcome,
  type LegalStatus,
  type LegalStatusCode,
  type MoneyStatus,
  type MoneyStatusCode,
  type NextAction,
  type OperationalStage,
  type OperationalStageCode,
  type PurchaseSummary,
  type WorkspaceDocument,
  type WorkspaceViewerRole,
} from '@sureground/shared';
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

export type WorkspaceActorKind =
  | 'MANAGER'
  | 'SUREGROUND'
  | 'TENANT'
  | 'SYSTEM'
  | 'OTHER'
  | 'YOU'
  | 'BUYER'
  | 'SELLER'
  | 'REPRESENTATIVE';

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

/** Mirrors `MarketplaceDisputeDto`: a dispute on a sale's held deposit, from `GET /marketplace/disputes`. */
export interface SaleDispute {
  id: string;
  transactionId: string;
  propertyTitle?: string;
  title: string;
  category: string;
  status: 'OPEN' | 'UNDER_REVIEW' | 'ESCALATED' | 'RESOLVED';
  raisedBy: { id: string; legalName: string };
  against: { id: string; legalName: string };
  createdAt: string;
}
