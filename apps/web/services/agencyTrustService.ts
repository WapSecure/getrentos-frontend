import { authFetch, safeCall, type ApiResponse } from '@/lib/apiHelpers';
import type { ProtectionAttestation } from './agencyProtectionService';

export interface AgencyTrustEntry {
  id: string;
  entryType: string;
  /** Signed whole naira: positive credits the owner, negative debits them. */
  amount: number;
  balanceAfter: number;
  propertyTitle: string | null;
  sourceType: string;
  note: string | null;
  occurredAt: string;
}

export interface AgencyOwnerTrust {
  ownerId: string;
  ownerName: string | null;
  currency: string;
  /** Whole naira the firm holds for this owner. Null = no account has ever existed. */
  balance: number | null;
  reconciledBalance: number;
  inSync: boolean;
  protection: ProtectionAttestation | null;
  entries: AgencyTrustEntry[];
}

export const AGENCY_TRUST_ENTRY_LABELS: Record<string, string> = {
  RENT_RECEIVED: 'Rent received',
  DUES_RECEIVED: 'Dues received',
  EXPENSE_PAID: 'Expense paid',
  MANAGEMENT_FEE: 'Management fee',
  PAYOUT_TO_OWNER: 'Paid to owner',
  ADJUSTMENT: 'Adjustment',
};

export const agencyTrustService = {
  getOwnerTrust(ownerId: string): Promise<ApiResponse<AgencyOwnerTrust>> {
    return safeCall(() => authFetch<AgencyOwnerTrust>(`/agency/owners/${ownerId}/client-money`));
  },
};
