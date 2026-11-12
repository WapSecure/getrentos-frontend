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

// One purchase (built home or land resale) as its buyer or the buyer's representative sees it
// (DIA-15, DIA-16). Mirrors the backend's `land/dto/transaction-workspace.dto.ts` and web's
// transactionWorkspaceService. Sureground holds only the deposit, never the rest of the price (D11).

export interface WorkspaceMilestone extends Milestone {
  /** The professional who checked it. */
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
  /** Gives the second approval on this sale. */
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
  /** Staff always show as "Sureground". */
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
  /** Null, with no legal steps, until staff open title perfection. */
  legalCase: WorkspaceLegalCase | null;
  legalSteps: Perfection['steps'];
  /** The seller sees `{ binding }` only. */
  coApproval: CoApproval;
  representatives: WorkspaceRepresentative[];
  professionals: WorkspaceProfessional[];
  documents: WorkspaceDocument[];
  delays: { overdueMilestones: number; overdueLegalSteps: number; escalated: boolean };
  history: WorkspaceHistoryItem[];
}

/** A signed, short-lived link to one document on the sale. */
export interface WorkspaceDocumentLink {
  id: string;
  documentType: string;
  name: string;
  mimeType: string | null;
  url: string;
  expiresInSeconds: number;
}

export type WorkspaceViewer = Exclude<WorkspaceViewerRole, 'SELLER'>;

// Neutral routes for any sale; they work wherever land is switched off.
const BASE: Record<WorkspaceViewer, string> = {
  BUYER: '/buyer/transactions',
  REPRESENTATIVE: '/representing/transactions',
};

const tx = (role: WorkspaceViewer, txId: string) => `${BASE[role]}/${encodeURIComponent(txId)}`;
const step = (txId: string, key: string) =>
  `/buyer/transactions/${encodeURIComponent(txId)}/milestones/${encodeURIComponent(key)}`;

export const purchaseWorkspaceApi = {
  /** 404 for anyone but the party asked for; a representative needs VIEW (403 otherwise). */
  get: (role: WorkspaceViewer, txId: string) =>
    apiFetch<TransactionWorkspace>(`${tx(role, txId)}/workspace`),

  /** Same access as the workspace. */
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
