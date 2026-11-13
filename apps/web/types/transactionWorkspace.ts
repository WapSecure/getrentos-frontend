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
  type PurchaseDispute,
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
  deposit?: WorkspaceDeposit;
}

/** The deposit held under Payment Protection; paying, releasing and refunding stay on buyer/transactions. */
export interface WorkspaceDeposit {
  amount: number;
  currency: 'NGN';
  escrowStatus: string;
  payable: boolean;
  releasable: boolean;
  /** The buyer can take the deposit back now: held, and the handover has not started. */
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
  /** Files either party uploaded, oldest first, with 15-minute links. Only on the single-dispute read. */
  attachments?: SaleDisputeAttachment[];
  /** Sureground's decision, once resolved. */
  resolution?: string;
  resolvedAt?: string;
  createdAt: string;
  /** When Sureground will respond by (the staff response window); null once under review or decided. */
  respondBy?: string | null;
  respondByParty?: 'SUREGROUND' | null;
}

/** Mirrors the backend's `EvidenceItemDto` for a party's upload. Kept permanently: never changed or removed. */
export interface SaleDisputeAttachment {
  id: string;
  name: string;
  mimeType: string | null;
  url: string;
  sizeBytes?: number | null;
  uploadedBy?: { id: string; legalName: string } | null;
  note?: string | null;
  uploadedAt: string;
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
