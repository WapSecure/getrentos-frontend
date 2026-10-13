import { authFetch, safeCall, type ApiResponse } from '@/lib/apiHelpers';

export type AgencyMemberRole =
  | 'OWNER'
  | 'STAFF'
  | 'ACCOUNTANT'
  | 'PORTFOLIO_MANAGER'
  | 'LEASING_AGENT'
  | 'MAINTENANCE_COORDINATOR'
  | 'INSPECTOR';

export type AssignableAgencyRole = Exclude<AgencyMemberRole, 'OWNER'>;

export const ASSIGNABLE_ROLE_OPTIONS: {
  value: AssignableAgencyRole;
  label: string;
  hint: string;
}[] = [
  {
    value: 'PORTFOLIO_MANAGER',
    label: 'Portfolio manager',
    hint: 'Runs client properties day to day',
  },
  { value: 'LEASING_AGENT', label: 'Leasing agent', hint: 'Listings, viewings, applications' },
  {
    value: 'MAINTENANCE_COORDINATOR',
    label: 'Maintenance coordinator',
    hint: 'Repairs and vendors',
  },
  { value: 'INSPECTOR', label: 'Inspector', hint: 'Condition reports' },
  {
    value: 'ACCOUNTANT',
    label: 'Accountant',
    hint: 'Finance only — no access to client properties',
  },
  { value: 'STAFF', label: 'Staff', hint: 'General team member' },
];

export interface AgencyMember {
  userId: string;
  name: string;
  email: string | null;
  role: AgencyMemberRole;
  roleLabel: string;
  joinedAt: string;
  expiresAt: string | null;
  suspendedAt: string | null;
  state: 'ACTIVE' | 'SUSPENDED' | 'EXPIRED';
}

export interface AgencyStaffInvite {
  id: string;
  email: string;
  role: AgencyMemberRole;
  roleLabel: string;
  membershipExpiresAt: string | null;
  expiresAt: string;
  createdAt: string;
  status: 'PENDING' | 'EXPIRED';
}

export interface AgencyInvitePreview {
  firmName: string;
  role: AgencyMemberRole;
  roleLabel: string;
  email: string;
  status: 'PENDING' | 'EXPIRED' | 'ACCEPTED' | 'REVOKED';
  membershipExpiresAt: string | null;
  emailMatches: boolean;
}

const post = <T>(path: string, body?: unknown) =>
  safeCall(() =>
    authFetch<T>(path, {
      method: 'POST',
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    })
  );

export const agencyTeamService = {
  members: (): Promise<ApiResponse<AgencyMember[]>> =>
    safeCall(() => authFetch<AgencyMember[]>('/agency/team/members')),
  invitations: (): Promise<ApiResponse<AgencyStaffInvite[]>> =>
    safeCall(() => authFetch<AgencyStaffInvite[]>('/agency/team/invitations')),
  invite: (input: {
    email: string;
    role: AssignableAgencyRole;
    membershipExpiresAt?: string | null;
  }) => post<AgencyStaffInvite>('/agency/team/invitations', input),
  revoke: (id: string) => post<{ id: string }>(`/agency/team/invitations/${id}/revoke`),
  update: (userId: string, input: { role?: AssignableAgencyRole; expiresAt?: string | null }) =>
    safeCall(() =>
      authFetch<AgencyMember>(`/agency/team/members/${userId}`, {
        method: 'PATCH',
        body: JSON.stringify(input),
      })
    ),
  suspend: (userId: string) => post<AgencyMember>(`/agency/team/members/${userId}/suspend`),
  reinstate: (userId: string) => post<AgencyMember>(`/agency/team/members/${userId}/reinstate`),
  remove: (userId: string) =>
    safeCall(() =>
      authFetch<{ userId: string }>(`/agency/team/members/${userId}`, { method: 'DELETE' })
    ),
  preview: (token: string) => post<AgencyInvitePreview>('/agency/team/join/preview', { token }),
  accept: (token: string) =>
    post<{ organizationId: string; firmName: string }>('/agency/team/join', { token }),
};
