import { apiFetch } from './client';
import type { Paginated } from './properties';

export type AgentClientStatus = 'PENDING' | 'ACTIVE' | 'REVOKED';

export interface AgentClientRelationship {
  id: string;
  agentId: string;
  clientId: string;
  status: AgentClientStatus;
  approvedAt?: string | null;
  revokedAt?: string | null;
  createdAt: string;
  client: { id: string; legalName: string; email: string; phone?: string | null };
  properties: {
    property: { id: string; title: string; address: string; city: string; state: string };
  }[];
}

function toQuery(params: Record<string, string | number | undefined>): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === '') continue;
    q.set(k, String(v));
  }
  const s = q.toString();
  return s ? `?${s}` : '';
}

export const agentClientsApi = {
  list: (page = 1, pageSize = 20, status?: AgentClientStatus) =>
    apiFetch<Paginated<AgentClientRelationship>>(
      `/agent/clients${toQuery({ page, pageSize, status })}`
    ),

  invite: (email: string) =>
    apiFetch<AgentClientRelationship>('/agent/clients', { method: 'POST', body: { email } }),
};
