import type {
  AcquisitionStatuses,
  NextAction,
  WorkspaceDocument,
  WorkspaceViewerRole,
} from '@sureground/shared';
import type { LandMilestone } from './landBuyer';
import type { LandPerfectionStep } from './landClosing';
import type { CoApprovalView } from './landRepresentative';

/** Mirrors the backend's `land/dto/transaction-workspace.dto.ts`; Sureground holds only the deposit, never the price. */

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
  type PurchaseDispute,
  type PurchaseSummary,
  type WorkspaceDocument,
  type WorkspaceViewerRole,
} from '@sureground/shared';
export interface WorkspaceMilestone extends LandMilestone {
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

export type WorkspaceCoApproval = CoApprovalView;

export interface WorkspaceRepresentative {
  appointmentId: string;
  name?: string;
  relationship: string;
  scopes: string[];
  status: 'INVITED' | 'ACTIVE';
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
  actor: string;
  important: boolean;
}

export interface WorkspaceDelays {
  overdueMilestones: number;
  overdueLegalSteps: number;
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
  legalCase: WorkspaceLegalCase | null;
  legalSteps: LandPerfectionStep[];
  coApproval: WorkspaceCoApproval;
  representatives: WorkspaceRepresentative[];
  professionals: WorkspaceProfessional[];
  documents: WorkspaceDocument[];
  delays: WorkspaceDelays;
  history: WorkspaceHistoryItem[];
  deposit?: WorkspaceDeposit;
}

export interface WorkspaceDeposit {
  amount: number;
  currency: 'NGN';
  escrowStatus: string;
  payable: boolean;
  releasable: boolean;
  refundable?: boolean;
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
  description?: string;
  /** Older disputes only: links typed in by a party. Untrusted, never previewed. */
  evidence?: string[];
  resolution?: string;
  resolvedAt?: string;
  createdAt: string;
  respondBy?: string | null;
  respondByParty?: 'SUREGROUND' | null;
}

/** Mirrors `MarketplaceDisputeMessageDto`: one message in a deposit dispute's thread. */
export interface SaleDisputeMessage {
  id: string;
  disputeId: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: string;
}
