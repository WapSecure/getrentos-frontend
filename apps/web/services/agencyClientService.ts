import { authFetch, safeCall, type ApiResponse } from '@/lib/apiHelpers';

export const AGENCY_CLIENT_STAGES = ['LEAD', 'ONBOARDING', 'ACTIVE', 'DORMANT'] as const;
export type AgencyClientStage = (typeof AGENCY_CLIENT_STAGES)[number];

export const AGENCY_CLIENT_STAGE_LABELS: Record<AgencyClientStage, string> = {
  LEAD: 'Lead',
  ONBOARDING: 'Onboarding',
  ACTIVE: 'Active',
  DORMANT: 'Dormant',
};

export interface AgencyClientNote {
  id: string;
  content: string;
  authorName: string | null;
  createdAt: string;
}

export interface AgencyClientProperty {
  propertyId: string;
  title: string | null;
  mandateStatus: string;
}

export interface AgencyClient {
  ownerId: string;
  ownerName: string | null;
  email: string | null;
  phone: string | null;
  companyName: string | null;
  verificationStatus: string;
  trustScore: number | null;
  stage: AgencyClientStage;
  properties: AgencyClientProperty[];
  notes: AgencyClientNote[];
}

export const agencyClientService = {
  get(ownerId: string): Promise<ApiResponse<AgencyClient>> {
    return safeCall(() => authFetch<AgencyClient>(`/agency/clients/${ownerId}`));
  },

  setStage(ownerId: string, stage: AgencyClientStage): Promise<ApiResponse<AgencyClient>> {
    return safeCall(() =>
      authFetch<AgencyClient>(`/agency/clients/${ownerId}/stage`, {
        method: 'PUT',
        body: JSON.stringify({ stage }),
      })
    );
  },

  addNote(ownerId: string, content: string): Promise<ApiResponse<AgencyClient>> {
    return safeCall(() =>
      authFetch<AgencyClient>(`/agency/clients/${ownerId}/notes`, {
        method: 'POST',
        body: JSON.stringify({ content }),
      })
    );
  },
};
