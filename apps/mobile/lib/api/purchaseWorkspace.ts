import type {
  AcquisitionStatuses,
  NextAction,
  WorkspaceDocument,
  WorkspaceViewerRole,
} from '@sureground/shared';
import { apiFetch } from './client';
import type { CoApproval } from './landBuyerExtras';
import type { Milestone, Perfection } from './landSales';
import type { BuyerTransaction } from './buyerTransactions';
import { withStepUpSummary } from '../stepUp';

// Mirrors the backend's `land/dto/transaction-workspace.dto.ts`.

export interface WorkspaceMilestone extends Milestone {
  verifiedBy?: { name: string; role?: string };
}

export interface WorkspaceCondition {
  key: string;
  label: string;
  status: string;
  deadline?: string | null;
  remedy: string;
}

export interface WorkspaceLegalCase {
  status: 'OPEN' | 'EXCEPTION' | 'PERFECTED';
  professionalName?: string | null;
  professionalFirm?: string | null;
  openedAt: string;
  perfectedAt?: string | null;
  finalInstrumentReference?: string | null;
  blockers: string[];
}

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

export interface WorkspaceHistoryItem {
  id: string;
  at: string;
  label: string;
  actorKind:
    | 'MANAGER'
    | 'SUREGROUND'
    | 'TENANT'
    | 'SYSTEM'
    | 'OTHER'
    | 'YOU'
    | 'BUYER'
    | 'SELLER'
    | 'REPRESENTATIVE';
  actor: string;
  important: boolean;
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
  legalSteps: Perfection['steps'];
  coApproval: CoApproval;
  representatives: WorkspaceRepresentative[];
  professionals: WorkspaceProfessional[];
  documents: WorkspaceDocument[];
  delays: { overdueMilestones: number; overdueLegalSteps: number; escalated: boolean };
  history: WorkspaceHistoryItem[];
}

export interface WorkspaceDocumentLink {
  id: string;
  documentType: string;
  name: string;
  mimeType: string | null;
  url: string;
  expiresInSeconds: number;
}

export type WorkspaceViewer = Exclude<WorkspaceViewerRole, 'SELLER'>;

const BASE: Record<WorkspaceViewer, string> = {
  BUYER: '/buyer/transactions',
  REPRESENTATIVE: '/representing/transactions',
};

const tx = (role: WorkspaceViewer, txId: string) => `${BASE[role]}/${encodeURIComponent(txId)}`;
const step = (txId: string, key: string) =>
  `/buyer/transactions/${encodeURIComponent(txId)}/milestones/${encodeURIComponent(key)}`;

export const purchaseWorkspaceApi = {
  get: (role: WorkspaceViewer, txId: string) =>
    apiFetch<TransactionWorkspace>(`${tx(role, txId)}/workspace`),

  document: (role: WorkspaceViewer, txId: string, documentId: string) =>
    apiFetch<WorkspaceDocumentLink>(
      `${tx(role, txId)}/documents/${encodeURIComponent(documentId)}`
    ),

  /** Re-authenticates: a built home's handover also stands for the deposit release. */
  confirmMilestone: (txId: string, key: string, label: string) =>
    withStepUpSummary(`Confirm “${label}” on this purchase`, () =>
      apiFetch<Milestone>(`${step(txId, key)}/confirm`, { method: 'POST' })
    ),

  disputeMilestone: (txId: string, key: string, reason: string) =>
    apiFetch<Milestone>(`${step(txId, key)}/dispute`, {
      method: 'POST',
      body: { reason: reason.trim() },
    }),

  /** Under two-person approval this records the buyer's approval; they release again once both are in. */
  releaseDeposit: (txId: string, title: string) =>
    withStepUpSummary(`Release the deposit for ${title}`, () =>
      apiFetch<BuyerTransaction>(`/buyer/transactions/${encodeURIComponent(txId)}/release`, {
        method: 'POST',
      })
    ),
};
