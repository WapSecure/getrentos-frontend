import { authFetch, safeCall, type ApiResponse } from '@/lib/apiHelpers';

export type ProtectionAttestationStatus = 'ACTIVE' | 'EXPIRED' | 'REVOKED';

export interface ProtectionAttestation {
  id: string;
  schemeName: string;
  schemeReference: string | null;
  coverageAmount: number | null;
  segregationConfirmed: boolean;
  effectiveFrom: string;
  effectiveTo: string | null;
  status: ProtectionAttestationStatus;
  attestedByName: string | null;
  note: string | null;
  createdAt: string;
}

export interface CreateProtectionAttestationInput {
  schemeName: string;
  schemeReference?: string;
  coverageAmount?: number;
  segregationConfirmed?: boolean;
  effectiveFrom: string;
  effectiveTo?: string;
  note?: string;
}

export const agencyProtectionService = {
  list(): Promise<ApiResponse<ProtectionAttestation[]>> {
    return safeCall(() => authFetch<ProtectionAttestation[]>('/agency/protection'));
  },

  create(input: CreateProtectionAttestationInput): Promise<ApiResponse<ProtectionAttestation>> {
    return safeCall(() =>
      authFetch<ProtectionAttestation>('/agency/protection', {
        method: 'POST',
        body: JSON.stringify(input),
      })
    );
  },

  revoke(id: string): Promise<ApiResponse<ProtectionAttestation>> {
    return safeCall(() =>
      authFetch<ProtectionAttestation>(`/agency/protection/${id}/revoke`, { method: 'POST' })
    );
  },
};
