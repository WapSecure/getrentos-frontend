import { apiFetch } from './client';

export type EstateAgreementStatus = 'PENDING' | 'ACTIVE' | 'DECLINED' | 'REVOKED';

export interface EstateAgreement {
  id: string;
  estateName: string;
  propertyTitle: string;
  propertyAddress: string;
  status: EstateAgreementStatus;
  requestedByEmail?: string | null;
  note?: string | null;
  estateListingCount: number;
  createdAt: string;
}

/** The API refuses a decline or withdrawal reason shorter than this. */
export const MIN_REASON = 10;

export const estateAgreementsApi = {
  mine: () => apiFetch<EstateAgreement[]>('/estate-agreements/mine'),
  approve: (id: string) =>
    apiFetch<EstateAgreement>(`/estate-agreements/${id}/approve`, { method: 'POST', body: {} }),
  decline: (id: string, reason: string) =>
    apiFetch<EstateAgreement>(`/estate-agreements/${id}/decline`, {
      method: 'POST',
      body: { reason },
    }),
  revoke: (id: string, reason: string) =>
    apiFetch<EstateAgreement>(`/estate-agreements/${id}/revoke`, {
      method: 'POST',
      body: { reason },
    }),
};
