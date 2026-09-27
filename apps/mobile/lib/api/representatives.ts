import { apiFetch } from './client';
import type { Paginated } from './properties';

/**
 * A property client's side of working with professionals: approve a realtor
 * or agent who asked to represent you, choose exactly which properties they
 * may touch, revoke them, and (agents) hand them a field task. Owners and
 * landlords share it.
 */
export type RepKind = 'realtor' | 'agent';
export type RepStatus = 'PENDING' | 'ACTIVE' | 'REVOKED';

export interface Representative {
  id: string;
  status: RepStatus;
  person: { id: string; name: string; email?: string; company?: string | null };
}

export interface AssignableProperty {
  id: string;
  title: string;
  city: string;
  state: string;
}

interface RealtorInvitationApi {
  id: string;
  status: RepStatus;
  realtor: { id: string; legalName: string | null; email: string; companyName: string | null };
}

interface AgentAssignmentApi {
  id: string;
  status: string;
  agent?: { id: string; legalName: string; email: string; companyName?: string | null };
}

export const AGENT_TASK_TYPES = [
  { value: 'INSPECTION', label: 'Inspection' },
  { value: 'VERIFICATION', label: 'Verification' },
  { value: 'VALUATION', label: 'Valuation' },
  { value: 'DOCUMENT_PICKUP', label: 'Document pickup' },
] as const;
export type AgentTaskType = (typeof AGENT_TASK_TYPES)[number]['value'];
export type AgentTaskPriority = 'LOW' | 'MEDIUM' | 'HIGH';

const q = (page: number, pageSize: number, search?: string) =>
  `?page=${page}&pageSize=${pageSize}${search ? `&search=${encodeURIComponent(search)}` : ''}`;

export const representativesApi = {
  list: async (kind: RepKind, page = 1, pageSize = 50): Promise<Paginated<Representative>> => {
    if (kind === 'realtor') {
      const res = await apiFetch<Paginated<RealtorInvitationApi>>(
        `/realtor/clients/invitations${q(page, pageSize)}`
      );
      return {
        ...res,
        items: res.items.map((r) => ({
          id: r.id,
          status: r.status,
          person: {
            id: r.realtor.id,
            name: r.realtor.legalName || r.realtor.email,
            email: r.realtor.email,
            company: r.realtor.companyName,
          },
        })),
      };
    }
    const res = await apiFetch<Paginated<AgentAssignmentApi>>(
      `/agent/clients/invitations${q(page, pageSize)}`
    );
    return {
      ...res,
      items: res.items.map((a) => ({
        id: a.id,
        status: a.status.toUpperCase() as RepStatus,
        person: {
          id: a.agent?.id ?? '',
          name: a.agent?.legalName || a.agent?.email || 'Agent',
          email: a.agent?.email,
          company: a.agent?.companyName,
        },
      })),
    };
  },
  approve: (kind: RepKind, id: string) =>
    apiFetch<void>(`/${kind}/clients/${id}/approve`, { method: 'PATCH' }),
  revoke: (kind: RepKind, id: string) =>
    apiFetch<void>(`/${kind}/clients/${id}/revoke`, { method: 'POST' }),
  assignable: (kind: RepKind, id: string, search?: string) =>
    apiFetch<Paginated<AssignableProperty>>(`/${kind}/clients/${id}/properties${q(1, 50, search)}`),
  assign: (kind: RepKind, id: string, propertyId: string) =>
    apiFetch<void>(`/${kind}/clients/${id}/properties`, { method: 'POST', body: { propertyId } }),
  createAgentTask: (input: {
    agentId: string;
    propertyId: string;
    title: string;
    type: AgentTaskType;
    priority: AgentTaskPriority;
    dueAt: string;
  }) => apiFetch<void>('/agent/tasks', { method: 'POST', body: input }),
};
