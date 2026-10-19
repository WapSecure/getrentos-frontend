import { authFetch, safeCall, type ApiResponse } from '@/lib/apiHelpers';

export type QueryCategory = 'STATEMENT' | 'RENT' | 'MAINTENANCE' | 'TENANT' | 'LEGAL' | 'GENERAL';
export type QueryStatus = 'OPEN' | 'ANSWERED' | 'RESOLVED';

export const CATEGORY_LABEL: Record<QueryCategory, string> = {
  STATEMENT: 'Statement',
  RENT: 'Rent',
  MAINTENANCE: 'Maintenance',
  TENANT: 'Tenant',
  LEGAL: 'Legal',
  GENERAL: 'General',
};

export interface QuerySummary {
  id: string;
  subject: string;
  category: QueryCategory;
  status: QueryStatus;
  propertyId: string;
  propertyTitle: string;
  ownerName: string | null;
  manager: string;
  viewerSide: 'OWNER' | 'MANAGER';
  lastActivityAt: string;
  lastMessage: { side: 'OWNER' | 'MANAGER'; preview: string } | null;
  messageCount: number;
  createdAt: string;
  firstResponseDueAt: string;
  firstResponseAt: string | null;
  answeredInHours: number | null;
  late: boolean;
}

export interface QueryThread extends QuerySummary {
  resolvedAt: string | null;
  messages: {
    id: string;
    side: 'OWNER' | 'MANAGER';
    author: string;
    onBehalfOf: string | null;
    body: string;
    at: string;
  }[];
}

const post = <T>(path: string, body?: unknown): Promise<ApiResponse<T>> =>
  safeCall(() =>
    authFetch<T>(path, { method: 'POST', ...(body ? { body: JSON.stringify(body) } : {}) })
  );

export const ownerQueryService = {
  list(as: 'owner' | 'manager') {
    return safeCall(() => authFetch<QuerySummary[]>(`/owner-queries?as=${as}`));
  },
  get(id: string) {
    return safeCall(() => authFetch<QueryThread>(`/owner-queries/${id}`));
  },
  ask(input: { propertyId: string; category: QueryCategory; subject: string; body: string }) {
    return post<QueryThread>('/owner-queries', input);
  },
  reply(id: string, body: string) {
    return post<QueryThread>(`/owner-queries/${id}/messages`, { body });
  },
  resolve(id: string) {
    return post<QueryThread>(`/owner-queries/${id}/resolve`);
  },
  reopen(id: string) {
    return post<QueryThread>(`/owner-queries/${id}/reopen`);
  },
};
