import { authFetch, safeCall } from '@getrentos/shared';
import type { ApiResponse } from '@getrentos/shared';

export type LandFraudSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type LandFraudSignalStatus = 'OPEN' | 'CLEARED' | 'CONFIRMED';
export type LandFraudSignalCode =
  | 'DOCUMENT_REUSED'
  | 'SHARED_PAYOUT_ACCOUNT'
  | 'PAYOUT_ACCOUNT_CHANGED'
  | 'REPRESENTATIVE_LINKED'
  | 'CONFLICTING_CLAIM';
export type LandFraudBand = 'LOW' | 'ELEVATED' | 'HIGH';

export interface LandFraudSignal {
  id: string;
  code: LandFraudSignalCode;
  severity: LandFraudSeverity;
  status: LandFraudSignalStatus;
  detail: Record<string, unknown>;
  fraudAlertId: string | null;
  firstSeenAt: string;
  lastSeenAt: string;
  resolvedAt: string | null;
  resolvedBy: string | null;
  resolutionNote: string | null;
}

interface LandFraudBase {
  propertyId: string;
  landParcelId: string;
  title: string;
  city: string;
  state: string;
  seller: { id: string; name: string };
  score: number;
  band: LandFraudBand;
  contributions: { source: string; points: number }[];
  blocking: boolean;
}

export interface LandFraudAssessment extends LandFraudBase {
  signals: LandFraudSignal[];
}

export interface LandFraudQueueRow extends LandFraudBase {
  openSignals: number;
  confirmedSignals: number;
}

const base = '/admin/land/fraud';

/** Land fraud signals for staff (`fraud.review`). */
export const adminLandFraudService = {
  queue: (): Promise<ApiResponse<LandFraudQueueRow[]>> => safeCall(() => authFetch(base)),
  assessment: (propertyId: string): Promise<ApiResponse<LandFraudAssessment>> =>
    safeCall(() => authFetch(`${base}/parcels/${encodeURIComponent(propertyId)}`)),
  rescan: (propertyId: string): Promise<ApiResponse<LandFraudAssessment>> =>
    safeCall(() =>
      authFetch(`${base}/parcels/${encodeURIComponent(propertyId)}/rescan`, {
        method: 'POST',
        body: '{}',
      })
    ),
  decide: (
    signalId: string,
    outcome: 'CLEARED' | 'CONFIRMED',
    note: string
  ): Promise<ApiResponse<LandFraudAssessment>> =>
    safeCall(() =>
      authFetch(`${base}/signals/${encodeURIComponent(signalId)}/decide`, {
        method: 'POST',
        body: JSON.stringify({ outcome, note }),
      })
    ),
};

export const LAND_FRAUD_SIGNAL_LABELS: Record<LandFraudSignalCode, string> = {
  DOCUMENT_REUSED: 'Document reused from another property',
  SHARED_PAYOUT_ACCOUNT: 'Payout account shared with another seller',
  PAYOUT_ACCOUNT_CHANGED: 'Bank details changed with land payouts waiting',
  REPRESENTATIVE_LINKED: 'Buyer’s representative tied to the seller',
  CONFLICTING_CLAIM: 'Another seller’s parcel claims the same ground',
};

/** What a REPRESENTATIVE_LINKED signal found, as one sentence. */
export function representativeLinkText(detail: Record<string, unknown>): string {
  const name = String(detail.representativeName ?? 'The representative');
  const buyers = Array.isArray(detail.buyers) ? detail.buyers.join(', ') : 'the buyer';
  const role =
    detail.role === 'CO_APPROVER'
      ? `gives the second approval on payments for ${buyers}`
      : `is attending a site tour for ${buyers}`;
  const link = (() => {
    switch (detail.link) {
      case 'SHARED_PAYOUT_ACCOUNT':
        return `is paid into the seller’s own bank account (${String(detail.bankName ?? 'bank')} ••${String(detail.accountLast4)})`;
      case 'APPOINTED_BY_SELLER':
        return 'is also the seller’s own land representative';
      case 'ACTS_FOR_SELLER':
        return `holds authority to act for the seller on ${String(detail.otherPropertyTitle ?? 'another property')}`;
      case 'SAME_ORGANISATION':
        return `is in the seller’s organisation, ${String(detail.organisationName)}`;
      case 'REPRESENTS_SELLERS_BUYERS':
        return `has approved payments for ${String(detail.buyersServed)} different buyers of this seller`;
      default:
        return 'is linked to the seller';
    }
  })();
  return `${name} ${role}, and ${link}.`;
}

export const severityTone = (s: LandFraudSeverity) =>
  s === 'CRITICAL' || s === 'HIGH' ? 'danger' : s === 'MEDIUM' ? 'warning' : 'neutral';
export const bandTone = (b: LandFraudBand) =>
  b === 'HIGH' ? 'danger' : b === 'ELEVATED' ? 'warning' : 'success';
