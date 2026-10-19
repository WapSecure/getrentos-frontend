import { authFetch, safeCall, type ApiResponse } from '@/lib/apiHelpers';
import type { ServicingTier } from './mandateService';

export type ManagedIntakeStatus =
  | 'SUBMITTED'
  | 'ASSESSMENT_SCHEDULED'
  | 'ASSESSED'
  | 'PROPOSED'
  | 'ACCEPTED'
  | 'DECLINED'
  | 'WITHDRAWN';

export type ManagedPropertyClass =
  | 'SINGLE_HOME'
  | 'BLOCK_OF_FLATS'
  | 'ESTATE_UNITS'
  | 'MIXED_USE'
  | 'COMMERCIAL';

export const PROPERTY_CLASS_LABEL: Record<ManagedPropertyClass, string> = {
  SINGLE_HOME: 'A single home',
  BLOCK_OF_FLATS: 'A block of flats',
  ESTATE_UNITS: 'Units in an estate',
  MIXED_USE: 'Mixed use (homes and shops)',
  COMMERCIAL: 'Commercial',
};

export interface ManagedProposal {
  tier: ServicingTier;
  tierName: string;
  feePct: number | null;
  lettingCommissionPct: number | null;
  renewalCommissionPct: number | null;
  includes: string[];
  exclusions: string | null;
  note: string | null;
  proposedAt: string | null;
  expiresAt: string | null;
}

/** An owner's request for GetRentos Managed, from first ask to signed mandate. */
export interface ManagedIntake {
  id: string;
  status: ManagedIntakeStatus;
  proposalExpired: boolean;
  propertyId: string;
  propertyTitle: string;
  propertyAddress: string;
  propertyVerified: boolean;
  ownerId: string;
  ownerName: string | null;
  ownerEmail: string | null;
  requestedTier: ServicingTier;
  propertyClass: ManagedPropertyClass;
  unitCount: number;
  occupiedUnits: number;
  annualRentRoll: number | null;
  serviceNeeds: string[];
  ownerNotes: string | null;
  indicativeFeePct: number;
  indicativeMonthlyFee: number | null;
  assessorUserId: string | null;
  assessorName: string | null;
  assessmentScheduledFor: string | null;
  assessedAt: string | null;
  condition: 'GOOD' | 'FAIR' | 'POOR' | null;
  risk: 'LOW' | 'MEDIUM' | 'HIGH' | null;
  findings: string | null;
  eligible: boolean | null;
  recommendedTier: ServicingTier | null;
  proposal: ManagedProposal | null;
  acceptedAt: string | null;
  declinedReason: string | null;
  closedAt: string | null;
  mandateId: string | null;
  mandateStatus: string | null;
  openingPositionNote: string | null;
  openingPositionConfirmedAt: string | null;
  createdAt: string;
}

export interface SubmitIntakeInput {
  propertyId: string;
  requestedTier: ServicingTier;
  propertyClass: ManagedPropertyClass;
  unitCount: number;
  occupiedUnits: number;
  annualRentRoll?: number;
  serviceNeeds?: string[];
  ownerNotes?: string;
}

export const OPEN_INTAKE_STATUSES: ManagedIntakeStatus[] = [
  'SUBMITTED',
  'ASSESSMENT_SCHEDULED',
  'ASSESSED',
  'PROPOSED',
];

export function submitIntake(input: SubmitIntakeInput): Promise<ApiResponse<ManagedIntake>> {
  return safeCall(() =>
    authFetch<ManagedIntake>('/managed/intakes', { method: 'POST', body: JSON.stringify(input) })
  );
}

export function myIntakes(): Promise<ApiResponse<ManagedIntake[]>> {
  return safeCall(() => authFetch<ManagedIntake[]>('/managed/intakes/mine'));
}

export function withdrawIntake(id: string): Promise<ApiResponse<ManagedIntake>> {
  return safeCall(() =>
    authFetch<ManagedIntake>(`/managed/intakes/${id}/withdraw`, { method: 'POST' })
  );
}

export function acceptProposal(id: string): Promise<ApiResponse<ManagedIntake>> {
  return safeCall(() =>
    authFetch<ManagedIntake>(`/managed/intakes/${id}/accept`, {
      method: 'POST',
      body: JSON.stringify({ agree: true }),
    })
  );
}
