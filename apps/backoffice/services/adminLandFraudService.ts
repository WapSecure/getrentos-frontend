import { authFetch, safeCall } from '@getrentos/shared';
import type { ApiResponse } from '@getrentos/shared';

export type LandFraudSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type LandFraudSignalStatus = 'OPEN' | 'CLEARED' | 'CONFIRMED';
export type LandFraudSignalCode =
  | 'DOCUMENT_REUSED'
  | 'SHARED_PAYOUT_ACCOUNT'
  | 'PAYOUT_ACCOUNT_CHANGED';
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
};

export const severityTone = (s: LandFraudSeverity) =>
  s === 'CRITICAL' || s === 'HIGH' ? 'danger' : s === 'MEDIUM' ? 'warning' : 'neutral';
export const bandTone = (b: LandFraudBand) =>
  b === 'HIGH' ? 'danger' : b === 'ELEVATED' ? 'warning' : 'success';
